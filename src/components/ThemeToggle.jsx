import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import { prefersReducedMotion } from "./ui.jsx";

const STORAGE_KEY = "baanbrew-theme";

// ดาวบนท้องฟ้ากลางคืน (px ในสวิตช์ขนาดเต็ม 150×66)
const STARS = [
  [3, 22, 16], [2, 38, 34], [3, 30, 48], [2, 56, 13], [2, 64, 45], [2, 14, 38], [3, 47, 24],
  // ฝั่งขวา: ช่องว่างระหว่างดาวชุดแรกกับพระจันทร์ (พระจันทร์เริ่มที่ x = 91)
  [2, 74, 20], [3, 82, 36], [2, 77, 54], [2, 86, 10],
];

// ธีมตั้งไว้แล้วโดยสคริปต์ใน index.html ก่อน render (จำค่าที่เลือก ไม่งั้นตามระบบ) ที่นี่แค่อ่านต่อ
function currentTheme() {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

export default function ThemeToggle() {
  const [dark, setDark] = useState(() => currentTheme() === "dark");
  // จุดเริ่มวงกลม = กลางสวิตช์ วัดจากกรอบนอกที่ไม่ได้ย่อ (สวิตช์ข้างในย่อด้วย CSS zoom)
  // ไม่ใช้พิกัดเมาส์: ในเบราว์เซอร์ของ Claude desktop คลิกบนองค์ประกอบที่มี zoom ได้ clientX คลาดไปหลายร้อย px
  // วงกลมจึงไปเริ่มกลางจอ ส่วนกรอบนอกวัดได้ตรงทุกเบราว์เซอร์
  const wrapRef = useRef(null);

  const toggle = (e) => {
    const next = e.target.checked;
    const apply = () => {
      flushSync(() => setDark(next));
      document.documentElement.dataset.theme = next ? "dark" : "light";
    };
    // เปลี่ยนช่วงเวลาของร้าน: ธีมใหม่ขยายเป็นวงกลมออกจากสวิตช์จนเต็มจอ (View Transitions API)
    // เบราว์เซอร์ที่ไม่รองรับ หรือผู้ใช้ลดการเคลื่อนไหว: สลับทันที
    if (document.startViewTransition && !prefersReducedMotion()) {
      const r = wrapRef.current.getBoundingClientRect();
      const [x, y] = [r.left + r.width / 2, r.top + r.height / 2];
      const root = document.documentElement.style;
      root.setProperty("--vt-x", `${x}px`);
      root.setProperty("--vt-y", `${y}px`);
      document.startViewTransition(apply);
    } else {
      apply();
    }
    try {
      localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
    } catch {
      // เปิดแบบ private หรือบล็อก storage: สลับได้ แต่ไม่จำ
    }
  };

  return (
    <span ref={wrapRef} className="dn-wrap">
      <input className="dn-in" type="checkbox" id="dn-toggle" checked={dark} onChange={toggle} />
      <label className="dn-switch" htmlFor="dn-toggle">
        <span className="dn-clouds" aria-hidden="true">
          <span className="dn-cloud dn-c1" />
          <span className="dn-cloud dn-c2" />
          <span className="dn-cloud dn-c3" />
        </span>
        <span className="dn-stars" aria-hidden="true">
          {STARS.map(([size, left, top]) => (
            <span key={`${left}-${top}`} className="dn-star" style={{ width: size, height: size, left, top }} />
          ))}
        </span>
        <svg className="dn-orb" viewBox="0 0 52 52" aria-hidden="true">
          <defs>
            <radialGradient id="dn-gloss" cx="34%" cy="28%" r="72%">
              <stop offset="0" stopColor="#FFFFFF" stopOpacity=".5" />
              <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
            </radialGradient>
            <mask id="dn-bite" maskUnits="userSpaceOnUse" x="-40" y="-40" width="132" height="132">
              <rect x="-40" y="-40" width="132" height="132" fill="#000" />
              <circle cx="26" cy="26" r="26" fill="#FFF" />
              <circle className="dn-shade" cx="40" cy="96" r="26" fill="#000" />
            </mask>
          </defs>
          <g mask="url(#dn-bite)">
            <circle className="dn-disc" cx="26" cy="26" r="26" />
            <circle cx="26" cy="26" r="26" fill="url(#dn-gloss)" />
          </g>
        </svg>
        <span className="dn-sr">โหมดมืด</span>
      </label>
    </span>
  );
}
