import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { CupIcon, Card, Change, Segmented, TraceIcon, useTweenedNumber } from "./ui.jsx";
import {
  formatBaht,
  formatBahtExact,
  formatBahtShort,
  formatBucket,
  formatNumber,
  formatRange,
  percentChange,
} from "../lib/metrics.js";

export const METRICS = [
  {
    key: "revenue",
    kpi: "totalRevenue",
    label: "ยอดขายรวม",
    format: formatBaht,
    axis: formatBahtShort,
    definition: "ผลรวมของ qty × unit_price ทุกรายการสินค้าในช่วงที่เลือก",
  },
  {
    key: "orders",
    kpi: "orderCount",
    label: "จำนวนบิล",
    format: formatNumber,
    axis: formatNumber,
    definition: "จำนวน order_id ที่ไม่ซ้ำ บิลหนึ่งมีได้หลายรายการสินค้า จึงไม่ใช่จำนวนแถว",
  },
  {
    key: "aov",
    kpi: "avgOrderValue",
    label: "ยอดเฉลี่ยต่อบิล",
    format: formatBahtExact,
    axis: formatBahtShort,
    definition: "ยอดขายรวม ÷ จำนวนบิล",
  },
  {
    key: "members",
    kpi: "memberCount",
    label: "ลูกค้าสมาชิก",
    format: formatNumber,
    axis: formatNumber,
    definition: "จำนวน customer_id ที่ไม่ซ้ำ ไม่นับลูกค้าทั่วไป (customer_id ว่าง) ในกราฟนับแยกแต่ละช่วงเวลา",
  },
];

// ขีดแกน Y เป็นเลขกลม ๆ (1, 2, 2.5, 5 × 10^n) ประมาณ 4 ช่อง
function niceTicks(max) {
  if (!max) return [0, 1];
  const raw = max / 4;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= raw);
  // หยุดที่ขีดแรกที่เกินค่าสูงสุด ไม่เผื่อที่ว่างด้านบนจนเส้นแบน
  return Array.from({ length: Math.ceil(max / step) + 1 }, (_, i) => i * step);
}

const GRANULARITY = [
  { value: "day", label: "วัน" },
  { value: "week", label: "สัปดาห์" },
  { value: "month", label: "เดือน" },
];

function MetricTab({ metric, kpis, previousKpis, selected, onSelect }) {
  const value = kpis[metric.kpi];
  // ตัวเลขนับไปหาค่าใหม่เมื่อเปลี่ยนช่วง/สาขา (เฉพาะการแสดงผล)
  const shown = useTweenedNumber(value);
  const change = previousKpis ? percentChange(value, previousKpis[metric.kpi]) : null;
  // กด Escape เพื่อซ่อนคำอธิบาย (WCAG 1.4.13) จนกว่าจะเลื่อนเมาส์ออกหรือย้าย focus
  const [dismissed, setDismissed] = useState(false);

  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-describedby={`def-${metric.key}`}
      onClick={onSelect}
      onKeyDown={(e) => e.key === "Escape" && setDismissed(true)}
      onMouseLeave={() => setDismissed(false)}
      onBlur={() => setDismissed(false)}
      className={`group relative flex w-full flex-col items-start gap-1 rounded-lg px-3 py-2.5 text-left transition-[background-color,scale] duration-200 active:scale-[0.985] ${
        selected ? "bg-surface-selected" : "hover:bg-surface-hover"
      }`}
    >
      <span
        className={`text-[13px] font-medium underline decoration-dotted decoration-line-strong underline-offset-4 ${
          selected ? "text-ink" : "text-ink-subtle"
        }`}
      >
        {metric.label}
      </span>
      <span
        id={`def-${metric.key}`}
        role="tooltip"
        className={`pointer-events-none invisible absolute inset-x-3 top-full z-10 mt-1 translate-y-1 rounded-lg bg-ink px-3 py-2 text-xs leading-relaxed font-normal text-surface opacity-0 shadow-[0_4px_16px_rgb(0_0_0/0.16)] transition-[opacity,translate,visibility] duration-200 ease-[var(--ease-out)] ${
          dismissed
            ? ""
            : "group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-hover:delay-150 group-focus-visible:visible group-focus-visible:translate-y-0 group-focus-visible:opacity-100"
        }`}
      >
        {metric.definition}
      </span>
      <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className="text-xl font-semibold tracking-tight text-ink tabular-nums sm:text-2xl">
          {metric.format(shown)}
        </span>
        {previousKpis && <Change value={change} />}
      </span>
      <span
        aria-hidden="true"
        className={`absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-chart transition-[opacity,scale] duration-300 ease-[var(--ease-out)] ${
          selected ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0"
        }`}
      />
    </button>
  );
}

