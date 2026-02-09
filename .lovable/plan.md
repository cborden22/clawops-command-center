

## QR Code Logo Customization

Add the ability to upload a business logo that appears as a ghost/watermark image in the center of all QR codes -- both single prints and batch prints. The logo uses the built-in `imageSettings` prop of `qrcode.react`, which safely embeds the image without breaking scannability (the QR codes already use high error correction).

---

### How It Works

**Upload**: In Settings > App tab, a new "QR Code Branding" card lets users upload a logo image (PNG, JPG, or SVG, max 2MB). A live preview shows what it looks like on a sample QR code.

**Storage**: The logo is uploaded to a new `qr-logos` storage bucket in Lovable Cloud. The URL is saved to the user's profile row in the database.

**Usage**: Both `QRCodeGenerator` and `BatchQRPrintDialog` read the logo URL and pass it to `QRCodeSVG` via `imageSettings`. The logo renders at ~20% of the QR code size, centered, with the `excavate` option to clear QR cells behind it for a clean look.

**No logo uploaded?** Everything works exactly as it does today -- no logo, no change.

---

### What Users See

- **Settings page**: New "QR Code Branding" section with upload button, preview, and remove option
- **QR Code dialog**: Logo automatically appears centered in the QR code
- **Print stickers**: Logo appears on printed stickers too (single and batch)
- **Downloads**: Downloaded QR PNGs include the logo

---

### Technical Details

**Database migration:**
- Create `qr-logos` storage bucket (public, so logo URLs work in print windows)
- Add `qr_logo_url` column to `profiles` table
- RLS policy: users can upload/delete their own logos

**Modified files:**

| File | Changes |
|------|---------|
| `src/contexts/AppSettingsContext.tsx` | No change -- logo lives in DB (profiles), not localStorage |
| `src/pages/Settings.tsx` | Add "QR Code Branding" card with upload, preview, and remove |
| `src/components/maintenance/QRCodeGenerator.tsx` | Read logo URL from profiles, pass as `imageSettings` to `QRCodeSVG`, include logo in print/download output |
| `src/components/maintenance/BatchQRPrintDialog.tsx` | Same -- read logo URL, pass to `QRCodeSVG`, include in batch print HTML |

**New hook:**
| File | Purpose |
|------|---------|
| `src/hooks/useQRLogo.ts` | Fetches and caches the user's `qr_logo_url` from profiles; provides `uploadLogo` and `removeLogo` functions |

**Key implementation detail -- `imageSettings` prop:**
```tsx
<QRCodeSVG
  value={reportUrl}
  size={200}
  level="H"
  imageSettings={logoUrl ? {
    src: logoUrl,
    height: 40,
    width: 40,
    excavate: true,  // clears QR cells behind logo
  } : undefined}
/>
```

For the print sticker, the logo is embedded as an `<img>` tag positioned absolutely over the QR SVG in the print HTML, maintaining the same centered positioning.

