import { useEffect, useMemo, useRef, useState } from "react";
import { prefersReducedMotion } from "../ui.jsx";
import { useTheme } from "../scroll.js";
import { formatBaht, formatMonth, formatNumber } from "../../lib/metrics.js";
import { ACTIVE_DAYS } from "../../lib/customerMetrics.js";
import { TOP_SHARE } from "../../lib/journeys.js";
import CollapsibleStory from "../story/CollapsibleStory.jsx";
import { barsLayout, branchLayout, gridLayout, timeLayout } from "./memberLayouts.js";

const pct = (x) => `${Math.round(x * 100)}%`;
// ช่องว่างแบบไม่ตัดบรรทัด: ตัวเลขกับหน่วยอยู่บรรทัดเดียวกันเสมอ
const NB = " ";
const Num = ({ children }) => <span className="whitespace-nowrap">{children}</span>;
const DURATION = 1000;
const STAGGER = 520;
const FADE = 650;
const DIM = 0.13;
const SEEN_KEY = "baanbrew-member-story-seen";
const STEP_COUNT = 9;

// เรื่องเล่า "เส้นทางของสมาชิก": สมาชิกทุกคนเป็นรูปหนึ่งชิ้นบนภาพ เลื่อนหน้าแล้วชิ้นเดิมเปลี่ยนรูป
// ช่องละคน → ยืดเป็นเส้นชีวิต → ไฮไลต์คนที่หายไป → เรียงใหม่ตามเงินที่ใช้ → แยกสาขาประจำ → กลับเป็นช่อง ชวนใครกลับก่อน
// ดูจบแล้วยุบเหลือสรุปสั้น ๆ เหมือนเรื่องเล่าหน้าภาพรวม (CollapsibleStory)
export default function MemberStory({ j, view, first }) {
  const { groups } = j;
  const recap = {
    title: "เส้นทางของสมาชิก",
    items: [
      { value: pct(j.never / j.members), text: <>ของสมาชิกสมัครแล้วยังไม่เคยมาซื้อ ({formatNumber(j.never)}{NB}คน)</> },
      { value: pct(groups.once.count / j.buyers), text: <>ของคนที่เคยซื้อ มาครั้งเดียวแล้วไม่กลับมา</> },
      { value: <Num>{formatNumber(groups.lapsed.count)} คน</Num>, text: <>ไม่ได้มาเกิน <Num>{ACTIVE_DAYS} วัน</Num> ทั้งที่ครึ่งหนึ่งเคยซื้อ <Num>{groups.lapsed.medianBills} บิล</Num>ขึ้นไป</> },
      { value: pct(groups.top.revenueShare), text: <>ของยอดสมาชิก มาจาก {pct(TOP_SHARE)} ที่ใช้จ่ายเยอะสุด</> },
      { value: pct(groups.oneBranch.count / j.buyers), text: <>ซื้อแค่สาขาเดียวมาตลอด</> },
    ],
  };
  return (
    <CollapsibleStory
      seenKey={SEEN_KEY}
      stepCount={STEP_COUNT}
      recap={recap}
      renderStage={(onStep) => <MemberStage j={j} view={view} first={first} onStep={onStep} />}
    />
  );
}

