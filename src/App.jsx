import { useEffect, useMemo, useRef, useState } from "react";
import Papa from "papaparse";
import TrendCard from "./components/TrendCard.jsx";
import BranchCard from "./components/BranchCard.jsx";
import TopProductsCard from "./components/TopProductsCard.jsx";
import ReplayCard from "./components/ReplayCard.jsx";
import TracePanel from "./components/TracePanel.jsx";
import { Card, CalendarIcon, Collapsible, Select, Skeleton, StoreIcon } from "./components/ui.jsx";
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
    Promise.all([loadCsv(`${import.meta.env.BASE_URL}sales.csv`), loadCsv(`${import.meta.env.BASE_URL}products.csv`), branchCsv])
      .then(([sales, products, branchInfo]) => {
        const rows = prepareRows(sales);
        if (rows.length === 0) throw new Error("ไฟล์ sales.csv ไม่มีข้อมูล");
        let first = rows[0].date;
        let last = rows[0].date;
        for (const r of rows) {
          if (r.date < first) first = r.date;
          if (r.date > last) last = r.date;
        }
        const branches = [...new Set(rows.map((r) => r.branch))].sort((a, b) => a.localeCompare(b, "th"));
        setState({ status: "ready", rows, products, branchInfo, first, last, branches });
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
      <p className="text-sm font-semibold text-ink">โหลดข้อมูลไม่สำเร็จ</p>
      <p className="mx-auto mt-1 max-w-md text-[13px] text-ink-subtle">
        {message}. ตรวจว่ามีไฟล์ <code>public/sales.csv</code> และ <code>public/products.csv</code> แล้วรีเฟรชหน้านี้
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
  const replayMonths = Math.round(resolveRange("all", data.first, data.last).days / 30.44);

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
    };
  }, [data, range, branch, granularity]);

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
        {!replayOpen && (
          <button
            ref={replayButtonRef}
            type="button"
            onClick={openReplay}
            className="group ml-auto inline-flex h-8 animate-fade-in items-center gap-2 rounded-lg border border-line-strong bg-surface pr-3 pl-2 text-[13px] font-medium text-ink shadow-[0_1px_0_0_rgb(0_0_0/0.05)] transition-[background-color,scale] hover:bg-surface-hover active:scale-[0.97]"
          >
            <span className="inline-flex size-5 items-center justify-center rounded-full bg-chart text-white transition-transform group-hover:scale-110">
              <svg viewBox="0 0 20 20" className="ml-px size-3" fill="currentColor" aria-hidden="true">
                <path d="M6 4.2v11.6a.6.6 0 0 0 .9.5l9.2-5.8a.6.6 0 0 0 0-1L6.9 3.7a.6.6 0 0 0-.9.5Z" />
              </svg>
            </span>
            ย้อนดู {replayMonths} เดือน
          </button>
        )}
      </div>

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

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="animate-rise" style={{ animationDelay: "140ms" }}>
        <BranchCard
          data={view.branches}
          subtitle={`ทุกสาขา · ${rangeLabel}`}
          hasComparison={!!range.previous}
          highlight={branch}
          onTrace={(name) => openTrace("branch", { branch: name, fileTag: `branch_${branchTag(name)}` })}
        />
        </div>
        <div className="animate-rise" style={{ animationDelay: "200ms" }}>
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

      {trace && <TracePanel spec={trace} rows={data.rows} onClose={() => setTrace(null)} />}
    </>
  );
}

export default function App() {
  const data = useDashboardData();

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:py-8">
      <div className="mx-auto max-w-6xl space-y-4">
        <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h1 className="text-xl font-bold text-ink">บ้านบรู Dashboard</h1>
          {data.status === "ready" && (
            <p className="text-[13px] text-ink-subtle">
              ข้อมูลล่าสุด {formatDate(data.last)} · {data.branches.length} สาขา
            </p>
          )}
        </header>

        {data.status === "loading" && <LoadingState />}
        {data.status === "error" && <ErrorState message={data.message} />}
        {data.status === "ready" && <Dashboard data={data} />}

        <footer className="pt-2 text-xs text-ink-muted">
          คำนวณจาก public/sales.csv · 1 แถว = 1 รายการสินค้า · ยอดขาย = qty × unit_price · ช่วงเวลานับถอยหลังจากวันล่าสุดในข้อมูล
        </footer>
      </div>
    </main>
  );
}
