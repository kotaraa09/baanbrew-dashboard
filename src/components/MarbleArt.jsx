// ภาพหินอ่อนดำ-ทอง-ขาว หลังหัวหน้า (ตกแต่งล้วน ไม่ใช่ข้อมูล) มืดเสมอทั้งสองโหมด เหมือนภาพแขวนผนัง
// ภาพนิ่งอยู่ที่ public/marble-art.svg: ริบบิ้นทอง/ขาวรูปตัว S, เส้นทองบาง, pinstripe มุมล่างซ้าย, เกล็ดทอง
// ใช้เป็น <img> ไม่ใช่ SVG ในหน้า เพราะ filter หินอ่อน/ประกายทองหนักมาก ถ้าอยู่ในหน้า เบราว์เซอร์จะวาดใหม่ทุกครั้ง
// ที่มีอะไรขยับทับ (ชื่อทองวิ่งแสง, เกล็ดกระพริบ) ส่วน <img> ถูกวาดครั้งเดียวแล้วเก็บไว้
// ชั้นบนเป็นเกล็ดทองที่กระพริบ ตำแหน่งสุ่มแบบกำหนด seed ชุดเดียวกับเกล็ดนิ่งในไฟล์ภาพ (ทุก ๆ ตัวที่ 6)

function flecks(count, seed) {
  let s = seed;
  const rand = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
  return Array.from({ length: count }, (_, i) => {
    const x = 430 + rand() * 780;
    const y = 230 - (x - 450) * 0.3 + (rand() - 0.5) * 150;
    return { x, y, r: 0.5 + rand() ** 2 * 1.9, twinkle: i % 6 === 0, delay: (rand() * 3.6).toFixed(2) };
  });
}
const TWINKLES = flecks(90, 20230601).filter((f) => f.twinkle);

export default function MarbleArt({ className = "" }) {
  return (
    <div className={className} aria-hidden="true">
      <img
        src={`${import.meta.env.BASE_URL}marble-art.svg`}
        alt=""
        className="absolute inset-0 size-full object-cover object-right"
      />
      <svg className="absolute inset-0 size-full" viewBox="0 0 1200 200" preserveAspectRatio="xMaxYMid slice">
        <g fill="#fff3c8">
          {TWINKLES.map((f, i) => (
            <circle
              key={i}
              cx={f.x.toFixed(1)}
              cy={f.y.toFixed(1)}
              r={(f.r + 0.4).toFixed(2)}
              className="twinkle"
              style={{ animationDelay: `${f.delay}s` }}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