function TrendTooltip({ active, payload, metric, granularity, showAverage }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  // ไม่คำนวณ % ถ้ากลุ่มใดกลุ่มหนึ่งมีวันไม่ครบ เพราะจะเทียบกันไม่ยุติธรรม
  const change = p.previousKey && !p.partial && !p.previousPartial ? percentChange(p.current, p.previous) : null;

  return (
    <div className="min-w-44 rounded-lg bg-surface px-3 py-2.5 text-[13px] shadow-[0_4px_16px_rgb(0_0_0/0.12),0_0_0_1px_rgb(0_0_0/0.06)]">
      <p className="mb-1.5 font-semibold text-ink">{metric.label}</p>
      <div className="flex items-center justify-between gap-4">
        <span className="flex items-center gap-1.5 text-ink-subtle">
          <span className={`h-0.5 w-3 rounded-full bg-chart ${showAverage ? "opacity-35" : ""}`} />
          {formatBucket(p.key, granularity)}
          {p.partial && " (ไม่ครบช่วง)"}
        </span>
        <span className={`tabular-nums ${showAverage ? "text-ink-subtle" : "font-medium text-ink"}`}>
          {metric.format(p.current)}
        </span>
      </div>
      {showAverage && p.average != null && (
        <div className="mt-1 flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-ink-subtle">
            <span className="h-[3px] w-3 rounded-full bg-chart" />
            เฉลี่ย 7 วัน
          </span>
          <span className="font-medium text-ink tabular-nums">{metric.format(p.average)}</span>
        </div>
      )}
      {p.previousKey && (
        <div className="mt-1 flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-ink-subtle">
            <span className="w-3 border-t-2 border-dashed border-chart-soft" />
            {formatBucket(p.previousKey, granularity)}
            {p.previousPartial && " (ไม่ครบช่วง)"}
          </span>
          <span className="text-ink-subtle tabular-nums">{metric.format(p.previous ?? 0)}</span>
        </div>
      )}
      {change != null && (
        <div className="mt-2 border-t border-line pt-1.5">
          <Change value={change} />
        </div>
      )}
    </div>
  );
}

