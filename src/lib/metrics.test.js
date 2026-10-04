import { describe, expect, it } from "vitest";
import { cupsServed, dailyCalendar, drinkIds, menuEngineering, salesByHour } from "./metrics.js";

const products = [
  { product_id: "P1", category: "กาแฟ" },
  { product_id: "P2", category: "เบเกอรี่" },
];
const rows = [
  { product_id: "P1", qty: 2, revenue: 120, datetime: "2026-01-01T08:15:00+07:00" },
  { product_id: "P2", qty: 1, revenue: 45, datetime: "2026-01-01T08:40:00+07:00" },
  { product_id: "P1", qty: 1, revenue: 60, datetime: "2026-01-02T13:05:00+07:00" },
];

describe("coffee clock metrics", () => {
  it("counts only drinks as cups", () => {
    expect(cupsServed(rows, drinkIds(products))).toBe(3);
  });

  it("buckets by Thai-local hour and keeps all 24 hours", () => {
    const hours = salesByHour(rows, drinkIds(products));
    expect(hours).toHaveLength(24);
    expect(hours[8]).toEqual({ hour: 8, revenue: 165, cups: 2 });
    expect(hours[13]).toEqual({ hour: 13, revenue: 60, cups: 1 });
    expect(hours[0].revenue).toBe(0);
  });
});

describe("roast calendar", () => {
  it("fills every day in range, Monday = 0", () => {
    const days = dailyCalendar(
      [
        { date: "2026-09-14", revenue: 100 },
        { date: "2026-09-14", revenue: 50 },
        { date: "2026-09-20", revenue: 70 },
        { date: "2026-09-21", revenue: 999 }, // นอกช่วง
      ],
      "2026-09-14",
      "2026-09-20"
    );
    expect(days).toHaveLength(7);
    expect(days[0]).toEqual({ date: "2026-09-14", revenue: 150, weekday: 0 });
    expect(days[3].revenue).toBe(0);
    expect(days[6]).toEqual({ date: "2026-09-20", revenue: 70, weekday: 6 });
  });
});

describe("menu engineering", () => {
  it("computes gross margin per unit and median quadrants", () => {
    const products = [
      { product_id: "A", product_name: "A", category: "กาแฟ", cost: "10" },
      { product_id: "B", product_name: "B", category: "กาแฟ", cost: "30" },
      { product_id: "C", product_name: "C", category: "อาหาร", cost: "20" },
    ];
    const r = (product_id, qty, unit_price) => ({ product_id, qty, unit_price, revenue: qty * unit_price });
    const { items, qtyMid, marginMid } = menuEngineering([r("A", 10, 50), r("B", 2, 50), r("C", 5, 100)], products);
    const by = Object.fromEntries(items.map((i) => [i.product_id, i]));
    expect(by.A).toMatchObject({ qty: 10, margin: 400, marginPerUnit: 40 });
    expect(by.C.marginPerUnit).toBe(80);
    expect(qtyMid).toBe(5);
    expect(marginMid).toBe(40);
    expect(by.A.quadrant).toBe("star"); // ขายดี และกำไรต่อชิ้น ≥ มัธยฐาน
    expect(by.C.quadrant).toBe("star");
    expect(by.B.quadrant).toBe("dog");
  });
});
