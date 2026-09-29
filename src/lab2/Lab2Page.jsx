import * as Bad from "./BadCharts.jsx";
import * as Fixed from "./FixedCharts.jsx";
import { useSeen } from "../components/ui.jsx";

// โจทย์ของแต่ละกราฟ: คำถามทางธุรกิจที่กราฟต้องตอบ + คำถามนำให้วิจารณ์
const CASES = [
  {
    n: 1, title: "สัดส่วนยอดขายแต่ละเมนู",
    ask: "ผู้จัดการฝ่ายเมนูถาม: เมนูไหนทำเงินมากที่สุด ควรโปรโมตตัวไหน",
    probe: ["บอกได้ไหมว่าเมนูอันดับ 3 คืออะไร", "สีใช้แยกอะไร จำได้ไหมว่าสีไหนคือเมนูไหน"],
  },
  {
    n: 2, title: "ยอดขายแยกสาขา",
    ask: "เจ้าของร้านถาม: สาขาต่าง ๆ ขายได้ต่างกันมากแค่ไหน",
    probe: ["ดูด้วยตา สยามขายได้กี่เท่าของอารีย์", "ลองเทียบกับตัวเลขจริงใน Tooltip"],
  },
  {
    n: 3, title: "ยอดขายรายวัน",
    ask: "เจ้าของร้านถาม: ยอดขายโดยรวมโตขึ้นหรือลดลง",
    probe: ["เห็นแนวโน้มชัดไหม หรือเห็นแต่ความยุ่ง", "อ่านวันที่บนแกนได้ไหม"],
  },
  {
    n: 4, title: "ยอดขายรายเดือน",
    ask: "ผู้บริหารถาม: ทำไมเดือนล่าสุดยอดตก ต้องทำโปรฯ ด่วนไหม",
    probe: ["ข้อมูลเดือนล่าสุดมีกี่วัน (ดูใน README ของข้อมูล)", "ถ้าเดือนนี้ขายครบทั้งเดือนจะได้ประมาณเท่าไร"],
  },
  {
    n: 5, title: "ผลงานผู้จัดการสาขา",
    ask: "ฝ่ายบุคคลถาม: ผู้จัดการสาขาไหนควรได้รับการพัฒนาเร่งด่วน",
    probe: ["ทุกสาขาเปิดขายมานานเท่ากันไหม (ดู branches.csv)", "การเทียบแบบนี้ยุติธรรมกับผู้จัดการทุกคนไหม"],
  },
];

function Placeholder({ n }) {
  return (
    <div className="flex h-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-line-strong p-6 text-center text-ink-subtle">
      <div className="text-lg font-medium">ยังไม่ได้ซ่อม</div>
      <div className="mt-1 text-sm">
        สร้าง <code className="rounded bg-surface-hover px-1">FixedChart{n}</code> ใน <code className="rounded bg-surface-hover px-1">src/lab2/FixedCharts.jsx</code>
      </div>
    </div>
  );
}

// แต่ละโจทย์ลอยขึ้นเมื่อเลื่อนมาถึง (โจทย์ที่อยู่บนจอตั้งแต่เปิดแท็บจะขึ้นทันที ไล่ลำดับกันเล็กน้อย)
// ฝั่ง "หลังซ่อม" ตามมาช้ากว่า "ก่อนซ่อม" นิดหนึ่ง ให้อ่านเป็นลำดับ ก่อน → หลัง
function CaseSection({ c, index, rows, products }) {
  const [ref, seen] = useSeen(0.15);
  const BadC = Bad[`BadChart${c.n}`];
  const FixC = Fixed[`FixedChart${c.n}`];
  const reveal = (delay) => ({
    className: `transition-[opacity,translate] duration-700 ease-[var(--ease-out)] ${seen ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`,
    style: { transitionDelay: seen ? `${delay}ms` : "0ms" },
  });
  const base = Math.min(index, 2) * 90;
  const head = reveal(base);
  const before = reveal(base + 120);
  const after = reveal(base + 240);

  return (
    <section
      ref={ref}
      id={`case-${c.n}`}
      className={`mb-8 rounded-xl bg-surface p-5 ring-1 ring-line ${head.className}`}
      style={head.style}
    >
      <div className="flex flex-wrap items-baseline gap-x-3">
        <span className="rounded-full bg-ink px-3 py-0.5 text-sm font-semibold text-surface">กราฟ {c.n}</span>
        <h2 className="text-xl font-semibold text-ink">{c.title}</h2>
      </div>
      <p className="mt-2 font-medium text-ink">{c.ask}</p>
      <ul className="mt-1 list-disc pl-5 text-sm text-ink-subtle">
        {c.probe.map((p) => <li key={p}>{p}</li>)}
      </ul>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className={before.className} style={before.style}>
          <div className="mb-1 text-sm font-semibold text-down">ก่อนซ่อม</div>
          <div className="h-80 overflow-hidden rounded-lg bg-canvas p-2">
            <BadC rows={rows} products={products} />
          </div>
        </div>
        <div className={after.className} style={after.style}>
          <div className="mb-1 text-sm font-semibold text-up">หลังซ่อม</div>
          <div className="h-80 overflow-hidden rounded-lg bg-canvas p-2">
            {FixC ? <FixC rows={rows} products={products} /> : <Placeholder n={c.n} />}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Lab2Page({ rows, products }) {
  return (
    <div>
      <header className="mb-6 animate-rise">
        <h1 className="text-3xl font-bold text-ink">Lab 2.2 · ซ่อมกราฟแย่</h1>
        <p className="mt-1 max-w-3xl text-ink-subtle">
          กราฟซ้ายมือทุกอันใช้ข้อมูลถูกต้อง แต่ทำให้คนดูเข้าใจผิดหรืออ่านไม่ออก วิจารณ์ลงใน LAB2_WORKSHEET.md
          แล้วสั่ง AI สร้างกราฟที่ตอบคำถามได้ดีกว่าทางขวามือ
        </p>
      </header>

      {CASES.map((c, i) => (
        <CaseSection key={c.n} c={c} index={i} rows={rows} products={products} />
      ))}
    </div>
  );
}
