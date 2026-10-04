// แมวนอนบนขอบการ์ดล็อกอิน (ตกแต่งล้วน ๆ ซ่อนจาก screen reader)
// เป็นภาพวาดจริงตัดเป็นชิ้นแล้วขยับด้วยกระดูก (แบบแอนิเมชัน Flash): ภาพต้นแบบสร้างด้วย fal.ai
// โหมดสว่าง = แมวดำ, โหมดมืด = แมวครีม (ภาพสองชุด สลับด้วย CSS ใน .login-cat) · ตาอำพันทั้งสองโหมด
//
// - หายใจ กะพริบตา หูกระดิก หางแกว่งเป็นคลื่น · หัวและตาหันตามเมาส์ หรือตามเคอร์เซอร์ตอนพิมพ์อีเมล
// - ช่องรหัสผ่าน: ยกอุ้งเท้าปิดตา (mode "cover") · กดแสดงรหัสผ่าน: เลื่อนอุ้งเท้าลงแอบมองข้างหนึ่ง (mode "peek")
// - ลูบ (ถูเมาส์หรือนิ้วไปมาบนตัว): หลับตาฟิน หูเอนหลัง นวดอุ้งเท้า หางม้วน มี "prr" ลอยขึ้น
// - ไม่มีอะไรขยับนาน ๆ: หลับตา ก้มหัว หายใจช้าลง · ล็อกอินผิด (startle()): สะดุ้ง ตัวพอง หูลู่ ตาโต
// - ล็อกอินสำเร็จ (mode "leave"): ลุกยืนแล้วกระโดดออกไปทางขวา (เฟรมจากวิดีโอ เล่นบน canvas)
//
// ตำแหน่งชิ้นภาพกับจุดหมุนอยู่ใน cat/art.js, การเคลื่อนไหวทั้งหมดใน cat/rig.js
// ไฟล์นี้วางโครง SVG ครั้งเดียว แล้ว rig เขียน transform/opacity ทับทุกเฟรม (ไม่ re-render)
import { useEffect, useId, useImperativeHandle, useRef, useState } from "react";
import * as A from "./cat/art.js";
import { createRig } from "./cat/rig.js";

const URLS = import.meta.glob("./cat/img/*.webp", { eager: true, query: "?url", import: "default" });
const url = (theme, name) => URLS[`./cat/img/${theme}-${name}.webp`];
const EXIT_URL = { light: url("light", "exit"), dark: url("dark", "exit") };

// ชิ้นภาพหนึ่งชิ้น = ภาพสองธีมซ้อนกัน CSS แสดงแค่ธีมปัจจุบัน
function Part({ name }) {
  const { x, y, w, h } = A.PARTS[name];
  return ["light", "dark"].map((t) => (
    <image key={t} className={`cat-${t}`} href={url(t, name)} x={x} y={y} width={w} height={h} />
  ));
}

// หางซ้อนกันเป็นชั้น: ท่อนที่ i อยู่ในกลุ่มของท่อนก่อนหน้า จึงหมุนตามท่อนก่อนหน้าก่อนแล้วค่อยหมุนของตัวเอง
function Tail({ i = 0 }) {
  if (i >= A.TAIL_SEGMENTS) return null;
  return (
    <g data-part={`tail-${i}`}>
      <Part name={`tail-${i}`} />
      <Tail i={i + 1} />
    </g>
  );
}

