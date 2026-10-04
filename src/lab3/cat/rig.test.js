import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import * as A from "./art.js";
import { LEAVE_MS, spring, step } from "./rig.js";

const IMG = path.join(import.meta.dirname, "img");
// ขนาดภาพ WebP ที่มี alpha (VP8X): กว้าง-1 อยู่ไบต์ 24–26, สูง-1 อยู่ไบต์ 27–29
function webpSize(file) {
  const b = fs.readFileSync(file);
  expect(b.toString("ascii", 12, 16)).toBe("VP8X");
  return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)];
}

describe("ชิ้นภาพของแมว (cat/img)", () => {
  it("ทุกชิ้นมีภาพครบทั้งสองธีม และขนาดตรงกับ rig.json", () => {
    for (const [name, p] of Object.entries(A.PARTS)) {
      for (const theme of ["light", "dark"]) {
        expect(webpSize(path.join(IMG, `${theme}-${name}.webp`))).toEqual([p.w, p.h]);
      }
    }
  });

  it("หาง: จำนวนข้อต่อ = จำนวนท่อน − 1 และมีภาพทุกท่อน", () => {
    expect(A.TAIL_JOINTS).toHaveLength(A.TAIL_SEGMENTS - 1);
    for (let i = 0; i < A.TAIL_SEGMENTS; i++) expect(A.PARTS[`tail-${i}`]).toBeDefined();
  });

  it("ตาสองข้างมีตาดำกับจุดเงาที่วัดจากภาพ อยู่ในรูตาของตัวเอง", () => {
    for (const eye of A.EYES) {
      expect(Math.hypot(eye.pupil.cx - eye.cx, eye.pupil.cy - eye.cy)).toBeLessThan(eye.rx);
      expect(Math.hypot(eye.glint.cx - eye.cx, eye.glint.cy - eye.cy)).toBeLessThan(eye.rx);
      expect(eye.pupil.ry).toBeGreaterThan(eye.pupil.rx);
    }
  });
});

describe("เฟรมกระโดดลา (exit)", () => {
  it("ภาพเฟรมเรียงตารางพอดีกับจำนวนเฟรม", () => {
    for (const [theme, m] of Object.entries(A.EXIT.themes)) {
      const [w, h] = webpSize(path.join(IMG, `${theme}-exit.webp`));
      expect(w).toBe(m.cols * m.cell[0]);
      expect(h).toBe(Math.ceil(m.frames / m.cols) * m.cell[1]);
    }
  });

  it("LiveTab รอนานพอให้เล่นจบทุกธีม", () => {
    for (const m of Object.values(A.EXIT.themes)) expect(LEAVE_MS).toBeGreaterThan((m.frames * 1000) / A.EXIT.fps);
  });
});

describe("spring", () => {
  it("วิ่งเข้าหาเป้าแล้วนิ่ง", () => {
    const s = spring(0);
    s.to = 1;
    for (let i = 0; i < 240; i++) step(s, 1 / 120, 120, 0.6);
    expect(s.x).toBeCloseTo(1, 2);
  });
});
