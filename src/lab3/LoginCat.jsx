// แมวนอนบนขอบการ์ดล็อกอิน (ตกแต่งล้วน ๆ ซ่อนจาก screen reader)
// โหมดสว่าง = แมวดำ, โหมดมืด = แมวขาว (สีอยู่ใน .login-cat ใน index.css) · ตาทองทั้งสองโหมด
//
// - หางพาดหน้าลำตัวและแกว่งปลายเบา ๆ · ตามองตามเมาส์ หรือตามเคอร์เซอร์ตอนพิมพ์อีเมล
// - ช่องรหัสผ่าน: หางพันขึ้นมาปิดตา (mode "cover") · กดแสดงรหัสผ่าน: หางเลื่อนลงให้แอบมองข้างหนึ่ง (mode "peek")
// - ลูบ (ถูเมาส์หรือนิ้วไปมาบนตัว): หลับตาฟิน หูกระดิก มี "prr" ลอยขึ้น
// - ไม่มีอะไรขยับนาน ๆ: หลับ · ล็อกอินผิด (startle()): สะดุ้ง หูลู่
// - ล็อกอินสำเร็จ (mode "leave"): ยิ้ม ย่อตัว แล้วกระโดดออกไปทางขวา
//
// พิกัดใน SVG: ขอบบนของการ์ดอยู่ที่ y = 96 (แมวนอนบนเส้นนี้ อุ้งเท้ากับหางล้นลงมาบนการ์ดนิดเดียว)
import { useEffect, useId, useImperativeHandle, useRef, useState } from "react";

const EYES = [
  { x: 68, y: 62 },
  { x: 92, y: 62 },
];
// ตาดำขยับได้ไม่เกินนี้ (และถูกตัดด้วยขอบตาอีกชั้น จึงไม่มีทางล้นออกนอกตา)
const PUPIL_MAX = { x: 3, y: 1.6 };
const SLEEP_AFTER_MS = 12000;
const PET_DISTANCE = 90; // ถูไปมารวมกันกี่ px ถึงนับว่าลูบ
// หางพาดอ้อมหน้าลำตัวไปตามขอบการ์ด (ไม่ห้อยลงไปบนการ์ด จึงไม่ต้องเว้นที่ว่างใต้แมว)
// หางเส้นเดียว 3 ท่า: ทุกท่ามีจุดควบคุมเท่ากัน (M + โค้ง C 3 ช่วง = ตัวเลข 20 ตัว) จึงค่อย ๆ ดัดจากท่าหนึ่งไปอีกท่าได้
// โคนหางอยู่ที่เดิม (198, 86) ทุกท่า หางจึงดูเป็นเส้นเดิมที่ยกขึ้น ไม่ใช่หางใหม่งอกออกมา
const TAIL = {
  // พาดหน้าลำตัวไปตามขอบการ์ด
  rest: [198, 86, 218, 88, 222, 99, 208, 102, 194, 105, 170, 106, 152, 104, 142, 103, 134, 102, 126, 100],
  // ยกขึ้นพาดปิดตาทั้งสองข้าง
  cover: [198, 86, 180, 104, 128, 106, 113, 89, 106, 80, 105, 66, 97, 62, 87, 60, 70, 60, 54, 63],
  // ปิดแค่ตาขวา ตาซ้ายแอบมอง
  peek: [198, 86, 180, 104, 128, 106, 113, 89, 106, 80, 104, 68, 98, 64, 93, 61, 86, 61, 80, 64],
};
const TAIL_BASE = { x: 198, y: 86 };
const SWING_DEG = 4; // ท่าพัก: ปลายหางกระดกขึ้นลงเบา ๆ
const SWING_MS = 3400;
const TAIL_EASE_MS = 120; // ยิ่งน้อยยิ่งดัดเร็ว (ค่อย ๆ ช้าลงตอนใกล้ถึงท่าใหม่)

const tailPath = (n) =>
  `M${n[0].toFixed(2)} ${n[1].toFixed(2)}` +
  [0, 1, 2].map((k) => ` C${n.slice(2 + k * 6, 8 + k * 6).map((v) => v.toFixed(2)).join(" ")}`).join("");

// หมุนทุกจุดรอบโคนหาง (องศาบวก = ปลายหางที่อยู่ทางซ้ายของโคนกระดกขึ้น)
const swingTail = (n, deg) => {
  const a = (deg * Math.PI) / 180;
  const cos = Math.cos(a);
  const sin = Math.sin(a);
  const out = [];
  for (let i = 0; i < n.length; i += 2) {
    const dx = n[i] - TAIL_BASE.x;
    const dy = n[i + 1] - TAIL_BASE.y;
    out.push(TAIL_BASE.x + dx * cos - dy * sin, TAIL_BASE.y + dx * sin + dy * cos);
  }
  return out;
};

