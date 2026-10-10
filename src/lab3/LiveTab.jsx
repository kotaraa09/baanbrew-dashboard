// Lab 3.2 · Dashboard ยอดขายแบบ real-time จาก Firestore (Prompt 3.2B)
// ฟัง collection "sales" ด้วย onSnapshot: บันทึกจากหน้าต่างอื่นแล้วหน้านี้ขยับเองโดยไม่ต้องรีเฟรช
// สูตรคำนวณทั้งหมดใช้ของเดิมจาก metrics.js (Lab 1) ไฟล์นี้แค่ดึงข้อมูลและจัดหน้า
import { useEffect, useMemo, useRef, useState } from "react";
import { collection, getDocs, onSnapshot, orderBy, query, where } from "firebase/firestore";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "./firebase.js";
import { SignInCard, VerifyEmailCard } from "./SignIn.jsx";
// เวลาที่แมวกระโดดลาหลังล็อกอินสำเร็จ (ตรงกับ timeline ใน cat/rig.js)
import { LEAVE_MS as CAT_LEAVE_MS } from "./cat/rig.js";
import { addDays, todayBangkok } from "./time.js";
import { BRANCHES } from "./saleModel.js";
import KpiCard from "../components/KpiCard.jsx";
import BranchCard from "../components/BranchCard.jsx";
import SaleForm from "./SaleForm.jsx";
import { Card, CardHeader, CupIcon, Segmented, Select, Skeleton, StoreIcon } from "../components/ui.jsx";
import {
  computeKpis,
  dailyRevenue,
  formatBaht,
  formatBahtExact,
  formatBahtShort,
  formatDate,
  formatNumber,
  formatRange,
  prepareRows,
  revenueByBranch,
} from "../lib/metrics.js";

const RANGES = [
  { value: "today", label: "วันนี้", days: 1 },
  { value: "7d", label: "7 วัน", days: 7 },
  { value: "30d", label: "30 วัน", days: 30 },
];
const HIGHLIGHT_MS = 4000;
const NB = "\u00a0"; // ให้ตัวเลขกับหน่วยอยู่บรรทัดเดียวกัน
const RECENT_LIMIT = 8;

// error จาก Firestore → ข้อความภาษาไทยที่บอกว่าต้องแก้ที่ไหน
function errorMessage(e) {
  switch (e.code) {
    case "permission-denied":
      return "Security Rules ไม่ให้อ่านยอดขาย (ล็อกอินแล้วหรือยัง หรือ rules ปิดไม่ให้อ่านอยู่)";
    case "failed-precondition":
      return "query นี้ต้องสร้าง index ใน Firestore ก่อน ลิงก์สร้าง index อยู่ใน console ของเบราว์เซอร์";
    case "resource-exhausted":
      return "โควตาอ่านฟรีของวันนี้หมดแล้ว รอให้รีเซ็ต (ตามเวลาแปซิฟิก) หรือเลือกช่วงให้สั้นลง";
    case "unavailable":
      return "ต่อ Firestore ไม่ได้ เช็กอินเทอร์เน็ตแล้วลองใหม่";
    default:
      return `อ่านข้อมูลไม่ได้: ${e.message}`;
  }
}

