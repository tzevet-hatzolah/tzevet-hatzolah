# Sumit Developer Documentation — Working Notes

Source: <https://help.sumit.co.il/he/collections/3333669> (collection: "מפתחים" / Developers).
Compiled 2026-05-06. Translated/condensed from Hebrew. Use as a starting point — confirm exact endpoint shapes with `https://app.sumit.co.il/developers/api/` (JS-rendered, must open in a browser).

---

## 1. What Sumit gives us

Sumit is PCI Level 1. The website never touches raw card data. We have several integration options:

| Method | When to use | Effort | PCI scope |
|---|---|---|---|
| **iframe embed** | Fastest path; drop their hosted page in a frame | Low | Lowest |
| **Redirect (`BeginRedirect`)** | Simple full-page redirect to a one-time secure URL | Low | Lowest |
| **Payments JS** | Custom-styled form on our domain; we tokenize, then charge server-side | Medium | Low (token only — never raw PAN) |
| **REST API direct charge** | Full server-side control, recurring, marketplace, etc. | High | Higher (need vault or tokens) |
| **WordPress / WooCommerce** | N/A — we're on Next.js | — | — |
| **Zapier / Make** | Workflow automation, not for the donation page | — | — |

For a Hebrew-first nonprofit donation page, **Payments JS** is the right default: branded UI, no leaving our domain, minimal PCI burden. Redirect is the safe fallback if we need to ship before the JS flow is hardened.

> Source: "כמעט כל האינטגרציות שאפשר לעשות עם SUMIT" — <https://help.sumit.co.il/he/articles/5832819>

---

## 2. Test environment

Sumit has no shared sandbox — you create a **separate test organization** and bind it to a test terminal.

**Setup (one-time):**

1. Create a new business at <https://app.sumit.co.il/companies/>. Name must contain the word `tests` (e.g. `Tzevet Hatzolah – Tests`). Any business number is accepted (use an ID number).
2. Install the modules you need (Revenue / הכנסות, Credit-card processing / סליקת אשראי, Recurring / הוראות קבע).
3. Connect to a test terminal and grab API keys at <https://app.sumit.co.il/developers/testterminal/>. Verify you're logged into the **test** org, not production.

**Gotchas:**

- Test orgs incur fees after a 30-day trial — keep one dedicated org, don't create new ones casually.
- Connecting a test terminal **disconnects the existing live processor**. Switching back requires a new setup request and another fee. For a clean separation, use two distinct Sumit organizations (one live, one tests) — don't toggle terminals on a single org.

> Source: "בדיקות ותהליכי אינטגרציה" — <https://help.sumit.co.il/he/articles/5840939>

---

## 3. Test cards

These work only in a test organization bound to a test terminal. Article doesn't label approved/declined/3DS scenarios — must verify behavior empirically.

**Mastercard**
- `5326 1053 0098 5853` — exp 04/2026, CVV 934
- `5326 1073 0002 0772` — exp 05/2031, CVV 033
- `5310 8403 0278 9139` — exp 05/2031, CVV 111
- `5310 8403 0278 9162` — exp 05/2031, CVV 245
- `5310 8403 0278 9154` — exp 05/2031, CVV 749

**Visa**
- `4557 4304 0232 1333` — exp 05/2031, CVV 098
- `4557 4304 0282 1341` — exp 05/2031, CVV 998
- `4557 4404 1187 4982` — exp 05/2031, CVV 467

**American Express**
- `3755 103905 07999` — exp 04/2026, CVV 551
- `3755 113919 31469` — exp 04/2026, CVV 295
- `3755 143912 78378` — exp 05/2031, CVV 631
- `3755 113901 12830` — exp 05/2031, CVV 270
- `3755 113901 12822` — exp 05/2031, CVV 871
- `3755 143912 78360` — exp 05/2031, CVV 970

**Fictional (form-validation only — never actually charges):**
- Local: `1231 1231` exp 12/2026 CVV 123
- Visa: `4580 4580 4580 4580` exp 12/2026 CVV 123

> Source: "שימוש בכרטיסי בדיקות" — <https://help.sumit.co.il/he/articles/5832877>

---

## 4. Payments JS — recommended path

Browser tokenizes card details against Sumit, server charges the token. We never see the PAN.

**Step 1 — load the script (once on the donation page):**

```html
<script src="https://app.sumit.co.il/scripts/payments.js"></script>
```

**Step 2 — initialize (jQuery is required by their snippet):**

```html
<script>
jQuery(function () {
  OfficeGuy.Payments.BindFormSubmit({
    CompanyID: YOUR_COMPANY_ID,
    APIPublicKey: 'YOUR_PUBLIC_API_KEY',
  });
});
</script>
```

