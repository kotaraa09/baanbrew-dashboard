// Lab 3.3 · ทดสอบ Security Rules ด้วยการ "โจมตี" ฐานข้อมูลของตัวเอง
// ทุกการโจมตีควรถูกปฏิเสธ (permission-denied) ถ้าผ่านได้แปลว่า rules ยังมีช่องโหว่
// ออกแบบให้ไม่ทำลายข้อมูลจริง: เอกสารที่หลุดเข้าไปจะมีวันที่ปี 2000 (อยู่นอกทุกช่วงใน Dashboard)
// และการแก้/ลบจะทำกับเอกสารที่ไม่มีอยู่จริง
import { useEffect, useState } from "react";
import { doc, setDoc, updateDoc, deleteDoc, getDocs, collection, query, limit, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "./firebase.js";
import { AlertIcon, Card, CardHeader, CheckIcon } from "../components/ui.jsx";

const base = (uid) => ({
  order_id: "RULES-TEST", datetime: "2000-01-01T00:00:00+07:00", date: "2000-01-01", hour: 0,
  branch: "สยาม", product_id: "P004", qty: 1, unit_price: 75, revenue: 75, customer_id: null,
  payment_method: "เงินสด", channel: "หน้าร้าน", source: "web", created_by: uid, created_at: serverTimestamp(),
});
const newId = (n) => `RULES-TEST-${n}-${Date.now()}`;

const SIGNED_IN = [
  { name: "จำนวนติดลบ", why: "qty ต้องเป็น 1–20", run: (u) => setDoc(doc(db, "sales", newId(1)), { ...base(u), qty: -5, revenue: -375 }) },
  { name: "ราคาไม่ตรงกับเมนู (ลาเต้เย็น ฿1)", why: "unit_price ต้องเท่ากับราคาใน products", run: (u) => setDoc(doc(db, "sales", newId(2)), { ...base(u), unit_price: 1, revenue: 1 }) },
  { name: "ยอดรวมไม่เท่ากับ จำนวน × ราคา", why: "revenue ต้องคำนวณถูก", run: (u) => setDoc(doc(db, "sales", newId(3)), { ...base(u), revenue: 999999 }) },
  { name: "ปลอมตัวเป็นผู้ใช้อื่น", why: "created_by ต้องเป็น uid ของคนที่ล็อกอิน", run: () => setDoc(doc(db, "sales", newId(4)), base("someone-else")) },
  { name: "สาขาที่ไม่มีอยู่จริง", why: "branch ต้องเป็น 5 สาขา", run: (u) => setDoc(doc(db, "sales", newId(5)), { ...base(u), branch: "สาขาปลอม" }) },
  { name: "แอบเพิ่มฟิลด์ส่วนลด", why: "ห้ามมีฟิลด์นอกเหนือจากที่กำหนด (hasOnly)", run: (u) => setDoc(doc(db, "sales", newId(6)), { ...base(u), discount: 100 }) },
  { name: "ใส่เวลาเอง ไม่ใช้เวลาเซิร์ฟเวอร์", why: "created_at ต้องเป็น request.time", run: (u) => setDoc(doc(db, "sales", newId(7)), { ...base(u), created_at: new Date("2000-01-01") }) },
  { name: "แก้ไขยอดขายที่บันทึกแล้ว", why: "update ต้องถูกปิด", run: () => updateDoc(doc(db, "sales", "rules-test-no-such-doc"), { qty: 999 }), notFoundMeansOpen: true },
  { name: "ลบยอดขาย", why: "delete ต้องถูกปิด", run: () => deleteDoc(doc(db, "sales", "rules-test-no-such-doc")) },
  { name: "แก้ราคาเมนูจากหน้าเว็บ", why: "products เขียนได้เฉพาะ admin script", run: () => updateDoc(doc(db, "products", "rules-test-no-such-product"), { price: 1 }), notFoundMeansOpen: true },
];
const SIGNED_OUT = [
  { name: "อ่านยอดขายโดยไม่ล็อกอิน", why: "ต้องล็อกอินก่อนอ่าน", run: () => getDocs(query(collection(db, "sales"), limit(1))) },
  { name: "บันทึกยอดขายโดยไม่ล็อกอิน", why: "ต้องล็อกอินก่อนเขียน", run: () => setDoc(doc(db, "sales", newId(0)), base("no-login")) },
];

const withTimeout = (p, ms = 10000) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej({ code: "timeout" }), ms))]);