// ฟังยอดขายในช่วง [start, end] แบบ real-time
// เก็บเอกสารใน Map ตาม id แล้วอัปเดตจาก docChanges() เท่านั้น ไม่ต้องสร้างใหม่ทั้งชุดทุก snapshot
function useLiveSales(start, end) {
  const [state, setState] = useState({ status: "loading", docs: [] });
  const [reads, setReads] = useState(0);
  const [fresh, setFresh] = useState(() => new Set());
  const timers = useRef([]);

  useEffect(() => {
    setState({ status: "loading", docs: [] });
    const docs = new Map();
    let first = true;
    const q = query(collection(db, "sales"), where("date", ">=", start), where("date", "<=", end), orderBy("date"));

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const changes = snap.docChanges();
        // Firestore คิดค่าอ่านตามเอกสารที่ส่งมาจริง: snapshot แรก = ทั้งช่วง, ต่อจากนั้น = เฉพาะที่เปลี่ยน
        setReads((n) => n + changes.length);
        const added = [];
        for (const c of changes) {
          if (c.type === "removed") docs.delete(c.doc.id);
          else docs.set(c.doc.id, { id: c.doc.id, ...c.doc.data() });
          if (!first && c.type === "added") added.push(c.doc.id);
        }
        first = false;
        setState({ status: "ready", docs: [...docs.values()] });

        if (added.length) {
          setFresh((s) => new Set([...s, ...added]));
          const t = setTimeout(() => {
            setFresh((s) => {
              const next = new Set(s);
              added.forEach((id) => next.delete(id));
              return next;
            });
          }, HIGHLIGHT_MS);
          timers.current.push(t);
        }
      },
      (e) => setState({ status: "error", message: errorMessage(e), docs: [] })
    );

    // ต้องเลิกฟังเมื่อเปลี่ยนช่วงหรือออกจากแท็บ ไม่งั้นจะมีหลาย listener อ่านซ้อนกันและเสียโควตาเรื่อย ๆ
    return () => {
      unsubscribe();
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, [start, end]);

  return { ...state, reads, fresh };
}

// เมนูโหลดครั้งเดียวด้วย getDocs (ราคาไม่ได้เปลี่ยนบ่อย ไม่ต้องฟังแบบ real-time)
function useProducts() {
  const [products, setProducts] = useState([]);
  useEffect(() => {
    getDocs(collection(db, "products"))
      .then((snap) => setProducts(snap.docs.map((d) => ({ product_id: d.id, ...d.data() }))))
      .catch(() => setProducts([]));
  }, []);
  return products;
}

function ChartTooltip({ active, payload, label, labelFormat }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-surface px-3 py-2 text-[13px] shadow-[0_4px_16px_rgb(0_0_0/0.12),0_0_0_1px_rgb(0_0_0/0.06)]">
      <p className="text-ink-subtle">{labelFormat(label)}</p>
      <p className="font-medium text-ink tabular-nums">{formatBaht(payload[0].value)}</p>
    </div>
  );
}

const axisProps = {
  tick: { fontSize: 12, fill: "var(--color-ink-subtle)" },
  tickLine: false,
};

