import { useEffect, useRef, useState } from "react";
import { Card, CardHeader, Segmented, prefersReducedMotion, useSeen } from "./ui.jsx";
import { formatBaht, formatNumber } from "../lib/metrics.js";

const SIZE = 340;
const C = SIZE / 2;
const R0 = 64; // รัศมีวงใน (จุดเริ่มของแท่ง)
const LEN = 82; // ความยาวแท่งสูงสุด (R0 + LEN + ป้ายชั่วโมง ต้องไม่เกิน C)
const MODES = [
  { value: "cups", label: "แก้ว" },
  { value: "revenue", label: "ยอดขาย" },
];

const hh = (h) => String(h).padStart(2, "0");
const polar = (hour, r) => {
  const a = (hour / 24) * Math.PI * 2 - Math.PI / 2;
  return [C + Math.cos(a) * r, C + Math.sin(a) * r];
};

// ค่าทั้งชุดค่อย ๆ ไหลไปหาค่าใหม่พร้อมกัน (rAF ตัวเดียว ไม่ใช่ 24 ตัว)
function useTweenedArray(values, run, duration = 900) {
  const [shown, setShown] = useState(() => values.map(() => 0));
  const from = useRef(shown);
  useEffect(() => {
    if (!run) return;
    if (prefersReducedMotion()) {
      from.current = values;
      setShown(values);
      return;
    }
    const start = from.current;
    let raf;
    let t0 = null;
    const step = (now) => {
      t0 ??= now;
      const p = Math.min(1, (now - t0) / duration);
      const e = 1 - (1 - p) ** 4;
      const next = values.map((v, i) => (start[i] ?? 0) + (v - (start[i] ?? 0)) * e);
      from.current = next;
      setShown(next);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // values เปลี่ยน reference ทุก render: เทียบด้วยเนื้อหาแทน
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, values.join(","), duration]);
  return shown;
}

// นาฬิกากาแฟ: 24 ชั่วโมงรอบหน้าปัด แท่งยาว = ขายได้มาก · ช่วงกลางคืนว่างเพราะร้านปิด
// ชี้/โฟกัสที่แท่งเพื่อดูตัวเลขของชั่วโมงนั้นตรงกลางหน้าปัด (ค่าเริ่มต้น = ชั่วโมงพีค)
export default function HourClockCard({ hours, subtitle }) {
  const [mode, setMode] = useState("cups");
  const [active, setActive] = useState(null);
  const [ref, seen] = useSeen(0.25);
  const values = hours.map((h) => h[mode]);
  const max = Math.max(1, ...values);
  const peak = values.indexOf(Math.max(...values));
  const lens = useTweenedArray(values.map((v) => (v / max) * LEN), seen);
  const focus = active ?? peak;
  const h = hours[focus];
  const total = values.reduce((a, b) => a + b, 0);
  const fmt = mode === "cups" ? (n) => `${formatNumber(n)} แก้ว` : formatBaht;

  return (
    <Card className="flex h-full flex-col">
      <CardHeader title="นาฬิกากาแฟ" subtitle={`${subtitle} · ชี้ที่แท่งดูทีละชั่วโมง`}>
        <Segmented label="นับเป็นแก้วหรือยอดขาย" value={mode} onChange={setMode} options={MODES} />
      </CardHeader>
      <div ref={ref} className="flex flex-1 items-center justify-center px-4 pt-2 pb-4">
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="w-full max-w-[360px]"
          role="img"
          aria-label={`ยอดขายตามชั่วโมง ขายได้เยอะสุดตอน ${hh(peak)}:00 น. ${fmt(values[peak])}`}
        >
          <defs>
            <radialGradient id="clock-face" cx="50%" cy="50%" r="50%">
              <stop offset="0" stopColor="var(--color-surface-selected)" />
              <stop offset="1" stopColor="var(--color-surface)" />
            </radialGradient>
            <linearGradient id="clock-bar" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0" stopColor="var(--lg-dark)" />
              <stop offset="1" stopColor="var(--lg-shine)" />
            </linearGradient>
          </defs>
          {/* หน้าปัด: วงครีม่า + เส้นแบ่งทุก 3 ชั่วโมง */}
          <circle cx={C} cy={C} r={R0 - 8} fill="url(#clock-face)" />
          <circle cx={C} cy={C} r={R0 + LEN + 4} fill="none" stroke="var(--color-line)" strokeDasharray="1 5" />
          {[0, 3, 6, 9, 12, 15, 18, 21].map((t) => {
            const [x, y] = polar(t, R0 + LEN + 16);
            return (
              <text key={t} x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize="11" fill="var(--color-ink-muted)">
                {hh(t)}
              </text>
            );
          })}
          {hours.map((_, i) => {
            const [x1, y1] = polar(i + 0.5, R0);
            const [x2, y2] = polar(i + 0.5, R0 + Math.max(0.01, lens[i]));
            const [hx, hy] = polar(i + 0.5, R0 + LEN);
            const on = i === focus;
            return (
              <g
                key={i}
                tabIndex={values[i] > 0 ? 0 : -1}
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                className="clock-hour"
                aria-label={`${hh(i)}:00 น. ${fmt(values[i])}`}
              >
                {/* พื้นที่ชี้ที่กว้างกว่าแท่ง ชี้ง่ายแม้แท่งสั้น */}
                <line x1={x1} y1={y1} x2={hx} y2={hy} stroke="transparent" strokeWidth="18" />
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={values[i] === 0 ? "var(--color-bar-muted)" : on ? "var(--color-chart)" : "url(#clock-bar)"}
                  strokeOpacity={values[i] === 0 ? 0.6 : on ? 1 : 0.55 + 0.45 * (values[i] / max)}
                  strokeWidth={on ? 11 : 9}
                  strokeLinecap="round"
                  style={{ transition: "stroke-width 200ms var(--ease-out)" }}
                />
              </g>
            );
          })}
          {/* ตรงกลาง: ชั่วโมงที่ชี้อยู่ */}
          <text x={C} y={C - 14} textAnchor="middle" fontSize="30" fontWeight="300" fill="var(--color-ink)" className="font-numeral">
            {hh(focus)}:00
          </text>
          <text x={C} y={C + 10} textAnchor="middle" fontSize="12.5" fontWeight="600" fill="var(--color-chart)">
            {fmt(h[mode])}
          </text>
          <text x={C} y={C + 28} textAnchor="middle" fontSize="11" fill="var(--color-ink-subtle)">
            {total ? `${((h[mode] / total) * 100).toFixed(1)}% ของทั้งวัน` : "ยังไม่มียอดขาย"}
          </text>
        </svg>
      </div>
    </Card>
  );
}
