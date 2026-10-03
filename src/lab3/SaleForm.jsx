// Lab 3.2 · ฟอร์มบันทึกยอดขาย (Prompt 3.2C)
// ตรวจด้วย validateSaleForm, สร้างเอกสารด้วย buildSale (ทดสอบแล้วใน saleModel.test.js)
// บันทึกแล้วไม่ต้องอัปเดตหน้าจอเอง: onSnapshot ใน LiveTab จะเห็นเอกสารใหม่และขยับ Dashboard ให้
import { useId, useMemo, useState } from "react";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "./firebase.js";
import { BRANCHES, MAX_QTY, PAYMENTS, buildSale, stepQty, validateSaleForm } from "./saleModel.js";
import { AlertIcon, Card, CardHeader, CheckIcon, MinusIcon, PlusIcon, Select } from "../components/ui.jsx";
import { formatBaht } from "../lib/metrics.js";

const EMPTY = { branch: "", product_id: "", qty: "1", payment_method: PAYMENTS[0], customer_id: "" };

// ช่องพิมพ์หน้าตาเดียวกับ Select (สูง 32px, ขอบ line-strong, เงาขอบล่าง 1px)
const inputClass = (invalid) =>
  `h-8 w-full rounded-lg border bg-surface px-2.5 text-[13px] font-medium text-ink shadow-[0_1px_0_0_rgb(0_0_0/0.05)] transition-colors placeholder:font-normal placeholder:text-ink-muted hover:bg-surface-hover ${
    invalid ? "border-down" : "border-line-strong"
  }`;

function Field({ id, label, optional, error, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs font-medium text-ink-subtle">
        {label}
        {optional && <span className="font-normal text-ink-muted"> (ไม่บังคับ)</span>}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs text-down">
          {error}
        </p>
      )}
    </div>
  );
}

// ช่องจำนวนแบบ − [ 2 ] + แทน <input type="number"> ที่ลูกศรเล็กของเบราว์เซอร์ไม่เข้าธีม (โดยเฉพาะโหมดมืด)
// พิมพ์เองได้ (ตรวจด้วย validateSaleForm เหมือนเดิม) · ปุ่ม/ลูกศรขึ้นลงจะเลื่อนในช่วง 1–MAX_QTY เสมอ
function QtyStepper({ id, value, onChange, invalid, describedBy }) {
  const n = Number(value);
  const valid = /^\d+$/.test(String(value).trim());
  const step = (d) => onChange(stepQty(value, d));
  const onKeyDown = (e) => {
    const keys = { ArrowUp: 1, ArrowDown: -1 };
    if (e.key in keys) {
      e.preventDefault();
      step(keys[e.key]);
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      onChange(String(e.key === "Home" ? 1 : MAX_QTY));
    }
  };
  const btn =
    "flex w-8 shrink-0 items-center justify-center text-ink-subtle transition-[background-color,color,scale] hover:bg-surface-hover hover:text-ink active:scale-90 disabled:pointer-events-none disabled:opacity-35";

  return (
    <div
      className={`flex h-8 overflow-hidden rounded-lg border bg-surface shadow-[0_1px_0_0_rgb(0_0_0/0.05)] transition-colors focus-within:border-chart ${
        invalid ? "border-down" : "border-line-strong"
      }`}
    >
      {/* tabIndex -1: ใช้ลูกศรขึ้นลงในช่องแทนได้ ไม่ต้องกด Tab ผ่านปุ่มสองตัว */}
      <button type="button" tabIndex={-1} aria-label="ลดจำนวน" onClick={() => step(-1)} disabled={valid && n <= 1} className={btn}>
        <MinusIcon className="size-3.5" />
      </button>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        role="spinbutton"
        aria-valuemin={1}
        aria-valuemax={MAX_QTY}
        aria-valuenow={valid ? n : undefined}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        onFocus={(e) => e.target.select()}
        className="min-w-0 flex-1 border-x border-line bg-transparent text-center text-[13px] font-medium text-ink tabular-nums outline-none"
      />
      <button type="button" tabIndex={-1} aria-label="เพิ่มจำนวน" onClick={() => step(1)} disabled={valid && n >= MAX_QTY} className={btn}>
        <PlusIcon className="size-3.5" />
      </button>
    </div>
  );
}

