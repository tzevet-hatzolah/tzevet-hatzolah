# Donation Flow — Test Plan

End-to-end checklist for validating the Sumit donation integration. Run through these against the test org / test terminal before any production cutover, and after material changes to `src/lib/sumit.ts`, `src/components/DonateForm.tsx`, or `src/app/api/donate/charge/`.

> **Note on test cards** — Sumit's docs don't label cards as approved vs. declined. Treat each card as "unknown" until tried. Visa `4557 4304 0232 1333` exp `05/31` CVV `098` has approved consistently. Use a different email per major scenario so each customer record is clearly separable in the dashboard.

---

## One-time donation (option 1)

- [ ] `/he/donate?total=180&payments=1` — submit with real ID (e.g., `123456782`) + Visa `4557 4304 0232 1333` 05/31 098 → redirects to `/he/todah?tx=<id>`
- [ ] Receipt PDF arrives by email, shows: donor name, citizen ID, ₪180, DonationReceipt format
- [ ] Sumit dashboard: payment row + customer card show citizen ID in ת.ז./ח.פ. slot
- [ ] Try ₪50 (minimum), ₪10000 (large amount) — both succeed

## Monthly recurring (option 3)

- [ ] `/he/donate?total=1800&payments=12` — submit successfully → `/he/todah?tx=<id>`
- [ ] Sumit dashboard: recurring billing record created, first ₪150 charge ran
- [ ] First DonationReceipt arrives by email
- [ ] Try edge counts: 6, 24, 36 months — all work
- [ ] Custom month count (e.g., 7) — works

## Donor identity — happy path

- [ ] Submit with valid 2-word Hebrew name + valid Israeli ID → DonationReceipt with full info
- [ ] Submit with English name + valid Israeli ID — receipt still issued

## Donor identity — opt-out / soft fields

- [ ] Leave ID empty + click submit → receipt-warning modal appears with Hebrew message about סעיף 46
- [ ] Click "**חזרה להשלמת הפרטים**" → modal closes, ID field focused
- [ ] Click "**המשך לתרומה אנונימית**" → charge proceeds → receipt shows `999999999` as ID
- [ ] Same for missing name, missing both — modal text changes appropriately
- [ ] Sumit customer card for opt-out donor shows `999999999` in ת.ז./ח.פ. slot

## Inline validation (blur errors)

- [ ] Enter 1-word name + tab away → red error "נא להזין שם מלא"
- [ ] Enter 8-digit ID + tab away → red error "ת״ז לא תקינה"
- [ ] Enter `123456782` (passes checksum) + tab away → no error
- [ ] Enter bad email format → red error
- [ ] Enter phone with 5 digits → red error
- [ ] Leave card number blank, then click submit → red error + auto-scroll to card field
- [ ] Enter expired card (month 01/24) → "תוקף הכרטיס פג"
- [ ] Submit without consent checkbox → error below checkbox

## Card decline / charge failure

- [ ] Use a documented "fictional" card (`4580 4580 4580 4580`) → tokenization succeeds, charge fails, redirected to `/he/donate?...&error=charge_...` with Hebrew banner visible at top
- [ ] Try another rejected real-format card → same error banner appears
- [ ] After decline, page remembers total + payments in URL — donor doesn't have to re-pick

## Tokenization failure

- [ ] Enter card number that fails Luhn (e.g., `4111 1111 1111 1112`) → red inline error before submit, no Sumit call
- [ ] If somehow tokenization fails server-side → error message appears below form, processing modal closes

## Processing modal

- [ ] On submit click → full-screen modal appears with spinner + "מעבדים את התרומה…"
- [ ] Page background scroll is locked while modal is open
- [ ] Modal disappears on success (page navigates) or on failure (returns to form with error)
- [ ] Test on mobile — modal centered, readable

## Entry points

- [ ] Homepage donation card → click → modal → "המשך לתשלום" → `/he/donate` form
- [ ] Homepage "תרמו עכשיו" button → `/he/donate` (no selection) → `DonateInteractive` picker → submit
- [ ] Direct URL `/he/donate?total=100&payments=1` → form pre-filled
- [ ] Direct URL with itemSlug `/he/donate?total=100&payments=1&item=stretcher` → summary shows the item

## Locale (English)

- [ ] `/en/donate?total=180&payments=1` → form labels + buttons in English
- [ ] Error banner in English when charge fails
- [ ] Receipt PDF arrives in English (`DocumentLanguage: 1`)

## Mobile responsive

- [ ] iPhone width — form fields stack, modal centered, submit button full-width
- [ ] Receipt warning modal scrollable if body content overflows
- [ ] Sticky mobile CTA (on `DonateInteractive`) works

## Sumit dashboard verification (after each successful test)

- [ ] Customer row created (or freshly created — SearchMode 1 means one per donation)
- [ ] Customer card shows: name, email, phone, citizen ID in ת.ז./ח.פ. slot
- [ ] Payment row shows: amount, payment method last-4, citizen ID
- [ ] DonationReceipt PDF downloadable from the payment row
- [ ] Recurring donations: separate recurring schedule visible in Sumit's recurring tab

## Terminal log spot-checks (no errors should appear)

- [ ] After successful charge: `[sumit:donor_captured]` line with correct `citizenId` and `cardLast4`
- [ ] After declined charge: `[sumit:payment_invalid]` with Sumit's `StatusDescription`
- [ ] No `[sumit:bad_response]` or `[sumit:status_error]` on the happy paths
