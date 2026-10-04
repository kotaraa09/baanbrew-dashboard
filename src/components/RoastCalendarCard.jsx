import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { Card, CardHeader, useSeen } from "./ui.jsx";
import { formatBaht, formatDate } from "../lib/metrics.js";

const WEEKDAYS = ["จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์", "อาทิตย์"];
const SHORT = ["จ", "อ", "พ", "พฤ", "ศ", "ส", "อา"];
const MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const GAP = 3;
const LEVELS = 5;

// แบ่งระดับสีด้วย quantile ของวันที่มียอดขาย (ไม่ใช่ช่วงเท่า ๆ กัน) วันที่ขายดีผิดปกติวันเดียวจะไม่ทำให้วันอื่นจางหมด
function levelOf(thresholds, v) {
  if (v <= 0) return 0;
  let l = 1;
  while (l < LEVELS && v > thresholds[l - 1]) l++;
  return l;
}

// ปฏิทินคั่ว: ทุกวันในช่วงเป็นช่องหนึ่งช่อง คอลัมน์ = สัปดาห์, แถว = วันจันทร์ถึงอาทิตย์
// ยิ่งขายได้มาก ยิ่ง "คั่วเข้ม" (ธีมมืดกลับด้าน: ยิ่งขายมาก ครีม่ายิ่งสว่าง) · แท่งทางขวาคือยอดเฉลี่ยของแต่ละวันในสัปดาห์
export default function RoastCalendarCard({ days, subtitle, holidays = new Map() }) {
  const [hover, setHover] = useState(null);
  const [ref, seen] = useSeen(0.15);
  const gridRef = useRef(null);
  const [cell, setCell] = useState(14);

  const { columns, thresholds, weekdayAvg, best, quiet, monthMarks } = useMemo(() => {
    const lead = days[0]?.weekday ?? 0;
    const cols = [];
    days.forEach((d, i) => {
      const c = Math.floor((i + lead) / 7);
      (cols[c] ??= Array(7).fill(null))[d.weekday] = d;
    });
    const sales = days.map((d) => d.revenue).filter((v) => v > 0).sort((a, b) => a - b);
    const q = (p) => sales[Math.min(sales.length - 1, Math.floor(p * sales.length))] ?? 0;
    const sums = Array(7).fill(0);
    const counts = Array(7).fill(0);
    for (const d of days) {
      sums[d.weekday] += d.revenue;
      counts[d.weekday] += 1;
    }
    const open = days.filter((d) => d.revenue > 0);
    // ป้ายเดือนเหนือคอลัมน์ที่มีวันที่ 1 ของเดือน และคอลัมน์แรกของช่วง (ถ้าคอลัมน์ถัดไปไม่ได้เริ่มเดือนใหม่ทันที)
    const monthOf = (d) => MONTHS[Number(d.date.slice(5, 7)) - 1];
    const firstOfMonth = (col) => col?.find((d) => d?.date.endsWith("-01"));
    const marks = cols.map((col, c) => {
      const f = firstOfMonth(col);
      if (f) return monthOf(f);
      return c === 0 && !firstOfMonth(cols[1]) ? monthOf(col.find(Boolean)) : null;
    });
    return {
      columns: cols,
      thresholds: [q(0.2), q(0.4), q(0.6), q(0.8)],
      weekdayAvg: sums.map((s, i) => (counts[i] ? s / counts[i] : 0)),
      best: open.reduce((a, d) => (!a || d.revenue > a.revenue ? d : a), null),
      quiet: open.reduce((a, d) => (!a || d.revenue < a.revenue ? d : a), null),
      monthMarks: marks,
    };
  }, [days]);

  // ขนาดช่องปรับตามความกว้างการ์ด: ช่วงสั้น (7/30 วัน) ช่องใหญ่ ช่วงยาวช่องเล็กแต่ไม่ต่ำกว่า 9px (เลื่อนแนวนอนได้)
  useLayoutEffect(() => {
    const el = gridRef.current; // ไม่มีในแบบปฏิทินแขวนผนัง
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      setCell(Math.max(9, Math.min(44, Math.floor(w / columns.length) - GAP)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [columns.length]);

  const compact = days.length <= 42;
  const label = `ยอดขายแต่ละวัน ${subtitle} วันที่ขายดีสุด ${best ? `${formatDate(best.date)} ${formatBaht(best.revenue)}` : "ยังไม่มี"}`;
  const maxAvg = Math.max(1, ...weekdayAvg);
  const bestWeekday = weekdayAvg.indexOf(Math.max(...weekdayAvg));
  const shown = hover ?? best;
  const delayStep = Math.min(18, 700 / Math.max(1, columns.length));

  return (
    <Card>
      <CardHeader title="ปฏิทินคั่ว" subtitle={`${subtitle} · ยอดขายแต่ละวัน ยิ่งสีเข้มยิ่งขายดี`}>
        <div className="flex items-center gap-2 text-xs text-ink-subtle" aria-hidden="true">
          คั่วอ่อน
          <span className="flex gap-[3px]">
            {[1, 2, 3, 4, 5].map((l) => (
              <span key={l} className="roast-cell size-3 rounded-[3px]" data-level={l} />
            ))}
          </span>
          คั่วเข้ม
          <span className="roast-cell is-holiday ml-2 size-3 rounded-[3px]" data-level="0" />
          วันหยุดราชการ
        </div>
      </CardHeader>

      <div ref={ref} className="grid gap-5 px-4 pt-3 pb-4 sm:px-5 lg:grid-cols-[1fr_220px]">
        {compact ? (
          // ช่วงสั้น (ไม่เกิน 6 สัปดาห์): แบบปฏิทินแขวนผนัง คอลัมน์ = วันจันทร์ถึงอาทิตย์ แถว = สัปดาห์ มีเลขวันที่ในช่อง
          <div
            className="grid min-w-0 grid-cols-7 content-start"
            style={{ gap: GAP }}
            role="img"
            aria-label={label}
            onMouseLeave={() => setHover(null)}
          >
            {SHORT.map((d) => (
              <span key={d} className="pb-1 text-center text-[11px] text-ink-muted">
                {d}
              </span>
            ))}
            {Array.from({ length: days[0]?.weekday ?? 0 }, (_, i) => (
              <span key={`lead${i}`} />
            ))}
            {days.map((d, i) => (
              <span
                key={d.date}
                className={`roast-cell roast-day rounded-md ${seen ? "is-in" : ""} ${shown?.date === d.date ? "is-focus" : ""} ${holidays.has(d.date) ? "is-holiday" : ""}`}
                data-level={levelOf(thresholds, d.revenue)}
                style={{ "--d": `${i * 22}ms` }}
                onMouseEnter={() => setHover(d)}
              >
                {Number(d.date.slice(8))}
              </span>
            ))}
          </div>
        ) : (
        <div className="flex min-w-0 gap-2">
          {/* ป้ายวันในสัปดาห์ ตรงกับแถวของปฏิทิน */}
          <div className="grid shrink-0 text-[11px] text-ink-muted" style={{ gridTemplateRows: `16px repeat(7, ${cell}px)`, rowGap: GAP }}>
            <span />
            {SHORT.map((d) => (
              <span key={d} className="flex items-center leading-none">
                {d}
              </span>
            ))}
          </div>
          <div ref={gridRef} className="min-w-0 flex-1 overflow-x-auto">
            <div
              className="grid w-max"
              role="img"
              aria-label={label}
              style={{ gridTemplateRows: `16px repeat(7, ${cell}px)`, gridAutoFlow: "column", gridAutoColumns: `${cell}px`, gap: GAP }}
              onMouseLeave={() => setHover(null)}
            >
              {columns.map((col, c) => [
                <span key={`m${c}`} className="relative text-[11px] whitespace-nowrap text-ink-muted">
                  {monthMarks[c]}
                </span>,
                ...col.map((d, r) =>
                  d ? (
                    <span
                      key={d.date}
                      className={`roast-cell rounded-[3px] ${seen ? "is-in" : ""} ${shown?.date === d.date ? "is-focus" : ""} ${holidays.has(d.date) ? "is-holiday" : ""}`}
                      data-level={levelOf(thresholds, d.revenue)}
                      style={{ "--d": `${c * delayStep + r * 12}ms` }}
                      onMouseEnter={() => setHover(d)}
                    />
                  ) : (
                    <span key={`e${c}-${r}`} />
                  )
                ),
              ])}
            </div>
          </div>
        </div>
        )}

        {/* ยอดเฉลี่ยต่อวันในสัปดาห์: แท่งเรียงตรงกับแถวของปฏิทินทางซ้าย */}
        <div className="flex flex-col gap-3 border-t border-line pt-4 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-5">
          <div className="min-h-[52px]" aria-live="polite">
            {shown ? (
              <>
                <p className="text-xs text-ink-subtle">
                  {hover ? "วันที่ชี้อยู่" : "วันที่ขายดีสุด"} · {WEEKDAYS[shown.weekday]}
                </p>
                <p className="font-numeral text-[26px] leading-tight font-light text-ink tabular-nums">{formatBaht(shown.revenue)}</p>
                <p className="text-xs text-ink-muted">
                  {formatDate(shown.date)}
                  {holidays.has(shown.date) && <span className="font-medium text-ink"> · {holidays.get(shown.date)}</span>}
                </p>
              </>
            ) : (
              <p className="text-[13px] text-ink-subtle">ช่วงนี้ยังไม่มียอดขาย</p>
            )}
          </div>
          <ul className="space-y-1.5" aria-label="เฉลี่ยวันละเท่าไร แยกตามวันในสัปดาห์">
            {weekdayAvg.map((v, i) => (
              <li key={i} className="flex items-center gap-2 text-xs">
                <span className={`w-14 shrink-0 ${i === bestWeekday ? "font-medium text-ink" : "text-ink-subtle"}`}>{WEEKDAYS[i]}</span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-canvas">
                  <span
                    className={`pour-bar block h-full rounded-full ${i === bestWeekday ? "is-on" : ""}`}
                    style={{ width: seen ? `${(v / maxAvg) * 100}%` : "0%", transitionDelay: `${300 + i * 60}ms` }}
                  />
                </span>
                <span className="w-16 shrink-0 text-right text-ink-subtle tabular-nums">{formatBaht(Math.round(v))}</span>
              </li>
            ))}
          </ul>
          {quiet && (
            <p className="text-xs text-ink-muted">
              วันที่เงียบสุด {formatDate(quiet.date)} ({WEEKDAYS[quiet.weekday]}) {formatBaht(quiet.revenue)}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
