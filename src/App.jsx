import { lazy, Suspense, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import Papa from "papaparse";
import TrendCard from "./components/TrendCard.jsx";
import BranchCard from "./components/BranchCard.jsx";
import TopProductsCard from "./components/TopProductsCard.jsx";
import ReplayCard, { MS_PER_WEEK } from "./components/ReplayCard.jsx";
import TracePanel from "./components/TracePanel.jsx";
import ThemeToggle from "./components/ThemeToggle.jsx";
import DataHeadline from "./components/DataHeadline.jsx";
import RoastCalendarCard from "./components/RoastCalendarCard.jsx";
import BranchRhythmCard from "./components/BranchRhythmCard.jsx";
import MenuMatrixCard from "./components/MenuMatrixCard.jsx";
import BillStory from "./components/story/BillStory.jsx";
import HourClockCard from "./components/HourClockCard.jsx";
import SectionBand from "./components/SectionBand.jsx";
import { BeanIcon, Card, CalendarIcon, Collapsible, CupIcon, DripperIcon, LiveIcon, Select, ShieldIcon, Skeleton, StoreIcon } from "./components/ui.jsx";
import Logo from "./components/Logo.jsx";
import PageNav, { NextPage } from "./components/PageNav.jsx";
import Account from "./components/Account.jsx";
import { useAuthUser } from "./lab3/useAuthUser.js";
import Lab2Page from "./lab2/Lab2Page.jsx";
import CustomersView from "./components/CustomersView.jsx";
// Lab 3 โหลดแบบ lazy: Firebase SDK จะถูกดาวน์โหลดเมื่อเปิดแท็บสด/ทดสอบ Rules เท่านั้น
const Lab3Page = lazy(() => import("./lab3/Lab3Page.jsx"));
// Lab 4 อ่านผลวิเคราะห์จาก collection analytics (หรือคำนวณเองในโหมดสาธิต ?demo) ไม่ได้ใช้ข้อมูลของแท็บอื่น
const Lab4Page = lazy(() => import("./lab4/Lab4Page.jsx"));
import {
  prepareRows,
  computeKpis,
  resolveRange,
  defaultGranularity,
  filterRows,
  timeSeries,
  movingAverage,
  revenueByBranch,
  topProducts,
  replayFrames,
  drinkIds,
  salesByHour,
  dailyCalendar,
  formatDate,
  formatRange,
  RANGE_OPTIONS,
} from "./lib/metrics.js";

function loadCsv(url) {
  return new Promise((resolve, reject) =>
    Papa.parse(url, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (result) => resolve(result.data),
      error: (err) => reject(err),
    })
  );
}

function useDashboardData() {
  const [state, setState] = useState({ status: "loading" });

  useEffect(() => {
    // branches.csv ใช้แค่กับ Replay (พิกัด, ประเภท, วันเปิด) โหลดไม่ได้ก็ยังแสดง Dashboard ได้
    // เก็บเฉพาะแถวที่มีคอลัมน์ branch จริง: ถ้าไม่มีไฟล์ dev server จะส่ง index.html (200) มาแทน ซึ่ง PapaParse ก็อ่านได้
    const branchCsv = loadCsv(`${import.meta.env.BASE_URL}branches.csv`)
      .then((list) => list.filter((b) => b.branch))
      .catch(() => []);
    // customers.csv ใช้แค่แท็บลูกค้า โหลดไม่ได้ก็ยังแสดงแท็บอื่นได้ (กรองแบบเดียวกับ branches.csv)
    const customerCsv = loadCsv(`${import.meta.env.BASE_URL}customers.csv`)
      .then((list) => list.filter((c) => c.customer_id))
      .catch(() => []);
    // วันหยุดนักขัตฤกษ์ใช้ในเรื่องเล่าและปฏิทิน โหลดไม่ได้ก็แค่ไม่มีไฮไลต์วันหยุด
    const holidayCsv = loadCsv(`${import.meta.env.BASE_URL}thai_holidays.csv`)
      .then((list) => list.filter((h) => h.date))
      .catch(() => []);
    Promise.all([loadCsv(`${import.meta.env.BASE_URL}sales.csv`), loadCsv(`${import.meta.env.BASE_URL}products.csv`), branchCsv, customerCsv, holidayCsv])
      .then(([sales, products, branchInfo, customers, holidayList]) => {
        const rows = prepareRows(sales);
        if (rows.length === 0) throw new Error("ในไฟล์ sales.csv ไม่มีข้อมูลเลย");
        let first = rows[0].date;
        let last = rows[0].date;
        for (const r of rows) {
          if (r.date < first) first = r.date;
          if (r.date > last) last = r.date;
        }
        const branches = [...new Set(rows.map((r) => r.branch))].sort((a, b) => a.localeCompare(b, "th"));
        const holidays = new Map(holidayList.map((h) => [h.date, h.holiday]));
        setState({ status: "ready", rows, products, branchInfo, customers, first, last, branches, holidays });
      })
      .catch((err) => setState({ status: "error", message: err.message ?? String(err) }));
  }, []);

  return state;
}

