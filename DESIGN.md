---
name: บ้านบรู Dashboard
description: Standard-issue sales analytics for a five-branch coffee chain, set in the café itself at two times of day.
colors:
  chart: "#95562a"
  chart-soft: "#b38763"
  chart-bar: "#a8673a"
  on-chart: "#fff8ee"
  bar-muted: "#e6d9c6"
  canvas: "#f3ede3"
  surface: "#fffbf5"
  surface-hover: "#f9f2e8"
  surface-selected: "#f2e8da"
  line: "#e8ddcd"
  line-strong: "#d4c4ad"
  ink: "#2a1b12"
  ink-subtle: "#6b5646"
  ink-muted: "#7c6756"
  up: "#2f6a3c"
  up-bg: "#e3efdf"
  down: "#9a3420"
  down-bg: "#f8e2d9"
  water: "#e2ddd3"
  water-ink: "#7a7266"
  gold: "#b9783f"
  gold-hi: "#e3b07a"
  gold-lo: "#7a4520"
  wordmark: "#2a1b12"
  dark-canvas: "#110b07"
  dark-surface: "#1b130d"
  dark-surface-hover: "#231910"
  dark-surface-selected: "#2a1e14"
  dark-line: "#2f2319"
  dark-line-strong: "#473629"
  dark-ink: "#f4eadc"
  dark-ink-subtle: "#c0ad98"
  dark-ink-muted: "#9d8a76"
  dark-chart: "#e0a76a"
  dark-chart-soft: "#8f6d4f"
  dark-chart-bar: "#d3965a"
  dark-on-chart: "#1f1209"
  dark-bar-muted: "#3a2b20"
  dark-up: "#9dd4a7"
  dark-up-bg: "#15271a"
  dark-down: "#f0a08f"
  dark-down-bg: "#321812"
  dark-water: "#1d1610"
  dark-water-ink: "#7d6c5c"
  dark-gold: "#e0a76a"
  dark-gold-hi: "#f6d4a6"
  dark-gold-lo: "#8a5428"
  dark-wordmark: "#f4eadc"
  crema-deep: "#5a3418"
  crema-dark: "#7d4a24"
  crema-mid: "#c98b52"
  crema-light: "#ebc596"
  crema-shine: "#fae6c8"
  band-ink: "#f8efe2"
  band-eyebrow: "#ebcfa8"
  roast-1: "#ecd8bb"
  roast-2: "#d6ae7d"
  roast-3: "#b47a46"
  roast-4: "#8a4f26"
  roast-5: "#4f2a13"
  dark-roast-1: "#3b2a1d"
  dark-roast-2: "#63432a"
  dark-roast-3: "#94643a"
  dark-roast-4: "#c98f55"
  dark-roast-5: "#f0c48c"
  dot: "#cdb399"
  dot-hi: "#8a3c12"
  dark-dot: "#7a5a45"
  dark-dot-hi: "#f5bd7c"
typography:
  display:
    fontFamily: "Trirong, Anuphan, Noto Serif Thai, serif"
    fontSize: "clamp(36px, 6vw, 80px)"
    fontWeight: 600
    lineHeight: 1.08
  sentence:
    fontFamily: "Trirong, Anuphan, Noto Serif Thai, serif"
    fontSize: "clamp(26px, 3.4vw, 44px)"
    fontWeight: 500
    lineHeight: 1.32
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Trirong, Anuphan, Noto Serif Thai, serif"
    fontSize: "23px"
    fontWeight: 600
    lineHeight: 1
  numeral:
    fontFamily: "Fraunces, Trirong, Georgia, serif"
    fontSize: "30px"
    fontWeight: 300
    lineHeight: 1
    fontFeature: "tnum"
  metric:
    fontFamily: "Fraunces, Trirong, Georgia, serif"
    fontSize: "32px"
    fontWeight: 400
    lineHeight: 1.25
    letterSpacing: "-0.025em"
    fontFeature: "tnum"
  title:
    fontFamily: "Anuphan, Noto Sans Thai, Leelawadee UI, Tahoma, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.43
  body:
    fontFamily: "Anuphan, Noto Sans Thai, Leelawadee UI, Tahoma, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Anuphan, Noto Sans Thai, Leelawadee UI, Tahoma, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.33
  eyebrow:
    fontFamily: "Anuphan, Noto Sans Thai, Leelawadee UI, Tahoma, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    letterSpacing: "0.04em"
rounded:
  md: "6px"
  lg: "8px"
  xl: "12px"
  card: "16px"
  band: "24px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
