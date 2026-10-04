import { useSeen } from "../ui.jsx";
import { formatMonth, formatNumber } from "../../lib/metrics.js";

const NB = " ";
const pct = (x) => `${Math.round(x * 100)}%`;
// สีตามสัดส่วนที่กลับมา: ใช้ชุดสีเดียวกับปฏิทินคั่ว (--roast-1..5)
const LEVELS = [0.2, 0.35, 0.5, 0.65];
const level = (rate) => 1 + LEVELS.filter((t) => rate >= t).length;

// ตารางรุ่น: แต่ละแถว = สมาชิกที่ซื้อครั้งแรกในเดือนเดียวกัน · ช่องที่ k = เดือนที่ k หลังจากนั้น ยังมีบิลกี่ %
// เป็นภาพย่อของเส้นชีวิตด้านบน: ยิ่งไปทางขวา คนที่ยังมาก็ยิ่งน้อยลง
export default function CohortGrid({ j }) {
  const [ref, seen] = useSeen(0.2);
  const { cohorts } = j;
  const cols = Math.max(...cohorts.map((c) => c.cells.length));

  return (
    <div ref={ref} className={`cohort ${seen ? "is-in" : ""}`}>
      <div className="cohort-scroll">
        <table className="cohort-table">
          <caption className="sr-only">
            สัดส่วนสมาชิกที่ยังกลับมาซื้อ แยกตามเดือนที่ซื้อครั้งแรก และจำนวนเดือนหลังจากนั้น
          </caption>
          <thead>
            <tr>
              <th scope="col" className="cohort-corner">
                ซื้อครั้งแรก
              </th>
              {Array.from({ length: cols }, (_, k) => (
                <th key={k} scope="col" className="cohort-k">
                  {k + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cohorts.map((c, r) => (
              <tr key={c.month}>
                <th scope="row" className="cohort-label">
                  {formatMonth(`${c.month}-01`)}
                  <small>
                    {formatNumber(c.size)}
                    {NB}คน
                  </small>
                </th>
                {Array.from({ length: cols }, (_, k) => {
                  const cell = c.cells[k];
                  if (!cell) return <td key={k} className="cohort-empty" />;
                  const lv = level(cell.rate);
                  return (
                    <td
                      key={k}
                      className={`cohort-cell lv-${lv} ${cell.partial ? "is-partial" : ""}`}
                      style={{ transitionDelay: seen ? `${(r + k) * 18}ms` : "0ms" }}
                      title={`${formatMonth(`${c.month}-01`)} · เดือนที่ ${cell.k}: กลับมา ${pct(cell.rate)}${cell.partial ? " (เดือนนี้ข้อมูลยังไม่ครบ)" : ""}`}
                    >
                      <span>{pct(cell.rate)}</span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="cohort-foot">
        <span>เดือนที่… หลังซื้อครั้งแรก →</span>
        <span className="cohort-scale" aria-hidden="true">
          น้อย
          {[1, 2, 3, 4, 5].map((lv) => (
            <i key={lv} className={`lv-${lv}`} />
          ))}
          เยอะ
        </span>
      </div>
    </div>
  );
}
