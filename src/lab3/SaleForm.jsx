// Lab 3.2 · ฟอร์มบันทึกยอดขาย (Prompt 3.2C)
// ตรวจด้วย validateSaleForm, สร้างเอกสารด้วย buildSale (ทดสอบแล้วใน saleModel.test.js)
// บันทึกแล้วไม่ต้องอัปเดตหน้าจอเอง: onSnapshot ใน LiveTab จะเห็นเอกสารใหม่และขยับ Dashboard ให้
import { useId, useMemo, useState } from "react";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "./firebase.js";
import { BRANCHES, MAX_QTY, PAYMENTS, buildSale, validateSaleForm } from "./saleModel.js";
import { Card, CardHeader } from "../components/ui.jsx";
import { formatBaht } from "../lib/metrics.js";

const EMPTY = { branch: "", product_id: "", qty: "1", payment_method: PAYMENTS[0], customer_id: "" };

const inputClass = (invalid) =>
  `h-9 w-full rounded-lg border bg-surface px-2.5 text-sm text-ink transition-colors ${
    invalid ? "border-down" : "border-line-strong hover:border-ink-muted"
  }`;

function Field({ id, label, optional, error, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-[13px] font-medium text-ink-subtle">
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

  // จัดเมนูตามหมวด แสดงใน <optgroup>
  const groups = useMemo(() => {
    const m = new Map();
    for (const p of [...products].sort((a, b) => a.product_id.localeCompare(b.product_id))) {
      const c = p.category ?? "อื่น ๆ";
      if (!m.has(c)) m.set(c, []);
      m.get(c).push(p);
    }
    return [...m];
  }, [products]);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
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
          <select
            id={ids.branch}
            value={form.branch}
            onChange={set("branch")}
            aria-invalid={!!shownErrors.branch}
            aria-describedby={describedBy("branch", ids.branch)}
            className={inputClass(shownErrors.branch)}
          >
            <option value="" disabled>
              เลือกสาขา
            </option>
            {BRANCHES.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </Field>

        <Field id={ids.product} label="เมนู" error={shownErrors.product_id}>
          <select
            id={ids.product}
            value={form.product_id}
            onChange={set("product_id")}
            disabled={products.length === 0}
            aria-invalid={!!shownErrors.product_id}
            aria-describedby={describedBy("product_id", ids.product)}
            className={inputClass(shownErrors.product_id)}
          >
            <option value="" disabled>
              {products.length ? "เลือกเมนู" : "กำลังโหลดเมนู…"}
            </option>
            {groups.map(([category, items]) => (
              <optgroup key={category} label={category}>
                {items.map((p) => (
                  <option key={p.product_id} value={p.product_id}>
                    {p.product_name} · {formatBaht(p.price)}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field id={ids.qty} label="จำนวน" error={shownErrors.qty}>
            <input
              id={ids.qty}
              type="number"
              inputMode="numeric"
              min={1}
              max={MAX_QTY}
              step={1}
              value={form.qty}
              onChange={set("qty")}
              aria-invalid={!!shownErrors.qty}
              aria-describedby={describedBy("qty", ids.qty)}
              className={`${inputClass(shownErrors.qty)} tabular-nums`}
            />
          </Field>
          <Field id={ids.payment} label="ชำระเงิน" error={shownErrors.payment_method}>
            <select
              id={ids.payment}
              value={form.payment_method}
              onChange={set("payment_method")}
              aria-invalid={!!shownErrors.payment_method}
              aria-describedby={describedBy("payment_method", ids.payment)}
              className={inputClass(shownErrors.payment_method)}
            >
              {PAYMENTS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
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
          className="h-10 w-full rounded-lg bg-chart text-sm font-semibold text-on-chart transition-[opacity,scale] active:scale-[0.98] disabled:cursor-wait disabled:opacity-60"
        >
          {saving ? "กำลังบันทึก…" : "บันทึกยอดขาย"}
        </button>

        <p role="status" aria-live="polite" className="min-h-5 text-[13px]">
          {status.kind === "success" && <span className="text-up">✓ {status.text}</span>}
          {status.kind === "error" && <span className="font-medium text-down">✕ {status.text}</span>}
        </p>
      </form>
    </Card>
  );
}
