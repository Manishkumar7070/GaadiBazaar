# System Security & Resilience Document

This document outlines the security measures, scalability patterns, and resilience strategies implemented for **AsOneDealer**.

## 🛡️ Security Measures

### 1. Backend Hardening (Express)
- **Helmet.js**: Implemented to set secure HTTP headers, protecting against XSS, clickjacking, and other common attacks.
- **Rate Limiting**: Applied to all `/api` routes to prevent brute-force attacks and DoS (Denial of Service).
- **Payload Limits**: Strict 1MB limit on JSON payloads to prevent memory exhaustion attacks.
- **Restricted CORS**: Cross-Origin Resource Sharing is locked down to specific production domains in production mode.
- **Content Security Policy (CSP)**: Configured to only allow connections to verified services like Supabase, Firebase, and Google APIs.

### 2. Database Security
- **Firebase Firestore Rules**: Implemented "Least Privilege" access. Users can only write to their own profiles and manage their own conversations. Default-deny policy for all other documents.
- **Supabase Row Level Security (RLS)**: Enabled on all tables. Public access is granted only for `SELECT` on vehicles and shops. `UPDATE/DELETE` requires ownership.
- **Sensitive Data**: Payment entries and critical status fields are restricted to Admin-only updates via server-side logic.

### 3. Authentication
- **Secure Handling**: Authentication is managed via Firebase Auth and Supabase Auth.
- **Session Protection**: Uses standard JWT and secure cookies. `trust proxy` is enabled to correctly handle client IPs behind the Cloud Run load balancer.

## ⚡ Scalability & Performance

### 1. Horizontal Scaling
- The application is designed to be **stateless**. Since sessions are handled via tokens, any instance of the backend can serve any user request.
- Cloud Run automatically increases the number of instances based on incoming traffic (CPU/Request utilization).

### 2. Database Scaling
- **Supabase (PostgreSQL)**: Utilizes indexes on frequently queried fields like `status`, `city`, and `priority_score`.
- **Firestore**: Naturally scalable NoSQL database that handles massive concurrent reads/writes without manual sharding.

## 🛡️ Resilience & Recovery

### 1. Automatic Restarts
- If the application crashes due to an unhandled error, the **Cloud Run orchestrator** automatically kills the old container and spins up a healthy one in seconds.

### 2. Crash Prevention
- **Process Listeners**: Added `uncaughtException` and `unhandledRejection` handlers to log errors and prevent abrupt process exits.
- **Fallback Mechanisms**: AI services (like price prediction) have rule-based fallback logic. If the Gemini API fails, the user still sees a standard market estimate instead of an error.

### 3. Data Protection (Backups)
- **Supabase**: Daily snapshots and Point-in-Time Recovery (PITR) ensure no data loss even in the event of a catastrophic database failure.
- **Firestore**: Multi-region replication and automatic managed backups are enabled by default.

## 🔍 Monitoring
- **Winston Logger**: Centralized logging captures all system warnings, errors, and critical shutdowns.
- **Health Checks**: `/api/health`, `/healthz`, and `/readyz` endpoints are available for infrastructure monitoring tools.
