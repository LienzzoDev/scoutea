# Sentry Setup Guide

This guide explains how to set up Sentry for error tracking and performance monitoring in the Scoutea application.

## Prerequisites

1. Create a Sentry account at [sentry.io](https://sentry.io)
2. Create a new project in Sentry (choose "Next.js" as the platform)

## Environment Variables

Add the following environment variables to your `.env.local` file:

```bash
# Required for client-side error tracking
NEXT_PUBLIC_SENTRY_DSN=https://your-key@your-org.ingest.sentry.io/your-project-id

# Required for server-side error tracking
SENTRY_DSN=https://your-key@your-org.ingest.sentry.io/your-project-id

# Required for source map uploads (only needed in CI/CD)
SENTRY_ORG=your-organization-slug
SENTRY_PROJECT=your-project-name
SENTRY_AUTH_TOKEN=your-auth-token

# Optional: Enable Sentry in development (disabled by default)
# SENTRY_ENABLE_DEV=true
```

### Getting Your Credentials

1. **DSN**: Found in Sentry → Settings → Projects → [Your Project] → Client Keys (DSN)
2. **Organization Slug**: Your organization name in the Sentry URL (e.g., `https://sentry.io/organizations/your-org-slug/`)
3. **Project Name**: Your project slug in Sentry
4. **Auth Token**: Create one at Sentry → Settings → Account → API → Auth Tokens
   - Scopes needed: `project:releases`, `project:write`

## Features Enabled

### Error Tracking
- Automatic capture of unhandled exceptions
- Server-side and client-side error tracking
- Edge runtime error tracking (middleware, edge functions)

### Performance Monitoring
- 100% transaction sampling (adjust `tracesSampleRate` in production)
- Automatic instrumentation of Next.js routes
- API endpoint performance tracking

### Session Replay
- 10% of normal sessions recorded (`replaysSessionSampleRate: 0.1`)
- 100% of error sessions recorded (`replaysOnErrorSampleRate: 1.0`)
- Text and media masking enabled for privacy

### Source Maps
- Automatic upload during production builds
- Hidden from client bundles for security
- Prettier stack traces with original source code

### Vercel Integration
- Automatic Cron Monitor instrumentation
- Environment detection (preview/production)
- Optimized for Vercel deployments

## Configuration Files

- **[src/instrumentation.ts](src/instrumentation.ts)**: Server and edge runtime initialization (Next.js instrumentation hook)
- **[src/instrumentation-client.ts](src/instrumentation-client.ts)**: Client-side initialization (recommended for Turbopack)
- **[sentry.client.config.ts](sentry.client.config.ts)**: Legacy client-side initialization (still supported)
- **[sentry.server.config.ts](sentry.server.config.ts)**: Server-side Sentry configuration
- **[sentry.edge.config.ts](sentry.edge.config.ts)**: Edge runtime Sentry configuration
- **[next.config.ts](next.config.ts)**: Sentry Next.js integration via `withSentryConfig`

## Development vs Production

### Development
- Sentry is **disabled by default** in development to avoid noise
- Enable with `SENTRY_ENABLE_DEV=true` if needed for testing
- Source maps are not uploaded in development

### Production
- All features enabled automatically
- Source maps uploaded during build (requires `SENTRY_AUTH_TOKEN`)
- Console logs removed from bundle
- Requests tunneled through `/monitoring` to bypass ad-blockers

## Testing Sentry

### Test Client-Side Error
Create a test page or add to an existing page:

```tsx
'use client'

export default function TestSentry() {
  return (
    <button onClick={() => {
      throw new Error('Test Sentry Client Error')
    }}>
      Trigger Client Error
    </button>
  )
}
```

### Test Server-Side Error
In an API route or Server Action:

```typescript
import * as Sentry from '@sentry/nextjs'

export async function GET() {
  try {
    throw new Error('Test Sentry Server Error')
  } catch (error) {
    Sentry.captureException(error)
    return Response.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
```

### Manual Error Capture

```typescript
import * as Sentry from '@sentry/nextjs'

// Capture exception
try {
  doSomethingRisky()
} catch (error) {
  Sentry.captureException(error)
}

// Capture message
Sentry.captureMessage('Something important happened', 'info')

// Add context
Sentry.setUser({ id: userId, email: userEmail })
Sentry.setTag('page', 'player-profile')
Sentry.setContext('player', { id: playerId, name: playerName })
```

## Vercel Deployment

### Automatic Setup
If deploying to Vercel, install the Sentry integration:

1. Go to Vercel Dashboard → Integrations
2. Install "Sentry" integration
3. Connect your Sentry organization
4. Environment variables will be added automatically

### Manual Setup
If not using the integration, add these to Vercel environment variables:

- `NEXT_PUBLIC_SENTRY_DSN` (All environments)
- `SENTRY_DSN` (All environments)
- `SENTRY_ORG` (Production only)
- `SENTRY_PROJECT` (Production only)
- `SENTRY_AUTH_TOKEN` (Production only, marked as secret)

## Content Security Policy

The CSP in `next.config.ts` has been updated to allow Sentry:

```
connect-src ... https://*.ingest.sentry.io
```

## Monitoring Dashboard

Access your Sentry dashboard at:
- Issues: `https://sentry.io/organizations/[your-org]/issues/`
- Performance: `https://sentry.io/organizations/[your-org]/performance/`
- Replays: `https://sentry.io/organizations/[your-org]/replays/`

## Cost Optimization

To reduce Sentry quota usage in production:

1. **Adjust Sample Rates** in config files:
   ```typescript
   tracesSampleRate: 0.1,  // Sample 10% of transactions
   replaysSessionSampleRate: 0.05,  // Record 5% of sessions
   ```

2. **Filter Out Known Errors**:
   ```typescript
   ignoreErrors: [
     'ChunkLoadError',
     'NetworkError',
     'Failed to fetch',
   ]
   ```

3. **Set Up Release Health** to track which releases have issues

## Troubleshooting

### Source Maps Not Uploading
- Verify `SENTRY_AUTH_TOKEN` is set in CI/CD
- Check build logs for Sentry plugin errors
- Ensure auth token has `project:releases` scope

### Errors Not Appearing
- Confirm DSN is correct and starts with `https://`
- Check browser console for Sentry initialization errors
- Verify environment is not development (unless `SENTRY_ENABLE_DEV=true`)

### High Quota Usage
- Reduce `tracesSampleRate` and `replaysSessionSampleRate`
- Add more patterns to `ignoreErrors`
- Set up inbound filters in Sentry dashboard

## Additional Resources

- [Sentry Next.js Documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Sentry Performance Monitoring](https://docs.sentry.io/product/performance/)
- [Session Replay](https://docs.sentry.io/product/session-replay/)
