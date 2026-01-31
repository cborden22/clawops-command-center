

## Fix QR Code Public Reporting: Pretty URLs

### Goal
Change the public reporting URL from `/m/{machineId}` (UUID-based, scary) to a human-friendly format like:

```
www.clawops.com/downtown-pizza/claw-1
```

Where:
- `downtown-pizza` = URL-friendly slug auto-generated from location name
- `claw-1` = Auto-generated unit code from machine type + index

---

### Current Problem

| Issue | Cause |
|-------|-------|
| 404 error when accessing form | App not published with latest route changes |
| Scary URLs | Using raw UUIDs like `/m/77ad0e7c-8304-4dbf-9506-6085d8148255` |
| No friendly identifiers | Locations and machines don't have URL slugs |

---

### Solution Overview

1. Add `slug` column to `locations` table (auto-generated from name)
2. Add `unit_code` column to `location_machines` table (auto-generated as `type-index`)
3. Create new route `/​:locationSlug/:unitCode` that resolves to the machine
4. Update QR code generator to use the new pretty URL format
5. Update the `ReportIssue` page to accept the new URL parameters

---

### Database Changes

**Table: `locations`**
| Column | Type | Description |
|--------|------|-------------|
| `slug` | text | URL-friendly slug (e.g., "downtown-pizza"), unique per user |

**Table: `location_machines`**
| Column | Type | Description |
|--------|------|-------------|
| `unit_code` | text | Auto-generated unit identifier (e.g., "claw-1", "clip-2") |

**New Database Function: `get_machine_by_slug`**
```sql
CREATE OR REPLACE FUNCTION public.get_machine_by_slug(
  location_slug text,
  machine_unit_code text
)
RETURNS TABLE(
  machine_id uuid,
  machine_type text,
  custom_label text,
  location_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT lm.id, lm.machine_type, lm.custom_label, l.name
  FROM public.location_machines lm
  INNER JOIN public.locations l ON lm.location_id = l.id
  WHERE l.slug = location_slug
    AND lm.unit_code = machine_unit_code
  LIMIT 1
$$;
```

---

### URL Structure

**Before:**
```
https://clawops-command-center.lovable.app/m/77ad0e7c-8304-4dbf-9506-6085d8148255
```

**After:**
```
https://clawops-command-center.lovable.app/downtown-pizza/claw-1
```

---

### Auto-Generation Logic

**Location Slug:**
- Convert name to lowercase
- Replace spaces and special characters with hyphens
- Remove duplicate hyphens
- Example: "Downtown Pizza & Taproom" → `downtown-pizza-taproom`

**Unit Code:**
- Format: `{machine_type}-{index}`
- Index is per-location, per-type
- Example: First claw at a location → `claw-1`, second claw → `claw-2`

---

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/utils/slugify.ts` | Create | Helper to generate URL-safe slugs |
| `src/hooks/useLocationsDB.ts` | Modify | Auto-generate slug when creating/updating locations |
| `src/hooks/useMaintenanceReports.ts` | Modify | Add `getMachineBySlug()` function |
| `src/components/maintenance/QRCodeGenerator.tsx` | Modify | Use new pretty URL format |
| `src/pages/ReportIssue.tsx` | Modify | Accept `locationSlug` and `unitCode` params |
| `src/App.tsx` | Modify | Add route `/:locationSlug/:unitCode` |

---

### Routing Change

**`src/App.tsx`**
```tsx
<Routes>
  {/* Pretty URL for public reporting - e.g., /downtown-pizza/claw-1 */}
  <Route path="/:locationSlug/:unitCode" element={<ReportIssue />} />
  
  {/* Legacy fallback for existing QR codes */}
  <Route path="/m/:machineId" element={<ReportIssue />} />
  
  {/* Protected routes */}
  <Route path="/*" element={<ProtectedAppRoutes />} />
</Routes>
```

---

### QR Code URL Generation

**`src/components/maintenance/QRCodeGenerator.tsx`**

Instead of:
```typescript
const reportUrl = `https://clawops-command-center.lovable.app/m/${machineId}`;
```

Use:
```typescript
const reportUrl = `https://clawops-command-center.lovable.app/${locationSlug}/${unitCode}`;
// Example: https://clawops-command-center.lovable.app/downtown-pizza/claw-1
```

---

### Report Issue Page Updates

**`src/pages/ReportIssue.tsx`**

Support both URL formats:

```typescript
const { machineId } = useParams(); // Legacy: /m/:machineId
const { locationSlug, unitCode } = useParams(); // New: /:locationSlug/:unitCode

useEffect(() => {
  async function loadMachine() {
    let info;
    
    if (locationSlug && unitCode) {
      // New pretty URL format
      info = await getMachineBySlug(locationSlug, unitCode);
    } else if (machineId) {
      // Legacy UUID format (backward compatible)
      info = await getMachinePublicInfo(machineId);
    }
    
    // ... rest of logic
  }
}, [machineId, locationSlug, unitCode]);
```

---

### Migration for Existing Data

A one-time migration will:
1. Generate slugs for all existing locations based on their names
2. Generate unit codes for all existing machines based on type + position

```sql
-- Generate slugs for existing locations
UPDATE locations
SET slug = lower(regexp_replace(regexp_replace(name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'))
WHERE slug IS NULL;

-- Generate unit codes for existing machines
WITH numbered AS (
  SELECT 
    id,
    machine_type || '-' || ROW_NUMBER() OVER (
      PARTITION BY location_id, machine_type 
      ORDER BY id
    ) as generated_code
  FROM location_machines
)
UPDATE location_machines lm
SET unit_code = n.generated_code
FROM numbered n
WHERE lm.id = n.id AND lm.unit_code IS NULL;
```

---

### Implementation Steps

1. **Database migration**: Add `slug` to locations, `unit_code` to location_machines
2. **Backfill existing data**: Generate slugs and unit codes for existing records
3. **Create database function**: `get_machine_by_slug()` for public lookups
4. **Update hooks**: Auto-generate slug/unit_code on create/update
5. **Update QR generator**: Use pretty URLs
6. **Update report page**: Support both URL formats
7. **Update routing**: Add new route pattern
8. **Publish**: Deploy changes to production

---

### Example URLs After Implementation

| Location | Machine | URL |
|----------|---------|-----|
| Downtown Pizza & Taproom | First claw | `/downtown-pizza-taproom/claw-1` |
| Downtown Pizza & Taproom | Second claw | `/downtown-pizza-taproom/claw-2` |
| Midtown Pizza | Mini claw | `/midtown-pizza/mini-claw-1` |
| El Senor | Clip machine | `/el-senor/clip-1` |

---

### Backward Compatibility

- Existing QR codes using `/m/{uuid}` will continue to work
- New QR codes will use the pretty URL format
- Both routes point to the same `ReportIssue` component

