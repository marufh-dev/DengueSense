# DESIGN.md — DengueSense: Bangladesh Dengue Early Warning & Community Reporting Platform

## 1. Design Philosophy
DengueSense is an open-data environmental intelligence and public-health monitoring platform covering all 64 districts of Bangladesh. Synthesizing the neutral surface discipline of enterprise systems (Oracle), the crisp hairline precision of developer platforms (Vercel), and the tabular numeric rigor of financial-infrastructure interfaces (Stripe), the UI prioritizes **clarity, restraint, high-contrast legibility, and zero decorative clutter**.

Color is treated strictly as a **semantic instrument**, not decoration:
- Neutral alabaster and slate-tinted whites carry 90% of the interface.
- Deep teal-slate (`#0f6b60`) serves as the primary interactive accent.
- Risk colors (`LOW`, `MODERATE`, `HIGH`, `CRITICAL`, `NO DATA`) are reserved exclusively for environmental suitability indicators, map polygons, and status badges.

---

## 2. Color Palette & Semantic Roles

### Surfaces & Borders
| Token | Hex | Role |
|---|---|---|
| `--bg-canvas` | `#f7f9f8` | Main application background |
| `--bg-surface` | `#ffffff` | Cards, panels, modals, table rows |
| `--bg-subtle` | `#eff3f1` | Secondary containers, table headers, hover fills |
| `--border-hairline` | `#dce3e0` | Card borders, dividers, panel edges |
| `--border-strong` | `#b8c4bf` | Input borders, active outlines |

### Ink & Typography
| Token | Hex | Role |
|---|---|---|
| `--ink-primary` | `#10201d` | Headings, primary data values |
| `--ink-secondary` | `#3a4f4b` | Body copy, labels |
| `--ink-muted` | `#627571` | Captions, metadata, timestamps |

### Brand & Interactive Accent
| Token | Hex | Role |
|---|---|---|
| `--accent-primary` | `#0f6b60` | Primary buttons, active nav, links |
| `--accent-hover` | `#0b534a` | Button/link hover state |
| `--accent-soft` | `#e6f2f0` | Active nav pill, subtle highlights |
| `--focus-ring` | `#0f6b60` | 2px solid keyboard focus outline |

### Semantic Risk Scale (Strictly for Risk & Map)
| Level | Text / Stroke | Surface Fill | Border | Meaning |
|---|---|---|---|---|
| `LOW` | `#166534` | `#ecfdf5` | `#a7f3d0` | Environmental suitability 0–29 |
| `MODERATE` | `#92400e` | `#fffbeb` | `#fcd34d` | Environmental suitability 30–54 |
| `HIGH` | `#9a3412` | `#fff7ed` | `#fdba74` | Environmental suitability 55–74 |
| `CRITICAL` | `#991b1b` | `#fef2f2` | `#fca5a5` | Environmental suitability 75–100 |
| `NO DATA` | `#475569` | `#f1f5f9` | `#cbd5e1` | Missing or stale environmental data |

---

