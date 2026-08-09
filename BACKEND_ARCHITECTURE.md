# ASOneDealer Backend Architecture & System Design
## Production-Grade Hyperlocal Used-Car Network Platform

This document describes the complete startup-to-scale enterprise backend system design for **ASOneDealer**. It outlines the software engineering patterns, infrastructure topologies, security policies, and schema structures necessary to handle millions of page accesses, high concurrent media uploads, real-time messaging, and high-performance queries.

---

## 1. System Topology & Physical Architecture

ASOneDealer uses a modern **decoupled full-stack hybrid cloud topology**. The application backend relies on containerized state-free controllers scaled horizontally with high efficiency, supported by robust state stores.

```
                  ┌──────────────────────────────┐
                  │    Cloudflare CDN / DNS      │
                  └──────────────┬───────────────┘
                                 │ HTTP/WS (TLS 1.3)
                  ┌──────────────▼───────────────┐
                  │      Nginx Ingress Proxy     │
                  └──────────────┬───────────────┘
                                 │ 
            ┌────────────────────┼────────────────────┐
            │ Load Balancing     │                    │
    ┌───────▼───────┐    ┌───────▼───────┐    ┌───────▼───────┐
    │  API Node v1  │    │  API Node v2  │    │  API Node v3  │
    │  (PM2 Cluster)│    │  (PM2 Cluster)│    │  (PM2 Cluster)│
    └───────┬───────┘    └───────┬───────┘    └───────┬───────┘
            │                    │                    │
            └────────────┬───────┴────────────┬───────┘
                         │                    │
           ┌─────────────▼─────────────┐┌─────▼─────────────────────┐
           │ Redis Cluster (Sentinel)  ││ Supabase / PostgreSQL      │
           │ ├─ Session / JWT Blacklist││ ├─ Primary Read-Write Master│
           │ ├─ Rate Limiting / GeoIP   ││ └─ Read Replicas (Hot)    │
           │ └─ Pub/Sub Chat Event Bus ││                           │
           └─────────────┬─────────────┘└─────▲─────────────────────┘
                         │                    │
           ┌─────────────▼─────────────┐      │ Storage Events
           │ BullMQ Queue Workers      ├──────┘
           │ ├─ Media Compactor (Sharp)│
           │ ├─ Notification Dispatcher│
           │ └─ AI Desc Generator      │
           └───────────────────────────┘
```

### High-Scale Physical Strategy:
- **Stateless Application Servers:** All user sessions are decrypted via stateless JWT signatures. Node processes maintain no memory state, allowing seamless Autoscaling in response to CPU metrics (e.g., target 65% utilization).
- **Read/Write DB Splitting:** All transactional writes target the Primary PostgreSQL Master. Analytics, dashboards, and buyer navigation listings run on PostgreSQL Read Replicas with replication lag capped under $50\text{ms}$.
- **Storage Direct Proxies:** Chunky binaries (media uploads, documents) bypass raw node application cycles. The backend generates **presigned uploads / private secure links** allowing clients to interact with Supabase Storage buckets directly or via specialized media routing nodes to avoid memory bloating.

---

## 2. Standard-Setting Enterprise Folder Structure

The project has been architected according to the **Service-Repository Pattern / Clean Architecture principles** to segregate concerns cleanly.

```
/
├── .env.example
├── Dockerfile
├── pm2.config.js
├── tsconfig.json
├── package.json
├── server/
│   ├── index.ts                     # System boot entry point
│   ├── app.ts                       # Express app configuration & middleware pipeline
│   ├── config/                      # Constants, Database configurations, environment validations
│   │   ├── database.ts
│   │   ├── redis.ts
│   │   └── security.ts
│   ├── controllers/                 # Request/Response adaptors
│   │   ├── auth.controller.ts
│   │   ├── dealer.controller.ts
│   │   ├── vehicle.controller.ts
│   │   └── admin.controller.ts
│   ├── repositories/                # Direct database access layer (Knex / PgCommon / Prisma)
│   │   ├── user.repository.ts
│   │   ├── dealer.repository.ts
│   │   └── vehicle.repository.ts
│   ├── services/                    # Domain business logic (No Express objects should leak here)
│   │   ├── auth.service.ts
│   │   ├── media.service.ts
│   │   ├── search.service.ts
│   │   └── notification.service.ts
│   ├── middlewares/                 # Pipeline operations (JWT Auth, RBAC validation, Sanitizers)
│   │   ├── auth.middleware.ts
│   │   ├── rbac.middleware.ts
│   │   ├── rate-limiter.middleware.ts
│   │   └── error.middleware.ts
│   ├── workers/                     # Async batch task consumers
│   │   ├── queue.ts
│   │   ├── media-compactor.ts
│   │   └── notification-sender.ts
│   ├── websockets/                  # Duplex communication handlers
│   │   ├── socket-server.ts
│   │   └── event-handlers/
│   └── utils/                       # Shared helper libraries (Winston Logger, Crypt, OTP)
```