// ---------- ฉากสมาชิก ----------
// ภาพวาดบน canvas (aria-hidden) ข้อความในแต่ละขั้นมีตัวเลขครบ อ่านอย่างเดียวก็ได้เรื่องเดียวกัน
function MemberStage({ j, view, first, onStep }) {
  const theme = useTheme();
  const stageRef = useRef(null);
  const canvasRef = useRef(null);
  const engine = useRef(null);
  const [active, setActive] = useState(0);
  const [geo, setGeo] = useState(null); // { W, H, plot, mobile }

  const { lines, groups, inGroup } = j;
  const n = j.members;
  const activeCount = lines.length - groups.lapsed.count;
  const r1 = j.retention(1);
  const r6 = j.retention(6);
  const from = Date.parse(`${first}T00:00:00Z`) / 864e5;
  const to = j.span.to + 1;
  const topRevenue = useMemo(() => {
    const sorted = [...lines].sort((a, b) => b.revenue - a.revenue);
    return { first: sorted[0]?.revenue ?? 0, median: sorted[sorted.length >> 1]?.revenue ?? 0 };
  }, [lines]);

  // สมาชิกที่ i: ถ้า i < buyers คือ lines[i], ที่เหลือคือคนที่ยังไม่เคยซื้อ (line = undefined)
  const isNever = (i) => i >= lines.length;
  const lineTest = (test) => (i) => !isNever(i) && test(lines[i]);

  const STEPS = useMemo(
    () => [
      {
        layout: "grid",
        key: "1 ช่อง = สมาชิก 1 คน",
        eyebrow: "เส้นทางของสมาชิก",
        title: (
          <>
            สมาชิก <Num>{formatNumber(n)} คน</Num> <Num>ทำยอดให้ร้าน {pct(view.kpis.memberShare)}</Num>
          </>
        ),
        body: (
          <>
            ช่องเล็ก ๆ ตรงนี้คือสมาชิกหนึ่งคน ครบทุกคนที่เคยสมัครบัตร
            <span className="story-note">เลื่อนลงไปดูว่าหลังสมัครแล้ว แต่ละคนไปทางไหนกันบ้าง</span>
          </>
        ),
      },
      {
        layout: "grid",
        highlight: isNever,
        legend: "สมัครแล้วยังไม่เคยซื้อ",
        body: (
          <>
            เริ่มจากเรื่องที่น่าเสียดายก่อน <b>{formatNumber(j.never)} คน</b> ({pct(j.never / n)}) สมัครไว้แต่ยังไม่เคยมาซื้อเลย ส่วนอีก{" "}
            <b>{formatNumber(j.buyers)} คน</b>ที่มาซื้อ ครึ่งหนึ่งมาภายใน <b>{j.joinToFirst} วัน</b>หลังสมัคร
          </>
        ),
      },
      {
        layout: "time",
        key: "1 เส้น = 1 คน · 1 ขีด = 1 บิล",
        body: (
          <>
            ทีนี้ยืดคนที่เคยซื้อออกเป็นเส้น เส้นเริ่มที่บิลแรกและจบที่บิลล่าสุด ขีดบนเส้นคือบิลแต่ละใบ
            <span className="story-note">เรียงตามวันที่ซื้อครั้งแรก ขอบเฉียงด้านซ้ายจึงเป็นเหมือนเส้นเวลาที่คนใหม่ ๆ ทยอยเข้ามา</span>
          </>
        ),
      },
      {
        layout: "time",
        highlight: lineTest(inGroup.once),
        legend: "ซื้อครั้งเดียว",
        body: (
          <>
            มีเส้นที่สั้นจนเหลือแค่ขีดเดียว <b>{formatNumber(groups.once.count)} คน</b> ({pct(groups.once.count / j.buyers)} ของคนที่เคยซื้อ)
            มาครั้งเดียวแล้วไม่กลับมาอีกเลย
          </>
        ),
      },
      {
        layout: "time",
        highlight: lineTest((l) => l.active),
        legend: `มาใน ${ACTIVE_DAYS}${NB}วันล่าสุด`,
        body: (
          <>
            คนที่ติดใจ ครึ่งหนึ่งกลับมาซื้อบิลที่สองภายใน <b>{j.toSecond} วัน</b> เส้นที่ลากไปถึงขอบขวาคือคนที่ยังมาอยู่ตอนนี้{" "}
            <b>{formatNumber(activeCount)} คน</b>
            {r1 != null && r6 != null && (
              <>
                {" "}
                แต่โดยเฉลี่ย เดือนถัดมาจะกลับมาแค่ <b>{pct(r1)}</b> และพอครบ 6 เดือนเหลือ <b>{pct(r6)}</b>
              </>
            )}
          </>
        ),
      },
      {
        layout: "time",
        highlight: lineTest(inGroup.lapsed),
        legend: `ไม่ได้มาเกิน ${ACTIVE_DAYS}${NB}วัน`,
        body: (
          <>
            ส่วนเส้นที่หยุดกลางทาง <b>{formatNumber(groups.lapsed.count)} คน</b> ไม่ได้มาเกิน <Num>{ACTIVE_DAYS} วัน</Num>แล้ว ทั้งที่ครึ่งหนึ่งเคยซื้อไป{" "}
            <b>{groups.lapsed.medianBills} บิล</b>ขึ้นไป คนกลุ่มนี้รู้จักร้านดีแล้วแต่หายไปเฉย ๆ
          </>
        ),
      },
      {
        layout: "bars",
        key: "1 แท่ง = 1 คน · ยาวตามเงินที่ใช้",
        highlight: lineTest(inGroup.top),
        legend: `${pct(TOP_SHARE)} ที่ใช้จ่ายเยอะสุด`,
        body: (
          <>
            ลองเรียงใหม่ตามเงินที่แต่ละคนใช้ คนบนสุดใช้ไป {formatBaht(topRevenue.first)} ส่วนคนตรงกลางใช้แค่ {formatBaht(topRevenue.median)} แค่{" "}
            <b>{formatNumber(groups.top.count)} คน</b>บนสุด ({pct(TOP_SHARE)}) ก็ทำยอดให้ร้านไป <b>{pct(groups.top.revenueShare)}</b>{" "}
            ของยอดสมาชิกทั้งหมด
          </>
        ),
      },
      {
        layout: "branch",
        key: "1 เส้น = 1 คน · แยกตามสาขาประจำ",
        highlight: lineTest(inGroup.oneBranch),
        legend: "ซื้อแค่สาขาเดียว",
        body: (
          <>
            แล้วแต่ละคนไปซื้อที่ไหน แยกตามสาขาประจำดู <b>{pct(groups.oneBranch.count / j.buyers)}</b> ซื้อแค่สาขาเดียวมาตลอด และบิลของสมาชิก{" "}
            <b>{pct(groups.oneBranch.homeBillShare)}</b> เกิดที่สาขาประจำ ลูกค้าส่วนใหญ่ซื้อที่สาขาเดิมของตัวเอง ไม่ค่อยข้ามไปสาขาอื่น
          </>
        ),
      },
      {
        layout: "grid",
        key: "1 ช่อง = สมาชิก 1 คน",
        highlight: (i) => isNever(i) || !lines[i].active,
        legend: "ชวนกลับได้",
        body: (
          <>
            กลับมาที่ช่องละคนอีกที ถ้าจะทำโปรฯ เริ่มที่ช่องสีเข้มพวกนี้ก่อน <b>{formatNumber(groups.lapsed.count)} คน</b>เคยซื้อแล้วหายไป อีก{" "}
            <b>{formatNumber(j.never)} คน</b>สมัครแล้วยังไม่เคยมา รวม <b>{pct((groups.lapsed.count + j.never) / n)}</b> ของสมาชิกทั้งหมด
          </>
        ),
        outro: "ชวนคนที่รู้จักร้านอยู่แล้วกลับมา น่าจะง่ายกว่าหาคนใหม่ · เลื่อนลงไปลองสำรวจเส้นของแต่ละคนเองได้",
      },
    ],
    [j, view, activeCount, r1, r6, topRevenue]
  );

  // ---------- ขนาดภาพ ----------
  useEffect(() => {
    const el = stageRef.current;
    const measure = () => {
      const { width: W, height: H } = el.getBoundingClientRect();
      const mobile = W < 768;
      const gutter = mobile ? 76 : 112;
      const left = mobile ? 0 : Math.min(400, W * 0.36);
      const plot = mobile
        ? { x: gutter, y: 62, w: W - gutter - 10, h: H * 0.48 }
        : { x: left + gutter, y: 48, w: W - left - gutter - 24, h: H - 48 - 52 };
      setGeo({ W, H, plot, mobile });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const layouts = useMemo(() => {
    if (!geo) return null;
    const { plot, mobile } = geo;
    return {
      grid: gridLayout(n, plot),
      time: timeLayout(n, lines, plot, from, to, mobile, formatMonth),
      bars: barsLayout(n, lines, plot, groups.top.count, `${pct(TOP_SHARE)} แรก · ${formatNumber(groups.top.count)}${NB}คน`),
      branch: branchLayout(n, lines, plot, from, to, mobile, formatMonth, "ไม่ระบุสาขา"),
    };
  }, [geo, n, lines, from, to, groups]);

  // สถานะต่อคนในแต่ละขั้น: 0 = จาง, 1 = ปกติ, 2 = ไฮไลต์
  const states = useMemo(
    () =>
      STEPS.map((st) => {
        const s = new Uint8Array(n);
        for (let i = 0; i < n; i++) s[i] = st.highlight ? (st.highlight(i) ? 2 : 0) : 1;
        return s;
      }),
    [STEPS, n]
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

    const prev = engine.current;
    const target = layouts[STEPS[active].layout];
    const resized = prev && (prev.W !== geo.W || prev.H !== geo.H);
    const still = prefersReducedMotion() || resized;
    // ครั้งแรก: ช่องทุกช่องโผล่ขึ้นจากจุดเล็ก ๆ ตรงที่ของตัวเอง
    let fromGeo = prev?.cur;
    if (!fromGeo) {
      fromGeo = new Float32Array(target.geo);
      for (let i = 0; i < n; i++) {
        fromGeo[i * 4 + 1] = fromGeo[i * 4];
        fromGeo[i * 4 + 2] += fromGeo[i * 4 + 3] / 2;
        fromGeo[i * 4 + 3] = 0;
      }
    }
    // คนที่ไม่อยู่ในฉากนี้ไม่ต้องย้าย แค่จางหายตรงที่อยู่
    const toGeo = new Float32Array(target.geo);
    const hidTo = target.hidden ?? new Uint8Array(n);
    for (let i = 0; i < n; i++) if (hidTo[i]) for (let k = 0; k < 4; k++) toGeo[i * 4 + k] = fromGeo[i * 4 + k];
    const { plot } = geo;
    const delay = new Float32Array(n);
    for (let i = 0; i < n; i++) delay[i] = still ? 0 : ((toGeo[i * 4 + 2] - plot.y) / plot.h) * STAGGER;

    const e = {
      W: geo.W,
      H: geo.H,
      cur: new Float32Array(fromGeo),
      from: new Float32Array(fromGeo),
      to: toGeo,
      lookFrom: prev?.lookTo ?? { fill: 0, tick: 0, fillHi: 0, tickHi: 0 },
      lookTo: target.look,
      stFrom: prev?.stTo ?? states[active],
      stTo: states[active],
      hidFrom: prev?.hidTo ?? hidTo,
      hidTo,
      start: performance.now(),
      raf: 0,
    };
    engine.current = e;

    const css = getComputedStyle(document.documentElement);
    const base = css.getPropertyValue("--life-tick").trim();
    const accent = css.getPropertyValue("--dot-hi").trim();
    const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
    const lerp = (a, b, t) => a + (b - a) * t;
    // ความทึบของคนหนึ่งคน ตามสถานะ (0 จาง / 1 ปกติ / 2 ไฮไลต์) และหน้าตาของฉาก
    const alphaOf = (look, st, hi, part) =>
      hi ? (st === 2 ? look[`${part}Hi`] : 0) : st === 1 ? look[part] : st === 0 ? look[part] * DIM : 0;

    const frame = (now) => {
      const t = still ? 1e9 : now - e.start;
      const g = Math.min(1, t / FADE);
      let moving = false;
      for (let i = 0; i < n * 4; i++) {
        const p = Math.min(1, Math.max(0, (t - delay[i >> 2]) / DURATION));
        if (p < 1) moving = true;
        e.cur[i] = lerp(e.from[i], e.to[i], ease(p));
      }
      ctx.clearRect(0, 0, e.W, e.H);
      for (let pass = 0; pass < 2; pass++) {
        const hi = pass === 1;
        ctx.fillStyle = hi ? accent : base;
        for (let i = 0; i < n; i++) {
          const vis = lerp(e.hidFrom[i] ? 0 : 1, e.hidTo[i] ? 0 : 1, g);
          if (vis <= 0) continue;
          const fa = vis * lerp(alphaOf(e.lookFrom, e.stFrom[i], hi, "fill"), alphaOf(e.lookTo, e.stTo[i], hi, "fill"), g);
          const ta = vis * lerp(alphaOf(e.lookFrom, e.stFrom[i], hi, "tick"), alphaOf(e.lookTo, e.stTo[i], hi, "tick"), g);
          if (fa <= 0.002 && ta <= 0.002) continue;
          const x0 = e.cur[i * 4];
          const x1 = e.cur[i * 4 + 1];
          const y = e.cur[i * 4 + 2];
          const h = e.cur[i * 4 + 3];
          if (fa > 0.002) {
            ctx.globalAlpha = fa;
            ctx.fillRect(x0, y, Math.max(1, x1 - x0), h);
          }
          const l = lines[i];
          if (ta > 0.002 && l) {
            // ขีดบิลวางตามสัดส่วนในช่วงเส้นปัจจุบัน ระหว่างเปลี่ยนรูปขีดจึงยืด/หดไปพร้อมเส้น
            ctx.globalAlpha = ta;
            const d0 = l.days[0];
            const span = l.days.at(-1) + 1 - d0;
            for (const d of l.days) ctx.fillRect(x0 + ((d - d0) / span) * (x1 - x0), y, 1.4, h);
          }
        }
      }
      ctx.globalAlpha = 1;
      e.raf = moving || g < 1 ? requestAnimationFrame(frame) : 0;
    };
    e.raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(e.raf);
    // theme อยู่ใน deps เพื่อวาดใหม่ด้วยสีของธีมใหม่
  }, [layouts, active, states, STEPS, geo, n, lines, theme]);

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
  // ขั้นที่ใช้ภาพเดิมต่อจากขั้นก่อน ใช้คำอธิบายภาพ (key) ของขั้นก่อนหน้า
  const keyText = STEPS.slice(0, active + 1).findLast((st) => st.key).key;
  const labels = layouts?.[step.layout].labels ?? [];

  return (
    <section className="story mstory" aria-label="เรื่องเล่า เส้นทางของสมาชิก">
      <div ref={stageRef} className="story-stage">
        <canvas ref={canvasRef} className="story-canvas" aria-hidden="true" />
        <div key={step.layout} className="story-labels" aria-hidden="true">
          {labels.map((l, i) =>
            l.kind === "row" ? (
              <span key={i} className="story-row-label" style={{ top: l.y, left: geo.plot.x - 12 }}>
                {l.text}
                <small>
                  {formatNumber(l.count)}
                  {NB}คน
                </small>
              </span>
            ) : l.kind === "mark" ? (
              <span key={i} className="mstory-mark" style={{ top: l.y, left: l.x, width: l.w }}>
                <span>{l.text}</span>
              </span>
            ) : (
              <span key={i} className="story-tick" style={{ left: l.x, top: l.y + 8 }}>
                {l.text}
              </span>
            )
          )}
        </div>
        <p className="story-key" aria-hidden="true" style={geo && { left: geo.plot.x, top: geo.mobile ? 12 : 14 }}>
          <span className="story-swatch mstory-swatch" /> {keyText}
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
              {st.eyebrow && <p className="journey-eyebrow">{st.eyebrow}</p>}
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
