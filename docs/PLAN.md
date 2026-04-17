# Tzevet Hatzolah – Technical Planning Document
## Phase: Active Development | Role: Senior Technical Lead

---

## 1. System-Level Overview

### What Exists Today
- Website Specification document (approved as source of truth)
- Two reference/inspiration websites (hatzalah.org.il, hatzala.org)
- Payment partners confirmed: **Sumit** (Israeli donors), **JGive** (international donors)
- Live codebase on GitHub: `github.com/tzevet-hatzolah/tzevet-hatzolah`
- Live deployment on Vercel: `tzevet-hatzolah-p4mi.vercel.app`
- Sanity studio initialized at `/studio` route
- Design system complete: colors, typography, tokens in `globals.css`

### What Must Be Built
A Hebrew-first (RTL), public-facing nonprofit website with:
- Informational pages (homepage, about, activities)
- News and stories section (requires ongoing CMS usage)
- Donations flow with two separate payment processors
- Contact form with WhatsApp integration
- Legal & compliance pages (accessibility statement, privacy policy, terms of use)
- Mobile-responsive, IS 5568 accessible, performant output

### What Is Out of Scope (for now)
- Member portal or volunteer management system
- Internal admin tools beyond basic CMS
- E-commerce, merchandise, or ticketing
- Native mobile app

---

## 2. Core Modules and Responsibilities

### Module 1 – Content & CMS
**Purpose:** Allow non-technical staff to publish news, update pages, and manage images.
- Static pages: Homepage, About, Activities, Contact
- Dynamic content: News articles, field stories, images, videos
- RTL/Hebrew text support required natively
- Must be simple enough for non-developers to use weekly

### Module 2 – Donation Flow
**Purpose:** Drive conversions. This is the most critical business function.
- Israeli donors → Sumit (sumit.co.il)
- Non-Israeli donors → JGive
- User-facing: One-time vs. recurring toggle, preset + custom amounts, donor language selection
- Backend: Confirmation emails (handled by payment processor), no PCI data stored on site
- The site does **not** process payments directly — it redirects or embeds iframes from Sumit/JGive

### Module 3 – Frontend / Presentation Layer
**Purpose:** Build trust, drive action, present the organization professionally.
- RTL-first layout (Hebrew default), with LTR fallback for English
- Responsive: Mobile, tablet, desktop
- Pages: Home, About, News & Stories, Donations, Activities, Contact, Accessibility (נגישות), Privacy Policy, Terms of Use
- Performance: Fast load time (nonprofit audience includes older users, lower-end devices)

### Module 4 – Infrastructure & Hosting
**Purpose:** Reliable, low-maintenance, low-cost hosting with good uptime.
- **Vercel** — hosting, CDN, SSL, zero-config deployment (connects directly to GitHub)
- Domain and DNS configuration
- Email routing for contact forms (Resend or Formspree)
- Automatic deployments on every push to `main`
- No server management required

### Module 5 – SEO & Analytics
**Purpose:** Measure impact, improve discoverability.
- Basic on-page SEO (meta tags, Open Graph, structured data)
- Google Analytics (or privacy-respecting alternative)
- No advanced tracking needed at launch

---

## 3. Assumptions and Constraints

### Confirmed Assumptions
- **Hebrew is default language.** English is secondary — donation page + nav only at launch.
- **Payment processing is fully delegated** to Sumit and JGive. The website never handles payment data.
- **Non-technical staff** will manage the CMS. Zero developer involvement required for day-to-day content.
- **1–2 month delivery window** is a hard constraint. Technology choices reflect this.
- **In-house developer** is available. This enables the headless stack and custom donation UI.
- **Stack is confirmed:** Next.js 16 + Sanity.io + Vercel + Tailwind CSS v4 (see Section 7).
- **GitHub repo** is public (Vercel free tier requires public repo for org accounts).

### Open Assumptions (Must Be Resolved)
- Domain DNS not yet pointed to Vercel — needs to happen before launch
- Sumit integration method (iframe vs. redirect) — awaiting their docs
- JGive integration method — awaiting their docs
- Do Sumit and JGive send automatic donation receipts? → If not, site needs to send via Resend
- Real stats numbers (volunteers, calls/year, years active) needed for homepage strip
- Who is the accessibility coordinator? → Required for IS 5568 compliance page
- What is the organization's WhatsApp number? → Required for floating contact button