// ตัวลำตัวแบบขนฟู: หลังเป็นปุยหยัก ๆ แทนเส้นโค้งเรียบ
const BODY =
  "M56 96 C50 82 56 64 76 58 Q88 50 100 52 Q110 42 122 48 Q132 38 145 46 Q157 38 169 47 Q182 42 191 53 Q205 58 209 72 Q216 82 210 90 Q209 96 200 96 Z";
// หัวกลม มีขนแก้มฟูยื่นออกสองข้าง
const HEAD =
  "M80 32 C97 32 109 41 112 54 L119 57 L113 62 L118 68 L109 70 C104 82 93 88 80 88 C67 88 56 82 51 70 L42 68 L47 62 L41 57 L48 54 C51 41 63 32 80 32 Z";
// ลายขนบาง ๆ บนหน้าผากและลำตัว ให้ดูเป็นขนไม่ใช่ก้อนเรียบ
const FUR_MARKS =
  "M75 38 l1.5 5 M80 36.5 v5.5 M85 38 l-1.5 5 M124 64 q4 -4 8 0 M150 60 q4 -4 8 0 M177 66 q4 -4 8 0 M138 80 q4 -4 8 0 M165 82 q4 -4 8 0";

// หูสองข้าง ปลายโค้งมน (EDGE = ขอบนอกสองด้านของหู ไม่รวมโคนที่ติดหัว)
// วาดเป็นสองชั้นให้หูดูงอกออกมาจากหัว ไม่มีเส้นขอบหัวตัดผ่านโคนหู:
//   <Ears layer="back" />  ก่อนวาดหัว: เนื้อหู + เส้นขอบ (ส่วนโคนถูกหัวทับ)
//   <Ears layer="front" /> หลังวาดหัว: สีขนทับโคนหูยื่นลงไปในหัวนิดหนึ่ง กลบเส้นขอบหัวตรงนั้น
//                          แล้ววาดเฉพาะขอบนอกของหูซ้ำ + สีชมพูในหู + ขนปุย
// ทั้งสองชั้นใช้ class เดียวกัน (cat-ear-l / cat-ear-r) ตอนหูลู่หรือหูกระดิกจึงขยับไปพร้อมกัน
const EARS = [
  {
    side: "l",
    edge: "M48 50 Q47 30 52 15 Q55 10 60 14 Q71 24 80 36",
    patch: "L76 44 L53 55 Z",
    inner: "M55 42 Q55 30 56.5 22 Q64 27 71 35 Z",
    fluff: "M58 38 l3 -6 M61.5 39 l4 -5",
  },
  {
    side: "r",
    edge: "M80 36 Q89 24 100 14 Q105 10 108 15 Q113 30 112 50",
    patch: "L107 55 L84 44 Z",
    inner: "M89 35 Q96 27 103.5 22 Q105 30 105 42 Z",
    fluff: "M102 38 l-3 -6 M98.5 39 l-4 -5",
  },
];

function Ears({ layer }) {
  return EARS.map((ear) => (
    <g key={ear.side} className={`cat-ear-${ear.side}`}>
      {layer === "back" ? (
        <path d={`${ear.edge} Z`} fill="var(--cat-fur)" stroke="var(--cat-shade)" strokeWidth="1.5" strokeLinejoin="round" />
      ) : (
        <>
          <path d={`${ear.edge} ${ear.patch}`} fill="var(--cat-fur)" />
          <path d={ear.edge} fill="none" stroke="var(--cat-shade)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d={ear.inner} fill="var(--cat-ear)" />
          <path d={ear.fluff} stroke="var(--cat-fur)" strokeWidth="1.5" strokeLinecap="round" />
        </>
      )}
    </g>
  ));
}

// ใบหน้ายิ้มหลับตา ^ ^ (ตอนถูกลูบ และตอนล็อกอินสำเร็จ)
const HAPPY_EYES = "M60 64 Q68 56 76 64 M84 64 Q92 56 100 64";
const NOSE = "M76.5 71 L83.5 71 L80 75 Z";
const MOUTH = "M80 75 Q78 79 74.5 78 M80 75 Q82 79 85.5 78";
const WHISKERS = "M54 72 L28 66 M54 76 L28 78 M106 72 L132 66 M106 76 L132 78";

