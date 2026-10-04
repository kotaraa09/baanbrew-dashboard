// ตำแหน่งของจุด (1 จุด = 1 บิล) ในแต่ละขั้นของเรื่องเล่า
// ทุกฟังก์ชันคืน { pos: Float32Array [x0, y0, x1, y1, …], size, labels } ตามลำดับบิลเดิมเสมอ
// จุดที่ i คือบิลเดียวกันทุกขั้น (object constancy) ภาพจึงเปลี่ยน "การจัดกลุ่ม" ไม่ใช่เปลี่ยนข้อมูล

const GOLDEN = Math.PI * (3 - Math.sqrt(5));

// ขั้น "ก้อนเดียว": กระจายในวงกลมแบบดอกทานตะวัน (phyllotaxis) ความหนาแน่นเท่ากันทั้งวง
export function massLayout(bills, plot) {
  const n = bills.length;
  const pos = new Float32Array(n * 2);
  const R = Math.min(plot.w, plot.h) * 0.46;
  const c = R / Math.sqrt(n);
  const cx = plot.x + plot.w / 2;
  const cy = plot.y + plot.h / 2;
  for (let i = 0; i < n; i++) {
    const r = c * Math.sqrt(i + 0.5);
    const a = i * GOLDEN;
    pos[i * 2] = cx + r * Math.cos(a);
    pos[i * 2 + 1] = cy + r * Math.sin(a);
  }
  return { pos, size: Math.max(1, c * 0.82), labels: [] };
}

// แถวละหนึ่งสาขา ใช้ร่วมกันทุกขั้นที่แบ่งตามสาขา
function rows(plot, branches) {
  const band = plot.h / branches.length;
  return branches.map((branch, i) => ({ branch, top: plot.y + i * band, base: plot.y + (i + 1) * band - band * 0.16, height: band * 0.72 }));
}

// ขั้น "แยกสาขา": แต่ละสาขาเป็นแถบกริดจุดเรียงจากซ้ายไปขวา ความยาวแถบ ∝ จำนวนบิล
export function branchLayout(bills, plot, branches, counts) {
  const R = rows(plot, branches);
  const max = Math.max(...branches.map((b) => counts.get(b)));
  // ขนาดช่องจุด: เริ่มจากพื้นที่ ÷ จำนวน แล้วหดจนแถบยาวสุดพอดีความกว้างจริง (ปัดเศษแถวทำให้ล้นได้)
  let s = Math.sqrt((plot.w * R[0].height) / max);
  while (Math.ceil(max / Math.max(1, Math.floor(R[0].height / s))) * s > plot.w) s *= 0.97;
  const perCol = Math.max(1, Math.floor(R[0].height / s));
  const seen = new Map();
  const rowOf = new Map(R.map((r) => [r.branch, r]));
  const pos = new Float32Array(bills.length * 2);
  bills.forEach((b, i) => {
    const r = rowOf.get(b.branch);
    const j = seen.get(b.branch) ?? 0;
    seen.set(b.branch, j + 1);
    pos[i * 2] = plot.x + Math.floor(j / perCol) * s;
    pos[i * 2 + 1] = r.base - (j % perCol) * s;
  });
  return {
    pos,
    size: Math.max(1, s * 0.78),
    labels: R.map((r) => ({ kind: "row", text: r.branch, value: counts.get(r.branch), y: r.top + (r.base - r.top) / 2 })),
  };
}

// ขั้นแบบ "ฮิสโตแกรมจุด": แต่ละสาขาแบ่งเป็นคอลัมน์ตาม key (ชั่วโมง/วันในสัปดาห์/เดือน) จุดซ้อนขึ้นจากเส้นฐาน
// ขนาดจุดเท่ากันทั้งภาพ (คอลัมน์ที่สูงที่สุดพอดีแถว) จึงเทียบความสูงข้ามสาขาได้ตรง ๆ
// keyOf คืน null = บิลนี้ไม่อยู่ในขั้นนี้ (hidden) จุดจะจางหายอยู่ที่เดิม
export function columnLayout(bills, plot, branches, keyOf, keys, tickLabel) {
  const R = rows(plot, branches);
  const rowOf = new Map(R.map((r) => [r.branch, r]));
  const col = new Map(keys.map((k, i) => [k, i]));
  const cw = plot.w / keys.length;
  const cellCount = new Map();
  for (const b of bills) {
    const key = keyOf(b);
    if (key == null) continue;
    const k = `${b.branch}|${key}`;
    cellCount.set(k, (cellCount.get(k) ?? 0) + 1);
  }
  const max = Math.max(...cellCount.values());
  const usable = cw * 0.84;
  let s = Math.sqrt((usable * R[0].height) / max);
  while (Math.ceil(max / Math.max(1, Math.floor(usable / s))) * s > R[0].height) s *= 0.97;
  const perRow = Math.max(1, Math.floor(usable / s));
  const seen = new Map();
  const pos = new Float32Array(bills.length * 2);
  const hidden = new Uint8Array(bills.length);
  bills.forEach((b, i) => {
    const r = rowOf.get(b.branch);
    const key = keyOf(b);
    if (key == null) {
      hidden[i] = 1;
      return;
    }
    const c = col.get(key);
    const k = `${b.branch}|${key}`;
    const j = seen.get(k) ?? 0;
    seen.set(k, j + 1);
    const x0 = plot.x + c * cw + (cw - perRow * s) / 2;
    pos[i * 2] = x0 + (j % perRow) * s;
    pos[i * 2 + 1] = r.base - Math.floor(j / perRow) * s;
  });
  const every = Math.ceil(keys.length / Math.max(4, Math.floor(plot.w / 56)));
  return {
    pos,
    hidden,
    size: Math.max(1, s * 0.78),
    labels: [
      ...R.map((r) => ({ kind: "row", text: r.branch, y: r.top + (r.base - r.top) / 2 })),
      ...keys
        .map((k, i) => ({ kind: "tick", text: tickLabel(k), x: plot.x + i * cw + cw / 2, y: plot.y + plot.h }))
        .filter((_, i) => i % every === 0),
    ],
  };
}
