// Lab 4.4–4.5 · พยากรณ์และวันผิดปกติ
// คำนวณในเบราว์เซอร์จาก analytics/daily (ยอดรายวันแยกสาขา ~2,700 แถว) จึงเปลี่ยนสาขาได้ทันทีโดยไม่อ่าน Firestore เพิ่ม
import { useMemo, useState } from "react";
import {
  ResponsiveContainer, ComposedChart, Line, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine,
} from "recharts";
import {
  AnalyticsShell, Card, Pending, Insight, MAIN, BAR, SOFT, INK, SUBTLE, LINE_STRONG, DOWN,
  axis, grid, legend, tooltip, buttonClass, thClass, rowClass, thaiDay,
} from "./ui.jsx";
import { AlertIcon, Segmented } from "../components/ui.jsx";
import { useAnalytics } from "./useAnalytics.js";
import { toSeries } from "../lib/analytics/daily.js";
import { seasonalForecast, backtest, mape } from "../lib/analytics/forecast.js";
import { addDays } from "../lab3/time.js";
import { scoreAnomalies } from "../lib/analytics/anomaly.js";
import { fmtBaht, fmtShortBaht } from "../lib/metrics.js";

const BRANCHES = ["สยาม", "สีลม", "อารีย์", "บางนา", "มหาวิทยาลัย"];
const BRANCH_OPTIONS = [{ value: "all", label: "รวม" }, ...BRANCHES.map((b) => ({ value: b, label: b }))];
const VIEW_OPTIONS = [{ value: "daily", label: "รายวัน" }, { value: "weekly", label: "รายสัปดาห์" }];
const HORIZON = 28;
const shortDay = (iso) => new Date(iso + "T00:00:00").toLocaleDateString("th-TH", { day: "numeric", month: "short" });
const tryRun = (f) => { try { return { value: f() }; } catch (e) { return { error: e.message }; } };

// Lab 4.4B · วันจันทร์ของสัปดาห์ (จันทร์–อาทิตย์) ที่วันนั้นอยู่
const mondayOf = (ymd) => addDays(ymd, -((new Date(ymd + "T00:00:00Z").getUTCDay() + 6) % 7));

/** รวมแถว { date, ...fields } เป็นรายสัปดาห์ · fullOnly = เก็บเฉพาะสัปดาห์ที่มีครบ 7 วัน */
function byWeek(rows, fields, fullOnly = false) {
  const map = new Map();
  for (const r of rows) {
    const k = mondayOf(r.date);
    const w = map.get(k) ?? { date: k, days: 0, ...Object.fromEntries(fields.map((f) => [f, 0])) };
    w.days += 1;
    for (const f of fields) w[f] += r[f] ?? 0;
    map.set(k, w);
  }
  return [...map.values()].filter((w) => !fullOnly || w.days === 7);
}

