# AGENTS.md — Development & Engineering Guidelines for Indian-Flowers.com

## 1. Project Context & Mission

**Target:** Indian-Flowers.com (US Market)  
**Core Purpose:** High-conversion, premium floral ecommerce providing fresh Indian flowers, handcrafted garlands (Jai Mala, wedding garlands, temple garlands), jasmine strands (Mallipoo), pooja leaves (mango, betel), and ceremonial essentials delivered across the United States.

> **CRITICAL MARKET RULE:**
> This is a **US-focused business**. All storefront prices, cart calculations, shipping, order confirmations, and receipts MUST be in **US Dollars (USD, `$`)**. Never use Indian Rupees (INR, `₹`) or Indian domestic payment references (e.g., UPI, IFSC, GSTIN) on customer-facing pages.

---

## 2. Mandatory Typography System

All frontend developers and AI agents must strictly follow the typography pairing: **DM Serif Display** (for editorial/ceremonial headlines) + **DM Sans** (for commerce UI, body, buttons, and prices).

### Recommended Typography Scale

| Element | Font | Desktop Size | Mobile Size | Weight / Style |
| :--- | :--- | :--- | :--- | :--- |
| **Hero heading** | `DM Serif Display` | **56–64px** | 36–44px | Regular 400; line-height `1.08–1.12` |
| **Section headings** | `DM Serif Display` | **32–40px** | 26–30px | Regular 400; line-height `1.15–1.25` |
| **Promotional headings** | `DM Serif Display` | **28–36px** | 22–26px | Regular 400; line-height `1.2–1.3` |
| **Product names** | `DM Sans` | **14–16px** | 13–15px | Semibold 600; line-height `1.35–1.45` |
| **Body descriptions** | `DM Sans` | **14–16px** | 13–15px | Regular 400; line-height `1.5–1.65` |
| **Navigation** | `DM Sans` | **13–15px** | 13–14px | Medium 500 / Semibold 600; line-height `1.2` |
| **Product prices** | `DM Sans` | **16–18px** | 15–17px | Bold 700; tabular figures |
| **Buttons** | `DM Sans, 600` | **14–15px** | 13–14px | Semibold 600; tracking `0.02em` |
| **Labels / badges** | `DM Sans, 500–600` | **11–13px** | 10–12px | Medium/Semibold 500–600; tracking `0.08–0.12em` |

### Google Fonts Setup

```css
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display&display=swap');

:root {
  --font-body: 'DM Sans', sans-serif;
  --font-heading: 'DM Serif Display', serif;
}

body {
  font-family: var(--font-body);
}

h1,
h2,
h3,
.editorial-heading {
  font-family: var(--font-heading);
  font-weight: 400;
}
```

### Typography Implementation Rules
- **No All-Caps abuse:** Never render product names, descriptions, or buttons in all-caps.
- **Eyebrows & Badges:** Use uppercase exclusively for short overlines/eyebrows and discount tags with letter spacing `0.08em` to `0.18em`.
- **Display font constraints:** Do not use `DM Serif Display` for body text, inputs, navigation, or buttons. Keep line lengths constrained (max 65–75 characters) to avoid awkward single-word orphans.

---

## 3. Brand Color Palette ("The Flower House")

| Token | Hex | Usage |
| :--- | :--- | :--- |
| `brand-950` | `#0B3B24` | Deep forest tone, top utility bar, primary footer |
| `brand-900` | `#134633` | Primary brand heading color, logo text |
| `brand-800` | `#1C563F` | Button hover and pressed states |
| `brand-700` | `#2F6B4F` | Primary CTA background, active state accents |
| `brand-50` | `#F4F8F4` | Very light botanical wash for card tags and badges |
| `rose-700` | `#C85A78` | Floral secondary accent, eyebrow tags, sale highlights |
| `ivory` | `#FAF6F0` | Warm editorial canvas, review cards, product image backgrounds |
| `surface` | `#FFFFFF` | Product cards, navigation surface, modal dialogs |
| `border` | `#E5E7EB` | Dividers, card edges, input outlines |
| `text-primary` | `#111827` | Primary high-contrast text |
| `text-muted` | `#6B7280` | Subtitles, secondary copy, helper notes |

---

## 4. Architecture & Component Guidelines

1. **Tokens as Single Source of Truth:**
   - Centralize all styling tokens in [`lib/designTokens.ts`](file:///d:/cllient/indianflowers/nexus-ecomm-cms/lib/designTokens.ts) and [`tailwind.config.ts`](file:///d:/cllient/indianflowers/nexus-ecomm-cms/tailwind.config.ts).
   - Avoid scattering arbitrary hardcoded hex codes through components.

2. **Backend & Integration Integrity:**
   - Do not break existing API routes (`/api/products`, `/api/categories`, `/api/orders`, `/api/settings`).
   - Preserve database schemas, MongoDB connection patterns, and authentication sessions.
   - Always ensure fallback handling when DB returns 0 products so the storefront maintains a rich, authentic customer presentation.

3. **Currency Formatting:**
   - Always format monetary values using [`formatCurrency`](file:///d:/cllient/indianflowers/nexus-ecomm-cms/lib/currency.ts).

4. **Verification Step:**
   - Before finishing any frontend or backend task, run `npm run build` inside `nexus-ecomm-cms` to verify 0 TypeScript and bundling errors.
