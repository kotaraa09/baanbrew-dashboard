import { useId } from "react";

// ตราบ้านบรู: เหรียญทองตันผ่ากลางด้วยร่องเมล็ดกาแฟรูปตัว S (บรู) ใต้หลังคาเส้นบางหนึ่งเส้น (บ้าน)
// มินิมอล: รูปทรงแค่สองชิ้น ความหรูมาจากทองเปลวไล่แสงกับแสงวาบที่วิ่งผ่านทั้งเหรียญและหลังคา
// ทุกส่วนเป็น mask ชิ้นเดียว (เหรียญ − ร่อง + หลังคา) ทองกับแสงวาบจึงไหลต่อเนื่องเป็นผิวเดียวกัน
// ถ้าแก้รูปทรง ให้แก้ public/favicon.svg ด้วย (รูปเดียวกันแต่สีตายตัว เส้นหนากว่าเพื่อให้เห็นที่ 16px)
const ROOF = "M4 24 24 7l20 17"; // ห่างขอบเหรียญ ~3px
const CREASE = "M24 16c7.9 8.6-7.9 18.6 0 30"; // ร่องเมล็ดกาแฟ ตัดผ่านเหรียญจากบนลงล่าง

export function LogoMark({ className = "size-11" }) {
  const id = useId().replace(/:/g, "");
  const foil = `foil-${id}`;
  const shape = `shape-${id}`;

  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={foil} x1="8" y1="6" x2="40" y2="46" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="var(--color-gold-hi)" />
          <stop offset=".3" stopColor="var(--color-gold)" />
          <stop offset=".55" stopColor="var(--color-gold-lo)" />
          <stop offset=".8" stopColor="var(--color-gold)" />
          <stop offset="1" stopColor="var(--color-gold-hi)" />
        </linearGradient>
        <mask id={shape} maskUnits="userSpaceOnUse" x="0" y="0" width="48" height="48">
          <circle cx="24" cy="31" r="15" fill="#fff" />
          <path d={CREASE} fill="none" stroke="#000" strokeWidth="2.3" strokeLinecap="round" />
          <path d={ROOF} fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </mask>
      </defs>

      <g mask={`url(#${shape})`}>
        <rect width="48" height="48" fill={`url(#${foil})`} />
        <rect className="logo-glint" x="0" y="0" width="9" height="48" fill="#fff8e6" opacity=".6" />
      </g>
    </svg>
  );
}

// ตรา + ชื่อ ใช้บนวิดีโอของ hero ซึ่งเปลี่ยนตามธีม (เช้า = พื้นครีม, ค่ำ = พื้นเอสเปรสโซ) จึงใช้สีจาก token
export default function Logo() {
  return (
    <div className="logo flex items-center gap-3">
      <LogoMark className="size-9 shrink-0 sm:size-10" />
      <div className="leading-none">
        <h1 className="font-display pb-0.5 text-[21px] leading-none font-semibold tracking-tight text-wordmark sm:text-[23px]">
          บ้านบรู<span className="sr-only"> Dashboard</span>
        </h1>
        <p className="mt-1 text-[9px] font-medium tracking-[0.3em] text-ink-subtle uppercase">
          Baan Brew · Est. 2023
        </p>
      </div>
    </div>
  );
}