// ท่ายืนสี่ขา (หันขวา) ใช้ตอนล็อกอินสำเร็จ: ลุกขึ้น → ยืดตัว → กระโดดออกไปทางขวา (ท่าทางอยู่ใน index.css)
// หัวใช้รูปเดียวกับท่านอน ย่อลงแล้วย้ายไปไว้หน้าลำตัว
const STAND_BODY =
  "M80 70 Q74 56 90 50 Q102 42 116 47 Q128 40 142 46 Q156 41 166 50 Q178 56 174 70 Q172 80 158 80 L94 80 Q82 80 80 70 Z";
const STAND_TAIL = "M84 62 C66 58 58 42 64 26 C68 16 78 14 80 22";
const STAND_LEGS = [
  { x: 86, back: true },
  { x: 100, back: false },
  { x: 144, back: true },
  { x: 158, back: false },
];

function StandingCat() {
  const leg = ({ x }) => (
    <g key={x}>
      <rect x={x} y="70" width="12" height="25" rx="6" fill="var(--cat-fur)" stroke="var(--cat-shade)" strokeWidth="1.5" />
      <path d={`M${x + 3.5} 95 v-3 M${x + 8.5} 95 v-3`} stroke="var(--cat-shade)" strokeWidth="1.2" strokeLinecap="round" />
    </g>
  );
  return (
    <g className="cat-stand">
      <g className="cat-stand-tail">
        {[
          { stroke: "var(--cat-shade)", width: 20 },
          { stroke: "var(--cat-fur)", width: 17 },
        ].map((s) => (
          <path key={s.width} d={STAND_TAIL} fill="none" stroke={s.stroke} strokeWidth={s.width} strokeLinecap="round" />
        ))}
      </g>
      {STAND_LEGS.filter((l) => l.back).map(leg)}
      <path d={STAND_BODY} fill="var(--cat-fur)" stroke="var(--cat-shade)" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M108 58 q4 -4 8 0 M134 54 q4 -4 8 0 M120 70 q4 -4 8 0" fill="none" stroke="var(--cat-shade)" strokeWidth="1.5" strokeLinecap="round" />
      {STAND_LEGS.filter((l) => !l.back).map(leg)}
      <g transform="translate(178 44) scale(0.85) translate(-80 -60)">
        <Ears layer="back" />
        <path d={HEAD} fill="var(--cat-fur)" stroke="var(--cat-shade)" strokeWidth="1.5" strokeLinejoin="round" />
        <Ears layer="front" />
        <path d={HAPPY_EYES} fill="none" stroke="var(--cat-line)" strokeWidth="2" strokeLinecap="round" />
        <path d={NOSE} fill="var(--cat-nose)" />
        <path d={MOUTH} fill="none" stroke="var(--cat-line)" strokeWidth="1.2" strokeLinecap="round" />
        <path d={WHISKERS} stroke="var(--cat-whisker)" strokeWidth="1" strokeLinecap="round" />
      </g>
    </g>
  );
}

const almond = ({ x, y }) => `M${x - 8} ${y} Q${x} ${y - 9} ${x + 8} ${y} Q${x} ${y + 9} ${x - 8} ${y} Z`;

