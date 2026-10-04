// Logic คำนวณทั้งหมดของ Dashboard
// 1 แถว = 1 รายการสินค้า, บิลหนึ่ง (order_id เดียวกัน) มีได้หลายแถว
// วันที่ทุกตัวเป็นข้อความ "YYYY-MM-DD" ตามเวลาไทย เปรียบเทียบกันด้วย string ได้เลย

// ---------- เตรียมข้อมูล ----------

// แปลงแถวดิบจาก PapaParse: qty และ unit_price เป็น Number, คำนวณยอดขายต่อแถว
// และดึงวันที่จาก 10 ตัวอักษรแรกของ datetime (เวลาไทย) ไม่ผ่าน new Date() เพื่อไม่ให้เลื่อนเป็น UTC
export function prepareRows(rawRows) {
  return rawRows
    .filter((r) => r.order_id)
    .map((r) => {
      const qty = Number(r.qty);
      const unitPrice = Number(r.unit_price);
      return {
        ...r,
        qty,
        unit_price: unitPrice,
        revenue: qty * unitPrice,
        date: r.datetime.slice(0, 10),
        customer_id: r.customer_id?.trim() || null,
      };
    });
}

// ---------- วันที่ ----------

// บวก/ลบวันจาก "YYYY-MM-DD" (ใช้ UTC เป็นแค่ตัวนับวัน ไม่เกี่ยวกับ timezone ของข้อมูล)
export function addDays(date, n) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

function addMonth(firstOfMonth) {
  const [y, m] = firstOfMonth.split("-").map(Number);
  return new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 10);
}

function daysBetween(start, end) {
  const toMs = (s) => Date.UTC(...s.split("-").map((v, i) => Number(v) - (i === 1 ? 1 : 0)));
  return Math.round((toMs(end) - toMs(start)) / 864e5) + 1;
}

export const RANGE_OPTIONS = [
  { key: "7d", label: "7 วันล่าสุด", days: 7 },
  { key: "30d", label: "30 วันล่าสุด", days: 30 },
  { key: "90d", label: "90 วันล่าสุด", days: 90 },
  { key: "365d", label: "365 วันล่าสุด", days: 365 },
  { key: "all", label: "ทั้งหมด", days: null },
];

// ช่วงเวลาที่เลือก นับถอยหลังจากวันล่าสุดในข้อมูล (ไม่ใช่วันนี้)
// ช่วงก่อนหน้า = ช่วงยาวเท่ากันที่อยู่ติดกันด้านหน้า, "ทั้งหมด" ไม่มีช่วงก่อนหน้า
export function resolveRange(key, firstDate, lastDate) {
  const opt = RANGE_OPTIONS.find((o) => o.key === key);
  if (!opt?.days) return { start: firstDate, end: lastDate, days: daysBetween(firstDate, lastDate), previous: null };

  const start = addDays(lastDate, -(opt.days - 1));
  const prevEnd = addDays(start, -1);
  const prevStart = addDays(start, -opt.days);
  return {
    start,
    end: lastDate,
    days: opt.days,
    previous: prevStart >= firstDate ? { start: prevStart, end: prevEnd } : null,
  };
}

// ความละเอียดที่เหมาะกับความยาวช่วง: ไม่เกิน 90 วันดูรายวัน, ไม่เกิน 1 ปีดูรายสัปดาห์
export function defaultGranularity(days) {
  if (days <= 90) return "day";
  if (days <= 366) return "week";
  return "month";
}

// คีย์ของกลุ่มเวลา: รายวัน = วันนั้น, รายเดือน = วันที่ 1
// รายสัปดาห์ = ทีละ 7 วันนับจากวันแรกของช่วง เพื่อให้ช่วงนี้กับช่วงก่อนหน้ามีจำนวนกลุ่มเท่ากันและจับคู่กันได้ตรง
function bucketKey(date, granularity, start) {
  if (granularity === "week") return addDays(start, Math.floor((daysBetween(start, date) - 1) / 7) * 7);
  if (granularity === "month") return date.slice(0, 8) + "01";
  return date;
}

// ---------- กรองข้อมูล ----------

export function filterRows(rows, { start, end, branch }) {
  return rows.filter(
    (r) => r.date >= start && r.date <= end && (branch === "all" || r.branch === branch)
  );
}

// ---------- KPI ----------

