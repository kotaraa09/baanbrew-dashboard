import { useTweenedNumber } from "./ui.jsx";

// ตัวเลข KPI 1 ช่อง หน้าตาเดียวกับแถบ KPI ในแท็บภาพรวม (TrendCard) แต่กดไม่ได้
// value เป็นตัวเลขดิบ format เป็นฟังก์ชันจาก metrics.js เช่น formatBaht
export default function KpiCard({ label, value, format, hint }) {
  // ตัวเลขนับไปหาค่าใหม่เมื่อมียอดขายเข้ามา (เฉพาะการแสดงผล ค่าจริงไม่เปลี่ยน)
  const shown = useTweenedNumber(value);
  return (
    <div className="flex flex-col gap-1 px-3 py-2.5">
      <span className="text-[13px] font-medium text-ink-subtle">{label}</span>
      <span className="text-xl font-semibold tracking-tight text-ink tabular-nums sm:text-2xl">{format(shown)}</span>
      {hint && <span className="text-xs text-ink-muted">{hint}</span>}
    </div>
  );
}