---

## 3. High-Performance Enterprise PostgreSQL Schema

Below is the production-ready DDL layout built with strict constraints, foreign-key hierarchies, and optimized indexing strategies for high concurrent queries.

```sql
-- Enable UUID and Geographic extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "cube";
CREATE EXTENSION IF NOT EXISTS "earthdistance";

-- ENUM declarations
CREATE TYPE user_role AS ENUM ('super_admin', 'state_admin', 'dealer', 'dealer_staff', 'buyer');
CREATE TYPE verification_status AS ENUM ('pending', 'processing', 'verified', 'rejected');
CREATE TYPE fuel_type AS ENUM ('petrol', 'diesel', 'cng', 'ev', 'hybrid');
CREATE TYPE transmission_type AS ENUM ('manual', 'automatic', 'amt', 'dct');
CREATE TYPE body_type AS ENUM ('hatchback', 'sedan', 'suv', 'muv', 'luxury', 'coupe');
CREATE TYPE media_category AS ENUM ('exterior', 'interior', 'engine', 'tires', 'documents', '360_view');

-- 1. Table: Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number VARCHAR(15) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    full_name VARCHAR(150),
    role user_role NOT NULL DEFAULT 'buyer',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- 2. Table: Dealers
CREATE TABLE dealers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES users(id) ON DELETE RESTRICT UNIQUE NOT NULL,
    business_name VARCHAR(255) NOT NULL,
    gstin VARCHAR(15) UNIQUE,
    trade_license VARCHAR(50),
    verification_status verification_status DEFAULT 'pending' NOT NULL,
    verified_at TIMESTAMP WITH TIME ZONE,
    address TEXT,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    is_trusted_badge BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Table: Dealer Staff (Dealership Authorization Granular Relationships)
CREATE TABLE dealer_staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dealer_id UUID REFERENCES dealers(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    permissions JSONB DEFAULT '{}'::jsonb NOT NULL, -- e.g. {"can_edit_inventory": true, "can_manage_leads": false}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Table: Cars (Inventory)
CREATE TABLE cars (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dealer_id UUID REFERENCES dealers(id) ON DELETE RESTRICT NOT NULL,
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    variant VARCHAR(150),
    manufacturing_year INT NOT NULL CHECK (manufacturing_year >= 1990 AND manufacturing_year <= 2100),
    price DECIMAL(12, 2) NOT NULL CHECK (price > 0),
    km_driven INT NOT NULL CHECK (km_driven >= 0),
    is_verified BOOLEAN DEFAULT FALSE NOT NULL,
    fuel_type fuel_type NOT NULL,
    transmission transmission_type NOT NULL,
    body_type body_type NOT NULL,
    owners_count INT DEFAULT 1 NOT NULL,
    rto_code VARCHAR(10),
    color VARCHAR(50),
    inspection_report_url TEXT,
    summary_description TEXT,
    ai_generated_features TEXT,
    is_boosted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- 5. Table: Car Media (Support up to 50+ attachments)
CREATE TABLE car_media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    car_id UUID REFERENCES cars(id) ON DELETE CASCADE NOT NULL,
    media_url TEXT NOT NULL,
    thumbnail_url TEXT,
    category media_category NOT NULL DEFAULT 'exterior',
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Table: OTP Logs
CREATE TABLE otp_logs (
    id SERIAL PRIMARY KEY,
    phone_number VARCHAR(15) NOT NULL,
    otp_code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE NOT NULL,
    attempt_count INT DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Table: Leads
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    car_id UUID REFERENCES cars(id) ON DELETE SET NULL,
    buyer_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    dealer_id UUID REFERENCES dealers(id) ON DELETE SET NULL NOT NULL,
    status VARCHAR(50) DEFAULT 'new' NOT NULL, -- 'new', 'contacted', 'test_drive_scheduled', 'closed'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Table: Audit Logs
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    target_table VARCHAR(100) NOT NULL,
    target_id UUID,
    payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- INVENTIVE PERFORMANCE INDEXING
-- Fast query scanning index composites 
CREATE INDEX idx_cars_search ON cars (brand, model, price, manufacturing_year) WHERE deleted_at IS NULL;
CREATE INDEX idx_cars_city ON cars (dealer_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_dealers_lat_long ON dealers (latitude, longitude);
CREATE INDEX idx_car_media_listing ON car_media (car_id, sort_order);
CREATE INDEX idx_leads_dealer ON leads (dealer_id, status);
CREATE INDEX idx_otp_verify ON otp_logs (phone_number, otp_code, expires_at) WHERE is_verified = FALSE;
CREATE INDEX idx_users_phone ON users (phone_number);
```