function LoadingState() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="กำลังโหลดข้อมูล">
      <Card className="p-2">
        <div className="grid grid-cols-2 gap-1 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="space-y-2 px-3 py-2.5">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-7 w-32" />
            </div>
          ))}
        </div>
        <div className="border-t border-line p-3">
          <Skeleton className="h-72 w-full" />
        </div>
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-64 rounded-[var(--radius-card)] bg-surface" />
        <Skeleton className="h-64 rounded-[var(--radius-card)] bg-surface" />
      </div>
    </div>
  );
}

function ErrorState({ message }) {
  return (
    <Card className="px-5 py-8 text-center">
      <p className="text-sm font-semibold text-ink">โหลดข้อมูลไม่ขึ้น</p>
      <p className="mx-auto mt-1 max-w-md text-[13px] text-ink-subtle">
        {message}. ลองดูว่ามีไฟล์ <code>public/sales.csv</code> กับ <code>public/products.csv</code> อยู่ไหม แล้วรีเฟรชหน้านี้ใหม่
      </p>
    </Card>
  );
}

function Dashboard({ data }) {
  const [rangeKey, setRangeKey] = useState("30d");
  const [branch, setBranch] = useState("all");
  const [metricKey, setMetricKey] = useState("revenue");
  const [replayOpen, setReplayOpen] = useState(false);
  // เปิดครั้งแรกแล้วเก็บเฟรมไว้ ตอนปิดการ์ดยังต้องใช้ระหว่าง animation หด
  const [replayUsed, setReplayUsed] = useState(false);
  // เพิ่มทุกครั้งที่เปิด → ReplayCard ใหม่เสมอ แม้เปิดซ้ำระหว่างที่การ์ดเก่ายังหดไม่เสร็จ
  const [replaySession, setReplaySession] = useState(0);
  const replayButtonRef = useRef(null);
  const returnFocus = useRef(false);
  const [trace, setTrace] = useState(null);

  // คำนวณเฉพาะตอนเปิด Replay ไม่ให้หน้าแรกโหลดช้าลง
  const frames = useMemo(
    () => (replayUsed ? replayFrames(data.rows, data.branchInfo, data.first, data.last) : null),
    [replayUsed, data]
  );
  const allDays = resolveRange("all", data.first, data.last).days;
  const replayMonths = Math.round(allDays / 30.44);
  const replaySeconds = Math.round(((allDays / 7) * MS_PER_WEEK) / 1000 / 5) * 5;
  // แท่งตัวอย่างบนการ์ดเชิญ: ยอดขายรวมของแต่ละสาขา (เรียงตามแผนที่คร่าว ๆ ไม่ต้องตรง)
  const branchTotals = useMemo(() => {
    const sum = new Map();
    for (const r of data.rows) sum.set(r.branch, (sum.get(r.branch) ?? 0) + r.revenue);
    const max = Math.max(...sum.values());
    return [...sum.entries()].map(([branch, v]) => ({ branch, share: v / max }));
  }, [data.rows]);

  const range = useMemo(() => resolveRange(rangeKey, data.first, data.last), [rangeKey, data]);
  const [granularity, setGranularity] = useState(() => defaultGranularity(range.days));

  const changeRange = (key) => {
    setRangeKey(key);
    setGranularity(defaultGranularity(resolveRange(key, data.first, data.last).days));
  };

  const branchRows = useMemo(
    () => (branch === "all" ? data.rows : data.rows.filter((r) => r.branch === branch)),
    [data, branch]
  );

  // ค่าเฉลี่ย 7 วัน ใช้เฉพาะตอนดูรายวันในช่วงยาวกว่า 90 วัน (365 วัน / ทั้งหมด) ที่เส้นรายวันยุ่งจนอ่านไม่ออก
  // ช่วง 7/30/90 วันอ่านเส้นรายวันได้อยู่แล้ว และมีเส้นช่วงก่อนหน้าให้เทียบ ถ้าเพิ่มอีกเส้นจะรก
  const average = useMemo(
    () =>
      granularity === "day" && range.days > 90
        ? movingAverage(branchRows, range.start, range.end, data.first)
        : null,
    [branchRows, range, granularity, data.first]
  );

  const drinks = useMemo(() => drinkIds(data.products), [data.products]);
  const holidaySet = useMemo(() => new Set(data.holidays.keys()), [data.holidays]);
  // จังหวะของสาขาเทียบทุกสาขาเสมอ ใช้แค่ช่วงเวลาจากตัวกรอง
  const rangeRows = useMemo(() => filterRows(data.rows, { ...range, branch: "all" }), [data.rows, range]);
  const currentRows = useMemo(() => filterRows(data.rows, { ...range, branch }), [data.rows, range, branch]);

  const view = useMemo(() => {
    const current = filterRows(data.rows, { ...range, branch });
    const previous = range.previous ? filterRows(data.rows, { ...range.previous, branch }) : null;
    // เทียบสาขา: ใช้ทุกสาขาเสมอ เพื่อให้เห็นว่าสาขาที่เลือกอยู่ตรงไหน
    const allBranches = branch === "all" ? current : filterRows(data.rows, { ...range, branch: "all" });
    const allBranchesPrev =
      range.previous && (branch === "all" ? previous : filterRows(data.rows, { ...range.previous, branch: "all" }));

    return {
      kpis: computeKpis(current),
      previousKpis: previous ? computeKpis(previous) : null,
      series: timeSeries(current, range.start, range.end, granularity),
      previousSeries: previous ? timeSeries(previous, range.previous.start, range.previous.end, granularity) : null,
      branches: revenueByBranch(allBranches, allBranchesPrev || null),
      products: topProducts(current, data.products),
      hours: salesByHour(current, drinks),
      calendar: dailyCalendar(branchRows, range.start, range.end),
    };
  }, [data, range, branch, granularity, drinks, branchRows]);
  const peakHour = view.hours.some((h) => h.cups > 0)
    ? view.hours.reduce((best, h) => (h.cups > view.hours[best].cups ? h.hour : best), 0)
    : null;

  const rangeLabel = formatRange(range.start, range.end);

  const openReplay = () => {
    setReplayUsed(true);
    setReplaySession((s) => s + 1);
    setReplayOpen(true);
  };
  const closeReplay = () => {
    returnFocus.current = true;
    setReplayOpen(false);
  };
  // ปิดการ์ดแล้วส่ง focus กลับปุ่มเปิด (ปุ่มกลับมา render ตอน replayOpen = false)
  useEffect(() => {
    if (!replayOpen && returnFocus.current) {
      returnFocus.current = false;
      replayButtonRef.current?.focus();
    }
  }, [replayOpen]);

  // ที่มาของตัวเลข: เก็บเงื่อนไขกรองไว้ตอนกด แผงจะคำนวณใหม่จาก data.rows ด้วยกติกาเดียวกับการ์ด
  const branchTag = (name) => data.branchInfo.find((b) => b.branch === name)?.branch_id ?? name;
  const openTrace = (kind, extra = {}) =>
    setTrace({
      kind,
      start: range.start,
      end: range.end,
      branch,
      fileTag: [kind, branch !== "all" && branchTag(branch)].filter(Boolean).join("_"),
      ...extra,
    });

  return (
    <>
      <BillStory data={data} holidays={holidaySet} />

      <DataHeadline
        key={`${rangeKey}|${branch}`}
        rangeLabel={RANGE_OPTIONS.find((o) => o.key === rangeKey).label}
        branch={branch}
        kpis={view.kpis}
        previousKpis={view.previousKpis}
        branches={view.branches}
        topProduct={view.products[0]?.name}
        peakHour={peakHour}
      />

      {/* เปิดหน้า: แต่ละส่วนค่อย ๆ ลอยขึ้นตามลำดับ (เล่นครั้งเดียวตอนข้อมูลโหลดเสร็จ) */}
      <div className="flex animate-rise flex-wrap items-center gap-2">
        <Select
          label="ช่วงเวลา"
          icon={CalendarIcon}
          value={rangeKey}
          onChange={changeRange}
          options={RANGE_OPTIONS.map((o) => ({ value: o.key, label: o.label }))}
        />
        <Select
          label="สาขา"
          icon={StoreIcon}
          value={branch}
          onChange={setBranch}
          options={[{ value: "all", label: "ทุกสาขา" }, ...data.branches.map((b) => ({ value: b, label: b }))]}
        />
        <p className="text-[13px] text-ink-subtle">
          {range.previous
            ? `เทียบกับ ${formatRange(range.previous.start, range.previous.end)}`
            : "ช่วงนี้ไม่มีช่วงก่อนหน้าให้เทียบ"}
        </p>
      </div>

      {!replayOpen && (
        <button ref={replayButtonRef} type="button" onClick={openReplay} className="replay-cta theme-dark animate-rise">
          <img src={`${import.meta.env.BASE_URL}media/band-dusk-sm.webp`} alt="" className="replay-cta-bg" />
          <span className="replay-cta-play" aria-hidden="true">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path d="M6 4.2v11.6a.6.6 0 0 0 .9.5l9.2-5.8a.6.6 0 0 0 0-1L6.9 3.7a.6.6 0 0 0-.9.5Z" />
            </svg>
          </span>
          <span className="replay-cta-copy">
            <span className="replay-cta-eyebrow">ไทม์ไลน์ยอดขายแยกสาขา · {replayMonths} เดือน</span>
            <span className="replay-cta-title font-display">ดูบ้านบรูโตขึ้นทีละอาทิตย์</span>
            <span className="replay-cta-sub">
              {data.branches.length} สาขาเป็นแท่ง 3 มิติบนแผนที่ กดแล้วเล่นเองประมาณ {replaySeconds} วินาที
            </span>
          </span>
          <span className="replay-cta-3d" aria-hidden="true">
            <span className="replay-cta-floor">
              {branchTotals.map((b, k) => (
                <span key={b.branch} className="r3d-col" style={{ left: `${18 + k * 16}%`, top: `${30 + (k % 2) * 34}%`, "--h": `${10 + b.share * 46}px` }}>
                  <i className="r3d-face is-n" />
                  <i className="r3d-face is-s" />
                  <i className="r3d-face is-w" />
                  <i className="r3d-face is-e" />
                  <i className="r3d-face is-top" />
                </span>
              ))}
            </span>
          </span>
        </button>
      )}

      <Collapsible open={replayOpen}>
        {frames && <ReplayCard key={replaySession} frames={frames} branchInfo={data.branchInfo} onClose={closeReplay} />}
      </Collapsible>

      <div className="animate-rise" style={{ animationDelay: "70ms" }}>
      <TrendCard
        kpis={view.kpis}
        previousKpis={view.previousKpis}
        series={view.series}
        previousSeries={view.previousSeries}
        range={range}
        metricKey={metricKey}
        onMetricChange={setMetricKey}
        granularity={granularity}
        onGranularityChange={setGranularity}
        movingAverage={average}
        onTrace={(key) => openTrace(key)}
      />
      </div>

      <BranchRhythmCard rows={rangeRows} branchInfo={data.branchInfo} holidays={holidaySet} subtitle={rangeLabel} />

      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <HourClockCard hours={view.hours} subtitle={branch === "all" ? "ทุกสาขา" : `สาขา${branch}`} />
        <RoastCalendarCard
          days={view.calendar}
          holidays={data.holidays}
          subtitle={`${branch === "all" ? "ทุกสาขา" : `สาขา${branch}`} · ${rangeLabel}`}
        />
      </div>

      <SectionBand
        images={{ light: "band-morning", dark: "band-dusk" }}
        eyebrow={`${data.branches.length} สาขา · กรุงเทพฯ`}
        title={["ห้าสาขา", "หนึ่งรสมือ"]}
      >
        <p className="band-text">สาขาไหนขายดี สาขาไหนต้องดูแลเพิ่ม แล้วแก้วไหนที่ลูกค้ากลับมาสั่งซ้ำ</p>
      </SectionBand>

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
        <BranchCard
          data={view.branches}
          subtitle={`ทุกสาขา · ${rangeLabel}`}
          hasComparison={!!range.previous}
          highlight={branch}
          onTrace={(name) => openTrace("branch", { branch: name, fileTag: `branch_${branchTag(name)}` })}
        />
        </div>
        <div>
        <TopProductsCard
          data={view.products}
          subtitle={`${branch === "all" ? "ทุกสาขา" : `สาขา${branch}`} · ${rangeLabel}`}
          onTrace={(p) =>
            openTrace("product", {
              productId: p.product_id,
              productName: p.name,
              fileTag: ["product", p.product_id, branch !== "all" && branchTag(branch)].filter(Boolean).join("_"),
            })
          }
        />
        </div>
      </div>

      <MenuMatrixCard
        rows={currentRows}
        products={data.products}
        subtitle={`${branch === "all" ? "ทุกสาขา" : `สาขา${branch}`} · ${rangeLabel}`}
      />

      {trace && <TracePanel spec={trace} rows={data.rows} onClose={() => setTrace(null)} />}
    </>
  );
}

