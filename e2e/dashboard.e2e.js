import { expect, test as base } from "@playwright/test";

// ทุกการทดสอบเก็บ error ใน console/หน้าเว็บไว้ ถ้ามี error ถือว่าไม่ผ่าน แม้ตัวทดสอบเองจะผ่าน
const test = base.extend({
  page: async ({ page }, use) => {
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    await use(page);
    expect(errors, "console errors").toEqual([]);
  },
});

// รอให้ CSV โหลดเสร็จ (หัวเรื่องจากข้อมูลขึ้นแล้ว) ก่อนเริ่มทดสอบหน้าภาพรวม
async function openOverview(page) {
  await page.goto("/");
  await expect(page.locator(".data-headline")).toContainText("ขายได้");
}

test.describe("ภาพรวม", () => {
  test("หัวเรื่องจากข้อมูลเปลี่ยนตามช่วงเวลาและสาขา", async ({ page }) => {
    await openOverview(page);
    const headline = page.locator(".data-headline");
    await expect(headline).toContainText("30 วันล่าสุด บ้านบรูขายได้");

    await page.getByRole("button", { name: /^ช่วงเวลา:/ }).click();
    await page.getByRole("option", { name: "7 วันล่าสุด" }).click();
    await expect(headline).toContainText("7 วันล่าสุด");

    await page.getByRole("button", { name: /^สาขา:/ }).click();
    await page.getByRole("option", { name: "สยาม" }).click();
    await expect(headline).toContainText("สาขาสยามขายได้");
    await expect(headline).toContainText(/อันดับ \d จาก 5 สาขา/);
  });

  test("KPI 4 ตัว กดสลับกราฟหลักได้ และมี sparkline", async ({ page }) => {
    await openOverview(page);
    const kpis = page.getByRole("group", { name: "เลือกตัวชี้วัดของกราฟ" }).locator("button[aria-pressed]");
    await expect(kpis).toHaveCount(4);
    await expect(kpis.first()).toHaveAttribute("aria-pressed", "true");
    await kpis.nth(1).click();
    await expect(kpis.nth(1)).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(".sparkline")).toHaveCount(4);
    await expect(page.getByRole("img", { name: /^กราฟจำนวนบิล/ })).toBeVisible();
  });

  test("ความละเอียดกราฟ และค่าเฉลี่ย 7 วันในช่วงยาว", async ({ page }) => {
    await openOverview(page);
    await page.getByRole("radio", { name: "สัปดาห์" }).click();
    await expect(page.getByRole("radio", { name: "สัปดาห์" })).toHaveAttribute("aria-checked", "true");

    await page.getByRole("button", { name: /^ช่วงเวลา:/ }).click();
    await page.getByRole("option", { name: "365 วันล่าสุด" }).click();
    await page.getByRole("radio", { name: "วัน", exact: true }).click();
    await expect(page.getByText("เฉลี่ย 7 วัน ·")).toBeVisible();
  });

  test("ปฏิทินคั่วมีช่องครบทุกวันของช่วง", async ({ page }) => {
    await openOverview(page);
    const cells = page.locator(".roast-cell[data-level]:not(.size-3)"); // size-3 = ช่องในคำอธิบายสี
    await cells.first().scrollIntoViewIfNeeded();
    await expect(cells).toHaveCount(30);

    await page.getByRole("button", { name: /^ช่วงเวลา:/ }).click();
    await page.getByRole("option", { name: "90 วันล่าสุด" }).click();
    await expect(cells).toHaveCount(90);
    // ยอดเฉลี่ยรายวันในสัปดาห์ครบ 7 วัน
    await expect(page.getByRole("list", { name: /แยกตามวันในสัปดาห์/ }).locator("li")).toHaveCount(7);
  });

  test("นาฬิกากาแฟสลับหน่วยได้", async ({ page }) => {
    await openOverview(page);
    const clock = page.getByRole("img", { name: /ยอดขายตามชั่วโมง/ });
    await clock.scrollIntoViewIfNeeded();
    await expect(clock).toContainText("แก้ว");
    await page.getByRole("radio", { name: "ยอดขาย" }).click();
    await expect(clock).toContainText("฿");
  });

  test("สาขาและเมนูขายดีครบ 5 อันดับ กดดูที่มาของตัวเลขได้", async ({ page }) => {
    await openOverview(page);
    const branchButtons = page.getByRole("button", { name: /^ดูที่มาของยอดขายสาขา/ });
    await expect(branchButtons).toHaveCount(5);
    await expect(page.getByRole("button", { name: /^ดูที่มาของยอดขาย (?!สาขา)/ })).toHaveCount(5);

    await branchButtons.first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "ปิด" }).click();
    await expect(dialog).toBeHidden();

    await page.getByRole("button", { name: "ดูที่มาของตัวเลขยอดขายรวม" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
  });

  test("ไทม์ไลน์ยอดขายแยกสาขา: การ์ดเชิญเปิดได้ แท่ง 3 มิติครบทุกสาขา และปิดได้", async ({ page }) => {
    await openOverview(page);
    const cta = page.getByRole("button", { name: /ดูบ้านบรูโตขึ้นทีละอาทิตย์/ });
    await expect(cta).toContainText(/\d+ เดือน/);
    await cta.click();
    const replay = page.getByRole("region", { name: "ย้อนดูการเติบโตของเครือร้าน" });
    await expect(replay).toBeVisible();
    await expect(replay.locator(".r3d-col")).toHaveCount(5);
    await expect(replay.locator(".r3d-tag")).toHaveCount(5);
    await replay.getByRole("radio", { name: "มองจากด้านบน" }).click();
    await expect(replay.locator(".r3d")).toHaveClass(/view-top/);
    await replay.getByRole("button", { name: "ปิด" }).click();
    await expect(cta).toBeVisible();
  });

  test("เรื่องเล่า: 7 ขั้น แต่ละขั้นมีตัวเลขจากข้อมูล และไฮไลต์ตามขั้น", async ({ page }) => {
    await openOverview(page);
    const steps = page.locator(".story-step");
    await expect(steps).toHaveCount(7);
    await expect(steps.first()).toContainText(/[\d,]+ บิล/);
    // ขั้นที่ 3: ชั่วโมง (เลื่อนให้การ์ดผ่านกลางจอ)
    await steps.nth(2).evaluate((el) => el.scrollIntoView({ block: "center" }));
    await expect(steps.nth(2)).toHaveClass(/is-active/);
    await expect(steps.nth(2)).toContainText(/\d+%/);
    await expect(page.locator(".story-key")).toContainText("บิลก่อน 10 โมงเช้า");
    await expect(page.locator(".story-tick").first()).toBeVisible();
    // ขั้นสุดท้าย: วันหยุด
    await steps.last().evaluate((el) => el.scrollIntoView({ block: "center" }));
    await expect(page.locator(".story-key")).toContainText("วันหยุดราชการ");
  });

  test("เรื่องเล่า: ดูจบแล้วยุบเป็นสรุป หน้าไม่กระโดด และกดดูอีกรอบได้", async ({ page }) => {
    await openOverview(page);
    const steps = page.locator(".story-step");
    // ยังไม่ได้ดูถึงท้ายเรื่อง: กระโดดข้ามไปไม่ยุบ
    await page.locator(".data-headline").evaluate((el) => el.scrollIntoView({ block: "start" }));
    await page.waitForTimeout(400);
    await expect(steps).toHaveCount(7);
    // อ่านไล่ทีละขั้นจนจบ แล้วเลื่อนผ่านไป
    await page.evaluate(() => window.scrollTo(0, 0));
    for (let i = 0; i < 7; i++) {
      await steps.nth(i).evaluate((el) => el.scrollIntoView({ block: "center" }));
      await expect(steps.nth(i)).toHaveClass(/is-active/);
    }
    const headline = page.locator(".data-headline");
    // หยุดให้หัวเรื่องถัดไปอยู่ล่าง ๆ จอ (ท้ายเรื่องยังไม่ผ่านแถบเมนู) แล้วค่อยเลื่อนต่อ 500px
    await headline.evaluate((el) => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 480));
    await page.waitForTimeout(300);
    await expect(steps).toHaveCount(7);
    const before = await headline.evaluate((el) => el.getBoundingClientRect().top);
    await page.evaluate(() => window.scrollBy(0, 500));
    await expect(page.locator(".story-recap")).toBeVisible();
    await expect(steps).toHaveCount(0);
    // เนื้อหาบนจอเลื่อนไปแค่ 500px ตามที่เลื่อนจริง ไม่กระโดดตามความสูงที่ยุบไป
    const after = await headline.evaluate((el) => el.getBoundingClientRect().top);
    expect(Math.abs(after - (before - 500))).toBeLessThan(4);
    await expect(page.locator(".story-recap-list li")).toHaveCount(5);
    await expect(page.locator(".story-recap-list b").first()).toHaveText(/\d+%/);
    // สลับแท็บแล้วกลับมา ยังยุบอยู่
    await page.getByRole("radio", { name: "ลูกค้า" }).click();
    await page.getByRole("radio", { name: "ภาพรวม" }).click();
    await expect(page.locator(".story-recap")).toBeVisible();
    // ดูอีกรอบ: กลับมาเป็นเรื่องเต็ม ที่ขั้นแรก
    await page.getByRole("button", { name: "ดูเรื่องนี้อีกรอบ" }).click();
    await expect(steps).toHaveCount(7);
    await expect(steps.first()).toHaveClass(/is-active/);
  });

  test("จังหวะของแต่ละสาขา: 5 ภูเขา ชี้แล้วอ่านค่าทุกสาขา และมีตาราง", async ({ page }) => {
    await openOverview(page);
    const svg = page.locator(".rhythm");
    await svg.scrollIntoViewIfNeeded();
    await expect(svg.locator(".ridge")).toHaveCount(5);
    const box = await svg.boundingBox();
    await page.mouse.move(box.x + box.width * 0.3, box.y + box.height / 2);
    await expect(svg.locator(".rhythm-cursor-label")).toContainText(/\d\d:00–\d\d:59/);
    await expect(svg.locator(".ridge-dot")).toHaveCount(5);
    const table = page.locator(".rhythm-table").first();
    if (!(await table.getAttribute("open"))) await table.locator("summary").click();
    await expect(table.locator("tbody tr")).toHaveCount(5);
  });

  test("วิศวกรรมเมนู: ทุกเมนูเป็นหนึ่งวง ชี้แล้วเห็นรายละเอียด", async ({ page }) => {
    await openOverview(page);
    await page.getByRole("button", { name: /^ช่วงเวลา:/ }).click();
    await page.getByRole("option", { name: "ทั้งหมด" }).click();
    const points = page.locator(".matrix-point circle");
    await points.first().scrollIntoViewIfNeeded();
    await expect(points).toHaveCount(40);
    // วงที่อยู่สูงสุด (กำไรต่อชิ้นมากที่สุด) ไม่ถูกวงอื่นทับ ชี้ได้แน่นอน
    const top = await points.evaluateAll((cs) => cs.reduce((best, c, i, all) => (+c.getAttribute("cy") < +all[best].getAttribute("cy") ? i : best), 0));
    await points.nth(top).hover();
    await expect(page.locator(".matrix-tip")).toContainText("กำไรรวม");
  });
});