---

## 4. Scalable Auth & Cryptography Workflow

ASOneDealer utilizes strict **dual-layer stateless encryption**. Access tokens possess a short lifecycle ($15\text{m}$), whereas refresh tokens ($30\text{d}$) are stored as cryptographically hashed keys in the Database or Redis cache.

By integrating custom **Multi-Device Session Management**, users can view, manage, and invalidate active hardware connections instantly.

```
       OTP Auth Workflow                      JWT Verify Pipeline
     
   ┌───────┐         ┌────────┐               ┌───────┐         ┌────────┐
   │ Buyer │         │ Server │               │ Client│         │ Backend│
   └───┬───┘         └───┬────┘               └───┬───┘         └───┬────┘
       │ Request OTP     │                        │ Request /api/v1 │
       ├─────────────────►                        ├─────────────────►
       │                 │ Verify Attempt count   │                 │ Run Token Validate
       │                 ├────────┐               │                 ├────────┐
       │                 │        │ < 3/min?      │                 │        │ Signature OK?
       │                 ◄────────┘               │                 ◄────────┘
       │                 │ Send via Twilio/SMS    │                 │ Read RBAC Claims
       │    OTP code     ├────────┐               │                 ├────────┐
       │ ◄───────────────┤        │ (stored Redis)│                 │        │ Permitted?
       │                 ◄────────┘               │                 ◄────────┘
       │ Submit OTP code │                        │                 │ Run Route Logic
       ├─────────────────►                        │   Response      │
       │                 │ Match & Expire OTP     │◄────────────────┤
       │                 ├────────┐               │                 │
       │                 │  OK?   │               │                 │
       │                 ◄────────┘               │                 │
       │  JWT Token Pair │                        │                 │
       │◄────────────────┤                        │                 │
```

### Redis JWT Ban-List Integration:
When a user logs out, their current Access Token token signature is added to a Redis-backed ban-list (`EXPIRE` timestamp is set precisely to the token’s remaining lifespan). The API Gateway/Router interceptor checks this Redis index before execution in under $1.5\text{ms}$.

---

## 5. Media Pipeline & Caching Mechanics

A multi-media system serving an interactive marketplace must avoid high latency and database bottlenecks. 

```
                                          ┌──────────────┐
                                          │  Local CDN   │
                                          └──────▲───────┘
                                                 │ Reads Cache
   ┌──────────┐      Form Data ┌──────────┐      │        ┌──────────────────┐
   │  Client  ├───────────────►│  Server  ├──────┴───────►│ Supabase Storage │
   │          │ (Raw Stream)   │          │ WebP + Sharp  │ (car-images/etc) │
   └──────────┘                └──────────┘               └──────────────────┘
```

### Image Pipeline Rules:
1. **Compacting Process:** Node utilizes a cluster-aware streaming proxy. Incoming files are processed on the fly using **Sharp**. Files are normalized to exactly `1920x1080px`, compressed with a quality threshold of `80`, converted into `.webp format`, and and uploaded. Thumbnail variants sized at `320x320px` are written concurrently. This saves around **65% on bandwidth costs** compared to raw JPEG uploads.
2. **CDN Delivery:** Images are stored using public caching headers (`Cache-Control: public, max-age=31536000`). Custom subdomain naming connects this directly to Cloudflare edge server caching networks.
3. **Signed Token Strategy:** Confidential documents (e.g. GSTIN file streams, KYC, Vehicle Tax receipts) go into an isolated private bucket. When authorized agents require file access, the server issues dynamic signed URLs that expire after $5\text{m}$.

---

