import React, {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import * as Sentry from '@sentry/react';
import App from './App.tsx';
import './index.css';
import { validateEnv } from './lib/env';

// Run environment validation
validateEnv();

// Initialize client-side Sentry telemetry if configured
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE || 'development',
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
  console.info('[TELEMETRY] Sentry SDK initialized for frontend error and latency monitoring.');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
