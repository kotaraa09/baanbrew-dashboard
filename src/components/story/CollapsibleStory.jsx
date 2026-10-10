import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useSeen } from "../ui.jsx";

// เรื่องเล่าแบบเลื่อนดูที่ "ดูจบแล้วยุบ": อ่านถึงขั้นท้าย ๆ แล้วเลื่อนผ่านไป เรื่องจะยุบเหลือสรุปสั้น ๆ กดดูอีกรอบได้
// จำไว้ใน localStorage: ดูจบแล้วปิดเว็บเปิดใหม่ก็ยังยุบอยู่ กด "ดูเรื่องนี้อีกรอบ" ถ้าอยากดูเต็มอีกครั้ง
// renderStage(onStep) วาดเรื่องเต็ม (เรียก onStep(i) เมื่ออ่านถึงขั้น i) · recap = { title, items: [{ value, text }] }
export default function CollapsibleStory({ seenKey, stepCount, renderStage, recap }) {
  const wrapRef = useRef(null);
  const endRef = useRef(null);
  const reached = useRef(0); // ขั้นไกลสุดที่เคยอ่านถึง
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(seenKey) === "1";
    } catch {
      return false;
    }
  });
  const [replayed, setReplayed] = useState(false);

  // ส่วนที่ยุบอยู่เหนือจอ จึงเลื่อนหน้าชดเชยความสูงที่หายไป เนื้อหาบนจอจะไม่กระโดด
  useEffect(() => {
    if (collapsed) return;
    // ฟังการเลื่อนหน้าแทน IntersectionObserver: เลื่อนเร็ว ๆ ข้ามไปทีเดียวจุดท้ายเรื่องไม่เคย "ตัด" ขอบจอ observer จะไม่ยิง
    let raf = 0;
    const check = () => {
      raf = 0;
      const bar = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--bar-h")) || 64;
      if (endRef.current.getBoundingClientRect().top > bar || reached.current < stepCount - 2) return;
      const wrap = wrapRef.current;
      const before = wrap.getBoundingClientRect().bottom;
      flushSync(() => setCollapsed(true));
      window.scrollBy(0, wrap.getBoundingClientRect().bottom - before);
      try {
        localStorage.setItem(seenKey, "1");
      } catch {
        /* เก็บไม่ได้ก็แค่ไม่จำ */
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(check);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [collapsed, seenKey, stepCount]);

  const replay = () => {
    reached.current = 0;
    setReplayed(true);
    setCollapsed(false);
    try {
      localStorage.removeItem(seenKey);
    } catch {
      /* ไม่เป็นไร */
    }
  };
  useLayoutEffect(() => {
    if (replayed && !collapsed) wrapRef.current.scrollIntoView({ block: "start" });
  }, [replayed, collapsed]);
  const onStep = useCallback((i) => {
    reached.current = Math.max(reached.current, i);
  }, []);

  return (
    <div ref={wrapRef} className="story-wrap">
      {collapsed ? <StoryRecap {...recap} onReplay={replay} /> : renderStage(onStep)}
      <div ref={endRef} aria-hidden="true" />
    </div>
  );
}

// ---------- สรุปหลังดูจบ ----------
function StoryRecap({ title, items, onReplay }) {
  const [ref, seen] = useSeen(0.2);
  return (
    <section ref={ref} className={`story-recap ${seen ? "is-in" : ""}`} aria-label={`สรุปเรื่อง ${title}`}>
      <div className="story-recap-head">
        <p className="story-recap-eyebrow">ดูจบแล้ว · สรุปสั้น ๆ</p>
        <h2 className="story-recap-title font-display">{title}</h2>
        <button type="button" className="story-replay" onClick={onReplay}>
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path d="M4.5 10a5.5 5.5 0 1 0 1.6-3.9M5 3.5v3h3" />
          </svg>
          ดูเรื่องนี้อีกรอบ
        </button>
      </div>
      <ul className="story-recap-list">
        {items.map((it, i) => (
          <li key={i} style={{ transitionDelay: `${120 + i * 70}ms` }}>
            <b className="font-display">{it.value}</b>
            <span>{it.text}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
