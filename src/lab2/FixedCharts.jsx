// Lab 2.2 · กราฟที่ซ่อมแล้ว เทียบกับ BadChart1 … BadChart5
// ทุกกราฟ: สีหลักสีเดียว, ตัวเลขมี ฿ และจุลภาค, ข้อความสรุปด้านบนคำนวณจากข้อมูลจริงทุกครั้ง
import { useMemo } from "react";
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, LabelList, ReferenceLine,
} from "recharts";
import { revenueByProduct, monthlyRevenue, daysInMonth, branchPerformance, weeklyRevenue, thaiMonth } from "./lab2Metrics.js";
import { formatBaht, formatBahtShort, formatDate } from "../lib/metrics.js";

const MAIN = "var(--color-chart-bar)";
const tick = { fontSize: 12, fill: "var(--color-ink-subtle)" };
const pct = (n) => `${(n * 100).toFixed(1)}%`;
const times = (a, b) => `${(a / b).toFixed(1)} เท่า`;

// กรอบของทุกกราฟ: ข้อสรุป 1 บรรทัด + กราฟเต็มพื้นที่ที่เหลือ
function Frame({ summary, children }) {
  return (
    <div className="flex h-full flex-col">
      <p className="mb-2 px-1 text-sm font-medium text-ink">{summary}</p>
      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
      </div>
    </div>
  );
}

// Tooltip แบบเดียวกับการ์ดอื่นของ Dashboard: หัวข้อ + รายการ "ป้าย ค่า"
function Tip({ active, payload, title, lines }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg bg-surface px-3 py-2 text-[13px] shadow-[0_4px_16px_rgb(0_0_0/0.12),0_0_0_1px_rgb(0_0_0/0.06)]">
      <p className="mb-1 font-semibold text-ink">{title(d)}</p>
      {lines(d).map(([label, value]) => (
        <div key={label} className="flex justify-between gap-4">
          <span className="text-ink-subtle">{label}</span>
          <span className="font-medium text-ink tabular-nums">{value}</span>
        </div>
      ))}
    </div>
  );
}

/** กราฟ 1: แท่งแนวนอน 10 เมนูแรก เรียงมากไปน้อย ชื่อเมนูอยู่ข้างแท่ง ไม่ต้องจับคู่สี */
export function FixedChart1({ rows, products }) {
  const all = useMemo(() => revenueByProduct(rows, products), [rows, products]);
  const top = all.slice(0, 10);
  const [first, second] = all;
  const summary = `${first.name} ขายดีที่สุด ${pct(first.share)} ของยอดขาย · ${times(first.revenue, second.revenue)}ของอันดับ 2 (${second.name}) · 10 อันดับแรกจาก ${all.length} เมนู`;
  return (
    <Frame summary={summary}>
      <BarChart data={top} layout="vertical" margin={{ left: 4, right: 56 }}>
        <XAxis type="number" hide domain={[0, "dataMax"]} />
        <YAxis type="category" dataKey="name" width={150} tick={tick} tickLine={false} axisLine={false} interval={0} />
        <Tooltip
          cursor={{ fill: "var(--color-surface-hover)" }}
          content={<Tip title={(d) => d.name} lines={(d) => [["ยอดขาย", formatBaht(d.revenue)], ["สัดส่วน", pct(d.share)]]} />}
        />
        <Bar dataKey="revenue" fill={MAIN} radius={[0, 4, 4, 0]} isAnimationActive={false}>
          <LabelList dataKey="share" position="right" formatter={pct} style={{ fontSize: 12, fill: "var(--color-ink)" }} />
        </Bar>
      </BarChart>
    </Frame>
  );
}

/** กราฟ 2: แกนเริ่มที่ 0 เรียงมากไปน้อย บอกจำนวนวันที่เปิดขายของแต่ละสาขาไว้ด้วย */
export function FixedChart2({ rows }) {
  const data = useMemo(() => branchPerformance(rows).sort((a, b) => b.revenue - a.revenue), [rows]);
  const max = data[0];
  const min = data[data.length - 1];
  const fullDays = Math.max(...data.map((d) => d.days));
  const summary = `${max.branch}ขายได้มากที่สุด ${times(max.revenue, min.revenue)}ของ${min.branch}${
    min.days < fullDays ? ` แต่${min.branch}เปิดขายมาแค่ ${min.days} วัน (สาขาอื่นราว ${fullDays} วัน)` : ""
  }`;
  return (
    <Frame summary={summary}>
      <BarChart data={data} margin={{ top: 20, left: 4, right: 4 }}>
        <CartesianGrid stroke="var(--color-line)" vertical={false} />
        <XAxis dataKey="branch" tick={tick} tickLine={false} axisLine={{ stroke: "var(--color-line-strong)" }} interval={0} />
        <YAxis domain={[0, "auto"]} tickFormatter={formatBahtShort} tick={tick} tickLine={false} axisLine={false} width={56} />
        <Tooltip
          cursor={{ fill: "var(--color-surface-hover)" }}
          content={<Tip title={(d) => `สาขา${d.branch}`} lines={(d) => [["ยอดขายรวม", formatBaht(d.revenue)], ["วันที่เปิดขาย", `${d.days} วัน`]]} />}
        />
        <Bar dataKey="revenue" fill={MAIN} radius={[4, 4, 0, 0]} isAnimationActive={false}>
          <LabelList dataKey="revenue" position="top" formatter={formatBaht} style={{ fontSize: 12, fill: "var(--color-ink)" }} />
        </Bar>
      </BarChart>
    </Frame>
  );
}

