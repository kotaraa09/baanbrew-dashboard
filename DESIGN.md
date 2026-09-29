---
name: บ้านบรู Dashboard
description: Standard-issue sales analytics for a five-branch coffee chain, read in seconds.
colors:
  chart: "#94702a"
  chart-soft: "#a88a50"
  chart-bar: "#b08a3e"
  on-chart: "#1d1407"
  bar-muted: "#dcd9d2"
  canvas: "#f4f3f0"
  surface: "#ffffff"
  surface-hover: "#f8f7f5"
  surface-selected: "#f2f1ed"
  line: "#e6e4df"
  line-strong: "#cfccc5"
  ink: "#141414"
  ink-subtle: "#5f5d58"
  ink-muted: "#6d6b66"
  up: "#1d5a34"
  up-bg: "#e1efe3"
  down: "#8e2b1e"
  down-bg: "#f7e1dc"
  water: "#e1e4e6"
  water-ink: "#6d777d"
  gold: "#b08d45"
  gold-hi: "#d9bd7c"
  gold-lo: "#7a5a22"
  wordmark: "#141414"
  dark-canvas: "#0a0a0a"
  dark-surface: "#141414"
  dark-surface-hover: "#1b1b1b"
  dark-surface-selected: "#1f1f1f"
  dark-line: "#242424"
  dark-line-strong: "#383838"
  dark-ink: "#f4f2ee"
  dark-ink-subtle: "#a9a7a2"
  dark-ink-muted: "#8f8d88"
  dark-chart: "#d4b26a"
  dark-chart-soft: "#8a7654"
  dark-chart-bar: "#c9a55a"
  dark-on-chart: "#1d1407"
  dark-bar-muted: "#3a3a3a"
  dark-up: "#8fcf9f"
  dark-up-bg: "#13261a"
  dark-down: "#e89a8f"
  dark-down-bg: "#2e1512"
  dark-water: "#1a1d1f"
  dark-water-ink: "#6f7a80"
  dark-gold: "#d9b76e"
  dark-gold-hi: "#f6e3ad"
  dark-gold-lo: "#8f6b2c"
  dark-wordmark: "#d9b76e"
  metal-deep: "#6e4c1a"
  metal-dark: "#8f6726"
  metal-mid: "#d2a958"
  metal-light: "#f3dc9c"
  metal-shine: "#fff6d6"
  art-black: "#070707"
typography:
  headline:
    fontFamily: "Trirong, Anuphan, Noto Serif Thai, serif"
    fontSize: "24px"
    fontWeight: 600
    lineHeight: 1
  metric:
    fontFamily: "Anuphan, Noto Sans Thai, Leelawadee UI, Tahoma, sans-serif"
    fontSize: "24px"
    fontWeight: 600
    lineHeight: 1.33
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
rounded:
  md: "6px"
  lg: "8px"
  card: "12px"
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

**Creative North Star: "Black & Gold Marble"**

The analytics layout is still the Shopify-standard one (period and branch pickers, four metric tabs driving one chart, then branches and menu items), and it stays that way on purpose. The identity comes from the user's reference board: gold pinstripes on black ribbon, black-and-gold marble with a white vein in a gold frame, a matte black can with a gold script logo, and gold lace on black. Two ideas carry it. The header is a framed artwork. And gold is always *metallic*: dark-to-bright-to-bronze gradients with a moving glint, never a flat tan.

Dark is the brand theme and the default for first visits. Light is a white, marble-like counterpart (off-white canvas, white cards, black ink), and the header artwork stays dark in both themes, like a painting on a wall. The choice is remembered (`localStorage: baanbrew-theme`). Tokens in `@theme` are the light values; `:root[data-theme="dark"]` remaps them (the `dark-*` entries above).

