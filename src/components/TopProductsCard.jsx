import { Card, CardHeader } from "./ui.jsx";
import { formatBaht, formatNumber } from "../lib/metrics.js";

export default function TopProductsCard({ data, subtitle, onTrace }) {
  return (
    <Card>
      <CardHeader title="เมนูขายดี" subtitle={subtitle} />
      {data.length === 0 ? (
        <p className="px-5 py-10 text-center text-[13px] text-ink-subtle">ไม่มียอดขายในช่วงเวลานี้</p>
      ) : (
        <table className="mt-2 w-full text-[13px]">
          <thead>
            <tr className="border-b border-line text-left text-xs text-ink-subtle">
              <th scope="col" className="py-2 pr-2 pl-4 font-medium sm:pl-5">
                เมนู
              </th>
              <th scope="col" className="px-2 py-2 text-right font-medium">
                จำนวน
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
                    <span className="w-4 text-right text-xs text-ink-muted tabular-nums">{i + 1}</span>
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