/** กราฟ 3: รวมรายสัปดาห์ (เฉพาะสัปดาห์ที่ครบ 7 วัน) เส้นบาง ไม่มีจุด ป้ายแกนเป็นเดือน และบอกวันที่เปิดสาขาใหม่ */
export function FixedChart3({ rows }) {
  const data = useMemo(() => weeklyRevenue(rows), [rows]);
  // สาขาที่เปิดทีหลังวันแรกของข้อมูล: เส้นที่กระโดดขึ้นตรงนั้นมาจากสาขาใหม่ ไม่ใช่สาขาเดิมขายดีขึ้น
  const openings = useMemo(() => {
    const first = new Map();
    for (const r of rows) if (!first.has(r.branch) || r.date < first.get(r.branch)) first.set(r.branch, r.date);
    const start = data[0]?.week ?? "";
    return [...first].filter(([, d]) => d > start).map(([branch, date]) => ({
      branch, week: data.findLast((w) => w.week <= date)?.week,
    }));
  }, [rows, data]);

  const n = Math.min(4, Math.floor(data.length / 2));
  const avg = (list) => list.reduce((s, w) => s + w.revenue, 0) / list.length;
  const early = avg(data.slice(0, n));
  const late = avg(data.slice(-n));
  const change = ((late - early) / early) * 100;
  const summary = `ยอดต่อสัปดาห์${change >= 0 ? "โตขึ้น" : "ลดลง"} ${Math.abs(change).toFixed(0)}% จาก ${formatBaht(early)} (${n} สัปดาห์แรก) เป็น ${formatBaht(late)} (${n} สัปดาห์ล่าสุด)${
    openings.length ? ` · ส่วนหนึ่งมาจากการเปิดสาขา${openings.map((o) => o.branch).join(", ")}` : ""
  }`;
  // ป้ายแกน X: สัปดาห์แรกของแต่ละไตรมาส อ่านง่ายไม่เบียด
  const ticks = data.filter((w, i) => i === 0 || (w.week.slice(5, 7) !== data[i - 1].week.slice(5, 7) && ["01", "04", "07", "10"].includes(w.week.slice(5, 7)))).map((w) => w.week);

  return (
    <Frame summary={summary}>
      <LineChart data={data} margin={{ top: 16, left: 4, right: 12 }}>
        <CartesianGrid stroke="var(--color-line)" vertical={false} />
        <XAxis dataKey="week" ticks={ticks} tickFormatter={(w) => thaiMonth(w.slice(0, 7))} tick={tick} tickLine={false} axisLine={{ stroke: "var(--color-line-strong)" }} />
        <YAxis domain={[0, "auto"]} tickFormatter={formatBahtShort} tick={tick} tickLine={false} axisLine={false} width={56} />
        <Tooltip
          cursor={{ stroke: "var(--color-line-strong)" }}
          content={<Tip title={(d) => `7 วันเริ่ม ${formatDate(d.week)}`} lines={(d) => [["ยอดขาย", formatBaht(d.revenue)]]} />}
        />
        {openings.map((o) => (
          <ReferenceLine key={o.branch} x={o.week} stroke="var(--color-ink-muted)" strokeDasharray="4 4"
            label={{ value: `เปิด${o.branch}`, position: "insideTopLeft", fontSize: 12, fill: "var(--color-ink-subtle)" }} />
        ))}
        <Line dataKey="revenue" stroke="var(--color-chart)" strokeWidth={2} dot={false} isAnimationActive={false} />
      </LineChart>
    </Frame>
  );
}

