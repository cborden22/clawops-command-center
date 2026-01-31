

## Fix: Make QR Code Public Reporting Work

### Root Cause

The `/m/:machineId` route and `ReportIssue` page exist in the codebase but have NOT been published to production. The QR codes point to the published URL (`clawops-command-center.lovable.app`), but that site still has the old code without this route.

---

### Solution

#### Step 1: Publish the App

Click the **Publish** button in the top-right corner of the Lovable editor to deploy the latest changes to production. This will make the `/m/:machineId` route live.

---

#### Step 2: Additional Code Fix (Auth Context Issue)

There's also a potential issue with the `ReportIssue` component. It's wrapped inside `AuthProvider` but the route is meant to be public. When an unauthenticated user visits the page:

1. `AuthProvider` runs and sets `isLoading = true` initially
2. The page loads while auth state is being determined
3. If auth check hangs or takes time, user sees loading/blank

To ensure the public route works reliably without any auth interference, we should move the public route **outside** of `AuthProvider`.

**File: `src/App.tsx`**

Restructure to have the public route handled before the auth context:

```tsx
import * as React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
// ... other imports

// Public routes component (no auth required)
function PublicRoutes() {
  return (
    <Routes>
      <Route path="/m/:machineId" element={<ReportIssue />} />
    </Routes>
  );
}

// Protected routes component (auth required)  
function ProtectedApp() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/auth" element={<AuthRoute><Auth /></AuthRoute>} />
        <Route path="/" element={<ProtectedRoute>...</ProtectedRoute>} />
        {/* ... all other protected routes */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
}

const App: React.FC = () => {
  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <AppSettingsProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                {/* Public route - handled BEFORE AuthProvider */}
                <Route path="/m/:machineId" element={<ReportIssue />} />
                {/* All other routes go through AuthProvider */}
                <Route path="/*" element={<ProtectedApp />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AppSettingsProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
};
```

This structure ensures:
- `/m/:machineId` is handled first, completely outside of auth
- All other routes still go through the normal auth flow
- The public form works without any loading delays from auth state

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/App.tsx` | Restructure routes so `/m/:machineId` is outside `AuthProvider` |

---

### After Implementation

1. **Publish the app** to make the changes live on production
2. **Test the QR code** by scanning it or visiting the URL directly
3. The form should now appear immediately without any auth interference

---

### Summary

| Issue | Fix |
|-------|-----|
| Route not live on production | Publish the app |
| Auth context causes loading delay | Move public route outside AuthProvider |
| Blank screen | Both fixes combined will resolve this |

