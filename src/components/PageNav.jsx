import { useLayoutEffect, useRef, useState } from "react";

// เมนูหน้าหลักของเว็บ แยกจาก Segmented โดยตั้งใจ:
// Segmented หน้าตาเหมือนสวิตช์ในการ์ด (แก้ว/ยอดขาย, ความเร็ว) คนจึงมองข้ามว่าเป็นทางไปหน้าอื่น
// ที่นี่จึงเป็นลิงก์จริง ตัวใหญ่กว่า วางเป็นแถวของตัวเองใต้ตรา มีเส้นใต้สีครีมาใต้หน้าที่เปิดอยู่
// groups = [[tab, tab], [tab]] · กลุ่มคั่นด้วยเส้นตั้ง (หน้าของร้าน | หน้าแล็บ)
export default function PageNav({ groups, value, onChange, navRef }) {
  const trackRef = useRef(null);
  const [bar, setBar] = useState(null);
  const [fade, setFade] = useState({ left: false, right: false });

  // เส้นใต้เลื่อนไปหาแท็บที่เลือก (วัดจากลิงก์จริง) ครั้งแรกวางเลยไม่เลื่อน
  useLayoutEffect(() => {
    const track = trackRef.current;
    const measure = () => {
      const el = track?.querySelector('[aria-current="page"]');
      if (!el) return setBar(null);
      setBar((prev) => ({ left: el.offsetLeft, width: el.offsetWidth, animate: prev != null }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(track);
    return () => ro.disconnect();
  }, [value]);

  // จอแคบ: เงาจางที่ขอบบอกว่ายังมีแท็บซ่อนอยู่ เลื่อนดูได้
  useLayoutEffect(() => {
    const el = navRef?.current;
    if (!el) return;
    const update = () =>
      setFade({ left: el.scrollLeft > 4, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 });
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [navRef]);

  const mask = `linear-gradient(to right, ${fade.left ? "transparent" : "#000"} 0, #000 28px, #000 calc(100% - 28px), ${fade.right ? "transparent" : "#000"} 100%)`;

  return (
    <nav aria-label="หน้า" className="border-b border-line">
      <div ref={navRef} className="overflow-x-auto [scrollbar-width:none]" style={{ maskImage: mask, WebkitMaskImage: mask }}>
        <div ref={trackRef} className="relative flex w-max items-stretch">
          {groups.map((tabs, gi) => (
            <div key={gi} className="flex items-stretch">
              {gi > 0 && <span aria-hidden="true" className="mx-2 my-3 w-px bg-line-strong" />}
              {tabs.map((t) => {
                const active = t.value === value;
                return (
                  <a
                    key={t.value}
                    href={t.value === "overview" ? "#" : `#${t.value}`}
                    aria-current={active ? "page" : undefined}
                    onClick={(e) => {
                      e.preventDefault();
                      onChange(t.value);
                    }}
                    className={`group relative inline-flex h-11 shrink-0 items-center gap-2 rounded-t-lg px-3 text-sm font-medium whitespace-nowrap transition-colors duration-200 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-chart sm:px-3.5 ${
                      active ? "text-ink" : "text-ink-subtle hover:bg-surface-hover/70 hover:text-ink"
                    }`}
                  >
                    {t.icon && (
                      <t.icon className={`size-4 transition-colors duration-200 ${active ? "text-chart" : "text-ink-muted group-hover:text-ink-subtle"}`} />
                    )}
                    {t.label}
                  </a>
                );
              })}
            </div>
          ))}
          {bar && (
            <span
              aria-hidden="true"
              className={`absolute bottom-0 h-[3px] rounded-t-full bg-chart ${
                bar.animate ? "transition-[left,width] duration-300 ease-[var(--ease-out)]" : ""
              }`}
              style={{ left: bar.left + 8, width: bar.width - 16 }}
            />
          )}
        </div>
      </div>
    </nav>
  );
}

// ท้ายทุกหน้า: บอกว่ามีหน้าถัดไป และหน้านั้นตอบคำถามอะไร (คนที่ไม่เคยมองแถบบน เลื่อนมาถึงท้ายหน้าก็เจอทางไปต่อ)
export function NextPage({ tab, onGo }) {
  if (!tab) return null;
  return (
    <a
      href={`#${tab.value}`}
      onClick={(e) => {
        e.preventDefault();
        onGo(tab.value);
      }}
      className="group card-sheen flex items-center justify-between gap-4 rounded-[var(--radius-card)] bg-surface px-5 py-5 shadow-[var(--shadow-card)] transition-[background-color,scale] duration-200 hover:bg-surface-hover active:scale-[0.995] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chart sm:px-7 sm:py-6"
    >
      <span className="min-w-0">
        <span className="flex items-center gap-2 text-[13px] font-medium text-ink-subtle">
          {tab.icon && <tab.icon className="size-4 text-chart" />}
          หน้าถัดไป · {tab.label}
        </span>
        <span className="mt-1.5 block font-[family-name:var(--font-display)] text-[clamp(20px,2.6vw,28px)] leading-snug font-semibold text-balance text-ink">
          {tab.teaser}
        </span>
      </span>
      <span
        aria-hidden="true"
        className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-chart text-on-chart transition-transform duration-300 ease-[var(--ease-out)] group-hover:translate-x-1"
      >
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-5">
          <path d="M4 10h12M11 5l5 5-5 5" />
        </svg>
      </span>
    </a>
  );
}
