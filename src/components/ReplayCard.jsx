import { useEffect, useMemo, useRef, useState } from "react";
import { Card, Segmented, prefersReducedMotion } from "./ui.jsx";
import MarbleArt from "./MarbleArt.jsx";
import { formatBaht, formatDate, formatMonth, formatNumber } from "../lib/metrics.js";

// เล่นย้อนหลังทีละสัปดาห์ ความเร็วปกติ 1 สัปดาห์ = 250ms (ข้อมูล ~77 สัปดาห์ ≈ 20 วินาที)
const MS_PER_WEEK = 250;
const SPEEDS = [
  { value: 0.5, label: "ช้า" },
  { value: 1, label: "ปกติ" },
  { value: 2, label: "เร็ว" },
];

// ---------- แผนที่ ----------

const MAP_W = 400;
const MAP_H = 340;
const MAX_R = 22;
const KM_PER_DEG_LAT = 111;

// แม่น้ำเจ้าพระยาแบบคร่าว ๆ (lat, lng) ใช้เป็นจุดอ้างอิงให้รู้ว่าอยู่ตรงไหนของกรุงเทพฯ ไม่ใช่แผนที่จริง
const RIVER = [
  [13.84, 100.503], [13.8, 100.508], [13.785, 100.505], [13.77, 100.497], [13.757, 100.491],
  [13.745, 100.494], [13.738, 100.499], [13.728, 100.508], [13.718, 100.513], [13.705, 100.515],
  [13.695, 100.521], [13.693, 100.535], [13.7, 100.548], [13.707, 100.56], [13.7, 100.573],
  [13.688, 100.58], [13.672, 100.576], [13.66, 100.565], [13.655, 100.548], [13.65, 100.535],
  [13.635, 100.535], [13.615, 100.555], [13.6, 100.585], [13.58, 100.6],
];

// ตำแหน่งป้ายชื่อ (px จากจุดสาขา) สามสาขาย่านปทุมวัน-สีลมอยู่ใกล้กันมาก จึงกระจายป้ายออกคนละทิศ
const LABEL_OFFSET = {
  สยาม: { dx: 34, dy: -26 },
  มหาวิทยาลัย: { dx: 40, dy: 16 },
  สีลม: { dx: -34, dy: 28 },
  อารีย์: { dx: 30, dy: -10 },
  บางนา: { dx: 30, dy: 4 },
};

// แปลง lat/lng เป็นพิกัดบน SVG โดยคงสัดส่วนจริง (ลองจิจูดหดตาม cos(ละติจูด))
function makeProjection(points) {
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const pad = 0.03;
  const midLat = (Math.min(...lats) + Math.max(...lats)) / 2;
  const midLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
  const kx = Math.cos((midLat * Math.PI) / 180);
  const spanLat = Math.max(...lats) - Math.min(...lats) + pad * 2;
  const spanLng = (Math.max(...lngs) - Math.min(...lngs) + pad * 2) * kx;
  const scale = Math.min(MAP_H / spanLat, MAP_W / spanLng); // px ต่อ 1 องศาละติจูด
  return {
    project: (lat, lng) => ({
      x: MAP_W / 2 + (lng - midLng) * kx * scale,
      y: MAP_H / 2 - (lat - midLat) * scale,
    }),
    pxPerKm: scale / KM_PER_DEG_LAT,
  };
}

