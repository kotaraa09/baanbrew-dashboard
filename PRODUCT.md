# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary (role-play for the course lab): the owner of the บ้านบรู (Baan Brew) coffee chain, 5 branches in Bangkok. Opens the dashboard weekly or in a meeting to see how the whole chain is doing and decide where to focus: which branch is growing or slipping, and whether the trend is up.

Secondary, real audience: the student building it for "Basic Data Analytics & Visualization using AI Vibe Coding" (Lab 1), and the instructor checking that the numbers are correct.

## Product Purpose

A sales overview of the chain built from `public/sales.csv`. Success means the owner reads the chain's health in seconds, and every number matches a Pivot Table check in Excel / Google Sheets.

## Operating Context

- Course lab, คาบ 1 (26 ก.ย. 2026). Prompts in `PROMPTS.md`, checklist in `README.md`.
- Verification ritual: compare revenue and bill counts against a Pivot Table, then screenshot.
- Later labs add products, customers, reviews and forecasting (see `data/README.md`).

## Capabilities and Constraints

- Stack: React 19, Vite 7, Tailwind CSS 4, Recharts 3, PapaParse. Data is static CSV loaded in the browser.
- All calculation logic lives in `src/lib/metrics.js` (required by Prompt 1.2).
- Required KPIs: ยอดขายรวม (฿), จำนวนบิล (unique `order_id`), ยอดเฉลี่ยต่อบิล, ลูกค้าสมาชิก (unique non-empty `customer_id`). Required charts: daily revenue line, revenue by branch sorted descending.
- 1 row = 1 line item, not 1 bill. Revenue = qty × unit_price. Dates come from the first 10 characters of `datetime` (Thai time), never via UTC conversion.
- Data range 2025-04-01 to 2026-09-20; 53,092 rows, 34,791 bills.
- Numbers shown with thousands separators and ฿.
- UI language: Thai.

## Brand Commitments

Name: บ้านบรู (Baan Brew). Fictional chain; no real people or stores. No logo or brand assets exist.

Design reference (user choice, 2026-09-26): industry-standard analytics, benchmarked against Shopify Analytics. Convention is the commitment: period picker, comparison to the previous period with % change, metric tiles that drive the main chart.

## Evidence on Hand

- `public/sales.csv`, `public/products.csv`, `public/branches.csv` (branch type, coordinates, opening date).
- `data/` holds the full course dataset. No real testimonials, targets, or budgets exist; do not invent sales targets.

## Product Principles

1. Numbers must be verifiably correct; show how each is defined.
2. Answer "how is the chain doing, and where should I look" before anything else.
3. Comparisons (vs previous period, vs other branches) over raw totals.
4. Keep logic separate from presentation so students can explain it.
