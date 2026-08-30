# Fix: Marketing video fails on first load of /sales

## Root cause (verified)

- The video asset itself is healthy: CDN returns `video/mp4`, correct 7.3 MB length, and supports range requests (206) on both the preview and production domains.
- The failure comes from the app's own service worker (PWA). `src/hooks/useServiceWorkerUpdate.ts` calls `registerSW()` the moment the page loads, and the Workbox config uses `clientsClaim: true`. On a **first visit**, the new service worker activates and seizes control of the page while the 7 MB video fetch is in flight — the media request gets aborted, so the video shows a dead player. After a reload the SW is already active, so the video plays. This matches the reported symptom exactly.

## Fix

1. **Register the service worker after `window.load`** (`src/hooks/useServiceWorkerUpdate.ts`)
   - Defer `registerSW()` until the window `load` event fires (with an immediate path if the document is already complete).
   - By that point the video fetch/playback has started, so the SW takeover can no longer kill it. Update prompts and the 30-minute update check keep working unchanged.

2. **Keep `__l5e` media off the service worker's radar** (`vite.config.ts`)
   - Add `navigateFallbackDenylist: [/^\/__l5e\//]` to the Workbox config so platform asset URLs are never treated as app navigations.

3. **Make the video element self-healing** (`src/pages/Sales.tsx`)
   - Small `onError` handler on the `<video>`: if the media errors, re-set `src` once and `load()` again (one retry), so any first-load abort recovers without the user reloading the page.

## Verification

- Fresh Playwright browser profile (first visit, SW installs) against the preview `/sales` page: confirm the video reaches `canplay` and currentTime advances on the very first load.
- Confirm the PWA update prompt flow still works (registerSW still runs, just after load).
- Typecheck.
