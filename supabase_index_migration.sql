-- ====================================================================
-- ASOneDealer Mass-Scale DB Optimization Migration Script
-- Target Schema: Supabase / PostgreSQL
-- Goal: Introduce composite multi-column indexing on the 'public.vehicles' table 
--        to handle complex filters (brand, city, vehicle_type, price, status) 
--        efficiently near O(log N) complexity at 1M+ rows scale.
-- ====================================================================

BEGIN;

-- 1. Personalized Multi-Filter Composite Index
-- Optimizes the main search widget execution: SELECT ... WHERE status = 'active' AND vehicle_type = X AND brand = Y AND city = Z ORDER BY price
CREATE INDEX IF NOT EXISTS idx_vehicles_search_composite_heavy
ON public.vehicles (status, vehicle_type, brand, city, price);

-- 2. Budget and Location Composite Index
-- Speeds up "By Budget in City" searches, which are highly frequent in the UI.
-- Filter: WHERE city = X AND price BETWEEN MIN AND MAX AND status = 'active'
CREATE INDEX IF NOT EXISTS idx_vehicles_city_price_status_heavy
ON public.vehicles (city, price, status);

-- 3. Brand, Model & Status Composite Index
-- Accelerates "Browse by Brand & Model" filters, bypassing whole table scans.
-- Filter: WHERE brand = X AND model = Y AND status = 'active'
CREATE INDEX IF NOT EXISTS idx_vehicles_brand_model_status_heavy
ON public.vehicles (brand, model, status);

-- 4. Featured & Hot Deals Sorting Index
-- Speeds up car feed/carousel feeds that fetch featured vehicles with highest priority scores first.
-- Filter & Sort: WHERE status = 'active' AND is_featured = true ORDER BY priority_score DESC, created_at DESC
CREATE INDEX IF NOT EXISTS idx_vehicles_featured_priority_heavy
ON public.vehicles (status, is_featured, priority_score DESC, created_at DESC);

-- 5. Full Table Heatmap Stats Index
-- Speeds up counts, metrics, and dashboards tracking live inventory stats.
-- Filter: GROUP BY status, vehicle_type
CREATE INDEX IF NOT EXISTS idx_vehicles_listing_stats_heavy
ON public.vehicles (status, vehicle_type);

COMMIT;

-- Inform PgREST or Supabase PostgREST server to instantly build and map new indexes
NOTIFY pgrst, 'reload schema';