test.describe("ลูกค้า", () => {
  test("เส้นทางของสมาชิก: กดการ์ดกลุ่มแล้วไฮไลต์ ชี้ที่เส้นเห็นทีละคน และมีตารางรุ่น", async ({ page }) => {
    await page.goto("/#customers");
    await expect(page.locator(".journey-title")).toContainText(/สมาชิก [\d,]+\s?คน/);
    const groups = page.locator(".journey-group");
    await expect(groups).toHaveCount(5);
    await expect(groups.first()).toHaveAttribute("aria-pressed", "true");
    // กดกลุ่ม "ซื้อครั้งเดียว" แล้วคำอธิบายใต้ภาพเปลี่ยนตาม
    await groups.nth(2).click();
    await expect(groups.nth(2)).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(".journey-caption")).toContainText("มาแค่ครั้งเดียว");
    // ชี้ (มือถือ: แตะ) ที่เส้น แล้วแว่นขยายบอกรายละเอียดของสมาชิกคนนั้น
    const stage = page.locator(".lifelines");
    await stage.scrollIntoViewIfNeeded();
    const box = await stage.boundingBox();
    if (test.info().project.name === "mobile") await stage.click({ position: { x: box.width * 0.8, y: box.height * 0.3 } });
    else await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.3);
    await expect(page.locator(".loupe")).toContainText(/สมาชิก C\d+/);
    await expect(page.locator(".loupe")).toContainText(/\d+\s?บิล/);
    // ตารางรุ่น: แถวละเดือนที่ซื้อครั้งแรก ช่องเป็น %
    const rows = page.locator(".cohort-table tbody tr");
    expect(await rows.count()).toBeGreaterThan(6);
    await expect(page.locator(".cohort-cell").first()).toHaveText(/\d+%/);
    // ปุ่มในกล่องชวนกลับ ไฮไลต์กลุ่มที่ไม่ได้มาเกิน 90 วัน
    await page.getByRole("button", { name: "ดูเส้นของคนกลุ่มนี้ ↑" }).click();
    await expect(groups.nth(3)).toHaveAttribute("aria-pressed", "true");
    // โหมดตัวเลขละเอียดยังอยู่ครบ
    await page.getByRole("radio", { name: "ตัวเลขละเอียด" }).click();
    await expect(page.getByText("สมาชิกแต่ละกลุ่ม")).toBeVisible();
    await page.getByRole("radio", { name: "แบบเล่าเรื่อง" }).click();
  });
});

