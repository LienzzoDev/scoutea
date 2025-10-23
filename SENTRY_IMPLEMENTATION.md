# Sentry Implementation Summary

Sentry has been successfully integrated into the Scoutea project. This document summarizes what has been implemented and next steps.

## What Was Implemented

### 1. Package Installation
- Installed `@sentry/nextjs` package (v9.x)
- All required dependencies automatically included

### 2. Configuration Files Created

#### Core Configuration
- **[src/instrumentation.ts](src/instrumentation.ts)** - Server and edge runtime initialization (Next.js instrumentation hook with `onRequestError` for RSC errors)
- **[src/instrumentation-client.ts](src/instrumentation-client.ts)** - Client-side initialization (Turbopack-compatible, includes router transition tracking)
- **[sentry.client.config.ts](sentry.client.config.ts)** - Legacy client config (still supported but deprecated)
- **[sentry.server.config.ts](sentry.server.config.ts)** - Server-side Sentry configuration
- **[sentry.edge.config.ts](sentry.edge.config.ts)** - Edge runtime configuration for middleware

#### Next.js Integration
- **[next.config.ts](next.config.ts)** - Updated with `withSentryConfig` wrapper
  - Source maps automatically uploaded in production
  - CSP headers updated to allow Sentry domains
  - Tunneling enabled at `/monitoring` route
  - React component annotation enabled
  - Vercel Cron Monitors enabled

### 3. Error Boundaries Updated
- **[src/app/error.tsx](src/app/error.tsx)** - Page-level error boundary with Sentry integration
- **[src/app/global-error.tsx](src/app/global-error.tsx)** - Root-level error boundary with Sentry integration

### 4. Utility Functions
- **[src/lib/utils/sentry-utils.ts](src/lib/utils/sentry-utils.ts)** - Helper functions for:
  - `captureErrorWithContext()` - Capture errors with tags and context
  - `captureMessageWithContext()` - Capture messages with metadata
  - `setUserContext()` / `clearUserContext()` - Manage user tracking
  - `addBreadcrumb()` - Add debugging breadcrumbs
  - `withSentryErrorHandling()` - API route wrapper
  - `startTransaction()` - Performance monitoring

### 5. Environment Configuration
- **[.env.example](.env.example)** - Updated with Sentry environment variables
- **[.gitignore](.gitignore)** - Updated to exclude `.sentryclirc` and Sentry artifacts
- **[.sentryclirc](.sentryclirc)** - Sentry CLI configuration template

### 6. Documentation
- **[SENTRY_SETUP.md](SENTRY_SETUP.md)** - Complete setup guide with examples
- **[CLAUDE.md](CLAUDE.md)** - Updated with Sentry integration details

## Features Enabled

### Error Tracking
- ✅ Client-side error capture
- ✅ Server-side error capture
- ✅ Edge runtime error capture
- ✅ React Server Component error capture
- ✅ Automatic error boundaries

### Performance Monitoring
- ✅ 100% transaction sampling (configurable)
- ✅ Router transition tracking
- ✅ API route instrumentation
- ✅ Custom performance transactions

### Session Replay
- ✅ 10% of normal sessions recorded
- ✅ 100% of error sessions recorded
- ✅ Privacy: text and media masking enabled

### Additional Features
- ✅ Source map upload (production builds)
- ✅ Hidden source maps from client
- ✅ Breadcrumb tracking
- ✅ User context tracking
- ✅ Custom tags and context
- ✅ Vercel Cron Monitor support
- ✅ Ad-blocker circumvention via tunnel

## Next Steps

