

## Add Custom Machine Types in Settings

### What This Does

Adds a new "Machine Types" section in Settings where you can manage which machine types appear as options throughout the app (when adding machines to locations, filtering revenue, etc.). You'll be able to add, rename, and remove machine types to match your exact business setup.

### How It Works

- A new card in the Settings "App" tab lets you manage your machine type list
- You can add new types with a custom name (e.g., "Prize Locker", "Candy Crane")
- You can remove types you don't use
- The default types (Claw, Mini Claw, Bulk, Clip, Sticker, Other) come pre-loaded but can be removed
- Your custom list is saved to the database so it persists across devices and sessions

---

### Technical Details

**New database table: `custom_machine_types`**

Stores user-defined machine types with columns: `id`, `user_id`, `type_key` (slug), `label` (display name), `sort_order`, `created_at`. RLS policy restricts access to the owning user. Seeded with default types on first use.

**New component: `src/components/settings/MachineTypeManager.tsx`**

A settings card with:
- List of current machine types with delete buttons
- Input + "Add" button for new types
- Auto-generates a `type_key` slug from the label
- Drag reorder via sort_order (stretch goal)

**New hook: `src/hooks/useMachineTypesDB.ts`**

- Fetches custom types from the database (falls back to defaults if none exist)
- CRUD operations: add, remove, reorder
- Seeds defaults on first load if table is empty

**Modified files:**

| File | Change |
|------|--------|
| `src/hooks/useLocationsDB.ts` | Replace hardcoded `MACHINE_TYPE_OPTIONS` with dynamic list from `useMachineTypesDB`; keep the export but source it from the hook |
| `src/components/LocationTrackerComponent.tsx` | Use dynamic machine types instead of hardcoded options |
| `src/components/MachinesManager.tsx` | Use dynamic machine types |
| `src/components/leads/ConvertToLocationDialog.tsx` | Use dynamic machine types |
| `src/components/RevenueTrackerComponent.tsx` | Use dynamic machine types |
| `src/components/mobile/QuickRevenueForm.tsx` | Use dynamic machine types |
| `src/components/mobile/QuickInventoryForm.tsx` | Use dynamic machine types (if applicable) |
| `src/pages/Settings.tsx` | Add MachineTypeManager card to the App tab |
| `src/hooks/useLocationsDB.ts` | Update `MachineType["type"]` to accept `string` instead of a fixed union, since types are now user-defined |

**Database migration:**

```sql
CREATE TABLE public.custom_machine_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type_key text NOT NULL,
  label text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, type_key)
);

ALTER TABLE public.custom_machine_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own machine types"
  ON public.custom_machine_types
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

**Key design decisions:**
- The `MachineType["type"]` union changes from a fixed set to `string` to support custom types
- Default types are seeded client-side on first use (not via migration) so each user gets their own copy they can customize
- Team members inherit the owner's machine types via the existing `get_effective_owner_id` pattern
- "Other" is always kept as a fallback option