/** กราฟ 4: ยอดเฉลี่ยต่อวันรายเดือน เดือนที่ข้อมูลไม่ครบแสดงสีจางและบอกจำนวนวัน */
export function FixedChart4({ rows }) {
  const data = useMemo(
    () => monthlyRevenue(rows).map((m) => ({ ...m, full: daysInMonth(m.month), partial: m.days < daysInMonth(m.month) })),
    [rows]
  );
  const last = data[data.length - 1];
  const prev = data[data.length - 2];
  const change = ((last.perDay - prev.perDay) / prev.perDay) * 100;
  const verdict = Math.abs(change) < 5 ? "ยอดไม่ได้ตก" : change > 0 ? "ยอดดีขึ้น" : "ยอดลดลงจริง";
  const summary = `${verdict} · ${thaiMonth(last.month)} ขายได้ ${formatBaht(last.perDay)}/วัน ${change >= 0 ? "สูงกว่า" : "ต่ำกว่า"} ${thaiMonth(prev.month)} (${formatBaht(prev.perDay)}/วัน) ${Math.abs(change).toFixed(1)}%${
    last.partial ? ` · ยอดรวมดูต่ำเพราะมีข้อมูลแค่ ${last.days} จาก ${last.full} วัน` : ""
  }`;
  return (
    <Frame summary={summary}>
      <BarChart data={data} margin={{ top: 20, left: 4, right: 24 }}>
        <CartesianGrid stroke="var(--color-line)" vertical={false} />
        <XAxis dataKey="month" tickFormatter={thaiMonth} tick={{ ...tick, fontSize: 11 }} tickLine={false} axisLine={{ stroke: "var(--color-line-strong)" }} interval={1} />
        <YAxis domain={[0, "auto"]} tickFormatter={formatBahtShort} tick={tick} tickLine={false} axisLine={false} width={56} />
        <Tooltip
          cursor={{ fill: "var(--color-surface-hover)" }}
          content={<Tip title={(d) => thaiMonth(d.month)} lines={(d) => [
            ["ยอดเฉลี่ยต่อวัน", formatBaht(d.perDay)],
            ["ยอดรวม", formatBaht(d.revenue)],
            ["วันที่มีข้อมูล", `${d.days} / ${d.full} วัน`],
          ]} />}
        />
        <Bar dataKey="perDay" fill={MAIN} radius={[4, 4, 0, 0]} isAnimationActive={false}>
          {data.map((d) => <Cell key={d.month} fillOpacity={d.partial ? 0.45 : 1} />)}
          <LabelList dataKey="days" position="top"
            content={({ x, y, width, index }) => data[index].partial ? (
              <text x={x + width / 2} y={y - 6} textAnchor="middle" fontSize={11} fill="var(--color-ink-subtle)">
                {data[index].days}/{data[index].full} วัน
              </text>
            ) : null} />
        </Bar>
      </BarChart>
    </Frame>
  );
}

/** กราฟ 5: ยอดเฉลี่ยต่อวันที่เปิดขาย เรียงมากไปน้อย พร้อมเดือนที่ต่ำสุดของสาขาอันดับสุดท้าย (ฤดูกาล/ทำเล) */
export function FixedChart5({ rows }) {
  const data = useMemo(() => branchPerformance(rows).sort((a, b) => b.perDay - a.perDay), [rows]);
  const lowest = data[data.length - 1];
  // เดือนที่ยอดต่อวันต่ำสุดของสาขานี้ (ไม่นับเดือนที่ข้อมูลไม่ครบ) ชี้ว่าอาจมีปัจจัยทำเลหรือฤดูกาล
  const worst = useMemo(() => {
    const own = monthlyRevenue(rows.filter((r) => r.branch === lowest.branch)).filter((m) => m.days >= daysInMonth(m.month) - 1);
    return own.reduce((a, b) => (b.perDay < a.perDay ? b : a), own[0]);
  }, [rows, lowest.branch]);
  const summary = `เทียบยอดต่อวันแล้ว ${lowest.branch}ต่ำสุด ${formatBaht(lowest.perDay)}/วัน${
    worst ? ` แต่ ${thaiMonth(worst.month)} เหลือแค่ ${formatBaht(worst.perDay)}/วัน` : ""
  } · ควรดูทำเลและฤดูกาลก่อนสรุปผลงานผู้จัดการ`;
  return (
    <Frame summary={summary}>
      <BarChart data={data} layout="vertical" margin={{ left: 4, right: 120 }}>
        <XAxis type="number" hide domain={[0, "dataMax"]} />
        <YAxis type="category" dataKey="branch" width={90} tick={tick} tickLine={false} axisLine={false} />
        <Tooltip
          cursor={{ fill: "var(--color-surface-hover)" }}
          content={<Tip title={(d) => `สาขา${d.branch}`} lines={(d) => [
            ["ยอดเฉลี่ยต่อวัน", formatBaht(d.perDay)],
            ["ยอดรวม", formatBaht(d.revenue)],
            ["วันที่เปิดขาย", `${d.days} วัน`],
          ]} />}
        />
        <Bar dataKey="perDay" fill={MAIN} radius={[0, 4, 4, 0]} isAnimationActive={false}>
          <LabelList dataKey="perDay" position="right"
            content={({ x, y, width, height, index }) => (
              <text x={x + width + 8} y={y + height / 2 + 4} fontSize={12} fill="var(--color-ink)">
                {formatBaht(data[index].perDay)}/วัน
                <tspan fill="var(--color-ink-muted)" dx={6}>{data[index].days} วัน</tspan>
              </text>
            )} />
        </Bar>
      </BarChart>
    </Frame>
  );
}
