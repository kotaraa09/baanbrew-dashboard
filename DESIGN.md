---
name: บ้านบรู Dashboard
description: Standard-issue sales analytics for a five-branch coffee chain, read in seconds.
colors:
  chart: "#1b6fd1"
  chart-soft: "#6592cf"
  chart-bar: "#3d85d8"
  bar-muted: "#8a8a8a"
  canvas: "#f1f1f1"
  surface: "#ffffff"
  surface-hover: "#f7f7f7"
  surface-selected: "#f3f3f3"
  line: "#e3e3e3"
  line-strong: "#cccccc"
  ink: "#303030"
  ink-subtle: "#616161"
  ink-muted: "#6b6b6b"
  up: "#0c5132"
  up-bg: "#cdfee1"
  down: "#8e0b21"
  down-bg: "#fedad9"
typography:
  headline:
    fontFamily: "Anuphan, Noto Sans Thai, Leelawadee UI, Tahoma, sans-serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1.4
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

**Creative North Star: "The Standard Ledger"**

This is a category-standard analytics surface, benchmarked on purpose against Shopify Analytics. The owner of a five-branch coffee chain opens it weekly and must know within seconds how the chain is doing and where to look next. Convention is the commitment: a period picker and branch picker at the top, one card whose four metric tabs drive the main line chart, current period drawn solid against the previous period dashed, then branches and menu items as the drivers. Nothing here tries to be memorable. It tries to be instantly legible to anyone who has used an admin dashboard before.

The world is a pale gray canvas holding white cards with a hairline two-layer shadow and 12px corners. There is one typeface (Anuphan), one hue for data (a single blue family), and color that carries meaning only where a value changed (green up, red down). Density is moderate: 13px body text, 16 to 20px card gutters, tabular numerals on every figure. Every number states its own definition, because correctness is verified against a Pivot Table.

Light theme only. There is no dark mode and none should be added without a new decision.

**Key Characteristics:**
- Gray canvas, white cards, hairline shadow; depth is tonal, not dramatic.
- One typeface, Anuphan, weights 400 to 700.
- One data hue: blue. Gray for everything that is not data or change.
- Green and red appear only on change indicators, never as decoration or category color.
- Metric tabs are the chart's controls; the selected tab gets a 2px blue underline bar.
- Every metric carries a plain-Thai definition in the UI (tooltip and caption).

## Colors

A near-monochrome neutral system with a single blue for data and a green/red pair reserved for change.

### Primary
- **Chart Blue** (`chart`): the one data color. The current-period line, the selected metric tab's underline bar, legend swatches, and the global focus ring. Because it doubles as the focus color, it is the only saturated color a user ever sees outside a change indicator.
- **Soft Chart Blue** (`chart-soft`): the previous-period comparison line, always dashed (4 4). Tuned to hold 3:1 against white so the comparison stays readable while clearly secondary.
- **Bar Blue** (`chart-bar`): fill for horizontal branch bars. A lighter step of the same blue so thick bars do not overpower the thin line chart.

### Neutral
- **Canvas Gray** (`canvas`): the page background, the segmented control's track, the empty track behind each bar, the flat change badge, and skeleton blocks.
- **Surface White** (`surface`): cards, selects, active segmented option, chart tooltips.
- **Surface Hover** (`surface-hover`): row and control hover, the empty-chart panel, bar-chart hover cursor.
- **Surface Selected** (`surface-selected`): the selected metric tab's fill.
- **Line** (`line`): card dividers, table row rules, chart gridlines and x-axis.
- **Line Strong** (`line-strong`): select borders, chart hover cursor, dotted underline under metric labels.
- **Ink** (`ink`): primary text and figures; also the definition tooltip's background.
- **Ink Subtle** (`ink-subtle`): secondary text, subtitles, axis ticks, unselected tab labels, icons.
- **Ink Muted** (`ink-muted`): tertiary metadata (rank numbers, categories, share %, footer, definition captions).
- **Bar Muted Gray** (`bar-muted`): branch bars that are not the currently filtered branch, so the selected branch stands out in blue.