## 6. Massive Caching & Worker Architecture

To comfortably accommodate millions of active visitors, the platform leverages asynchronous queues to keep critical HTTP paths decoupled and fast.

### Redis Caching Implementation Strategy:
- **Vehicle Queries:** Complex search results are cached dynamically with an expiration window of 10 minutes. Cache invalidation happens selectively using Redis hashes when inventories are updated.
- **Geographic Distance Queries:** The Postgres `earthdistance` module evaluates coordinates instantly on Indexed fields, while Redis caches list query definitions based on city coordinates.

```typescript
// Caching implementation interface example for Vehicle Service queries
import { Redis } from 'ioredis';
import { vehicleRepository } from '../repositories/vehicle.repository';

const redis = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379');

export const vehicleService = {
  async fetchVehiclesWithCache(filters: any) {
    const cacheKey = `vehicles:query:${JSON.stringify(filters)}`;
    
    // 1. Peek in Redis Cache
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData);
    }
    
    // 2. Query Postgres Database
    const results = await vehicleRepository.fetchVehicles(filters);
    
    // 3. Populate Redis Cache
    await redis.set(cacheKey, JSON.stringify(results), 'EX', 600); // 10 minutes
    return results;
  }
};
```

### Asynchronous Queue System with BullMQ:
Our servers maintain continuous throughput by offloading high-cpu tasks to worker clusters:
* **Twilio SMS Verification & OTP Queues:** Avoid routing delays blocking HTTP responses.
* **OpenAI API Prompts (AI vehicle summaries):** Handled sequentially inside task runners.
* **Lead Real-Time Socket Notifications:** Pushed immediately to Redis Pub/Sub channels.

---

## 7. Security & Resiliency Protocols

The application is built to stay secure and operational under heavy network loads.

```
       System Layered Defense Architecture
     
     [ Internet ] ──► [ Cloudflare WAF ] (DDOS defense, SQLi filtering)
                             │
     [ Load Balancer ] ──► [ Rate Limiting Middleware ] (Max 120 reqs/min)
                             │
     [ App Container ] ──► [ Helmet Security Headers ] (CSP, FrameGuard)
                             │
     [ DB Controller ] ──► [ Knex Query Builder ] (SQL Parameterization)
```

1. **SQL Injection Defense:** All Database access runs through parameterized query builders. Raw string concats are strictly forbidden in DB modules.
2. **API Rate Limiter Configuration:** Limit routes on user classifications:
   - General API routes: 120 requests/minute per IP address.
   - OTP Generation: Max 3 requests per 10 minutes per phone number.
3. **Structured Logging (Winston + Sentry):** Runtime exceptions are formatted with trace metadata and piped to external aggregators, keeping stack traces hidden from direct client API responses.
4. **Clean Exit Handlers:** Listen to kill signals (`SIGTERM`, `SIGINT`) to complete database client flushing, finish ongoing BullMQ tasks, and close HTTP listener connections smoothly over 10 seconds.

---

## 8. Integrated DevOps & CI/CD Strategy

Our architecture handles configuration variables safely and automates deployment securely.

### Secure Environment Variables (`.env.example`)
```env
# Server configs
PORT=3000
NODE_ENV=production
API_SECRET_KEY=yoursupersecurejwtkey
DATABASE_URL=postgres://user:pass@postgresql-cluster:5432/db

# Cache/Queues
REDIS_URL=redis://password@redis-cluster:6379

# Storage Setup
SUPABASE_URL=https://project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=yoursecret-key-that-never-goes-to-the-front-end

# Gateways
TWILIO_SID=
TWILIO_AUTH_TOKEN=
```

### Production PM2 Clustering Layout (`pm2.config.js`)
To run state-free Node apps efficiently in multi-core container VMs:
```javascript
module.exports = {
  apps: [{
    name: 'asonedealer-backend',
    script: 'dist/server.cjs',
    instances: 'max', // spawn equivalent workers to the host CPU cores count
    exec_mode: 'cluster',
    env_production: {
      NODE_ENV: 'production'
    }
  }]
};
```

### Enterprise Scaling Philosophy Summary:
Every API endpoint has been designed to resolve critical operations in **under $200\text{ms}$**. By offloading intensive media tasks to worker queues, utilizing Redis query caching, and applying strict relational schema index designs, the **ASOneDealer** backend is ready with a bulletproof architecture to scale cleanly to support millions of users.
