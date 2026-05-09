-- Users profile table
create table public.profiles (
  id text primary key,
  full_name text,
  phone text,
  role text check (role in ('buyer', 'seller', 'dealer', 'admin')) default 'buyer',
  latitude numeric,
  longitude numeric,
  city_name text,
  address text,
  is_profile_complete boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Shops/Dealers table
create table public.shops (
  id text default gen_random_uuid()::text primary key,
  owner_id text not null,
  name text not null,
  description text,
  address text,
  city text,
  state text,
  pincode text,
  phone text,
  images text[] default '{}',
  logo text,
  banner_image text,
  website text,
  business_hours text,
  map_embed_url text,
  verification_status text check (verification_status in ('pending', 'verified', 'rejected')) default 'pending',
  rating numeric default 0,
  reviews_count integer default 0,
  is_premium boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Vehicles table
create table public.vehicles (
  id text default gen_random_uuid()::text primary key,
  seller_id text not null,
  shop_id text references public.shops,
  title text not null,
  description text,
  price numeric not null,
  brand text,
  model text,
  year integer,
  vehicle_type text,
  fuel_type text,
  transmission text,
  kilometers_driven integer,
  ownership text,
  registration_number text,
  mileage text,
  color text,
  assembly_type text,
  vin text,
  engine_start_video text,
  engine_sound_video text,
  walkaround_video text,
  city text,
  state text,
  images text[] default '{}',
  status text check (status in ('active', 'sold', 'pending', 'inactive')) default 'active',
  verification_status text check (verification_status in ('pending', 'verified', 'rejected')) default 'pending',
  payment_status text check (payment_status in ('none', 'pending', 'paid', 'failed')) default 'none',
  listing_type text check (listing_type in ('free', 'premium', 'featured', 'sponsored')) default 'free',
  is_featured boolean default false,
  priority_score integer default 0,
  clicks_count integer default 0,
  leads_count integer default 0,
  views_count integer default 0,
  rating numeric default 0,
  reviews_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Reviews table
create table public.reviews (
  id text default gen_random_uuid()::text primary key,
  user_id text not null,
  target_id text not null, -- Can be a vehicle_id or shop_id
  target_type text check (target_type in ('vehicle', 'shop')) not null,
  rating integer check (rating >= 1 and rating <= 5) not null,
  comment text,
  images text[] default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- OTPs table for auth fallback
create table public.otps (
  id text default gen_random_uuid()::text primary key,
  email text unique not null,
  code text not null,
  expires_at timestamp with time zone not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Wishlist table
create table public.wishlists (
  id text default gen_random_uuid()::text primary key,
  user_id text not null,
  vehicle_id text references public.vehicles on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, vehicle_id)
);

-- Payments table
create table public.payments (
  id text default gen_random_uuid()::text primary key,
  user_id text not null,
  vehicle_id text references public.vehicles on delete cascade not null,
  amount numeric not null,
  payment_method text check (payment_method in ('bank_transfer', 'qr_code', 'stripe')) not null,
  transaction_ref text,
  status text check (status in ('pending', 'completed', 'failed')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Saved Searches table
create table public.saved_searches (
  id text default gen_random_uuid()::text primary key,
  user_id text not null,
  name text not null,
  filters jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Storage Buckets Configuration
-- Note: These might need to be created via the Supabase Dashboard if the database owner doesn't have permissions for storage schema
insert into storage.buckets (id, name, public) 
values ('shops', 'shops', true), ('vehicles', 'vehicles', true), ('reviews', 'reviews', true)
on conflict (id) do nothing;

create policy "Public Access" on storage.objects for select using ( bucket_id in ('shops', 'vehicles', 'reviews') );
create policy "Authenticated Upload" on storage.objects for insert with check ( bucket_id in ('shops', 'vehicles', 'reviews') and auth.role() = 'authenticated' );

-- RLS Policies
alter table public.profiles enable row level security;
alter table public.shops enable row level security;
alter table public.vehicles enable row level security;
alter table public.wishlists enable row level security;
alter table public.reviews enable row level security;
alter table public.payments enable row level security;

-- Public read access
create policy "Public vehicles access" on public.vehicles for select using (true);
create policy "Public shops access" on public.shops for select using (true);
create policy "Public reviews access" on public.reviews for select using (true);

-- Auth user access for reviews
create policy "Users can manage own reviews" on public.reviews
  for all using (auth.uid()::text = user_id);

-- Vehicles policies
create policy "Users can insert own vehicles" on public.vehicles
  for insert with check (true); 

create policy "Users can update own vehicles" on public.vehicles
  for update using (auth.uid()::text = seller_id);

-- Shops policies
create policy "Users can insert own shops" on public.shops
  for insert with check (true);

create policy "Users can update own shops" on public.shops
  for update using (auth.uid()::text = owner_id);

-- Payments policies
create policy "Users can insert own payments" on public.payments for insert with check (true);
create policy "Users can view own payments" on public.payments for select using (auth.uid()::text = user_id or exists (select 1 from public.profiles where id = auth.uid()::text and role = 'admin'));
create policy "Admins can update payments" on public.payments for update using (exists (select 1 from public.profiles where id = auth.uid()::text and role = 'admin'));


-- Profile policies
create policy "Users can view own profile" on public.profiles for select using (auth.uid()::text = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid()::text = id);

-- Handle migrations for existing tables
DO $$ 
BEGIN 
    -- Vehicles migrations
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vehicles' AND column_name='assembly_type') THEN
        ALTER TABLE public.vehicles ADD COLUMN assembly_type text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vehicles' AND column_name='vin') THEN
        ALTER TABLE public.vehicles ADD COLUMN vin text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vehicles' AND column_name='ownership') THEN
        ALTER TABLE public.vehicles ADD COLUMN ownership text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vehicles' AND column_name='image_metadata') THEN
        ALTER TABLE public.vehicles ADD COLUMN image_metadata jsonb DEFAULT '{}'::jsonb;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vehicles' AND column_name='payment_status') THEN
        ALTER TABLE public.vehicles ADD COLUMN payment_status text DEFAULT 'none';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vehicles' AND column_name='listing_type') THEN
        ALTER TABLE public.vehicles ADD COLUMN listing_type text DEFAULT 'free';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vehicles' AND column_name='priority_score') THEN
        ALTER TABLE public.vehicles ADD COLUMN priority_score integer DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vehicles' AND column_name='registration_number') THEN
        ALTER TABLE public.vehicles ADD COLUMN registration_number text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vehicles' AND column_name='mileage') THEN
        ALTER TABLE public.vehicles ADD COLUMN mileage text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vehicles' AND column_name='color') THEN
        ALTER TABLE public.vehicles ADD COLUMN color text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vehicles' AND column_name='engine_start_video') THEN
        ALTER TABLE public.vehicles ADD COLUMN engine_start_video text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vehicles' AND column_name='engine_sound_video') THEN
        ALTER TABLE public.vehicles ADD COLUMN engine_sound_video text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vehicles' AND column_name='walkaround_video') THEN
        ALTER TABLE public.vehicles ADD COLUMN walkaround_video text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vehicles' AND column_name='verification_status') THEN
        ALTER TABLE public.vehicles ADD COLUMN verification_status text DEFAULT 'pending';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vehicles' AND column_name='is_featured') THEN
        ALTER TABLE public.vehicles ADD COLUMN is_featured boolean DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vehicles' AND column_name='clicks_count') THEN
        ALTER TABLE public.vehicles ADD COLUMN clicks_count integer DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vehicles' AND column_name='leads_count') THEN
        ALTER TABLE public.vehicles ADD COLUMN leads_count integer DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vehicles' AND column_name='views_count') THEN
        ALTER TABLE public.vehicles ADD COLUMN views_count integer DEFAULT 0;
    END IF;

    -- Shops migrations
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='shops' AND column_name='logo') THEN
        ALTER TABLE public.shops ADD COLUMN logo text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='shops' AND column_name='banner_image') THEN
        ALTER TABLE public.shops ADD COLUMN banner_image text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='shops' AND column_name='website') THEN
        ALTER TABLE public.shops ADD COLUMN website text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='shops' AND column_name='business_hours') THEN
        ALTER TABLE public.shops ADD COLUMN business_hours text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='shops' AND column_name='pincode') THEN
        ALTER TABLE public.shops ADD COLUMN pincode text;
    END IF;
END $$;

-- Critical Indexes for Optimization
CREATE INDEX IF NOT EXISTS idx_vehicles_status_city ON public.vehicles(status, city);
CREATE INDEX IF NOT EXISTS idx_vehicles_seller_priority ON public.vehicles(seller_id, priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_shops_verification ON public.shops(verification_status, rating DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
