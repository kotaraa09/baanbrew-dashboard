// ตัวควบคุมแมวแบบตัดแปะ: เมาส์/โหมด → สปริง → transform/opacity ของแต่ละชิ้น ทุกเฟรม
// ไม่ผ่าน React state จึงไม่ re-render ทั้งต้นไม้ 60 ครั้งต่อวินาที
//
// ชิ้นภาพมาจากภาพวาดต้นแบบ (ดู art.js): ลำตัว หาง (5 ท่อน) หู หัว (เจาะรูตา) ม่านตา อุ้งเท้า
// ท่าที่ภาพเดียวทำไม่ได้ (ปิดตา แอบมอง หลับตา) เป็นภาพวาดอีกชุดที่ค่อย ๆ จางเข้ามาทับเฉพาะบริเวณที่ต่าง
// ตอนล็อกอินสำเร็จเล่นเฟรมจากวิดีโอบน <canvas> (เฟรมแรกตรงกับท่าพักพอดี จึงต่อกันเนียน)
import gsap from "gsap";
import * as A from "./art.js";

const SETTLE_MS = 220; // ก่อนเล่นวิดีโอ: ให้ทุกชิ้นกลับท่าพักก่อน (เฟรมแรกของวิดีโอคือท่าพัก)
const FRAME_MS = 1000 / A.EXIT.fps;
const longest = Math.max(...Object.values(A.EXIT.themes).map((t) => t.frames));
// LiveTab ค้างหน้าล็อกอินไว้เท่านี้ให้แมวกระโดดลาจบก่อนเปิด Dashboard
export const LEAVE_MS = Math.ceil(SETTLE_MS + longest * FRAME_MS + 60);

const SLEEP_AFTER_MS = 12000;
const PET_DISTANCE = 90; // ถูไปมาบนตัวรวมกันกี่หน่วยถึงนับว่าลูบ
const STARTLE_MS = 1300;

// สปริง: ค่าวิ่งเข้าหาเป้าแล้วเลยไปนิดก่อนนิ่ง · k = ความแข็ง, z = ความหน่วง (1 = ไม่เลยเป้า)
export const spring = (x = 0) => ({ x, v: 0, to: x });
export function step(s, dt, k, z) {
  s.v += (k * (s.to - s.x) - 2 * Math.sqrt(k) * z * s.v) * dt;
  s.x += s.v * dt;
}
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const f2 = (v) => Math.round(v * 100) / 100;

// หาง: ท่อนใกล้โคนแกว่งน้อย ปลายแกว่งมาก (องศา) · ลบ = ปลายหางเชิดขึ้น
const TAIL_SWAY = [0.3, 1, 1.8, 2.8, 4];
const TAIL_CURL = [0, -1, -3, -5, -8];
const TAIL_K = [240, 180, 140, 110, 90];
const TAIL_ROOT = [392, 352]; // โคนหาง (ซ่อนอยู่หลังสะโพกด้านซ้าย)

