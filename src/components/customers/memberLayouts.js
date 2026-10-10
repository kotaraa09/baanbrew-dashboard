// ตำแหน่งของสมาชิกแต่ละคนในแต่ละฉากของเรื่องเล่า (แท็บลูกค้า)
// สมาชิกที่ i คือคนเดิมทุกฉาก (object constancy): 0..buyers-1 = j.lines ตามลำดับ, ที่เหลือ = สมัครแต่ยังไม่เคยซื้อ
// ทุกฟังก์ชันคืน { geo: Float32Array [x0, x1, y, h] ต่อคน, hidden?, labels, look }
// look = ความทึบของ "ตัวเส้น/ช่อง" (fill) และ "ขีดบิล" (tick) ในฉากนั้น

const LOOK = {
  grid: { fill: 0.55, tick: 0, fillHi: 1, tickHi: 0 },
  time: { fill: 0.1, tick: 0.8, fillHi: 0.3, tickHi: 1 },
  bars: { fill: 0.5, tick: 0, fillHi: 1, tickHi: 0 },
};

// ฉาก "ช่องละคน": สมาชิกทุกคนเป็นช่องสี่เหลี่ยมเรียงซ้ายไปขวา คนที่ยังไม่เคยซื้ออยู่ท้ายสุด
export function gridLayout(n, plot) {
  let s = Math.sqrt((plot.w * plot.h) / n);
  while (Math.ceil(n / Math.floor(plot.w / s)) * s > plot.h) s *= 0.97;
  const cols = Math.floor(plot.w / s);
  const used = Math.ceil(n / cols) * s;
  const top = plot.y + (plot.h - used) / 2;
  const geo = new Float32Array(n * 4);
  const cell = Math.max(1, s * 0.78);
  for (let i = 0; i < n; i++) {
    const x = plot.x + (i % cols) * s;
    geo[i * 4] = x;
    geo[i * 4 + 1] = x + cell;
    geo[i * 4 + 2] = top + Math.floor(i / cols) * s;
    geo[i * 4 + 3] = cell;
  }
  return { geo, labels: [], look: LOOK.grid };
}

// ป้ายเดือนใต้แกนเวลา
function monthTicks(xOf, from, to, y, step, formatMonth) {
  const out = [];
  const d0 = new Date(from * 864e5);
  for (let k = 0; ; k++) {
    const d = Date.UTC(d0.getUTCFullYear(), d0.getUTCMonth() + k, 1) / 864e5;
    if (d >= to) break;
    if (d >= from && k % step === 0) out.push({ kind: "tick", x: xOf(d), y, text: formatMonth(new Date(d * 864e5).toISOString().slice(0, 10)) });
  }
  return out;
}

// ฉาก "เส้นชีวิต": 1 แถว = 1 คน ตั้งแต่บิลแรกถึงบิลล่าสุด เรียงตามวันที่ซื้อครั้งแรก · คนที่ไม่เคยซื้อจางหายที่เดิม
export function timeLayout(n, lines, plot, from, to, mobile, formatMonth) {
  const geo = new Float32Array(n * 4);
  const hidden = new Uint8Array(n);
  const rowH = plot.h / lines.length;
  const xOf = (d) => plot.x + ((d - from) / (to - from)) * plot.w;
  for (let i = 0; i < n; i++) {
    const l = lines[i];
    if (!l) {
      hidden[i] = 1;
      continue;
    }
    geo[i * 4] = xOf(l.days[0]);
    geo[i * 4 + 1] = xOf(l.days.at(-1) + 1);
    geo[i * 4 + 2] = plot.y + i * rowH;
    geo[i * 4 + 3] = Math.max(rowH, 1);
  }
  return { geo, hidden, labels: monthTicks(xOf, from, to, plot.y + plot.h, mobile ? 6 : 3, formatMonth), look: LOOK.time };
}

// ฉาก "เรียงตามเงิน": 1 แถว = 1 คน เรียงจากใช้จ่ายมากไปน้อย ความยาวแท่ง ∝ ยอดใช้จ่ายทั้งหมด
export function barsLayout(n, lines, plot, topCount, topLabel) {
  const geo = new Float32Array(n * 4);
  const hidden = new Uint8Array(n);
  const order = lines.map((_, i) => i).sort((a, b) => lines[b].revenue - lines[a].revenue);
  const max = lines[order[0]].revenue || 1;
  const rowH = plot.h / lines.length;
  order.forEach((i, rank) => {
    geo[i * 4] = plot.x;
    geo[i * 4 + 1] = plot.x + Math.max(1, (lines[i].revenue / max) * plot.w);
    geo[i * 4 + 2] = plot.y + rank * rowH;
    geo[i * 4 + 3] = Math.max(rowH, 1);
  });
  for (let i = lines.length; i < n; i++) hidden[i] = 1;
  return {
    geo,
    hidden,
    labels: [{ kind: "mark", y: plot.y + topCount * rowH, x: plot.x, w: plot.w, text: topLabel }],
    look: LOOK.bars,
  };
}

// ฉาก "แยกสาขาประจำ": เส้นชีวิตเดิม แต่แบ่งเป็นแถบตามสาขาประจำ (แถบใหญ่อยู่บน) ในแถบเรียงตามวันซื้อครั้งแรก
export function branchLayout(n, lines, plot, from, to, mobile, formatMonth, unknown) {
  const geo = new Float32Array(n * 4);
  const hidden = new Uint8Array(n);
  const groups = new Map();
  lines.forEach((l, i) => {
    const k = l.home ?? unknown;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(i);
  });
  const bands = [...groups.entries()].sort((a, b) => b[1].length - a[1].length);
  const GAP = mobile ? 6 : 10;
  const rowH = (plot.h - GAP * (bands.length - 1)) / lines.length;
  const xOf = (d) => plot.x + ((d - from) / (to - from)) * plot.w;
  const labels = [];
  let y = plot.y;
  for (const [name, idx] of bands) {
    const top = y;
    for (const i of idx) {
      const l = lines[i];
      geo[i * 4] = xOf(l.days[0]);
      geo[i * 4 + 1] = xOf(l.days.at(-1) + 1);
      geo[i * 4 + 2] = y;
      geo[i * 4 + 3] = Math.max(rowH, 1);
      y += rowH;
    }
    labels.push({ kind: "row", text: name, count: idx.length, y: (top + y) / 2 });
    y += GAP;
  }
  for (let i = lines.length; i < n; i++) hidden[i] = 1;
  labels.push(...monthTicks(xOf, from, to, plot.y + plot.h, mobile ? 6 : 3, formatMonth));
  return { geo, hidden, labels, look: LOOK.time };
}
