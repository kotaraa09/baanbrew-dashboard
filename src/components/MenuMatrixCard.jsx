import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { Card, CardHeader, useSeen } from "./ui.jsx";
import { DRINK_CATEGORIES, formatBaht, formatNumber, menuEngineering } from "../lib/metrics.js";

const QUADRANTS = {
  star: { label: "ดาวเด่น", hint: "ขายดี กำไรต่อชิ้นก็สูง" },
  workhorse: { label: "ขายดีแต่กำไรบาง", hint: "ขายเยอะ แต่ได้ต่อชิ้นน้อย" },
  puzzle: { label: "กำไรดีแต่ขายน้อย", hint: "ได้ต่อชิ้นเยอะ แต่คนสั่งน้อย" },
  dog: { label: "ควรทบทวน", hint: "ขายน้อย กำไรต่อชิ้นก็ต่ำ" },
};
const PAD = { l: 52, r: 18, t: 18, b: 40 };

// แกนตัวเลขกลม ๆ
function niceMax(v) {
  const p = 10 ** Math.floor(Math.log10(v || 1));
  return [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].map((m) => m * p).find((m) => m >= v);
}

// วิศวกรรมเมนู: ทุกเมนูคือหนึ่งวง แกนนอน = ขายได้กี่ชิ้น แกนตั้ง = กำไรขั้นต้นต่อชิ้น ขนาดวง = กำไรขั้นต้นรวม
// เส้นประ = มัธยฐาน แบ่งเมนูเป็นสี่กลุ่ม · ทึบ = เครื่องดื่ม, วงแหวน = ของกิน (แยกด้วยรูปทรง ไม่ใช่สีอย่างเดียว)
export default function MenuMatrixCard({ rows, products, subtitle }) {
  const [ref, seen] = useSeen(0.2);
  const boxRef = useRef(null);
  const [width, setWidth] = useState(800);
  const [hover, setHover] = useState(null);

  useLayoutEffect(() => {
    const el = boxRef.current;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const { items, qtyMid, marginMid } = useMemo(() => menuEngineering(rows, products), [rows, products]);
  const height = Math.max(300, Math.min(440, width * 0.55));
  const W = width - PAD.l - PAD.r;
  const H = height - PAD.t - PAD.b;
  // แกนนอนแบบ log: ยอดขายต่อเมนูเบ้มาก (ไม่กี่เมนูขายหลายพันชิ้น) สเกลเส้นตรงจะอัดเมนูส่วนใหญ่ไว้มุมซ้าย
  const qs = items.map((i) => Math.max(1, i.qty));
  const xLo = Math.max(1, Math.min(...qs) * 0.8);
  const xHi = Math.max(...qs) * 1.25;
  const yMax = niceMax(Math.max(1, ...items.map((i) => i.marginPerUnit)) * 1.05);
  const x = (v) => PAD.l + ((Math.log(Math.max(1, v)) - Math.log(xLo)) / (Math.log(xHi) - Math.log(xLo))) * W;
  const y = (v) => PAD.t + H - (v / yMax) * H;
  const maxMargin = Math.max(1, ...items.map((i) => i.margin));
  const r = (v) => 4 + Math.sqrt(v / maxMargin) * (width < 640 ? 13 : 20);

  const sorted = [...items].sort((a, b) => b.margin - a.margin);
  const topStar = sorted.find((i) => i.quadrant === "star");
  const richest = [...items].sort((a, b) => b.marginPerUnit - a.marginPerUnit)[0];
  // ป้ายชื่อ: เมนูที่กำไรรวมสูงสุด 3 อันดับ + เมนูกำไรต่อชิ้นสูงสุด (ที่เหลือชี้เพื่ออ่าน)
  const labelled = new Set([...sorted.slice(0, 3), richest].filter(Boolean).map((i) => i.product_id));
  const counts = Object.fromEntries(Object.keys(QUADRANTS).map((q) => [q, items.filter((i) => i.quadrant === q).length]));
  const xTicks = [10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000, 25000].filter((t) => t >= xLo && t <= xHi);
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * yMax);
  const corner = {
    star: { x: PAD.l + W - 6, y: PAD.t + 14, anchor: "end" },
    puzzle: { x: PAD.l + 6, y: PAD.t + 14, anchor: "start" },
    workhorse: { x: PAD.l + W - 6, y: PAD.t + H - 8, anchor: "end" },
    dog: { x: PAD.l + 6, y: PAD.t + H - 8, anchor: "start" },
  };

  return (
    <Card>
      <CardHeader title="เมนูไหนทำเงินจริง" subtitle={`${subtitle} · กำไรขั้นต้น = ราคาขาย − ต้นทุนวัตถุดิบ (ยังไม่หักค่าเช่า ค่าแรง)`} />
      {items.length === 0 ? (
        <p className="px-5 py-10 text-center text-[13px] text-ink-subtle">ช่วงนี้ยังไม่มียอดขาย</p>
      ) : (
        <div ref={ref} className="px-3 pt-2 pb-4 sm:px-4">
          {topStar && richest && (
            <p className="mb-2 px-1 text-[15px] leading-relaxed text-ink-subtle">
              ในกลุ่มดาวเด่น <b className="font-semibold whitespace-nowrap text-ink">{topStar.name}</b> ทำกำไรรวมได้เยอะสุด{" "}
              <b className="font-semibold text-ink">{formatBaht(Math.round(topStar.margin))}</b> ส่วนเมนูที่ได้กำไรต่อชิ้นเยอะสุดคือ{" "}
              <b className="font-semibold whitespace-nowrap text-ink">{richest.name}</b>{" "}
              <span className="whitespace-nowrap">({formatBaht(Math.round(richest.marginPerUnit))}/ชิ้น)</span> แต่ขายได้{" "}
              <span className="whitespace-nowrap">{formatNumber(richest.qty)} ชิ้น</span>
            </p>
          )}
          <div ref={boxRef} className="relative" onMouseLeave={() => setHover(null)}>
            <svg width={width} height={height} className={`matrix ${seen ? "is-in" : ""}`} role="img" aria-label={`เมนูทั้ง ${items.length} เมนู แบ่งตามยอดขายกับกำไรต่อชิ้น: ${Object.keys(QUADRANTS).map((q) => `${QUADRANTS[q].label} ${counts[q]}`).join(", ")}`}>
              {yTicks.map((t) => (
                <g key={`y${t}`}>
                  <line x1={PAD.l} x2={PAD.l + W} y1={y(t)} y2={y(t)} className="matrix-grid" />
                  <text x={PAD.l - 8} y={y(t) + 4} textAnchor="end" className="matrix-tick">
                    ฿{Math.round(t)}
                  </text>
                </g>
              ))}
              {xTicks.map((t) => (
                <text key={`x${t}`} x={x(t)} y={PAD.t + H + 18} textAnchor="middle" className="matrix-tick">
                  {formatNumber(t)}
                </text>
              ))}
              <text x={PAD.l + W} y={height - 4} textAnchor="end" className="matrix-axis">
                ขายได้ (ชิ้น, สเกล log) →
              </text>
              <text x={PAD.l} y={10} className="matrix-axis">
                ↑ กำไรขั้นต้นต่อชิ้น
              </text>
              {/* เส้นมัธยฐาน */}
              <line x1={x(qtyMid)} x2={x(qtyMid)} y1={PAD.t} y2={PAD.t + H} className="matrix-mid" />
              <line x1={PAD.l} x2={PAD.l + W} y1={y(marginMid)} y2={y(marginMid)} className="matrix-mid" />
              {Object.entries(corner).map(([q, c]) => (
                <text key={q} x={c.x} y={c.y} textAnchor={c.anchor} className="matrix-quad">
                  {QUADRANTS[q].label} · {counts[q]}
                </text>
              ))}
              {[...items]
                .sort((a, b) => b.margin - a.margin)
                .map((i, k) => {
                  const drink = DRINK_CATEGORIES.has(i.category);
                  const on = hover?.product_id === i.product_id;
                  return (
                    <g key={i.product_id} className="matrix-point" style={{ "--k": k }}>
                      <circle
                        cx={x(i.qty)}
                        cy={y(i.marginPerUnit)}
                        r={r(i.margin)}
                        className={`${drink ? "is-drink" : "is-food"} ${on ? "is-on" : ""}`}
                        onMouseEnter={() => setHover(i)}
                      />
                    </g>
                  );
                })}
              {/* ป้ายชื่อเป็นชั้นบนสุด ไม่ถูกวงอื่นบัง */}
              {items
                .filter((i) => labelled.has(i.product_id))
                .map((i) => {
                  const right = x(i.qty) > PAD.l + W * 0.68;
                  return (
                    <text
                      key={i.product_id}
                      x={right ? x(i.qty) - r(i.margin) - 4 : x(i.qty) + r(i.margin) + 4}
                      y={y(i.marginPerUnit) - r(i.margin) * 0.6}
                      textAnchor={right ? "end" : "start"}
                      className="matrix-label"
                    >
                      {i.name}
                    </text>
                  );
                })}
            </svg>
            {hover && (
              <div
                className="matrix-tip"
                style={{
                  left: Math.max(0, Math.min(width - 222, x(hover.qty) + 14)),
                  top: Math.max(0, y(hover.marginPerUnit) - 20),
                }}
              >
                <p className="font-semibold text-ink">{hover.name}</p>
                <p className="text-xs text-ink-muted">
                  {hover.category} · {QUADRANTS[hover.quadrant].label} ({QUADRANTS[hover.quadrant].hint})
                </p>
                <dl className="mt-1.5 grid grid-cols-[auto_1fr] gap-x-3 text-xs tabular-nums">
                  <dt className="text-ink-subtle">ขายได้</dt>
                  <dd className="text-right">{formatNumber(hover.qty)} ชิ้น</dd>
                  <dt className="text-ink-subtle">กำไรต่อชิ้น</dt>
                  <dd className="text-right">{formatBaht(Math.round(hover.marginPerUnit))} ({Math.round(hover.marginPct * 100)}%)</dd>
                  <dt className="text-ink-subtle">กำไรรวม</dt>
                  <dd className="text-right font-medium">{formatBaht(Math.round(hover.margin))}</dd>
                </dl>
              </div>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 px-1 text-xs text-ink-subtle">
            <span className="flex items-center gap-1.5">
              <span className="inline-block size-2.5 rounded-full bg-chart" /> เครื่องดื่ม
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block size-2.5 rounded-full border-2 border-ink-subtle" /> ของกิน (เบเกอรี่ อาหาร อื่น ๆ)
            </span>
            <span>ขนาดวง = กำไรขั้นต้นรวม · เส้นประ = ค่ากลาง (มัธยฐาน)</span>
          </div>
          <details className="rhythm-table mt-3 px-1">
            <summary className="cursor-pointer text-xs font-medium text-ink-subtle">ดูเป็นตาราง ({items.length} เมนู)</summary>
            <table className="mt-2 w-full text-[13px] tabular-nums">
              <thead>
                <tr className="border-b border-line text-left text-xs text-ink-subtle">
                  <th className="py-1.5 pr-2 font-medium">เมนู</th>
                  <th className="px-2 font-medium">กลุ่ม</th>
                  <th className="px-2 text-right font-medium">ชิ้น</th>
                  <th className="px-2 text-right font-medium">กำไร/ชิ้น</th>
                  <th className="pl-2 text-right font-medium">กำไรรวม</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((i) => (
                  <tr key={i.product_id} className="border-b border-line last:border-0">
                    <td className="py-1.5 pr-2 text-ink">{i.name}</td>
                    <td className="px-2 text-ink-subtle">{QUADRANTS[i.quadrant].label}</td>
                    <td className="px-2 text-right">{formatNumber(i.qty)}</td>
                    <td className="px-2 text-right">{formatBaht(Math.round(i.marginPerUnit))}</td>
                    <td className="pl-2 text-right">{formatBaht(Math.round(i.margin))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </div>
      )}
    </Card>
  );
}
