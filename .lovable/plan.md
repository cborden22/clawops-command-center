

## Fix PWA Updates Not Working (Mobile + Desktop)

### Root Cause
The app's PWA service worker is **never being registered**. While `vite-plugin-pwa` is configured in `vite.config.ts` with `registerType: 'prompt'`, the actual registration code that imports from `virtual:pwa-register` is missing. Additionally, the update notification banner only shows on mobile, not on desktop.

---

### What Will Be Fixed

| Problem | Current State | After Fix |
|---------|--------------|-----------|
| Service worker not registering | No code calls `registerSW()` | Proper registration on app load |
| Updates not detected | Hook only listens, never registers | Full lifecycle: register + detect + prompt |
| Desktop users don't see update banner | `UpdateNotification` only in MobileLayout | Added to AppLayout for desktop |
| No "SKIP_WAITING" handler in SW | SW ignores skipWaiting messages | Workbox configured to handle it |

---

### Implementation Steps

#### 1. Update vite.config.ts - Add SKIP_WAITING Message Handler
Configure workbox to listen for the `SKIP_WAITING` message so updates apply immediately when the user clicks "Update":

```text
workbox: {
  ...existing config...
  // Add this to make skipWaiting work via postMessage
  skipWaiting: false,  // Keep manual control
  clientsClaim: true,
}
```

(This is already set - good!)

#### 2. Rewrite useServiceWorkerUpdate.ts - Use vite-plugin-pwa's registerSW
Replace the current manual approach with the proper `virtual:pwa-register` import that vite-plugin-pwa provides:

```typescript
import { useEffect, useState, useCallback } from "react";
import { registerSW } from "virtual:pwa-register";

export function useServiceWorkerUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateSW, setUpdateSW] = useState<((reload?: boolean) => Promise<void>) | null>(null);

  useEffect(() => {
    // Register the service worker using vite-plugin-pwa
    const updateFunction = registerSW({
      onNeedRefresh() {
        // New content available - show update prompt
        setUpdateAvailable(true);
      },
      onOfflineReady() {
        console.log("App ready to work offline");
      },
      onRegisteredSW(swUrl, registration) {
        // Check for updates every 30 minutes
        if (registration) {
          setInterval(() => {
            registration.update();
          }, 30 * 60 * 1000);
        }
      },
    });
    
    setUpdateSW(() => updateFunction);
  }, []);

  const applyUpdate = useCallback(() => {
    if (updateSW) {
      updateSW(true); // true = reload after update
    }
  }, [updateSW]);

  const dismissUpdate = useCallback(() => {
    setUpdateAvailable(false);
  }, []);

  return { updateAvailable, applyUpdate, dismissUpdate };
}
```

#### 3. Add TypeScript Declaration for virtual:pwa-register
Create a type declaration file so TypeScript knows about the virtual module:

**New file: `src/pwa.d.ts`**
```typescript
declare module "virtual:pwa-register" {
  export interface RegisterSWOptions {
    immediate?: boolean;
    onNeedRefresh?: () => void;
    onOfflineReady?: () => void;
    onRegistered?: (registration: ServiceWorkerRegistration | undefined) => void;
    onRegisteredSW?: (swUrl: string, registration: ServiceWorkerRegistration | undefined) => void;
    onRegisterError?: (error: Error) => void;
  }

  export function registerSW(options?: RegisterSWOptions): (reload?: boolean) => Promise<void>;
}
```

#### 4. Add UpdateNotification to Desktop Layout
Add the update banner to `AppLayout.tsx` so desktop users also see it:

```typescript
// Add import
import { UpdateNotification } from "@/components/mobile/UpdateNotification";

// Add inside the desktop layout JSX (after header)
<UpdateNotification />
```

#### 5. Move UpdateNotification to Shared Location (Optional Cleanup)
Since the component is now used by both layouts, rename/move it:
- Move from `src/components/mobile/UpdateNotification.tsx` to `src/components/shared/UpdateNotification.tsx`
- Update imports in both layout files

---

### Files to Modify

| File | Change |
|------|--------|
| `src/hooks/useServiceWorkerUpdate.ts` | Rewrite to use `registerSW` from `virtual:pwa-register` |
| `src/pwa.d.ts` | **New file** - TypeScript types for virtual module |
| `src/components/layout/AppLayout.tsx` | Add `UpdateNotification` component |
| `src/components/shared/UpdateNotification.tsx` | **Move** from mobile folder (shared by both layouts) |
| `src/components/layout/MobileLayout.tsx` | Update import path |

---

### How It Works After Fix

1. **On App Load**: `registerSW()` is called, which registers the service worker
2. **When You Push Updates**: Vite builds new assets with new hashes; the SW detects the new precache manifest
3. **Update Detection**: `onNeedRefresh()` fires, setting `updateAvailable = true`
4. **User Sees Banner**: Both mobile and desktop show "A new version is available!" with Update button
5. **User Clicks Update**: `applyUpdate()` calls `updateSW(true)` which activates the new SW and reloads
6. **Background Checks**: Every 30 minutes, `registration.update()` checks for new versions

---

### Testing After Implementation

1. Deploy this fix
2. Make any small change and deploy again
3. Open the app on mobile and desktop
4. You should see the "Update available" banner appear
5. Click "Update" - the page should reload with the new version

