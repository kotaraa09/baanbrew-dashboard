import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LabelList, Cell } from "recharts";
import { Card, CardHeader } from "./ui.jsx";
import { formatBaht, formatPercent } from "../lib/metrics.js";

const ROW_HEIGHT = 52;

// ไม่มี tooltip: ป้ายแสดงตัวเลขครบแล้ว tooltip จะบังตัวเลขเปล่า ๆ
// ป้ายเหนือแท่ง: ชื่อสาขาชิดซ้าย, ยอดขาย · สัดส่วน · % เปลี่ยนแปลงชิดขวาของพื้นที่กราฟ
// แท่งยาวสุดเต็มความกว้าง จึงหาขอบขวาได้จาก x + width × (ยอดสูงสุด ÷ ยอดของแท่งนี้)
function RowLabel({ x, y, width, index, data, max }) {
  const d = data[index];
  const right = x + (d.revenue ? width * (max / d.revenue) : 0);
  // กติกาเดียวกับ <Change>: ต่ำกว่า 0.05% ถือว่าคงที่ (สีเทา ไม่มีเครื่องหมาย)
  const flat = d.change != null && Math.abs(d.change) < 0.05;
  const changeTone =
    d.change == null ? null : flat ? "var(--color-ink-subtle)" : d.change > 0 ? "var(--color-up)" : "var(--color-down)";
  const sign = flat ? "" : d.change > 0 ? "+" : "−";

  return (
    <g>
      <text x={x} y={y - 8} fontSize={13} fill="var(--color-ink)">
        {d.branch}
      </text>
      <text x={right} y={y - 8} fontSize={13} textAnchor="end">
        <tspan fill="var(--color-ink)" fontWeight={500}>
          {formatBaht(d.revenue)}
        </tspan>
        <tspan fill="var(--color-ink-muted)" dx={8}>
          {formatPercent(d.share)}
        </tspan>
        {changeTone && (
          <tspan fill={changeTone} fontWeight={500} dx={8}>
            {`${sign}${formatPercent(d.change)}`}
          </tspan>
        )}
      </text>
    </g>
  );
}

export default function BranchCard({ data, subtitle, hasComparison, highlight = "all", onTrace }) {
  const max = Math.max(0, ...data.map((d) => d.revenue));

  return (
    <Card className="flex flex-col">
      <CardHeader
        title="ยอดขายแยกสาขา"
        subtitle={`${subtitle}${hasComparison ? " · % เทียบช่วงก่อนหน้า" : ""}${onTrace ? " · กดแถวเพื่อดูที่มา" : ""}`}
      />
      {data.length === 0 ? (
        <p className="px-5 py-10 text-center text-[13px] text-ink-subtle">ไม่มียอดขายในช่วงเวลานี้</p>
      ) : (
        <div
          key={`${subtitle}|${highlight}`}
          className="relative animate-fade-in px-4 pt-2 pb-3 sm:px-5"
          style={{ height: data.length * ROW_HEIGHT + 16 }}
          role="img"
          aria-label={`ยอดขายแยกสาขา เรียงจากมากไปน้อย: ${data
            .map(
              (d) =>
                `${d.branch} ${formatBaht(d.revenue)} สัดส่วน ${formatPercent(d.share)}` +
                (d.change == null ? "" : ` ${d.change >= 0 ? "เพิ่มขึ้น" : "ลดลง"} ${formatPercent(d.change)}`)
            )
            .join(", ")}`}
        >
          <ResponsiveContainer>
            <BarChart data={data} layout="vertical" margin={{ top: 20, right: 0, left: 0, bottom: 0 }} barSize={10}>
              <XAxis type="number" hide domain={[0, max || 1]} />
              <YAxis type="category" dataKey="branch" hide />
              <Bar
                dataKey="revenue"
                radius={5}
                background={{ fill: "var(--color-canvas)", radius: 5 }}
                isAnimationActive={false}
              >
                {data.map((d) => (
                  <Cell
                    key={d.branch}
                    fill={highlight === "all" || highlight === d.branch ? "var(--color-chart-bar)" : "var(--color-bar-muted)"}
                  />
                ))}
                <LabelList content={<RowLabel data={data} max={max} />} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {/* ปุ่มโปร่งใสทับแต่ละแถว (ป้าย + แท่ง) ให้กดดูที่มาได้ทั้งเมาส์และคีย์บอร์ด
              Recharts แบ่งพื้นที่ใต้ margin บน 20px ให้แต่ละแถวเท่า ๆ กัน */}
          {onTrace && (
            <div className="absolute inset-x-2 top-[20px] bottom-[20px] flex flex-col sm:inset-x-3">
              {data.map((d) => (
                <button
                  key={d.branch}
                  type="button"
                  onClick={() => onTrace(d.branch)}
                  aria-label={`ดูที่มาของยอดขายสาขา${d.branch}`}
                  className="flex-1 cursor-pointer rounded-lg transition-colors hover:bg-ink/[0.035]"
                />
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
