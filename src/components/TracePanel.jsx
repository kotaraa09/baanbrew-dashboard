import { useEffect, useMemo, useRef, useState } from "react";
import Papa from "papaparse";
import { Segmented } from "./ui.jsx";
import {
  traceRows,
  sheetFormula,
  formatBaht,
  formatBahtExact,
  formatNumber,
  formatPercent,
  formatRange,
} from "../lib/metrics.js";

// ตัวเลขแต่ละแบบที่กดดูที่มาได้: ชื่อ, ค่า, และคอลัมน์ของ sales.csv ที่ใช้คำนวณ (ไฮไลต์ในตารางตัวอย่าง)
const KINDS = {
  revenue: { title: "ยอดขายรวม", columns: ["qty", "unit_price", "revenue"], value: (t) => formatBaht(t.kpis.totalRevenue) },
  orders: { title: "จำนวนบิล", columns: ["order_id"], value: (t) => formatNumber(t.kpis.orderCount) },
  aov: { title: "ยอดเฉลี่ยต่อบิล", columns: ["order_id", "revenue"], value: (t) => formatBahtExact(t.kpis.avgOrderValue) },
  members: { title: "ลูกค้าสมาชิก", columns: ["customer_id"], value: (t) => formatNumber(t.kpis.memberCount) },
  branch: { title: "ยอดขายสาขา", columns: ["branch", "qty", "unit_price", "revenue"], value: (t) => formatBaht(t.kpis.totalRevenue) },
  product: { title: "ยอดขายเมนู", columns: ["product_id", "qty", "unit_price", "revenue"], value: (t) => formatBaht(t.kpis.totalRevenue) },
};

const SAMPLE_COLUMNS = [
  { key: "order_id", label: "order_id" },
  { key: "date", label: "วันที่", source: "datetime" },
  { key: "branch", label: "branch" },
  { key: "product_id", label: "product_id" },
  { key: "qty", label: "qty", numeric: true },
  { key: "unit_price", label: "unit_price", numeric: true },
  { key: "revenue", label: "qty × price", numeric: true, computed: true },
  { key: "customer_id", label: "customer_id" },
];
const SAMPLE_SIZE = 8;

const EXPORT_FIELDS = ["order_id", "datetime", "branch", "product_id", "qty", "unit_price", "customer_id", "payment_method", "channel", "revenue"];

function Section({ step, title, children, aside }) {
  // ส่วนต่าง ๆ ลอยขึ้นตามลำดับหลังแผงเลื่อนเข้ามา
  return (
    <section className="animate-rise border-t border-line px-5 py-4" style={{ animationDelay: `${120 + step * 60}ms` }}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-[13px] font-semibold text-ink">
          <span className="inline-flex size-5 items-center justify-center rounded-full bg-canvas text-[11px] text-ink-subtle tabular-nums">
            {step}
          </span>
          {title}
        </h3>
        {aside}
      </div>
      {children}
    </section>
  );
}

// ---------- 1. กรองแถว ----------

