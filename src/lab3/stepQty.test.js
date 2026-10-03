import { describe, it, expect } from "vitest";
import { stepQty, MAX_QTY } from "./saleModel.js";

describe("stepQty (ปุ่ม − / + ในฟอร์มบันทึกยอดขาย)", () => {
  it("เพิ่มและลดทีละ 1", () => {
    expect(stepQty("1", 1)).toBe("2");
    expect(stepQty("5", 1)).toBe("6");
    expect(stepQty("5", -1)).toBe("4");
  });
  it("ไม่ต่ำกว่า 1 และไม่เกิน MAX_QTY", () => {
    expect(stepQty("1", -1)).toBe("1");
    expect(stepQty(String(MAX_QTY), 1)).toBe(String(MAX_QTY));
    expect(stepQty("99", -1)).toBe(String(MAX_QTY));
  });
  it("ค่าที่พิมพ์ผิดกด + แล้วได้ 1", () => {
    for (const v of ["", "abc", "1.5", "-3"]) expect(stepQty(v, 1)).toBe("1");
  });
  it("รับช่องว่างหน้า/หลังตัวเลข", () => {
    expect(stepQty(" 3 ", 1)).toBe("4");
  });
});
