import { useEffect, useId, useState } from "react";
import { Card, CardHeader, useSeen } from "./ui.jsx";
import { formatBaht, formatNumber } from "../lib/metrics.js";

// แก้วเล็กข้างชื่อเมนู: ระดับกาแฟในแก้ว = ยอดขายเทียบกับอันดับ 1 (อันดับ 1 เต็มแก้ว)
// ผิวกาแฟเป็นคลื่นที่ไหลช้า ๆ · เบเกอรี่/อาหารใช้แก้วเดียวกัน (สื่อ "สัดส่วน" ไม่ใช่ชนิดสินค้า)
function FillCup({ level, delay, run }) {
  const id = useId().replace(/:/g, "");
  // แถวถูกสร้างใหม่ทุกครั้งที่ช่วง/สาขาเปลี่ยน: เริ่มจากแก้วเปล่าก่อนหนึ่งเฟรม แล้วค่อยเทให้เห็นทุกครั้ง
  const [go, setGo] = useState(false);
  useEffect(() => {
    if (!run) return;
    const r = requestAnimationFrame(() => requestAnimationFrame(() => setGo(true)));
    return () => cancelAnimationFrame(r);
  }, [run]);
  const y = 25 - level * 17; // ปากแก้ว y=8, ก้นแก้ว y=25
  return (
    <svg viewBox="0 0 30 30" className="size-8 shrink-0" aria-hidden="true">
      <defs>
        <clipPath id={`cup-${id}`}>
          <path d="M5 8h17l-1.6 14.2a3.2 3.2 0 0 1-3.2 2.8H9.8a3.2 3.2 0 0 1-3.2-2.8Z" />
        </clipPath>
      </defs>
      <g clipPath={`url(#cup-${id})`}>
        <rect x="0" y="0" width="30" height="30" fill="var(--color-canvas)" />
        <g className="fill-cup-level" style={{ transform: `translateY(${go ? y : 25}px)`, transitionDelay: `${delay}ms` }}>
          <path className="fill-cup-wave" d="M-12 0q3-1.6 6 0t6 0 6 0 6 0 6 0 6 0 6 0 6 0V20H-12Z" fill="var(--color-chart)" />
        </g>
      </g>
      <path d="M5 8h17l-1.6 14.2a3.2 3.2 0 0 1-3.2 2.8H9.8a3.2 3.2 0 0 1-3.2-2.8Z" fill="none" stroke="var(--color-ink-muted)" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M22 11h1.6a3 3 0 0 1 0 6H21.3" fill="none" stroke="var(--color-ink-muted)" strokeWidth="1.2" />
    </svg>
  );
}

export default function TopProductsCard({ data, subtitle, onTrace }) {
  const [ref, seen] = useSeen(0.2);
  const top = Math.max(1, ...data.map((p) => p.revenue));
  return (
    <Card>
      <CardHeader title="เมนูขายดี" subtitle={subtitle} />
      {data.length === 0 ? (
        <p className="px-5 py-10 text-center text-[13px] text-ink-subtle">ช่วงนี้ยังไม่มียอดขาย</p>
      ) : (
        <table ref={ref} className="mt-2 w-full text-[13px]">
          <thead>
            <tr className="border-b border-line text-left text-xs text-ink-subtle">
              <th scope="col" className="py-2 pr-2 pl-4 font-medium sm:pl-5">
                เมนู
              </th>
              <th scope="col" className="px-2 py-2 text-right font-medium">
                ชิ้น
              </th>
              <th scope="col" className="py-2 pr-4 pl-2 text-right font-medium sm:pr-5">
                ยอดขาย
              </th>
            </tr>
          </thead>
          {/* key ใหม่เมื่อช่วง/สาขาเปลี่ยน → แถวลอยขึ้นทีละแถว */}
          <tbody key={subtitle}>
            {data.map((p, i) => (
              <tr
                key={p.product_id}
                style={{ animationDelay: `${i * 45}ms` }}
                className="relative animate-rise border-b border-line last:border-0 transition-colors hover:bg-surface-hover"
              >
                <td className="py-2.5 pr-2 pl-4 sm:pl-5">
                  <div className="flex items-center gap-3">
                    <span className="font-numeral w-4 text-right text-xs text-ink-muted tabular-nums">{i + 1}</span>
                    <FillCup level={p.revenue / top} delay={150 + i * 90} run={seen} />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-ink">
                        {onTrace ? (
                          // ปุ่มยืดเต็มแถว (after:inset-0) กดตรงไหนของแถวก็ได้
                          <button
                            type="button"
                            onClick={() => onTrace(p)}
                            aria-label={`ดูที่มาของยอดขาย ${p.name}`}
                            className="cursor-pointer text-left after:absolute after:inset-0 after:content-['']"
                          >
                            {p.name}
                          </button>
                        ) : (
                          p.name
                        )}
                      </p>
                      <p className="text-xs text-ink-muted">{p.category}</p>
                    </div>
                  </div>
                </td>
                <td className="px-2 py-2.5 text-right text-ink-subtle tabular-nums">{formatNumber(p.qty)}</td>
                <td className="py-2.5 pr-4 pl-2 text-right font-medium text-ink tabular-nums sm:pr-5">
                  {formatBaht(p.revenue)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}
