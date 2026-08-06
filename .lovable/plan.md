# Referral Promo Block on Commission PDFs

Add a customizable promo/referral message that prints at the bottom of every commission summary PDF, so each statement doubles as a referral ask ("Refer a business, get $50").

## Where the setting lives

Settings → App tab, new "Referral Promo" section (saved with your other business defaults, applies to all commission PDFs):

- **Include promo on commission PDFs** — on/off master switch
- **Headline** — default "Refer a Business, Earn $50"
- **Bonus amount** — dollar value ($50), inserted into the default message
- **Message** — short paragraph, default: "Know another business that could use a machine? Refer them to us and receive a $50 bonus once their machine is installed."
- **Contact line** — phone/email for referrals, pre-filled from the business phone/email already in settings

## On the generator

Above the Generate button, a single "Include referral promo" switch (defaults to whatever Settings says) so you can skip it on a particular statement. A small preview line shows the headline that will print.

## On the PDF

A bordered call-out block just above the footer, in both the revenue and no-revenue templates:

```text
+----------------------------------------------+
|            REFER A BUSINESS, EARN $50        |
|  Know another business that could use a      |
|  machine? Refer them and receive $50 once    |
|  their machine is installed.                 |
|        Call (555) 123-4567 to refer          |
+----------------------------------------------+
```

Skipped entirely when the promo is off or the message is empty.

## Technical notes

- `AppSettings` in `src/contexts/AppSettingsContext.tsx` gains `promoEnabled: boolean`, `promoHeadline: string`, `promoBonusAmount: number`, `promoMessage: string`, `promoContact: string`, with defaults in `DEFAULT_SETTINGS`. Persistence is the existing localStorage auto-save — no schema change.
- `src/pages/Settings.tsx`: new card in the App tab wired to `updateSetting`, mirroring the existing Default Commission Rate fields.
- `src/components/CommissionSummaryGenerator.tsx`: reads `useAppSettings()`, local `includePromo` state initialized from `settings.promoEnabled`; builds a `promoSection` HTML string (all fields through `sanitizeForHTML`) inserted before `footerNote(...)` in both templates.
- No changes to saved summaries, expense logging, or the show-revenue toggle.