### Hard Constraints
- Sumit integration is mandatory for Israeli donors
- JGive integration is mandatory for international donors
- RTL support must be correct — not an afterthought
- CMS must not require developer access for content updates
- IS 5568 accessibility compliance is mandatory (Israeli law — fines up to 50,000 NIS for non-compliance)

---

## 4. Task Breakdown (Epics → Tasks)

---

### EPIC 1 – Project Setup & Decisions ✅ COMPLETE

- [x] Domain confirmed
- [x] Hosting platform → **Vercel** (hobby/free tier, public repo)
- [x] CMS platform → **Sanity.io**
- [x] Frontend framework → **Next.js 16 App Router** (upgraded from 14)
- [x] Styling approach → **Tailwind CSS v4** (config in `globals.css`)
- [x] Brand assets → logo received, color palette confirmed
- [x] English language scope → donation page + nav only
- [x] GitHub repo → `github.com/tzevet-hatzolah/tzevet-hatzolah` (public)
- [x] Next.js scaffolded → TypeScript + Tailwind + App Router
- [x] Sanity studio initialized → `/studio` route, env vars in Vercel
- [x] Deployed to Vercel → `tzevet-hatzolah-p4mi.vercel.app`
- [x] Next.js running on v16.2.3 (Turbopack, React 19)
- [ ] Hebrew copy deadline agreed → **end of Week 3**
- [ ] **Contact Sumit** — iframe vs. redirect? sandbox? React example? Do they send automatic donation receipts?
- [ ] **Contact JGive** — same questions
- [ ] Confirm accessibility coordinator name and contact info (IS 5568 requirement)
- [ ] Confirm WhatsApp number for floating contact button

---

### EPIC 2 – Design System & Wireframes 🔄 IN PROGRESS

- [x] Color palette defined (see Section 9)
- [x] Typography chosen → **Heebo** (Hebrew + Latin, Google Fonts)
- [x] Type scale defined (see Section 9)
- [x] Layout logic confirmed: dark navy header, white/stone footer
- [x] `globals.css` written with all brand tokens
- [x] `layout.tsx` updated → `lang="he"`, `dir="rtl"`, Heebo loaded
- [x] Homepage wireframe — approved
- [ ] Donation page wireframe
- [ ] News listing wireframe
- [ ] News article wireframe
- [ ] About page wireframe
- [ ] Create favicon set (including Apple touch icon, 32x32, 16x16)
- [ ] Design default OG image for social sharing (Hebrew + English variants)
- [ ] Design page-specific OG image for donation page
- [ ] Define image aspect ratios for hero, news thumbnails, team photos
- [ ] Client approval on all wireframes before Epic 4 begins

---

### EPIC 3 – Sanity CMS Setup & Content Modeling 🔄 IN PROGRESS

- [x] Sanity studio initialized (co-located in Next.js monorepo)
- [x] Define schemas: `page`, `newsArticle`, `fieldStory`, `teamMember`, `siteSettings`
- [x] Define `blockContent` schema with numbered lists, YouTube embeds, bilingual alt text
- [x] Studio navigation configured (Site Settings singleton, Pages, News, Field Stories, Team)
- [x] Configure GROQ queries in Next.js for each content type
- [ ] Configure Hebrew as default locale; add `en` as secondary locale field
- [ ] Set up Sanity media plugin for image uploads with alt text (Hebrew + English)
- [ ] Enable Sanity live preview for content editors
- [ ] Train content editors (1 session + 1-page quick-reference guide)

---

### EPIC 4 – Core Pages Development 🔄 IN PROGRESS

