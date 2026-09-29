import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
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

// เห็นบนจอแล้วค่อยเล่น (เลื่อนลงมาถึงส่วนไหน ส่วนนั้นค่อยขึ้น) · ลดการเคลื่อนไหว = แสดงเลย
export function useSeen(threshold = 0.3) {
  const ref = useRef(null);
  const [seen, setSeen] = useState(() => prefersReducedMotion() || typeof IntersectionObserver === "undefined");
  useEffect(() => {
    if (seen || !ref.current) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setSeen(true), { threshold });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [seen, threshold]);
  return [ref, seen];
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

// หน้าร้านกาแฟ: กันสาด + ถ้วยกาแฟในหน้าต่าง
export const StoreIcon = (p) => (
  <Icon {...p}>
    <path d="M3.5 8v8.5h13V8" />
    <path d="M2.5 4h15l-1 4a2.1 2.1 0 0 1-4 0 2.1 2.1 0 0 1-4 0 2.1 2.1 0 0 1-4 0 2.1 2.1 0 0 1-2-4Z" />
    <path d="M7.5 11.5h4v1.8a2 2 0 0 1-2 2 2 2 0 0 1-2-2Z" />
    <path d="M11.5 12h.6a1 1 0 0 1 0 2h-.8" />
  </Icon>
);

// ---------- ไอคอนกาแฟ (ชุดเดียวกับข้างบน เส้น 1.5px) ----------

// เมล็ดกาแฟ = ภาพรวม
export const BeanIcon = (p) => (
  <Icon {...p}>
    <ellipse cx="10" cy="10" rx="5" ry="7.25" transform="rotate(35 10 10)" />
    <path d="M0-6.2C2.5-2.7-2.5 2.7 0 6.2" transform="translate(10 10) rotate(35)" />
  </Icon>
);

// ถ้วยกาแฟมีไอกรุ่น = ลูกค้า (ขาประจำ)
export const CupIcon = (p) => (
  <Icon {...p}>
    <path d="M4 8.5h9v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4Z" />
    <path d="M13 9.5h.8a2 2 0 0 1 0 4H12.7" />
    <path d="M3 17.5h11" />
    <path d="M7 6c-.8-.9.8-1.6 0-2.8M10.5 6c-.8-.9.8-1.6 0-2.8" />
  </Icon>
);

// ดริปเปอร์ดริปกาแฟ = Lab (ห้องทดลองชงกราฟ)
export const DripperIcon = (p) => (
  <Icon {...p}>
    <path d="M3.5 4h13l-4 7h-5Z" />
    <path d="M8.5 11v1.5h3V11" />
    <path d="M5.5 14.5h9l-.9 3H6.4Z" />
  </Icon>
);

export const ChevronDownIcon = (p) => (
  <Icon {...p}>
    <path d="m6 8 4 4 4-4" />
  </Icon>
);

const CheckIcon = (p) => (
  <Icon {...p}>
    <path d="m4.5 10.5 3.5 3.5 7.5-8" />
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
      className={`card-sheen rounded-[var(--radius-card)] bg-surface shadow-[var(--shadow-card)] ${className}`}
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

// ---------- Select ----------

// dropdown ของตัวเอง (native <select> ใส่ animation ตอนเปิดรายการไม่ได้ เพราะเบราว์เซอร์วาดรายการเอง)
// ใช้แบบ listbox ของ WAI-ARIA: ปุ่มเปิด → รายการรับ focus, ↑/↓/Home/End เลื่อน, Enter/Space เลือก,
// Esc ปิดแล้วคืน focus ให้ปุ่ม, Tab/คลิกนอกกรอบปิดเฉย ๆ · เปิด: จางเข้า+ขยายจาก 97% · ปิด: จางออกเร็วกว่า
const CLOSE_MS = 120;

export function Select({ label, icon: LeadIcon, value, onChange, options }) {
  const [mounted, setMounted] = useState(false);
  const [closing, setClosing] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const listRef = useRef(null);
  const listId = useId();
  const open = mounted && !closing;
  const selectedIndex = Math.max(0, options.findIndex((o) => o.value === value));
  const current = options[selectedIndex];

  const show = () => {
    setActive(selectedIndex);
    setClosing(false);
    setMounted(true);
  };
  const hide = (returnFocus = true) => {
    if (!mounted) return;
    setClosing(true);
    if (returnFocus) buttonRef.current?.focus();
  };
  const choose = (i) => {
    onChange(options[i].value);
    hide();
  };

  // จบ animation ปิดแล้วค่อยถอดรายการออก
  useEffect(() => {
    if (!closing) return;
    const t = setTimeout(() => {
      setMounted(false);
      setClosing(false);
    }, CLOSE_MS);
    return () => clearTimeout(t);
  }, [closing]);

  useEffect(() => {
    if (open) listRef.current?.focus();
  }, [open]);

  // คลิก/แตะนอกกรอบ = ปิด (ไม่ดึง focus กลับ ผู้ใช้กำลังไปที่อื่น)
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => !rootRef.current?.contains(e.target) && hide(false);
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  useEffect(() => {
    if (open) listRef.current?.children[active]?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  const onButtonKey = (e) => {
    if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
      e.preventDefault();
      show();
    }
  };
  const onListKey = (e) => {
    const last = options.length - 1;
    const moves = { ArrowDown: Math.min(last, active + 1), ArrowUp: Math.max(0, active - 1), Home: 0, End: last };
    if (e.key in moves) {
      e.preventDefault();
      setActive(moves[e.key]);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      choose(active);
    } else if (e.key === "Escape") {
      e.preventDefault();
      hide();
    } else if (e.key === "Tab") {
      hide(false);
    }
  };

  return (
    <div ref={rootRef} className="relative inline-flex">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={mounted ? listId : undefined}
        aria-label={`${label}: ${current?.label ?? ""}`}
        onClick={() => (open ? hide() : show())}
        onKeyDown={onButtonKey}
        className={`relative inline-flex h-8 cursor-pointer items-center rounded-lg border bg-surface pr-8 pl-8 text-[13px] font-medium text-ink shadow-[0_1px_0_0_rgb(0_0_0/0.05)] transition-colors hover:bg-surface-hover ${
          open ? "border-chart" : "border-line-strong"
        }`}
      >
        {LeadIcon && <LeadIcon className="pointer-events-none absolute left-2.5 size-4 text-ink-subtle" />}
        {current?.label}
        <ChevronDownIcon
          className={`pointer-events-none absolute right-2 size-4 text-ink-subtle transition-transform duration-200 ease-[var(--ease-out)] ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {mounted && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          tabIndex={-1}
          aria-label={label}
          aria-activedescendant={`${listId}-${active}`}
          onKeyDown={onListKey}
          className={`absolute top-full left-0 z-30 mt-1.5 max-h-72 min-w-full origin-top-left overflow-auto rounded-lg bg-surface p-1 shadow-[0_8px_28px_rgb(0_0_0/0.18),0_0_0_1px_var(--color-line)] outline-none ${
            closing ? "dropdown-out" : "dropdown-in"
          }`}
        >
          {options.map((o, i) => {
            const selected = i === selectedIndex;
            return (
              <li
                key={o.value}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={selected}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(i)}
                className={`flex h-8 cursor-pointer items-center justify-between gap-6 rounded-md px-2.5 text-[13px] whitespace-nowrap transition-colors duration-100 ${
                  i === active ? "bg-surface-hover text-ink" : "text-ink-subtle"
                } ${selected ? "font-medium text-ink" : ""}`}
              >
                {o.label}
                <CheckIcon className={`size-3.5 text-chart ${selected ? "" : "invisible"}`} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
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
            className={`relative inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors duration-200 disabled:cursor-not-allowed disabled:text-ink-muted/50 ${
              active ? "text-ink" : "text-ink-subtle hover:text-ink"
            }`}
          >
            {o.icon && <o.icon className={`size-3.5 transition-colors duration-200 ${active ? "text-chart" : ""}`} />}
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