function FilterSteps({ trace, spec }) {
  const total = trace.steps[0].count;
  const label = {
    all: { name: "sales.csv ทั้งหมด", detail: "1 แถว = 1 รายการสินค้า" },
    date: { name: "ช่วงวันที่", detail: `LEFT(datetime, 10) อยู่ระหว่าง ${spec.start} ถึง ${spec.end}` },
    branch: { name: "สาขา", detail: `branch = ${spec.branch}` },
    product: { name: "เมนู", detail: `product_id = ${spec.productId} (${spec.productName})` },
  };

  return (
    <ol className="space-y-2.5">
      {trace.steps.map((s, i) => (
        <li key={s.key}>
          <div className="flex items-baseline justify-between gap-3 text-[13px]">
            <span className="min-w-0">
              <span className="font-medium text-ink">{label[s.key].name}</span>
              <span className="ml-1.5 text-xs break-words text-ink-muted">{label[s.key].detail}</span>
            </span>
            <span className={`shrink-0 tabular-nums ${i === trace.steps.length - 1 ? "font-semibold text-ink" : "text-ink-subtle"}`}>
              {formatNumber(s.count)} แถว
            </span>
          </div>
          <div className="mt-1 h-1.5 rounded-full bg-canvas">
            <div
              className="trace-bar h-full rounded-full bg-chart-bar"
              style={{ width: `${Math.max(0.6, total ? (s.count / total) * 100 : 0)}%`, animationDelay: `${320 + i * 90}ms` }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}

// ---------- 2. คำนวณ ----------

function Formula({ lines, note }) {
  return (
    <div className="rounded-lg bg-surface-hover px-4 py-3">
      <div className="space-y-1 text-[13px] text-ink-subtle">
        {lines.map((l, i) => (
          <p key={i} className={l.result ? "pt-1 text-base font-semibold text-ink tabular-nums" : "tabular-nums"}>
            {l.result && <span className="mr-1.5 text-ink-muted">=</span>}
            {l.text}
          </p>
        ))}
      </div>
      {note && <p className="mt-2.5 border-t border-line pt-2.5 text-xs leading-relaxed text-ink-muted">{note}</p>}
    </div>
  );
}

function formulaFor(kind, trace, extra) {
  const { kpis, rows, qty, withCustomer } = trace;
  const n = formatNumber(rows.length);
  switch (kind) {
    case "orders":
      return {
        lines: [{ text: `นับ order_id ที่ไม่ซ้ำ จาก ${n} แถว` }, { text: `${formatNumber(kpis.orderCount)} บิล`, result: true }],
        note: kpis.orderCount
          ? `บิลหนึ่งมีเฉลี่ย ${(rows.length / kpis.orderCount).toFixed(2)} รายการ ถ้านับแถวจะได้ ${n} ซึ่งไม่ใช่จำนวนบิล`
          : null,
      };
    case "aov":
      return {
        lines: [
          { text: `ยอดขายรวม ${formatBahtExact(kpis.totalRevenue)}` },
          { text: `÷ จำนวนบิล ${formatNumber(kpis.orderCount)} บิล` },
          { text: formatBahtExact(kpis.avgOrderValue), result: true },
        ],
        note: "หารด้วยจำนวนบิล ไม่ใช่จำนวนแถว ถ้าหารด้วยแถวจะได้ยอดเฉลี่ยต่อรายการสินค้าแทน",
      };
    case "members":
      return {
        lines: [
          { text: `${n} แถว มี customer_id ${formatNumber(withCustomer)} แถว, ว่าง (ลูกค้าทั่วไป) ${formatNumber(rows.length - withCustomer)} แถว` },
          { text: `นับ customer_id ที่ไม่ซ้ำ ไม่นับค่าว่าง` },
          { text: `${formatNumber(kpis.memberCount)} คน`, result: true },
        ],
        note: "สมาชิกคนเดียวซื้อหลายครั้งนับเป็น 1 คน",
      };
    case "branch":
      return {
        lines: [
          { text: `ผลรวม qty × unit_price ของ ${n} แถว` },
          { text: formatBahtExact(kpis.totalRevenue), result: true },
        ],
        note: extra.chainRevenue
          ? `คิดเป็น ${formatPercent((kpis.totalRevenue / extra.chainRevenue) * 100)} ของยอดขายทุกสาขา ${formatBaht(extra.chainRevenue)} ในช่วงเดียวกัน`
          : null,
      };
    case "product":
      return {
        lines: [
          { text: `ผลรวม qty × unit_price ของ ${n} แถว` },
          { text: formatBahtExact(kpis.totalRevenue), result: true },
        ],
        note: `ขายได้ทั้งหมด ${formatNumber(qty)} ชิ้น (ผลรวม qty) ราคาต่อชิ้นอาจต่ำกว่าราคาเมนูในช่วงโปรฯ 1 แถม 1`,
      };
    default:
      return {
        lines: [
          { text: `ผลรวม qty × unit_price ของ ${n} แถว` },
          { text: formatBahtExact(kpis.totalRevenue), result: true },
        ],
        note: "คูณ qty กับ unit_price ทีละแถวก่อนแล้วค่อยรวม เพราะบางแถวซื้อมากกว่า 1 ชิ้น",
      };
  }
}

// ---------- 3. แถวตัวอย่าง ----------

function SampleRows({ rows, highlight }) {
  const sample = rows.slice(0, SAMPLE_SIZE);
  if (!sample.length) return <p className="text-[13px] text-ink-subtle">ไม่มีแถวที่ตรงเงื่อนไข</p>;
  const hot = (c) => highlight.includes(c.key);

  return (
    <div className="-mx-5 overflow-x-auto px-5">
      <table className="w-full text-xs whitespace-nowrap tabular-nums">
        <thead>
          <tr className="border-b border-line text-left">
            {SAMPLE_COLUMNS.map((c) => (
              <th
                key={c.key}
                scope="col"
                className={`px-2 py-1.5 font-medium first:pl-0 ${c.numeric ? "text-right" : ""} ${hot(c) ? "text-chart" : "text-ink-subtle"}`}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sample.map((r, i) => (
            <tr key={`${r.order_id}-${i}`} className="border-b border-line last:border-0">
              {SAMPLE_COLUMNS.map((c) => (
                <td
                  key={c.key}
                  className={`px-2 py-1.5 first:pl-0 ${c.numeric ? "text-right" : ""} ${
                    hot(c) ? "bg-chart/[0.06] font-medium text-ink" : "text-ink-subtle"
                  }`}
                >
                  {r[c.key] ?? <span className="text-ink-muted/60">–</span>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------- 4. ตรวจเอง ----------

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };
  return (
    <button
      type="button"
      onClick={copy}
      className="h-7 shrink-0 rounded-md border border-line-strong bg-surface px-2.5 text-xs font-medium text-ink transition-[background-color,scale] hover:bg-surface-hover active:scale-[0.97]"
    >
      <span key={copied ? "done" : "idle"} aria-live="polite" className={`inline-block ${copied ? "animate-pop text-up" : ""}`}>
        {copied ? "คัดลอกแล้ว ✓" : "คัดลอก"}
      </span>
    </button>
  );
}

function VerifyYourself({ kind, spec, expected }) {
  const [flavor, setFlavor] = useState("sheets");
  const formulaKind = kind === "branch" || kind === "product" ? "revenue" : kind;
  const formula = sheetFormula(formulaKind, spec, flavor);
  const valueLabel = { revenue: "Sum of revenue", orders: "order_id แบบ Distinct Count", aov: "Sum of revenue ÷ Distinct Count ของ order_id", members: "customer_id แบบ Distinct Count" }[formulaKind];

  return (
    <div className="space-y-3">
      <Segmented
        label="โปรแกรม"
        value={flavor}
        onChange={setFlavor}
        options={[
          { value: "sheets", label: "Google Sheets" },
          { value: "excel", label: "Excel 365" },
        ]}
      />
      <div className="rounded-lg border border-line">
        <div className="flex items-center justify-between gap-2 border-b border-line px-3 py-1.5">
          <span className="text-xs text-ink-subtle">วางในเซลล์ว่างของชีต sales.csv</span>
          <CopyButton text={formula} />
        </div>
        <code className="block px-3 py-2.5 font-mono text-[11.5px] leading-relaxed break-all text-ink">{formula}</code>
      </div>
      <p className="text-xs text-ink-subtle">
        ควรได้ <span className="font-semibold text-ink tabular-nums">{expected}</span> ตรงกับ Dashboard
      </p>
      <details className="group rounded-lg bg-surface-hover px-3 py-2 text-xs text-ink-subtle">
        <summary className="cursor-pointer font-medium text-ink">หรือตรวจด้วย Pivot Table</summary>
        <ol className="mt-2 list-decimal space-y-1 pl-4 leading-relaxed">
          <li>
            เพิ่มคอลัมน์ <code className="font-mono text-ink">date</code> = <code className="font-mono text-ink">LEFT(B2,10)</code> และ{" "}
            <code className="font-mono text-ink">revenue</code> = <code className="font-mono text-ink">E2*F2</code>
          </li>
          <li>
            สร้าง Pivot Table{flavor === "excel" && " (ติ๊ก “Add this data to the Data Model” เพื่อให้มี Distinct Count)"}
          </li>
          <li>
            Filter: date ตั้งแต่ {spec.start} ถึง {spec.end}
            {spec.branch !== "all" && `, branch = ${spec.branch}`}
            {spec.productId && `, product_id = ${spec.productId}`}
          </li>
          <li>Values: {valueLabel}</li>
        </ol>
      </details>
    </div>
  );
}

// ---------- ไอคอน ----------

const CloseIcon = () => (
  <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
    <path d="m5 5 10 10M15 5 5 15" />
  </svg>
);
const DownloadIcon = () => (
  <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10 3.5v9M6 9l4 4 4-4M4 15.5h12" />
  </svg>
);

// ---------- แผงหลัก ----------

// spec: { kind, start, end, branch, productId?, productName?, fileTag }
export default function TracePanel({ spec, rows, onClose }) {
  const [closing, setClosing] = useState(false);
  const closeRef = useRef(null);
  const kind = KINDS[spec.kind];

  const trace = useMemo(() => traceRows(rows, spec), [rows, spec]);
  // สัดส่วนของสาขา เทียบกับยอดทุกสาขาในช่วงเดียวกัน
  const chainRevenue = useMemo(
    () => (spec.kind === "branch" ? traceRows(rows, { ...spec, branch: "all" }).kpis.totalRevenue : null),
    [rows, spec]
  );
  const formula = formulaFor(spec.kind, trace, { chainRevenue });
  const formulaSpec = { ...spec, lastRow: rows.length + 1 };

  const panelRef = useRef(null);
  // ปิดด้วย timer เท่ากับความยาว animation (animationend ไม่ยิงถ้าแท็บถูกซ่อน)
  const requestClose = () => {
    if (closing) return;
    setClosing(true);
    setTimeout(onClose, 200);
  };

  // Escape ปิด, Tab วนอยู่ในแผง (เป็น modal)
  const onKeyDown = (e) => {
    if (e.key === "Escape") return requestClose();
    if (e.key !== "Tab") return;
    const items = [...panelRef.current.querySelectorAll("button:not([disabled]), summary, [href], input, select, [tabindex]:not([tabindex='-1'])")];
    const first = items[0];
    const last = items.at(-1);
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  // focus ปุ่มปิดตอนเปิด, คืน focus ให้ปุ่มที่กดตอนปิด, ล็อกการเลื่อนหน้าหลัง
  useEffect(() => {
    const opener = document.activeElement;
    closeRef.current?.focus();
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
      opener?.focus?.();
    };
  }, []);

  const download = () => {
    const csv = Papa.unparse(
      trace.rows.map((r) => Object.fromEntries(EXPORT_FIELDS.map((f) => [f, r[f] ?? ""]))),
      { columns: EXPORT_FIELDS }
    );
    // BOM ให้ Excel อ่านภาษาไทยถูก
    const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `baanbrew_${spec.fileTag}_${spec.start}_${spec.end}.csv`;
    // ต่อเข้า DOM ก่อนกด และคืน URL ทีหลัง: บางเบราว์เซอร์ (Safari) เริ่มดาวน์โหลดแบบ async ถ้าคืน URL ทันทีไฟล์จะหาย
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  };

  const context = [
    formatRange(spec.start, spec.end),
    spec.branch === "all" ? "ทุกสาขา" : `สาขา${spec.branch}`,
    spec.productName,
  ].filter(Boolean);

  return (
    <div className="fixed inset-0 z-50" onKeyDown={onKeyDown}>
      <div
        className={`absolute inset-0 bg-ink/25 ${closing ? "trace-backdrop-out" : "trace-backdrop-in"}`}
        onClick={requestClose}
        aria-hidden="true"
      />
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="trace-title"
        className={`absolute inset-y-0 right-0 flex w-full max-w-[480px] flex-col bg-surface shadow-[-8px_0_32px_rgb(0_0_0/0.12)] ${
          closing ? "trace-panel-out" : "trace-panel-in"
        }`}
      >
        <header className="px-5 pt-5 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium text-chart">ที่มาของตัวเลข</p>
              <h2 id="trace-title" className="mt-0.5 text-sm font-semibold text-ink">
                {spec.kind === "branch" ? `ยอดขายสาขา${spec.branch}` : spec.kind === "product" ? `ยอดขาย ${spec.productName}` : kind.title}
              </h2>
            </div>
            <button
              ref={closeRef}
              type="button"
              onClick={requestClose}
              aria-label="ปิด"
              className="-mt-1 -mr-1 inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-ink-subtle transition-colors hover:bg-surface-hover hover:text-ink"
            >
              <CloseIcon />
            </button>
          </div>
          <p className="mt-2 text-[28px] leading-tight font-semibold tracking-tight text-ink tabular-nums">{kind.value(trace)}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {context.map((c) => (
              <span key={c} className="rounded-md bg-canvas px-2 py-0.5 text-xs text-ink-subtle">
                {c}
              </span>
            ))}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto overscroll-contain">
          <Section step={1} title="กรองแถว">
            <FilterSteps trace={trace} spec={spec} />
          </Section>
          <Section step={2} title="คำนวณ">
            <Formula {...formula} />
          </Section>
          <Section
            step={3}
            title="แถวตัวอย่าง"
            aside={
              <span className="text-xs text-ink-muted tabular-nums">
                {Math.min(SAMPLE_SIZE, trace.rows.length)} จาก {formatNumber(trace.rows.length)} แถว
              </span>
            }
          >
            <SampleRows rows={trace.rows} highlight={kind.columns} />
          </Section>
          <Section step={4} title="ตรวจเองใน Excel / Google Sheets">
            <VerifyYourself kind={spec.kind} spec={formulaSpec} expected={kind.value(trace)} />
          </Section>
        </div>

        <footer className="border-t border-line px-5 py-3">
          <button
            type="button"
            onClick={download}
            disabled={!trace.rows.length}
            className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-chart text-[13px] font-medium text-white transition-[background-color,scale] hover:bg-chart/90 active:scale-[0.97] disabled:cursor-not-allowed disabled:bg-bar-muted"
          >
            <DownloadIcon />
            ดาวน์โหลด {formatNumber(trace.rows.length)} แถวนี้ (.csv)
          </button>
        </footer>
      </aside>
    </div>
  );
}
