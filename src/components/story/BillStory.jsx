import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { prefersReducedMotion, useSeen } from "../ui.jsx";
import { useTheme } from "../scroll.js";
import { formatNumber } from "../../lib/metrics.js";
import {
  branchOrder,
  buildBills,
  holidayComparison,
  holidayMatches,
  hourProfiles,
  monthOfYearRatio,
  monthlyBillsPerDay,
  newBranchNewcomers,
  weekProfiles,
} from "../../lib/story.js";
import { branchLayout, columnLayout, massLayout } from "./layouts.js";

const DAYS = ["จ", "อ", "พ", "พฤ", "ศ", "ส", "อา"];
const MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const monthLabel = (m) => `${MONTHS[Number(m.slice(5, 7)) - 1]} ${(Number(m.slice(0, 4)) + 543) % 100}`;
const pct = (x) => `${Math.round(x * 100)}%`;
// ช่องว่างแบบไม่ตัดบรรทัด: ตัวเลขกับหน่วยอยู่บรรทัดเดียวกันเสมอ
const NB = "\u00a0";
const times = (x) => `${x.toFixed(1)}${NB}เท่า`;
// ชั่วโมงแบบที่คนไทยพูดกัน: 8 โมงเช้า, เที่ยง, บ่าย 2 โมง, 4 โมงเย็น, 1 ทุ่ม
const spokenHour = (h) =>
  (h === 12 ? "เที่ยง" : h < 12 ? `${h} โมงเช้า` : h === 13 ? "บ่ายโมง" : h <= 15 ? `บ่าย ${h - 12} โมง` : h <= 18 ? `${h - 12} โมงเย็น` : `${h - 18} ทุ่ม`).replaceAll(" ", NB);
const SEEN_KEY = "baanbrew-story-seen";
const STEP_COUNT = 7;
const DURATION = 1100;
const SWEEP = 380;

