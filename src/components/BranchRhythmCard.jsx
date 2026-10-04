import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { area, curveMonotoneX, line } from "d3-shape";
import { Card, CardHeader, useSeen } from "./ui.jsx";
import { branchOrder, buildBills, holidayComparison, holidayMatches, hourProfiles, weekProfiles } from "../lib/story.js";

const H0 = 6; // แกนชั่วโมงเริ่ม 06:00 จบ 22:00 ให้ปลายภูเขาลงถึงพื้น
const H1 = 22;
const hh = (h) => String(h).padStart(2, "0");
const pct = (x) => `${Math.round(x * 100)}%`;

// สเกลอัตราส่วนแบบ log: 0.25× … 4× ระยะห่างของ "ครึ่งหนึ่ง" กับ "สองเท่า" เท่ากัน
const RATIO_MIN = 0.25;
const RATIO_MAX = 4;
const ratioX = (r, x0, w) => x0 + ((Math.log(Math.min(RATIO_MAX, Math.max(RATIO_MIN, r))) - Math.log(RATIO_MIN)) / (Math.log(RATIO_MAX) - Math.log(RATIO_MIN))) * w;

// จังหวะของแต่ละสาขา: ภูเขาซ้อน (ridgeline) ของ % บิลตามชั่วโมง + เส้นประ = ค่าเฉลี่ยทั้งเครือ
// ขวามือ: ตัวคูณยอดของวันเสาร์–อาทิตย์และวันหยุดนักขัตฤกษ์ บนสเกล log (1× = เท่าวันทำงาน)
// ชี้ที่ภาพเพื่ออ่านค่าชั่วโมงเดียวกันของทุกสาขาพร้อมกัน · ช่วงเวลาตามตัวกรองด้านบน (ทุกสาขาเสมอ)
export default function BranchRhythmCard({ rows, branchInfo, holidays, subtitle }) {
  const [ref, seen] = useSeen(0.2);
  const boxRef = useRef(null);
  const [width, setWidth] = useState(900);
  const [hover, setHover] = useState(null);

  useLayoutEffect(() => {
    const el = boxRef.current;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const model = useMemo(() => {
    const bills = buildBills(rows);
    const branches = branchOrder(bills).map((b) => b.branch);
    const profiles = hourProfiles(bills, branches);
    const week = Object.fromEntries(weekProfiles(bills, branches, holidays).map((w) => [w.branch, w]));
    const hol = Object.fromEntries(holidayComparison(bills, branches, holidayMatches(bills, holidays)).map((h) => [h.branch, h]));
    const chain = hourProfiles(bills.map((b) => ({ ...b, branch: "*" })), ["*"])[0];
    return { branches, profiles, week, hol, chain };
  }, [rows, holidays]);

  const typeOf = new Map(branchInfo.map((b) => [b.branch, b.branch_type]));
  const wide = width >= 760;
  const labelW = wide ? 124 : 84;
  const sideW = wide ? Math.min(300, width * 0.32) : 0;
  const plotW = width - labelW - sideW - (wide ? 28 : 8);
  const rowH = wide ? 74 : 62;
  const amp = rowH * 1.2; // ซ้อนกันพอให้เห็นเป็นภูเขา แต่ยอดไม่ล้ำเข้าไปกลางแถวบน
  const top = 34;
  const height = top + rowH * model.profiles.length + 34;
  const maxShare = Math.max(...model.profiles.flatMap((p) => p.share), ...model.chain.share);
  const x = (h) => labelW + ((h - H0) / (H1 - H0)) * plotW;
  const pts = (share) => Array.from({ length: H1 - H0 + 1 }, (_, i) => [H0 + i + 0.5, share[H0 + i] ?? 0]);
  const shapes = model.profiles.map((p, i) => {
    const base = top + (i + 1) * rowH;
    const y = (v) => base - (v / maxShare) * amp;
    const ar = area().x((d) => x(d[0])).y0(base).y1((d) => y(d[1])).curve(curveMonotoneX);
    const ln = line().x((d) => x(d[0])).y((d) => y(d[1])).curve(curveMonotoneX);
    return { ...p, base, y, fill: ar(pts(p.share)), stroke: ln(pts(p.share)), ghost: ln(pts(model.chain.share)) };
  });

  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const h = Math.floor(H0 + ((e.clientX - r.left - labelW) / plotW) * (H1 - H0));
    setHover(h >= H0 && h < H1 ? h : null);
  };

  const sideX = labelW + plotW + 28;
  const sideInner = sideW - 20;

  return (
    <Card>
      <CardHeader title="จังหวะของแต่ละสาขา" subtitle={`ทุกสาขา · ${subtitle} · แต่ละชั่วโมงขายได้กี่ % ของบิลทั้งวัน · เส้นประ = ทุกสาขารวมกัน`} />
      <div ref={ref} className="px-2 pt-2 pb-4 sm:px-3">
        <div ref={boxRef} className="relative">
          <svg
            width={width}
            height={height}
            className={`rhythm ${seen ? "is-in" : ""}`}
            onMouseMove={onMove}
            onMouseLeave={() => setHover(null)}
            role="img"
            aria-label={`แต่ละสาขาขายได้กี่ % ของบิลในแต่ละชั่วโมง: ${shapes
              .map((s) => `${s.branch} คนเยอะสุดตอน ${hh(s.peakHour)}:00 ก่อน 10 โมงเช้าขายไปแล้ว ${pct(s.beforeTen)}`)
              .join(", ")}`}
          >
            <defs>
              <linearGradient id="ridge-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="var(--color-chart)" stopOpacity="0.85" />
                <stop offset="1" stopColor="var(--color-chart)" stopOpacity="0.12" />
              </linearGradient>
            </defs>
            {/* แกนชั่วโมง */}
            {(wide ? [7, 10, 12, 14, 17, 20] : [7, 12, 17]).map((h) => (
              <g key={h}>
                <line x1={x(h)} x2={x(h)} y1={top - 10} y2={height - 26} className="rhythm-grid" />
                <text x={x(h)} y={height - 10} textAnchor="middle" className="rhythm-tick">
                  {hh(h)}:00
                </text>
              </g>
            ))}
            {/* ภูเขา: วาดจากแถวบนลงล่าง แถวล่างทับแถวบน (ภาพซ้อนแบบ joy plot) */}
            {shapes.map((s, i) => (
              <g key={s.branch} className="ridge" style={{ "--i": i }}>
                {/* พื้นทึบสีการ์ดใต้ภูเขา: แถวล่างบังแถวบนจริง ไม่ซ้อนสีจนเลอะ */}
                <path d={s.fill} className="ridge-mask" />
                <path d={s.fill} fill="url(#ridge-fill)" className="ridge-fill" />
                <path d={s.ghost} className="ridge-ghost" />
                <path d={s.stroke} className="ridge-line" pathLength="1" />
                <line x1={labelW} x2={labelW + plotW} y1={s.base} y2={s.base} className="ridge-base" />
                <text x={labelW - 12} y={s.base - 6} textAnchor="end" className="ridge-label">
                  {s.branch}
                </text>
                <text x={labelW - 12} y={s.base + 9} textAnchor="end" className="ridge-sub">
                  {typeOf.get(s.branch)}
                  {wide && ` · พีค ${hh(s.peakHour)}:00`}
                </text>
              </g>
            ))}
            {/* ค่าของชั่วโมงที่ชี้ อยู่ชั้นบนสุด ไม่ถูกภูเขาแถวล่างบัง */}
            {hover != null && (
              <g>
                {shapes.map((s) => (
                  <g key={s.branch}>
                    <circle cx={x(hover + 0.5)} cy={s.y(s.share[hover])} r="3.5" className="ridge-dot" />
                    {/* ค่าน้อยกว่า 2% ชิดเส้นฐานจนชนป้ายของแถวบน: แสดงแค่จุด */}
                    {s.share[hover] >= 0.02 && (
                      <text x={x(hover + 0.5) + 7} y={s.y(s.share[hover]) - 5} className="ridge-value">
                        {pct(s.share[hover])}
                      </text>
                    )}
                  </g>
                ))}
                <line x1={x(hover + 0.5)} x2={x(hover + 0.5)} y1={top - 14} y2={height - 26} className="rhythm-cursor" />
                <text x={x(hover + 0.5)} y={top - 18} textAnchor="middle" className="rhythm-cursor-label">
                  {hh(hover)}:00–{hh(hover)}:59
                </text>
              </g>
            )}

            {/* ตัวคูณสัปดาห์/วันหยุด (จอกว้างเท่านั้น จอแคบแสดงเป็นตารางด้านล่าง) */}
            {wide && (
              <g>
                <text x={sideX} y={top - 16} className="rhythm-side-title">
                  เทียบกับวันธรรมดา (สเกล log)
                </text>
                {[0.5, 1, 2].map((r) => (
                  <g key={r}>
                    <line x1={ratioX(r, sideX, sideInner)} x2={ratioX(r, sideX, sideInner)} y1={top - 6} y2={height - 26} className={r === 1 ? "rhythm-one" : "rhythm-grid"} />
                    <text x={ratioX(r, sideX, sideInner)} y={height - 10} textAnchor="middle" className="rhythm-tick">
                      {r}×
                    </text>
                  </g>
                ))}
                {shapes.map((s, i) => {
                  const we = model.week[s.branch].weekendRatio;
                  const ho = model.hol[s.branch].ratio;
                  const cy = s.base - rowH * 0.42;
                  const one = ratioX(1, sideX, sideInner);
                  return (
                    <g key={s.branch} className="ratio-row" style={{ "--i": i }}>
                      {we != null && (
                        <>
                          <line x1={one} x2={ratioX(we, sideX, sideInner)} y1={cy - 6} y2={cy - 6} className="ratio-stem" />
                          <circle cx={ratioX(we, sideX, sideInner)} cy={cy - 6} r="5" className="ratio-weekend" />
                          <text x={ratioX(we, sideX, sideInner) + (we >= 1 ? 9 : -9)} y={cy - 2} textAnchor={we >= 1 ? "start" : "end"} className="ratio-value">
                            {we.toFixed(2)}×
                          </text>
                        </>
                      )}
                      {ho != null && (
                        <>
                          <line x1={one} x2={ratioX(ho, sideX, sideInner)} y1={cy + 10} y2={cy + 10} className="ratio-stem" />
                          <rect x={ratioX(ho, sideX, sideInner) - 4.5} y={cy + 5.5} width="9" height="9" className="ratio-holiday" />
                          <text x={ratioX(ho, sideX, sideInner) + (ho >= 1 ? 9 : -9)} y={cy + 14} textAnchor={ho >= 1 ? "start" : "end"} className="ratio-value">
                            {ho.toFixed(2)}×
                          </text>
                        </>
                      )}
                    </g>
                  );
                })}
              </g>
            )}
          </svg>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 px-2 text-xs text-ink-subtle">
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-full bg-chart" /> เสาร์–อาทิตย์ (ยอดขายเฉลี่ยต่อวัน)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 bg-ink" /> วันหยุดราชการ (นับบิล เทียบกับวันเดียวกันของอาทิตย์ถัดไป)
            {shapes.every((s) => model.hol[s.branch].ratio == null) && " · ช่วงนี้ไม่มีวันหยุดราชการ ลองเลือก 365 วันหรือทั้งหมดดู"}
          </span>
        </div>

        {/* ตัวเลขทั้งหมดของภาพในรูปตาราง: อ่านด้วยโปรแกรมอ่านหน้าจอได้ และจอแคบใช้แทนแผงขวา */}
        <details className="rhythm-table mt-3 px-2" open={!wide || undefined}>
          <summary className="cursor-pointer text-xs font-medium text-ink-subtle">ดูเป็นตาราง</summary>
          <table className="mt-2 w-full text-[13px] tabular-nums">
            <thead>
              <tr className="border-b border-line text-left text-xs text-ink-subtle">
                <th className="py-1.5 pr-2 font-medium">สาขา</th>
                <th className="px-2 font-medium">พีค</th>
                <th className="px-2 text-right font-medium">ก่อน 10:00</th>
                <th className="px-2 text-right font-medium">ตั้งแต่ 17:00</th>
                <th className="px-2 text-right font-medium">เสาร์–อาทิตย์</th>
                <th className="pl-2 text-right font-medium">วันหยุด</th>
              </tr>
            </thead>
            <tbody>
              {shapes.map((s) => (
                <tr key={s.branch} className="border-b border-line last:border-0">
                  <td className="py-1.5 pr-2 font-medium text-ink">{s.branch}</td>
                  <td className="px-2 text-ink-subtle">{hh(s.peakHour)}:00</td>
                  <td className="px-2 text-right">{pct(s.beforeTen)}</td>
                  <td className="px-2 text-right">{pct(s.fromFive)}</td>
                  <td className="px-2 text-right">{model.week[s.branch].weekendRatio != null ? `${model.week[s.branch].weekendRatio.toFixed(2)}×` : "–"}</td>
                  <td className="pl-2 text-right">{model.hol[s.branch].ratio != null ? `${model.hol[s.branch].ratio.toFixed(2)}×` : "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </div>
    </Card>
  );
}
