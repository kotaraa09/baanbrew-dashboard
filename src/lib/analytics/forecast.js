// Lab 4.4 · ใช้ Claude Code เขียนฟังก์ชันที่ยังว่าง (Prompt 4.4A ใน PROMPTS_LAB4.md) จนกว่า npm test จะผ่าน · ห้ามแก้ไฟล์ test
// Lab 4.4 · พยากรณ์ยอดขายแบบอธิบายได้ และวัดความแม่นด้วยการย้อนทดสอบ (backtest)
import { addDays } from "../../lab3/time.js";

const dow = (ymd) => new Date(ymd + "T00:00:00Z").getUTCDay(); // 0 = อาทิตย์

/** ค่าเฉลี่ยยอดขายวันเดียวกันของสัปดาห์ K ครั้งล่าสุด (ฤดูกาลรายสัปดาห์) */
export function seasonalForecast(series, horizon, K = 8) {
  const last = series[series.length - 1].date;
  return Array.from({ length: horizon }, (_, i) => {
    const date = addDays(last, i + 1);
    const d = dow(date);
    const same = series.filter((s) => dow(s.date) === d).slice(-K);
    const forecast = same.length ? same.reduce((a, s) => a + s.revenue, 0) / same.length : 0;
    return { date, forecast };
  });
}

/** ค่าเฉลี่ย K วันล่าสุด เส้นตรง (ตัวเปรียบเทียบที่ไม่สนวันในสัปดาห์) */
export function flatForecast(series, horizon, K = 28) {
  const recent = series.slice(-K);
  const avg = recent.reduce((a, s) => a + s.revenue, 0) / recent.length;
  const last = series[series.length - 1].date;
  return Array.from({ length: horizon }, (_, i) => ({ date: addDays(last, i + 1), forecast: avg }));
}

/** Mean Absolute Percentage Error (%) · ข้ามวันที่ยอดจริงเป็น 0 เพราะหารไม่ได้ */
export function mape(actual, forecast) {
  let sum = 0, n = 0;
  actual.forEach((a, i) => {
    if (a === 0) return;
    sum += Math.abs(forecast[i] - a) / a;
    n += 1;
  });
  return n ? (sum / n) * 100 : 0;
}

/**
 * ย้อนทดสอบ: ซ่อน horizon วันสุดท้าย พยากรณ์จากข้อมูลก่อนหน้า แล้วเทียบกับของจริง
 * band = ±1.28 × ส่วนเบี่ยงเบนมาตรฐานของ % ความคลาดเคลื่อน (ช่วงประมาณ 80%)
 */
export function backtest(series, horizon = 28, K = 8) {
  const train = series.slice(0, -horizon);
  const hidden = series.slice(-horizon);
  const seasonal = seasonalForecast(train, horizon, K);
  const flat = flatForecast(train, horizon);
  const actual = hidden.map((s) => s.revenue);

  // % ความคลาดเคลื่อนรายวันของ seasonal (ข้ามวันที่ยอดจริงเป็น 0)
  const errs = hidden.filter((s) => s.revenue).map((s, i) => (seasonal[i].forecast - s.revenue) / s.revenue);
  const mean = errs.length ? errs.reduce((a, e) => a + e, 0) / errs.length : 0;
  const sd = errs.length ? Math.sqrt(errs.reduce((a, e) => a + (e - mean) ** 2, 0) / errs.length) : 0;
  const band = 1.28 * sd;

  return {
    test: hidden.map((s, i) => ({
      date: s.date,
      actual: s.revenue,
      seasonal: seasonal[i].forecast,
      flat: flat[i].forecast,
      low: seasonal[i].forecast * (1 - band),
      high: seasonal[i].forecast * (1 + band),
    })),
    mapeSeasonal: mape(actual, seasonal.map((x) => x.forecast)),
    mapeFlat: mape(actual, flat.map((x) => x.forecast)),
    band,
  };
}