// place: "nav" = แถบบน · "footer" = แถว "หน้าแล็บ" ท้ายหน้า (ยังเปิดได้ แค่ไม่ใช่หน้าหลัก)
// group: แถบบนคั่นด้วยเส้นตั้ง "shop" = หน้าของร้าน | "lab" = หน้าแล็บที่ใช้ Firestore
// auth: ต้องล็อกอิน (ซ่อนจากแถบบนตอนยังไม่ล็อกอิน เปิดลิงก์ตรง ๆ แล้วไปหน้าเข้าสู่ระบบ)
// demoOk: เปิดได้ในโหมดสาธิต (?demo) โดยไม่ต้องล็อกอิน เพราะคำนวณจาก CSV ไม่ได้อ่าน Firestore
// teaser = คำถามที่หน้านั้นตอบ ใช้ในการ์ด "หน้าถัดไป" ท้ายหน้าก่อนหน้า
const TABS = [
  { value: "overview", label: "ภาพรวม", icon: BeanIcon, place: "nav", group: "shop", teaser: "ร้านทั้ง 5 สาขาเป็นอย่างไรบ้าง" },
  { value: "customers", label: "ลูกค้า", icon: CupIcon, place: "nav", group: "shop", teaser: "ใครคือขาประจำ และคนกลุ่มนี้ทำยอดให้ร้านเท่าไหร่" },
  { value: "analytics", label: "ลูกค้า & เมนู", icon: StoreIcon, place: "nav", group: "shop", auth: true, demoOk: true, teaser: "ลูกค้ากลุ่มไหนกำลังจะหาย และเมนูไหนทำยอดส่วนใหญ่ของร้าน" },
  { value: "forecast", label: "พยากรณ์ & ผิดปกติ", icon: CalendarIcon, place: "nav", group: "shop", auth: true, demoOk: true, teaser: "สัปดาห์หน้าน่าจะขายได้เท่าไหร่ และวันไหนผิดปกติ" },
  { value: "live", label: "สด · Firestore", icon: LiveIcon, place: "nav", group: "lab", auth: true, teaser: "ยอดขายสดจาก Firestore และฟอร์มบันทึกการขาย" },
  { value: "lab2", label: "Lab 2.2 · ซ่อมกราฟ", icon: DripperIcon, place: "footer" },
  // ทดสอบ Rules มีชุดทดสอบตอนไม่ล็อกอินด้วย จึงอยู่บนแถบบนเสมอ ไม่ซ่อนหลังการล็อกอิน
  { value: "rules", label: "ทดสอบ Rules", icon: ShieldIcon, place: "nav", group: "lab", teaser: "ลองโจมตีฐานข้อมูลของตัวเอง ดูว่า rules กันได้ครบไหม" },
];
// หน้าเข้าสู่ระบบ: มี URL (#login) แต่ไม่อยู่ในเมนู
const ROUTES = [...TABS, { value: "login" }];
const TAB_BY_VALUE = Object.fromEntries(TABS.map((t) => [t.value, t]));
// แท็บ Lab 3 อ่านจาก Firestore ไม่ได้ใช้ sales.csv จึงแสดงได้แม้โหลด CSV ไม่สำเร็จ
const LAB3_TABS = ["live", "rules", "login"];
const LAB4_TABS = ["analytics", "forecast"];
// แท็บที่ไม่ต้องรอ sales.csv โหลดเสร็จ
const FIRESTORE_TABS = [...LAB3_TABS, ...LAB4_TABS];
const IS_DEMO = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("demo");
const needsLogin = (value) => Boolean(TAB_BY_VALUE[value]?.auth && !(IS_DEMO && TAB_BY_VALUE[value].demoOk));

