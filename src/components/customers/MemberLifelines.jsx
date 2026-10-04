import { useEffect, useMemo, useRef, useState } from "react";
import { prefersReducedMotion, useSeen } from "../ui.jsx";
import { useTheme } from "../scroll.js";
import { formatBaht, formatDate, formatMonth, formatNumber } from "../../lib/metrics.js";
import { ACTIVE_DAYS } from "../../lib/customerMetrics.js";

const NB = " ";
const dayToDate = (d) => new Date(d * 864e5).toISOString().slice(0, 10);
const LOUPE_ROWS = 10; // แถวเหนือ/ใต้เส้นที่ชี้ ในแว่นขยาย
const SWEEP = 1400;
const FADE = 450;

// ความทึบตามสถานะของเส้น: 0 = จาง (ไม่อยู่ในกลุ่มที่เลือก), 1 = ปกติ, 2 = ไฮไลต์
const TICK_BASE = [0.08, 0.75, 0];
const TICK_HI = [0, 0, 1];
const LINE_BASE = [0.03, 0.1, 0];
const LINE_HI = [0, 0, 0.32];
const lerp = (a, b, t) => a + (b - a) * t;

// สมาชิก 1 คน = 1 เส้นแนวนอน (ตั้งแต่บิลแรกถึงบิลล่าสุด) · 1 บิล = 1 ขีดบนเส้น · เรียงตามวันที่ซื้อครั้งแรก
// วาดบน canvas (aria-hidden) ตัวเลขทั้งหมดอยู่ในข้อความรอบ ๆ และในการ์ดกลุ่มแล้ว
export default function MemberLifelines({ j, first, filter }) {
  const theme = useTheme();
  const stageRef = useRef(null);
  const canvasRef = useRef(null);
  const anim = useRef({ raf: 0, from: null, to: null, start: 0, sweepStart: null });
  const [size, setSize] = useState(null); // { W, H, mobile }
  const [hover, setHover] = useState(null); // { i, x, y }
  const [seenRef, seen] = useSeen(0.25);

  const { lines } = j;
  const from = Date.parse(`${first}T00:00:00Z`) / 864e5;
  const to = j.span.to + 1;

  // สถานะของแต่ละเส้นตามกลุ่มที่เลือก
  const state = useMemo(() => {
    const s = new Uint8Array(lines.length);
    const test = j.inGroup[filter];
    lines.forEach((l, i) => (s[i] = filter === "all" ? 1 : test(l) ? 2 : 0));
    return s;
  }, [lines, j, filter]);

  useEffect(() => {
    const el = stageRef.current;
    const measure = () => {
      const W = el.clientWidth;
      const mobile = W < 640;
      setSize({ W, H: mobile ? 420 : 560, mobile });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ---------- วาด ----------
  useEffect(() => {
    if (!size || !seen) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(size.W * dpr);
    canvas.height = Math.round(size.H * dpr);
    canvas.style.width = `${size.W}px`;
    canvas.style.height = `${size.H}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const css = getComputedStyle(document.documentElement);
    const base = css.getPropertyValue("--life-tick").trim();
    const lineColor = css.getPropertyValue("--life-line").trim();
    const hi = css.getPropertyValue("--dot-hi").trim();
    const n = lines.length;
    const rowH = size.H / n;
    const tickH = Math.max(rowH, 1);
    const xOf = (d) => ((d - from) / (to - from)) * size.W;

    const a = anim.current;
    const still = prefersReducedMotion();
    a.from = a.to ?? state;
    a.to = state;
    a.start = performance.now();
    if (a.sweepStart == null) a.sweepStart = still ? -1e9 : performance.now();

    const frame = (now) => {
      const t = still ? 1 : Math.min(1, (now - a.start) / FADE);
      const sweep = still ? 1 : Math.min(1, (now - a.sweepStart) / SWEEP);
      const clipX = size.W * (1 - (1 - sweep) ** 3);
      ctx.clearRect(0, 0, size.W, size.H);
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, clipX, size.H);
      ctx.clip();
      for (let pass = 0; pass < 2; pass++) {
        ctx.fillStyle = pass ? hi : base;
        const lineA = pass ? LINE_HI : LINE_BASE;
        const tickA = pass ? TICK_HI : TICK_BASE;
        for (let i = 0; i < n; i++) {
          const f = a.from[i];
          const g = a.to[i];
          const la = lerp(lineA[f], lineA[g], t);
          const ta = lerp(tickA[f], tickA[g], t);
          if (la <= 0 && ta <= 0) continue;
          const l = lines[i];
          const y = i * rowH;
          if (la > 0) {
            if (!pass) ctx.fillStyle = lineColor;
            ctx.globalAlpha = la;
            ctx.fillRect(xOf(l.days[0]), y, Math.max(1, xOf(l.days.at(-1) + 1) - xOf(l.days[0])), tickH);
          }
          if (ta > 0) {
            if (!pass) ctx.fillStyle = base;
            ctx.globalAlpha = ta;
            for (const d of l.days) ctx.fillRect(xOf(d), y, 1.4, tickH);
          }
        }
      }
      ctx.restore();
      ctx.globalAlpha = 1;
      a.raf = t < 1 || sweep < 1 ? requestAnimationFrame(frame) : 0;
    };
    cancelAnimationFrame(a.raf);
    a.raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(a.raf);
  }, [size, seen, state, lines, from, to, theme]);

  // ---------- ชี้ / แตะดูทีละคน ----------
  const pick = (e) => {
    if (!size) return;
    const r = stageRef.current.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    if (y < 0 || y > size.H) return setHover(null);
    const i = Math.min(lines.length - 1, Math.max(0, Math.floor((y / size.H) * lines.length)));
    setHover({ i, x, y });
  };

  // ป้ายเดือนบนแกนนอน
  const ticks = useMemo(() => {
    if (!size) return [];
    const out = [];
    const step = size.mobile ? 6 : 3;
    let [y, m] = first.slice(0, 7).split("-").map(Number);
    for (let k = 0; ; k++) {
      const d = Date.UTC(y, m - 1 + k, 1) / 864e5;
      if (d >= to) break;
      if (d >= from && k % step === 0) out.push({ x: ((d - from) / (to - from)) * size.W, label: formatMonth(dayToDate(d)) });
    }
    return out;
  }, [size, first, from, to]);

  // ป้ายอธิบายในพื้นที่ว่างใต้แนวเฉียง (ตรงกลางของจำนวนเส้น)
  const mid = lines[Math.floor(lines.length * 0.55)];
  const midX = size && mid ? ((mid.days[0] - from) / (to - from)) * size.W : 0;

  return (
    <div ref={seenRef}>
      <div
        ref={stageRef}
        className="lifelines"
        style={{ height: size?.H ?? 560 }}
        onPointerMove={(e) => e.pointerType === "mouse" && pick(e)}
        onPointerDown={pick}
        onPointerLeave={(e) => e.pointerType === "mouse" && setHover(null)}
      >
        <canvas ref={canvasRef} aria-hidden="true" />
        {size && mid && (
          <p className="lifelines-note" style={{ top: size.H * 0.55, right: size.W - midX + 14 }} aria-hidden="true">
            ขอบเฉียงนี้คือวันที่แต่ละคนซื้อครั้งแรก →
          </p>
        )}
        {hover && size && (
          <>
            <div className="lifelines-guide" style={{ top: (hover.i + 0.5) * (size.H / lines.length) }} aria-hidden="true" />
            <Loupe j={j} i={hover.i} from={from} to={to} state={state} style={size.mobile ? null : loupePos(hover, size)} />
          </>
        )}
      </div>
      <div className="lifelines-axis" aria-hidden="true">
        {ticks.map((t) => (
          <span key={t.label} style={{ left: t.x }}>
            {t.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function loupePos(hover, size) {
  const w = 300;
  const left = hover.x > size.W / 2 ? hover.x - w - 24 : hover.x + 24;
  const top = Math.min(Math.max(hover.y - 110, 8), size.H - 250);
  return { position: "absolute", left, top, width: w };
}

// แว่นขยาย: เส้นรอบ ๆ ตัวที่ชี้ ขยายให้เห็นทีละบิล พร้อมรายละเอียดของสมาชิกคนนั้น
function Loupe({ j, i, from, to, state, style }) {
  const { lines } = j;
  const l = lines[i];
  const W = 300;
  const ROW = 7;
  const rows = [];
  for (let k = i - LOUPE_ROWS; k <= i + LOUPE_ROWS; k++) if (k >= 0 && k < lines.length) rows.push(k);
  const xOf = (d) => ((d - from) / (to - from)) * W;
  return (
    <div className={`loupe ${style ? "" : "is-docked"}`} style={style ?? undefined} role="status" aria-live="polite">
      <svg viewBox={`0 0 ${W} ${(LOUPE_ROWS * 2 + 1) * ROW}`} aria-hidden="true">
        {rows.map((k) => {
          const line = lines[k];
          const y = (k - i + LOUPE_ROWS) * ROW;
          const cls = k === i ? "is-on" : state[k] === 0 ? "is-dim" : state[k] === 2 ? "is-hi" : "";
          return (
            <g key={k} className={cls}>
              <rect className="loupe-line" x={xOf(line.days[0])} y={y + 2.5} width={Math.max(1, xOf(line.days.at(-1) + 1) - xOf(line.days[0]))} height={1.5} />
              {line.days.map((d, n) => (
                <rect key={n} className="loupe-tick" x={xOf(d)} y={y} width={1.6} height={ROW - 1} />
              ))}
            </g>
          );
        })}
      </svg>
      <p className="loupe-title">
        สมาชิก {l.id}
        {l.home && <span> · ประจำสาขา{l.home}</span>}
      </p>
      <p className="loupe-body">
        <b>
          {formatNumber(l.bills)}
          {NB}บิล
        </b>{" "}
        · ใช้ไป {formatBaht(l.revenue)} · ซื้อ {l.branches === 1 ? "สาขาเดียว" : `${l.branches}${NB}สาขา`}
      </p>
      <p className="loupe-body">
        ครั้งแรก {formatDate(l.first)}
        {l.bills > 1 && <> · ล่าสุด {formatDate(l.last)}</>}
      </p>
      <p className={`loupe-status ${l.active ? "is-active" : ""}`}>
        {l.active ? `ยังมาอยู่ (มาใน ${ACTIVE_DAYS}${NB}วันล่าสุด)` : `ไม่ได้มาเกิน ${ACTIVE_DAYS}${NB}วันแล้ว`}
      </p>
    </div>
  );
}