function HourlyChart({ rows }) {
  // ร้านเปิด 7–20 น. ถ้ามียอดนอกช่วง (เช่นทดสอบฟอร์มตอนดึก) ขยายแกนให้เห็นด้วย
  const data = useMemo(() => {
    const sums = new Map();
    for (const r of rows) {
      const h = Number(r.datetime.slice(11, 13));
      sums.set(h, (sums.get(h) ?? 0) + r.revenue);
    }
    const hours = [...sums.keys()];
    const from = Math.min(7, ...hours);
    const to = Math.max(20, ...hours);
    return Array.from({ length: to - from + 1 }, (_, i) => ({ hour: from + i, revenue: sums.get(from + i) ?? 0 }));
  }, [rows]);
  const hourLabel = (h) => `${String(h).padStart(2, "0")}:00`;

  return (
    <ResponsiveContainer>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="var(--color-line)" vertical={false} />
        <XAxis dataKey="hour" tickFormatter={(h) => String(h).padStart(2, "0")} axisLine={{ stroke: "var(--color-line)" }} {...axisProps} />
        <YAxis tickFormatter={formatBahtShort} axisLine={false} width={56} {...axisProps} />
        <Tooltip content={<ChartTooltip labelFormat={(h) => `${hourLabel(h)}–${hourLabel(h + 1)}`} />} cursor={{ fill: "var(--color-surface-hover)" }} />
        <Bar dataKey="revenue" fill="var(--color-chart-bar)" radius={[3, 3, 0, 0]} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function DailyChart({ rows, start, end }) {
  // dailyRevenue คืนเฉพาะวันที่มียอด เติมวันที่ไม่มียอดเป็น 0 ไม่ให้เส้นกระโดดข้ามวัน
  const data = useMemo(() => {
    const byDate = new Map(dailyRevenue(rows).map((d) => [d.date, d.revenue]));
    const out = [];
    for (let d = start; d <= end; d = addDays(d, 1)) out.push({ date: d, revenue: byDate.get(d) ?? 0 });
    return out;
  }, [rows, start, end]);

  return (
    <ResponsiveContainer>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="var(--color-line)" vertical={false} />
        <XAxis dataKey="date" tickFormatter={(d) => formatDate(d, false)} minTickGap={32} tickMargin={8} axisLine={{ stroke: "var(--color-line)" }} {...axisProps} />
        <YAxis tickFormatter={formatBahtShort} axisLine={false} width={56} {...axisProps} />
        <Tooltip content={<ChartTooltip labelFormat={(d) => formatDate(d)} />} cursor={{ stroke: "var(--color-line-strong)" }} />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="var(--color-chart)"
          strokeWidth={2.25}
          dot={false}
          activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--color-surface)" }}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function RecentTable({ rows, products, fresh }) {
  const recent = useMemo(
    () => [...rows].sort((a, b) => b.datetime.localeCompare(a.datetime)).slice(0, RECENT_LIMIT),
    [rows]
  );
  const name = (id) => products.find((p) => p.product_id === id)?.product_name ?? id;

  return (
    <Card>
      <CardHeader title="รายการล่าสุด" subtitle={`${RECENT_LIMIT} รายการหลังสุดในช่วงที่เลือก · แถวที่เพิ่งเข้ามาจะไฮไลต์ไว้ 4${NB}วินาที`} />
      {recent.length === 0 ? (
        <p className="px-5 py-8 text-center text-[13px] text-ink-subtle">ยังไม่มีรายการในช่วงนี้</p>
      ) : (
        <div className="mt-2 overflow-x-auto pb-2">
          <table className="w-full text-[13px]">
            <thead className="text-left text-xs text-ink-subtle">
              <tr>
                <th className="px-4 py-2 font-medium sm:pl-5">เวลา</th>
                <th className="px-3 py-2 font-medium">สาขา</th>
                <th className="px-3 py-2 font-medium">เมนู</th>
                <th className="px-3 py-2 text-right font-medium">จำนวน</th>
                <th className="px-4 py-2 text-right font-medium sm:pr-5">ยอด</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((r) => (
                <tr
                  key={r.id}
                  className={`border-t border-line transition-colors duration-700 ${
                    fresh.has(r.id) ? "bg-chart/15" : "hover:bg-surface-hover"
                  }`}
                >
                  <td className="px-4 py-2 whitespace-nowrap text-ink-subtle tabular-nums sm:pl-5">
                    {formatDate(r.date, false)} {r.datetime.slice(11, 16)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-ink">{r.branch}</td>
                  <td className="px-3 py-2 text-ink">
                    {name(r.product_id)}
                    {r.source === "web" && <span className="ml-1.5 rounded-md bg-surface-selected px-1.5 py-0.5 text-xs text-ink-subtle">เว็บ</span>}
                  </td>
                  <td className="px-3 py-2 text-right text-ink tabular-nums">{r.qty}</td>
                  <td className="px-4 py-2 text-right font-medium text-ink tabular-nums sm:pr-5">{formatBaht(r.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

// Dashboard จริง: render เมื่อล็อกอินแล้วเท่านั้น จึงไม่มี onSnapshot เริ่มก่อนรู้ว่าเป็นใคร
function LiveDashboard({ user }) {
  const [rangeKey, setRangeKey] = useState("7d");
  const [branch, setBranch] = useState("all");

  // "วันนี้" ตามเวลาไทย คำนวณใหม่ทุกครั้งที่เปลี่ยนช่วง
  const range = useMemo(() => {
    const end = todayBangkok();
    const { days } = RANGES.find((r) => r.value === rangeKey);
    return { start: addDays(end, -(days - 1)), end, days };
  }, [rangeKey]);

  const live = useLiveSales(range.start, range.end);
  const products = useProducts();

  const view = useMemo(() => {
    const all = prepareRows(live.docs);
    // กรองสาขาฝั่งเบราว์เซอร์: เปลี่ยนสาขาไม่ต้องอ่านจาก Firestore ใหม่
    const rows = branch === "all" ? all : all.filter((r) => r.branch === branch);
    return { rows, kpis: computeKpis(rows), branches: revenueByBranch(all) };
  }, [live.docs, branch]);

  const rangeLabel = range.days === 1 ? formatDate(range.end) : formatRange(range.start, range.end);
  const scope = branch === "all" ? "ทุกสาขา" : `สาขา${branch}`;

  return (
    // จอกว้าง: Dashboard ซ้าย ฟอร์มขวา (ติดอยู่ตอนเลื่อน) · จอแคบ: ฟอร์มต่อท้าย Dashboard
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0 space-y-4">
        <div className="flex animate-rise flex-wrap items-center gap-2">
          <Segmented label="ช่วงเวลา" value={rangeKey} onChange={setRangeKey} options={RANGES} />
          <Select
            label="สาขา"
            icon={StoreIcon}
            value={branch}
            onChange={setBranch}
            options={[{ value: "all", label: "ทุกสาขา" }, ...BRANCHES.map((b) => ({ value: b, label: b }))]}
          />
          <p className="text-[13px] text-ink-subtle">{rangeLabel}</p>
          <p className="ml-auto flex items-center gap-2 text-[13px] text-ink-subtle" title="นับเอกสารที่อ่านจากทุก snapshot ตั้งแต่เปิดหน้านี้">
            <span className="relative flex size-2" aria-hidden="true">
              {live.status === "ready" && <span className="absolute inset-0 animate-ping rounded-full bg-chart opacity-60 [animation-duration:2.4s]" />}
              <span className={`relative size-2 rounded-full ${live.status === "ready" ? "bg-chart" : live.status === "error" ? "bg-down" : "bg-line-strong"}`} />
            </span>
            {live.status === "ready" ? "สด" : live.status === "error" ? "เชื่อมต่อไม่ได้" : "กำลังเชื่อมต่อ"}
            <span className="text-ink-muted">· อ่านเอกสารไปแล้ว</span>
            <span className="font-medium text-ink tabular-nums">{formatNumber(live.reads)}</span>
          </p>
        </div>

        {live.status === "error" && (
          <Card className="px-5 py-4">
            <p className="text-sm font-semibold text-down">อ่านยอดขายไม่ได้</p>
            <p className="mt-1 text-[13px] text-ink-subtle">{live.message}</p>
          </Card>
        )}

        {live.status === "loading" && (
          <div className="space-y-4" aria-busy="true" aria-label="กำลังโหลดยอดขาย">
            <Skeleton className="h-24 rounded-[var(--radius-card)] bg-surface" />
            <Skeleton className="h-72 rounded-[var(--radius-card)] bg-surface" />
          </div>
        )}

        {live.status === "ready" && (
          <>
            <Card className="animate-rise p-2" style={{ animationDelay: "70ms" }}>
              <div className="grid grid-cols-2 gap-1 lg:grid-cols-4">
                <KpiCard label="ยอดขายรวม" value={view.kpis.totalRevenue} format={formatBaht} />
                <KpiCard label="จำนวนบิล" value={view.kpis.orderCount} format={formatNumber} />
                <KpiCard label="ยอดเฉลี่ยต่อบิล" value={view.kpis.avgOrderValue} format={formatBahtExact} />
                <KpiCard label="ลูกค้าสมาชิก" value={view.kpis.memberCount} format={formatNumber} />
              </div>
              <div className="border-t border-line px-2 pt-4 pb-2 sm:px-3">
                <p className="mb-3 text-xs text-ink-subtle">
                  {range.days === 1 ? "ยอดขายแต่ละชั่วโมง" : "ยอดขายแต่ละวัน"} · {scope} · {rangeLabel}
                </p>
                {view.rows.length === 0 ? (
                  <div className="flex h-64 flex-col items-center justify-center rounded-lg bg-surface-hover text-center">
                    <CupIcon className="mb-2 size-7 text-chart-soft" />
                    <p className="text-sm font-medium text-ink">ยังไม่มียอดขาย{range.days === 1 ? "วันนี้" : "ในช่วงนี้"}</p>
                    <p className="mt-1 max-w-xs text-[13px] text-ink-subtle">
                      {range.days === 1
                        ? "ข้อมูลที่ import มามีถึงเมื่อวาน ยอดวันนี้จะขึ้นตอนบันทึกจากฟอร์ม"
                        : "ลองเลือกช่วงให้ยาวขึ้น หรือเปลี่ยนเป็นทุกสาขาดู"}
                    </p>
                  </div>
                ) : (
                  <div className="h-64" role="img" aria-label={`กราฟยอดขาย ${scope} ${rangeLabel}`}>
                    {range.days === 1 ? <HourlyChart rows={view.rows} /> : <DailyChart rows={view.rows} start={range.start} end={range.end} />}
                  </div>
                )}
              </div>
            </Card>

            <div className="grid gap-4 xl:grid-cols-2">
              <div className="animate-rise" style={{ animationDelay: "140ms" }}>
                <BranchCard data={view.branches} subtitle={`ทุกสาขา · ${rangeLabel}`} hasComparison={false} highlight={branch} />
              </div>
              <div className="animate-rise" style={{ animationDelay: "200ms" }}>
                <RecentTable rows={view.rows} products={products} fresh={live.fresh} />
              </div>
            </div>
          </>
        )}
      </div>

      <div className="animate-rise lg:sticky lg:top-4" style={{ animationDelay: "120ms" }}>
        <SaleForm products={products} uid={user.uid} />
      </div>
    </div>
  );
}

// ---------- Lab 3.3 · ต้องล็อกอินก่อนเห็นยอดขาย (Prompt 3.3A · หน้าล็อกอินอยู่ใน SignIn.jsx) ----------

export default function LiveTab() {
  // undefined = ยังไม่รู้ (Firebase กำลังอ่าน session เดิม), null = ไม่ได้ล็อกอิน
  const [user, setUser] = useState(undefined);
  // user.reload() แก้ object เดิม (ไม่ใช่ object ใหม่) จึงต้องบังคับ render เองหลังยืนยันอีเมล
  const [, setVerifiedTick] = useState(0);
  // เพิ่งล็อกอินจากหน้านี้: ค้างหน้าล็อกอินไว้ให้แมวกระโดดลาก่อน แล้วค่อยเปิด Dashboard
  // (เปิดหน้ามาแล้วล็อกอินอยู่แล้วจะไม่เล่น เพราะไม่ได้เห็นหน้าล็อกอินตั้งแต่แรก)
  const [celebrating, setCelebrating] = useState(false);

  useEffect(() => {
    let prev;
    let timer = 0;
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (prev === null && u) {
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (!reduce) {
          setCelebrating(true);
          timer = setTimeout(() => setCelebrating(false), CAT_LEAVE_MS);
        }
      }
      prev = u;
      setUser(u);
    });
    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  if (user === undefined) {
    return (
      <p role="status" className="py-10 text-center text-[13px] text-ink-subtle">
        กำลังเช็กว่าล็อกอินอยู่ไหม…
      </p>
    );
  }
  // ตำแหน่งเดียวกันทั้งสองกรณี React จึงเก็บ state ของฟอร์มไว้ (อีเมลที่พิมพ์ไม่หายระหว่างแมวกระโดด)
  if (!user || celebrating) return <SignInCard success={!!user} />;
  // บัญชี Google ยืนยันอีเมลมาแล้วเสมอ หน้านี้จึงขึ้นเฉพาะบัญชีอีเมลที่ยังไม่กดลิงก์
  if (!user.emailVerified) return <VerifyEmailCard user={user} onVerified={() => setVerifiedTick((n) => n + 1)} />;

  return (
    // ชื่อผู้ใช้และปุ่มออกจากระบบอยู่ที่แถบบน (components/Account.jsx) แล้ว
    <div className="space-y-3">
      {/* key = uid: เปลี่ยนบัญชีแล้วเริ่ม Dashboard ใหม่ทั้งหมด ไม่ค้างข้อมูลของคนก่อน */}
      <LiveDashboard key={user.uid} user={user} />
    </div>
  );
}