**Key Characteristics:**
- Neutral blacks and grays (no brown tint): dark canvas #0a0a0a, cards #141414 with a 6% white hairline and a gold hairline along the top edge.
- The header is black marble with S-shaped gold and white ribbons, thin gold veins, glitter on the gold, twinkling flecks, and a gold pinstripe bundle, inside a 1.5px metallic gold frame.
- Metallic gold (`--gold-metal`, `--gold-fill`) on the wordmark (with a slow sheen), the frame, the tab underline, primary buttons, number badges and bars. The main chart line uses a metallic SVG stroke with a soft glow in dark mode.
- Trirong (a Thai serif) for the wordmark only. Everything else is Anuphan.
- Coffee icons drawn in the same 1.5px stroke: bean (overview), cup (customers, empty chart), pour-over dripper (lab), and a café storefront with a cup in the window (branch picker).

## Brand

### Logo
`src/components/Logo.jsx`, with `LogoMark` as the mark alone and `Logo` as the lockup. The mark has two elements: a solid gold coin split top to bottom by a coffee bean's S-shaped crease (บรู), under one thin roofline (บ้าน). The user chose it, 2026-09-29, from three minimal directions (roof and crease, doorway, gold coin) as "the coin with the roof". It is built as a single SVG mask (coin, minus the crease, plus the roof), so the foil gradient and the glint flow across both parts as one surface. The glint sweeps across once on load and again on hover. The wordmark "บ้านบรู" is Trirong 600, 26 to 30px, in `.gold-text` (metallic gradient clipped to the text, with a sheen that crosses every 8 seconds). Under it, "BAAN BREW · EST. 2023" is set at 10px, uppercase, 0.3em tracking, #b9b2a3. "Est. 2023" is the opening date of the first branch (สยาม, 2023-06-01, from `branches.csv`). `public/favicon.svg` is the same mark on a #0a0a0a tile, scaled to 87.5% with a thicker roof and crease so it reads at 16px. If the shape changes, update both files.

### Header artwork
`src/components/MarbleArt.jsx` plus `public/marble-art.svg`. The static artwork is an SVG *image* file: marble displacement, a glitter filter and gold flecks. It has to be an `<img>`, because inline SVG filters get recomputed whenever something animates on top of them, and that dropped the page to about 1 fps. Only the twinkling flecks (every 6th fleck from the same seeded random sequence) are inline SVG. The image is cropped from the right (`object-right`), so the ribbons always show. A left-to-right black fade (the full width on mobile, 3/5 of the width from 640px) keeps the logo readable. The date sits on a dark pill with a 35% gold ring. The frame is `.gold-frame`, a masked metallic border.

### Replay card band
The Replay card's title bar reuses `MarbleArt` as a marble strip (always dark, with a black fade on the left), closed by a full-opacity `.gold-rule`. The band carries `.theme-dark`, which applies the dark tokens to just that element, so the speed control and close button look right in light mode too. The title "ย้อนดูการเติบโต" is Trirong in `.gold-text`. The current-week date in the strip below uses `.gold-text-data`, a metallic gradient built from the theme-aware `--lg-*` stops so it stays readable on white.

### Theme switch
The original sky/night day-night switch, unchanged.

## Colors

### Primary
- **Gold** (`chart`): the solid gold for text highlights, legend swatches, and the focus ring. #d4b26a in dark mode; #94702a in light mode (at least 4.5:1 on white).
- **Metallic gold**: `--gm-deep/dark/mid/light/shine` build `--gold-metal` (full range, used for the wordmark and frame) and `--gold-fill` (the brighter half, used under dark text). Every `.bg-chart` and `.bg-chart-bar` element gets `--gold-fill` automatically. Charts use `--lg-*` stops: the same as `--gm-*` in dark mode, and deeper in light mode so the bright end does not vanish on white.
- **Soft Gold** (`chart-soft`): the previous-period line, always dashed, at least 3:1 on the surface.
- **Bar Muted** (`bar-muted`): the de-emphasized gray.
- **On gold** (`on-chart`): #1d1407 in both themes.

### Neutral
Pure neutral grays with the same roles as before: canvas, surface, surface-hover, surface-selected, line, line-strong, ink, ink-subtle, ink-muted.

### Change (semantic only)
Up green and down red, softened. They are used only for change.

### Named Rules
**The Gold Is Metal Rule.** Gold is never a flat fill. Anything gold uses the metallic gradient, or at least a gradient stroke.

**The Art Stays Framed Rule.** The marble, glitter, and pinstripes live only in the framed header and the Replay card's title band. Working surfaces (cards, tables, tooltips) stay plain so the numbers read in seconds.

