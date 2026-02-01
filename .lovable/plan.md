
## Goal
Fix the Route Editor layout so the “Run Schedule” section is not visually hidden/covered by the Stops section (and keep stop dropdowns rendering correctly).

## What’s happening (likely cause)
In `src/components/mileage/RouteEditor.tsx`, the Stops section is set to `flex-1` inside a modal with a fixed max height (`max-h-[90vh]`) and multiple separators/sections.

Because the main dialog body is `overflow-hidden` and **only the Stops list is scrollable**, the Stops section can effectively “consume” the available vertical space, causing the “Run Schedule” section to end up below the visible area and feel like it’s “behind”/covered.

Also, the earlier z-index tweak (`z-10` on the Stops container) can contribute to confusing stacking behavior if elements overlap.

## Approach
Make the modal’s *content area* scrollable (not just the Stops list), and make the Stops section “size-to-content” instead of “take all remaining space”.

This produces the expected UX:
- You can always reach “Run Schedule” by scrolling the modal content.
- Stops can still have their own internal scroll if needed (for long routes).
- Dropdowns remain visible (and we can harden z-index if necessary).

---

## Planned code changes

### 1) RouteEditor: make the dialog body scrollable
**File:** `src/components/mileage/RouteEditor.tsx`

Change the main content wrapper from `overflow-hidden` to `overflow-y-auto min-h-0` so the full form can scroll inside the dialog:

- Current:
  - `div` wrapper: `className="flex-1 overflow-hidden flex flex-col gap-5"`
- Update to:
  - `className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-5 pr-1"`

Notes:
- `min-h-0` is important in flex layouts so overflow scrolling works correctly.
- `pr-1` helps avoid the scrollbar overlapping content.

### 2) RouteEditor: stop the Stops section from “hogging” space
Still in `RouteEditor.tsx`, update the Stops section container:

- Current Stops section wrapper:
  - `className="space-y-3 flex-1 min-h-0"`
- Update to:
  - `className="space-y-3"`

Then manage list height at the list container level (keep a max height there if you want Stops to have its own scroll):
- Keep `max-h-[280px] overflow-y-auto` on the list container (or adjust to something more responsive like `max-h-[40vh]`).

### 3) RouteEditor: remove/adjust the z-index layering that may cause overlap
Because the Select dropdowns are already portaled (`SelectPrimitive.Portal` in `src/components/ui/select.tsx`), we likely don’t need the Stops container to be `z-10`.

- Change the stops list container from:
  - `className="relative z-10 max-h-[280px] overflow-y-auto ..."`
- To:
  - `className="relative max-h-[280px] overflow-y-auto ..."`

Keep the Run Schedule section as `relative` without special z-index unless we confirm it’s needed.

### 4) Harden dropdown z-index (only if still needed after layout fix)
If the dropdown still ever appears behind dialog overlay/content due to equal z-index (`DialogContent` is `z-50` and SelectContent is also `z-50`), raise the SelectContent z-index.

Options:
- In `src/components/ui/select.tsx`, change SelectContent base class from `z-50` to `z-[60]` (or `z-[100]`).
- Or locally in `RouteStopItem.tsx`, set `className="z-[100] bg-popover"` on `SelectContent`.

I’d prefer updating `src/components/ui/select.tsx` once so all dropdowns benefit consistently.

---

## Verification steps (what you’ll test after implementation)
1. Go to **Mileage → Routes → Create Route**
2. Add enough stops to make the editor “busy”
3. Confirm:
   - “Run Schedule” is reachable by scrolling inside the modal (not hidden/covered)
   - Stop “Select location…” dropdown opens fully and appears above other sections
   - No weird overlap/jumbled layout when adding/removing stops
4. Repeat on mobile viewport sizes (if you use the app on mobile)

---

## Files involved
- `src/components/mileage/RouteEditor.tsx` (primary layout fix)
- `src/components/ui/select.tsx` (optional global z-index hardening)
- `src/components/mileage/RouteStopItem.tsx` (optional local z-index hardening)

---

## Edge cases handled
- Very long routes (many stops): modal still usable via scrolling; stops list can stay capped.
- Small screens: modal scroll prevents content from being unreachable.
- Dropdown menus: portal + higher z-index avoids being hidden behind dialog content/overlay.
