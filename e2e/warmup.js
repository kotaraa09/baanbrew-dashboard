import { chromium } from "@playwright/test";

// เปิดทุกแท็บหนึ่งครั้งก่อนเริ่มทดสอบ: ถ้าหน้าเว็บโหลดไม่ขึ้นเลย จะรู้ทันทีแทนที่จะเห็นทุกการทดสอบหมดเวลา
// และให้ระบบไฟล์/แคชของเซิร์ฟเวอร์อุ่นก่อน 4 เบราว์เซอร์เปิดพร้อมกัน
export default async function warmup(config) {
  const { baseURL } = config.projects[0].use;
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(baseURL);
  await page.locator(".data-headline").waitFor({ timeout: 120_000 });
  for (const hash of ["#customers", "#lab2", "#live", "#rules"]) {
    await page.goto(`${baseURL}/${hash}`);
    await page.locator(".page-enter").waitFor({ timeout: 60_000 });
  }
  await browser.close();
}
