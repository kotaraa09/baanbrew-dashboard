// ชิ้นส่วนร่วมของแท็บ Lab 4 · ใช้ token และ Card ชุดเดียวกับทั้ง Dashboard (ดู DESIGN.md)
// สีกราฟเป็น CSS variable จึงเปลี่ยนตามธีมเช้า/ค่ำเอง
import { AlertIcon, Card as BaseCard, CardHeader, Skeleton } from "../components/ui.jsx";
import { SignInCard, VerifyEmailCard } from "../lab3/SignIn.jsx";

export const INK = "var(--color-ink)";
export const SUBTLE = "var(--color-ink-subtle)";
export const MUTED = "var(--color-bar-muted)";
export const MAIN = "var(--color-chart)";
export const BAR = "var(--color-chart-bar)";
export const SOFT = "var(--color-chart-soft)";
export const LINE = "var(--color-line)";
export const LINE_STRONG = "var(--color-line-strong)";
export const DOWN = "var(--color-down)";
// ระดับคั่วสำหรับ heatmap: กลางวันยิ่งมากยิ่งเข้ม กลางคืนยิ่งมากยิ่งสว่าง (กลับด้านใน index.css)
export const ROAST = [1, 2, 3, 4, 5].map((i) => `var(--roast-${i})`);

export const pct = (x, d = 0) => (x * 100).toFixed(d) + "%";
export const thaiDay = (iso) => new Date(iso + "T00:00:00").toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" });
export const thaiMonth = (ym) => new Date(ym + "-01T00:00:00").toLocaleDateString("th-TH", { month: "short", year: "2-digit" });

// ค่าตั้งต้นของ Recharts ให้หน้าตาเหมือนกราฟอื่นใน Dashboard
export const axis = { tick: { fontSize: 12, fill: SUBTLE }, axisLine: { stroke: LINE }, tickLine: false };
export const grid = { stroke: LINE, vertical: false };
export const legend = { wrapperStyle: { fontSize: 12, color: SUBTLE }, iconSize: 10 };
export const tooltip = {
  contentStyle: {
    background: "var(--color-surface)", border: `1px solid ${LINE}`, borderRadius: 8,
    boxShadow: "0 4px 16px rgb(0 0 0 / 0.12)", fontSize: 13, padding: "8px 12px",
  },
  labelStyle: { color: SUBTLE, fontSize: 12, marginBottom: 2 },
  itemStyle: { color: INK, padding: 0 },
  cursor: { fill: "var(--color-surface-hover)", stroke: LINE_STRONG },
};

export function Card({ title, sub, children, right }) {
  return (
    <BaseCard className="animate-rise">
      <CardHeader title={title} subtitle={sub}>{right}</CardHeader>
      <div className="px-4 pt-3 pb-4 sm:px-5 sm:pb-5">{children}</div>
    </BaseCard>
  );
}

/** แสดงแทนส่วนที่ยังคำนวณไม่ได้ เช่น ฟังก์ชันยังเป็น "ยังไม่ได้ทำ" */
export function Pending({ lab, error }) {
  return (
    <div className="rounded-lg border border-dashed border-line-strong px-4 py-6 text-center">
      <p className="text-sm font-medium text-ink">รอ {lab}</p>
      <p className="mt-1 text-[13px] text-ink-subtle">{error}</p>
    </div>
  );
}

export function Insight({ children }) {
  return <p className="mt-3 rounded-lg bg-canvas px-3.5 py-2.5 text-[13px] leading-relaxed text-ink">{children}</p>;
}

// ปุ่มรอง (ปิด, ออกจากระบบ) และปุ่มหลัก (ดาวน์โหลด) แบบเดียวกับแท็บสดและแท็บทดสอบ Rules
export const buttonClass =
  "h-8 shrink-0 rounded-lg border border-line-strong bg-surface px-3 text-[13px] font-medium text-ink shadow-[0_1px_0_0_rgb(0_0_0/0.05)] transition-[background-color,scale] hover:bg-surface-hover active:scale-[0.97]";
export const primaryButtonClass =
  "h-8 shrink-0 rounded-lg bg-chart px-3.5 text-[13px] font-semibold text-on-chart transition-[opacity,scale] hover:opacity-90 active:scale-[0.97]";

// ตาราง: หัวคอลัมน์ / แถว / แถวที่เลือก
export const thClass = "py-2 pr-3 text-xs font-medium text-ink-subtle";
export const rowClass = "border-t border-line transition-colors";

/** ส่วนหัวร่วม: ล็อกอิน, ความสดของข้อมูล, จำนวนเอกสารที่อ่าน */
export function AnalyticsShell({ source, state, title, intro, children }) {
  const { user, data, error, reload } = state;
  if (user === undefined) {
    return <p role="status" className="py-10 text-center text-[13px] text-ink-subtle">กำลังเช็กว่าล็อกอินอยู่ไหม…</p>;
  }
  // หน้าล็อกอินเดียวกับแท็บสด (อีเมล/Google และแมว)
  if (!user) return <SignInCard />;
  if (user.emailVerified === false) return <VerifyEmailCard user={user} onVerified={reload} />;
  const m = data?.meta;
  const demo = m?.builtBy === "demo";
  return (
    <div className="space-y-4">
      <header className="flex animate-rise flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold text-ink">{title}</h1>
          {intro && <p className="mt-1 max-w-3xl text-ink-subtle">{intro}</p>}
          {m && (
            <p className="mt-2 text-[13px] text-ink-subtle">
              ข้อมูลถึง <span className="font-medium text-ink">{thaiDay(m.asOf)}</span> · {m.rows?.toLocaleString()} รายการ ·{" "}
              {demo ? (
                <span className="rounded-md bg-surface-selected px-1.5 py-0.5 text-xs font-medium text-ink">โหมดสาธิต คำนวณในเบราว์เซอร์</span>
              ) : (
                <>
                  อัปเดต {m.builtAt ? new Date(m.builtAt).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" }) : "–"}{" "}
                  โดย {m.builtBy === "github-actions" ? "GitHub Actions" : "เครื่องผู้สอน/ผู้เรียน"} · อ่าน {data.reads} เอกสาร
                </>
              )}
            </p>
          )}
        </div>
        {/* ชื่อผู้ใช้และออกจากระบบอยู่ที่แถบบน · โหมดสาธิตมีแค่ปุ่มออกจากโหมด */}
        {demo && (
          <button type="button" onClick={() => source.signOut()} className={buttonClass}>ออกจากโหมดสาธิต</button>
        )}
      </header>
      {error && (
        <p role="alert" className="flex items-start gap-2 rounded-lg bg-down-bg px-3.5 py-3 text-[13px] text-down">
          <AlertIcon className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      )}
      {!data && !error && (
        <div role="status" aria-label="กำลังโหลดผลวิเคราะห์" className="space-y-4">
          <Skeleton className="h-80 rounded-[var(--radius-card)] bg-surface" />
          <Skeleton className="h-64 rounded-[var(--radius-card)] bg-surface" />
        </div>
      )}
      {data && children(data)}
    </div>
  );
}
