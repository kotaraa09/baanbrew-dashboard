import { describe, expect, it } from "vitest";
import fs from "node:fs";
import Papa from "papaparse";
import { prepareRows } from "./metrics.js";
import {
  branchOrder,
  buildBills,
  holidayComparison,
  holidayMatches,
  hourProfiles,
  monthOfYearRatio,
  monthlyBillsPerDay,
  newBranchNewcomers,
  weekProfiles,
} from "./story.js";

const row = (order_id, datetime, branch, revenue, customer_id = null) => ({
  order_id,
  datetime,
  date: datetime.slice(0, 10),
  branch,
  revenue,
  customer_id,
});

describe("story metrics (fixtures)", () => {
  // 2026-09-14 = จันทร์, 2026-09-19 = เสาร์
  const rows = [
    row("A", "2026-09-14T08:10:00+07:00", "สีลม", 60),
    row("A", "2026-09-14T08:10:00+07:00", "สีลม", 40), // บิลเดียวกัน 2 แถว
    row("B", "2026-09-14T16:00:00+07:00", "สยาม", 80, "C1"),
    row("C", "2026-09-19T16:30:00+07:00", "สยาม", 120, "C1"),
    row("D", "2026-09-19T09:00:00+07:00", "สีลม", 30),
  ];
  const bills = buildBills(rows);

  it("groups rows into bills in time order", () => {
    expect(bills.map((b) => b.id)).toEqual(["A", "B", "D", "C"]);
    expect(bills[0]).toMatchObject({ revenue: 100, hour: 8, weekday: 0 });
  });

  it("ranks branches by bill count", () => {
    expect(branchOrder(bills)).toEqual([
      { branch: "สีลม", count: 2 },
      { branch: "สยาม", count: 2 },
    ]);
  });

  it("computes hour shares and peaks", () => {
    const [silom] = hourProfiles(bills, ["สีลม"]);
    expect(silom.beforeTen).toBe(1);
    expect(silom.peakHour).toBe(8);
  });

  it("pairs each holiday with the same weekday a week later", () => {
    const pairs = holidayMatches(bills, new Set(["2026-09-14"]));
    expect(pairs).toEqual([]); // ไม่มีบิลในวันคู่ (21 ก.ย.) และวันก่อนหน้าอยู่นอกข้อมูล
    const more = buildBills([...rows, row("E", "2026-09-21T08:00:00+07:00", "สีลม", 50)]);
    expect(holidayMatches(more, new Set(["2026-09-14"]))).toEqual([{ holiday: "2026-09-14", match: "2026-09-21" }]);
    const [silom] = holidayComparison(more, ["สีลม"], [{ holiday: "2026-09-14", match: "2026-09-21" }]);
    expect(silom).toMatchObject({ holidayBills: 1, matchBills: 1, ratio: 1 });
  });

  it("splits weekday / weekend / holiday averages", () => {
    const [siam] = weekProfiles(bills, ["สยาม"], new Set());
    expect(siam.weekdayAvg).toBe(80);
    expect(siam.weekendAvg).toBe(120);
    expect(siam.weekendRatio).toBe(1.5);
    const [silomHol] = weekProfiles(bills, ["สีลม"], new Set(["2026-09-19"]));
    expect(silomHol.holidayRatio).toBeCloseTo(0.3);
    expect(silomHol.weekendAvg).toBe(0);
  });
});

// ตัวเลขในเรื่องเล่าต้องตรงกับการคำนวณแบบตรง ๆ จากไฟล์จริง (เขียนแยกจากฟังก์ชันข้างบนโดยตั้งใจ)
describe("story metrics (truth check on public/*.csv)", () => {
  const read = (f) =>
    Papa.parse(fs.readFileSync(f, "utf8").replace(/^\uFEFF/, ""), { header: true, skipEmptyLines: true }).data;
  const raw = read("public/sales.csv");
  const holidays = new Set(read("public/thai_holidays.csv").map((h) => h.date));
  const bills = buildBills(prepareRows(raw));
  const branches = branchOrder(bills).map((b) => b.branch);

  it("bill count = distinct order_id", () => {
    expect(bills.length).toBe(new Set(raw.map((r) => r.order_id)).size);
  });

  it("Silom's share of bills before 10:00", () => {
    const silomFirst = new Map();
    for (const r of raw) if (r.branch === "สีลม") silomFirst.set(r.order_id, Number(r.datetime.slice(11, 13)));
    const early = [...silomFirst.values()].filter((h) => h < 10).length / silomFirst.size;
    expect(hourProfiles(bills, ["สีลม"])[0].beforeTen).toBeCloseTo(early, 10);
  });

  it("weekend ratio matches a plain AVERAGEIFS-style computation", () => {
    const day = new Map();
    for (const r of raw) {
      if (r.branch !== "สยาม") continue;
      const d = r.datetime.slice(0, 10);
      day.set(d, (day.get(d) ?? 0) + Number(r.qty) * Number(r.unit_price));
    }
    const wd = (d) => new Date(`${d}T00:00:00Z`).getUTCDay();
    const avg = (f) => {
      const xs = [...day].filter(([d]) => !holidays.has(d) && f(wd(d))).map(([, v]) => v);
      return xs.reduce((a, v) => a + v, 0) / xs.length;
    };
    const expected = avg((w) => w === 0 || w === 6) / avg((w) => w >= 1 && w <= 5);
    expect(weekProfiles(bills, ["สยาม"], holidays)[0].weekendRatio).toBeCloseTo(expected, 10);
  });

  it("produces the findings the story text relies on", () => {
    const hours = Object.fromEntries(hourProfiles(bills, branches).map((p) => [p.branch, p]));
    const week = Object.fromEntries(weekProfiles(bills, branches, holidays).map((p) => [p.branch, p]));
    const monthly = Object.fromEntries(monthlyBillsPerDay(bills, branches).map((m) => [m.branch, m]));
    expect(hours["สีลม"].peakHour).toBe(8);
    expect(hours["สยาม"].peakHour).toBe(16);
    expect(week["สีลม"].weekendRatio).toBeLessThan(0.5);
    expect(week["สยาม"].weekendRatio).toBeGreaterThan(1.3);
    expect(monthOfYearRatio(monthly["มหาวิทยาลัย"], "05").ratio).toBeLessThan(0.6);
    expect(newBranchNewcomers(bills, "อารีย์").share).toBeGreaterThan(0.7);
    const hol = Object.fromEntries(holidayComparison(bills, branches, holidayMatches(bills, holidays)).map((h) => [h.branch, h]));
    expect(hol["สยาม"].ratio).toBeGreaterThan(1.2);
    expect(hol["สีลม"].ratio).toBeLessThan(0.5);
  });
});