export function createRig(svg, { onMood = () => {}, canvas, exitUrl } = {}) {
  const q = (name) => svg.querySelector(`[data-part="${name}"]`);
  const el = {
    cat: q("cat"),
    body: q("body"),
    head: q("head"),
    tail: Array.from({ length: A.TAIL_SEGMENTS }, (_, i) => q(`tail-${i}`)),
    ears: [q("ear-l"), q("ear-r")],
    eyes: [...svg.querySelectorAll('[data-part="eye"]')].map((g) => ({
      iris: g.querySelector('[data-part="iris"]'),
      pupil: g.querySelector('[data-part="pupil"]'),
      lid: g.querySelector('[data-part="lid"]'),
    })),
    paws: [q("paw-0"), q("paw-1")],
    closed: q("closed"),
    cover: q("cover"),
    peek: q("peek"),
    hit: q("hit"),
  };
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const now0 = performance.now();

  const S = {
    mode: "idle",
    pointer: null, // จุดที่มองในพิกัด SVG (เมาส์)
    caret: null, // เคอร์เซอร์ในช่องอีเมลที่ฟอร์มส่งมา (มาก่อนเมาส์)
    lastActive: now0,
    sleeping: false,
    petting: false,
    shown: { sleeping: false, petting: false }, // ค่าที่ส่งให้ React แล้ว (ส่งใหม่เฉพาะตอนเปลี่ยน)
    pet: { distance: 0, until: 0 },
    startleAt: -1e9,
    lookX: spring(),
    lookY: spring(),
    pupils: A.EYES.map(() => ({ x: spring(), y: spring() })),
    dilate: spring(1),
    lid: A.EYES.map(() => spring(0)),
    closed: spring(0),
    ears: [spring(0), spring(0)],
    droop: spring(0),
    cover: spring(0),
    peek: spring(0),
    hop: spring(0),
    puff: spring(0),
    tail: TAIL_SWAY.map(() => spring(0)),
    breath: 0,
    blink: { start: -1, next: now0 + 1800, double: false },
    earFlickAt: now0 + 4000,
    tailFlickAt: now0 + 3000,
    leave: null, // { start, theme, frame, placed } ตอนล็อกอินสำเร็จ
  };

  // หน้าทดลองในเครื่อง (design/cat-lab) อ่าน/ตั้งค่าได้ตอน dev เท่านั้น build จริงตัดบรรทัดนี้ทิ้ง
  if (import.meta.env.DEV) svg.catState = S;

  // ---------- ภาพเฟรมตอนกระโดดลา: โหลดเงียบ ๆ หลังหน้าแสดงแล้ว เฉพาะธีมที่ใช้อยู่ ----------
  const exitImg = {};
  const themeNow = () => (document.documentElement.dataset.theme === "dark" ? "dark" : "light");
  const loadExit = (t = themeNow()) => {
    if (exitImg[t] || !exitUrl?.[t]) return;
    const img = new Image();
    img.decoding = "async";
    img.fetchPriority = "low";
    img.src = exitUrl[t];
    exitImg[t] = { img, ready: false };
    img.decode().then(
      () => (exitImg[t].ready = true),
      () => {},
    );
  };
  const preload = setTimeout(() => loadExit(), 1200);

  const toSvg = (cx, cy) => {
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const p = new DOMPoint(cx, cy).matrixTransform(ctm.inverse());
    return [p.x, p.y];
  };
  const wake = (now = performance.now()) => {
    S.lastActive = now;
  };

  // ---------- เหตุการณ์ ----------
  const onMove = (e) => {
    S.pointer = toSvg(e.clientX, e.clientY);
    wake();
  };
  const onKey = () => wake();
  window.addEventListener("pointermove", onMove);
  window.addEventListener("keydown", onKey);
  // ลูบ: สะสมระยะที่ถูไปมาบนตัวแมว ถึงเกณฑ์ก็ฟิน หยุดลูบ 0.9 วินาทีก็เลิก
  const onPet = (e) => {
    S.pet.distance += Math.abs(e.movementX) + Math.abs(e.movementY);
    if (S.pet.distance > PET_DISTANCE) S.petting = true;
    S.pet.until = performance.now() + 900;
  };
  el.hit.addEventListener("pointermove", onPet);

  // ---------- เป้าหมายตามอารมณ์ ----------
  function setTargets(now) {
    const covered = S.mode === "cover" || S.mode === "peek";
    const leaving = !!S.leave;
    const startled = now - S.startleAt < STARTLE_MS;
    if (S.petting && now > S.pet.until) {
      S.petting = false;
      S.pet.distance = 0;
    }
    const sleeping = !covered && !leaving && !S.petting && !startled && S.mode === "idle" && now - S.lastActive > SLEEP_AFTER_MS;
    if (sleeping !== S.shown.sleeping || S.petting !== S.shown.petting) {
      S.shown = { sleeping, petting: S.petting };
      onMood(S.shown);
    }
    S.sleeping = sleeping;

    // ปิดตา/แอบมอง/กำลังลา: หัวอยู่ท่าพัก เพราะภาพท่าปิดตาและเฟรมแรกของวิดีโอวาดจากท่าพัก
    const still = covered || leaving;
    const p = S.caret ?? S.pointer;
    const look = p && !still ? [clamp((p[0] - 870) / 260, -1, 1), clamp((p[1] - 290) / 220, -1, 1)] : [0, 0];
    S.lookX.to = sleeping ? 0 : look[0];
    S.lookY.to = sleeping ? 0.3 : look[1];
    S.closed.to = !leaving && (sleeping || S.petting) ? 1 : 0;
    S.lid.forEach((l) => (l.to = startled ? -0.15 : 0));
    const near = p ? Math.hypot(p[0] - 860, p[1] - 290) < 260 : false;
    S.dilate.to = startled ? 1.8 : near && !still ? 1.2 : 1;
    // หูลู่ไปด้านหลังกี่องศา (สะดุ้ง = ลู่แบนสุด)
    const ear = leaving ? 0 : startled ? 28 : covered ? 6 : S.petting ? 9 : sleeping ? 5 : 0;
    S.ears[0].to = ear;
    S.ears[1].to = ear;
    S.droop.to = still ? 0 : sleeping ? 1 : S.petting ? 0.3 : 0;
    S.cover.to = covered ? 1 : 0;
    S.peek.to = S.mode === "peek" ? 1 : 0;
    const curl = leaving ? 0 : S.petting ? 1 : covered ? 0.4 : 0;
    S.tail.forEach((t, i) => (t.to = curl * TAIL_CURL[i]));
  }

  // ---------- ช่วงเวลาสุ่ม: กะพริบตา หูกระดิก หางสะบัด ----------
  function idleEvents(now) {
    if (reduce || S.leave) return;
    if (now > S.blink.next && !S.sleeping) {
      S.blink.start = now;
      S.blink.double = Math.random() < 0.18;
      S.blink.next = now + 2200 + Math.random() * 4200;
    }
    if (now > S.earFlickAt) {
      S.ears[Math.random() < 0.5 ? 0 : 1].v += S.sleeping ? 160 : 300;
      S.earFlickAt = now + (S.petting ? 900 : 4000 + Math.random() * 6000);
    }
    if (now > S.tailFlickAt && !S.sleeping) {
      const kick = 60 + Math.random() * 60;
      S.tail[4].v -= kick;
      S.tail[3].v -= kick * 0.5;
      S.tailFlickAt = now + 3000 + Math.random() * 5000;
    }
  }
  function blinkAmount(now) {
    if (S.blink.start < 0) return 0;
    const t = now - S.blink.start;
    const one = (u) => (u < 70 ? u / 70 : u < 100 ? 1 : u < 200 ? 1 - (u - 100) / 100 : 0);
    const v = Math.max(one(t), S.blink.double ? one(t - 240) : 0);
    if (t > 520) S.blink.start = -1;
    return v * v * (3 - 2 * v);
  }

  function integrate(dt, now) {
    // กำลังลา: สปริงแข็งขึ้น 6 เท่า ทุกชิ้นกลับท่าพักทันก่อนเฟรมแรกของวิดีโอ
    const stiff = S.leave ? 6 : 1;
    const sp = (s, k, z) => (reduce ? ((s.x = s.to), (s.v = 0)) : step(s, dt, k * stiff, z));
    sp(S.lookX, 60, 0.75);
    sp(S.lookY, 60, 0.75);
    sp(S.dilate, 90, 0.7);
    S.lid.forEach((l) => sp(l, 160, 0.85));
    sp(S.closed, 70, 1);
    S.ears.forEach((e) => sp(e, 220, 0.32));
    sp(S.droop, 40, 0.8);
    sp(S.cover, 260, 0.9);
    sp(S.peek, 260, 0.9);
    sp(S.hop, 260, 0.35);
    sp(S.puff, 200, 0.4);
    S.pupils.forEach((p) => {
      sp(p.x, 500, 0.85);
      sp(p.y, 500, 0.85);
    });
    // หาง: ท่อนปลายอ่อนกว่า (k น้อย) จึงตามไม่ทัน สะบัดเป็นคลื่นแบบแส้
    const w = (now / 4200) * Math.PI * 2;
    const amp = S.leave ? 0 : S.sleeping ? 0.3 : S.petting ? 1.6 : 1;
    S.tail.forEach((t, i) => {
      const target = t.to + (reduce ? 0 : TAIL_SWAY[i] * amp * Math.sin(w - i * 0.7));
      if (reduce) t.x = target;
      else {
        const k = TAIL_K[i] * stiff;
        t.v += (k * (target - t.x) - 2 * Math.sqrt(k) * 0.38 * t.v) * dt;
        t.x += t.v * dt;
      }
    });
  }

  // ---------- เขียนลง SVG ----------
  const setT = (node, t) => node && node.setAttribute("transform", t);
  const setO = (node, o) => node && (node.style.opacity = f2(clamp(o, 0, 1)));

  function render(now, dt) {
    // หายใจ: ช้า ๆ (หลับ: ช้าและลึกกว่า, ฟิน: เร็วขึ้นนิด)
    const period = S.sleeping ? 5200 : S.petting ? 2600 : 3800;
    if (!reduce && !S.leave) S.breath += ((dt * 1000) / period) * Math.PI * 2;
    const b = reduce || S.leave ? 0 : Math.sin(S.breath) * (S.sleeping ? 0.016 : 0.01);
    const puff = 1 + S.puff.x * 0.04;
    const [bx, by] = A.BODY_PIVOT;

    // สะดุ้ง: กระโดดขึ้น + ตัวพองแวบหนึ่ง
    setT(el.cat, `translate(0 ${f2(-S.hop.x)}) translate(${bx} ${by}) scale(${f2(puff)}) translate(${-bx} ${-by})`);
    setT(el.body, `translate(${bx} ${by}) scale(${f2(1 + b * 0.3)} ${f2(1 + b)}) translate(${-bx} ${-by})`);

    // หาง: แต่ละท่อนหมุนรอบข้อต่อของตัวเอง (ซ้อนกันอยู่ ท่อนปลายจึงหมุนตามท่อนก่อนหน้าไปด้วย)
    el.tail.forEach((g, i) => {
      const [jx, jy] = i === 0 ? TAIL_ROOT : A.TAIL_JOINTS[i - 1];
      setT(g, `rotate(${f2(S.tail[i].x)} ${jx} ${jy})`);
    });

    // หัว: เอียง/เลื่อนตามที่มอง + ก้มตอนง่วง + ขยับตามลมหายใจ
    const lx = S.lookX.x;
    const ly = S.lookY.x;
    const lean = S.petting && S.pointer ? clamp((S.pointer[0] - 870) / 120, -1, 1) * 3 : 0;
    const tilt = lx * 3.5 - ly * 1 + S.droop.x * 3 + lean;
    const hx = lx * 3;
    const hy = ly * 2.5 + S.droop.x * 7 - b * 120;
    setT(el.head, `translate(${f2(hx)} ${f2(hy)}) rotate(${f2(tilt)} ${A.HEAD_PIVOT[0]} ${A.HEAD_PIVOT[1]})`);
    el.ears.forEach((ear, i) => {
      const [px, py] = A.EAR_PIVOTS[i];
      setT(ear, `rotate(${f2(i === 0 ? -S.ears[i].x : S.ears[i].x)} ${px} ${py})`);
    });

    // ตา: ม่านตา+ตาดำเลื่อนไปทางจุดที่มอง (เห็นแค่ผ่านรูตาของหัว) · ตาดำขยายตามอารมณ์ · เปลือกตาตอนกะพริบ
    const blink = blinkAmount(now);
    const p = S.leave ? null : (S.caret ?? S.pointer);
    A.EYES.forEach((eye, i) => {
      const e = el.eyes[i];
      const ps = S.pupils[i];
      ps.x.to = 0;
      ps.y.to = 0;
      if (p && !S.cover.to) {
        const dx = p[0] - (eye.cx + hx);
        const dy = p[1] - (eye.cy + hy);
        const dist = Math.hypot(dx, dy) || 1;
        const reach = Math.min(1, dist / 140);
        ps.x.to = (dx / dist) * 3.4 * reach;
        ps.y.to = (dy / dist) * 2.4 * reach;
      }
      setT(e.iris, `translate(${f2(ps.x.x)} ${f2(ps.y.x)})`);
      const d = S.dilate.x;
      e.pupil.setAttribute("rx", f2(eye.pupil.rx * d));
      e.pupil.setAttribute("ry", f2(eye.pupil.ry * (1 + (d - 1) * 0.25)));
      const lid = Math.max(S.lid[i].x, blink);
      setT(e.lid, `translate(0 ${f2(-(1 - lid) * eye.ry * 2.8)})`);
    });
    setO(el.closed, S.closed.x);

    // ปิดตา: ภาพท่าปิดตาค่อย ๆ จางเข้าพร้อมเลื่อนขึ้นมา (เหมือนยกขาหน้า) อุ้งเท้าท่าพักจางออก
    const c = clamp(S.cover.x, 0, 1);
    setO(el.cover, c);
    setT(el.cover, `translate(0 ${f2((1 - c) * 18)})`);
    setO(el.peek, c * clamp(S.peek.x, 0, 1));
    const knead = S.petting && !reduce ? now / 330 : 0;
    el.paws.forEach((paw, i) => {
      const k = knead ? Math.max(0, Math.sin(knead + i * Math.PI)) * -4 : 0;
      setT(paw, `translate(0 ${f2(k - c * 12)})`);
      setO(paw, 1 - c);
    });

    if (S.leave) playExit(now);
  }

  // ---------- ล็อกอินสำเร็จ: กลับท่าพัก → เล่นเฟรมวิดีโอ ----------
  function playExit(now) {
    const t = now - S.leave.start;
    if (t < SETTLE_MS) return;
    const theme = S.leave.theme;
    const meta = A.EXIT.themes[theme];
    const src = exitImg[theme];
    if (!src?.ready || !canvas) {
      // ภาพเฟรมยังโหลดไม่เสร็จ (เน็ตช้า): จางหายไปเฉย ๆ
      setO(el.cat, 1 - (t - SETTLE_MS) / 300);
      return;
    }
    const frame = Math.floor((t - SETTLE_MS) / FRAME_MS);
    if (frame === S.leave.frame) return;
    S.leave.frame = frame;
    const [cw, ch] = meta.cell;
    if (!S.leave.placed) {
      // วางแคนวาสทับกรอบของเฟรมในพิกัดภาพต้นแบบ แล้วซ่อนแมวตัดแปะ (เฟรมแรก = ท่าพักเดียวกัน)
      const [x, y, w, h] = meta.box;
      canvas.width = cw;
      canvas.height = ch;
      Object.assign(canvas.style, {
        display: "block",
        left: `${(x - A.VIEW.x) * A.SCALE}px`,
        top: `${(y - A.VIEW.y) * A.SCALE}px`,
        width: `${w * A.SCALE}px`,
        height: `${h * A.SCALE}px`,
      });
      el.cat.style.visibility = "hidden";
      S.leave.placed = true;
    }
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, cw, ch);
    if (frame >= meta.frames) return;
    ctx.drawImage(src.img, (frame % meta.cols) * cw, Math.floor(frame / meta.cols) * ch, cw, ch, 0, 0, cw, ch);
  }

  // ---------- วนทุกเฟรม ----------
  let last = performance.now();
  const tick = () => {
    const now = performance.now();
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    setTargets(now);
    idleEvents(now);
    const n = Math.max(1, Math.ceil(dt / (1 / 120)));
    for (let i = 0; i < n; i++) integrate(dt / n, now);
    render(now, dt);
  };
  gsap.ticker.add(tick);

  return {
    lookAt(point) {
      S.caret = point ? toSvg(point.x, point.y) : null;
      if (point) {
        wake();
        // พิมพ์อยู่: บางทีหูก็กระดิกเหมือนฟังเสียงแป้นพิมพ์
        if (!reduce && Math.random() < 0.25) S.ears[Math.random() < 0.5 ? 0 : 1].v += 140;
      }
    },
    startle() {
      const now = performance.now();
      S.startleAt = now;
      wake(now);
      if (reduce) return;
      S.hop.v += 230;
      S.puff.v += 14;
      S.tail.forEach((t, i) => (t.v += (i - 2) * 40));
    },
    setMode(mode) {
      if (mode === S.mode) return;
      S.mode = mode;
      wake();
      if (mode === "leave" && !S.leave) {
        const theme = themeNow();
        loadExit(theme);
        S.leave = { start: performance.now(), theme, frame: -1, placed: false };
      }
    },
    destroy() {
      gsap.ticker.remove(tick);
      clearTimeout(preload);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("keydown", onKey);
      el.hit.removeEventListener("pointermove", onPet);
    },
  };
}
