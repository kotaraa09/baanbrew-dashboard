import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { formatPercent } from "../lib/metrics.js";

// ---------- Motion ----------

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// ตัวเลขที่ค่อย ๆ นับไปหาค่าใหม่ (ease-out) ใช้แสดงผลเท่านั้น ค่าจริงยังมาจาก metrics.js
// ครั้งแรกนับขึ้นจาก 0, ถ้าผู้ใช้ตั้งค่าลดการเคลื่อนไหวหรือแท็บถูกซ่อน (requestAnimationFrame ไม่ทำงาน) จะแสดงค่าจริงทันที
const skipMotion = () => prefersReducedMotion() || (typeof document !== "undefined" && document.hidden);

export function useTweenedNumber(value, duration = 600) {
  const [shown, setShown] = useState(() => (skipMotion() ? value : 0));
  const shownRef = useRef(shown);

  useEffect(() => {
    if (skipMotion()) {
      shownRef.current = value;
      setShown(value);
      return;
    }
    const from = shownRef.current;
    let raf;
    let start = null;
    const step = (now) => {
      start ??= now;
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - p) ** 3;
      shownRef.current = p === 1 ? value : from + (value - from) * eased;
      setShown(shownRef.current);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return shown;
}

// พื้นที่ที่ยืด/หดความสูงตอนเปิด-ปิด (grid-template-rows 0fr ↔ 1fr) เนื้อหาด้านล่างจึงเลื่อนตามนุ่ม ๆ ไม่กระโดด
// space-y ของ Tailwind v4 ใส่ margin-bottom ให้ลูกทุกตัวยกเว้นตัวสุดท้าย ส่วนนี้จึงตัด margin ของตัวเองทิ้ง (!mb-0)
// แล้วใส่ช่องว่าง (gap) เป็น padding ของเนื้อหาข้างใน ซึ่งหดเหลือ 0 ไปพร้อมกัน
// (padding ของ grid item เองจะไม่หด เพราะนับเป็นขนาดขั้นต่ำของแถว 0fr)
export function Collapsible({ open, children, gap = 16, duration = 360 }) {
  const [mounted, setMounted] = useState(open);
  const [expanded, setExpanded] = useState(false);
  const [settled, setSettled] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    let timer;
    if (open) {
      if (!mounted) return setMounted(true); // render แบบหดก่อน effect รอบถัดไปค่อยยืด
      // อ่านขนาดเพื่อบังคับให้เบราว์เซอร์คำนวณสถานะหด (0fr) ก่อน การเปลี่ยนเป็น 1fr จึงเป็น transition
      // (ไม่ใช้ requestAnimationFrame เพราะไม่ทำงานในแท็บที่ถูกซ่อน)
      void ref.current?.offsetHeight;
      setExpanded(true);
      timer = setTimeout(() => setSettled(true), duration + 40);
    } else {
      setSettled(false);
      setExpanded(false);
      timer = setTimeout(() => setMounted(false), duration);
    }
    return () => clearTimeout(timer);
  }, [open, mounted, duration]);

  if (!mounted) return null;
  return (
    <div
      ref={ref}
      className="!mb-0 grid transition-[grid-template-rows,opacity,translate] ease-[var(--ease-out)]"
      style={{
        gridTemplateRows: expanded ? "1fr" : "0fr",
        opacity: expanded ? 1 : 0,
        translate: expanded ? "0 0" : "0 -8px",
        transitionDuration: `${duration}ms`,
      }}
    >
      {/* ซ่อนส่วนเกินเฉพาะตอนกำลังยืด/หด ตอนนิ่งแล้วให้เงาการ์ดแสดงครบ */}
      <div className={`min-h-0 ${settled ? "" : "overflow-hidden"}`}>
        <div style={{ paddingBottom: gap }}>{children}</div>
      </div>
    </div>
  );
}

// ---------- Icons (เส้น 1.5px ชุดเดียวกันทั้งหมด) ----------

function Icon({ children, className = "size-4" }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {children}
    </svg>
  );
}

export const CalendarIcon = (p) => (
  <Icon {...p}>
    <rect x="3" y="4.5" width="14" height="12.5" rx="2" />
    <path d="M3 8.5h14M7 2.75v3.5M13 2.75v3.5" />
  </Icon>
);

export const StoreIcon = (p) => (
  <Icon {...p}>
    <path d="M3.5 8v8.5h13V8" />
    <path d="M2.5 4h15l-1 4a2.1 2.1 0 0 1-4 0 2.1 2.1 0 0 1-4 0 2.1 2.1 0 0 1-4 0 2.1 2.1 0 0 1-2-4Z" />
    <path d="M8 16.5v-4h4v4" />
  </Icon>
);

