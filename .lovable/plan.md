

## AR Machine Placement Tool

Build a new "AR Preview" page that lets you select a claw machine model, view it in 3D, and tap "View in AR" to place it in a real-world space using your phone's camera. No app download required — works natively on iPhones (Quick Look) and Android (Scene Viewer).

### How It Works

Uses Google's `<model-viewer>` web component which has built-in AR support on mobile devices. You pick a machine size/style, see a 3D preview, then tap an AR button to place it on the floor in a restaurant.

### Implementation

**1. Add model-viewer dependency**
- Install `@google/model-viewer` package
- Add type declarations for the custom element

**2. Create 3D machine models**
- Source or create `.glb` (GL Binary) files for 2-3 claw machine sizes (small, standard, large)
- Store in `public/models/` directory
- Can start with a free claw machine 3D model from Sketchfab or similar, or a placeholder box with dimensions

**3. New page: `src/pages/ARPreview.tsx`**
- Machine size selector (Small / Standard / Large) with real-world dimensions shown
- `<model-viewer>` component displaying the selected model in 3D (rotatable, zoomable)
- Built-in AR button — on mobile, taps launch native AR experience
- On desktop, shows 3D preview only with a note to open on phone
- Optional: QR code to quickly open the page on your phone from desktop

**4. Add route and navigation**
- Add `/ar-preview` route in `App.tsx`
- Add a link in the sidebar under a "Sales Tools" section or near Leads

### Limitations to Note
- Requires `.glb` 3D model files — we'll start with a placeholder/generic model
- AR placement works on iPhone (iOS 12+) and Android (Chrome 79+) only when opened on a physical device
- The preview in Lovable's sandbox will show the 3D viewer but AR requires a real phone

### Files Changed

| File | Change |
|---|---|
| `package.json` | Add `@google/model-viewer` |
| `src/pages/ARPreview.tsx` | New page with model-viewer, machine selector, AR launch |
| `src/App.tsx` | Add `/ar-preview` route |
| `src/components/layout/AppSidebar.tsx` | Add nav link |
| `public/models/` | Placeholder `.glb` model file(s) |