- [x] Set up `next-intl` routing: Hebrew at root (no `/he/` prefix), English at `/en/` — `localePrefix: 'as-needed'`
- [x] `proxy.ts` configured for i18n (replaces `middleware.ts` in Next.js 16), excludes `/studio` and static files
- [x] `he.json` and `en.json` translation files created for all UI strings
- [x] Homepage — hero, stats strip, mission teaser, donation CTA block (₪50/₪100/₪250), latest news cards (placeholder data)
- [x] About Us page — static placeholder (not yet connected to Sanity)
- [x] Activities / Projects page — static placeholder
- [x] Contact Us page — form layout, phone, email, address, social
- [x] Accessibility page (`/negishot`) — IS 5568 accessibility statement placeholder
- [x] Privacy Policy page (`/privacy`)
- [x] Terms of Use page (`/terms`)
- [x] Thank-you page (`/todah`)
- [x] Custom 404 page — branded, with navigation back to home
- [x] Global navigation — RTL-aware, mobile hamburger, persistent red donate CTA button in header
- [x] Logo integrated in header (`next/image`, served from `/public/logo.jpg`)
- [x] Footer — 3 columns (nav, contact, social), org registration number, legal links
- [x] Connect pages to Sanity CMS (GROQ queries, dynamic content) — home, about, activities, news, news article, negishot, contact, Footer all wired to `siteSettings` / content schemas; donate page remains placeholder (blocked)
- [x] `next/image` configured for Sanity CDN (`cdn.sanity.io` in allowed domains)
- [ ] Homepage stats strip — animated counters on scroll (currently static)
- [ ] Homepage latest news — connect to Sanity `newsArticle` (ISR hourly)
- [ ] Floating WhatsApp button — links to `https://wa.me/<number>` (awaiting number from client)
- [ ] Donation page — connect amount presets to Sumit/JGive redirect (blocked on their docs)

---

### EPIC 5 – News & Stories Section

- [ ] News listing page — ISR, paginated, from Sanity `newsArticle` schema
- [ ] Single article page — `app/[locale]/news/[slug]/page.tsx`
- [ ] Field story page — distinct visual treatment from news
- [ ] Portable Text renderer (`@portabletext/react`)
- [ ] YouTube embed support inside Portable Text
- [ ] Homepage "Latest News" strip — 3 most recent, revalidated hourly
- [ ] Category/tag filtering — **defer to Phase 2**

---

### EPIC 6 – Donation Flow

- [ ] Donation page UI — amount presets + custom, one-time/recurring toggle, donor type selector
- [ ] Donor routing: Israeli → Sumit | Non-Israeli → JGive
- [ ] **Sumit integration** — redirect or iframe (pending their docs)
- [ ] **JGive integration** — redirect or iframe (pending their docs)
- [ ] Fallback placeholder if integrations delayed (simple redirect link)
- [ ] Thank-you page (`/todah`)
- [ ] Trust signals: SSL badge, org registration number, security copy
- [ ] End-to-end sandbox test before launch

---

### EPIC 7 – SEO, Performance, Accessibility & Compliance
*Non-negotiable baseline. Not a nice-to-have.*

**SEO**
- [ ] `generateMetadata()` on all pages (Hebrew + English variants)
- [ ] `hreflang` alternate links for `he` / `en`
- [ ] `sitemap.ts` — auto-generated
- [ ] `robots.ts` — configured for production

**Performance**
- [ ] `next/image` on all images — no raw `<img>` tags; WebP/AVIF auto-format enabled
- [ ] Hebrew alt text (mandatory), English alt text (where available)
- [ ] Core Web Vitals check via Vercel Analytics

**Accessibility (IS 5568 — Israeli law, mandatory)**
- [ ] Full WCAG 2.0 Level AA conformance audit across all pages
- [ ] WCAG AA contrast audit on all text/background combinations
- [ ] Keyboard navigation and focus ring test
- [ ] Screen reader testing with Hebrew content
- [ ] Accessibility statement page with coordinator contact info (legal requirement)
- [ ] Consider accessibility widget for quick font/contrast adjustments

**Legal & Privacy**
- [ ] Cookie consent banner — required if using analytics and targeting EU donors
- [ ] Privacy policy page — covering contact form data, analytics, donation redirects
- [ ] Contact form consent checkbox
- [ ] Terms of use page

**Security**
- [ ] Configure security headers in `next.config.js` (CSP, HSTS, X-Content-Type-Options, X-Frame-Options)
- [ ] Ensure CSP allows Sumit/JGive iframes if using embed method
- [ ] Verify no sensitive data in URL parameters during donation redirect flow

---

### EPIC 8 – Testing & Launch