// เส้นโค้งผ่านจุดกึ่งกลางของแต่ละช่วง
function smoothPath(pts) {
  let d = `M${pts[0].x},${pts[0].y}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i].x + pts[i + 1].x) / 2;
    const my = (pts[i].y + pts[i + 1].y) / 2;
    d += ` Q${pts[i].x},${pts[i].y} ${mx},${my}`;
  }
  const last = pts[pts.length - 1];
  return `${d} L${last.x},${last.y}`;
}

function ReplayMap({ branches, t, maxValue }) {
  const { project, pxPerKm } = useMemo(() => makeProjection(branches), [branches]);
  const river = useMemo(() => smoothPath(RIVER.map(([lat, lng]) => project(lat, lng))), [project]);
  const kmBar = 2 * pxPerKm;
  const riverLabel = project(13.684, 100.519);

  // วงใหญ่วาดก่อน วงเล็กจะได้ไม่ถูกบัง
  const ordered = [...branches].sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

  return (
    <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} className="block h-auto w-full" aria-hidden="true">
      <defs>
        <pattern id="replay-dots" width="16" height="16" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="var(--color-line)" />
        </pattern>
        <radialGradient id="replay-glow">
          <stop offset="0%" stopColor="var(--color-chart)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--color-chart)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width={MAP_W} height={MAP_H} rx="8" fill="var(--color-surface-hover)" />
      <rect width={MAP_W} height={MAP_H} rx="8" fill="url(#replay-dots)" />
      <path d={river} fill="none" stroke="var(--color-water)" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
      <text x={riverLabel.x + 10} y={riverLabel.y + 4} fontSize="11" fill="var(--color-water-ink)">
        แม่น้ำเจ้าพระยา
      </text>

      {/* มาตราส่วน 2 กม. */}
      <g transform={`translate(14 ${MAP_H - 16})`}>
        <path d={`M0,-4 V0 H${kmBar} V-4`} fill="none" stroke="var(--color-ink-muted)" strokeWidth="1.25" />
        <text x={kmBar + 6} y="1" fontSize="11" fill="var(--color-ink-muted)">
          2 กม.
        </text>
      </g>

      {ordered.map((b) => {
        const { x, y } = project(b.lat, b.lng);
        const r = b.value ? Math.max(3, MAX_R * Math.sqrt(b.value / maxValue)) : 0;
        const off = LABEL_OFFSET[b.branch] ?? { dx: 30, dy: 0 };
        const anchor = off.dx < 0 ? "end" : "start";
        const lx = x + off.dx;
        const ly = y + off.dy;
        // วงกระเพื่อมตอนเปิดสาขาใหม่: ขยายออกและจางหายใน ~4 สัปดาห์หลังเปิด
        const sinceOpen = b.openIndex != null ? t - (b.openIndex - 1) : null;
        const burst = sinceOpen != null && sinceOpen > 0 && sinceOpen < 4 ? sinceOpen / 4 : null;
        const isNew = sinceOpen != null && sinceOpen > 0 && sinceOpen < 8;

        return (
          <g key={b.branch}>
            {b.value == null ? (
              <circle cx={x} cy={y} r="6" fill="none" stroke="var(--color-line-strong)" strokeDasharray="2 2" />
            ) : (
              <>
                <circle cx={x} cy={y} r={r * 2} fill="url(#replay-glow)" />
                <circle cx={x} cy={y} r={r} fill="var(--color-chart)" fillOpacity="0.18" stroke="var(--color-chart)" strokeWidth="1.5" />
                <circle cx={x} cy={y} r="2.5" fill="var(--color-chart)" />
              </>
            )}
            {burst != null && (
              <circle cx={x} cy={y} r={8 + burst * 40} fill="none" stroke="var(--color-chart)" strokeWidth="2" opacity={1 - burst} />
            )}
            <line
              x1={x + Math.sign(off.dx) * Math.max(r, 6)}
              y1={y}
              x2={lx - Math.sign(off.dx) * 4}
              y2={ly - 4}
              stroke="var(--color-line-strong)"
              strokeWidth="1"
            />
            <text x={lx} y={ly - 1} fontSize="13" fontWeight="600" textAnchor={anchor} fill={b.value == null ? "var(--color-ink-muted)" : "var(--color-ink)"}>
              {b.branch}
            </text>
            <text x={lx} y={ly + 14} fontSize="11" textAnchor={anchor} fill="var(--color-ink-muted)" className="tabular-nums">
              {b.value == null ? "ยังไม่เปิด" : `${formatBaht(b.value)}/วัน`}
            </text>
            {isNew && (
              <g transform={`translate(${anchor === "end" ? lx - 58 : lx} ${ly - 36})`}>
                <rect width="58" height="18" rx="9" fill="var(--color-chart)" />
                <text x="29" y="12.5" fontSize="11" fontWeight="600" textAnchor="middle" fill="var(--color-on-chart)">
                  สาขาใหม่
                </text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ---------- อันดับสาขา (bar race) ----------

const ROW_H = 50;

function BranchRace({ branches, maxValue }) {
  // เรียงตามยอด สาขาที่ยังไม่เปิดอยู่ท้ายสุด
  const ranked = [...branches].sort((a, b) => {
    if (a.value == null || b.value == null) return (a.value == null) - (b.value == null);
    return b.value - a.value;
  });
  const rankOf = new Map(ranked.map((b, i) => [b.branch, i]));

  // สาขาที่อันดับขึ้น ไฮไลต์แวบหนึ่ง (key ใหม่ = เล่น animation ใหม่)
  // เทียบใน effect หลัง commit เท่านั้น การ render ที่ React ทิ้งหรือเรียกซ้ำจึงไม่ทำให้พลาด/นับซ้ำ
  const order = ranked.map((b) => b.branch).join("|");
  const prevOrder = useRef(null);
  const [flash, setFlash] = useState({});
  useEffect(() => {
    const prev = prevOrder.current?.split("|");
    prevOrder.current = order;
    if (!prev) return;
    const climbed = order.split("|").filter((b, i) => prev.indexOf(b) > i);
    if (climbed.length) {
      setFlash((f) => ({ ...f, ...Object.fromEntries(climbed.map((b) => [b, (f[b] ?? 0) + 1])) }));
    }
  }, [order]);

  return (
    <ol className="relative" style={{ height: branches.length * ROW_H }}>
      {branches.map((b) => {
        const rank = rankOf.get(b.branch);
        const flashKey = flash[b.branch];
        return (
          <li
            key={b.branch}
            className="absolute inset-x-0 top-0 px-2 transition-transform duration-500 ease-[var(--ease-out)]"
            style={{ height: ROW_H, transform: `translateY(${rank * ROW_H}px)` }}
          >
            {flashKey && <span key={flashKey} className="replay-flash absolute inset-0 rounded-lg" aria-hidden="true" />}
            <div className="relative flex items-baseline justify-between gap-2 pt-2 text-[13px]">
              <span className={b.value == null ? "text-ink-muted" : "text-ink"}>
                <span className="mr-2 inline-block w-3 text-ink-muted tabular-nums">{rank + 1}</span>
                <span className="font-medium">{b.branch}</span>
                <span className="ml-1.5 text-xs text-ink-muted">{b.branch_type}</span>
              </span>
              <span className="font-medium text-ink tabular-nums">
                {b.value == null ? (
                  <span className="text-xs font-normal text-ink-muted">
                    {b.opened_date ? `เปิด ${formatDate(b.opened_date)}` : "ยังไม่เปิด"}
                  </span>
                ) : (
                  <>
                    {formatBaht(b.value)}
                    <span className="text-xs font-normal text-ink-muted">/วัน</span>
                  </>
                )}
              </span>
            </div>
            <div className="relative mt-1.5 ml-5 h-2.5 rounded-full bg-canvas">
              <div
                className="h-full rounded-full bg-chart-bar"
                style={{ width: `${b.value ? (b.value / maxValue) * 100 : 0}%` }}
              />
            </div>
          </li>
        );
      })}
    </ol>
  );
}

// ---------- แถบเลื่อนเวลา ----------

function Scrubber({ frames, t, onSeek, markers }) {
  const n = frames.length;
  const max = Math.max(...frames.map((f) => f.dailyAvg));
  const x = (i) => (n > 1 ? (i / (n - 1)) * 1000 : 0);
  const y = (v) => 44 - (v / max) * 40;
  const area = `M0,48 ${frames.map((f, i) => `L${x(i)},${y(f.dailyAvg)}`).join(" ")} L1000,48 Z`;
  const pct = n > 1 ? (t / (n - 1)) * 100 : 0;
  const frame = frames[Math.round(t)];

  // ขีดเดือน ม.ค. เม.ย. ก.ค. ต.ค.
  const ticks = frames
    .map((f, i) => ({ i, month: f.key.slice(0, 7), prev: frames[i - 1]?.key.slice(0, 7) }))
    .filter((d) => d.i > 0 && d.month !== d.prev && [1, 4, 7, 10].includes(Number(d.month.slice(5))))
    .map((d) => ({ i: d.i, label: formatMonth(d.month + "-01") }));

  return (
    <div>
      <div className="relative h-12 rounded-md has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-chart">
        <svg viewBox="0 0 1000 48" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden="true">
          <clipPath id="replay-played">
            <rect width={pct * 10} height="48" />
          </clipPath>
          <path d={area} fill="var(--color-canvas)" />
          <path d={area} fill="var(--color-chart)" fillOpacity="0.28" clipPath="url(#replay-played)" />
        </svg>
        {markers.map((m) => (
          <span
            key={m.label}
            className="absolute top-0 bottom-0 w-px bg-chart/50"
            style={{ left: `${(m.index / (n - 1)) * 100}%` }}
            aria-hidden="true"
          >
            <span className="absolute -top-1 left-1 text-[11px] whitespace-nowrap text-chart">{m.label}</span>
          </span>
        ))}
        <span className="pointer-events-none absolute top-0 bottom-0 w-0.5 -translate-x-1/2 rounded bg-chart" style={{ left: `${pct}%` }} aria-hidden="true">
          <span className="absolute -bottom-1 left-1/2 size-3 -translate-x-1/2 rounded-full border-2 border-surface bg-chart shadow" />
        </span>
        <input
          type="range"
          min={0}
          max={n - 1}
          step="any"
          value={t}
          onChange={(e) => onSeek(Number(e.target.value))}
          aria-label="เลื่อนเวลา"
          aria-valuetext={`สัปดาห์ ${formatDate(frame.key)} ถึง ${formatDate(frame.end)}`}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </div>
      <div className="relative mt-1.5 h-4 text-[11px] text-ink-muted" aria-hidden="true">
        {ticks.map((tk) => (
          <span key={tk.i} className="absolute -translate-x-1/2 whitespace-nowrap" style={{ left: `${(tk.i / (n - 1)) * 100}%` }}>
            {tk.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ---------- ไอคอนปุ่ม ----------

const PlayIcon = () => (
  <svg viewBox="0 0 20 20" className="size-4" fill="currentColor" aria-hidden="true">
    <path d="M6 4.2v11.6a.6.6 0 0 0 .9.5l9.2-5.8a.6.6 0 0 0 0-1L6.9 3.7a.6.6 0 0 0-.9.5Z" />
  </svg>
);
const PauseIcon = () => (
  <svg viewBox="0 0 20 20" className="size-4" fill="currentColor" aria-hidden="true">
    <rect x="5" y="4" width="3.5" height="12" rx="1" />
    <rect x="11.5" y="4" width="3.5" height="12" rx="1" />
  </svg>
);
const ReplayIcon = () => (
  <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3.5 10a6.5 6.5 0 1 0 2-4.7M3.5 3.5v3.8h3.8" />
  </svg>
);
const CloseIcon = () => (
  <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
    <path d="m5 5 10 10M15 5 5 15" />
  </svg>
);

// ---------- การ์ดหลัก ----------

const lerp = (a, b, f) => a + (b - a) * f;

// ค่าระหว่างสองเฟรม ให้ภาพเคลื่อนนุ่มแทนการกระโดดทีละสัปดาห์
// สาขาที่เพิ่งเปิด (เฟรมก่อนเป็น null) จะค่อย ๆ โตจาก 0
function interpolate(a, b, f) {
  const branch = (x, y) => (x == null ? (y == null ? null : y * f) : lerp(x, y ?? x, f));
  return {
    totals: {
      revenue: lerp(a.totals.revenue, b.totals.revenue, f),
      orders: lerp(a.totals.orders, b.totals.orders, f),
      members: lerp(a.totals.members, b.totals.members, f),
    },
    branches: Object.fromEntries(Object.keys(a.branches).map((k) => [k, branch(a.branches[k], b.branches[k])])),
  };
}

export default function ReplayCard({ frames, branchInfo, onClose }) {
  const maxT = frames.length - 1;
  const reduced = useMemo(prefersReducedMotion, []);
  const [t, setT] = useState(reduced ? maxT : 0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const tRef = useRef(t);
  const playRef = useRef(null);

  // เปิดการ์ดแล้วย้าย focus มาที่ปุ่มเล่น (ปุ่มเปิดที่เพิ่งกดหายไปแล้ว)
  useEffect(() => {
    playRef.current?.focus({ preventScroll: true });
  }, []);

  const seek = (v) => {
    tRef.current = v;
    setT(v);
  };

  // เริ่มเล่นเองหลังการ์ดเลื่อนเข้ามา (ยกเว้นผู้ใช้ตั้งค่าลดการเคลื่อนไหว)
  useEffect(() => {
    if (reduced) return;
    const id = setTimeout(() => setPlaying(true), 500);
    return () => clearTimeout(id);
  }, [reduced]);

  useEffect(() => {
    if (!playing) return;
    let raf;
    // เริ่มนับเวลาจาก timestamp ของเฟรมแรก ไม่ใช่ performance.now()
    // เพราะ timestamp ของ requestAnimationFrame คือเวลาต้นเฟรม อาจเก่ากว่าตอนกดปุ่ม ทำให้ dt ติดลบ
    // แล้ว t < 0 → frames[-1] เป็น undefined หน้าพังทั้งหน้า
    let last = null;
    const tick = (now) => {
      const dt = last == null ? 0 : Math.max(0, now - last);
      last = now;
      const next = Math.min(maxT, Math.max(0, tRef.current + (dt / MS_PER_WEEK) * speed));
      seek(next);
      if (next >= maxT) setPlaying(false);
      else raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, speed, maxT]);

  const togglePlay = () => {
    if (!playing && tRef.current >= maxT) seek(0);
    setPlaying((p) => !p);
  };

  const info = useMemo(() => {
    const byName = new Map(branchInfo.map((b) => [b.branch, b]));
    return Object.keys(frames[0].branches).map((name) => {
      const b = byName.get(name) ?? {};
      const openIndex = frames.findIndex((f) => f.branches[name] != null);
      return {
        branch: name,
        branch_type: b.branch_type ?? "",
        opened_date: b.opened_date,
        lat: Number(b.lat),
        lng: Number(b.lng),
        // เปิดระหว่างช่วงข้อมูล (ไม่ใช่มีอยู่แล้วตั้งแต่เฟรมแรก)
        openIndex: openIndex > 0 ? openIndex : null,
      };
    });
  }, [frames, branchInfo]);

  const maxValue = useMemo(
    () => Math.max(1, ...frames.flatMap((f) => Object.values(f.branches).filter((v) => v != null))),
    [frames]
  );

  // กันไว้อีกชั้น: t นอกช่วงต้องไม่ทำให้หาเฟรมไม่เจอ
  const safeT = Math.min(maxT, Math.max(0, t));
  const i = Math.floor(safeT);
  const frame = frames[i];
  const now = interpolate(frame, frames[Math.min(i + 1, maxT)], safeT - i);
  const branches = info.map((b) => ({ ...b, value: now.branches[b.branch] }));
  const mapped = branches.filter((b) => Number.isFinite(b.lat) && Number.isFinite(b.lng));
  const markers = info.filter((b) => b.openIndex != null).map((b) => ({ index: b.openIndex, label: `${b.branch}เปิด` }));

  const kpis = [
    { label: "ยอดขายสะสม", value: formatBaht(now.totals.revenue) },
    { label: "จำนวนบิลสะสม", value: formatNumber(now.totals.orders) },
    { label: "ลูกค้าสมาชิกสะสม", value: formatNumber(now.totals.members) },
  ];

  return (
    <Card
      className="overflow-hidden"
      aria-label="ย้อนดูการเติบโตของเครือร้าน"
      onKeyDown={(e) => e.key === "Escape" && onClose()}
    >
      {/* แถบหัวเป็นหินอ่อนดำ-ทองชุดเดียวกับหัวหน้า (มืดเสมอ: .theme-dark ให้ปุ่มในแถบใช้สีโหมดมืด) ปิดด้วยเส้นทองบาง */}
      <div className="theme-dark relative overflow-hidden bg-[#070707]">
        <MarbleArt className="absolute inset-0 size-full" />
        <div
          aria-hidden="true"
          className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-[#070707]/95 via-[#070707]/75 via-40% to-transparent sm:w-1/2"
        />
      <div className="relative flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5">
        <div>
          <h2 className="gold-text font-display pb-0.5 text-lg leading-tight font-semibold">ย้อนดูการเติบโต</h2>
          <p className="mt-0.5 text-[13px] text-ink-subtle">
            {formatDate(frames[0].key)} – {formatDate(frames[maxT].end)} · ทีละสัปดาห์
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Segmented label="ความเร็ว" value={speed} onChange={setSpeed} options={SPEEDS} />
          <button
            ref={playRef}
            type="button"
            onClick={togglePlay}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-chart px-3 text-[13px] font-medium text-on-chart transition-[background-color,scale] hover:bg-chart/90 active:scale-[0.97]"
          >
            <span key={playing ? "pause" : t >= maxT ? "replay" : "play"} className="inline-flex animate-pop">
              {playing ? <PauseIcon /> : t >= maxT ? <ReplayIcon /> : <PlayIcon />}
            </span>
            {playing ? "หยุด" : t >= maxT ? "เล่นอีกครั้ง" : "เล่น"}
          </button>
          {/* ปุ่มปิดอยู่บนหินอ่อน: พื้นดำทึบ + ขอบทอง ไม่งั้นกลืนไปกับลายหิน */}
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิด"
            className="inline-flex size-8 items-center justify-center rounded-full bg-black/60 text-[#f4eddc] ring-1 ring-[#d2a958]/50 transition-[background-color,box-shadow,scale] hover:bg-black/80 hover:ring-[#d2a958] active:scale-[0.95]"
          >
            <CloseIcon />
          </button>
        </div>
      </div>
      </div>
      <div className="gold-rule !opacity-100" aria-hidden="true" />

      <div className="grid grid-cols-2 gap-px border-b border-line bg-line sm:grid-cols-4">
        <div className="bg-surface px-4 py-3 sm:px-5">
          <p className="text-xs font-medium text-ink-subtle">
            สัปดาห์ {i + 1}/{frames.length}
          </p>
          <p className="mt-0.5 w-fit text-2xl font-semibold tracking-tight tabular-nums"><span className="gold-text-data">{formatDate(frame.end)}</span></p>
        </div>
        {kpis.map((k) => (
          <div key={k.label} className="bg-surface px-4 py-3 sm:px-5">
            <p className="text-xs font-medium text-ink-subtle">{k.label}</p>
            <p className="mt-0.5 text-2xl font-semibold tracking-tight text-ink tabular-nums">{k.value}</p>
          </div>
        ))}
      </div>

      {/* ไม่มีพิกัด (branches.csv หาย/ไม่ครบ) → ไม่วาดแผนที่ ให้อันดับสาขาเต็มความกว้างแทน */}
      <div
        className={`grid gap-4 px-4 pt-4 sm:px-5 lg:gap-6 ${
          mapped.length ? "lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]" : ""
        }`}
      >
        {mapped.length > 0 && (
          <figure
            role="img"
            aria-label={`แผนที่สาขา ณ ${formatDate(frame.end)}: ${branches
              .map((b) => `${b.branch} ${b.value == null ? "ยังไม่เปิด" : `${formatBaht(b.value)} ต่อวัน`}`)
              .join(", ")}`}
          >
            <ReplayMap branches={mapped} t={safeT} maxValue={maxValue} />
          </figure>
        )}
        <div>
          <p className="mb-1 px-2 text-xs text-ink-subtle">ยอดขายเฉลี่ยต่อวัน · 28 วันล่าสุด</p>
          <BranchRace branches={branches} maxValue={maxValue} />
        </div>
      </div>

      <div className="px-4 pt-5 pb-2 sm:px-5">
        <Scrubber frames={frames} t={safeT} onSeek={(v) => { setPlaying(false); seek(v); }} markers={markers} />
      </div>

      <p className="border-t border-line px-4 py-3 text-xs text-ink-muted sm:px-5">
        ตัวเลขสะสมของสัปดาห์สุดท้ายเท่ากับ KPI ช่วง “ทั้งหมด” · ขนาดวงกลมและแท่ง = ยอดขายเฉลี่ยต่อวันใน 28 วันล่าสุด นับเฉพาะวันที่สาขาเปิดแล้ว · แผนที่และแม่น้ำเป็นภาพโดยประมาณ
      </p>
    </Card>
  );
}