export default function TrendCard({
  kpis,
  previousKpis,
  series,
  previousSeries,
  range,
  metricKey,
  onMetricChange,
  granularity,
  onGranularityChange,
  movingAverage = null,
  onTrace,
}) {
  const metric = METRICS.find((m) => m.key === metricKey);
  const showAverage = !!movingAverage;
  // ไม่ให้เกิน 2 เส้น: โหมดค่าเฉลี่ย 7 วันไม่แสดงเส้นช่วงก่อนหน้า (% เทียบช่วงก่อนยังอยู่ที่ KPI ด้านบน)
  const showPrevious = !!range.previous && !showAverage;
  // เส้นทึบ = กลุ่มที่ครบช่วง, เส้นประ = ช่วงที่ต่อเข้ากลุ่มที่วันไม่ครบ (เช่นเดือนปัจจุบัน) จะได้ไม่ดูเหมือนยอดตก
  const data = series.map((b, i) => {
    const touchesPartial = b.partial || series[i - 1]?.partial || series[i + 1]?.partial;
    const bothPartialNeighbours = b.partial || (series[i - 1]?.partial && series[i + 1]?.partial);
    return {
      key: b.key,
      partial: b.partial,
      current: b[metric.key],
      solid: bothPartialNeighbours ? null : b[metric.key],
      dashed: touchesPartial ? b[metric.key] : null,
      previousKey: showPrevious ? previousSeries?.[i]?.key ?? null : null,
      previousPartial: previousSeries?.[i]?.partial ?? false,
      previous: showPrevious ? previousSeries?.[i]?.[metric.key] ?? null : null,
      average: movingAverage?.[i]?.[metric.key] ?? null,
    };
  });
  const hasPartial = series.some((b) => b.partial);
  const isEmpty = kpis.orderCount === 0;
  const ticks = niceTicks(Math.max(...data.map((d) => Math.max(d.current, d.previous ?? 0))));

  return (
    <Card>
      <div role="group" aria-label="เลือกตัวชี้วัดของกราฟ" className="grid grid-cols-2 gap-1 p-2 lg:grid-cols-4">
        {METRICS.map((m) => (
          // ปุ่มดูที่มาอยู่ข้างแท็บ ไม่ซ้อนใน <button> ของแท็บ
          <div key={m.key} className="group/kpi relative">
            <MetricTab
              metric={m}
              kpis={kpis}
              previousKpis={previousKpis}
              selected={m.key === metricKey}
              onSelect={() => onMetricChange(m.key)}
            />
            {onTrace && (
              <button
                type="button"
                onClick={() => onTrace(m.key)}
                aria-label={`ดูที่มาของตัวเลข${m.label}`}
                title="ดูที่มาของตัวเลข"
                className="absolute top-2 right-2 inline-flex size-7 items-center justify-center rounded-md text-ink-muted opacity-60 transition active:scale-[0.97] hover:bg-canvas hover:text-chart hover:opacity-100 focus-visible:opacity-100 group-hover/kpi:opacity-100"
              >
                <TraceIcon className="size-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="border-t border-line px-4 pt-4 pb-4 sm:px-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-subtle">
            {showAverage && (
              <span className="flex items-center gap-1.5">
                <span className="h-0.5 w-4 rounded-full bg-chart opacity-35" />
                รายวัน
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <span className={`w-4 rounded-full bg-chart ${showAverage ? "h-[3px]" : "h-0.5"}`} />
              {showAverage && "เฉลี่ย 7 วัน · "}
              {formatRange(range.start, range.end)}
            </span>
            {showPrevious && (
              <span className="flex items-center gap-1.5">
                <span className="w-4 border-t-2 border-dashed border-chart-soft" />
                {formatRange(range.previous.start, range.previous.end)}
              </span>
            )}
          </div>
          <Segmented
            label="ความละเอียดของกราฟ"
            value={granularity}
            onChange={onGranularityChange}
            options={GRANULARITY.map((g) => ({
              ...g,
              disabled: (g.value === "week" && range.days < 14) || (g.value === "month" && range.days < 60),
            }))}
          />
        </div>

        {isEmpty ? (
          <div className="flex h-72 flex-col items-center justify-center rounded-lg bg-surface-hover text-center">
            <CupIcon className="mb-2 size-7 text-chart-soft" />
            <p className="text-sm font-medium text-ink">ไม่มียอดขายในช่วงเวลานี้</p>
            <p className="mt-1 max-w-xs text-[13px] text-ink-subtle">
              สาขานี้อาจยังไม่เปิดในช่วงที่เลือก ลองเลือกช่วงเวลาที่ยาวขึ้น หรือเปลี่ยนเป็นทุกสาขา
            </p>
          </div>
        ) : (
          <div
            // key ใหม่ทุกครั้งที่ตัวชี้วัด/ช่วง/สาขาเปลี่ยน → กราฟใหม่ค่อย ๆ ปรากฏ (ตัวเส้นไม่วิ่ง ตามกติกา DESIGN.md)
            key={`${metric.key}|${range.start}|${range.end}|${granularity}|${kpis.totalRevenue}|${kpis.orderCount}`}
            className="h-72 animate-fade-in"
            role="img"
            aria-label={`กราฟ${metric.label} ${formatRange(range.start, range.end)}`}
          >
            <ResponsiveContainer>
              <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="var(--color-line)" vertical={false} />
                <XAxis
                  dataKey="key"
                  tickFormatter={(k) => formatBucket(k, granularity, true)}
                  tick={{ fontSize: 12, fill: "var(--color-ink-subtle)" }}
                  tickLine={false}
                  axisLine={{ stroke: "var(--color-line)" }}
                  minTickGap={32}
                  tickMargin={8}
                />
                <YAxis
                  tickFormatter={metric.axis}
                  ticks={ticks}
                  domain={[0, ticks.at(-1)]}
                  tick={{ fontSize: 12, fill: "var(--color-ink-subtle)" }}
                  tickLine={false}
                  axisLine={false}
                  width={64}
                />
                <Tooltip
                  content={<TrendTooltip metric={metric} granularity={granularity} showAverage={showAverage} />}
                  offset={24}
                  cursor={{ stroke: "var(--color-line-strong)" }}
                />
                {/* ไล่สีทองโลหะตามแนวนอน: ช่วงสว่าง-มืดสลับ ทำให้เส้นดูมีประกาย */}
                <defs>
                  <linearGradient id="trend-gold" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0" stopColor="var(--lg-dark)" />
                    <stop offset=".22" stopColor="var(--lg-mid)" />
                    <stop offset=".36" stopColor="var(--lg-light)" />
                    <stop offset=".5" stopColor="var(--lg-mid)" />
                    <stop offset=".68" stopColor="var(--lg-dark)" />
                    <stop offset=".84" stopColor="var(--lg-light)" />
                    <stop offset="1" stopColor="var(--lg-mid)" />
                  </linearGradient>
                </defs>
                {showPrevious && (
                  <Line
                    type="monotone"
                    dataKey="previous"
                    stroke="var(--color-chart-soft)"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={false}
                    activeDot={false}
                    isAnimationActive={false}
                  />
                )}
                {showAverage && (
                  <Line
                    type="monotone"
                    dataKey="current"
                    stroke="var(--color-chart)"
                    strokeOpacity={0.3}
                    strokeWidth={1.5}
                    dot={false}
                    activeDot={{ r: 3, strokeWidth: 0, fill: "var(--color-chart)", fillOpacity: 0.5 }}
                    isAnimationActive={false}
                  />
                )}
                {showAverage && (
                  <Line
                    type="monotone"
                    dataKey="average"
                    className="gold-line"
                    stroke="url(#trend-gold)"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--color-surface)" }}
                    isAnimationActive={false}
                  />
                )}
                {!showAverage && hasPartial && (
                  <Line
                    type="monotone"
                    dataKey="dashed"
                    stroke="var(--color-chart)"
                    strokeWidth={2}
                    strokeDasharray="2 4"
                    dot={false}
                    activeDot={false}
                    isAnimationActive={false}
                  />
                )}
                {!showAverage && (
                  <Line
                    type="monotone"
                    dataKey="solid"
                    className="gold-line"
                    stroke="url(#trend-gold)"
                    strokeWidth={2.25}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--color-surface)" }}
                    isAnimationActive={false}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        <p className="mt-3 text-xs text-ink-muted">
          <span className="font-medium text-ink-subtle">{metric.label}:</span> {metric.definition}
          {showAverage && " · เส้นเข้มคือค่าเฉลี่ย 7 วัน (วันนั้นกับ 6 วันก่อนหน้า) เส้นจางคือยอดรายวัน"}
          {!showAverage && hasPartial && " · เส้นจุดคือช่วงที่มีวันไม่ครบ"}
          {onTrace && " · กดไอคอนแว่นขยายที่ตัวเลขเพื่อดูที่มาและสูตรตรวจใน Excel"}
        </p>
      </div>
    </Card>
  );
}