components:
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.card}"
    padding: "16px 20px"
  top-bar:
    padding: "12px 0"
  top-bar-scrolled:
    backgroundColor: "{colors.canvas}"
  section-band:
    backgroundColor: "{colors.dark-surface}"
    textColor: "{colors.band-ink}"
    rounded: "{rounded.band}"
    height: "clamp(280px, 34vw, 420px)"
  select:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    height: "32px"
    padding: "0 32px"
  select-hover:
    backgroundColor: "{colors.surface-hover}"
  segmented:
    backgroundColor: "{colors.canvas}"
    rounded: "{rounded.lg}"
    padding: "2px"
  segmented-option:
    textColor: "{colors.ink-subtle}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    height: "28px"
    padding: "0 10px"
  segmented-option-active:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
  metric-tab:
    textColor: "{colors.ink-subtle}"
    rounded: "{rounded.lg}"
    padding: "10px 12px"
  metric-tab-hover:
    backgroundColor: "{colors.surface-hover}"
  metric-tab-selected:
    backgroundColor: "{colors.surface-selected}"
    textColor: "{colors.ink}"
  story-card:
    backgroundColor: "{colors.surface}"
    rounded: "18px"
    padding: "20px 22px"
    width: "360px"
  coffee-clock:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.card}"
    width: "360px"
  roast-calendar:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.card}"
  pour-bar:
    backgroundColor: "{colors.bar-muted}"
    rounded: "{rounded.full}"
    height: "10px"
  fill-cup:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.chart}"
    size: "32px"
  change-badge-up:
    backgroundColor: "{colors.up-bg}"
    textColor: "{colors.up}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "2px 6px"
  change-badge-down:
    backgroundColor: "{colors.down-bg}"
    textColor: "{colors.down}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "2px 6px"
  change-badge-flat:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink-subtle}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "2px 6px"
  definition-tooltip:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.surface}"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    padding: "8px 12px"
    width: "240px"
  chart-tooltip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "10px 12px"
---

# Design System: บ้านบรู Dashboard

## Overview

**Creative North Star: "Roast & Linen"**

The analytics layout is still the Shopify-standard one (period and branch pickers, four metric tabs driving one chart, then branches and menu items), and it stays that way on purpose. The identity is the café itself. **The two themes are two times of day in the same shop:** light is a Bangkok morning at the pour-over bar (linen, cream plaster, morning sun), and dark is night in the roastery (espresso brown, teak, amber lamps). The section-band photos, the roast calendar's shades and the story's dot colours all switch with the theme, so changing the theme changes the hour, not just the colors.

The main colour is *crema*, the caramel of espresso foam, in place of the old metallic gold. Green and red still mean only change.

The theme is set before first paint by a script in `index.html`. It uses the saved choice (`localStorage: baanbrew-theme`) or, if there is none, the current Bangkok time: 06:00–17:59 is light, anything else is dark. Tokens in `@theme` are the light values; `:root[data-theme="dark"]` (and `.theme-dark` for always-dark islands) remaps them (the `dark-*` entries above). `<meta name="theme-color">` is #110b07.

**Key Characteristics:**
- Warm, brown-tinted neutrals in both themes: linen canvas #f3ede3 with cream cards #fffbf5 by day; espresso canvas #110b07 with #1b130d cards by night.
- The overview opens with a scroll-driven story in which one dot is one real bill, then one large Trirong sentence written from the live numbers, under a slim sticky top bar.
- Crema gradients (`--gm-*`, `--lg-*`, `--gold-fill`) on primary buttons, bars, the chart line and the clock, never a flat tan.
- Three typefaces with fixed jobs: Trirong for display and the wordmark, Fraunces (light) for big figures, Anuphan for everything else.
- Coffee-specific visualizations: a coffee clock, a roast calendar, filling cups for the top menu, branch bars that pour and crema under the trend line, next to plainer analytical charts (branch rhythm ridgelines, a menu-engineering scatter).
- All imagery is AI-generated decoration. Every number comes from the CSVs, and the last section band says so. Story claims can be rechecked in Excel step by step (`docs/VERIFY.md`).

### Data findings
The story and the analytical cards show only patterns that are actually in the data. Basket pairing and attach-rate charts were deliberately not built: category lift is about 0.6 for every pair and bakery attach is flat at about 14% across hours, so there is no signal to show. Members vs walk-ins and in-store vs delivery have near-identical average bills, so they are not story steps either.

## Brand

### Logo
`src/components/Logo.jsx`, with `LogoMark` as the mark alone and `Logo` as the lockup. The mark has two elements: a solid coin split top to bottom by a coffee bean's S-shaped crease (บรู), under one thin roofline (บ้าน). It is built as a single SVG mask (coin, minus the crease, plus the roof), so the foil gradient (`gold-hi` → `gold` → `gold-lo` → `gold` → `gold-hi`, theme-aware, now caramel) and the glint flow across both parts as one surface. The glint sweeps across once on load and again on hover. The lockup sits at the left of the top bar and uses tokens: a 36–40px mark, the wordmark "บ้านบรู" in Trirong 600, 21 to 23px, in `wordmark` (dark roast ink by day, cream by night), and "BAAN BREW · EST. 2023" under it at 9px, uppercase, 0.3em tracking (Latin only), in `ink-subtle`. "Est. 2023" is the opening date of the first branch (สยาม, 2023-06-01, from `branches.csv`). `public/favicon.svg` is the same mark with fixed colours (the dark-theme crema stops on an espresso #1b130d tile), scaled to 87.5% with a thicker roof and crease so it reads at 16px. If the shape changes, update both files.

### Media (AI-generated)
`scripts/media/gen.mjs` submits jobs to fal.ai's queue API (`node --env-file=.env scripts/media/gen.mjs <model> <outDir> <jobs.json>`, key in `FAL_KEY`), polls until done, and saves the results. Local `*_url` inputs are sent as data URIs. The output lives in `public/media/`:
- `band-morning` / `band-dusk`, `band-regulars-morning` / `band-regulars-dusk`, `origin`: `.webp` section photos, each with a `-sm` version for screens up to 700px.

