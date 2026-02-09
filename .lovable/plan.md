

## Batch QR Code Sheet Printer

### What This Does

Adds a "Print QR Sheet" button to the Machines tab that lets you:
1. Pick which machines you want QR stickers for (with select all / search)
2. Print a full page of business-card-sized QR stickers in one go

---

### How It Works

A new dialog opens with a checklist of all your machines (grouped by location). You check the ones you want, hit "Print Sheet", and it opens a print-ready page with multiple 3.5" x 2" stickers laid out in a grid -- fitting up to 5 per standard letter page (2 columns x ~5 rows, accounting for margins).

Each sticker uses the exact same layout as the existing single QR sticker: left side has "HAVING TROUBLE?" instructions, right side has the QR code with machine/location name.

---

### User Flow

```text
Machines Tab
  |
  +-- [Print QR Sheet] button (next to "Add Machine")
        |
        +-- Dialog opens with machine checklist
        |     - Search/filter bar
        |     - "Select All" checkbox
        |     - Machines listed with location name
        |     - Count of selected machines shown
        |
        +-- [Print Sheet] button
              |
              +-- Opens print window with grid of stickers
              +-- Auto-triggers browser print dialog
```

---

### Technical Details

**New File: `src/components/maintenance/BatchQRPrintDialog.tsx`**

- A Dialog component that receives the full list of machines (reuses the `MachineWithLocation` pattern from `MachinesManager`)
- State: `selectedMachineIds` (Set of composite keys like `locationId-machineIndex`)
- Search filter to find machines by name or location
- Select All / Deselect All toggle
- "Print Sheet" button that:
  - Generates QR SVGs for each selected machine using `QRCodeSVG` from `qrcode.react`
  - Opens a print window with CSS grid layout
  - Each cell is exactly 3.5in x 2in (matching existing sticker design)
  - Uses `@page { size: letter; margin: 0.25in; }` for standard US letter paper
  - Reuses the same two-column sticker HTML from `QRCodeGenerator.handlePrint()`
  - Auto-triggers `window.print()` on load

**Modified File: `src/components/MachinesManager.tsx`**

- Import and render `BatchQRPrintDialog`
- Add a "Print QR Sheet" button in the header next to "Add Machine"
- Pass the filtered machines list to the dialog
- Only show the button when machines exist

---

### Print Layout (Letter Paper: 8.5" x 11")

```text
+-----------------------------------+
|  [Sticker 3.5x2] [Sticker 3.5x2] |
|  [Sticker 3.5x2] [Sticker 3.5x2] |
|  [Sticker 3.5x2] [Sticker 3.5x2] |
|  [Sticker 3.5x2] [Sticker 3.5x2] |
|  [Sticker 3.5x2] [Sticker 3.5x2] |
+-----------------------------------+
  2 columns x 5 rows = 10 per page
  (with 0.25in margins)
```

Pages automatically break when more than 10 stickers are selected.

---

### Files to Create/Modify

| File | Action |
|------|--------|
| `src/components/maintenance/BatchQRPrintDialog.tsx` | Create -- new dialog with machine selector and batch print logic |
| `src/components/MachinesManager.tsx` | Modify -- add "Print QR Sheet" button and wire up the dialog |

