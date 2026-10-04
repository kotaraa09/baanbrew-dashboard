import { useEffect, useRef, useState } from "react";
import { useScrollVar, useTheme } from "./scroll.js";
import { useSeen } from "./ui.jsx";
import { PLACEHOLDERS } from "./bandPlaceholders.js";

const MEDIA = `${import.meta.env.BASE_URL}media/`;
const small = () => window.matchMedia("(max-width: 700px)").matches;
const urlOf = (name) => `${MEDIA}${name}${small() ? "-sm" : ""}.webp`;

// ภาพคั่นส่วนแบบ parallax (ภาพเลื่อนช้ากว่าหน้า) พร้อมหัวข้อใหญ่ · images = { light, dark } หรือชื่อเดียวใช้ทั้งสองธีม
// ภาพเป็นการตกแต่งล้วน (alt ว่าง) หัวข้อคือเนื้อหาจริง
// ระหว่างโหลดแสดงภาพจิ๋วเบลอก่อน แล้วค่อยจางภาพจริงขึ้นมาเมื่อโหลดเสร็จ
export default function SectionBand({ images, eyebrow, title, children, tall = false }) {
  const theme = useTheme();
  const ref = useRef(null);
  useScrollVar(ref, "through");
  const [seenRef, seen] = useSeen(0.35);
  const name = typeof images === "string" ? images : images[theme];
  const [loaded, setLoaded] = useState(null);

  // โหลดภาพของอีกธีมไว้ล่วงหน้าตอนเครื่องว่าง สลับธีมแล้วภาพขึ้นทันที
  useEffect(() => {
    if (typeof images === "string") return;
    const other = images[theme === "dark" ? "light" : "dark"];
    const idle = window.requestIdleCallback ?? ((fn) => setTimeout(fn, 1500));
    const id = idle(() => {
      new Image().src = urlOf(other);
    });
    return () => (window.cancelIdleCallback ?? clearTimeout)(id);
  }, [images, theme]);

  return (
    <section ref={ref} className={`band ${tall ? "band-tall" : ""}`}>
      <div className="band-media">
        {PLACEHOLDERS[name] && <img src={PLACEHOLDERS[name]} alt="" aria-hidden="true" className="band-lqip" />}
        <img
          key={name}
          src={urlOf(name)}
          alt=""
          decoding="async"
          fetchPriority="low"
          onLoad={() => setLoaded(name)}
          ref={(el) => {
            if (el?.complete && el.naturalWidth && loaded !== name) setLoaded(name);
          }}
          className={`band-full ${loaded === name ? "is-loaded" : ""}`}
        />
      </div>
      <div className="band-scrim" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />
      <div ref={seenRef} className={`band-copy ${seen ? "is-in" : ""}`}>
        {eyebrow && <p className="band-eyebrow">{eyebrow}</p>}
        <h2 className="band-title font-display">
          {title.map((line, i) => (
            <span key={line} className="reveal-line">
              <span style={{ animationDelay: `${i * 110}ms` }}>{line}</span>
            </span>
          ))}
        </h2>
        {children}
      </div>
    </section>
  );
}
