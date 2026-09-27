// Logic ของแท็บลูกค้า: ใช้ rows จาก prepareRows() คู่กับ customers.csv (สมาชิก)
// customer_id ว่างใน sales = ลูกค้าทั่วไป (walk-in) · public/customers.csv ตัดชื่อเล่นและเบอร์โทรออกแล้ว (PDPA)
import { addDays } from "./metrics.js";

export const ACTIVE_DAYS = 90;

export const AGE_ORDER = ["ต่ำกว่า 18", "18-24", "25-34", "35-44", "45-54", "55+"];

const daysBetween = (a, b) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 864e5);

// สรุปการซื้อของสมาชิกแต่ละคน: จำนวนบิล, ยอดขาย, วันที่ซื้อล่าสุด
function purchasesByMember(rows) {
  const map = new Map();
  for (const r of rows) {
    if (!r.customer_id) continue;
    const cur = map.get(r.customer_id) ?? { orders: new Set(), revenue: 0, last: r.date };
    cur.orders.add(r.order_id);
    cur.revenue += r.revenue;
    if (r.date > cur.last) cur.last = r.date;
    map.set(r.customer_id, cur);
  }
  return map;
}

export function customerView(rows, customers, branchInfo, lastDate) {
  const buys = purchasesByMember(rows);
  // "ยังซื้ออยู่" = ซื้อล่าสุดไม่เกิน 90 วันก่อนวันล่าสุดของข้อมูล (นับแบบเดียวกับกลุ่ม "31–90 วัน" ด้านล่าง)
  const activeFrom = addDays(lastDate, -ACTIVE_DAYS);

  // ---- KPI ----
  let memberRevenue = 0;
  let totalRevenue = 0;
  const memberOrders = new Set();
  const walkinOrders = new Set();
  for (const r of rows) {
    totalRevenue += r.revenue;
    if (r.customer_id) {
      memberRevenue += r.revenue;
      memberOrders.add(r.order_id);
    } else walkinOrders.add(r.order_id);
  }
  const buyers = [...buys.values()];
  const kpis = {
    members: customers.length,
    active: buyers.filter((b) => b.last >= activeFrom).length,
    memberShare: totalRevenue ? memberRevenue / totalRevenue : 0,
    repeatRate: buyers.length ? buyers.filter((b) => b.orders.size >= 2).length / buyers.length : 0,
  };

  // ---- สมาชิกใหม่รายเดือน (เดือนสุดท้ายอาจยังไม่ครบ) ----
  const byMonth = new Map();
  for (const c of customers) {
    const m = c.joined_date.slice(0, 7);
    byMonth.set(m, (byMonth.get(m) ?? 0) + 1);
  }
  const lastMonth = lastDate.slice(0, 7);
  const [ly, lm] = lastMonth.split("-").map(Number);
  const lastMonthFull = new Date(Date.UTC(ly, lm, 0)).getUTCDate();
  const newMembers = [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({
      month,
      count,
      partial: month === lastMonth && Number(lastDate.slice(8, 10)) < lastMonthFull,
      days: month === lastMonth ? Number(lastDate.slice(8, 10)) : null,
      fullDays: month === lastMonth ? lastMonthFull : null,
    }));

  // ---- สมาชิกเทียบลูกค้าทั่วไป (ต่อบิล) ----
  const billTotals = new Map();
  for (const r of rows) billTotals.set(r.order_id, (billTotals.get(r.order_id) ?? 0) + r.revenue);
  const avgBill = (orders) => {
    let sum = 0;
    for (const o of orders) sum += billTotals.get(o);
    return orders.size ? sum / orders.size : 0;
  };
  const allOrders = memberOrders.size + walkinOrders.size;
  const billsPerBuyer = buyers.map((b) => b.orders.size).sort((a, b) => a - b);
  const comparison = {
    member: {
      revenueShare: kpis.memberShare,
      billShare: allOrders ? memberOrders.size / allOrders : 0,
      avgBill: avgBill(memberOrders),
    },
    walkin: {
      revenueShare: 1 - kpis.memberShare,
      billShare: allOrders ? walkinOrders.size / allOrders : 0,
      avgBill: avgBill(walkinOrders),
    },
    medianBills: billsPerBuyer.length ? billsPerBuyer[Math.floor(billsPerBuyer.length / 2)] : 0,
  };

  // ---- กลุ่มลูกค้า: จำนวนสมาชิก และยอดซื้อเฉลี่ยต่อคน ----
  const branchName = Object.fromEntries(branchInfo.map((b) => [b.branch_id, b.branch]));
  const group = (keyOf, order) => {
    const map = new Map();
    for (const c of customers) {
      const key = keyOf(c);
      const cur = map.get(key) ?? { key, members: 0, revenue: 0 };
      cur.members += 1;
      cur.revenue += buys.get(c.customer_id)?.revenue ?? 0;
      map.set(key, cur);
    }
    const list = [...map.values()].map((g) => ({
      ...g,
      share: g.members / customers.length,
      perMember: g.revenue / g.members,
    }));
    return order
      ? list.sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key))
      : list.sort((a, b) => b.members - a.members);
  };
  const segments = {
    age: group((c) => c.age_group, AGE_ORDER),
    gender: group((c) => c.gender),
    branch: group((c) => branchName[c.home_branch_id] ?? c.home_branch_id),
  };

  // ---- ความสดของสมาชิก: ซื้อล่าสุดเมื่อไร ----
  const BUCKETS = [
    { key: "30", label: "ภายใน 30 วัน", test: (d) => d <= 30, lapsed: false },
    { key: "90", label: "31–90 วัน", test: (d) => d <= 90, lapsed: false },
    { key: "180", label: "91–180 วัน", test: (d) => d <= 180, lapsed: true },
    { key: "old", label: "เกิน 180 วัน", test: () => true, lapsed: true },
  ];
  const recency = [...BUCKETS.map((b) => ({ ...b, count: 0 })), { key: "never", label: "ไม่เคยซื้อ", count: 0, lapsed: true }];
  for (const c of customers) {
    const b = buys.get(c.customer_id);
    if (!b) {
      recency[recency.length - 1].count += 1;
      continue;
    }
    const d = daysBetween(b.last, lastDate);
    recency[BUCKETS.findIndex((x) => x.test(d))].count += 1;
  }
  const never = recency[recency.length - 1].count;
  const lapsed = recency.filter((r) => r.lapsed && r.key !== "never").reduce((s, r) => s + r.count, 0);

  return { kpis, newMembers, comparison, segments, recency, never, lapsed };
}