**The Change-Only Color Rule.** Green and red mean went up and went down, nothing else.

## Typography

**Display Font:** Trirong 500/600 (Google Fonts), the wordmark only
**Body Font:** Anuphan (with Noto Sans Thai, Leelawadee UI, Tahoma, sans-serif)

**Character:** A looped Thai serif signs the brand name. A modern Thai/Latin sans at four weights does all the work. Hierarchy comes from size and weight steps that stay small, as in admin tooling, not from contrast between families.

### Hierarchy
- **Headline** (Trirong 600, 22px mobile / 24px, gold): the wordmark "บ้านบรู" in the header. " Dashboard" is kept for screen readers only.
- **Metric** (600, 20px mobile / 24px from 640px, tight tracking, tabular): KPI values in the metric tabs.
- **Title** (600, 14px): card titles such as "ยอดขายแยกสาขา" and "เมนูขายดี"; tooltip headings.
- **Body** (400 to 500, 13px): the working size. Select text, subtitles, table cells, chart tooltip rows, metric tab labels (500), branch bar labels.
- **Label** (500, 12px): change %, segmented options, table headers, legend, axis ticks (12px regular), footer and definition captions.

### Named Rules
**The Tabular Figures Rule.** Every number that can be compared (KPIs, table cells, tooltip values, change %) uses tabular numerals so columns and before/after values align.

**The Numbers Stay Sans Rule.** Trirong never sets a figure. Every number, label, and control is Anuphan.

## Layout

A single centered column, max 1152px wide, with 16px side gutters (24px from 640px) and 24px top padding (32px from 1024px). Sections stack with a 16px rhythm.

Order is fixed: the framed marble header (seal and wordmark left, the date pill and theme switch right; on mobile they wrap below), the page nav (Segmented with coffee icons), filter row (two selects plus a comparison caption), the trend card full width, then a two-column row (branches, top menu items) from 1024px, stacked below. The trend card's four metric tabs sit in a 2 by 2 grid on mobile and a single row of four from 1024px, with 4px gaps inside an 8px tray.

Card internals use 16px padding, rising to 20px horizontally from 640px. Main chart height is 288px. Branch bars get a fixed 52px per row so labels sit above each 10px bar.

## Elevation & Depth

Depth is tonal and shallow. Cards separate from the canvas through the surface fill (plus a 6% white hairline in dark mode) plus a two-layer hairline shadow (a 1px bottom edge and a 2px soft blur, both at 7 to 8% near-black). Floating layers (chart tooltips, the definition tooltip) use one stronger diffuse shadow. Nothing else casts a shadow except the active segmented option and the select's 1px bottom edge.

### Shadow Vocabulary
- **Card** (`box-shadow: 0 1px 0 0 rgb(26 26 26 / 0.07), 0 1px 2px 0 rgb(26 26 26 / 0.08)`): every card, and the active segmented option.
- **Control edge** (`box-shadow: 0 1px 0 0 rgb(0 0 0 / 0.05)`): selects.
- **Popover** (`box-shadow: 0 4px 16px rgb(0 0 0 / 0.12), 0 0 0 1px rgb(0 0 0 / 0.06)`): chart tooltips on white. The dark definition tooltip uses the same blur at 0.16 without the ring.

### Named Rules
**The Hairline Rule.** Resting surfaces get the card shadow and nothing heavier. A stronger shadow means the layer is floating and temporary.

## Shapes

Soft, consistent rounding. Cards 12px; controls, metric tabs and tooltips 8px; segmented options, change badges and skeletons 6px; bars 5px; indicator strokes (tab underline, legend swatches) fully round. Borders are 1px and used sparingly: on selects, and as internal dividers and table row rules. Cards themselves have no border.

## Components

### Selects (period and branch pickers)
Quiet and native. A native `<select>` for keyboard and mobile correctness, 32px tall, 8px corners, 1px strong-line border, surface fill, 13px medium ink text, a leading 16px outline icon (calendar or store) and a trailing chevron in subtle ink. Hover shifts the fill to surface hover; focus shifts the border to chart gold and shows the global 2px gold focus ring.