export const ChevronDownIcon = (p) => (
  <Icon {...p}>
    <path d="m6 8 4 4 4-4" />
  </Icon>
);

// แว่นขยายบนเส้นข้อมูล = "ดูที่มาของตัวเลข"
export const TraceIcon = (p) => (
  <Icon {...p}>
    <path d="M3 5h6M3 9h4M3 13h3" />
    <circle cx="12.5" cy="10.5" r="3.5" />
    <path d="m15 13 2.5 2.5" />
  </Icon>
);

const ArrowUpIcon = (p) => (
  <Icon {...p}>
    <path d="M10 15.5v-11M5.5 9 10 4.5 14.5 9" />
  </Icon>
);

const ArrowDownIcon = (p) => (
  <Icon {...p}>
    <path d="M10 4.5v11M5.5 11l4.5 4.5 4.5-4.5" />
  </Icon>
);

// ---------- Card ----------

export function Card({ as: Tag = "section", className = "", children, ...rest }) {
  return (
    <Tag
      className={`rounded-[var(--radius-card)] bg-surface shadow-[var(--shadow-card)] ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export function CardHeader({ title, subtitle, children }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 px-4 pt-4 sm:px-5">
      <div>
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
        {subtitle && <p className="mt-0.5 text-[13px] text-ink-subtle">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

// ---------- Select (native select เพื่อให้ใช้คีย์บอร์ด/มือถือได้ตามมาตรฐาน) ----------

export function Select({ label, icon: LeadIcon, value, onChange, options }) {
  return (
    <label className="relative inline-flex items-center">
      {LeadIcon && <LeadIcon className="pointer-events-none absolute left-2.5 size-4 text-ink-subtle" />}
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 cursor-pointer appearance-none rounded-lg border border-line-strong bg-surface pr-8 pl-8 text-[13px] font-medium text-ink shadow-[0_1px_0_0_rgb(0_0_0/0.05)] transition-colors hover:bg-surface-hover focus-visible:border-chart"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute right-2 size-4 text-ink-subtle" />
    </label>
  );
}

// ---------- Segmented control ----------

// ชิปสีขาวตัวเดียวเลื่อนไปหาตัวเลือกที่กด (วัดตำแหน่งจากปุ่มจริง) ครั้งแรกวางเลยไม่เลื่อน
export function Segmented({ label, value, onChange, options }) {
  const trackRef = useRef(null);
  const [chip, setChip] = useState(null);

  useLayoutEffect(() => {
    const track = trackRef.current;
    const measure = () => {
      const el = track?.querySelector('[aria-checked="true"]');
      if (!el) return setChip(null);
      setChip((prev) => ({ left: el.offsetLeft, width: el.offsetWidth, animate: prev != null }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(track);
    return () => ro.disconnect();
  }, [value, options.length]);

  return (
    <div ref={trackRef} role="radiogroup" aria-label={label} className="relative inline-flex rounded-lg bg-canvas p-0.5">
      {chip && (
        <span
          aria-hidden="true"
          className={`absolute top-0.5 bottom-0.5 rounded-md bg-surface shadow-[var(--shadow-card)] ${
            chip.animate ? "transition-[left,width] duration-300 ease-[var(--ease-out)]" : ""
          }`}
          style={{ left: chip.left, width: chip.width }}
        />
      )}
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={o.disabled}
            onClick={() => onChange(o.value)}
            className={`relative h-7 rounded-md px-2.5 text-xs font-medium transition-colors duration-200 disabled:cursor-not-allowed disabled:text-ink-muted/50 ${
              active ? "text-ink" : "text-ink-subtle hover:text-ink"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// ---------- % เปลี่ยนแปลง ----------

export function Change({ value, variant = "text" }) {
  if (value == null) {
    return <span className="text-xs text-ink-muted">ไม่มีข้อมูลเทียบ</span>;
  }
  const flat = Math.abs(value) < 0.05;
  const up = value > 0;
  const tone = flat ? "text-ink-subtle" : up ? "text-up" : "text-down";
  const bg = variant === "badge" ? (flat ? "bg-canvas" : up ? "bg-up-bg" : "bg-down-bg") : "";
  const Arrow = up ? ArrowUpIcon : ArrowDownIcon;

  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-medium tabular-nums ${tone} ${
        variant === "badge" ? `rounded-md px-1.5 py-0.5 ${bg}` : ""
      }`}
    >
      {!flat && <Arrow className="size-3.5" />}
      <span className="sr-only">{flat ? "คงที่" : up ? "เพิ่มขึ้น" : "ลดลง"}</span>
      {formatPercent(value)}
    </span>
  );
}

// ---------- Skeleton ----------

export function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded-md bg-canvas ${className}`} />;
}