// จำแท็บไว้ใน URL (#customers, #lab2) รีเฟรชแล้วยังอยู่แท็บเดิม
function useTab() {
  const read = () => ROUTES.find((t) => `#${t.value}` === window.location.hash)?.value ?? "overview";
  const [tab, setTab] = useState(read);
  useEffect(() => {
    const onHash = () => setTab(read());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  const change = (value) => {
    window.location.hash = value === "overview" ? "" : value;
    setTab(value);
  };
  return [tab, change];
}

// แถบบนติดจอเสมอ: มีเงาและพื้นเบลอเมื่อเลื่อนลงจากบนสุดแล้ว
function useScrolled() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return scrolled;
}

export default function App() {
  const data = useDashboardData();
  const [tab, setTab] = useTab();
  const { user, signOut } = useAuthUser();
  // หน้าที่จะพาไปหลังล็อกอินสำเร็จ (หน้าที่ต้องล็อกอินที่ผู้ใช้ตั้งใจเปิด)
  const [loginNext, setLoginNext] = useState("analytics");
  // เปิดหน้าที่ต้องล็อกอินตอนยังไม่ได้ล็อกอิน (ลิงก์ตรง หรือเพิ่งออกจากระบบ): ไปหน้าเข้าสู่ระบบ
  useEffect(() => {
    if (user === null && needsLogin(tab)) {
      setLoginNext(tab);
      setTab("login");
    }
  }, [user, tab]);
  // แถบบน: หน้าที่ต้องล็อกอินแสดงเมื่อล็อกอินแล้ว (หรือใช้ได้ในโหมดสาธิต) · คั่นหน้าร้าน | หน้าแล็บ
  const navTabs = TABS.filter((t) => t.place === "nav" && (!needsLogin(t.value) || user));
  const navGroups = ["shop", "lab"].map((g) => navTabs.filter((t) => t.group === g)).filter((g) => g.length);
  const footerTabs = TABS.filter((t) => t.place === "footer");
  // แถบแท็บเปลี่ยนทันที ส่วนเนื้อหาของแท็บ render ตามหลังแบบขัดจังหวะได้
  // (แท็บ Lab 2.2 มี 10 กราฟ ถ้า render พร้อมกดจะค้างจนกว่าจะวาดเสร็จ)
  const page = useDeferredValue(tab);
  // จอแคบแถบแท็บเลื่อนได้ เปิดลิงก์ #rules ตรง ๆ แท็บที่เลือกต้องไม่ซ่อนอยู่นอกจอ
  const tabBarRef = useRef(null);
  const tabBarScrolled = useRef(false);
  const scrolled = useScrolled();
  // ความสูงจริงของแถบบน (มือถือขึ้นสองบรรทัด) ให้ส่วนที่ติดจอ (sticky) ของเรื่องเล่าวางต่อใต้แถบพอดี
  const headerRef = useRef(null);
  useEffect(() => {
    const el = headerRef.current;
    const ro = new ResizeObserver(() => document.documentElement.style.setProperty("--bar-h", `${el.offsetHeight}px`));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    const bar = tabBarRef.current;
    const active = bar?.querySelector('[aria-current="page"]');
    if (!active) return;
    const b = bar.getBoundingClientRect();
    const a = active.getBoundingClientRect();
    if (a.left < b.left || a.right > b.right) {
      // ตอนเปิดหน้าเลื่อนทันที (ยังไม่มีใครดูอยู่) ตอนกดเปลี่ยนแท็บค่อยเลื่อนแบบนุ่ม
      bar.scrollBy({ left: a.left - b.left - 16, behavior: tabBarScrolled.current ? "smooth" : "instant" });
    }
    tabBarScrolled.current = true;
  }, [tab]);

  // เปลี่ยนแท็บขณะเลื่อนลงไปลึกแล้ว: พากลับขึ้นบนสุด ไม่ค้างกลางหน้าใหม่
  const changeTab = (value) => {
    setTab(value);
    if (window.scrollY > 0) window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <header ref={headerRef} className={`top-bar ${scrolled ? "is-scrolled" : ""}`}>
        <div className="mx-auto flex max-w-6xl items-center gap-x-3 px-4 sm:gap-x-4 sm:px-6">
          <div className="mr-auto min-w-0">
            <Logo />
          </div>
          {data.status === "ready" && (
            <p className="hidden text-[13px] text-ink-subtle md:block">
              ข้อมูลล่าสุด <span className="font-medium text-ink">{formatDate(data.last)}</span> · {data.branches.length} สาขา
            </p>
          )}
          <ThemeToggle />
          <Account
            user={user}
            hideSignIn={tab === "login"}
            onSignIn={() => changeTab("login")}
            onSignOut={() => {
              signOut?.();
              if (needsLogin(tab)) changeTab("overview");
            }}
          />
        </div>
        {/* แถวเมนูหน้าแยกจากแถวตรา: กว้างเต็มแถว อ่านออกว่าเป็นทางไปหน้าอื่น ไม่ใช่สวิตช์ · จอแคบเลื่อนแนวนอนได้ */}
        <div className="mx-auto mt-2 max-w-6xl px-1 sm:px-3">
          <PageNav groups={navGroups} value={tab} onChange={changeTab} navRef={tabBarRef} />
        </div>
      </header>

      <main className="relative px-4 pt-6 pb-6 sm:px-6 lg:pb-8">
        <div className="mx-auto max-w-6xl space-y-4">
          {!FIRESTORE_TABS.includes(page) && data.status === "loading" && <LoadingState />}
          {!FIRESTORE_TABS.includes(page) && data.status === "error" && <ErrorState message={data.message} />}

          {/* key ตามแท็บ: เปลี่ยนหน้าแล้วเนื้อหาใหม่ลอยขึ้นพร้อมจางจากเบลอ */}
          <div key={page} className="page-enter space-y-4">
            {needsLogin(page) && !user ? (
              // ยังไม่รู้ว่าล็อกอินอยู่ไหม (Firebase กำลังโหลด) · ถ้าไม่ได้ล็อกอิน effect ด้านบนจะพาไปหน้าเข้าสู่ระบบ
              <Skeleton className="h-40 rounded-[var(--radius-card)] bg-surface" />
            ) : LAB3_TABS.includes(page) ? (
              <Suspense fallback={<Skeleton className="h-40 rounded-[var(--radius-card)] bg-surface" />}>
                <Lab3Page view={page} onSignedIn={() => changeTab(loginNext)} />
              </Suspense>
            ) : LAB4_TABS.includes(page) ? (
              <Suspense fallback={<Skeleton className="h-40 rounded-[var(--radius-card)] bg-surface" />}>
                <Lab4Page view={page} />
              </Suspense>
            ) : (
              data.status === "ready" &&
              (page === "lab2" ? (
                <Lab2Page rows={data.rows} products={data.products} />
              ) : page === "customers" ? (
                <>
                  <SectionBand
                    images={{ light: "band-regulars-morning", dark: "band-regulars-dusk" }}
                    eyebrow="ลูกค้า · สมาชิก"
                    title={["แก้วประจำ", "ของคนประจำ"]}
                  >
                    <p className="band-text">ใครบ้างที่แวะมาทุกเช้า แล้วคนกลุ่มนี้ทำยอดให้ร้านได้เท่าไหร่</p>
                  </SectionBand>
                  <CustomersView data={data} />
                </>
              ) : (
                <Dashboard data={data} />
              ))
            )}
          </div>

          {/* ท้ายหน้า: ทางไปหน้าถัดไป (หน้าสุดท้ายไม่มี) */}
          {/* ไล่ตามแถบบน หน้าแล็บใน footer และหน้าเข้าสู่ระบบไม่มี */}
          <NextPage tab={navTabs.some((t) => t.value === page) ? navTabs[navTabs.findIndex((t) => t.value === page) + 1] : null} onGo={changeTab} />

          <SectionBand images="origin" eyebrow="ต้นทาง · ดอยทางภาคเหนือ" title={["จากดอยทางเหนือ", "ถึงแก้วในกรุงเทพฯ"]} tall>
            <p className="band-text">ตัวเลขทุกตัวในหน้านี้คิดมาจากไฟล์ข้อมูลของร้าน เปิด Excel เช็กเองได้เลย</p>
          </SectionBand>

          <footer className="space-y-3 pt-2">
            <nav aria-label="หน้าแล็บ" className="flex flex-wrap items-center gap-x-1 gap-y-1 text-[13px]">
              <span className="mr-1 text-ink-subtle">หน้าแล็บ</span>
              {footerTabs.map((t) => (
                <a
                  key={t.value}
                  href={`#${t.value}`}
                  aria-current={page === t.value ? "page" : undefined}
                  onClick={(e) => {
                    e.preventDefault();
                    changeTab(t.value);
                  }}
                  className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 font-medium transition-colors hover:bg-surface-hover hover:text-ink focus-visible:outline-2 focus-visible:outline-chart ${
                    page === t.value ? "bg-surface-selected text-ink" : "text-ink-subtle"
                  }`}
                >
                  <t.icon className="size-4 text-ink-muted" />
                  {t.label}
                </a>
              ))}
            </nav>
            <p className="text-xs text-ink-muted">
            คิดจาก public/sales.csv · 1 แถว = 1 รายการ · ยอดขาย = qty × unit_price · ช่วงเวลานับย้อนจากวันล่าสุดที่มีข้อมูล
            </p>
          </footer>
        </div>
      </main>
    </>
  );
}