## 3. Typography & Font Hierarchy
- **Primary Sans:** `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- **Monospace (codes, coordinates, timestamps):** `'JetBrains Mono', ui-monospace, SFMono-Regular, monospace`
- **Tabular Numerals:** `font-variant-numeric: tabular-nums` MUST be applied to all KPI metrics, risk scores, temperatures, rainfall figures, dates, and table columns.

| Role | Size | Weight | Line Height | Tracking |
|---|---|---|---|---|
| Page Title (`h1`) | `1.5rem` (24px) | `600` | `1.25` | `-0.02em` |
| Section Heading (`h2`) | `1.125rem` (18px) | `600` | `1.35` | `-0.01em` |
| Card Title (`h3`) | `0.9375rem` (15px) | `600` | `1.4` | `0` |
| Body | `0.875rem` (14px) | `400` | `1.5` | `0` |
| Caption / Meta | `0.75rem` (12px) | `500` | `1.4` | `0.01em` |
| KPI Figure | `1.75rem` (28px) | `600` | `1.1` | `-0.02em` |

---

## 4. Spacing, Radius & Elevation
- **Base Grid:** `4px` (`--space-1: 4px`, `--space-2: 8px`, `--space-3: 12px`, `--space-4: 16px`, `--space-6: 24px`, `--space-8: 32px`).
- **Border Radius:** Restrained — `6px` for buttons/inputs, `8px` for cards/panels, `9999px` only for compact status pills. Never use `16px+` rounded cards.
- **Elevation:** Flat hairline borders (`1px solid var(--border-hairline)`) are preferred over drop shadows. Subtle shadow (`0 1px 3px rgba(16, 32, 29, 0.06)`) only on floating map controls, dropdowns, and modals.

---

## 5. Layout & Navigation
- **Top Navigation Bar:** Sticky `56px` height, white surface, bottom hairline border. Brand mark (`DengueSense`) on left, primary route links in center/left (`Dashboard`, `Risk Map`, `Community`, `Submit Report`, `My Alerts`, `Methodology`, `About`, plus `Moderation` for authorized roles), auth/role actions on right. Mobile (`< 900px`) collapses cleanly into a hamburger drawer.
- **Max Content Width:** `1360px` centered with `24px` desktop padding (`16px` mobile).
- **Map Workspace:** Split-view on desktop (interactive Leaflet map ~65% width + sticky District Detail drawer ~35% width), stacked vertically on mobile.

---

## 6. Components & Interaction States

### Buttons
- `36px` height (`40px` on mobile touch targets), `6px` radius, `13px`–`14px` medium weight (`500`).
- Variants: `primary` (solid `#0f6b60`, hover `#0b534a`), `secondary` (white + hairline border), `danger` (solid `#b91c1c` for reject/delete), `ghost` (transparent, `#eff3f1` hover).
- Disabled state: `opacity: 0.5`, `cursor: not-allowed`. Loading state: inline spinner + disabled pointer events.

### Cards
- White background (`#ffffff`), `1px solid var(--border-hairline)`, `8px` radius, `16px`–`20px` padding.

### Inputs & Selects
- `38px` height, `1px solid var(--border-strong)`, `6px` radius, `#ffffff` fill.
- Clear `:focus-visible` ring (`2px solid var(--focus-ring)` with `2px` offset).
- Validation error state: `#991b1b` border and inline error message below the field.

### Tables
- Compact `10px 12px` cells, `#eff3f1` header row with uppercase `11px` muted labels, `1px` bottom dividers, `tabular-nums`, horizontal scroll wrapper on mobile.

### Modals
- Centered overlay (`rgba(16, 32, 29, 0.45)` backdrop), max-width `520px`, `8px` radius, white surface, `Escape` key and close button support.

### Risk Indicators & Map Legend
- **Risk Badges:** Compact pill (`4px 10px`, `9999px` radius, `12px` semibold) always pairing semantic color with explicit text label (`LOW`, `MODERATE`, `HIGH`, `CRITICAL`, `NO DATA`).
- **Map Legend:** Floating bottom-left card inside the Leaflet container listing all 5 risk states with exact score thresholds (`0–29`, `30–54`, `55–74`, `75–100`, `Missing/Stale`) and distinct `NO DATA` slate styling (`#94a3b8` fill with `#475569` border).

### Charts (Recharts)
- Clean horizontal dashed gridlines (`#e2e8e6`), muted axis labels (`11px`), crisp `2px` stroke lines, interactive tooltip with white surface and hairline border. No 3D effects or heavy area gradients.

---

## 7. Responsive Behavior & Accessibility
- **Breakpoints:** Desktop (`>= 1024px`), Tablet (`768px–1023px`), Mobile (`< 768px`).
- **WCAG AA Contrast:** Minimum `4.5:1` for body text, `3:1` for UI/map borders.
- **Color Independence:** Never convey risk solely by color; always pair with text label and numeric score.
- **Keyboard Navigation:** Full Tab/Enter/Escape support with visible `:focus-visible` outlines.
- **Empty & Error States:** Explain *why* data is missing (e.g., `"No environmental observations recorded for this period"`) and provide a retry or clear guidance.

---

## 8. Design Do's and Don'ts
- **DO** visually distinguish `NO DATA` (cool slate) from `LOW` risk (emerald green).
- **DO** display data freshness timestamps and Open-Meteo / geoBoundaries source attribution on analytical views.
- **DO** keep Environmental Dengue Suitability Index (EDSI) visually separate from Community Signal Score.
- **DON'T** use neon gradients, glassmorphism, oversized hero banners, or decorative animations.
- **DON'T** label environmental suitability scores as "dengue infection probability" or "confirmed outbreak predictions."
