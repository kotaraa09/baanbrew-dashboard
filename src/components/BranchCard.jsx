import { Card, CardHeader, useSeen } from "./ui.jsx";
import { formatBaht, formatPercent } from "../lib/metrics.js";

// กติกาเดียวกับ <Change>: ต่ำกว่า 0.05% ถือว่าคงที่ (สีเทา ไม่มีเครื่องหมาย)
function ChangeText({ value }) {
  if (value == null) return null;
  const flat = Math.abs(value) < 0.05;
  const tone = flat ? "text-ink-subtle" : value > 0 ? "text-up" : "text-down";
  return (
    <span className={`font-medium ${tone}`}>
      {flat ? "" : value > 0 ? "+" : "−"}
      {formatPercent(value)}
    </span>
  );
}

// แท่งยอดขายแต่ละสาขา: เท "กาแฟ" จากซ้ายไปขวาทีละแถว (หน่วงตามอันดับ) มีฟองครีม่าที่ปลายแท่ง
// เปลี่ยนช่วง/สาขา → ความยาวไหลไปหาค่าใหม่ (transition ไม่ใช่เล่นใหม่) จึงเห็นว่าสาขาไหนโต/หด
export default function BranchCard({ data, subtitle, hasComparison, highlight = "all", onTrace }) {
  const max = Math.max(0, ...data.map((d) => d.revenue));
  const [ref, seen] = useSeen(0.2);

  return (
    <Card className="flex h-full flex-col">
      <CardHeader
        title="ยอดขายแต่ละสาขา"
        subtitle={`${subtitle}${hasComparison ? " · % เทียบกับช่วงก่อน" : ""}${onTrace ? " · กดแถวดูว่าตัวเลขมาจากไหน" : ""}`}
      />
      {data.length === 0 ? (
        <p className="px-5 py-10 text-center text-[13px] text-ink-subtle">ช่วงนี้ยังไม่มียอดขาย</p>
      ) : (
        <ol
          ref={ref}
          className="flex flex-1 flex-col justify-around gap-1 px-2 pt-3 pb-3 sm:px-3"
          aria-label="ยอดขายแต่ละสาขา เรียงจากมากไปน้อย"
        >
          {data.map((d, i) => {
            const on = highlight === "all" || highlight === d.branch;
            const width = max ? (d.revenue / max) * 100 : 0;
            const label =
              `${d.branch} ${formatBaht(d.revenue)} คิดเป็น ${formatPercent(d.share)} ของทั้งหมด` +
              (d.change == null ? "" : ` ${d.change >= 0 ? "เพิ่มขึ้น" : "ลดลง"} ${formatPercent(d.change)}`);
            const Row = onTrace ? "button" : "div";
            return (
              <li key={d.branch}>
                <Row
                  {...(onTrace && {
                    type: "button",
                    onClick: () => onTrace(d.branch),
                    "aria-label": `ดูที่มาของยอดขายสาขา${d.branch}: ${label}`,
                  })}
                  className="group block w-full cursor-pointer rounded-xl px-2 py-2 text-left transition-colors hover:bg-surface-hover sm:px-3"
                >
                  <span className="flex items-baseline justify-between gap-3 text-[13px]" aria-hidden={!!onTrace}>
                    <span className="flex items-baseline gap-2">
                      <span className="font-numeral w-4 text-xs text-ink-muted tabular-nums">{i + 1}</span>
                      <span className={on ? "font-medium text-ink" : "text-ink-subtle"}>{d.branch}</span>
                    </span>
                    <span className="flex items-baseline gap-2 tabular-nums">
                      <span className="font-medium text-ink">{formatBaht(d.revenue)}</span>
                      <span className="text-ink-muted">{formatPercent(d.share)}</span>
                      <ChangeText value={d.change} />
                    </span>
                  </span>
                  <span className="mt-1.5 block h-2.5 overflow-hidden rounded-full bg-canvas" aria-hidden="true">
                    <span
                      className={`pour-bar block h-full rounded-full ${on ? "is-on" : ""}`}
                      style={{
                        width: seen ? `${width}%` : "0%",
                        transitionDelay: seen ? `${i * 90}ms` : "0ms",
                      }}
                    />
                  </span>
                </Row>
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}