### Change (semantic only)
- **Up Green** (`up`) on **Up Green Tint** (`up-bg`): positive % change.
- **Down Red** (`down`) on **Down Red Tint** (`down-bg`): negative % change.
- Inline change text uses the dark tone alone; the badge variant adds the tint.

### Named Rules
**The One Blue Rule.** Data is drawn in the blue family and nothing else. A second series is a lighter or dashed blue, not a new hue. Non-focus data is gray.

**The Change-Only Color Rule.** Green and red mean "went up" and "went down". They never mark categories, statuses, branches, or brand.

## Typography

**Display Font:** none (no display face)
**Body Font:** Anuphan (with Noto Sans Thai, Leelawadee UI, Tahoma, sans-serif)

**Character:** A single modern Thai/Latin sans used at four weights. Hierarchy comes from size and weight steps that stay small, as in admin tooling, not from contrast between families.

### Hierarchy
- **Headline** (700, 20px): the page title only ("บ้านบรู Dashboard").
- **Metric** (600, 20px mobile / 24px from 640px, tight tracking, tabular): KPI values in the metric tabs.
- **Title** (600, 14px): card titles such as "ยอดขายแยกสาขา" and "เมนูขายดี"; tooltip headings.
- **Body** (400 to 500, 13px): the working size. Select text, subtitles, table cells, chart tooltip rows, metric tab labels (500), branch bar labels.
- **Label** (500, 12px): change %, segmented options, table headers, legend, axis ticks (12px regular), footer and definition captions.

### Named Rules
**The Tabular Figures Rule.** Every number that can be compared (KPIs, table cells, tooltip values, change %) uses tabular numerals so columns and before/after values align.

**The One Face Rule.** Anuphan is the only typeface. No mono, no display face, no second family for numbers.

## Layout

A single centered column, max 1152px wide, with 16px side gutters (24px from 640px) and 24px top padding (32px from 1024px). Sections stack with a 16px rhythm.

Order is fixed: header (title left, data freshness right, baseline-aligned and wrapping), filter row (two selects plus a comparison caption), the trend card full width, then a two-column row (branches, top menu items) from 1024px, stacked below. The trend card's four metric tabs sit in a 2 by 2 grid on mobile and a single row of four from 1024px, with 4px gaps inside an 8px tray.

Card internals use 16px padding, rising to 20px horizontally from 640px. Main chart height is 288px. Branch bars get a fixed 52px per row so labels sit above each 10px bar.

## Elevation & Depth

Depth is tonal and shallow. Cards separate from the gray canvas through a white fill plus a two-layer hairline shadow (a 1px bottom edge and a 2px soft blur, both at 7 to 8% near-black). Floating layers (chart tooltips, the definition tooltip) use one stronger diffuse shadow. Nothing else casts a shadow except the active segmented option and the select's 1px bottom edge.

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
Quiet and native. A native `<select>` for keyboard and mobile correctness, 32px tall, 8px corners, 1px strong-line border, white fill, 13px medium ink text, a leading 16px outline icon (calendar or store) and a trailing chevron in subtle ink. Hover shifts the fill to surface hover; focus shifts the border to chart blue and shows the global 2px blue focus ring.

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
Recharts line chart, 288px tall. Horizontal gridlines only, in line color; y-axis on round ticks (1, 2, 2.5, 5 × 10ⁿ), 12px subtle ticks, no axis lines except the x baseline. Current period: solid chart blue, 2px, no dots, active dot 4px with a white ring. Previous period: soft blue, 2px, dashed 4 4. Incomplete buckets: chart blue dotted 2 4, explained in the caption ("เส้นจุดคือช่วงที่มีวันไม่ครบ"). No animation. A legend of line swatches with date ranges sits above; the metric's definition caption sits below.