export default function LoginCat({ mode = "idle", ref }) {
  const svgRef = useRef(null);
  const canvasRef = useRef(null);
  const rig = useRef(null);
  const [mood, setMood] = useState({ sleeping: false, petting: false });
  // useId มีอักขระที่ใช้ใน url(#…) ไม่ได้ ตัดทิ้งให้เหลือแค่ตัวอักษร/ตัวเลข
  const clipId = `cat-edge-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

  useEffect(() => {
    const r = createRig(svgRef.current, { onMood: setMood, canvas: canvasRef.current, exitUrl: EXIT_URL });
    rig.current = r;
    return () => r.destroy();
  }, []);
  useEffect(() => {
    rig.current?.setMode(mode);
  }, [mode]);
  useImperativeHandle(ref, () => ({
    // ฟอร์มส่งตำแหน่งเคอร์เซอร์มา (หรือ null เมื่อออกจากช่อง) ให้แมวมองตามตัวที่พิมพ์
    lookAt: (point) => rig.current?.lookAt(point),
    startle: () => rig.current?.startle(),
  }));

  const { x, y, w, h } = A.VIEW;
  return (
    <div
      className="login-cat pointer-events-none absolute left-1/2"
      // ขอบการ์ด (y = EDGE_Y ในภาพต้นแบบ) ตรงกับขอบบนของการ์ดจริง · กึ่งกลางการ์ดในภาพตรงกับกึ่งกลางการ์ดจริง
      style={{
        width: w * A.SCALE,
        top: -(A.EDGE_Y - y) * A.SCALE,
        marginLeft: -(A.CARD_CENTER_X - x) * A.SCALE,
      }}
      aria-hidden="true"
    >
      <svg ref={svgRef} viewBox={`${x} ${y} ${w} ${h}`} className="block w-full touch-none overflow-visible">
        <defs>
          <clipPath id={clipId}>
            <rect x={x - 100} y={y - 300} width={w + 200} height={A.EDGE_Y + 300 - y} />
          </clipPath>
        </defs>
        <g data-part="cat">
          <g data-part="body">
            <Part name="body" />
            <Tail />
          </g>

          <g data-part="head">
            {/* หูอยู่หลังหัว หมุนรอบโคนหู */}
            <g data-part="ear-l">
              <Part name="ear-l" />
            </g>
            <g data-part="ear-r">
              <Part name="ear-r" />
            </g>
            {/* ตา: อยู่ใต้หัวที่เจาะรูตาไว้ จึงเห็นแค่ผ่านรู · ม่านตา+ตาดำเลื่อนมองได้ จุดเงาอยู่กับที่ */}
            {A.EYES.map((eye, i) => (
              <g key={i} data-part="eye">
                <g data-part="iris">
                  <Part name={`iris-${i}`} />
                  <ellipse
                    data-part="pupil"
                    cx={eye.pupil.cx}
                    cy={eye.pupil.cy}
                    rx={eye.pupil.rx}
                    ry={eye.pupil.ry}
                    transform={`rotate(${eye.pupil.rot} ${eye.pupil.cx} ${eye.pupil.cy})`}
                    fill="var(--cat-pupil)"
                  />
                </g>
                <circle cx={eye.glint.cx} cy={eye.glint.cy} r={eye.glint.r} fill="#fffaf0" opacity=".95" />
                {/* เปลือกตาตอนกะพริบ: เลื่อนลงจากด้านบน ขอบล่างเข้มคือแนวขนตา */}
                <g transform={`translate(${eye.cx} ${eye.cy}) rotate(${eye.rot})`}>
                  <path
                    data-part="lid"
                    d={A.eyePath({ rx: eye.rx * 1.3, ry: eye.ry * 1.3 })}
                    transform={`translate(0 ${-eye.ry * 2.8})`}
                    fill="var(--cat-lid)"
                    stroke="var(--cat-line)"
                    strokeWidth="2.5"
                  />
                </g>
              </g>
            ))}
            <Part name="head" />
            {/* หลับตาฟิน/หลับ: ภาพวาดตาปิดจางเข้ามาทับ */}
            <g data-part="closed" style={{ opacity: 0 }}>
              <Part name="closed" />
            </g>
          </g>

          {A.PAW_WRISTS.map((_, i) => (
            <g key={i} data-part={`paw-${i}`}>
              <Part name={`paw-${i}`} />
            </g>
          ))}
          {/* ปิดตา/แอบมอง: ภาพวาดท่านั้นทับเฉพาะหัวกับขาหน้า (หางกับตัวยังขยับต่อได้)
              ตัดที่ขอบการ์ด: ตอนเลื่อนขึ้นมาไม่ให้เห็นภาพโผล่ลงไปบนหน้าการ์ด */}
          <g clipPath={`url(#${clipId})`}>
            <g data-part="cover" style={{ opacity: 0 }}>
              <Part name="cover" />
            </g>
            <g data-part="peek" style={{ opacity: 0 }}>
              <Part name="peek" />
            </g>
          </g>

          {/* พื้นที่รับเมาส์ไว้ลูบ (กล่องรอบนอกเป็น pointer-events-none ไม่บังการ์ด)
              เมาส์เป็นรูปมือเมื่อชี้ที่แมว (บอกว่าลูบได้) และกำมือตอนกำลังลูบ */}
          <path
            data-part="hit"
            d={A.HIT}
            fill="transparent"
            className={`pointer-events-auto ${mood.petting ? "cursor-grabbing" : "cursor-grab"}`}
          />
        </g>
      </svg>
      {/* ตอนล็อกอินสำเร็จ: เฟรมวิดีโอแมวกระโดดลา (rig วางตำแหน่งให้ตอนเริ่มเล่น) */}
      <canvas ref={canvasRef} className="pointer-events-none absolute hidden" />

      {mood.petting && <span className="cat-float cat-purr">prr…</span>}
      {mood.sleeping && <span className="cat-float cat-zzz">z</span>}
    </div>
  );
}