### Segmented Control
Used for chart granularity (วัน / สัปดาห์ / เดือน). A canvas track with 2px inset; options are 28px, 12px medium text. The active option is marked by a single white chip with the card shadow that slides to the chosen option (300ms, ease-out); the active label turns ink, others are subtle ink, darkening on hover. Disabled options (range too short) fade to muted ink at half opacity with a not-allowed cursor.

### Cards
- **Corner Style:** 12px.
- **Background:** surface white on the canvas gray.
- **Shadow Strategy:** the Card shadow only.
- **Border:** none outside; line-colored rules divide internal regions.
- **Internal Padding:** 16px, 20px horizontal from 640px. Headers carry a 14px semibold title and an optional 13px subtle subtitle, e.g. "ทุกสาขา · 22 ส.ค. – 20 ก.ย. 69".

### Metric Tabs (signature)
The four KPIs are buttons, not static tiles. Each shows a 13px medium label with a dotted line-strong underline (the affordance for its definition tooltip), a 20 to 24px semibold tabular value, and inline change %. Hover fills surface hover; selected fills surface selected, turns the label to ink, and shows a 2px round chart bar along the bottom. Selecting a tab swaps the main chart's metric.

### Change Indicator
Arrow icon plus absolute % (e.g. "12.4%") in 12px medium tabular text. Up is green, down is red, and anything under 0.05% is flat: subtle gray with no arrow. The badge variant adds a 6px-radius tint (green, red, or canvas gray). A screen-reader word ("เพิ่มขึ้น", "ลดลง", "คงที่") precedes the number. With no comparison, it reads "ไม่มีข้อมูลเทียบ" in muted ink.

### Trend Chart
Recharts line chart, 288px tall. Horizontal gridlines only, in line color; y-axis on round ticks (1, 2, 2.5, 5 × 10ⁿ), 12px subtle ticks, no axis lines except the x baseline. Current period: solid chart gold, 2px, no dots, active dot 4px with a white ring. Previous period: soft gold, 2px, dashed 4 4. Incomplete buckets: chart gold dotted 2 4, explained in the caption ("เส้นจุดคือช่วงที่มีวันไม่ครบ"). No animation. A legend of line swatches with date ranges sits above; the metric's definition caption sits below.

### Branch Bars
Horizontal bars, 10px thick with 5px ends, on a canvas track. Label row above each bar: branch name left, then revenue (ink, 500), share % (muted), and signed change (green or red) right-aligned to the bar's full-width edge. When a single branch is filtered, it stays in the bar color and the others turn bar muted gray.

### Data Table (top menu items)
13px text, 12px subtle headers, 1px line row rules, hover to surface hover. Columns: rank (muted, tabular), name (ink 500) with category below (12px muted), quantity (subtle, right), revenue (ink 500, right).

### Tooltips
Chart tooltips: white, 8px corners, Popover shadow, 13px text, semibold heading, rows with a line swatch, label left and tabular value right, and an optional change row under a line divider. Definition tooltip: 240px ink panel with white 12px relaxed text, shown on hover and keyboard focus with a 150ms fade.

### Replay Card (ย้อนดูการเติบโต)
Opened from a surface pill button with a round chart-gold play badge, right-aligned in the filter row; the card expands open above the Trend card (height, fade and an 8px drop over 360ms, pushing the content below down smoothly), collapses the same way on close, and autoplays after 500ms. Header: title, date span, speed Segmented (ช้า / ปกติ / เร็ว), a solid chart-gold play/pause/replay button, and a ghost close. A 4-cell strip (current date in chart gold, then cumulative revenue, bills, members) sits between line rules. Body: a hand-drawn SVG map (surface-hover plate, line-colored dot grid, soft muted water river, 2 กม. scale bar) with translucent chart-gold bubbles sized by √(28-day average ฿/day), leader-lined labels, a dashed ring for unopened branches, and a ripple plus "สาขาใหม่" pill when one opens; beside it a bar race whose rows slide to their new rank (500ms ease-out) and flash up-green when they climb. Below: a sparkline scrubber (canvas area, played part tinted chart gold, playhead with a ringed knob, opening markers, quarter month ticks) backed by a transparent range input. Reduced motion opens on the final frame with no autoplay or transitions.