- [ ] Cross-browser (Chrome, Safari, Firefox; iOS, Android)
- [ ] RTL rendering audit across all pages
- [ ] IS 5568 accessibility compliance final check
- [ ] Form submission and email delivery test
- [ ] Cookie consent banner functionality test
- [ ] Full donation flow test (sandbox + live) — both Sumit and JGive paths
- [ ] Verify donation receipt emails are sent by payment processors
- [ ] DNS cutover and SSL certificate
- [ ] Security headers verification
- [ ] Post-launch monitoring (uptime, error tracking)

---

## 5. Dependency Order

```
EPIC 1 ✅
    └── EPIC 2 (in progress)
            └── EPIC 3 (CMS schemas) ──── EPIC 5 (News & Stories)
            └── EPIC 4 (Core Pages)
            └── EPIC 6 (Donation) ← blocked on Sumit/JGive docs
                        |
                        ▼
                EPIC 7 (SEO, Performance, Accessibility & Compliance)
                        |
                        ▼
                EPIC 8 (Testing & Launch)
```

**Critical path:** Epic 2 approval → Epic 4 + Epic 6 (parallel) → Epic 7 → Epic 8

---

## 6. Decide Early vs. Defer

### Resolved
| Decision | Resolution |
|---|---|
| CMS platform | Sanity.io |
| Hosting | Vercel (free tier, public repo) |
| Domain | Confirmed |
| Brand assets | Logo + color palette confirmed |
| Frontend framework | Next.js 16 App Router (upgrade from 14) |
| Styling | Tailwind CSS v4 |
| Typography | Heebo (Google Fonts) |
| English scope | Donation page + nav only |
| Header/footer style | Dark navy header, stone footer |
| URL structure | Hebrew at root (no `/he/` prefix); English at `/en/` |

### Still Open
| Decision | Blocker |
|---|---|
| Sumit integration method | Awaiting their docs |
| JGive integration method | Awaiting their docs |
| Domain DNS → Vercel | Needed before launch |
| Real stats numbers | Client to provide |
| Accessibility coordinator contact | Client to confirm (IS 5568 requirement) |
| WhatsApp number | Client to confirm |
| Do Sumit/JGive send donation receipts? | Ask when contacting them |

### Deferred to Phase 2
| Item | Reason |
|---|---|
| Category/tag filtering for news | Not needed at launch |
| Full Hebrew → English translation | Donation + nav sufficient for launch |
| Video hosting (YouTube vs. Cloudinary) | Only when video stories are ready |
| Analytics platform | Can add post-launch |
| Emergency news ticker / live dispatches | Powerful trust signal (per reference sites) but too complex for Phase 1 |

---

## 7. Confirmed Technology Stack

| Layer | Tool | Notes |
|---|---|---|
| Frontend framework | **Next.js 16** (App Router) | Upgraded from 14; Turbopack default; React 19; ISR for news; SSG for static |
| CMS | **Sanity.io** | Studio at `/studio`; free tier sufficient (public datasets, 10K docs, 20 seats) |
| Hosting | **Vercel** | Hobby plan; public GitHub repo required |
| Styling | **Tailwind CSS v4** | Config in `src/app/globals.css` — no `tailwind.config.ts` |
| Typography | **Heebo** | Google Fonts; Hebrew + Latin; weights 300–800 |
| i18n | **next-intl** | Hebrew at root (no prefix); English at `/en/`; `localePrefix: 'as-needed'` |
| Israeli payments | **Sumit** | Integration method TBD |
| International payments | **JGive** | Integration method TBD |
| Contact form | **Resend** or **Formspree** | No custom backend needed |
| Analytics | **Vercel Analytics** | Free, zero config |
| Image optimization | **next/image** + Sanity CDN | `cdn.sanity.io` in allowed domains |

### Key Developer Commands
```bash
# Upgrade existing project to Next.js 16
npx @next/codemod@canary upgrade latest

# For new project (if starting fresh)
npx create-next-app@latest tzevet-hatzolah --yes

# Sanity already initialized

# Add i18n
npm install next-intl
```

### What Was Considered and Rejected
| Option | Reason Rejected |
|---|---|
| WordPress | In-house developer available; Next.js is better long-term |
| Webflow | RTL/Hebrew support immature; limited donation flow flexibility |
| Stripe | Not in spec — org contracted with Sumit and JGive |
| Tranzila / CardCom | Sumit is the confirmed Israeli payment partner |
| `tailwind.config.ts` | Tailwind v4 uses CSS-based config in `globals.css` |
| Next.js 14 | Outdated (2 major versions behind); upgraded to Next.js 16 for Turbopack, React 19, and long-term support |

