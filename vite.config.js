import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // ผลลัพธ์ของ Playwright ถูกเขียนระหว่างทดสอบ ถ้า dev server เฝ้าดูโฟลเดอร์นี้ด้วยจะรีโหลด/ล่ม (EBUSY บน Windows)
    watch: { ignored: ["**/e2e-results/**", "**/e2e-report/**"] },
  },
  // ประกาศ dependency ล่วงหน้า: ถ้า Vite เพิ่งเจอตอนเปิดหน้าแรก จะ optimize ใหม่แล้วรีโหลดทุกหน้า (ทดสอบ e2e พัง)
  optimizeDeps: { include: ["d3-shape", "recharts", "papaparse"] },
  test: {
    exclude: ["**/node_modules/**", "e2e/**"],
  },
});