### Theme switch
The sky/night day-night switch (`.dn-switch`, drawn at 150×66px and shrunk with `zoom: .5`), unchanged in look. Toggling now runs a View Transition: the new theme grows as a circle from the pointer position (or the switch centre) to fill the screen (`vt-reveal`, 1000ms, `--ease-in-out`, origin passed as `--vt-x` / `--vt-y`). Browsers without `document.startViewTransition`, and reduced motion, switch instantly. The choice is saved to `localStorage` when storage is available.

### Replay card band
The Replay card's title bar is now a photo of the bar at night (`band-dusk-sm.webp`, 80% opacity) on #110b07 with a left-to-right #110b07 fade, closed by a full-opacity `.gold-rule`. It carries `.theme-dark`, so the speed control and close button use the dark tokens in light mode too. The title "ย้อนดูการเติบโต" is Trirong in `.gold-text` (the crema gradient with an 8-second sheen); the current-week date uses `.gold-text-data`, built from the theme-aware `--lg-*` stops so it stays readable on linen.

## Colors

### Primary
- **Crema** (`chart`): the solid accent for text highlights, legend swatches, the selected clock hour and the focus ring. #95562a (medium roast) by day, dark enough for lines and text on linen; #e0a76a (amber) by night.
- **Crema gradients**: `--gm-deep/dark/mid/light/shine` (#5a3418 → #fae6c8) build `--gold-metal` (wordmark-style text, `.gold-text`) and `--gold-hairline` (card top edge, `.gold-rule`). `--gold-fill` is the fill under text: a darker caramel by day (#8f4f24 → #c98450), a lighter one by night (#c98a52 → #f2cc9c). Every `.bg-chart` and `.bg-chart-bar` element gets `--gold-fill` automatically. Charts use `--lg-*` stops: deeper by day (#6e3c1c → #cf8f5c) so the bright end does not vanish on linen, equal to `--gm-*` by night.
- **Soft Crema** (`chart-soft`): the previous-period line, always dashed.
- **Bar Muted** (`bar-muted`): de-emphasized bars and the empty pour-bar track.
- **On crema** (`on-chart`): #fff8ee by day, #1f1209 by night.

### Neutral
Warm, brown-tinted neutrals with the same roles as before: canvas, surface, surface-hover, surface-selected, line, line-strong, ink, ink-subtle, ink-muted. Ink is dark roast #2a1b12 by day and cream #f4eadc by night.

### Section bands
Bands are always dark photos, whatever the theme: an espresso scrim (`rgb(17 11 7)` at 78% fading out to the right, plus 55% from the bottom), cream text #f8efe2 / #f6ecdf, and a latte eyebrow #ebcfa8.

### Story dots
`--dot` / `--dot-hi` colour the bill dots in the story: a pale latte #cdb399 with a deep roast #8a3c12 highlight by day, a dim brown #7a5a45 with an amber #f5bd7c highlight by night. The highlight marks the subset the step is about and is always named in the key above the plot.

### Roast scale
`--roast-1..5` shade the roast calendar. By day they run light roast #ecd8bb → dark roast #4f2a13 (more sales = darker); by night the scale is inverted, #3b2a1d → #f0c48c (more sales = brighter crema). A day with no sales is a transparent cell with a line-coloured inset ring.

### Change (semantic only)
Up green and down red, softened and warmed. They are used only for change.

### Named Rules
**The Crema Rule.** The accent is caramel, not metal. Fills under text use `--gold-fill`; chart marks use the `--lg-*` stops; nothing uses a flat tan where a crema gradient is expected.

**The Two Hours Rule.** Light and dark are the same café at different times. Anything with imagery or lighting (section bands, story dots) must have a version for each theme or be neutral to both (`origin`).

**The Change-Only Color Rule.** Green and red mean went up and went down, nothing else.

## Typography

**Display Font:** Trirong 500/600/700 (Google Fonts): wordmark, data headline, section-band titles, Replay title
**Numeral Font:** Fraunces 300/400 (optical size 9–144): big figures (KPI values, headline numbers, roast-calendar day, clock centre) and rank numbers
**Body Font:** Anuphan 400–700 (with Noto Sans Thai, Leelawadee UI, Tahoma, sans-serif)

**Character:** A Thai serif speaks for the café, a light magazine-style serif sets the headline numbers, and a modern Thai/Latin sans does all the work. Inside cards, hierarchy stays in small size and weight steps, as in admin tooling.

### Hierarchy
- **Display** (Trirong 600, `clamp(36px, 6vw, 80px)`, line-height 1.08): section-band titles.
- **Story title** (Trirong 600, `clamp(28px, 3vw, 38px)`, line-height 1.2): "ห้าสาขา คนละจังหวะ" on the first story card. Story card text is 16px (15px on phones), line-height 1.7.
- **Sentence** (Trirong 500, `clamp(26px, 3.4vw, 44px)`, line-height 1.32, -0.01em, max 34ch, balanced): the data headline, in `ink-subtle` with names in 600 `ink` and numbers in Fraunces 400 crema.
- **Headline** (Trirong 600, 21px / 23px from 640px, `wordmark`): the wordmark "บ้านบรู". " Dashboard" is kept for screen readers only.
- **Numeral** (Fraunces 300, tight tracking, tabular): clock centre 30px, roast-calendar day 26px.
- **Eyebrow** (500, 13px, 0.04em): above band titles.
- **Metric** (Fraunces 400, 26px mobile / 32px from 640px, tight tracking, tabular): KPI values in the metric tabs.
- **Title** (600, 14px): card titles such as "ยอดขายแยกสาขา", "เมนูขายดี", "นาฬิกากาแฟ", "จังหวะของแต่ละสาขา", "เมนูไหนทำเงินจริง".
- **Body** (400 to 500, 13px): the working size. Band body text is 15px.
- **Label** (500, 12px): change %, segmented options, table headers, legend, axis ticks, captions.

### Named Rules
**The Thai Tracking Rule.** Thai text never gets wide letter-spacing; spread tracking pulls vowels and tone marks off their consonants. Eyebrows stop at 0.04em. Only the Latin "BAAN BREW · EST. 2023" line is tracked wide (0.3em). Masked line reveals (`.reveal-line`) pad 0.2em above each line so Thai marks are not clipped.

**The Tabular Figures Rule.** Every number that can be compared (KPIs, table cells, tooltip values, change %, big numerals) uses tabular numerals.

**The Numbers Stay Out Of Trirong Rule.** Trirong never sets a figure; even inside the Trirong data headline, money and the peak hour switch to Fraunces. Big figures are Fraunces; every other number, label and control is Anuphan.

**The Unbroken Name Rule.** Names and numbers in the data headline are `em`s with `white-space: nowrap`, because the browser's Thai word breaker does not know branch or menu names.

## Layout

A single centred column, max 1152px wide, with 16px side gutters (24px from 640px), under a sticky top bar. Main content starts 24px below the bar. Sections stack with a 16px rhythm.

- **Top bar** (`.top-bar`, `<header>`): sticky, 12px vertical padding. Logo · the page Segmented (ภาพรวม, ลูกค้า, Lab 2.2, สด · Firestore, ทดสอบ Rules), centred from 1024px · "ข้อมูลล่าสุด … · 5 สาขา" in 13px subtle text from 1280px · the theme switch. At the top of the page it is transparent; once scrolled past 8px (`useScrolled`) it fades (300ms) to an 84% canvas fill with `blur(14px) saturate(1.3)` and a 1px line underneath. Under 1024px the tab row wraps to its own full-width line, scrolls sideways and keeps the selected tab in view. Changing tab smooth-scrolls back to the top. A ResizeObserver in `App.jsx` writes the bar's real height to `--bar-h` (it is two lines on phones), so the story's sticky stage sits exactly under it.
- **Overview tab:** Bill story → data headline → filter row (two selects, comparison caption, Replay button) → Replay card (when open) → Trend card → Branch rhythm card → Coffee clock and Roast calendar side by side from 1024px (1 : 1.4) → section band "ห้าสาขา / หนึ่งรสมือ" → Branch card and Top menu card side by side from 1024px → Menu matrix card. Everything outside the side-by-side pairs is full width.
- **Customers tab** opens with the band "แก้วประจำ / ของคนประจำ".
- **Every page** ends with the tall `origin` band "จากดอยทางเหนือ / ถึงแก้วในกรุงเทพฯ", then the footer.

Card internals use 16px padding, rising to 20px horizontally from 640px. The main chart is 320px tall.

## Elevation & Depth

Depth is tonal and soft. Cards separate from the canvas by the surface fill, a 1px crema hairline along the top edge (`.card-sheen`), and `--shadow-card`. Floating layers (chart tooltips, the definition tooltip, select lists) use one stronger diffuse shadow. Band imagery sits flat inside rounded frames, with no shadow. The scrolled top bar separates with a 1px line, not a shadow.

### Shadow Vocabulary
- **Card, light** (`0 1px 0 0 rgb(60 35 15 / 0.04), 0 8px 24px -16px rgb(60 35 15 / 0.25)`): a warm, low drop.
- **Card, dark** (`0 0 0 1px rgb(255 230 200 / 0.05), 0 12px 30px -18px rgb(0 0 0 / 0.8)`): a faint warm ring plus a deep drop.
- **Control edge** (`0 1px 0 0 rgb(0 0 0 / 0.05)`): selects and the Replay button.
- **Popover** (`0 4px 16px rgb(0 0 0 / 0.12), 0 0 0 1px rgb(0 0 0 / 0.06)`): chart tooltips.

### Named Rules
**The Hairline Rule.** Resting surfaces get the card shadow and nothing heavier. A stronger shadow means the layer is floating and temporary.

## Shapes

Soft, consistent rounding that grows with size: section bands 24px, cards 16px (`--radius-card`), branch rows 12px, story cards 18px, controls, metric tabs and tooltips 8px, segmented options, change badges, skeletons and wall-calendar days 6px, roast-strip cells 3px, bars and indicator strokes fully round. Borders are 1px and used sparingly: on selects and as internal dividers and table rules. Cards have no border.

## Components

### Bill Story (ห้าสาขา คนละจังหวะ)
`story/BillStory.jsx`, with dot positions from `story/layouts.js` and every figure from `src/lib/story.js`. It sits at the top of the Overview and always covers the whole dataset and all branches. Rows are grouped into bills (unique `order_id`, ≈34.8k) sorted by time; each bill is one square on a `<canvas>` (`aria-hidden`). Dot *i* is the same bill in every step (object constancy), so a step changes the grouping, never the data. Seven steps:
1. **Mass:** all bills in one phyllotaxis disc; the title card states the bill and line counts and the date span.
2. **Branch:** one row per branch (ordered by bill count), dots packed into a bar whose length is the bill count; row labels give the branch type and count.
3. **Hour:** a unit histogram per branch by hour; bills before 10:00 are highlighted (office vs malls, peak hours).
4. **Weekday:** the same by จ–อา; weekend bills are highlighted (weekend revenue per day vs weekdays).
5. **Month:** by month; the newest branch (อารีย์) is highlighted, with the share of its members who had never bought at another branch before it opened.
6. **Month again:** มหาวิทยาลัย's May bills are highlighted (bills per day in May vs other months).
7. **Holiday:** each Thai public holiday against its matched normal day (the same weekday a week later, or a week earlier if that is a holiday or past the data); two columns per branch, and every other bill fades out where it stands. An outro line closes the story.

All columns in a step share one dot size, so heights compare directly across branches. The stage is `position: sticky` under the top bar (`top: var(--bar-h)`, the rest of the viewport tall); the step list is pulled up over it and each step is one viewport tall, so the frosted cards (surface at 88%, `blur(10px)`, card shadow, 360px max on the left; full width at the bottom on phones) scroll over the plot. An IntersectionObserver with a `-48%` root margin makes the card crossing mid-screen active; inactive cards dim to 35%. A key above the plot reads "1 จุด = 1 บิล" plus the highlight's name. Dots move over 1100ms (cubic in-out) with a left-to-right sweep of up to 380ms by target x plus a small per-dot stagger; size eases over the full span; the highlight and fade-out/in run separately over 700ms. On first load the dots gather from random positions. Reduced motion and resizes jump straight to the new layout; the canvas redraws on theme change. Every number in the card text comes from a `story.js` function (`buildBills`, `hourProfiles`, `weekProfiles`, `monthlyBillsPerDay`, `newBranchNewcomers`, `monthOfYearRatio`, `holidayMatches`, `holidayComparison`), so the text tells the same story without the picture.

**Copy voice:** step text is written the way people talk, not report-style: topic first, short clauses, spoken times ("8 โมงเช้า", "4 โมงเย็น", "บ่าย 2 โมง" via `spokenHour`), "เสาร์–อาทิตย์ / วันธรรมดา", "วันหยุดราชการ". Numbers and their units are kept on one line (non-breaking space / `whitespace-nowrap`).

**Collapse after watching:** once the reader has reached step 6 or 7 and scrolls the end of the story under the sticky bar, the stage unmounts and a recap card replaces it: the title, a "ดูเรื่องนี้อีกรอบ" button and the five headline numbers (Silom before 10:00, Silom weekend ratio vs mall multiplier, Ari newcomers, University in May, mall holiday multiplier). The page is scrolled by the height difference in the same frame, so nothing on screen moves. Jumping past without reading does not collapse it. The state lives in `sessionStorage` (`baanbrew-story-seen`): switching tabs keeps it collapsed, a fresh visit shows the full story. Replay clears it and scrolls to the first step.

### Branch timeline (Replay) in 3D

- **Invitation card** (`.replay-cta` in `App.jsx`): replaces the small "ย้อนดู N เดือน" pill, which reviewers never clicked. A dark dusk-photo banner with a 56 px pulsing play button, the title "ดูบ้านบรูโตขึ้นทีละอาทิตย์", the month count, the branch count and the play length (computed from `MS_PER_WEEK`), and a small CSS-3D preview of one column per branch (height = all-time revenue) that slowly orbits. Phones hide the preview.
- **3D map** (`ReplayMap` in `ReplayCard.jsx`, pure CSS 3D, no library): the flat SVG map (river, scale bar, glow, opening ripple) becomes a floor tilted 56°; each branch is a square column (four side faces + top, `--h` = height) whose height is its 28-day average daily sales. The camera is tilted 42° and rotates from −18° to −8° as the timeline plays. A "3 มิติ / มองจากด้านบน" toggle flies the camera (900 ms CSS transition) to a flat top view where the columns flatten to squares whose size encodes the same value, like the old 2D circles. The map has its own tokens (`--map-floor`, `--map-edge`, `--map-water` blue-grey, `--map-water-ink`) so the river stays visible in the dark theme. The floor is 2.2× the map (`BLEED` 60% each side, same projection, so the river simply continues) and the `.r3d` frame fades it into the card on all four sides with an intersected edge mask, so neither the plate edge nor the frame edge shows. The mask sits on the perspective frame, not the `preserve-3d` floor, so the columns stay 3D.
- **Labels** live in 2D on top of the scene: after every frame the top face's `getBoundingClientRect()` (which already includes the 3D projection) gives the anchor, and `placeLabels()` tries positions near to far, keeping the least-overlapping one, with a dotted leader line when a label had to move. Siam, University, Silom and Ari sit within a few km of each other, so this is what keeps them readable.

### Customers story: member lifelines

`CustomersStory.jsx` with `customers/MemberLifelines.jsx` and `customers/CohortGrid.jsx`; every figure from `src/lib/journeys.js`. It deliberately does not reuse the Overview's dot story: the Overview is a guided scroll story about bills, this tab is an explorable about people over time.
- **Lifelines (canvas):** one 1-px-ish row per member who has bought (sorted by first purchase), a faint line from first to last bill, and one tick per bill (`--life-tick` / `--life-line`). The diagonal left edge is everyone's first purchase; dense rows reaching the right edge are regulars, rows that stop are members who left. It sweeps in left to right once.
- **Group cards = filters:** "คนที่เคยซื้อ", top 20% by spend, one-time buyers, not seen for 90 days, single-branch buyers. The pressed card highlights its rows in `--dot-hi` and dims the rest (450 ms alpha tween); a caption under the chart explains the group in one spoken sentence.
- **Loupe:** pointing (tap on phones) at a row shows the 21 rows around it magnified plus that member's id, home branch, bills, spend, first/last date and active status. Docked under the chart on phones.
- **Cohort grid (HTML table):** first-purchase month × months since, cell = share with a bill that month, five roast levels; cells for the incomplete last month are hatched and excluded from the headline averages.
- **Win-back card:** lapsed members (with the median bills they had) and members who signed up but never bought; its button selects the lapsed filter and scrolls to the chart.
- Age, gender and the earlier summary numbers stay in "ตัวเลขละเอียด".

### Data Headline (`DataHeadline.jsx`)
The overview opens with one sentence (`.data-headline`, Sentence type) written from the live numbers: the range and "บ้านบรู" or the branch, revenue (counts up over 1100ms), the change against the previous period ("เพิ่มขึ้น/ลดลง x%" in up/down colour, "เท่าเดิม" under 0.05%), the leading branch or the selected branch's rank ("อันดับ n จาก 5 สาขา"), the top-earning menu item, and the peak hour. Parts with no data drop out; a range with no sales reads "… ยังไม่มียอดขาย". Each part fades up 14px (800ms, 90ms apart), and the whole sentence is keyed by range and branch, so it replays on every change.

### Section Band (`SectionBand.jsx`)
A rounded, always-dark photo band (280–420px tall, `tall` 340–560px) with a big Trirong title, an optional eyebrow and 15px text. Layers: photo → espresso scrim → `.grain` (an SVG noise tile at 9% overlay, shifted in 3 steps) → copy. `images` is `{ light, dark }` or one name for both themes; the image crossfades in when it changes, and the `-sm` file loads up to 700px. The image is decorative (`alt=""`); the title is the content. The photo moves at a different speed from the page: scroll writes `--p` to the element (`useScrollVar(ref, "through")`) with no React re-render. Copy reveals when 35% is visible: eyebrow fades up, title lines slide up out of a mask, text follows 350ms later.

### Selects (period and branch pickers)
A custom listbox (`Select` in `ui.jsx`). The trigger is a 32px button with 8px corners, a 1px strong-line border (crema while open), surface fill, 13px medium ink text, a leading 16px outline icon (calendar or café) and a trailing chevron that turns 180° when open. The list is a surface popover that fades in, drops 4px and scales up from 97% (180ms) and fades out faster (120ms). Keyboard follows the WAI-ARIA listbox pattern.

### Segmented Control
Used for the page tabs, chart granularity (วัน / สัปดาห์ / เดือน), the clock unit (แก้ว / ยอดขาย) and Replay speed. A canvas track with 2px inset; options are 28px, 12px medium text. A single surface chip with the card shadow slides to the chosen option (300ms). Disabled options fade to muted ink at half opacity.

### Cards
- **Corner Style:** 16px.
- **Background:** surface on canvas, with a crema hairline along the top (`.card-sheen`).
- **Shadow Strategy:** `--shadow-card` only.
- **Border:** none outside; line-coloured rules divide internal regions.
- **Internal Padding:** 16px, 20px horizontal from 640px. Headers carry a 14px semibold title and an optional 13px subtle subtitle.

### Metric Tabs (signature)
The four KPIs are buttons. Each shows a 13px medium label with a dotted underline (the affordance for its definition tooltip), a Fraunces 26 to 32px tabular value that counts to new values, inline change %, and a `Sparkline` under it: the selected range at the chart's granularity, a 22px-tall SVG line (`.sparkline`, soft crema 1.5px, crema 2px when selected) over a faint crema area, drawing in over 1100ms. It is decoration (`aria-hidden`); the real numbers live in the main chart. Hover fills surface hover; selected fills surface selected and shows a 2px round crema bar along the bottom. Selecting a tab swaps the main chart's metric.

### Change Indicator
Arrow icon plus absolute % in 12px medium tabular text. Up is green, down is red, anything under 0.05% is flat (subtle, no arrow). The badge variant adds a 6px-radius tint. A screen-reader word ("เพิ่มขึ้น", "ลดลง", "คงที่") precedes the number. With no comparison it reads "ไม่มีข้อมูลเทียบ".

### Trend Chart
A Recharts `ComposedChart`, 320px tall. Horizontal gridlines only; y-axis on round ticks. Current period: a 2.5px line stroked with the `--lg-*` gradient (soft glow by night via `.gold-line`), active dot 5px with a 3px surface ring. Under it, a **crema area**: `chart` at 32% opacity at the line, fading to 0 at the axis. When the moving average is on, the area follows the average. Previous period: soft crema, dashed 4 4. Incomplete buckets: dotted 2 4. Each time the chart is rebuilt (metric, range, branch or granularity), the line and area reveal left to right through a CSS `clip-path` (`.trend-draw`, 1400ms) with Recharts' own animation off; axes and grid appear at once.

### Branch Rhythm (จังหวะของแต่ละสาขา)
`BranchRhythmCard.jsx`, drawn in SVG with `d3-shape` (monotone curves). It follows the period filter but always shows all branches. Left: a ridgeline (joy plot) of % of each branch's bills per hour, 06:00–22:00, one row per branch ordered by bill count, a crema line over a fading crema fill; each ridge has a surface-coloured mask so lower rows cleanly cover upper ones. A dashed `ink-muted` line repeats the chain average in every row. Labels give branch, type and (wide) peak hour. Hovering anywhere sets a crosshair on that hour and reads the value for every branch at once (values under 2% show only the dot). Right (from 760px): a log-scale dot plot (0.25×–4×, gridlines at 0.5×, 1×, 2×) of each branch's weekend multiplier (crema circle: average revenue per weekend day ÷ per normal weekday) and holiday multiplier (ink square: holiday bills ÷ matched-day bills), each on a stem from 1×; the legend says when the range has no holidays. "ดูเป็นตาราง" opens a table of peak, before 10:00, from 17:00, weekend and holiday multipliers; it is open by default on narrow screens, where it replaces the side plot. On first view ridges fade up row by row and their lines draw left to right; on filter changes the paths morph through CSS `d` transitions (800ms).

### Coffee Clock (นาฬิกากาแฟ)
`HourClockCard.jsx`: a 24-hour radial bar chart in SVG (max 360px). Each hour is a round-capped bar from an inner crema-faced dial outward; length = cups or revenue (Segmented แก้ว / ยอดขาย), stroked with an `--lg-*` gradient whose opacity also rises with the value. Closed hours show as short `bar-muted` stubs. A dotted ring and labels every 3 hours frame it. The centre shows the focused hour (Fraunces), its value in crema and its share of the day; it defaults to the peak hour, and hover or keyboard focus on any bar (wide invisible hit area) changes it. All 24 bars tween together to new values (900ms, one rAF).

### Roast Calendar (ปฏิทินคั่ว)
`RoastCalendarCard.jsx`, fed by `dailyCalendar` in `metrics.js`: one cell per day of the selected range and branch, shaded on the roast scale. Levels are quantiles (20/40/60/80%) of days with sales, so one outlier day does not wash out the rest; a "คั่วอ่อน … คั่วเข้ม" key sits in the header. Ranges of up to 42 days render as a wall calendar: 7 weekday columns (จ–อา), 34–52px-tall cells with the day number in the corner (cream or espresso on the two darkest levels). Longer ranges render a GitHub-style strip: weeks as columns, weekday rows, month labels on top, cells sized to the card width (9–44px) and scrolling sideways below that. Cells pop in as a left-to-right wave once seen (`roast-in`, 520ms). The side panel (220px from 1024px, below on smaller screens) shows the hovered day or else the best day (Fraunces 26px, with a focus ring on its cell), average revenue per weekday as pour bars with the best weekday lit, and the quietest day. Thai public holidays (`public/thai_holidays.csv`) get a small ink dot in the cell's top-right corner (shape, not colour alone), an entry in the key, and their name next to the date in the side panel.

### Branch Bars (pouring)
Horizontal 10px bars on a canvas track, one 12px-radius row per branch with a Fraunces rank, name, revenue, share and signed change. Bars are `.pour-bar`: when the list scrolls into view they pour from 0 to their width (1200ms, 90ms stagger by rank). Later filter changes animate from the old width to the new one, so growth and shrinkage are visible. Lit bars use the `--lg-*` gradient with a crema bubble at the tip and a slow shine every 4.5s. When one branch is filtered, the others turn `bar-muted`.

### Top Menu (filling cups)
The data table now has a small outline cup beside each item (`FillCup`). The coffee level is revenue relative to the #1 item (#1 is full), with a slowly flowing wave on top. Cups pour in 150ms + 90ms × rank after the table is seen, and again whenever the range or branch changes. Rows rise in 45ms apart. Columns: Fraunces rank, cup, name with category, quantity, revenue.

### Menu Matrix (เมนูไหนทำเงินจริง)
`MenuMatrixCard.jsx`, fed by `menuEngineering` in `metrics.js`; follows both the period and branch filters. A menu-engineering scatter in SVG: one circle per menu item, x = units sold on a log scale, y = gross margin per unit (selling price − cost from `products.csv`), area ∝ total gross margin. The subtitle says this is gross margin before rent and labour, not net profit. Dashed median lines split items into ดาวเด่น (popular, high margin), ม้างาน (popular, low margin), ปริศนา (unpopular, high margin) and ตัวถ่วง (unpopular, low margin), with counts in each corner. Drinks are filled crema circles and food items are rings, so the split is by shape, not colour alone. A sentence above the chart is written from the data (the star with the most total margin, and the highest-margin item with its units sold). The top three items by total margin and the highest-margin item are labelled; every circle shows a tooltip on hover (category, quadrant, units, margin per unit and %, total margin). A collapsed "ดูเป็นตาราง" table lists every item. Circles pop in on first view and glide to new positions on filter changes (800ms).

### Tooltips
Chart tooltips: surface, 8px corners, Popover shadow, 13px text, semibold heading, rows with a line swatch and a tabular value. Definition tooltip: 240px ink panel with 12px surface-coloured text, shown on hover and focus with a 150ms fade.

### Replay Card (ย้อนดูการเติบโต)
Opened from a surface pill button with a round crema play badge in the filter row; expands above the Trend card (360ms) and autoplays after 500ms. Header: the dark café-photo band above. Body unchanged: a hand-drawn SVG map with crema bubbles per branch, a bar race, and a sparkline scrubber. Reduced motion opens on the final frame.

### Trace Panel (ที่มาของตัวเลข)
Unchanged: a 480px right sheet over a 25% ink scrim, sliding in over 320ms, with filter steps, the formula with real numbers, the first 8 rows, a paste-ready spreadsheet formula and a CSV download. Triggers: the magnifier on each Metric Tab, each Branch row, each Top menu row.

### States
Loading uses canvas pulse skeletons in the real layout shape. Empty states are centred text ("ไม่มียอดขายในช่วงเวลานี้"). Errors appear in a card with "โหลดข้อมูลไม่สำเร็จ" and a concrete fix.

## Motion

Two curves: `--ease-out` = `cubic-bezier(0.22, 1, 0.36, 1)` for entrances and data, `--ease-in-out` = `cubic-bezier(0.65, 0, 0.35, 1)` for big scene changes (the theme reveal). No bounce, except the day-night switch's own knob. Motion tells the coffee story (pouring, filling, crema) and never hides a number for long.

- **First load:** the data headline fades up part by part while the dashboard sections rise 18px out of a 4px blur (`rise`, 720ms) at 0 / 70 / 140 / 200ms.
- **Theme change:** a circular View Transition from the click point (1000ms); bands, the roast calendar and the story dots relight.
- **Tab change:** smooth scroll to the top; new content rises out of blur (`.page-enter`, 700ms).
- **Scroll:** the top bar gains its blurred fill; band images drift on `--p`; the story's dots regroup as each step card crosses mid-screen; reveals trigger once via `useSeen`.
- **Filter or metric change:** the data headline replays and its revenue counts up; KPI values count to the new value and sparklines redraw; the trend line redraws left to right; branch bars flow to new widths; menu cups refill; the clock bars tween; rhythm ridges morph and matrix circles glide.
- **Ambient:** film grain on bands, the crema wave in cups, the bar shine, the wordmark-style sheen on Replay text.
- **Small feedback:** buttons press to 97%; the Metric Tab underline grows from the centre; the definition tooltip fades and lifts 4px.
- **Reduced motion:** one global rule in `index.css` cuts every animation and transition to 1ms with no delay or repeat. On top of that: scroll parallax is off, story dots jump to each step without moving, the theme switches without the reveal, and count-ups and tweens show the final value at once.

## Do's and Don'ts

### Do:
- **Do** treat light and dark as two hours of the same café, with matching imagery and lighting for each.
- **Do** draw the primary line and bars in the crema gradients, with soft dashed crema for comparison and bar muted for de-emphasis.
- **Do** pair every headline figure with its change against the previous period, and fall back to "ไม่มีข้อมูลเทียบ" rather than hiding the slot.
- **Do** give each metric a visible plain-Thai definition (dotted-underline tooltip and caption).
- **Do** use tabular numerals, thousands separators and ฿ on every figure; set big figures in Fraunces light.
- **Do** keep working surfaces inside 16px surface cards with the card shadow; imagery belongs in the section bands.
- **Do** keep AI media decorative (`alt=""`, `aria-hidden`) and keep the note that the numbers come from the data files.
- **Do** ship a `-sm` version of every band image.
- **Do** keep `npm run test:e2e` green: Playwright (`playwright.config.js`, `e2e/dashboard.e2e.js`) runs against the production build (`vite build` + `vite preview` on :4173, not the dev server) after a global setup (`e2e/warmup.js`) that opens every tab once, at desktop 1440×900 and on a Pixel 7, and fails on any console error.
- **Do** compute every number in story or chart text with a function in `story.js` / `metrics.js`, keep the truth-check tests in `src/lib/story.test.js` (an independent recomputation on `public/*.csv`) passing, and keep `docs/VERIFY.md` (Excel steps per claim) in step with the text.
- **Do** give every highlight or category a second cue besides colour (filled vs ring, circle vs square, a corner dot) and a table or text alternative.

### Don't:
- **Don't** add wide letter-spacing to Thai text; 0.04em is the ceiling.
- **Don't** bring back metallic gold, marble, glitter or pinstripes; the marble header artwork (`MarbleArt.jsx`, `marble-art.svg`) is gone.
- **Don't** introduce a second hue for data, categories or branches.
- **Don't** use green or red for anything except change direction.
- **Don't** use Trirong for numbers, body text or controls.
- **Don't** put text on a band photo without its scrim.
- **Don't** raise resting elevation above the card shadow or add borders around cards.
- **Don't** let a chart animation misstate a value: reveals (draw, pour, fill, tween) always end at the true value and are skipped under reduced motion.
- **Don't** invent targets, budgets or goal lines; the data has none.
- **Don't** add a story step or chart for a pattern the data does not show (see Data findings).
