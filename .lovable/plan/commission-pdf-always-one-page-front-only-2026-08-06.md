# Commission PDF: Always One Page, Front Only

Commission summary PDFs can currently spill onto a second page when there are many machine rows, long notes, or the promo block. This forces the output to exactly one page.

## What changes

- The PDF is always a single page. No page 2 is ever added, even with a long machine list.
- Content is scaled to fit: if the rendered statement is taller than one page, it is proportionally shrunk so everything lands on the front page at full readability where possible.
- Tighter default spacing so scaling is rarely needed: reduced section margins, header/footer padding, and denser machine-breakdown rows.

## Technical notes

- `src/utils/pdfGenerator.ts`: add a `singlePage?: boolean` option. When set, drop the multi-page `while (heightLeft > 0)` loop and instead compute a fit ratio — if `imgHeight > pageHeight - margin*2`, scale `imgWidth`/`imgHeight` by that ratio and center horizontally, then add a single `addImage` call.
- `src/components/CommissionSummaryGenerator.tsx`: pass `singlePage: true` in the `generatePDFFromHTML(...)` call, and trim the inline styles in both templates (revenue and no-revenue) — container padding `40px 20px` -> `24px 20px`, section margins `30-40px` -> `16-20px`, info-table cell padding `12px` -> `8px`, machine-row padding `10px 8px` -> `6px 8px`, promo block padding `24px` -> `16px`, footer `margin-top: 40px` -> `24px`.
- No changes to saved summaries, expense logging, promo settings, or the show-revenue toggle.