function ForecastCard({ daily }) {
  const [branchKey, setBranchKey] = useState("all");
  const [view, setView] = useState("daily");
  const branch = branchKey === "all" ? null : branchKey;
  const weekly = view === "weekly";
  const result = useMemo(() => tryRun(() => {
    const series = toSeries(daily, branch);
    const bt = backtest(series, HORIZON);
    const fc = seasonalForecast(series, HORIZON);
    const recent = series.slice(-56);
    const last = recent[recent.length - 1];
    const chart = [
      ...recent.map((s) => ({ date: s.date, actual: s.revenue })),
      ...fc.map((f) => ({ date: f.date, forecast: f.forecast, band: [f.forecast * (1 - bt.band), f.forecast * (1 + bt.band)] })),
    ];
    chart[recent.length - 1] = { ...chart[recent.length - 1], forecast: last.revenue }; // ต่อเส้นให้ไม่ขาด
    const next7 = fc.slice(0, 7).reduce((s, f) => s + f.forecast, 0);
    // รายสัปดาห์: ใช้ผลย้อนทดสอบชุดเดิม รวมเป็นสัปดาห์เต็ม แล้วคิด MAPE ด้วยฟังก์ชันเดิม
    const weeks = byWeek(bt.test, ["actual", "seasonal", "flat"], true);
    const weeklyMape = weeks.length ? {
      seasonal: mape(weeks.map((w) => w.actual), weeks.map((w) => w.seasonal)),
      flat: mape(weeks.map((w) => w.actual), weeks.map((w) => w.flat)),
      n: weeks.length,
    } : null;
    // กราฟรายสัปดาห์: 8 สัปดาห์จริง + 4 สัปดาห์คาดการณ์ (สัปดาห์ที่คร่อมวันสุดท้ายมีทั้งสองส่วนซ้อนกัน)
    const weekChart = byWeek([
      ...recent.map((s) => ({ date: s.date, actual: s.revenue })),
      ...fc.map((f) => ({ date: f.date, forecast: f.forecast })),
    ], ["actual", "forecast"]).map((w) => ({ date: w.date, actual: w.actual || null, forecast: w.forecast || null }));
    return { bt, chart, next7, lastDate: last.date, weeklyMape, weekChart };
  }), [daily, branch]);

  const r = result.value;
  const showWeekly = weekly && r?.weeklyMape;
  return (
    <Card title="พยากรณ์ยอดขาย 28 วัน" sub="ค่าเฉลี่ยวันเดียวกันของสัปดาห์ 8 สัปดาห์ล่าสุด · แถบ = ช่วงที่คาดว่าครอบคลุมราว 80% ของวัน">
      <div className="-mx-4 mb-4 flex flex-wrap items-center gap-2 overflow-x-auto px-4 sm:-mx-5 sm:px-5">
        <Segmented label="ดูเป็น" value={view} onChange={setView} options={VIEW_OPTIONS} />
        <Segmented label="สาขา" value={branchKey} onChange={setBranchKey} options={BRANCH_OPTIONS} />
      </div>
      {result.error ? <Pending lab="Lab 4.4" error={result.error} /> : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="คาดการณ์ 7 วันข้างหน้า" value={fmtBaht(r.next7)} />
            {showWeekly ? (
              <>
                <Stat label={`ย้อนทดสอบ ${r.weeklyMape.n} สัปดาห์เต็ม: คลาดเคลื่อนเฉลี่ยต่อสัปดาห์`} value={`${r.weeklyMape.seasonal.toFixed(1)}%`}
                      note={`รายวัน ${r.bt.mapeSeasonal.toFixed(1)}% · พอรวมทั้งสัปดาห์ วันที่พลาดสูงกับพลาดต่ำหักล้างกัน`} />
                <Stat label="ถ้าใช้ค่าเฉลี่ย 28 วันเส้นตรง (รายสัปดาห์)" value={`${r.weeklyMape.flat.toFixed(1)}%`} note={`รายวัน ${r.bt.mapeFlat.toFixed(1)}%`} muted />
              </>
            ) : (
              <>
                <Stat label="ย้อนทดสอบ 28 วัน: คลาดเคลื่อนเฉลี่ยต่อวัน" value={`${r.bt.mapeSeasonal.toFixed(1)}%`} note="วิธีดูวันในสัปดาห์" />
                <Stat label="ถ้าใช้ค่าเฉลี่ย 28 วันเส้นตรง" value={`${r.bt.mapeFlat.toFixed(1)}%`} note="ตัวเปรียบเทียบ" muted />
              </>
            )}
          </div>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              {weekly ? (
                <ComposedChart data={r.weekChart} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
                  <CartesianGrid {...grid} />
                  <XAxis dataKey="date" tickFormatter={shortDay} {...axis} />
                  <YAxis tickFormatter={fmtShortBaht} width={56} domain={[0, "auto"]} {...axis} />
                  <Tooltip labelFormatter={(d) => `สัปดาห์ ${thaiDay(d)} – ${thaiDay(addDays(d, 6))}`} formatter={(v, n) => [fmtBaht(v), n]} {...tooltip} />
                  <Legend {...legend} />
                  <Bar name="ยอดจริง" dataKey="actual" stackId="w" fill={BAR} isAnimationActive={false} />
                  <Bar name="คาดการณ์" dataKey="forecast" stackId="w" fill={SOFT} fillOpacity={0.55} stroke={MAIN} strokeDasharray="4 3"
                       radius={[4, 4, 0, 0]} isAnimationActive={false} />
                </ComposedChart>
              ) : (
                <ComposedChart data={r.chart} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
                  <CartesianGrid {...grid} />
                  <XAxis dataKey="date" tickFormatter={shortDay} minTickGap={36} {...axis} />
                  <YAxis tickFormatter={fmtShortBaht} width={56} domain={[0, "auto"]} {...axis} />
                  <Tooltip labelFormatter={thaiDay} formatter={(v, n) => [Array.isArray(v) ? `${fmtBaht(v[0])} – ${fmtBaht(v[1])}` : fmtBaht(v), n]} {...tooltip} />
                  <Legend {...legend} />
                  <ReferenceLine x={r.lastDate} stroke={LINE_STRONG} strokeDasharray="3 3" label={{ value: "ข้อมูลถึง", position: "insideTopLeft", fontSize: 11, fill: SUBTLE }} />
                  <Area name="ช่วงคาดการณ์" dataKey="band" stroke="none" fill={MAIN} fillOpacity={0.14} isAnimationActive={false} />
                  <Line name="ยอดจริง" dataKey="actual" stroke={INK} strokeWidth={1.75} dot={false} isAnimationActive={false} />
                  <Line name="คาดการณ์" dataKey="forecast" stroke={MAIN} strokeWidth={2} strokeDasharray="6 4" dot={false} isAnimationActive={false} />
                </ComposedChart>
              )}
            </ResponsiveContainer>
          </div>
          {showWeekly ? (
            <Insight>
              {branch ?? "ภาพรวม"} รายสัปดาห์: วิธีดูวันในสัปดาห์ {r.weeklyMape.seasonal.toFixed(0)}% · ค่าเฉลี่ยเส้นตรง {r.weeklyMape.flat.toFixed(0)}%
              {" "}พอรวมยอดทั้งสัปดาห์ รูปแบบวันธรรมดากับเสาร์-อาทิตย์ไม่มีผลแล้ว สองวิธีจึงใกล้กัน · ใช้วิธีดูวันในสัปดาห์เมื่อต้องจัดกะหรือสั่งของรายวัน
            </Insight>
          ) : (
            <Insight>
              {r.bt.mapeFlat > r.bt.mapeSeasonal * 1.5
                ? `${branch ?? "ภาพรวม"}: การดูวันในสัปดาห์ช่วยลดความคลาดเคลื่อนจาก ${r.bt.mapeFlat.toFixed(0)}% เหลือ ${r.bt.mapeSeasonal.toFixed(0)}% เพราะยอดวันธรรมดากับเสาร์-อาทิตย์ต่างกันมาก`
                : `${branch ?? "ภาพรวม"}: สองวิธีแม่นพอ ๆ กัน (${r.bt.mapeSeasonal.toFixed(0)}% กับ ${r.bt.mapeFlat.toFixed(0)}%) ${branch ? "" : "เพราะสาขาออฟฟิศกับห้างขายดีคนละวัน พอรวมกันรูปแบบรายสัปดาห์จึงหักล้างกัน"}`}
              {" "}ใช้วางแผนสต็อกและกะพนักงานรายสัปดาห์ได้ แต่ไม่ควรใช้ตัดสินยอดรายวันของสาขาเดียว
            </Insight>
          )}
        </>
      )}
    </Card>
  );
}

