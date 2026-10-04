import { defineConfig, devices } from "@playwright/test";

// ทดสอบ end-to-end บนเบราว์เซอร์จริง: npm run test:e2e
// ไฟล์ทดสอบชื่อ *.e2e.js (ไม่ใช่ *.test.js) เพื่อไม่ให้ Vitest หยิบไปรันปนกับ unit test
export default defineConfig({
  testDir: "e2e",
  testMatch: "**/*.e2e.js",
  globalSetup: "./e2e/warmup.js",
  fullyParallel: true,
  // เบราว์เซอร์แปลง CSV 53,000 แถวทุกครั้งที่เปิดหน้า: เผื่อเวลาเมื่อรันหลายหน้าพร้อมกัน
  timeout: 60_000,
  expect: { timeout: 15_000 },
  workers: 4,
  reporter: [["list"], ["html", { open: "never", outputFolder: "e2e-report" }]],
  outputDir: "e2e-results",
  use: {
    baseURL: "http://localhost:4173",
    locale: "th-TH",
    timezoneId: "Asia/Bangkok",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  // ทดสอบกับ production build (สิ่งที่ deploy จริง) ไม่ใช่ dev server ที่แปลงไฟล์สด ๆ และช้ากว่าหลายเท่า
  webServer: {
    command: "npm run build && npm run preview -- --port 4173 --strictPort",
    url: "http://localhost:4173",
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
