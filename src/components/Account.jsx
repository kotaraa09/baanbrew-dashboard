import { useState } from "react";

// มุมขวาบนของแถบบน: ปุ่มเข้าสู่ระบบปุ่มเดียวของทั้งเว็บ หรือชื่อผู้ใช้ + ออกจากระบบ
// (หน้าที่ต้องล็อกอินไม่มีปุ่มของตัวเองอีกแล้ว)

function Avatar({ user }) {
  const [broken, setBroken] = useState(false);
  const initial = (user.displayName ?? user.email ?? "?").trim().charAt(0).toUpperCase();
  return user.photoURL && !broken ? (
    // no-referrer: รูปโปรไฟล์ Google บางครั้งไม่ยอมโหลดถ้าส่ง referrer จาก localhost
    <img src={user.photoURL} alt="" referrerPolicy="no-referrer" onError={() => setBroken(true)} className="size-7 rounded-full ring-1 ring-line" />
  ) : (
    <span aria-hidden="true" className="inline-flex size-7 items-center justify-center rounded-full bg-chart text-xs font-semibold text-on-chart">
      {initial}
    </span>
  );
}

export default function Account({ user, onSignIn, onSignOut, hideSignIn }) {
  if (user === undefined) return null; // ยังไม่รู้ว่าล็อกอินอยู่ไหม ไม่แสดงอะไรดีกว่ากะพริบ
  if (!user) {
    if (hideSignIn) return null;
    return (
      <button
        type="button"
        onClick={onSignIn}
        className="h-9 shrink-0 rounded-lg bg-chart px-3 text-sm whitespace-nowrap sm:px-4 font-semibold text-on-chart shadow-[0_1px_0_0_rgb(0_0_0/0.05)] transition-[opacity,scale] hover:opacity-90 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chart"
      >
        เข้าสู่ระบบ
      </button>
    );
  }
  return (
    <div className="flex shrink-0 items-center gap-2">
      <Avatar user={user} />
      <span className="hidden max-w-40 truncate text-[13px] text-ink-subtle lg:inline">{user.displayName ?? user.email}</span>
      {/* จอแคบ: เหลือแค่ไอคอน (ชื่อปุ่มยังอยู่ใน aria-label) ไม่ให้แถบบนบีบสวิตช์ธีม */}
      <button
        type="button"
        onClick={onSignOut}
        aria-label="ออกจากระบบ"
        className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-line-strong bg-surface px-2 text-[13px] font-medium whitespace-nowrap text-ink sm:px-3 shadow-[0_1px_0_0_rgb(0_0_0/0.05)] transition-[background-color,scale] hover:bg-surface-hover active:scale-[0.97]"
      >
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="size-4 sm:hidden" aria-hidden="true">
          <path d="M8 4H5.5A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8M12.5 13.5 16 10l-3.5-3.5M16 10H8" />
        </svg>
        <span className="hidden sm:inline">ออกจากระบบ</span>
      </button>
    </div>
  );
}
