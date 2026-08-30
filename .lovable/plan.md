# Add 30s Marketing Video to Sales Page

## Goal
Embed the rendered 30-second ClawOps marketing video on the public sales page (clawops.com/sales).

## Steps

1. **Copy the video into the app**
   - Copy `/mnt/documents/clawops-marketing-30s-landscape.mp4` (7 MB) to `public/videos/clawops-marketing-30s.mp4` so it ships as a static asset.
   - Note: the file is 7 MB — it will be served on-demand (not precached), so the PWA 6 MB precache limit does not apply; we'll exclude it from Workbox precache if the config globs would pick it up.

2. **Embed on `src/pages/Sales.tsx`**
   - Add a "See it in action" section directly after the hero (before the features section at line ~158).
   - `<video>` element with: `controls`, `autoPlay muted loop playsInline` (autoplay-safe), `preload="metadata"`, rounded glass-card frame matching the dark-gold theme, subtle gold ring/shadow.
   - Responsive: full-width up to `max-w-4xl`, centered, 16:9 aspect preserved.
   - Accessible `aria-label` and a short caption line under it.

3. **Verify**
   - Confirm `vite.config` / Workbox globIgnores excludes `videos/**` from precache (add if missing).
   - Typecheck, then load `/sales` in the browser and confirm the video renders and plays.

## Technical notes
- No backend changes; purely static asset + one page edit.
- Video already has narration audio baked in; autoplay starts muted per browser policy, user can unmute via controls.
