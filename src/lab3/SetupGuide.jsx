import { Card, CardHeader } from "../components/ui.jsx";

const Code = ({ children }) => <code className="rounded-md bg-canvas px-1.5 py-0.5 text-xs text-ink">{children}</code>;

const STEPS = [
  <>ทำ Lab 3.1 ตาม <Code>docs/lab3/LAB3_GUIDE.md</Code> ให้เสร็จก่อน</>,
  <>คัดลอก <Code>.env.example</Code> เป็น <Code>.env</Code> แล้วใส่ค่า web config</>,
  <>หยุด <Code>npm run dev</Code> ด้วย Ctrl+C แล้วรันใหม่ (Vite อ่าน .env แค่ตอนเริ่ม)</>,
];

export default function SetupGuide() {
  return (
    <Card className="max-w-2xl animate-rise">
      <CardHeader title="ยังไม่ได้เชื่อม Firebase" subtitle="แท็บนี้ดึงยอดขายจาก Firestore ต้องตั้งค่า 3 ขั้นก่อน" />
      <ol className="space-y-2.5 px-4 pt-4 pb-4 sm:px-5">
        {STEPS.map((step, i) => (
          <li key={i} className="flex gap-3 text-[13px] leading-relaxed text-ink">
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-chart text-xs font-semibold text-on-chart tabular-nums">
              {i + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
      <p className="border-t border-line px-4 py-3 text-xs text-ink-muted sm:px-5">
        ถ้าสร้าง Firebase project ไม่ได้ (เช่น บัญชีองค์กรโดนจำกัดสิทธิ์) บอกผู้สอนเพื่อขอ checkpoint ที่มีโหมดสาธิต
        ใช้ทำ Lab 3.2 ได้เลยไม่ต้องมี Firebase
      </p>
    </Card>
  );
}