### Trace Panel (ที่มาของตัวเลข)
Triggers: a 28px ghost magnifier-on-lines icon at each Metric Tab's top-right (60% opacity, full on hover or focus), transparent full-row buttons over each Branch Bar row, and a stretched button over each top-menu row. The panel is a 480px right sheet (full width on phones) over a 25% ink scrim, sliding in over 320ms. Header: chart-gold eyebrow, title, 28px tabular value, canvas context chips. Four numbered sections divided by line rules: filter steps (row counts with bars shrinking from 100%, staggered), the formula filled with real numbers in a surface-hover block with a muted note, the first 8 rows with the formula's columns tinted chart gold, and a paste-ready Google Sheets / Excel 365 formula with a copy button plus a Pivot Table recipe. Sticky footer: a full-width chart-gold download button for the filtered rows (UTF-8 BOM CSV). Escape or scrim click closes; focus is trapped inside and returned to the trigger.

### States
Loading uses canvas pulse skeletons in the real layout shape. Empty states are centered text in a surface-hover panel: a 14px medium line ("ไม่มียอดขายในช่วงเวลานี้") and a 13px subtle suggestion. Errors appear in a card with a semibold headline ("โหลดข้อมูลไม่สำเร็จ") and a concrete fix.

## Motion

One easing for everything: `--ease-out` = `cubic-bezier(0.22, 1, 0.36, 1)`, no bounce or overshoot. Motion explains where something came from or that something changed; it never delays reading a number.

- **Page load:** the filter row, Trend card, Branch card and Top menu card rise 10px and fade in, staggered 0 / 70 / 140 / 200ms (520ms each). Once only.
- **Filter or metric change:** KPI values count to the new value (600ms, ease-out cubic; count up from 0 on first load). The chart area and branch bars fade in again (320ms), and top menu rows rise one after another (45ms apart). The data marks themselves never animate (see Don'ts).
- **Opening things:** the Replay card expands in place (Collapsible, 360ms). The Trace panel slides in from the right (320ms) over a fading scrim, then its four sections rise in sequence (180–360ms) and the filter bars shrink from full width. Closing is quicker (200ms).
- **Small feedback:** buttons press to 97% scale; the Metric Tab underline grows from the centre; the definition tooltip fades and lifts 4px after a 150ms hover intent; icon swaps (play / pause / replay) and "คัดลอกแล้ว ✓" pop in.
- **Reduced motion:** one global rule in `index.css` shortens every animation and transition to 1ms, and count-ups show the final value at once. The same happens when the tab is hidden, so nothing waits on a paused animation frame.

## Do's and Don'ts

### Do:
- **Do** draw the primary line with the metallic gold stroke and soft dashed gold for comparison; draw bars in metallic gold, with bar muted for de-emphasis.
- **Do** pair every headline figure with its change against the previous period, and fall back to "ไม่มีข้อมูลเทียบ" rather than hiding the slot.
- **Do** give each metric a visible plain-Thai definition (dotted-underline tooltip and caption).
- **Do** use tabular numerals, thousands separators and ฿ on every figure.
- **Do** keep new surfaces inside 12px surface cards on the canvas with the card shadow (a 6% white hairline in dark mode).
- **Do** keep the working text size at 13px and titles at 14px semibold; hierarchy stays compact.

### Don't:
- **Don't** introduce a second hue for data, categories or branches.
- **Don't** use green or red for anything except change direction.
- **Don't** use Trirong for numbers, body text, or controls.
- **Don't** use flat gold; use the metallic tokens.
- **Don't** put marble, glitter, or pattern on other cards; the art lives in the framed header and the Replay band only.
- **Don't** put the artwork back as inline SVG with filters; keep it as `public/marble-art.svg`.
- **Don't** raise resting elevation above the card shadow or add borders around cards.
- **Don't** animate chart data in; lines and bars render at their true values immediately. A chart may fade in as a whole when what it shows changes, but marks never grow, draw or slide into place.
- **Don't** invent targets, budgets or goal lines; the data has none.