test.describe("แท็บทั้งหมด", () => {
  const TABS = [
    { name: "ภาพรวม", hash: "", expect: "ขายได้" },
    { name: "ลูกค้า", hash: "#customers", expect: "เส้นทางของสมาชิก" },
    { name: "Lab 2.2 · ซ่อมกราฟ", hash: "#lab2", expect: "Lab 2.2 · ซ่อมกราฟแย่" },
    { name: "สด · Firestore", hash: "#live", expect: "เข้าสู่ระบบ" },
    { name: "ทดสอบ Rules", hash: "#rules", expect: "Lab 3.3" },
  ];

  for (const t of TABS) {
    test(`แท็บ ${t.name}: กดแล้วเปิดได้ และจำไว้ใน URL`, async ({ page }) => {
      await openOverview(page);
      await page.getByRole("radio", { name: t.name }).click();
      await expect(page.getByRole("radio", { name: t.name })).toHaveAttribute("aria-checked", "true");
      await expect(page.locator(".page-enter")).toContainText(t.expect);
      if (t.hash) await expect(page).toHaveURL(new RegExp(`${t.hash}$`));

      // รีเฟรชแล้วยังอยู่แท็บเดิม
      await page.reload();
      await expect(page.locator(".page-enter")).toContainText(t.expect);
    });

    test(`แท็บ ${t.name}: ไม่มีการเลื่อนแนวนอนทั้งหน้า`, async ({ page }) => {
      await page.goto(`/${t.hash}`);
      await expect(page.locator(".page-enter")).toContainText(t.expect);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});

test.describe("ธีม", () => {
  test("สวิตช์สลับเช้า/ค่ำ และจำค่าหลังรีเฟรช", async ({ page }) => {
    await openOverview(page);
    const html = page.locator("html");
    const before = await html.getAttribute("data-theme");
    await page.locator(".dn-switch").click();
    const after = before === "dark" ? "light" : "dark";
    await expect(html).toHaveAttribute("data-theme", after);
    await page.reload();
    await expect(html).toHaveAttribute("data-theme", after);
  });

  test("ไม่เคยเลือกธีม: เลือกตามเวลากรุงเทพฯ", async ({ page }) => {
    await page.clock.setFixedTime(new Date("2026-10-03T08:00:00+07:00"));
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await page.clock.setFixedTime(new Date("2026-10-03T21:00:00+07:00"));
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  });
});

// ภาพหน้าจอไว้ตรวจด้วยตา (ไม่ได้เทียบภาพ) อยู่ใน e2e-results/screens
// ถ่ายทีละจอขณะเลื่อนลง ไม่ใช้ fullPage: Chromium บนจอ DPI สูงวาด SVG ที่มี clip-path หายในภาพ fullPage
test.describe("ภาพหน้าจอ", () => {
  for (const theme of ["light", "dark"]) {
    test(`ภาพรวม ธีม${theme === "light" ? "เช้า" : "ค่ำ"}`, async ({ page }, testInfo) => {
      await page.addInitScript((t) => localStorage.setItem("baanbrew-theme", t), theme);
      await page.emulateMedia({ reducedMotion: "reduce" });
      await openOverview(page);
      const { height, step } = await page.evaluate(() => ({ height: document.body.scrollHeight, step: window.innerHeight }));
      for (let i = 0, y = 0; y < height; i++, y += step * 0.9) {
        await page.evaluate((top) => window.scrollTo(0, top), y);
        await page.waitForTimeout(400);
        await page.screenshot({ path: `e2e-results/screens/${testInfo.project.name}-${theme}-${String(i).padStart(2, "0")}.png` });
      }
    });
  }
});