---

## 8. Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| RTL bugs in layout (mobile especially) | High | High | Test RTL on real devices from day 1 |
| Sumit or JGive integration delays | Medium | High | Request docs this week; build redirect fallback |
| Hebrew copy not ready when dev needs it | High | Medium | Placeholder copy in dev; hard deadline Week 3 |
| Non-technical staff unable to use CMS | Medium | Medium | Simplest schema possible; 1-page usage guide |
| Scope creep mid-project | High | High | Written sign-off at end of Epic 2; all additions → Phase 2 |
| Client feedback loops delaying builds | Medium | High | 2-round feedback limit per Epic |
| Payment iframe performance issues | Low | Medium | Lazy-load embeds; test on 3G mobile |
| Donation page trust signals missing | Medium | High | SSL badge + registration number + security copy |
| IS 5568 accessibility non-compliance | Medium | High | Fines up to 50,000 NIS; build accessibility into every component from day 1 |
| GDPR non-compliance for EU donors | Low | Medium | Cookie consent banner + privacy policy; ensure donation redirects don't leak PII in URLs |
| Next.js 14 → 16 upgrade issues | Low | Medium | Run upgrade codemod early; test all routes; main changes: async cookies/headers + Turbopack default |

---

## 9. Design System (Confirmed)

### Color Palette

**Brand source colors (from logo):**
- Blue: `#204085`
- Yellow: `#F8E048`
- Red: `#C31A2D`

**Navy — Primary / Trust**
| Token | Hex | Usage |
|---|---|---|
| `--color-navy-50` | `#E8EDF7` | Tints, hover backgrounds |
| `--color-navy-400` | `#2D5299` | Links, icons |
| `--color-navy-600` | `#204085` | Buttons, nav active ★ logo exact |
| `--color-navy-800` | `#162D5E` | Header bg, footer |
| `--color-navy-950` | `#0C1A38` | Darkest text |

**Gold — Accent / Highlights**
| Token | Hex | Usage |
|---|---|---|
| `--color-gold-50` | `#FEFAE6` | Highlight backgrounds |
| `--color-gold-300` | `#F8E048` | Decorative only ★ logo exact |
| `--color-gold-500` | `#C9A800` | Stats numbers, badges, dividers |
| `--color-gold-700` | `#957B00` | Gold text on light backgrounds |
| `--color-gold-900` | `#5C4C00` | Dark label text |

**Red — Donations / CTA / Urgency**
| Token | Hex | Usage |
|---|---|---|
| `--color-red-50` | `#FBEAEC` | Alert backgrounds |
| `--color-red-400` | `#E02238` | Donate button face |
| `--color-red-600` | `#C31A2D` | Donate button hover ★ logo exact |
| `--color-red-800` | `#8F1120` | Pressed state |
| `--color-red-950` | `#5C0A14` | Dark red text |

**Neutrals**
| Token | Hex | Usage |
|---|---|---|
| `--color-warm-white` | `#F7F6F2` | Page background |
| `--color-stone` | `#ECEAE3` | Card backgrounds, footer |
| `--color-muted` | `#9B9A95` | Secondary / caption text |
| `--color-dark` | `#44433F` | Body text |
| `--color-charcoal` | `#1E1D1A` | Headings |

### Layout Color Logic
| Area | Background | Text |
|---|---|---|
| Header | `#162D5E` (navy-800) | White + Red CTA button |
| Hero section | `#204085` (navy-600) | White |
| Page body | `#F7F6F2` (warm-white) | `#1E1D1A` (charcoal) |
| Cards | `#ECEAE3` (stone) | `#1E1D1A` (charcoal) |
| Stats strip | `#F8E048` (gold-300) | `#162D5E` (navy-800) |
| Footer | `#ECEAE3` (stone) | `#44433F` (dark) |

### Typography

**Font:** Heebo (Google Fonts)
- Subsets: `hebrew`, `latin`
- Weights loaded: 300, 400, 500, 700, 800