export default function RulesTester() {
  const [user, setUser] = useState(undefined);
  const [results, setResults] = useState({});
  const [running, setRunning] = useState(false);
  useEffect(() => onAuthStateChanged(auth, setUser), []);

  const tests = user ? SIGNED_IN : SIGNED_OUT;

  async function runAll() {
    setRunning(true);
    setResults({});
    for (const t of tests) {
      let r;
      try {
        await withTimeout(t.run(user?.uid));
        r = { blocked: false, detail: "ผ่านได้" };
      } catch (e) {
        if (e.code === "permission-denied") r = { blocked: true, detail: "permission-denied" };
        else if (e.code === "not-found" && t.notFoundMeansOpen) r = { blocked: false, detail: "rules อนุญาต (เอกสารทดสอบไม่มีจริงจึงไม่มีอะไรถูกแก้)" };
        else r = { blocked: null, detail: e.code ?? e.message };
      }
      setResults((s) => ({ ...s, [t.name]: r }));
    }
    setRunning(false);
  }

  const done = Object.keys(results).length === tests.length && !running;
  const passed = Object.values(results).filter((r) => r.blocked).length;

  // ข้อที่กำลังรันอยู่ = ข้อแรกที่ยังไม่มีผล (ทดสอบทีละข้อตามลำดับ)
  const current = running ? tests.find((t) => !results[t.name])?.name : null;
  const allBlocked = done && passed === tests.length;

  return (
    <div className="space-y-4">
      {/* หัวหน้าแบบเดียวกับ Lab 2.2 */}
      <header className="animate-rise">
        <h1 className="text-3xl font-bold text-ink">Lab 3.3 · ทดสอบ Security Rules</h1>
        <p className="mt-1 max-w-3xl text-ink-subtle">
          ลองโจมตีฐานข้อมูลของตัวเองด้วยคำสั่งที่ไม่ควรทำได้ ทุกข้อต้องถูกบล็อก ทำ 2 รอบ: ก่อน deploy rules
          (โหมดทดสอบ จะผ่านได้เกือบทุกข้อ) และหลัง deploy
        </p>
      </header>

      <Card className="animate-rise" style={{ animationDelay: "70ms" }}>
        <CardHeader
          title={`การโจมตี ${tests.length} ข้อ`}
          subtitle={
            user === undefined
              ? "กำลังตรวจสอบการเข้าสู่ระบบ…"
              : user
                ? `ทดสอบในฐานะ ${user.displayName ?? user.email} · ออกจากระบบแล้วกลับมาเพื่อทดสอบชุดไม่ล็อกอิน`
                : "ทดสอบในฐานะผู้ที่ยังไม่ล็อกอิน · ล็อกอินที่แท็บสดแล้วกลับมาเพื่อทดสอบชุดที่เหลือ"
          }
        >
          <button
            type="button"
            onClick={runAll}
            disabled={running || user === undefined}
            className="h-8 shrink-0 rounded-lg bg-chart px-3.5 text-[13px] font-semibold text-on-chart transition-[opacity,scale] active:scale-[0.97] disabled:cursor-wait disabled:opacity-60"
          >
            {running ? "กำลังทดสอบ…" : done ? "ทดสอบอีกครั้ง" : "เริ่มทดสอบ"}
          </button>
        </CardHeader>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="text-left text-xs text-ink-subtle">
              <tr>
                <th className="py-2 pr-3 pl-4 font-medium sm:pl-5">การโจมตี</th>
                <th className="hidden px-3 py-2 font-medium sm:table-cell">rules ที่ควรกันไว้</th>
                <th className="py-2 pr-4 pl-3 font-medium sm:pr-5">ผล</th>
              </tr>
            </thead>
            <tbody>
              {tests.map((t) => (
                <tr key={t.name} className="border-t border-line align-top transition-colors hover:bg-surface-hover">
                  <td className="py-2.5 pr-3 pl-4 sm:pl-5">
                    <span className="font-medium text-ink">{t.name}</span>
                    {/* จอแคบ: ย้ายคำอธิบายมาไว้ใต้ชื่อ แทนคอลัมน์กลาง */}
                    <span className="mt-0.5 block text-xs text-ink-subtle sm:hidden">{t.why}</span>
                  </td>
                  <td className="hidden px-3 py-2.5 text-ink-subtle sm:table-cell">{t.why}</td>
                  <td className="py-2.5 pr-4 pl-3 whitespace-nowrap sm:pr-5">
                    <Outcome result={results[t.name]} running={current === t.name} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-line px-4 py-3 sm:px-5">
          {done ? (
            <p role="status" className={`inline-flex animate-fade-in items-center gap-1.5 text-[13px] font-medium ${allBlocked ? "text-ink" : "text-down"}`}>
              {allBlocked ? <CheckIcon className="size-4 text-chart" /> : <AlertIcon className="size-4" />}
              {allBlocked
                ? `บล็อกได้ครบ ${passed}/${tests.length} ข้อ`
                : `บล็อกได้ ${passed}/${tests.length} ข้อ ตรวจ firestore.rules แล้ว deploy ใหม่`}
            </p>
          ) : (
            <p className="text-[13px] text-ink-subtle">{running ? `ทดสอบแล้ว ${Object.keys(results).length}/${tests.length} ข้อ` : "ยังไม่ได้ทดสอบ"}</p>
          )}
          <p className="text-xs text-ink-muted">เอกสารที่หลุดเข้าไปจะมี order_id = RULES-TEST และวันที่ 1 ม.ค. 2000</p>
        </div>
      </Card>
    </div>
  );
}

// ผลของการโจมตี 1 ข้อ: ถูกบล็อก (ดี) · ผ่านได้ (rules มีช่องโหว่) · ผลอื่น เช่น timeout
function Outcome({ result, running }) {
  if (running) {
    return (
      <span className="inline-flex items-center gap-1.5 text-ink-subtle">
        <span className="size-1.5 animate-pulse rounded-full bg-chart" aria-hidden="true" />
        กำลังทดสอบ
      </span>
    );
  }
  if (!result) return <span className="text-ink-muted">–</span>;
  if (result.blocked === true) {
    return (
      <span className="inline-flex animate-fade-in items-center gap-1.5 text-ink">
        <CheckIcon className="size-4 text-chart" />
        ถูกบล็อก
      </span>
    );
  }
  if (result.blocked === false) {
    return (
      <span className="inline-flex animate-fade-in flex-col gap-0.5">
        <span className="inline-flex w-fit items-center gap-1 rounded-md bg-down-bg px-1.5 py-0.5 text-xs font-medium text-down">
          <AlertIcon className="size-3.5" />
          ผ่านได้ อันตราย
        </span>
        <span className="text-xs whitespace-normal text-ink-muted">{result.detail}</span>
      </span>
    );
  }
  return (
    <span className="inline-flex animate-fade-in items-center gap-1.5 text-ink-subtle">
      <AlertIcon className="size-4" />
      {result.detail}
    </span>
  );
}
