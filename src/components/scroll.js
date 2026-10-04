import { useEffect, useState } from "react";
import { prefersReducedMotion } from "./ui.jsx";

// ความคืบหน้าการเลื่อนของ element (0 = ขอบบนอยู่ล่างจอ/บนสุด, 1 = เลื่อนผ่านไปแล้ว) เขียนลง CSS var บน element ตรง ๆ
// ไม่ setState ทุกเฟรม: ภาพ parallax ขยับด้วย calc(var(--p)) ใน CSS จึงไม่ re-render React
// mode "leave": 0 ตอนอยู่บนสุดของหน้า → 1 เมื่อ element เลื่อนพ้นขอบบนจอ (ใช้กับ hero)
// mode "through": 0 ตอนขอบบนแตะล่างจอ → 1 ตอนขอบล่างพ้นบนจอ (ใช้กับภาพคั่นส่วน)
export function useScrollVar(ref, mode = "through") {
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = mode === "leave" ? -r.top / r.height : (vh - r.top) / (vh + r.height);
      el.style.setProperty("--p", Math.min(1, Math.max(0, p)).toFixed(4));
    };
    const onScroll = () => (raf ||= requestAnimationFrame(update));
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [ref, mode]);
}

// ธีมปัจจุบัน (อ่านจาก data-theme บน <html>) อัปเดตเมื่อสวิตช์ถูกกด
export function useTheme() {
  const read = () => (document.documentElement.dataset.theme === "dark" ? "dark" : "light");
  const [theme, setTheme] = useState(read);
  useEffect(() => {
    const mo = new MutationObserver(() => setTheme(read()));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => mo.disconnect();
  }, []);
  return theme;
}