**Type Scale**
| Role | Weight | Size | Line height | Usage |
|---|---|---|---|---|
| Display / Hero | 800 | 48px / 3rem | 1.2 | Hero headline |
| H1 | 700 | 36px / 2.25rem | 1.3 | Page titles |
| H2 | 700 | 26px / 1.625rem | 1.35 | Section headings |
| H3 | 500 | 20px / 1.25rem | 1.4 | Card / subsection titles |
| Body | 400 | 17px / 1.0625rem | 1.8 | Long-form text |
| Caption / UI | 400 | 14px / 0.875rem | 1.5 | Labels, dates, metadata |
| Button | 700 | 16px / 1rem | — | CTAs, nav items |

### RTL Rules
- `<html lang="he" dir="rtl">` set at root in `layout.tsx`
- English pages override with `lang="en"` (direction follows CSS)
- Heebo handles both Hebrew and Latin character sets natively
- Gold category labels, nav links, and all UI text in Heebo

### Gold Usage (Intentional and Limited)
- Stats strip numbers and background
- Section divider accent lines (3px)
- Selected donation amount button border
- Pull-quote left border on field stories
- Logo color (appears natively in logo asset)
- Does NOT appear in: nav, body text, CTA buttons, backgrounds

---

## 10. Homepage Structure (Wireframe Approved)

Seven sections top to bottom:

1. **Header** — navy-800 bg, logo right, nav links, red donate button left
2. **Hero** — navy-600 bg, gold category label, H1 headline, two CTAs
3. **Stats strip** — gold-300 bg, three key numbers in navy (need real data from client)
4. **Mission teaser** — two-column, text right, image/video left, links to About
5. **Donation CTA block** — navy-800 card, preset amounts (₪50 / ₪100 / ₪250 / custom), red donate button
6. **Latest news** — three cards from Sanity, gold category tags, dates
7. **Footer** — stone bg, three columns (nav / contact / social), org registration number

**Key decision:** Donation CTA block appears mid-page (before news) to capture scrolling visitors before they leave. Standard nonprofit conversion pattern.

---

## 11. Summary and Current Status

### Epic Status
| Epic | Status |
|---|---|
| Epic 1 — Setup | ✅ Complete (Sumit/JGive emails pending) |
| Epic 2 — Design System | ✅ Complete (remaining wireframes deferred — pages built directly) |
| Epic 3 — CMS Setup | 🔄 In progress (schemas + GROQ queries done, live preview + locale + editor training remaining) |
| Epic 4 — Core Pages | 🔄 In progress (all non-blocked pages connected to Sanity; floating WhatsApp + animated counters + donation integration remain) |
| Epic 5 — News Section | ⏳ Not started (blocked on Epic 3 GROQ queries) |
| Epic 6 — Donation Flow | 🔴 Blocked (Sumit/JGive docs needed) |
| Epic 7 — SEO, Performance, Accessibility & Compliance | ⏳ Not started |
| Epic 8 — Testing & Launch | ⏳ Not started |

### Immediate Next Actions
1. Build field story page (Epic 5) — `fieldStoriesQuery` exists but no route renders it
2. Send Sumit + JGive integration emails (ask about donation receipts too)
3. Confirm accessibility coordinator + WhatsApp number from client
4. Get real stats numbers from client for homepage strip
5. Point domain DNS to Vercel
6. Add animated counters to stats strip
7. Add floating WhatsApp button (once number confirmed)
8. Populate `siteSettings` in Sanity Studio (phone, email, address, socials, registration number)

### Realistic Timeline
| Week | Focus |
|---|---|
| Week 1 | ✅ Epic 1 complete |
| Week 2 | ✅ Epic 2 complete + Epic 3 schemas + Epic 4 page shells built |
| Week 3 | Epic 3 finish (GROQ queries, preview) + Epic 4 finish (connect to Sanity) |
| Week 4 | Epic 5 (news section) + Epic 6 (donation flow, if Sumit/JGive docs received) |
| Week 5 | Epic 6 continued + Epic 7: SEO, performance, accessibility audit |
| Week 6–7 | Epic 8: testing, RTL audit, IS 5568 check, DNS cutover, launch |

---

*Document version: 2.2 | Last updated: April 17, 2026 | Status: Epics 1-2 complete, Epics 3-4 in progress — all non-blocked pages connected to Sanity (Footer + contact now dynamic via `siteSettings`); remaining: field story page, donation integration (blocked), floating WhatsApp, animated counters*