### Branch Bars
Horizontal bars, 10px thick with 5px ends, on a canvas track. Label row above each bar: branch name left, then revenue (ink, 500), share % (muted), and signed change (green or red) right-aligned to the bar's full-width edge. When a single branch is filtered, it stays bar blue and the others turn bar muted gray.

### Data Table (top menu items)
13px text, 12px subtle headers, 1px line row rules, hover to surface hover. Columns: rank (muted, tabular), name (ink 500) with category below (12px muted), quantity (subtle, right), revenue (ink 500, right).

### Tooltips
Chart tooltips: white, 8px corners, Popover shadow, 13px text, semibold heading, rows with a line swatch, label left and tabular value right, and an optional change row under a line divider. Definition tooltip: 240px ink panel with white 12px relaxed text, shown on hover and keyboard focus with a 150ms fade.

### Replay Card (ย้อนดูการเติบโต)
Opened from a white pill button with a round chart-blue play badge, right-aligned in the filter row; the card expands open above the Trend card (height, fade and an 8px drop over 360ms, pushing the content below down smoothly), collapses the same way on close, and autoplays after 500ms. Header: title, date span, speed Segmented (ช้า / ปกติ / เร็ว), a solid chart-blue play/pause/replay button, and a ghost close. A 4-cell strip (current date in chart blue, then cumulative revenue, bills, members) sits between line rules. Body: a hand-drawn SVG map (surface-hover plate, line-colored dot grid, soft water-blue river, 2 กม. scale bar) with translucent chart-blue bubbles sized by √(28-day average ฿/day), leader-lined labels, a dashed ring for unopened branches, and a ripple plus "สาขาใหม่" pill when one opens; beside it a bar race whose rows slide to their new rank (500ms ease-out) and flash up-green when they climb. Below: a sparkline scrubber (canvas area, played part tinted chart blue, playhead with a ringed knob, opening markers, quarter month ticks) backed by a transparent range input. Reduced motion opens on the final frame with no autoplay or transitions.

### Trace Panel (ที่มาของตัวเลข)
Triggers: a 28px ghost magnifier-on-lines icon at each Metric Tab's top-right (60% opacity, full on hover or focus), transparent full-row buttons over each Branch Bar row, and a stretched button over each top-menu row. The panel is a 480px right sheet (full width on phones) over a 25% ink scrim, sliding in over 320ms. Header: chart-blue eyebrow, title, 28px tabular value, canvas context chips. Four numbered sections divided by line rules: filter steps (row counts with bars shrinking from 100%, staggered), the formula filled with real numbers in a surface-hover block with a muted note, the first 8 rows with the formula's columns tinted chart blue, and a paste-ready Google Sheets / Excel 365 formula with a copy button plus a Pivot Table recipe. Sticky footer: a full-width chart-blue download button for the filtered rows (UTF-8 BOM CSV). Escape or scrim click closes; focus is trapped inside and returned to the trigger.

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
- **Do** draw every data series in the chart family; use soft blue plus a dash for comparison and bar muted gray for de-emphasis.
- **Do** pair every headline figure with its change against the previous period, and fall back to "ไม่มีข้อมูลเทียบ" rather than hiding the slot.
- **Do** give each metric a visible plain-Thai definition (dotted-underline tooltip and caption).
- **Do** use tabular numerals, thousands separators and ฿ on every figure.
- **Do** keep new surfaces inside white 12px cards on the gray canvas with the card shadow.
- **Do** keep the working text size at 13px and titles at 14px semibold; hierarchy stays compact.

### Don't:
- **Don't** introduce a second hue for data, categories or branches.
- **Don't** use green or red for anything except change direction.
- **Don't** add a second typeface or a display face; Anuphan only.
- **Don't** add a dark theme; the system is light only.
- **Don't** raise resting elevation above the card shadow or add borders around cards.
- **Don't** animate chart data in; lines and bars render at their true values immediately. A chart may fade in as a whole when what it shows changes, but marks never grow, draw or slide into place.
- **Don't** invent targets, budgets or goal lines; the data has none.