export default function SaleForm({ products, uid = "anonymous" }) {
  const [form, setForm] = useState(EMPTY);
  // แสดง error หลังกดบันทึกครั้งแรก จากนั้นตรวจใหม่ทุกครั้งที่แก้ (ไม่ขึ้นแดงตั้งแต่ยังไม่ได้พิมพ์)
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState({ kind: "idle" });
  const ids = { branch: useId(), product: useId(), qty: useId(), payment: useId(), customer: useId() };

  const errors = useMemo(() => validateSaleForm(form, products), [form, products]);
  const shownErrors = submitted ? errors : {};
  const product = products.find((p) => p.product_id === form.product_id);
  const total = product && !errors.qty ? Number(form.qty) * Number(product.price) : null;

  // เมนูเรียงตามรหัส (กาแฟ → ชา → อื่น ๆ ตามที่ร้านจัดไว้) แสดงราคาต่อท้าย
  const menuOptions = useMemo(
    () => [
      { value: "", label: products.length ? "เลือกเมนู" : "กำลังโหลดเมนู…" },
      ...[...products]
        .sort((a, b) => a.product_id.localeCompare(b.product_id))
        .map((p) => ({ value: p.product_id, label: `${p.product_name} · ${formatBaht(p.price)}` })),
    ],
    [products]
  );

  // Select ส่งค่ามาตรง ๆ ส่วน <input> ส่ง event
  const set = (key) => (e) => {
    const value = e?.target ? e.target.value : e;
    setForm((f) => ({ ...f, [key]: value }));
    if (status.kind !== "saving") setStatus({ kind: "idle" });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length) return;

    const sale = buildSale(form, product, { uid });
    setStatus({ kind: "saving" });
    try {
      // created_at ให้เซิร์ฟเวอร์ใส่เวลาเอง (Security Rules ใน Lab 3.3 จะบังคับว่าต้องเป็น request.time)
      await setDoc(doc(db, "sales", sale.id), { ...sale.data, created_at: serverTimestamp() });
      setStatus({ kind: "success", text: `บันทึกบิล ${sale.data.order_id} · ${formatBaht(sale.data.revenue)} แล้ว` });
      // เก็บสาขาและวิธีชำระเงินไว้ (แคชเชียร์มักบันทึกสาขาเดิมต่อกัน) ล้างส่วนที่เปลี่ยนทุกบิล
      setForm((f) => ({ ...EMPTY, branch: f.branch, payment_method: f.payment_method }));
      setSubmitted(false);
    } catch (err) {
      console.error("บันทึกไม่สำเร็จ", err, sale.data);
      setStatus({
        kind: "error",
        text: err.code === "permission-denied" ? "ถูกปฏิเสธโดย Security Rules" : `บันทึกไม่สำเร็จ: ${err.message}`,
      });
    }
  };

  const saving = status.kind === "saving";
  const describedBy = (key, id) => (shownErrors[key] ? `${id}-error` : undefined);

  return (
    <Card>
      <CardHeader title="บันทึกยอดขาย" subtitle="1 ครั้ง = 1 เมนูในบิล · ราคาดึงจากเมนูอัตโนมัติ" />
      <form onSubmit={onSubmit} noValidate className="space-y-3 px-4 pt-3 pb-4 sm:px-5">
        <Field id={ids.branch} label="สาขา" error={shownErrors.branch}>
          <Select
            id={ids.branch}
            block
            label="สาขา"
            value={form.branch}
            onChange={set("branch")}
            invalid={!!shownErrors.branch}
            describedBy={describedBy("branch", ids.branch)}
            options={[{ value: "", label: "เลือกสาขา" }, ...BRANCHES.map((b) => ({ value: b, label: b }))]}
          />
        </Field>

        <Field id={ids.product} label="เมนู" error={shownErrors.product_id}>
          <Select
            id={ids.product}
            block
            label="เมนู"
            value={form.product_id}
            onChange={set("product_id")}
            invalid={!!shownErrors.product_id}
            describedBy={describedBy("product_id", ids.product)}
            options={menuOptions}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field id={ids.qty} label="จำนวน" error={shownErrors.qty}>
            <QtyStepper
              id={ids.qty}
              value={form.qty}
              onChange={set("qty")}
              invalid={!!shownErrors.qty}
              describedBy={describedBy("qty", ids.qty)}
            />
          </Field>
          <Field id={ids.payment} label="ชำระเงิน" error={shownErrors.payment_method}>
            <Select
              id={ids.payment}
              block
              label="ชำระเงิน"
              value={form.payment_method}
              onChange={set("payment_method")}
              invalid={!!shownErrors.payment_method}
              describedBy={describedBy("payment_method", ids.payment)}
              options={PAYMENTS.map((p) => ({ value: p, label: p }))}
            />
          </Field>
        </div>

        <Field id={ids.customer} label="รหัสสมาชิก" optional error={shownErrors.customer_id}>
          <input
            id={ids.customer}
            type="text"
            placeholder="เช่น C01234"
            autoComplete="off"
            value={form.customer_id}
            onChange={set("customer_id")}
            aria-invalid={!!shownErrors.customer_id}
            aria-describedby={describedBy("customer_id", ids.customer)}
            className={`${inputClass(shownErrors.customer_id)} uppercase placeholder:normal-case placeholder:text-ink-muted`}
          />
        </Field>

        <div className="flex items-baseline justify-between border-t border-line pt-3">
          <span className="text-[13px] text-ink-subtle">ยอดรวม</span>
          <span className="text-xl font-semibold tracking-tight text-ink tabular-nums">
            {total == null ? "–" : formatBaht(total)}
          </span>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="h-9 w-full rounded-lg bg-chart text-[13px] font-semibold text-on-chart transition-[opacity,scale] active:scale-[0.98] disabled:cursor-wait disabled:opacity-60"
        >
          {saving ? "กำลังบันทึก…" : "บันทึกยอดขาย"}
        </button>

        <p role="status" aria-live="polite" className="min-h-5 text-[13px]">
          {status.kind === "success" && (
            <span className="inline-flex animate-fade-in items-start gap-1.5 text-ink">
              <CheckIcon className="mt-px size-4 shrink-0 text-chart" />
              {status.text}
            </span>
          )}
          {status.kind === "error" && (
            <span className="inline-flex animate-fade-in items-start gap-1.5 font-medium text-down">
              <AlertIcon className="mt-px size-4 shrink-0" />
              {status.text}
            </span>
          )}
        </p>
      </form>
    </Card>
  );
}
