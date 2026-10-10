// Lab 4.1–4.2 · ลูกค้าและเมนู: RFM, Cohort, ABC
import { useState } from "react";
import {
  ResponsiveContainer, BarChart, Bar, ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LabelList, Cell, ReferenceLine,
} from "recharts";
import {
  AnalyticsShell, Card, Pending, Insight, MAIN, BAR, SOFT, MUTED, INK, SUBTLE, LINE_STRONG, ROAST,
  axis, grid, legend, tooltip, buttonClass, primaryButtonClass, thClass, rowClass, pct, thaiMonth,
} from "./ui.jsx";
import { useAnalytics } from "./useAnalytics.js";
import { SEGMENTS } from "../lib/analytics/rfm.js";
import { fmtBaht } from "../lib/metrics.js";

const SEG_TH = Object.fromEntries(SEGMENTS.map((s) => [s.id, s]));

// ---------------- RFM ----------------
function RfmCard({ rfm, onPick, picked }) {
  if (rfm.error) return <Card title="RFM · กลุ่มลูกค้า"><Pending lab="Lab 4.1" error={rfm.error} /></Card>;
  const data = rfm.segments.map((s) => ({ ...s, label: SEG_TH[s.segment].th }));
  const ch = rfm.segments.find((s) => s.segment === "Champions");
  const risk = rfm.segments.find((s) => s.segment === "At Risk");
  const pick = (d) => onPick?.(d.payload?.segment ?? d.segment);
  return (
    <Card title="RFM · กลุ่มลูกค้าสมาชิก" sub="สัดส่วนจำนวนลูกค้า เทียบกับสัดส่วนยอดซื้อ · คลิกกลุ่มเพื่อดูรายชื่อ">
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 0, right: 44 }} barGap={2}>
            <CartesianGrid {...grid} vertical horizontal={false} />
            <XAxis type="number" tickFormatter={(v) => pct(v)} domain={[0, 0.45]} {...axis} />
            <YAxis type="category" dataKey="label" width={92} {...axis} tick={{ fontSize: 13, fill: INK }} />
            <Tooltip formatter={(v, n) => [pct(v, 1), n]} {...tooltip} />
            <Legend {...legend} />
            <Bar name="% ลูกค้า" dataKey="customerShare" fill={MUTED} radius={[0, 4, 4, 0]} isAnimationActive={false}
                 onClick={pick} style={{ cursor: "pointer" }} />
            <Bar name="% ยอดซื้อ" dataKey="revenueShare" fill={BAR} radius={[0, 4, 4, 0]} isAnimationActive={false}
                 onClick={pick} style={{ cursor: "pointer" }}>
              {data.map((d) => <Cell key={d.segment} fill={picked && picked !== d.segment ? SOFT : BAR} />)}
              <LabelList dataKey="revenueShare" position="right" formatter={(v) => pct(v)} style={{ fontSize: 12, fill: INK }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <Insight>
        ลูกค้าชั้นยอด {ch.customers.toLocaleString()} คน ({pct(ch.customerShare)} ของสมาชิก) ทำยอด {pct(ch.revenueShare)} ·
        กลุ่มเสี่ยงหาย {risk.customers.toLocaleString()} คน ยังถือยอด {pct(risk.revenueShare)} เป็นเป้าหมายแรกของแคมเปญดึงกลับ
      </Insight>
      <div className="-mx-4 mt-3 overflow-x-auto sm:-mx-5">
        <table className="w-full min-w-[560px] text-[13px] tabular-nums">
          <thead className="text-left">
            <tr>
              <th className={`${thClass} pl-4 sm:pl-5`}>กลุ่ม</th>
              <th className={`${thClass} text-right`}>ลูกค้า</th>
              <th className={`${thClass} text-right`}>ยอดซื้อ</th>
              <th className={`${thClass} pl-4 sm:pr-5`}>ควรทำอะไร</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => {
              const sel = picked === d.segment;
              return (
                <tr key={d.segment} onClick={() => onPick?.(d.segment)} aria-selected={sel}
                    className={`${rowClass} cursor-pointer ${sel ? "bg-surface-selected" : "hover:bg-surface-hover"}`}>
                  <td className="py-2.5 pr-3 pl-4 sm:pl-5">
                    <span className="font-medium text-ink">{d.label}</span> <span className="text-ink-muted">{d.segment}</span>
                  </td>
                  <td className="pr-3 text-right text-ink">{d.customers.toLocaleString()}</td>
                  <td className="pr-3 text-right text-ink">{fmtBaht(d.revenue)}</td>
                  <td className="pl-4 text-ink-subtle sm:pr-5">{SEG_TH[d.segment].action}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ---------------- Lab 4.1B · รายชื่อลูกค้าในกลุ่มที่คลิก ----------------
const CSV_COLUMNS = ["customer_id", "segment", "days_since_last", "bills", "revenue", "r", "f", "m"];

function downloadCsv(segment, customers) {
  const lines = [CSV_COLUMNS.join(",")];
  for (const c of customers) lines.push([c.id, segment, c.R, c.F, c.M, c.r, c.f, c.m].join(","));
  // BOM (﻿) ทำให้ Excel อ่านไฟล์เป็น UTF-8 ภาษาไทยจึงไม่เพี้ยน
  const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href: url, download: `rfm-${segment.replace(/\s+/g, "-")}.csv` });
  a.click();
  URL.revokeObjectURL(url);
}

function CustomerList({ rfm, segment, onClose }) {
  const group = rfm.customers.filter((c) => c.segment === segment).sort((a, b) => b.M - a.M);
  const info = SEG_TH[segment];
  return (
    <Card title={`${info.th} · ${segment}`} sub={`${group.length.toLocaleString()} คน · เรียงตามยอดซื้อรวม แสดง 15 คนแรก · ${info.action}`}
          right={<div className="flex gap-2">
            <button type="button" onClick={() => downloadCsv(segment, group)} className={primaryButtonClass}>ดาวน์โหลด CSV</button>
            <button type="button" onClick={onClose} aria-label="ปิดรายชื่อ" className={buttonClass}>ปิด</button>
          </div>}>
      <div className="-mx-4 overflow-x-auto sm:-mx-5">
        <table className="w-full min-w-[520px] text-[13px] tabular-nums">
          <thead className="text-left">
            <tr>
              <th className={`${thClass} pl-4 sm:pl-5`}>รหัสลูกค้า</th>
              <th className={`${thClass} text-right`}>ไม่ได้มา (วัน)</th>
              <th className={`${thClass} text-right`}>จำนวนบิล</th>
              <th className={`${thClass} text-right`}>ยอดซื้อรวม</th>
              <th className={`${thClass} pl-4 sm:pr-5`}>คะแนน R-F-M</th>
            </tr>
          </thead>
          <tbody>
            {group.slice(0, 15).map((c) => (
              <tr key={c.id} className={`${rowClass} hover:bg-surface-hover`}>
                <td className="py-2 pr-3 pl-4 font-medium text-ink sm:pl-5">{c.id}</td>
                <td className="pr-3 text-right text-ink">{c.R.toLocaleString()}</td>
                <td className="pr-3 text-right text-ink">{c.F.toLocaleString()}</td>
                <td className="pr-3 text-right text-ink">{fmtBaht(c.M)}</td>
                <td className="pl-4 text-ink-subtle sm:pr-5">{c.r}-{c.f}-{c.m}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-ink-muted">ไฟล์ CSV มีรหัสลูกค้าและพฤติกรรมการซื้อ ใช้ภายในร้านเท่านั้น ไม่ส่งต่อให้บุคคลภายนอก (PDPA)</p>
    </Card>
  );
}

// ---------------- Cohort ----------------
function CohortCard({ cohort }) {
  if (cohort.error) return <Card title="Cohort · การกลับมาซื้อซ้ำ"><Pending lab="Lab 4.2" error={cohort.error} /></Card>;
  const MAXK = 12;
  const level = (v) => Math.min(4, Math.floor(v * 5)); // 0–4 → roast-1..5
  const avg1 = (() => {
    const xs = cohort.cohorts.filter((c) => c.retention.length > 2).map((c) => c.retention[1]);
    return xs.reduce((a, b) => a + b, 0) / xs.length;
  })();
  return (
    <Card title="Cohort · การกลับมาซื้อซ้ำ" sub="แถว = เดือนแรกที่ซื้อ · คอลัมน์ = เดือนที่เท่าไรหลังจากนั้น · ช่องลายขีด = เดือนล่าสุดที่ข้อมูลยังไม่ครบ">
      <div className="overflow-x-auto">
        <div className="inline-grid gap-[3px] text-xs tabular-nums" style={{ gridTemplateColumns: `68px 40px repeat(${MAXK + 1}, 40px)` }}>
          <div className="font-medium text-ink-subtle">เดือนแรก</div>
          <div className="pr-1 text-right font-medium text-ink-subtle">คน</div>
          {Array.from({ length: MAXK + 1 }, (_, k) => <div key={k} className="text-center font-medium text-ink-subtle">{k}</div>)}
          {cohort.cohorts.map((c) => (
            <Row key={c.cohort} c={c} MAXK={MAXK} level={level} partial={cohort.lastMonthPartial} />
          ))}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-ink-subtle">
        <span>กลับมาน้อย</span>
        {ROAST.map((c) => <i key={c} className="inline-block h-2.5 w-5 rounded-sm" style={{ background: c }} />)}
        <span>กลับมามาก</span>
      </div>
      <Insight>
        โดยเฉลี่ยลูกค้าใหม่กลับมาซื้อในเดือนถัดไป {pct(avg1)} · ช่องแนวทแยงล่างขวาดูต่ำผิดปกติเพราะ{thaiMonth(cohort.lastMonth)}มีข้อมูล{" "}
        {cohort.daysInLastMonth} จาก {cohort.daysInMonth} วัน (กับดักเดียวกับกราฟ 4 ใน Lab 2.2)
      </Insight>
    </Card>
  );
}
function Row({ c, MAXK, level, partial }) {
  const last = c.retention.length - 1;
  return (
    <>
      <div className="py-1.5 text-ink">{thaiMonth(c.cohort)}</div>
      <div className="py-1.5 pr-1 text-right text-ink-subtle">{c.size}</div>
      {Array.from({ length: MAXK + 1 }, (_, k) => {
        const v = c.retention[k];
        if (v === undefined) return <div key={k} />;
        const isPartial = partial && k === last && k > 0;
        const lv = level(v);
        const bg = ROAST[lv];
        return (
          <div key={k} title={`${thaiMonth(c.cohort)} เดือนที่ ${k}: ${pct(v, 1)}${isPartial ? " (เดือนไม่ครบ)" : ""}`}
               className="flex h-7 items-center justify-center rounded-[4px]"
               style={{
                 background: isPartial ? `repeating-linear-gradient(45deg, ${bg}, ${bg} 4px, var(--color-surface) 4px, var(--color-surface) 6px)` : bg,
                 // ระดับเข้ม 2 ขั้นบนใช้ตัวอักษรสีตรงข้าม (on-chart สลับเองตามธีม)
                 color: lv >= 3 ? "var(--color-on-chart)" : "var(--color-ink)",
               }}>
            {k === 0 ? "" : Math.round(v * 100)}
          </div>
        );
      })}
    </>
  );
}

// ---------------- ABC ----------------
function AbcCard({ abc }) {
  if (abc.error) return <Card title="Pareto · ABC ของเมนู"><Pending lab="Lab 4.2" error={abc.error} /></Card>;
  const items = abc.items;
  const nA = items.filter((i) => i.cls === "A").length;
  const C = items.filter((i) => i.cls === "C");
  const fill = { A: BAR, B: SOFT, C: MUTED };
  return (
    <Card title="Pareto · ABC ของเมนู" sub="แท่ง = สัดส่วนยอดขายแต่ละเมนู · เส้น = ยอดสะสม · แกนเดียวกันเป็น %">
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={items} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid {...grid} />
            <XAxis dataKey="rank" interval={4} {...axis}
                   label={{ value: "อันดับเมนู", position: "insideBottomRight", offset: -2, fontSize: 12, fill: SUBTLE }} />
            <YAxis tickFormatter={(v) => pct(v)} domain={[0, 1]} width={44} {...axis} />
            <Tooltip labelFormatter={(r) => { const it = items[r - 1]; return `#${r} ${it.name} · กลุ่ม ${it.cls}`; }}
                     formatter={(v, n) => [pct(v, 1), n]} {...tooltip} />
            <ReferenceLine y={0.8} stroke={LINE_STRONG} strokeDasharray="4 4" label={{ value: "80%", position: "right", fontSize: 11, fill: SUBTLE }} />
            <Bar name="สัดส่วนยอดขาย" dataKey="share" radius={[4, 4, 0, 0]} isAnimationActive={false}>
              {items.map((i) => <Cell key={i.product_id} fill={fill[i.cls]} />)}
            </Bar>
            <Line name="ยอดสะสม" dataKey="cumShare" stroke={MAIN} strokeWidth={2} dot={false} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex flex-wrap gap-4 text-xs text-ink-subtle">
        {["A", "B", "C"].map((k) => (
          <span key={k} className="inline-flex items-center gap-1.5">
            <i className="inline-block size-2.5 rounded-sm" style={{ background: fill[k] }} />
            กลุ่ม {k} <span className="text-ink">{items.filter((i) => i.cls === k).length} เมนู</span>
          </span>
        ))}
      </div>
      <Insight>
        {nA} เมนูจาก {items.length} ทำยอด 80% · กลุ่ม C ({C.map((i) => i.name).join(", ")}) รวมกันแค่ {pct(C.reduce((s, i) => s + i.share, 0), 1)} ควรทบทวนก่อนเพิ่มเมนูใหม่
      </Insight>
    </Card>
  );
}

export default function CustomersTab({ source }) {
  const state = useAnalytics(source);
  const [picked, setPicked] = useState(null);
  return (
    <AnalyticsShell source={source} state={state} title="ลูกค้าและเมนู"
                    intro="ลูกค้ากลุ่มไหนกำลังจะหาย ลูกค้าใหม่กลับมาซื้อซ้ำไหม และเมนูไหนทำยอดส่วนใหญ่ของร้าน">
      {(d) => (
        <div className="space-y-4">
          <RfmCard rfm={d.rfm} picked={picked} onPick={(s) => setPicked((p) => (p === s ? null : s))} />
          {picked && !d.rfm.error && <CustomerList rfm={d.rfm} segment={picked} onClose={() => setPicked(null)} />}
          <CohortCard cohort={d.cohort} />
          <AbcCard abc={d.abc} />
        </div>
      )}
    </AnalyticsShell>
  );
}
