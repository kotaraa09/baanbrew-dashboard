// เส้นทางของสมาชิก (แท็บลูกค้า แบบเล่าเรื่อง): สมาชิก 1 คน = 1 เส้น, 1 บิล = 1 ขีดบนเส้น
// ใช้ rows จาก prepareRows() คู่กับ customers.csv · ทุกตัวเลขในหน้านั้นมาจากฟังก์ชันนี้
import { addDays } from "./metrics.js";
import { ACTIVE_DAYS } from "./customerMetrics.js";

export const TOP_SHARE = 0.2;

const dayIndex = (date) => Date.parse(`${date}T00:00:00Z`) / 864e5;
const median = (xs) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const monthIndex = (date) => Number(date.slice(0, 4)) * 12 + Number(date.slice(5, 7)) - 1;

export function memberJourneys(rows, customers, branchInfo, lastDate) {
  const branchName = Object.fromEntries(branchInfo.map((b) => [b.branch_id, b.branch]));
  const profile = new Map(customers.map((c) => [c.customer_id, c]));

  // บิลของสมาชิกแต่ละคน (บิลหนึ่งมีหลายแถว นับครั้งเดียว)
  const byMember = new Map();
  for (const r of rows) {
    if (!r.customer_id) continue;
    let m = byMember.get(r.customer_id);
    if (!m) byMember.set(r.customer_id, (m = { bills: new Map(), revenue: 0 }));
    m.revenue += r.revenue;
    if (!m.bills.has(r.order_id)) m.bills.set(r.order_id, { date: r.date, datetime: r.datetime, branch: r.branch });
  }

  const activeFrom = addDays(lastDate, -ACTIVE_DAYS);
  const lines = [...byMember.entries()].map(([id, m]) => {
    const bills = [...m.bills.values()].sort((a, b) => a.datetime.localeCompare(b.datetime));
    const home = branchName[profile.get(id)?.home_branch_id] ?? null;
    return {
      id,
      home,
      joined: profile.get(id)?.joined_date ?? null,
      first: bills[0].date,
      firstAt: bills[0].datetime,
      last: bills.at(-1).date,
      days: bills.map((b) => dayIndex(b.date)),
      bills: bills.length,
      revenue: m.revenue,
      branches: new Set(bills.map((b) => b.branch)).size,
      atHome: home ? bills.filter((b) => b.branch === home).length : 0,
      active: bills.at(-1).date >= activeFrom,
    };
  });
  // เส้นบนสุด = คนที่เริ่มซื้อก่อน
  lines.sort((a, b) => a.firstAt.localeCompare(b.firstAt) || a.id.localeCompare(b.id));

  // ---- กลุ่มที่กดดูได้ ----
  const byRevenue = [...lines].sort((a, b) => b.revenue - a.revenue);
  const topCount = Math.floor(lines.length * TOP_SHARE);
  const topIds = new Set(byRevenue.slice(0, topCount).map((l) => l.id));
  const memberRevenue = lines.reduce((s, l) => s + l.revenue, 0);
  const topRevenue = byRevenue.slice(0, topCount).reduce((s, l) => s + l.revenue, 0);
  const withHome = lines.filter((l) => l.home);
  const groups = {
    top: { ids: topIds, count: topCount, revenueShare: memberRevenue ? topRevenue / memberRevenue : 0 },
    once: { count: lines.filter((l) => l.bills === 1).length },
    lapsed: {
      count: lines.filter((l) => !l.active).length,
      medianBills: median(lines.filter((l) => !l.active).map((l) => l.bills)),
    },
    oneBranch: {
      count: lines.filter((l) => l.branches === 1).length,
      homeBillShare: withHome.reduce((s, l) => s + l.atHome, 0) / (withHome.reduce((s, l) => s + l.bills, 0) || 1),
    },
  };
  const inGroup = {
    all: () => true,
    top: (l) => topIds.has(l.id),
    once: (l) => l.bills === 1,
    lapsed: (l) => !l.active,
    oneBranch: (l) => l.branches === 1,
  };

  // ---- จังหวะเวลา ----
  const joinToFirst = median(lines.filter((l) => l.joined).map((l) => dayIndex(l.first) - dayIndex(l.joined)));
  const toSecond = median(lines.filter((l) => l.bills > 1).map((l) => l.days[1] - l.days[0]));

  // ---- ตารางรุ่น: รุ่น = เดือนที่ซื้อครั้งแรก, ช่อง = เดือนที่ k หลังจากนั้น ยังมีบิลกี่ % ----
  const lastM = monthIndex(lastDate);
  const lastMonthDays = new Date(Date.UTC(Number(lastDate.slice(0, 4)), Number(lastDate.slice(5, 7)), 0)).getUTCDate();
  const lastPartial = Number(lastDate.slice(8, 10)) < lastMonthDays;
  const cohortMap = new Map();
  for (const l of lines) {
    const m0 = monthIndex(l.first);
    let c = cohortMap.get(m0);
    if (!c) cohortMap.set(m0, (c = { month: l.first.slice(0, 7), m0, size: 0, active: [] }));
    c.size += 1;
    const months = new Set();
    for (const d of l.days) months.add(monthIndex(new Date(d * 864e5).toISOString().slice(0, 10)) - m0);
    for (const k of months) c.active[k] = (c.active[k] ?? 0) + 1;
  }
  const cohorts = [...cohortMap.values()]
    .sort((a, b) => a.m0 - b.m0)
    .map((c) => ({
      month: c.month,
      size: c.size,
      cells: Array.from({ length: lastM - c.m0 }, (_, i) => {
        const k = i + 1;
        return { k, rate: (c.active[k] ?? 0) / c.size, partial: lastPartial && c.m0 + k === lastM };
      }),
    }));
  // ค่าเฉลี่ยของเดือนที่ k (ถ่วงด้วยขนาดรุ่น ไม่นับเดือนที่ข้อมูลยังไม่ครบ)
  const retention = (k) => {
    let hit = 0;
    let size = 0;
    for (const c of cohorts) {
      const cell = c.cells[k - 1];
      if (!cell || cell.partial) continue;
      hit += cell.rate * c.size;
      size += c.size;
    }
    return size ? hit / size : null;
  };

  return {
    lines,
    buyers: lines.length,
    members: customers.length,
    never: customers.length - lines.length,
    joinToFirst,
    toSecond,
    groups,
    inGroup,
    cohorts,
    retention,
    span: { from: Math.min(...lines.map((l) => l.days[0])), to: dayIndex(lastDate) },
  };
}
