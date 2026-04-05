

## Move Warehouse Management to Inventory & Clean Up Settings

### Part 1: Move Warehouse/Zone Management into Inventory Tracker

Add a third tab "Storage" to the Inventory Tracker page that contains the `WarehouseManager` component. This puts warehouse and zone CRUD right next to where users manage inventory items, making it contextually logical.

**File: `src/pages/InventoryTracker.tsx`**
- Add a third tab: "Storage" (with Warehouse icon) alongside "Inventory" and "Where Is It?"
- Import and render `WarehouseManager` in the new tab
- This replaces the need for warehouse management in Settings

### Part 2: Remove Warehouse Manager from Settings

**File: `src/pages/Settings.tsx`**
- Remove the `<WarehouseManager />` component and its import (line 38, line 427)
- Remove unused `Warehouse` icon import

### Part 3: Clean Up Settings Page

The current App tab has 8 cards stacked vertically. Reorganize into a cleaner layout:

**File: `src/pages/Settings.tsx`**
- Consolidate cards into fewer, grouped sections:
  - **Business Info** card stays as-is (name, phone, email)
  - **Defaults & Preferences** card: merge "Default Values" (commission rate, low stock, currency, date format) and "Display Preferences" (dark mode, compact view, auto backup) into one card with two sections separated by a divider
  - **Notifications** card: stays but made more compact (single toggle, no full card needed — fold into Defaults & Preferences as a third section)
  - **QR Code Branding** card stays as-is
  - **Customization** section: merge Machine Types and Vehicles into a single collapsible area or keep as separate but more compact cards
  - **Feedback** card: simplify to a single row with button, not a full card
- Remove the standalone "Save App Settings" button at the bottom — each section auto-saves or has its own save action (most already do via toggles)
- Move Budget Manager to its own tab or keep it but visually deemphasize it

Final Settings tab structure:
1. Business Information (card)
2. Defaults, Display & Notifications (single consolidated card with sections)
3. QR Code Branding (card)
4. Machine Types (card)
5. Vehicles (card)  
6. Budgets (card)
7. Feedback button (simple row, not a full card)

### Files Changed

| File | Change |
|---|---|
| `src/pages/InventoryTracker.tsx` | Add "Storage" tab with WarehouseManager |
| `src/pages/Settings.tsx` | Remove WarehouseManager; consolidate cards; merge Display + Defaults + Notifications into one card; simplify Feedback to a button row |