**Step 3 — form fields (use `data-og` attributes — Sumit's JS reads them):**

```html
<form id="donate" method="post" action="/api/donate/charge">
  <input data-og="cardnumber"      name="cardnumber"      type="text" inputmode="numeric" autocomplete="cc-number" />
  <input data-og="expirationmonth" name="expirationmonth" type="text" inputmode="numeric" autocomplete="cc-exp-month" />
  <input data-og="expirationyear"  name="expirationyear"  type="text" inputmode="numeric" autocomplete="cc-exp-year" />
  <input data-og="cvv"             name="cvv"             type="text" inputmode="numeric" autocomplete="cc-csc" />
  <input data-og="citizenid"       name="citizenid"       type="text" inputmode="numeric" />
  <button type="submit">תרום עכשיו</button>
</form>
```

**Step 4 — what happens on submit:**

Sumit's JS intercepts the submit, sends the card to their tokenization endpoint, and on success appends a hidden `og-token` field to the form, then resubmits to your `action` URL.

**Step 5 — server-side charge:**

The server receives the form (including `og-token`) and calls Sumit's REST API with the token in the `SingleUseToken` parameter of `/billing/payments/charge/` (one-time) or `/billing/recurring/charge/` (recurring), authenticated with the **private** API key.

**Open questions for our implementation:**

- Sumit's snippet assumes jQuery. Next.js 16 has no jQuery — we'll need to load it on the donation page, or replace the binding with a small vanilla JS adapter. Verify with Sumit whether their JS truly requires jQuery at runtime or only in their example.
- `BindFormSubmit` overrides our submit handler. We need to know the events/callbacks it exposes (success, validation error, network error) to render our own error UI in Hebrew. **Ask Sumit for the full callback API.**
- iframe vs cross-domain considerations for CSP — the script loads from `app.sumit.co.il`; we'll need that in `script-src` and any tokenization endpoint in `connect-src` once CSP is reintroduced (currently deferred per `next.config.ts`).

> Sources:
> - "Payments JavaScript API" — <https://help.sumit.co.il/he/articles/5893615>
> - Hosted variant: <https://app.sumit.co.il/help/developers/paymentsjs/> (301 → article above)

---

## 5. REST API — endpoints we'll need

The full spec is at **<https://app.sumit.co.il/developers/api/>** (SPA — must view in a browser; WebFetch can't reach it).

Endpoints referenced from the integration overview article:

| Operation | Path | Notes |
|---|---|---|
| One-time charge | `POST /billing/payments/charge/` | Pass `SingleUseToken` from Payments JS |
| Recurring charge | `POST /billing/recurring/charge/` | For monthly donor program |
| Begin redirect | `POST /billing/payments/beginredirect/` | Returns a secure one-time payment URL; can also be embedded in `<iframe>` |
| Tokenize / save card to customer | `POST /billing/paymentmethods/setforcustomer/` | Vaults a card against an existing customer |

**Authentication:** API key (private) — obtained per organization in the developer settings. The Payments JS uses a separate **public** key.

**Receipts/invoices:** by default any successful charge auto-generates an invoice or receipt PDF (digitally signed). Can be disabled in the Revenue module settings.

**Webhooks:** the integration article mentions "automatic webhook notifications" for both one-time and recurring charges, but neither shape nor delivery URL config is in the help docs. **Ask Sumit for the webhook spec** — needed for confirming a donation server-side and emailing thank-you notes.

> Sources:
> - "כמעט כל האינטגרציות..." — <https://help.sumit.co.il/he/articles/5832819>
> - "אינטגרציה עם סליקת אשראי" — <https://help.sumit.co.il/he/articles/5832880>
> - "לסלוק אשראי עם API" — <https://help.sumit.co.il/he/articles/5833033>

---

## 6. Redirect / iframe fallback

If Payments JS slips, the redirect path is dead-simple:

```
POST /billing/payments/beginredirect/   →   { "URL": "https://app.sumit.co.il/.../<token>" }
```

Either:
- **Redirect:** `window.location = url` from the donate button.
- **Embed:** `<iframe src="<url>" />` — Sumit's response notes CSS customization is **not** available for embedded payment pages. Plan visual design accordingly (it'll look like Sumit, not us).

Return URL / success / failure handling: not documented in the public help articles. **Ask Sumit for the redirect callback contract** (return URL params, signature/HMAC verification).

---

## 7. Open questions for Sumit (email checklist)

Send these in one go to whoever answers `support@sumit.co.il` / their developer contact:

1. **Payments JS callbacks** — full reference for `OfficeGuy.Payments.BindFormSubmit`: success, validation error, network error events. Does it strictly require jQuery, or can we use it framework-free?
2. **Donation receipts** — does Sumit auto-email receipts to donors after a successful charge, or do we need to build that ourselves (Resend)? If they do, can we customize the Hebrew template + sender?
3. **Webhooks** — endpoint config, payload shape, signature verification, retry policy.
4. **Redirect callback** — exact return-URL params (transaction ID, status, signature) for `BeginRedirect` flow so we can verify server-side.
5. **3D Secure / PSD2** — is 3DS handled inside their iframe/JS automatically? Required for EU cards (JGive will likely cover EU, but sanity-check).
6. **Sandbox sharing** — confirm the test-org workflow is the only sandbox path; no shared sandbox keys.
7. **CSP / domains** — full list of domains we need to allowlist (`script-src`, `connect-src`, `frame-src`) for both Payments JS and the redirect/iframe flows.
8. **Test card scenarios** — which of the listed test cards trigger declines, 3DS prompts, insufficient funds? The help article doesn't label them.
9. **Recurring donations** — minimum interval, max attempts on decline, how donor cancels (self-service portal? we build it?).
10. **Marketplace / multi-tenant** — irrelevant for us (single org), but confirm in case future split-payment to a partner org comes up.

---

## 8. What this means for Epic 6

Unblocked:
- We can build the donation page UI (preset amounts, one-time/recurring toggle, donor-type selector) **right now** against the Payments JS shape above. The form fields and `data-og` attributes are stable.
- Test environment can be provisioned this week (one Sumit test org + test terminal + keys in Vercel envs).

Still blocked:
- Server-side `POST /billing/payments/charge/` request body — need the field list from the SPA spec or a Sumit reply. Same for the recurring endpoint.
- Webhook + redirect-return contract before we can claim end-to-end donation flow is "done."

Recommendation: build the donate page UI + tokenization on the client this week, stub the `/api/donate/charge` server route to log the token, and unblock the rest once Sumit responds.