export default function LoginCat({ mode = "idle", ref }) {
  const svgRef = useRef(null);
  const pupils = useRef([]);
  const lookTarget = useRef(null); // จุดที่ฟอร์มสั่งให้มอง (เคอร์เซอร์ในช่องอีเมล) มีก่อนเมาส์
  const pet = useRef({ distance: 0, timer: 0 });
  const sleepTimer = useRef(0);
  const [sleeping, setSleeping] = useState(false);
  const [petting, setPetting] = useState(false);
  const [startled, setStartled] = useState(false);
  // useId มีอักขระที่ใช้ใน url(#…) ไม่ได้ ตัดทิ้งให้เหลือแค่ตัวอักษร/ตัวเลข
  const gradId = `cat-eye-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

  // ขยับรูม่านตาไปทางจุด (clientX, clientY) · แก้ attribute ตรง ๆ ไม่ re-render ทุกครั้งที่เมาส์ขยับ
  const lookAtClient = (cx, cy) => {
    const svg = svgRef.current;
    const ctm = svg?.getScreenCTM();
    if (!ctm) return;
    const p = new DOMPoint(cx, cy).matrixTransform(ctm.inverse());
    EYES.forEach((eye, i) => {
      const dx = p.x - eye.x;
      const dy = p.y - eye.y;
      const dist = Math.hypot(dx, dy) || 1;
      // ใกล้มากมองตรงกลาง ไกลออกไปค่อย ๆ เหลือบจนสุดขอบตา
      const reach = Math.min(1, dist / 60);
      const tx = (dx / dist) * PUPIL_MAX.x * reach;
      const ty = (dy / dist) * PUPIL_MAX.y * reach;
      pupils.current[i]?.setAttribute("transform", `translate(${tx.toFixed(2)} ${ty.toFixed(2)})`);
    });
  };

  // มีอะไรขยับ = ตื่น แล้วเริ่มนับเวลาหลับใหม่
  const wake = () => {
    setSleeping(false);
    clearTimeout(sleepTimer.current);
    sleepTimer.current = setTimeout(() => setSleeping(true), SLEEP_AFTER_MS);
  };

  useImperativeHandle(ref, () => ({
    // ฟอร์มส่งตำแหน่งเคอร์เซอร์มา (หรือ null เมื่อออกจากช่อง) ให้แมวมองตามตัวที่พิมพ์
    lookAt(point) {
      lookTarget.current = point;
      if (point) {
        lookAtClient(point.x, point.y);
        wake();
      }
    },
    startle() {
      setStartled(true);
      wake();
      setTimeout(() => setStartled(false), 1300);
    },
  }));

  useEffect(() => {
    wake();
    const onMove = (e) => {
      if (!lookTarget.current) lookAtClient(e.clientX, e.clientY);
      wake();
    };
    window.addEventListener("pointermove", onMove);
    return () => {
      window.removeEventListener("pointermove", onMove);
      clearTimeout(sleepTimer.current);
      clearTimeout(pet.current.timer);
    };
  }, []);

  // หาง: ทุกเฟรมดัดเส้นเดิมเข้าหาท่าของ mode ปัจจุบัน (ช้าลงเรื่อย ๆ ตอนใกล้ถึง)
  // ใช้ requestAnimationFrame แทน CSS เพราะ CSS เปลี่ยนรูปเส้น (d) ไม่ได้ทุกเบราว์เซอร์
  // และรวมการแกว่งตอนพักไว้ในสูตรเดียว ตอนเริ่มยกหางจึงไม่กระตุก
  const modeRef = useRef(mode);
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);
  const tailEls = useRef([]);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let cur = null;
    let last = performance.now();
    let raf = 0;
    const frame = (now) => {
      const dt = Math.min(64, now - last);
      last = now;
      const m = modeRef.current;
      const swing = reduce ? 0 : ((1 - Math.cos((now / SWING_MS) * 2 * Math.PI)) / 2) * SWING_DEG;
      const target = m === "cover" ? TAIL.cover : m === "peek" ? TAIL.peek : swingTail(TAIL.rest, swing);
      if (!cur || reduce) cur = target.slice();
      else {
        const k = 1 - Math.exp(-dt / TAIL_EASE_MS);
        cur = cur.map((v, i) => v + (target[i] - v) * k);
      }
      const d = tailPath(cur);
      tailEls.current.forEach((el) => el?.setAttribute("d", d));
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  // ลูบ: สะสมระยะที่ถูไปมาบนตัวแมว ถึงเกณฑ์แล้วเข้าโหมดฟิน หยุดลูบ 0.9 วินาทีก็เลิก
  const onPetMove = (e) => {
    pet.current.distance += Math.abs(e.movementX) + Math.abs(e.movementY);
    if (pet.current.distance > PET_DISTANCE) setPetting(true);
    clearTimeout(pet.current.timer);
    pet.current.timer = setTimeout(() => {
      pet.current.distance = 0;
      setPetting(false);
    }, 900);
  };

  const covered = mode === "cover" || mode === "peek";
  const leaving = mode === "leave";
  // ตาที่เห็น: ลูบหรือล็อกอินสำเร็จ = ยิ้มหลับ ^ ^ · หลับ = เส้นโค้งลง · นอกนั้นลืมตา (กะพริบเป็นระยะ)
  const face = petting || leaving ? "happy" : sleeping && !covered ? "sleep" : "open";

  return (
    <div
      // กว้าง 320px = viewBox × 1.33 · ขอบการ์ด (y = 96) จึงอยู่ที่ 128px จากบน (-top-32)
      className={`login-cat pointer-events-none absolute -top-32 left-1/2 w-80 -translate-x-1/2 ${startled ? "is-startled" : ""} ${petting ? "is-petting" : ""} ${leaving ? "is-leaving" : ""}`}
      aria-hidden="true"
    >
      <svg ref={svgRef} viewBox="0 0 240 170" className="block w-full touch-none overflow-visible">
        <defs>
          <radialGradient id={gradId} cx="45%" cy="40%" r="70%">
            <stop offset="0" stopColor="#fff2c4" />
            <stop offset=".45" stopColor="#e3bb5c" />
            <stop offset="1" stopColor="#9a6c22" />
          </radialGradient>
          {EYES.map((eye, i) => (
            <clipPath key={i} id={`${gradId}-clip${i}`}>
              <path d={almond(eye)} />
            </clipPath>
          ))}
        </defs>

        {/* ทุกส่วนรับเมาส์เพื่อใช้ลูบ (กล่องรอบนอกเป็น pointer-events-none ไม่บังการ์ด) */}
        {/* เมาส์เป็นรูปมือเมื่อชี้ที่แมว (บอกว่าลูบได้) และกำมือตอนกำลังลูบ */}
        <g className={`cat-all pointer-events-auto ${petting ? "cursor-grabbing" : "cursor-grab"}`} onPointerMove={onPetMove}>
          {/* ท่านอน (จางหายตอนล็อกอินสำเร็จ แล้วท่ายืนด้านล่างขึ้นมาแทน) */}
          <g className="cat-lying">
            <path d={BODY} fill="var(--cat-fur)" stroke="var(--cat-shade)" strokeWidth="1.5" strokeLinejoin="round" />

            <Ears layer="back" />
            <path d={HEAD} fill="var(--cat-fur)" stroke="var(--cat-shade)" strokeWidth="1.5" strokeLinejoin="round" />
            <Ears layer="front" />
            <path d={FUR_MARKS} fill="none" stroke="var(--cat-shade)" strokeWidth="1.5" strokeLinecap="round" />
            <ellipse cx="64" cy="95" rx="13" ry="6" fill="var(--cat-fur)" stroke="var(--cat-shade)" strokeWidth="1.5" />
            <ellipse cx="96" cy="95" rx="13" ry="6" fill="var(--cat-fur)" stroke="var(--cat-shade)" strokeWidth="1.5" />
            <path d="M58 95 v-3 M64 95 v-3.5 M70 95 v-3 M90 95 v-3 M96 95 v-3.5 M102 95 v-3" stroke="var(--cat-shade)" strokeWidth="1.2" strokeLinecap="round" />

            {face === "open" &&
              EYES.map((eye, i) => (
                <g key={i} className="cat-eye">
                  <path d={almond(eye)} fill={`url(#${gradId})`} />
                  {/* ตาดำเรียวแบบตาแมว ถูกตัดด้วยขอบตา มองสุดทางก็ไม่ล้น */}
                  <g clipPath={`url(#${gradId}-clip${i})`}>
                    <g ref={(el) => (pupils.current[i] = el)}>
                      <ellipse cx={eye.x} cy={eye.y} rx="1.9" ry="4.2" fill="#140d05" />
                      <circle cx={eye.x + 1.6} cy={eye.y - 2.2} r="1.2" fill="#fffaf0" opacity=".9" />
                    </g>
                  </g>
                  <path d={almond(eye)} fill="none" stroke="var(--cat-shade)" strokeWidth="1" />
                </g>
              ))}
            {face === "happy" && (
              <path d={HAPPY_EYES} fill="none" stroke="var(--cat-line)" strokeWidth="2" strokeLinecap="round" />
            )}
            {face === "sleep" && (
              <path d="M60 62 Q68 67 76 62 M84 62 Q92 67 100 62" fill="none" stroke="var(--cat-line)" strokeWidth="2" strokeLinecap="round" />
            )}

            <path d={NOSE} fill="var(--cat-nose)" />
            <path d={MOUTH} fill="none" stroke="var(--cat-line)" strokeWidth="1.2" strokeLinecap="round" />
            <path d={WHISKERS} stroke="var(--cat-whisker)" strokeWidth="1" strokeLinecap="round" />

            {/* หางพวงหนาเส้นเดียว (ขอบเข้ม + เนื้อหาง) วาดบนสุดเพราะต้องยกขึ้นไปพาดหน้าได้
                รูปเส้น (d) ถูกอัปเดตทุกเฟรมโดย effect ด้านบน ค่าเริ่มต้นคือท่าพัก */}
            {[
              { stroke: "var(--cat-shade)", width: 20 },
              { stroke: "var(--cat-fur)", width: 17 },
            ].map((s, i) => (
              <path
                key={s.width}
                ref={(el) => (tailEls.current[i] = el)}
                d={tailPath(TAIL.rest)}
                fill="none"
                stroke={s.stroke}
                strokeWidth={s.width}
                strokeLinecap="round"
              />
            ))}
          </g>

          {leaving && <StandingCat />}
        </g>
      </svg>

      {petting && <span className="cat-float cat-purr">prr…</span>}
      {face === "sleep" && <span className="cat-float cat-zzz">z</span>}
    </div>
  );
}
