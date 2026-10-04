import { useTweenedNumber } from "./ui.jsx";
import { formatBaht, formatPercent, percentChange } from "../lib/metrics.js";

const NB = "\u00a0";
// ชั่วโมงแบบที่คนไทยพูดกัน: 8 โมงเช้า, เที่ยง, บ่าย 2 โมง, 4 โมงเย็น, 1 ทุ่ม
const hh = (h) =>
  (h === 0 ? "เที่ยงคืน" : h < 6 ? `ตี ${h}` : h === 12 ? "เที่ยง" : h < 12 ? `${h} โมงเช้า` : h === 13 ? "บ่ายโมง" : h <= 15 ? `บ่าย ${h - 12} โมง` : h <= 18 ? `${h - 12} โมงเย็น` : `${h - 18} ทุ่ม`).replaceAll(" ", NB);

function Money({ value }) {
  const shown = useTweenedNumber(value, 1100);
  return <em className="headline-num">{formatBaht(Math.round(shown))}</em>;
}

function Delta({ value }) {
  if (value == null) return null;
  const flat = Math.abs(value) < 0.05;
  const up = value > 0;
  return (
    <em className={`headline-delta ${flat ? "" : up ? "is-up" : "is-down"}`}>
      {flat ? "เท่าเดิม" : `${up ? "เพิ่มขึ้น" : "ลดลง"} ${formatPercent(value)}`}
    </em>
  );
}

// หัวเรื่องของหน้าภาพรวมเขียนจากตัวเลขจริง (แทนภาพ hero): อ่านประโยคเดียวรู้สถานะของช่วงที่เลือก
// แต่ละท่อนลอยขึ้นตามลำดับ และเล่นใหม่ทุกครั้งที่เปลี่ยนช่วง/สาขา (key จาก Dashboard)
export default function DataHeadline({ rangeLabel, branch, kpis, previousKpis, branches, topProduct, peakHour }) {
  if (kpis.orderCount === 0) {
    return (
      <p className="data-headline">
        <span className="headline-part">{rangeLabel}{branch === "all" ? "" : ` สาขา${branch}`} ยังไม่มียอดขายเลย</span>
      </p>
    );
  }
  const change = previousKpis ? percentChange(kpis.totalRevenue, previousKpis.totalRevenue) : null;
  const rank = branches.findIndex((b) => b.branch === branch) + 1;
  const parts = [
    <>
      {rangeLabel} {branch === "all" ? "บ้านบรู" : `สาขา${branch}`}ขายได้ <Money value={kpis.totalRevenue} />
    </>,
    change != null && (
      <>
        <Delta value={change} /> จากช่วงก่อนหน้า
      </>
    ),
    branch === "all"
      ? branches[0] && (
          <>
            <em>สาขา{branches[0].branch}</em>ขายดีสุด
          </>
        )
      : rank > 0 && (
          <>
            อันดับ <em>{rank}</em> จาก {branches.length} สาขา
          </>
        ),
    topProduct && (
      <>
        เมนูที่ทำเงินเยอะสุดคือ <em>{topProduct}</em>
      </>
    ),
    peakHour != null && (
      <>
        คนแน่นสุดตอน{/^\d/.test(hh(peakHour)) ? " " : ""}<em className="headline-num">{hh(peakHour)}</em>
      </>
    ),
  ].filter(Boolean);

  return (
    <p className="data-headline">
      {parts.map((p, i) => (
        <span key={i} className="headline-part" style={{ animationDelay: `${i * 90}ms` }}>
          {p}
          {i < parts.length - 1 ? " " : ""}
        </span>
      ))}
    </p>
  );
}