function Stat({ label, value, note, muted }) {
  return (
    <div className="rounded-lg bg-canvas px-3.5 py-3">
      <p className="text-xs text-ink-subtle">{label}</p>
      <p className={`font-numeral mt-1 text-[28px] leading-tight font-light tabular-nums ${muted ? "text-ink-subtle" : "text-ink"}`}>{value}</p>
      {note && <p className="mt-0.5 text-xs text-ink-muted">{note}</p>}
    </div>
  );
}

// ต่ำกว่าปกติ = สีลง (down) · สูงกว่าปกติ = สีครีมา (ไม่ใช้เขียว เพราะเขียวสงวนไว้สำหรับ "เทียบกับช่วงก่อนแล้วโตขึ้น")
const toneOf = (change) => (change < 0 ? DOWN : MAIN);

function AnomalyCard({ daily, holidays }) {
  const [focus, setFocus] = useState(null);
  const result = useMemo(() => tryRun(() => scoreAnomalies(daily, holidays)), [daily, holidays]);
  if (result.error) return <Card title="วันที่ยอดขายผิดปกติ"><Pending lab="Lab 4.5" error={result.error} /></Card>;
  const all = result.value;
  const top = all.filter((a) => !a.holiday).slice(0, 15);
  const holidayHits = all.filter((a) => a.holiday).slice(0, 5);
  return (
    <Card title="วันที่ยอดขายผิดปกติ 15 อันดับ"
          sub="เทียบกับค่ากลางของวันเดียวกันของสัปดาห์ใน 8 สัปดาห์ก่อน · ไม่นับวันหยุดราชการ · คลิกแถวเพื่อดูกราฟรอบวันนั้น">
      {focus && <ZoomChart daily={daily} all={all} focus={focus} onClose={() => setFocus(null)} />}
      <div className="-mx-4 overflow-x-auto sm:-mx-5">
        <table className="w-full min-w-[600px] text-[13px] tabular-nums">
          <thead className="text-left">
            <tr>
              <th className={`${thClass} pl-4 sm:pl-5`}>#</th>
              <th className={thClass}>วันที่</th>
              <th className={thClass}>สาขา</th>
              <th className={`${thClass} text-right`}>ยอดจริง</th>
              <th className={`${thClass} text-right`}>ปกติ</th>
              <th className={`${thClass} pl-4 sm:pr-5`}>ต่างจากปกติ</th>
            </tr>
          </thead>
          <tbody>
            {top.map((a, i) => {
              const sel = focus && focus.date === a.date && focus.branch === a.branch;
              const pctChange = Math.round(Math.abs(a.change) * 100);
              return (
                <tr key={a.date + a.branch} onClick={() => setFocus(sel ? null : a)} aria-selected={!!sel}
                    className={`${rowClass} cursor-pointer ${sel ? "bg-surface-selected" : "hover:bg-surface-hover"}`}>
                  <td className="font-numeral py-2.5 pr-3 pl-4 text-ink-muted sm:pl-5">{i + 1}</td>
                  <td className="pr-3 text-ink">
                    {thaiDay(a.date)} <span className="text-ink-muted">{new Date(a.date + "T00:00:00").toLocaleDateString("th-TH", { weekday: "short" })}</span>
                  </td>
                  <td className="pr-3 text-ink">{a.branch}</td>
                  <td className="pr-3 text-right text-ink">{fmtBaht(a.actual)}</td>
                  <td className="pr-3 text-right text-ink-subtle">{fmtBaht(a.expected)}</td>
                  <td className="pl-4 sm:pr-5">
                    <span className={`inline-flex rounded-md px-1.5 py-0.5 text-xs font-medium ${a.change < 0 ? "bg-down-bg text-down" : "bg-surface-selected text-chart"}`}>
                      {a.change < 0 ? `▼ ต่ำกว่าปกติ ${pctChange}%` : `▲ สูงกว่าปกติ ${pctChange}%`}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Insight>
        อันดับต้น ๆ คือวันที่ควรโทรถามผู้จัดการสาขาว่าเกิดอะไรขึ้น · ระบบบอกได้ว่า “ผิดปกติ” แต่บอกไม่ได้ว่า “เพราะอะไร”
        {holidayHits.length > 0 && <> · วันหยุดที่ยอดเปลี่ยนมากแต่ไม่นับ เช่น {holidayHits.slice(0, 3).map((h) => `${h.holiday} (${h.branch})`).join(", ")}</>}
      </Insight>
    </Card>
  );
}

// Lab 4.5B · คลิกแถวแล้วซูม: ยอดจริงของสาขานั้น ±28 วัน เทียบเส้นค่าปกติ (expected จาก scoreAnomalies)
function ZoomChart({ daily, all, focus, onClose }) {
  const data = useMemo(() => {
    const actual = new Map(daily.filter((d) => d.branch === focus.branch).map((d) => [d.date, d.revenue]));
    const expected = new Map(all.filter((a) => a.branch === focus.branch).map((a) => [a.date, a.expected]));
    return Array.from({ length: 57 }, (_, i) => {
      const date = addDays(focus.date, i - 28);
      return { date, actual: actual.get(date) ?? 0, expected: expected.get(date) ?? null };
    });
  }, [daily, all, focus]);
  const color = toneOf(focus.change);
  return (
    <div className="mb-4 animate-fade-in rounded-xl bg-canvas p-3 sm:p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] text-ink-subtle">
          <span className="font-semibold text-ink">{focus.branch} · {thaiDay(focus.date)}</span>{" "}
          <span className="font-medium" style={{ color }}>
            {fmtBaht(focus.actual)} ({focus.change < 0 ? "ต่ำกว่า" : "สูงกว่า"}ปกติ {Math.round(Math.abs(focus.change) * 100)}%)
          </span>
          {" "}· ±28 วันรอบวันนั้น
        </p>
        <button type="button" onClick={onClose} aria-label="ปิดกราฟ" className={buttonClass}>ปิด</button>
      </div>
      <div className="mt-2 h-60">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
            <CartesianGrid {...grid} />
            <XAxis dataKey="date" tickFormatter={shortDay} minTickGap={36} {...axis} />
            <YAxis tickFormatter={fmtShortBaht} width={56} domain={[0, "auto"]} {...axis} />
            <Tooltip labelFormatter={thaiDay} formatter={(v, n) => [fmtBaht(v), n]} {...tooltip} />
            <Legend {...legend} />
            <ReferenceLine x={focus.date} stroke={color} strokeDasharray="3 3" />
            <Line name="ค่าปกติ" dataKey="expected" stroke={SOFT} strokeWidth={2} strokeDasharray="6 4" dot={false} connectNulls isAnimationActive={false} />
            <Line name="ยอดจริง" dataKey="actual" stroke={INK} strokeWidth={1.75} isAnimationActive={false}
                  dot={(p) => p.payload.date === focus.date
                    ? <circle key={p.key} cx={p.cx} cy={p.cy} r={6} fill={color} stroke="var(--color-surface)" strokeWidth={2} />
                    : <g key={p.key} />} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function ForecastTab({ source }) {
  const state = useAnalytics(source);
  return (
    <AnalyticsShell source={source} state={state} title="พยากรณ์และวันผิดปกติ"
                    intro="สัปดาห์หน้าน่าจะขายได้เท่าไหร่ และวันไหนที่ยอดขายต่างจากปกติจนควรโทรถามสาขา">
      {(d) => d.daily.error ? <Pending lab="pipeline" error={d.daily.error} /> : (
        <div className="space-y-4">
          {d.meta.alerts?.length > 0 && (
            <p role="alert" className="flex items-start gap-2 rounded-lg bg-down-bg px-3.5 py-3 text-[13px] text-down">
              <AlertIcon className="mt-0.5 size-4 shrink-0" />
              ยอดวันล่าสุดผิดปกติ: {d.meta.alerts.map((a) => `${a.branch} ${fmtBaht(a.actual)} (ปกติ ${fmtBaht(a.expected)})`).join(", ")}
            </p>
          )}
          <ForecastCard daily={d.daily.rows} />
          <AnomalyCard daily={d.daily.rows} holidays={d.meta.holidays ?? {}} />
        </div>
      )}
    </AnalyticsShell>
  );
}