// เรื่องเล่า "ห้าสาขา คนละจังหวะ": ทุกบิลเป็นจุดหนึ่งจุด เลื่อนหน้าแล้วจุดชุดเดิมย้ายไปตอบคำถามถัดไป
// ดูจบ (อ่านถึงขั้นท้าย ๆ แล้วเลื่อนผ่านไป) เรื่องจะยุบเหลือสรุปสั้น ๆ กดดูอีกรอบได้
// จำไว้ใน sessionStorage: สลับแท็บกลับมายังยุบอยู่ แต่เปิดเว็บใหม่จะได้ดูเต็มอีกครั้ง
export default function BillStory({ data, holidays }) {
  const s = useStoryNumbers(data, holidays);
  const wrapRef = useRef(null);
  const endRef = useRef(null);
  const reached = useRef(0); // ขั้นไกลสุดที่เคยอ่านถึง
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return sessionStorage.getItem(SEEN_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [replayed, setReplayed] = useState(false);

  // ส่วนที่ยุบอยู่เหนือจอ จึงเลื่อนหน้าชดเชยความสูงที่หายไป เนื้อหาบนจอจะไม่กระโดด
  useEffect(() => {
    if (collapsed) return;
    // ฟังการเลื่อนหน้าแทน IntersectionObserver: เลื่อนเร็ว ๆ ข้ามไปทีเดียวจุดท้ายเรื่องไม่เคย "ตัด" ขอบจอ observer จะไม่ยิง
    let raf = 0;
    const check = () => {
      raf = 0;
      const bar = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--bar-h")) || 64;
      if (endRef.current.getBoundingClientRect().top > bar || reached.current < STEP_COUNT - 2) return;
      const wrap = wrapRef.current;
      const before = wrap.getBoundingClientRect().bottom;
      flushSync(() => setCollapsed(true));
      window.scrollBy(0, wrap.getBoundingClientRect().bottom - before);
      try {
        sessionStorage.setItem(SEEN_KEY, "1");
      } catch {
        /* เก็บไม่ได้ก็แค่ไม่จำ */
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(check);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [collapsed]);

  const replay = () => {
    reached.current = 0;
    setReplayed(true);
    setCollapsed(false);
    try {
      sessionStorage.removeItem(SEEN_KEY);
    } catch {
      /* ไม่เป็นไร */
    }
  };
  useLayoutEffect(() => {
    if (replayed && !collapsed) wrapRef.current.scrollIntoView({ block: "start" });
  }, [replayed, collapsed]);
  const onStep = useCallback((i) => {
    reached.current = Math.max(reached.current, i);
  }, []);

  return (
    <div ref={wrapRef} className="story-wrap">
      {collapsed ? <StoryRecap s={s} onReplay={replay} /> : <StoryStage s={s} holidays={holidays} onStep={onStep} />}
      <div ref={endRef} aria-hidden="true" />
    </div>
  );
}

// ---------- ข้อมูลและตัวเลขของเรื่อง ----------
function useStoryNumbers(data, holidays) {
  return useMemo(() => {
    const bills = buildBills(data.rows);
    const order = branchOrder(bills);
    const branches = order.map((o) => o.branch);
    const typeOf = new Map(data.branchInfo.map((b) => [b.branch, b.branch_type]));
    const hours = Object.fromEntries(hourProfiles(bills, branches).map((p) => [p.branch, p]));
    const week = Object.fromEntries(weekProfiles(bills, branches, holidays).map((p) => [p.branch, p]));
    const monthly = Object.fromEntries(monthlyBillsPerDay(bills, branches).map((m) => [m.branch, m]));
    const byType = (t) => branches.filter((b) => typeOf.get(b) === t);
    const newest = [...data.branchInfo].sort((a, b) => b.opened_date.localeCompare(a.opened_date))[0]?.branch;
    const office = byType("ออฟฟิศ")[0];
    const campus = byType("สถานศึกษา")[0];
    const malls = byType("ห้าง");
    const avg = (xs) => xs.reduce((a, v) => a + v, 0) / xs.length;
    const hourKeys = [];
    const hs = bills.map((b) => b.hour);
    for (let h = Math.min(...hs); h <= Math.max(...hs); h++) hourKeys.push(h);
    const out = {
      bills,
      branches,
      counts: new Map(order.map((o) => [o.branch, o.count])),
      typeOf,
      lines: data.rows.length,
      hourKeys,
      monthKeys: [...new Set(bills.map((b) => b.month))].sort(),
      office,
      campus,
      malls,
      newest,
      hours,
      week,
      newcomers: newest ? newBranchNewcomers(bills, newest) : null,
      campusMay: campus ? monthOfYearRatio(monthly[campus], "05") : null,
      mallBeforeTen: avg(malls.map((m) => hours[m].beforeTen)),
      mallWeekend: avg(malls.map((m) => week[m].weekendRatio)),
      holiday: Object.fromEntries(holidayComparison(bills, branches, holidayMatches(bills, holidays)).map((h) => [h.branch, h])),
    };
    out.mallHoliday = avg(malls.map((m) => out.holiday[m].ratio));
    return out;
  }, [data, holidays]);
}

// ---------- สรุปหลังดูจบ ----------
function StoryRecap({ s, onReplay }) {
  const [ref, seen] = useSeen(0.2);
  const items = [
    { value: pct(s.hours[s.office].beforeTen), text: <>ของบิลสาขา{s.office}ขายก่อน <span className="whitespace-nowrap">10 โมงเช้า</span> ห้างได้แค่ {pct(s.mallBeforeTen)}</> },
    { value: pct(s.week[s.office].weekendRatio), text: <>ยอดวันเสาร์–อาทิตย์ของ{s.office} เทียบวันธรรมดา ส่วนห้างได้ {times(s.mallWeekend)}</> },
    s.newcomers && { value: pct(s.newcomers.share), text: <>ของสมาชิกสาขา{s.newest} ไม่เคยซื้อที่สาขาไหนมาก่อน</> },
    s.campusMay && { value: pct(s.campusMay.ratio), text: <>ยอดต่อวันของ{s.campus}ตอนเดือนพฤษภา เทียบเดือนอื่น</> },
    { value: times(s.mallHoliday), text: <>บิลของห้างในวันหยุดราชการ เทียบวันธรรมดา</> },
  ].filter(Boolean);
  return (
    <section ref={ref} className={`story-recap ${seen ? "is-in" : ""}`} aria-label="สรุปเรื่อง ห้าสาขา คนละจังหวะ">
      <div className="story-recap-head">
        <p className="story-recap-eyebrow">ดูจบแล้ว · สรุปสั้น ๆ</p>
        <h2 className="story-recap-title font-display">ห้าสาขา คนละจังหวะ</h2>
        <button type="button" className="story-replay" onClick={onReplay}>
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path d="M4.5 10a5.5 5.5 0 1 0 1.6-3.9M5 3.5v3h3" />
          </svg>
          ดูเรื่องนี้อีกรอบ
        </button>
      </div>
      <ul className="story-recap-list">
        {items.map((it, i) => (
          <li key={i} style={{ transitionDelay: `${120 + i * 70}ms` }}>
            <b className="font-display">{it.value}</b>
            <span>{it.text}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ---------- ฉากจุด ----------
// ภาพวาดบน canvas (aria-hidden) ส่วนข้อความในแต่ละขั้นมีตัวเลขครบ อ่านอย่างเดียวก็ได้เรื่องเดียวกัน
function StoryStage({ s, holidays, onStep }) {
  const theme = useTheme();
  const stageRef = useRef(null);
  const canvasRef = useRef(null);
  const engine = useRef(null);
  const [active, setActive] = useState(0);
  const [geo, setGeo] = useState(null); // { W, H, plot, mobile }

  const { mallHoliday } = s;
  const first = s.bills[0]?.date;
  const last = s.bills.at(-1)?.date;
  const STEPS = useMemo(
    () => [
      {
        layout: "mass",
        title: (
          <>
            <span className="whitespace-nowrap">ห้าสาขา</span> <span className="whitespace-nowrap">คนละจังหวะ</span>
          </>
        ),
        body: (
          <>
            จุดแต่ละจุดตรงนี้คือบิลจริงหนึ่งใบ รวมแล้ว <b>{formatNumber(s.bills.length)} บิล</b> ({formatNumber(s.lines)} รายการ)
            ตั้งแต่ {monthLabel(first)} ถึง {monthLabel(last)}
            <span className="story-note">เลื่อนลงไปเรื่อย ๆ แล้วดูว่าจุดพวกนี้บอกอะไรเราได้บ้าง</span>
          </>
        ),
      },
      {
        layout: "branch",
        body: (
          <>
            แยกตามสาขาก่อน <b>{s.branches[0]}</b>ขายได้เยอะสุด {formatNumber(s.counts.get(s.branches[0]))} บิล ส่วน
            <b>{s.newest}</b>น้อยสุด เพราะเพิ่งเปิดตอน {s.newcomers && monthLabel(s.newcomers.opened.slice(0, 7))}
          </>
        ),
      },
      {
        layout: "hour",
        highlight: (b) => b.hour < 10,
        legend: `บิลก่อน 10${NB}โมงเช้า`,
        body: (
          <>
            ทีนี้ลองเรียงตามเวลาดู <b>{s.office}</b>อยู่ย่านออฟฟิศ ขายไปแล้ว <b>{pct(s.hours[s.office].beforeTen)}</b> ของทั้งวัน
            ตั้งแต่ก่อน <span className="whitespace-nowrap">10 โมงเช้า</span> คนแน่นสุดตอน {spokenHour(s.hours[s.office].peakHour)} ส่วนสาขาในห้าง ({s.malls.join(", ")}) ช่วงเช้าขายได้แค่{" "}
            <b>{pct(s.mallBeforeTen)}</b> แล้วไปคึกตอน {spokenHour(s.hours[s.malls[0]].peakHour)}
          </>
        ),
      },
      {
        layout: "week",
        highlight: (b) => b.weekday >= 5,
        legend: "บิลวันเสาร์–อาทิตย์",
        body: (
          <>
            พอถึงเสาร์–อาทิตย์ <b>{s.office}</b>ขายได้แค่ <b>{pct(s.week[s.office].weekendRatio)}</b> ของวันธรรมดา{" "}
            <b>{s.campus}</b>ก็เหลือ {pct(s.week[s.campus].weekendRatio)} แต่ห้างกลับขายดีขึ้นเป็น <b>{times(s.mallWeekend)}</b>
          </>
        ),
      },
      {
        layout: "month",
        highlight: (b) => b.branch === s.newest,
        legend: `บิลของสาขา${s.newest}`,
        body: s.newcomers && (
          <>
            ดูตามเดือนบ้าง <b>{s.newest}</b>เพิ่งโผล่มาตอน {monthLabel(s.newcomers.opened.slice(0, 7))} แต่สมาชิกที่มาซื้อที่นี่{" "}
            <b>{pct(s.newcomers.share)}</b> ({formatNumber(s.newcomers.newcomers)} จาก {formatNumber(s.newcomers.members)} คน)
            ไม่เคยซื้อสาขาไหนมาก่อนเลย แปลว่าสาขาใหม่ได้ลูกค้าใหม่มาจริง ๆ ไม่ได้ไปแย่งลูกค้าสาขาเดิม
          </>
        ),
      },
      {
        layout: "month",
        highlight: (b) => b.branch === s.campus && b.month.endsWith("-05"),
        legend: `บิลเดือนพฤษภา สาขา${s.campus}`,
        body: s.campusMay && (
          <>
            เห็นตรงที่ยุบลงไปไหม ทุกเดือนพฤษภา <b>{s.campus}</b>ขายได้แค่ <b>{pct(s.campusMay.ratio)}</b> ของเดือนอื่น
            เพราะตรงกับช่วงปิดเทอมใหญ่พอดี
          </>
        ),
      },
      {
        layout: "holiday",
        highlight: (b) => holidays.has(b.date),
        legend: "บิลวันหยุดราชการ",
        body: (
          <>
            สุดท้าย ลองเทียบวันหยุดราชการ {s.holiday[s.office].pairs} วัน กับวันเดียวกันของอาทิตย์ถัดไป ห้างขายได้มากขึ้นเป็น{" "}
            <b>{times(mallHoliday)}</b> แต่<b>{s.office}</b>เหลือแค่ <b>{pct(s.holiday[s.office].ratio)}</b> และ
            <b>{s.campus}</b>เหลือ {pct(s.holiday[s.campus].ratio)}
          </>
        ),
        outro: "ร้านเดียวกันแท้ ๆ แต่ลูกค้าแต่ละสาขาใช้ชีวิตคนละแบบ เลื่อนลงไปดูของแต่ละสาขาแบบละเอียดต่อได้เลย",
      },
    ],
    [s, first, last, holidays, mallHoliday]
  );

  // ---------- ขนาดภาพ ----------
  useEffect(() => {
    const el = stageRef.current;
    const measure = () => {
      const { width: W, height: H } = el.getBoundingClientRect();
      const mobile = W < 768;
      const gutter = mobile ? 92 : 104;
      const left = mobile ? 0 : Math.min(400, W * 0.36);
      const plot = mobile
        ? { x: gutter, y: 20, w: W - gutter - 10, h: H * 0.56 }
        : { x: left + gutter, y: 36, w: W - left - gutter - 24, h: H - 36 - 52 };
      setGeo({ W, H, plot, mobile });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ---------- ตำแหน่งของทุกขั้น (คำนวณใหม่เมื่อขนาดเปลี่ยน) ----------
  const layouts = useMemo(() => {
    if (!geo) return null;
    const { bills, branches, counts, hourKeys, monthKeys } = s;
    const out = {
      mass: massLayout(bills, geo.plot),
      branch: branchLayout(bills, geo.plot, branches, counts),
      hour: columnLayout(bills, geo.plot, branches, (b) => b.hour, hourKeys, (h) => `${String(h).padStart(2, "0")}`),
      week: columnLayout(bills, geo.plot, branches, (b) => b.weekday, [0, 1, 2, 3, 4, 5, 6], (d) => DAYS[d]),
      month: columnLayout(bills, geo.plot, branches, (b) => b.month, monthKeys, monthLabel),
      // วันหยุดเทียบวันคู่: บิลวันอื่นทั้งหมดจางหาย ความสูงสองกองต่อสาขาคืออัตราส่วนโดยตรง
      holiday: columnLayout(
        bills,
        geo.plot,
        branches,
        (b) => (s.holiday[b.branch].holidayDates.has(b.date) ? "h" : s.holiday[b.branch].matchDates.has(b.date) ? "m" : null),
        ["h", "m"],
        (k) => (k === "h" ? "วันหยุดราชการ" : "วันเดียวกัน อาทิตย์ถัดไป")
      ),
    };
    return out;
  }, [geo, s]);

  const highlights = useMemo(
    () =>
      STEPS.map((st) => {
        const hl = new Uint8Array(s.bills.length);
        if (st.highlight) s.bills.forEach((b, i) => (hl[i] = st.highlight(b) ? 1 : 0));
        return hl;
      }),
    [STEPS, s]
  );

  // ---------- เครื่องวาด ----------
  useEffect(() => {
    if (!layouts) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(geo.W * dpr);
    canvas.height = Math.round(geo.H * dpr);
    canvas.style.width = `${geo.W}px`;
    canvas.style.height = `${geo.H}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const n = s.bills.length;
    const prev = engine.current;
    const target = layouts[STEPS[active].layout];
    // ครั้งแรก: จุดเริ่มกระจายทั่วภาพแล้วรวมเป็นก้อน · เปลี่ยนขนาดจอ: กระโดดไปตำแหน่งใหม่ทันที
    let from = prev?.cur;
    if (!from || from.length !== n * 2) {
      from = new Float32Array(n * 2);
      for (let i = 0; i < n; i++) {
        from[i * 2] = Math.random() * geo.W;
        from[i * 2 + 1] = Math.random() * geo.H;
      }
    }
    const resized = prev && (prev.W !== geo.W || prev.H !== geo.H);
    const still = prefersReducedMotion() || resized;
    const delay = new Float32Array(n);
    const { plot } = geo;
    for (let i = 0; i < n; i++) delay[i] = still ? 0 : ((target.pos[i * 2] - plot.x) / plot.w) * SWEEP + ((i * 7919) % 211);
    // จุดที่ไม่อยู่ในขั้นนี้ไม่ต้องย้าย แค่จางหายตรงที่อยู่
    const to = new Float32Array(target.pos);
    if (target.hidden) {
      for (let i = 0; i < n; i++) {
        if (!target.hidden[i]) continue;
        to[i * 2] = from[i * 2];
        to[i * 2 + 1] = from[i * 2 + 1];
      }
    }
    const e = {
      W: geo.W,
      H: geo.H,
      cur: new Float32Array(from),
      from: new Float32Array(from),
      to,
      sizeFrom: prev?.size ?? target.size,
      size: target.size,
      hlFrom: prev?.hlTo ?? new Uint8Array(n),
      hlTo: highlights[active],
      hidFrom: prev?.hidTo ?? new Uint8Array(n),
      hidTo: target.hidden ?? new Uint8Array(n),
      start: performance.now(),
      still,
      raf: 0,
    };
    engine.current = e;

    const css = getComputedStyle(document.documentElement);
    const base = css.getPropertyValue("--dot").trim();
    const accent = css.getPropertyValue("--dot-hi").trim();
    const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

    const frame = (now) => {
      const t = e.still ? 1e9 : now - e.start;
      let moving = false;
      for (let i = 0; i < n; i++) {
        const p = Math.min(1, Math.max(0, (t - delay[i]) / DURATION));
        if (p < 1) moving = true;
        const k = ease(p);
        e.cur[i * 2] = e.from[i * 2] + (e.to[i * 2] - e.from[i * 2]) * k;
        e.cur[i * 2 + 1] = e.from[i * 2 + 1] + (e.to[i * 2 + 1] - e.from[i * 2 + 1]) * k;
      }
      const g = Math.min(1, t / 700);
      const sz = e.sizeFrom + (e.size - e.sizeFrom) * ease(Math.min(1, t / (DURATION + SWEEP)));
      ctx.clearRect(0, 0, e.W, e.H);
      // ความทึบของจุด: อยู่ทั้งสองขั้น = 1, กำลังปรากฏ = g, กำลังหาย = 1 − g
      // ไฮไลต์ทับบนจุดเดิม: เข้าค่อย ๆ ชัด ออกค่อย ๆ จาง
      for (let pass = 0; pass < 2; pass++) {
        ctx.fillStyle = pass ? accent : base;
        for (let i = 0; i < n; i++) {
          let a = e.hidTo[i] ? (e.hidFrom[i] ? 0 : 1 - g) : e.hidFrom[i] ? g : 1;
          if (pass) a *= e.hlTo[i] ? (e.hlFrom[i] ? 1 : g) : e.hlFrom[i] ? 1 - g : 0;
          if (a <= 0) continue;
          if (ctx.globalAlpha !== a) ctx.globalAlpha = a;
          ctx.fillRect(e.cur[i * 2], e.cur[i * 2 + 1], sz, sz);
        }
      }
      ctx.globalAlpha = 1;
      e.raf = moving || g < 1 ? requestAnimationFrame(frame) : 0;
    };
    e.raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(e.raf);
    // theme อยู่ใน deps เพื่อวาดใหม่ด้วยสีของธีมใหม่
  }, [layouts, active, highlights, STEPS, geo, s, theme]);

  // ---------- ขั้นที่กำลังอ่าน: การ์ดที่ผ่านกลางจอ ----------
  useEffect(() => {
    const cards = stageRef.current.parentElement.querySelectorAll("[data-step]");
    const io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) if (en.isIntersecting) setActive(Number(en.target.dataset.step));
      },
      { rootMargin: "-48% 0px -48% 0px" }
    );
    cards.forEach((c) => io.observe(c));
    return () => io.disconnect();
  }, [STEPS.length]);

  useEffect(() => {
    onStep(active);
  }, [active, onStep]);

  const step = STEPS[active];
  const labels = layouts?.[step.layout].labels ?? [];

  return (
    <section className="story" aria-label="เรื่องเล่า ห้าสาขา คนละจังหวะ">
      <div ref={stageRef} className="story-stage">
        <canvas ref={canvasRef} className="story-canvas" aria-hidden="true" />
        <div key={step.layout} className="story-labels" aria-hidden="true">
          {labels.map((l, i) =>
            l.kind === "row" ? (
              <span key={i} className="story-row-label" style={{ top: l.y, left: geo.plot.x - 12 }}>
                {l.text}
                <small>
                  {s.typeOf.get(l.text)}
                  {l.value != null && ` · ${formatNumber(l.value)} บิล`}
                </small>
              </span>
            ) : (
              <span key={i} className="story-tick" style={{ left: l.x, top: l.y + 8 }}>
                {l.text}
              </span>
            )
          )}
        </div>
        <p className="story-key" aria-hidden="true" style={geo && { left: geo.plot.x, top: geo.mobile ? geo.plot.y + geo.plot.h + 30 : 10 }}>
          <span className="story-swatch" /> 1 จุด = 1 บิล
          {step.legend && (
            <>
              <span className="story-swatch is-hi" /> {step.legend}
            </>
          )}
        </p>
      </div>

      <ol className="story-steps">
        {STEPS.map((st, i) => (
          <li key={i} data-step={i} className={`story-step ${i === active ? "is-active" : ""}`}>
            <div className="story-card">
              {st.title && <h2 className="story-title font-display">{st.title}</h2>}
              <p>{st.body}</p>
              {st.outro && <p className="story-outro">{st.outro}</p>}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