### 1. Set Up Sentry Account
1. Create account at [sentry.io](https://sentry.io)
2. Create a new Next.js project
3. Get your DSN from project settings

### 2. Configure Environment Variables

Add to `.env.local`:

```bash
# Required for client and server error tracking
NEXT_PUBLIC_SENTRY_DSN=https://your-key@your-org.ingest.sentry.io/your-project-id
SENTRY_DSN=https://your-key@your-org.ingest.sentry.io/your-project-id

# Required for source map uploads (CI/CD only)
SENTRY_ORG=your-organization-slug
SENTRY_PROJECT=your-project-name
SENTRY_AUTH_TOKEN=your-auth-token

# Optional: Enable Sentry in development
# SENTRY_ENABLE_DEV=true
```

### 3. Vercel Deployment

#### Option A: Vercel Sentry Integration (Recommended)
1. Go to Vercel Dashboard → Integrations
2. Install "Sentry" integration
3. Connect your Sentry organization
4. Environment variables are added automatically

#### Option B: Manual Setup
Add environment variables in Vercel project settings:
- `NEXT_PUBLIC_SENTRY_DSN` (All environments)
- `SENTRY_DSN` (All environments)
- `SENTRY_ORG` (Production only)
- `SENTRY_PROJECT` (Production only)
- `SENTRY_AUTH_TOKEN` (Production only, secret)

### 4. Test Sentry

#### Test Client-Side Errors
Add a test button to any page:
```tsx
<button onClick={() => { throw new Error('Test Sentry') }}>
  Test Sentry
</button>
```

#### Test Server-Side Errors
In an API route:
```typescript
import * as Sentry from '@sentry/nextjs'

export async function GET() {
  try {
    throw new Error('Test Server Error')
  } catch (error) {
    Sentry.captureException(error)
    return Response.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
```

#### Using Utility Functions
```typescript
import { captureErrorWithContext } from '@/lib/utils/sentry-utils'

try {
  await someOperation()
} catch (error) {
  captureErrorWithContext(error, {
    tags: { section: 'player-profile', operation: 'fetch-stats' },
    context: { playerId, userId }
  })
}
```

### 5. Production Optimization

After initial testing, adjust sample rates in config files to reduce quota usage:

**In [src/instrumentation-client.ts](src/instrumentation-client.ts)**:
```typescript
tracesSampleRate: 0.1,  // 10% of transactions
replaysSessionSampleRate: 0.05,  // 5% of sessions
```

**In [sentry.server.config.ts](sentry.server.config.ts)**:
```typescript
tracesSampleRate: 0.1,  // 10% of transactions
```

### 6. Set Up Alerts

In Sentry dashboard:
1. Go to Alerts → Create Alert Rule
2. Set up notifications for:
   - New issues
   - Regression (issues that reappear)
   - High volume issues
3. Configure notifications (email, Slack, etc.)

### 7. Enable Release Tracking

To track which version of your app caused errors:

```bash
# During deployment (add to CI/CD)
export SENTRY_RELEASE=$(sentry-cli releases propose-version)
```

Add to Sentry config files:
```typescript
Sentry.init({
  // ... other options
  release: process.env.SENTRY_RELEASE,
})
```

## Known Issues & Notes

### Build Warnings
The following warnings are expected and can be ignored:
- "DEPRECATION WARNING: It is recommended renaming your `sentry.client.config.ts`" - Both old and new formats are supported
- "ACTION REQUIRED: To instrument navigations" - Already implemented in `instrumentation-client.ts`

### Development Mode
- Sentry is **disabled by default** in development to avoid noise
- Enable with `SENTRY_ENABLE_DEV=true` if needed for testing
- All error boundaries still work in development

### Performance
- Source maps increase build time by ~10-15%
- Session replay adds ~50KB to client bundle
- All features can be disabled individually if needed

## Monitoring Dashboard

After deployment, access your Sentry dashboard:
- **Issues**: `https://sentry.io/organizations/[org]/issues/`
- **Performance**: `https://sentry.io/organizations/[org]/performance/`
- **Replays**: `https://sentry.io/organizations/[org]/replays/`

## Support & Documentation

- **Full Setup Guide**: [SENTRY_SETUP.md](SENTRY_SETUP.md)
- **Sentry Next.js Docs**: https://docs.sentry.io/platforms/javascript/guides/nextjs/
- **Sentry Dashboard**: https://sentry.io
- **Environment Variables**: See [.env.example](.env.example)

## Cost Considerations

Sentry free tier includes:
- 5,000 errors/month
- 10,000 transactions/month
- 50 replays/month

To stay within limits:
1. Adjust sample rates (already configured at 10% for sessions)
2. Use `ignoreErrors` to filter common non-issues
3. Set up inbound filters in Sentry dashboard
4. Monitor quota usage in Sentry settings

---

**Implementation completed successfully!** 🎉

All configuration files are in place and ready for deployment. Just add your Sentry DSN to start tracking errors.
