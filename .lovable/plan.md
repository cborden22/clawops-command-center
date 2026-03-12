

## Fix: Location Map Breaking the App

### Root Cause
`react-leaflet` v5.0.0 requires **React 19**, but this project uses **React 18.3.1**. This version incompatibility causes the app to crash when the LocationMap component is loaded or even imported (since it's eagerly imported in App.tsx).

### Fix Steps

1. **Downgrade `react-leaflet` to v4.x** (compatible with React 18)
   - Change `react-leaflet` from `^5.0.0` to `4.2.1` in package.json
   - Add `@react-leaflet/core` at `2.1.0` (required peer dep for v4)
   - Keep `leaflet` at current version

2. **Lazy-load the LocationMap page** to prevent leaflet from blocking the entire app bundle if there are any remaining issues
   - Use `React.lazy()` + `Suspense` in App.tsx for the `/map` route
   - This isolates any map-related crashes from the rest of the app

3. **Add error boundary** around the map route as a safety net so map issues never break the full app again

### Technical Details

**package.json changes:**
```json
"react-leaflet": "4.2.1",
"@react-leaflet/core": "2.1.0",
"leaflet": "^1.9.4"
```

**App.tsx** - lazy import:
```tsx
const LocationMap = React.lazy(() => import("./pages/LocationMap"));
// In route: wrap with <Suspense fallback={<Loading/>}>
```