// KPI 4 ตัว
// - totalRevenue: ผลรวม qty × unit_price ทุกแถว
// - orderCount: จำนวน order_id ที่ไม่ซ้ำ (ไม่ใช่จำนวนแถว)
// - avgOrderValue: ยอดขายรวม ÷ จำนวนบิล
// - memberCount: จำนวน customer_id ที่ไม่ซ้ำ โดยไม่นับค่าว่าง (ลูกค้าทั่วไป)
export function computeKpis(rows) {
  let totalRevenue = 0;
  const orders = new Set();
  const members = new Set();

  for (const r of rows) {
    totalRevenue += r.revenue;
    orders.add(r.order_id);
    if (r.customer_id) members.add(r.customer_id);
  }

  const orderCount = orders.size;
  return {
    totalRevenue,
    orderCount,
    avgOrderValue: orderCount ? totalRevenue / orderCount : 0,
    memberCount: members.size,
  };
}

// % เปลี่ยนแปลงเทียบช่วงก่อนหน้า, คืน null ถ้าไม่มีฐานให้เทียบ
export function percentChange(current, previous) {
  if (previous == null || previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

// ---------- อนุกรมเวลา ----------

// KPI ทั้ง 4 ตัวแยกตามกลุ่มเวลา ครอบคลุมทุกกลุ่มในช่วง (วันที่ไม่มียอดขายเป็น 0 ไม่หายจากกราฟ)
export function timeSeries(rows, start, end, granularity) {
  const buckets = new Map();
  for (let d = start; d <= end; d = addDays(d, 1)) {
    const key = bucketKey(d, granularity, start);
    if (!buckets.has(key)) buckets.set(key, { key, days: 0, rows: [] });
    buckets.get(key).days += 1;
  }
  for (const r of rows) buckets.get(bucketKey(r.date, granularity, start))?.rows.push(r);

  const fullDays = (key) =>
    granularity === "week" ? 7 : granularity === "month" ? daysBetween(key, addDays(addMonth(key), -1)) : 1;

  // partial = กลุ่มที่มีวันไม่ครบ (เช่นเดือนแรก/เดือนสุดท้ายของช่วง) ยอดจะดูต่ำกว่าปกติ
  return [...buckets.values()].map(({ key, days, rows: bucketRows }) => {
    const k = computeKpis(bucketRows);
    return {
      key,
      partial: days < fullDays(key),
      revenue: k.totalRevenue,
      orders: k.orderCount,
      aov: k.avgOrderValue,
      members: k.memberCount,
    };
  });
}

// ยอดขายรวมรายวัน เรียงตามวันที่ (เฉพาะวันที่มียอดขาย) ใช้ในกราฟ Lab 2.2
export function dailyRevenue(rows) {
  const map = new Map();
  for (const r of rows) map.set(r.date, (map.get(r.date) ?? 0) + r.revenue);
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, revenue]) => ({ date, revenue }));
}

// ค่าเฉลี่ยเคลื่อนที่ (moving average) รายวัน ช่วยให้เห็นแนวโน้มโดยไม่ยุ่งตามยอดที่แกว่งรายวัน
// - ค่าของแต่ละวัน = เฉลี่ยของวันนั้นกับ 6 วันก่อนหน้า (window = 7)
// - วันแรก ๆ ของช่วงดึงข้อมูลก่อนช่วงมาใช้ด้วย จะได้ไม่เพี้ยนที่ต้นกราฟ ดังนั้น rows ต้องเป็นข้อมูลทุกวัน (กรองสาขาแล้ว)
// - ไม่นับวันก่อน firstDate (ก่อนมีข้อมูล) เป็น 0 แต่เฉลี่ยจากวันที่มีจริงแทน
// - ยอดเฉลี่ยต่อบิล = ยอดขายรวม 7 วัน ÷ จำนวนบิลรวม 7 วัน (ไม่เอาค่าเฉลี่ยรายวันมาเฉลี่ยซ้ำ)
export function movingAverage(rows, start, end, firstDate, window = 7) {
  let from = addDays(start, -(window - 1));
  if (from < firstDate) from = firstDate;
  const daily = timeSeries(
    rows.filter((r) => r.date >= from && r.date <= end),
    from,
    end,
    "day"
  );
  const startIndex = daily.findIndex((d) => d.key === start);

  return daily.slice(startIndex).map((_, i) => {
    const at = startIndex + i;
    const win = daily.slice(Math.max(0, at - window + 1), at + 1);
    const sum = (k) => win.reduce((a, d) => a + d[k], 0);
    const orders = sum("orders");
    return {
      key: daily[at].key,
      days: win.length,
      revenue: sum("revenue") / win.length,
      orders: orders / win.length,
      aov: orders ? sum("revenue") / orders : 0,
      members: sum("members") / win.length,
    };
  });
}

