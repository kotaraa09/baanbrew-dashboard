import fs from "node:fs";
import Papa from "papaparse";
import { describe, expect, it } from "vitest";
import { prepareRows } from "./metrics.js";
import { memberJourneys } from "./journeys.js";

const row = (order_id, datetime, branch, revenue, customer_id) => ({
  order_id,
  datetime,
  date: datetime.slice(0, 10),
  branch,
  revenue,
  customer_id,
});
const branchInfo = [
  { branch_id: "B01", branch: "สยาม" },
  { branch_id: "B02", branch: "สีลม" },
];

describe("memberJourneys (fixtures)", () => {
  const customers = [
    { customer_id: "A", home_branch_id: "B01", joined_date: "2026-01-01" },
    { customer_id: "B", home_branch_id: "B02", joined_date: "2026-01-10" },
    { customer_id: "C", home_branch_id: "B01", joined_date: "2026-02-01" }, // ไม่เคยซื้อ
  ];
  const rows = [
    row("1", "2026-01-05T08:00:00+07:00", "สยาม", 50, "A"),
    row("1", "2026-01-05T08:00:00+07:00", "สยาม", 30, "A"), // บิลเดียวกัน
    row("2", "2026-01-15T09:00:00+07:00", "สีลม", 100, "A"),
    row("3", "2026-03-02T09:00:00+07:00", "สยาม", 60, "A"),
    row("4", "2026-01-12T10:00:00+07:00", "สีลม", 40, "B"),
    row("5", "2026-01-12T11:00:00+07:00", "สยาม", 999, null), // ลูกค้าทั่วไป
  ];
  const j = memberJourneys(rows, customers, branchInfo, "2026-04-30");

  it("one line per buyer, sorted by first purchase, bills counted once", () => {
    expect(j.lines.map((l) => l.id)).toEqual(["A", "B"]);
    expect(j.lines[0].bills).toBe(3);
    expect(j.lines[0].revenue).toBe(240);
    expect(j.never).toBe(1);
  });

  it("groups and timings", () => {
    expect(j.groups.once.count).toBe(1);
    expect(j.groups.oneBranch.count).toBe(1);
    // A: 2 ใน 3 บิลที่สยาม (สาขาประจำ), B: 1 ใน 1 ที่สีลม
    expect(j.groups.oneBranch.homeBillShare).toBeCloseTo(3 / 4);
    expect(j.toSecond).toBe(10);
    expect(j.joinToFirst).toBe(3); // A 4 วัน, B 2 วัน
    expect(j.groups.lapsed.count).toBe(1); // B ซื้อล่าสุด 12 ม.ค. เกิน 90 วันก่อน 30 เม.ย.
  });

  it("cohort cells: share of the cohort with a bill k months later", () => {
    const jan = j.cohorts.find((c) => c.month === "2026-01");
    expect(jan.size).toBe(2);
    expect(jan.cells.map((c) => c.rate)).toEqual([0, 0.5, 0]);
    expect(j.retention(2)).toBe(0.5);
  });
});

// ตัวเลขบนหน้าต้องตรงกับการคำนวณแบบตรง ๆ จากไฟล์จริง (เขียนแยกจากฟังก์ชันข้างบนโดยตั้งใจ)
describe("memberJourneys (truth check on public/*.csv)", () => {
  const read = (f) =>
    Papa.parse(fs.readFileSync(f, "utf8").replace(/^﻿/, ""), { header: true, skipEmptyLines: true }).data;
  const raw = read("public/sales.csv");
  const customers = read("public/customers.csv");
  const branches = read("public/branches.csv");
  const rows = prepareRows(raw);
  const last = rows.reduce((m, r) => (r.date > m ? r.date : m), "");
  const j = memberJourneys(rows, customers, branches, last);

  // คำนวณซ้ำแบบตรง ๆ
  const bills = new Map();
  for (const r of raw) {
    if (!r.customer_id) continue;
    const b = bills.get(r.order_id) ?? { cid: r.customer_id, rev: 0, branch: r.branch, date: r.datetime.slice(0, 10) };
    b.rev += Number(r.qty) * Number(r.unit_price);
    bills.set(r.order_id, b);
  }
  const per = new Map();
  for (const b of bills.values()) {
    const p = per.get(b.cid) ?? { n: 0, rev: 0, branches: new Set() };
    p.n += 1;
    p.rev += b.rev;
    p.branches.add(b.branch);
    per.set(b.cid, p);
  }

  it("buyers, never-bought and one-time counts", () => {
    expect(j.buyers).toBe(per.size);
    expect(j.never).toBe(customers.length - per.size);
    expect(j.groups.once.count).toBe([...per.values()].filter((p) => p.n === 1).length);
    expect(j.groups.oneBranch.count).toBe([...per.values()].filter((p) => p.branches.size === 1).length);
  });

  it("top 20% of members by revenue", () => {
    const revs = [...per.values()].map((p) => p.rev).sort((a, b) => b - a);
    const k = Math.floor(revs.length * 0.2);
    const share = revs.slice(0, k).reduce((s, v) => s + v, 0) / revs.reduce((s, v) => s + v, 0);
    expect(j.groups.top.revenueShare).toBeCloseTo(share, 10);
  });

  it("produces the findings the page text relies on", () => {
    expect(j.groups.top.revenueShare).toBeGreaterThan(0.45);
    expect(j.groups.oneBranch.homeBillShare).toBeGreaterThan(0.8);
    expect(j.toSecond).toBeGreaterThan(7);
    expect(j.toSecond).toBeLessThan(40);
    expect(j.retention(1)).toBeGreaterThan(j.retention(6));
  });
});
