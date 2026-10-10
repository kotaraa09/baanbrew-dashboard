// แท็บลูกค้าแบบเล่าเรื่อง: "เส้นทางของสมาชิก"
// เริ่มด้วยเรื่องเล่าแบบเลื่อนดู (MemberStory) แล้วต่อด้วยส่วนให้ลองสำรวจเอง: กดการ์ดกลุ่มเพื่อไฮไลต์เส้น, ชี้ที่เส้นเพื่อดูทีละคน
// ทุกตัวเลขมาจาก memberJourneys() และ customerView() ไม่มีตัวเลขตายตัว
import { useMemo, useState } from "react";
import { memberJourneys } from "../lib/journeys.js";
import { ACTIVE_DAYS } from "../lib/customerMetrics.js";
import { formatMonth, formatNumber } from "../lib/metrics.js";
import MemberLifelines from "./customers/MemberLifelines.jsx";
import CohortGrid from "./customers/CohortGrid.jsx";
import MemberStory from "./customers/MemberStory.jsx";

const pct = (x) => `${Math.round(x * 100)}%`;
const NB = " ";
const Num = ({ children }) => <span className="whitespace-nowrap">{children}</span>;

export default function CustomersStory({ view, data }) {
  const j = useMemo(() => memberJourneys(data.rows, data.customers, data.branchInfo, data.last), [data]);
  const [filter, setFilter] = useState("all");
  const { groups } = j;

  // การ์ดกลุ่ม = ปุ่มกรอง: กดแล้วเส้นของคนกลุ่มนั้นเข้มขึ้น ที่เหลือจางลง
  const GROUPS = [
    { key: "all", value: formatNumber(j.buyers), text: "คนที่เคยซื้อ ดูทุกเส้น" },
    { key: "top", value: pct(groups.top.revenueShare), text: <>ของยอดสมาชิก มาจาก 20% แรก (<Num>{formatNumber(groups.top.count)} คน</Num>)</> },
    { key: "once", value: <Num>{formatNumber(groups.once.count)} คน</Num>, text: "ซื้อครั้งเดียวแล้วไม่กลับมา" },
    { key: "lapsed", value: <Num>{formatNumber(groups.lapsed.count)} คน</Num>, text: <>ไม่ได้มาเกิน <Num>{ACTIVE_DAYS} วัน</Num>แล้ว</> },
    { key: "oneBranch", value: pct(groups.oneBranch.count / j.buyers), text: "ซื้อแค่สาขาเดียว ไม่เคยไปสาขาอื่น" },
  ];
  const CAPTION = {
    all: (
      <>
        เส้นไหนขีดถี่ไปจนสุดขวา คือคนที่ยังมาประจำ เส้นไหนขีดหยุดกลางทาง คือคนที่หายไป · คนที่กลับมาซื้ออีก ครึ่งหนึ่งกลับมาภายใน{" "}
        <Num>{j.toSecond} วัน</Num>หลังบิลแรก
      </>
    ),
    top: (
      <>
        เส้นสีเข้มคือ <Num>{formatNumber(groups.top.count)} คน</Num> ที่ใช้จ่ายเยอะสุด แค่กลุ่มนี้กลุ่มเดียวก็ทำยอดให้ร้าน{" "}
        <b>{pct(groups.top.revenueShare)}</b> ของยอดสมาชิกทั้งหมด
      </>
    ),
    once: (
      <>
        <Num>{formatNumber(groups.once.count)} คน</Num> มาแค่ครั้งเดียว บนเส้นเลยมีขีดเดียวแล้วก็หายไป คิดเป็น{" "}
        {pct(groups.once.count / j.buyers)} ของคนที่เคยซื้อ
      </>
    ),
    lapsed: (
      <>
        <Num>{formatNumber(groups.lapsed.count)} คน</Num> ไม่ได้มาเกิน <Num>{ACTIVE_DAYS} วัน</Num>แล้ว ทั้งที่ครึ่งหนึ่งเคยซื้อไป{" "}
        <Num>{groups.lapsed.medianBills} บิล</Num>ขึ้นไป
      </>
    ),
    oneBranch: (
      <>
        {pct(groups.oneBranch.count / j.buyers)} ของคนที่เคยซื้อ ซื้อแค่สาขาเดียวมาตลอด และบิลของสมาชิก{" "}
        <b>{pct(groups.oneBranch.homeBillShare)}</b> เกิดที่สาขาประจำของตัวเอง ลูกค้าส่วนใหญ่ซื้อที่สาขาเดิมของตัวเอง
      </>
    ),
  };

  const r1 = j.retention(1);
  const r6 = j.retention(6);

  return (
    <div className="space-y-4">
      {/* เรื่องเล่าแบบเลื่อนดู: ภาพเดียวเปลี่ยนรูปไปทีละขั้น */}
      <MemberStory j={j} view={view} first={data.first} />

      {/* เส้นชีวิต */}
      <section className="journey-card" aria-labelledby="lifelines-title">
        <div className="journey-head">
          <p className="journey-eyebrow">ลองสำรวจเอง</p>
          <h2 id="lifelines-title" className="journey-h2 font-display">
            {formatNumber(j.buyers)} เส้น คือสมาชิกทุกคนที่เคยซื้อ
          </h2>
          <p className="journey-legend">
            <span className="journey-key is-line" /> 1 เส้น = สมาชิก 1 คน <span className="journey-key is-tick" /> 1 ขีด = 1 บิล · เรียงตามวันที่ซื้อครั้งแรก
            · ชี้ที่เส้นเพื่อดูทีละคน
          </p>
        </div>

        <div className="journey-groups" role="group" aria-label="ไฮไลต์เส้นของสมาชิกกลุ่มไหน">
          {GROUPS.map((g) => (
            <button
              key={g.key}
              type="button"
              aria-pressed={filter === g.key}
              className="journey-group"
              onClick={() => setFilter(g.key)}
            >
              <b className="font-display">{g.value}</b>
              <span>{g.text}</span>
            </button>
          ))}
        </div>

        <MemberLifelines j={j} first={data.first} filter={filter} />
        <p key={filter} className="journey-caption" aria-live="polite">
          {CAPTION[filter]}
        </p>
      </section>

      {/* ตารางรุ่น */}
      <section className="journey-card" aria-labelledby="cohort-title">
        <div className="journey-head">
          <p className="journey-eyebrow">ย่อเส้นทั้งหมดลงเป็นตาราง</p>
          <h2 id="cohort-title" className="journey-h2 font-display">
            {r1 != null && r6 != null ? (
              <>
                เดือนถัดมายังกลับมา <em>{pct(r1)}</em> พอครบ <Num>6 เดือน</Num>เหลือ <em>{pct(r6)}</em>
              </>
            ) : (
              "สมาชิกแต่ละรุ่นยังกลับมากี่ %"
            )}
          </h2>
          <p className="journey-legend">
            แต่ละแถวคือสมาชิกที่ซื้อครั้งแรกในเดือนเดียวกัน ช่องยิ่งเข้ม ยิ่งมีคนกลับมาซื้อในเดือนนั้นเยอะ
            {j.cohorts.some((c) => c.cells.some((x) => x.partial)) && (
              <> · ช่องลายคือ {formatMonth(`${data.last.slice(0, 7)}-01`)} ที่ข้อมูลยังไม่ครบเดือน</>
            )}
          </p>
        </div>
        <CohortGrid j={j} />
      </section>

      <p className="px-1 text-xs text-ink-muted">
        ข้อมูลถึง {formatMonth(`${data.last.slice(0, 7)}-01`)} · ใน public/customers.csv ตัดชื่อเล่นกับเบอร์โทรออกแล้ว
        (PDPA){NB}· อายุ เพศ และตัวเลขอื่น ๆ ดูได้ที่ "ตัวเลขละเอียด"
      </p>
    </div>
  );
}