// ---------- แยกตามมิติ ----------

// ยอดขายแยกสาขา: รวม revenue ตาม branch แล้วเรียงจากมากไปน้อย
// ถ้าส่ง previousRows มาด้วย จะคำนวณ % เปลี่ยนแปลงของแต่ละสาขาให้
export function revenueByBranch(rows, previousRows = null) {
  const sum = (list) => {
    const m = new Map();
    for (const r of list) m.set(r.branch, (m.get(r.branch) ?? 0) + r.revenue);
    return m;
  };
  const current = sum(rows);
  const previous = previousRows ? sum(previousRows) : null;
  const total = [...current.values()].reduce((a, b) => a + b, 0);

  return [...current]
    .map(([branch, revenue]) => ({
      branch,
      revenue,
      share: total ? (revenue / total) * 100 : 0,
      change: previous ? percentChange(revenue, previous.get(branch)) : null,
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

// เมนูขายดี: รวม qty และ revenue ตาม product_id, เติมชื่อและหมวดจาก products.csv
export function topProducts(rows, products, limit = 5) {
  const info = new Map(products.map((p) => [p.product_id, p]));
  const agg = new Map();
  for (const r of rows) {
    const a = agg.get(r.product_id) ?? { qty: 0, revenue: 0 };
    a.qty += r.qty;
    a.revenue += r.revenue;
    agg.set(r.product_id, a);
  }
  return [...agg]
    .map(([id, a]) => ({
      product_id: id,
      name: info.get(id)?.product_name ?? id,
      category: info.get(id)?.category ?? "",
      ...a,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

// ปฏิทินคั่ว: ยอดขายทุกวันในช่วง (วันที่ไม่มียอดเป็น 0) พร้อมวันในสัปดาห์ (0 = จันทร์ … 6 = อาทิตย์)
export function dailyCalendar(rows, start, end) {
  const map = new Map();
  for (const r of rows) if (r.date >= start && r.date <= end) map.set(r.date, (map.get(r.date) ?? 0) + r.revenue);
  const days = [];
  for (let d = start; d <= end; d = addDays(d, 1)) {
    const [y, m, dd] = d.split("-").map(Number);
    const weekday = (new Date(Date.UTC(y, m - 1, dd)).getUTCDay() + 6) % 7;
    days.push({ date: d, revenue: map.get(d) ?? 0, weekday });
  }
  return days;
}

// หมวดที่เสิร์ฟเป็นแก้ว (ไม่นับเบเกอรี่/อาหาร/อื่น ๆ) ใช้นับ "แก้ว" บนการ์ดถ้วยและนาฬิกากาแฟ
export const DRINK_CATEGORIES = new Set(["กาแฟ", "ชา", "นอนคอฟฟี่", "ปั่น", "โซดา"]);
export const drinkIds = (products) =>
  new Set(products.filter((p) => DRINK_CATEGORIES.has(p.category)).map((p) => p.product_id));

// จำนวนแก้ว = ผลรวม qty ของเมนูเครื่องดื่ม
export function cupsServed(rows, drinks) {
  let cups = 0;
  for (const r of rows) if (drinks.has(r.product_id)) cups += r.qty;
  return cups;
}

// นาฬิกากาแฟ: ยอดขายและจำนวนแก้วตามชั่วโมงของวัน (เวลาไทย อ่านจากตัวอักษรที่ 11–12 ของ datetime)
// คืนครบ 24 ชั่วโมงเสมอ ชั่วโมงที่ไม่มียอดเป็น 0
export function salesByHour(rows, drinks) {
  const hours = Array.from({ length: 24 }, (_, hour) => ({ hour, revenue: 0, cups: 0 }));
  for (const r of rows) {
    const h = Number(r.datetime.slice(11, 13));
    if (!(h >= 0 && h < 24)) continue;
    hours[h].revenue += r.revenue;
    if (drinks.has(r.product_id)) hours[h].cups += r.qty;
  }
  return hours;
}

// วิศวกรรมเมนู (menu engineering): ทุกเมนูวางบนแกน "ขายได้กี่ชิ้น" × "กำไรขั้นต้นต่อชิ้น"
// กำไรขั้นต้น = qty × (unit_price − cost) โดย cost มาจาก products.csv (ไม่ใช่กำไรสุทธิ ไม่รวมค่าเช่า ค่าแรง ฯลฯ)
// เส้นแบ่งสี่ช่อง = ค่ามัธยฐานของทั้งสองแกน (ครึ่งหนึ่งของเมนูอยู่แต่ละฝั่ง)
export function menuEngineering(rows, products) {
  const info = new Map(products.map((p) => [p.product_id, p]));
  const agg = new Map();
  for (const r of rows) {
    const p = info.get(r.product_id);
    if (!p) continue;
    const a = agg.get(r.product_id) ?? { product_id: r.product_id, name: p.product_name, category: p.category, qty: 0, revenue: 0, margin: 0 };
    a.qty += r.qty;
    a.revenue += r.revenue;
    a.margin += r.qty * (r.unit_price - Number(p.cost));
    agg.set(r.product_id, a);
  }
  const items = [...agg.values()].map((a) => ({ ...a, marginPerUnit: a.qty ? a.margin / a.qty : 0, marginPct: a.revenue ? a.margin / a.revenue : 0 }));
  const median = (xs) => {
    const v = [...xs].sort((x, y) => x - y);
    const m = Math.floor(v.length / 2);
    return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
  };
  const qtyMid = items.length ? median(items.map((i) => i.qty)) : 0;
  const marginMid = items.length ? median(items.map((i) => i.marginPerUnit)) : 0;
  for (const i of items) {
    const popular = i.qty >= qtyMid;
    const rich = i.marginPerUnit >= marginMid;
    i.quadrant = popular && rich ? "star" : popular ? "workhorse" : rich ? "puzzle" : "dog";
  }
  return { items, qtyMid, marginMid };
}

// ---------- ที่มาของตัวเลข (Trace) ----------

// กรองแถวทีละขั้นเหมือนตอนทำ Pivot Table พร้อมจำนวนแถวที่เหลือในแต่ละขั้น
// เรียก filterRows ตัวเดียวกับการ์ดบน Dashboard ตัวเลขจึงตรงกันเสมอ แม้กติกากรองจะเปลี่ยนในอนาคต
export function traceRows(rows, { start, end, branch = "all", productId = null }) {
  const steps = [{ key: "all", count: rows.length }];
  let current = filterRows(rows, { start, end, branch: "all" });
  steps.push({ key: "date", count: current.length });
  if (branch !== "all") {
    current = filterRows(current, { start, end, branch });
    steps.push({ key: "branch", count: current.length });
  }
  if (productId) {
    current = current.filter((r) => r.product_id === productId);
    steps.push({ key: "product", count: current.length });
  }

  let qty = 0;
  let withCustomer = 0;
  for (const r of current) {
    qty += r.qty;
    if (r.customer_id) withCustomer += 1;
  }
  return { rows: current, steps, kpis: computeKpis(current), qty, withCustomer };
}

// สูตรสำหรับวางในชีตที่เปิด sales.csv ตรง ๆ (คอลัมน์ตามไฟล์ต้นฉบับ)
// A order_id · B datetime · C branch · D product_id · E qty · F unit_price · G customer_id
// วันที่ใช้ LEFT(datetime, 10) เหมือนในโค้ด ไม่แปลงเวลา
export function sheetFormula(kind, { start, end, branch = "all", productId = null, lastRow }, flavor = "sheets") {
  const col = (c) => `${c}2:${c}${lastRow}`;
  const cond = [
    `(LEFT(${col("B")},10)>="${start}")`,
    `(LEFT(${col("B")},10)<="${end}")`,
    branch !== "all" && `(${col("C")}="${branch}")`,
    productId && `(${col("D")}="${productId}")`,
  ]
    .filter(Boolean)
    .join("*");

  const revenue = `SUMPRODUCT(${cond}*${col("E")}*${col("F")})`;
  const unique = (c, extra = "") =>
    flavor === "sheets"
      ? `COUNTUNIQUE(FILTER(${col(c)},${cond}${extra}))`
      : `ROWS(UNIQUE(FILTER(${col(c)},${cond}${extra})))`;

  if (kind === "orders") return `=${unique("A")}`;
  if (kind === "members") return `=${unique("G", `*(${col("G")}<>"")`)}`;
  if (kind === "aov") return `=${revenue}/${unique("A")}`;
  return `=${revenue}`; // revenue, ยอดขายสาขา, ยอดขายเมนู
}

// ---------- ย้อนดูการเติบโต (Replay) ----------

// เฟรมสำหรับเล่นย้อนหลังทีละสัปดาห์ (7 วันนับจากวันแรกของข้อมูล แบบเดียวกับกราฟรายสัปดาห์)
// แต่ละเฟรมมี
// - totals: ยอดขาย / จำนวนบิล / ลูกค้าสมาชิก สะสมตั้งแต่วันแรกถึงวันสุดท้ายของเฟรม
//   เฟรมสุดท้ายจึงเท่ากับ KPI ของช่วง "ทั้งหมด" พอดี (ใช้ตรวจกับ Pivot Table ได้)
// - dailyAvg: ยอดขายทุกสาขาเฉลี่ยต่อวันของสัปดาห์นั้น (หารด้วยจำนวนวันจริง สัปดาห์สุดท้ายที่ไม่ครบ 7 วันจะไม่ดูตก)
// - branches: ยอดขายเฉลี่ยต่อวันของแต่ละสาขาใน windowDays วันล่าสุด
//   นับเฉพาะวันที่สาขาเปิดแล้ว (opened_date จาก branches.csv), สาขาที่ยังไม่เปิดเป็น null
export function replayFrames(rows, branchInfo, firstDate, lastDate, windowDays = 28) {
  const days = [];
  for (let d = firstDate; d <= lastDate; d = addDays(d, 1)) days.push(d);
  const dayIndex = new Map(days.map((d, i) => [d, i]));

  const opened = new Map(branchInfo.map((b) => [b.branch, b.opened_date || firstDate]));
  const names = [...new Set([...branchInfo.map((b) => b.branch), ...rows.map((r) => r.branch)])];

  // ยอดขายรายวันของแต่ละสาขา และแถวของแต่ละวัน
  const daily = new Map(names.map((b) => [b, new Array(days.length).fill(0)]));
  const rowsByDay = days.map(() => []);
  for (const r of rows) {
    const i = dayIndex.get(r.date);
    if (i == null) continue;
    daily.get(r.branch)[i] += r.revenue;
    rowsByDay[i].push(r);
  }

  const orders = new Set();
  const members = new Set();
  let revenue = 0;
  let weekRevenue = 0;
  let weekDays = 0;
  const frames = [];

  days.forEach((date, i) => {
    for (const r of rowsByDay[i]) {
      revenue += r.revenue;
      weekRevenue += r.revenue;
      orders.add(r.order_id);
      if (r.customer_id) members.add(r.customer_id);
    }
    weekDays += 1;

    const weekEnd = weekDays === 7 || i === days.length - 1;
    if (!weekEnd) return;

    const branches = {};
    for (const b of names) {
      let sum = 0;
      let count = 0;
      for (let j = Math.max(0, i - windowDays + 1); j <= i; j++) {
        if (days[j] < (opened.get(b) ?? firstDate)) continue;
        sum += daily.get(b)[j];
        count += 1;
      }
      branches[b] = count ? sum / count : null;
    }

    frames.push({
      key: days[i - weekDays + 1],
      end: date,
      totals: { revenue, orders: orders.size, members: members.size },
      dailyAvg: weekRevenue / weekDays,
      branches,
    });
    weekRevenue = 0;
    weekDays = 0;
  });

  return frames;
}

// ---------- รูปแบบการแสดงผล ----------

const numberFmt = new Intl.NumberFormat("th-TH", { maximumFractionDigits: 0 });
const bahtFmt = new Intl.NumberFormat("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const formatNumber = (n) => numberFmt.format(n);
export const formatBaht = (n) => `฿${numberFmt.format(n)}`;
export const formatBahtExact = (n) => `฿${bahtFmt.format(n)}`;
export const formatBahtShort = (n) =>
  n >= 1_000_000 ? `฿${+(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `฿${+(n / 1_000).toFixed(1)}k` : `฿${Math.round(n)}`;
export const formatPercent = (n) => `${Math.abs(n).toFixed(1)}%`;

// วันที่แบบไทยย่อ เช่น "1 เม.ย. 68" (ปี พ.ศ.)
const toUtcDate = (s) => new Date(`${s}T00:00:00Z`);
const dateFmt = {
  day: new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", timeZone: "UTC" }),
  dayYear: new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", year: "2-digit", timeZone: "UTC" }),
  month: new Intl.DateTimeFormat("th-TH", { month: "short", year: "2-digit", timeZone: "UTC" }),
};

export const formatDate = (s, withYear = true) => (withYear ? dateFmt.dayYear : dateFmt.day).format(toUtcDate(s));
export const formatMonth = (s) => dateFmt.month.format(toUtcDate(s));
export const formatRange = (start, end) => `${formatDate(start)} – ${formatDate(end)}`;

// ป้ายของกลุ่มเวลาแต่ละแบบ ใช้บนแกน X และ tooltip
export function formatBucket(key, granularity, short = false) {
  if (granularity === "month") return formatMonth(key);
  if (granularity === "week") return short ? formatDate(key, false) : `7 วันนับจาก ${formatDate(key)}`;
  return formatDate(key, !short);
}
