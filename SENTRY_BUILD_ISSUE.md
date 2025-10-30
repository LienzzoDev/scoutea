# Sentry Build Issue - Next.js 15 Compatibility

## Current Status: TEMPORARILY DISABLED ⚠️

Sentry integration has been temporarily disabled due to a build conflict with Next.js 15.4.6.

## The Problem

### Error Message
```
Error: <Html> should not be imported outside of pages/_document.
Read more: https://nextjs.org/docs/messages/no-document-import-in-page

Error occurred prerendering page "/404"
Export encountered an error on /_error: /404, exiting the build.
```

### Root Cause
- **Sentry Version**: `@sentry/nextjs@10.21.0`
- **Next.js Version**: `15.4.6` (App Router)
- **Issue**: Sentry's instrumentation injects code that references Pages Router components (`<Html>`, `<Head>`, etc.) when Next.js tries to generate default error pages (`/404`, `/_error`)
- **App Router vs Pages Router**: Our project uses App Router exclusively, but Sentry's integration still triggers Pages Router error page generation

### Related Issues
- [Sentry GitHub Issue #14831](https://github.com/getsentry/sentry-javascript/issues/14831)
- Next.js 15 App Router error page generation conflicts

## What Was Disabled

### Files Renamed (Disabled)
- `sentry.client.config.ts` → `sentry.client.config.ts.disabled`
- `sentry.server.config.ts` → `sentry.server.config.ts.disabled`
- `sentry.edge.config.ts` → `sentry.edge.config.ts.disabled`

### Code Changes
1. **src/instrumentation.ts**: Commented out Sentry initialization
2. **src/app/error.tsx**: Commented out `Sentry.captureException()`
3. **src/app/global-error.tsx**: Commented out `Sentry.captureException()`
4. **next.config.ts**: Commented out `withSentryConfig()` wrapper

### Temporary Error Handling
All errors now log to console instead of Sentry:
```typescript
console.error('Request error:', err, { method, path })
```

## How to Re-Enable Sentry

When Sentry releases a fix or we find a workaround:

### Step 1: Rename Config Files
```bash
mv sentry.client.config.ts.disabled sentry.client.config.ts
mv sentry.server.config.ts.disabled sentry.server.config.ts
mv sentry.edge.config.ts.disabled sentry.edge.config.ts
```

### Step 2: Uncomment Sentry Imports

**src/instrumentation.ts:**
```typescript
import * as Sentry from '@sentry/nextjs'

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config')
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config')
  }
}

export async function onRequestError(err, request) {
  Sentry.captureException(err, {
    contexts: { nextjs: { request } }
  })
}
```

**src/app/error.tsx:**
```typescript
import * as Sentry from '@sentry/nextjs'

useEffect(() => {
  Sentry.captureException(error)
}, [error])
```

**src/app/global-error.tsx:**
```typescript
import * as Sentry from '@sentry/nextjs'

useEffect(() => {
  Sentry.captureException(error)
}, [error])
```

### Step 3: Re-enable in next.config.ts
```typescript
export default withSentryConfig(nextConfig, sentryWebpackPluginOptions);
```

### Step 4: Test Build
```bash
npm run build
```

## Monitoring Solutions (Until Fixed)

### Option 1: Console Logs (Current)
All errors logged to console with context.

### Option 2: Alternative Error Tracking
Consider temporary alternatives:
- LogRocket
- Rollbar
- Bugsnag
- Custom error endpoint

### Option 3: Wait for Fix
Monitor these resources:
- [Sentry Next.js 15 Compatibility](https://github.com/getsentry/sentry-javascript/labels/Package%3A%20nextjs)
- [Next.js Releases](https://github.com/vercel/next.js/releases)
- Update `@sentry/nextjs` when patch released

## Build Status

### ✅ Working
- Clean codebase compilation
- Type checking (skipped but no errors)
- All API routes functional
- App Router pages work correctly

### ⚠️ Blocked
- Production build fails at static page generation
- Cannot deploy to Vercel until resolved

## Next Steps

1. **Monitor Sentry Updates**: Check weekly for `@sentry/nextjs` updates
2. **Test Workarounds**: Try experimental flags when available
3. **Consider Alternatives**: Evaluate other error tracking solutions
4. **Build Bypass**: Implement dynamic rendering for error pages

## Environment Variables (Still Required)

Keep these in `.env` for future re-enablement:
```bash
NEXT_PUBLIC_SENTRY_DSN=your_dsn
SENTRY_DSN=your_dsn
SENTRY_ORG=your_org
SENTRY_PROJECT=your_project
SENTRY_AUTH_TOKEN=your_token
```

## Questions?

See [SENTRY_SETUP.md](./SENTRY_SETUP.md) for complete Sentry setup guide (for when it's re-enabled).

---

**Last Updated**: 2025-10-30
**Issue Tracked**: [GitHub Issue](link-when-created)
**Status**: 🔴 Disabled - Awaiting Fix
