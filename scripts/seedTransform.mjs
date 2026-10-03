// Lab 3.1 · แปลงแถวจาก sales.csv (ผลลัพธ์ Lab 2.1) เป็นเอกสาร Firestore
// ใช้ AI เขียนฟังก์ชันในไฟล์นี้ (Prompt 3.1 ใน PROMPTS_LAB3.md) จนกว่า npm test จะผ่านทุกข้อ
// scripts/seed.mjs เรียกใช้ฟังก์ชันเหล่านี้ ไม่ต้องแก้ seed.mjs
import { addDays, daysBetween } from "../src/lab3/time.js";

// ตรวจรูปแบบอย่างเดียว ปี พ.ศ. (25xx) และรูปแบบ 20/09/2026 จะไม่ผ่าน
const DATETIME = /^20\d\d-\d\d-\d\dT\d\d:\d\d:\d\d\+07:00$/;

export const BRANCHES = ["สยาม", "สีลม", "อารีย์", "บางนา", "มหาวิทยาลัย"];

/**
 * เลือกเฉพาะ N วันล่าสุดของข้อมูล นับจากวันล่าสุดในไฟล์ (ไม่ใช่วันนี้) รวมวันสุดท้ายด้วย
 * @returns {{ rows: object[], start: string, end: string }}  start/end เป็น YYYY-MM-DD
 */
export function selectLastDays(rows, days) {
  // วันที่อยู่ใน 10 ตัวแรกของ datetime อยู่แล้ว (เวลาไทย) เทียบเป็นสตริงได้เลยเพราะเป็น YYYY-MM-DD
  let end = "";
  for (const r of rows) {
    const d = r.datetime.slice(0, 10);
    if (d > end) end = d;
  }
  const start = addDays(end, -(days - 1));
  return { rows: rows.filter((r) => r.datetime.slice(0, 10) >= start), start, end };
}

/** จำนวนวันที่ต้องเลื่อน ให้วันล่าสุดของข้อมูลกลายเป็น "เมื่อวาน" ของ today · ห้ามติดลบ */
export function computeShift(lastDataDate, today) {
  return Math.max(0, daysBetween(lastDataDate, addDays(today, -1)));
}

/** เลื่อนวันที่ใน datetime ("2026-09-20T16:05:09+07:00") ไป days วัน โดยคงเวลาและ +07:00 */
export function shiftDateTime(iso, days) {
  // เลื่อนเฉพาะส่วนวันที่ ส่วนเวลากับ +07:00 ต่อท้ายเดิม จึงไม่ผ่าน Date และไม่กลายเป็น UTC
  return addDays(iso.slice(0, 10), days) + iso.slice(10);
}

/**
 * แปลง 1 แถว CSV (ทุกค่าเป็นข้อความ) เป็น { id, data }
 * id = order_id + "-" + product_id
 * data มีฟิลด์: order_id, datetime, date, hour, branch, product_id, qty, unit_price, revenue,
 *               customer_id (ว่าง = null), payment_method, channel, source = "import"
 * ต้อง throw Error ถ้าข้อมูลยังไม่สะอาด: qty ไม่ใช่จำนวนเต็มบวก, ราคาไม่ใช่ตัวเลขบวก,
 * สาขาไม่อยู่ใน BRANCHES, datetime ไม่ใช่ 20YY-MM-DDTHH:MM:SS+07:00
 */
export function toSaleDoc(row, shiftDays = 0) {
  const where = `${row.order_id}-${row.product_id}`;
  if (!DATETIME.test(row.datetime ?? "")) throw new Error(`${where}: datetime "${row.datetime}" ไม่ใช่ 20YY-MM-DDTHH:MM:SS+07:00`);
  if (!/^\d+$/.test(row.qty ?? "") || Number(row.qty) < 1) throw new Error(`${where}: qty "${row.qty}" ไม่ใช่จำนวนเต็มบวก`);
  if (!/^\d+(\.\d+)?$/.test(row.unit_price ?? "") || Number(row.unit_price) <= 0) throw new Error(`${where}: unit_price "${row.unit_price}" ไม่ใช่ตัวเลขบวก`);
  if (!BRANCHES.includes(row.branch)) throw new Error(`${where}: ไม่รู้จักสาขา "${row.branch}"`);

  const datetime = shiftDays ? shiftDateTime(row.datetime, shiftDays) : row.datetime;
  const qty = Number(row.qty);
  const unit_price = Number(row.unit_price);
  return {
    // id คงที่จากข้อมูล: รัน seed ซ้ำจะเขียนทับเอกสารเดิม ไม่เกิดยอดขายซ้ำ
    id: where,
    data: {
      order_id: row.order_id,
      datetime,
      date: datetime.slice(0, 10),
      hour: Number(datetime.slice(11, 13)),
      branch: row.branch,
      product_id: row.product_id,
      qty,
      unit_price,
      revenue: Math.round(qty * unit_price * 100) / 100,
      // null = "ไม่มีสมาชิก" ชัดเจน query where("customer_id", "==", null) ได้ และ Security Rules ตรวจได้ตรง ๆ
      customer_id: row.customer_id?.trim() ? row.customer_id.trim() : null,
      payment_method: row.payment_method,
      channel: row.channel,
      source: "import",
    },
  };
}

/** สรุป: { docs, bills (นับ order_id ไม่ซ้ำ), revenue, byBranch: {สาขา: ยอด}, start, end } */
export function summarize(docs) {
  const bills = new Set();
  const byBranch = {};
  let revenue = 0, start = null, end = null;
  for (const { data } of docs) {
    bills.add(data.order_id);
    revenue += data.revenue;
    byBranch[data.branch] = (byBranch[data.branch] ?? 0) + data.revenue;
    if (start === null || data.date < start) start = data.date;
    if (end === null || data.date > end) end = data.date;
  }
  return { docs: docs.length, bills: bills.size, revenue, byBranch, start, end };
}
