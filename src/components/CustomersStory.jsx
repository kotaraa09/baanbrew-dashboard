// แท็บลูกค้าแบบเล่าเรื่อง (infographic): 1 ตอน = 1 ข้อความ + 1 ภาพ อ่านจากบนลงล่าง
// ทุกตัวเลขและประโยคคำนวณจาก customerView() ไม่มีตัวเลขตายตัว
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion, useTweenedNumber } from "./ui.jsx";
import { ACTIVE_DAYS } from "../lib/customerMetrics.js";
import { formatBaht, formatMonth, formatNumber } from "../lib/metrics.js";

const pct0 = (n) => `${Math.round(n * 100)}%`;

// แบ่ง 100 ช่องตามสัดส่วน โดยปัดแบบ largest remainder ให้รวมได้ 100 พอดี
function toHundred(counts) {
  const total = counts.reduce((s, c) => s + c, 0) || 1;
  const raw = counts.map((c) => (c / total) * 100);
  const out = raw.map(Math.floor);
  const order = raw.map((r, i) => [r - Math.floor(r), i]).sort((a, b) => b[0] - a[0]);
  const missing = 100 - out.reduce((s, c) => s + c, 0);
  for (let k = 0; k < missing; k++) out[order[k][1]] += 1;
  return out;
}

// เห็นบนจอแล้วค่อยเล่น (เลื่อนลงมาถึงตอนไหน ตอนนั้นค่อยนับเลข/ขึ้นภาพ) · ลดการเคลื่อนไหว = แสดงเลย
function useSeen() {
  const ref = useRef(null);
  const [seen, setSeen] = useState(() => prefersReducedMotion() || typeof IntersectionObserver === "undefined");
  useEffect(() => {
    if (seen || !ref.current) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setSeen(true), { threshold: 0.3 });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [seen]);
  return [ref, seen];
}

function Count({ value, seen, format = formatNumber }) {
  return <span className="tabular-nums">{format(useTweenedNumber(seen ? value : 0, 900))}</span>;
}

const Person = ({ className = "", style }) => (
  <svg viewBox="0 0 24 32" className={className} style={style} aria-hidden="true">
    <circle cx="12" cy="7" r="6" fill="currentColor" />
    <path d="M1 31v-6a11 11 0 0 1 22 0v6Z" fill="currentColor" />
  </svg>
);

function Chapter({ n, kicker, title, children, note }) {
  const [ref, seen] = useSeen();
  return (
    <section
      ref={ref}
      className={`rounded-[var(--radius-card)] bg-surface px-5 py-7 shadow-[var(--shadow-card)] transition-[opacity,translate] duration-700 ease-[var(--ease-out)] sm:px-8 sm:py-9 ${
        seen ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      }`}
    >
      <p className="flex items-center gap-2 text-[13px] font-semibold text-chart">
        <span className="inline-flex size-6 items-center justify-center rounded-full bg-chart text-xs text-on-chart">{n}</span>
        {kicker}
      </p>
      <h2 className="mt-3 max-w-3xl text-2xl leading-snug font-bold text-balance text-ink sm:text-3xl">{title(seen)}</h2>
      <div className="mt-6">{children(seen)}</div>
      {note && <p className="mt-5 text-xs text-ink-muted">{note}</p>}
    </section>
  );
}

function Legend({ items }) {
  return (
    <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[13px]">
      {items.map((it) => (
        <li key={it.label} className="flex items-center gap-2 text-ink-subtle">
          <span className={`size-3 rounded-full ${it.swatch}`} />
          {it.label}
          <span className="font-medium text-ink tabular-nums">{it.value}</span>
        </li>
      ))}
    </ul>
  );
}

export default function CustomersStory({ view, data }) {
  const { kpis, comparison, recency, newMembers, segments } = view;

  // ตอน 2: ซื้อซ้ำกี่คนจาก 10
  const repeatOf10 = Math.round(kpis.repeatRate * 10);

  // ตอน 3: ต่อบิลต่างกันแค่ไหน
  const { member, walkin, medianBills } = comparison;
  const billDiff = (member.avgBill - walkin.avgBill) / walkin.avgBill;
  const billClose = Math.abs(billDiff) < 0.05;

  // ตอน 4: สมาชิก 100 คน แบ่งตามครั้งล่าสุดที่มาซื้อ
  const activeCount = recency.filter((r) => !r.lapsed).reduce((s, r) => s + r.count, 0);
  const lapsedCount = recency.filter((r) => r.lapsed && r.key !== "never").reduce((s, r) => s + r.count, 0);
  const neverCount = recency.find((r) => r.key === "never").count;
  const [activeDots, lapsedDots, neverDots] = toHundred([activeCount, lapsedCount, neverCount]);
  const dots = [
    ...Array(activeDots).fill("active"),
    ...Array(lapsedDots).fill("lapsed"),
    ...Array(neverDots).fill("never"),
  ];

  // ตอน 5: สมาชิกใหม่ต่อเดือน (เฉลี่ย 3 เดือนล่าสุดที่ข้อมูลครบ)
  const fullMonths = newMembers.filter((m) => !m.partial);
  const recent = fullMonths.slice(-3);
  const avgNew = recent.reduce((s, m) => s + m.count, 0) / (recent.length || 1);
  const maxNew = Math.max(...newMembers.map((m) => m.count));
  const firstFull = fullMonths.slice(0, 3);
  const growth = avgNew / (firstFull.reduce((s, m) => s + m.count, 0) / (firstFull.length || 1)) - 1;

  // ตอน 6: กลุ่มที่ใหญ่ที่สุดของแต่ละมิติ
  const biggest = (list) => [...list].sort((a, b) => b.members - a.members)[0];
  const facts = [
    { label: "ช่วงอายุที่มีมากที่สุด", top: biggest(segments.age), list: segments.age, unit: "ปี" },
    { label: "เพศ", top: biggest(segments.gender), list: segments.gender, unit: "" },
    { label: "สาขาที่มีสมาชิกมากที่สุด", top: biggest(segments.branch), list: segments.branch, unit: "" },
  ];

  return (
    <div className="space-y-4">
      {/* ตอน 1 */}
      <Chapter
        n={1}
        kicker="สมาชิกสำคัญแค่ไหน"
        title={(seen) => (
          <>
            สมาชิก <span className="text-chart"><Count value={kpis.members} seen={seen} /> คน</span> สร้างยอดขาย{" "}
            <span className="text-chart"><Count value={kpis.memberShare * 100} seen={seen} format={(v) => `${Math.round(v)}%`} /></span> ของร้าน
          </>
        )}
        note="ลูกค้าทั่วไป = บิลที่ไม่มี customer_id (ไม่ได้สมัครสมาชิก)"
      >
        {(seen) => (
          <>
            <div className="flex h-14 overflow-hidden rounded-xl bg-canvas" role="img"
              aria-label={`ยอดขายจากสมาชิก ${pct0(kpis.memberShare)} ลูกค้าทั่วไป ${pct0(1 - kpis.memberShare)}`}>
              <div className="flex items-center bg-chart-bar px-4 text-sm font-semibold text-on-chart transition-[width] duration-1000 ease-[var(--ease-out)]"
                style={{ width: seen ? `${kpis.memberShare * 100}%` : "0%" }}>
                <span className="truncate">สมาชิก {pct0(kpis.memberShare)}</span>
              </div>
              <div className="flex flex-1 items-center justify-end px-4 text-sm font-medium text-ink-subtle">
                <span className="truncate">ลูกค้าทั่วไป {pct0(1 - kpis.memberShare)}</span>
              </div>
            </div>
            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-ink-subtle">
              เงินทุก 100 บาทที่เข้าร้าน มาจากสมาชิก {Math.round(kpis.memberShare * 100)} บาท ถ้าสมาชิกหายไป
              ร้านจะเสียรายได้ส่วนนี้ไปด้วย
            </p>
          </>
        )}
      </Chapter>

      {/* ตอน 2 */}
      <Chapter
        n={2}
        kicker="สมาชิกกลับมาไหม"
        title={() => (
          <>
            สมาชิกที่เคยซื้อ 10 คน <span className="text-chart">กลับมาซื้อซ้ำ {repeatOf10} คน</span>
          </>
        )}
        note={`กลับมาซื้อซ้ำ = มี 2 บิลขึ้นไป (${pct0(kpis.repeatRate)} ของสมาชิกที่เคยซื้อ) · ค่ากลาง ${medianBills} บิลต่อคน`}
      >
        {(seen) => (
          <div className="flex flex-wrap gap-2 sm:gap-3" role="img" aria-label={`${repeatOf10} ใน 10 คนกลับมาซื้อซ้ำ`}>
            {Array.from({ length: 10 }, (_, i) => (
              <Person
                key={i}
                className={`h-12 w-9 transition-[color,scale] duration-500 sm:h-16 sm:w-12 ${
                  seen && i < repeatOf10 ? "scale-100 text-chart" : "scale-90 text-line-strong"
                }`}
                style={{ transitionDelay: seen ? `${i * 80}ms` : "0ms" }}
              />
            ))}
          </div>
        )}
      </Chapter>

      {/* ตอน 3 */}
      <Chapter
        n={3}
        kicker="สมาชิกซื้อเยอะกว่าไหม"
        title={() =>
          billClose ? (
            <>
              ต่อบิลจ่าย<span className="text-chart">พอ ๆ กัน</span> แต่สมาชิก<span className="text-chart">มาบ่อยกว่า</span>
            </>
          ) : (
            <>
              สมาชิกจ่ายต่อบิล<span className="text-chart">{billDiff > 0 ? "มากกว่า" : "น้อยกว่า"} {pct0(Math.abs(billDiff))}</span>
            </>
          )
        }
        note={`ยอดเฉลี่ยต่อบิล = ยอดขายรวม ÷ จำนวนบิล · ต่างกัน ${(Math.abs(billDiff) * 100).toFixed(1)}%`}
      >
        {(seen) => (
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { who: "สมาชิก", value: member.avgBill, strong: true },
              { who: "ลูกค้าทั่วไป", value: walkin.avgBill, strong: false },
            ].map((b) => (
              <div key={b.who} className={`rounded-xl px-5 py-4 ${b.strong ? "bg-chart/10" : "bg-canvas"}`}>
                <p className="text-[13px] text-ink-subtle">{b.who} จ่ายต่อบิล</p>
                <p className={`mt-1 text-3xl font-bold ${b.strong ? "text-chart" : "text-ink"}`}>
                  <Count value={b.value} seen={seen} format={formatBaht} />
                </p>
              </div>
            ))}
            <div className="rounded-xl bg-canvas px-5 py-4">
              <p className="text-[13px] text-ink-subtle">สมาชิก 1 คนมาซื้อ</p>
              <p className="mt-1 text-3xl font-bold text-ink">
                <Count value={medianBills} seen={seen} /> <span className="text-lg font-semibold">บิล</span>
              </p>
            </div>
          </div>
        )}
      </Chapter>

      {/* ตอน 4 */}
      <Chapter
        n={4}
        kicker="ใครหายไปบ้าง"
        title={() => (
          <>
            สมาชิก 100 คน ยังมาซื้ออยู่ <span className="text-chart">{activeDots} คน</span> อีก {lapsedDots + neverDots} คนหายไป
          </>
        )}
        note={`ยังมาซื้ออยู่ = ซื้อครั้งล่าสุดไม่เกิน ${ACTIVE_DAYS} วันก่อนวันล่าสุดของข้อมูล · 1 จุด = สมาชิก 1% (${formatNumber(kpis.members / 100)} คน)`}
      >
        {(seen) => (
          <>
            <div className="grid max-w-md grid-cols-10 gap-1.5 sm:gap-2" role="img"
              aria-label={`ยังมาซื้อ ${activeDots} ไม่ได้มาเกิน ${ACTIVE_DAYS} วัน ${lapsedDots} ไม่เคยซื้อ ${neverDots} จาก 100`}>
              {dots.map((kind, i) => (
                <span
                  key={i}
                  className={`aspect-square rounded-full transition-[background-color,box-shadow,opacity] duration-300 ${
                    !seen
                      ? "bg-canvas"
                      : kind === "active"
                        ? "bg-chart"
                        : kind === "lapsed"
                          ? "bg-bar-muted"
                          : "bg-transparent shadow-[inset_0_0_0_2px_var(--color-bar-muted)]"
                  }`}
                  style={{ transitionDelay: seen ? `${i * 12}ms` : "0ms" }}
                />
              ))}
            </div>
            <Legend items={[
              { label: "ยังมาซื้ออยู่", value: `${formatNumber(activeCount)} คน`, swatch: "bg-chart" },
              { label: `ไม่ได้มาเกิน ${ACTIVE_DAYS} วัน`, value: `${formatNumber(lapsedCount)} คน`, swatch: "bg-bar-muted" },
              { label: "สมัครแล้วไม่เคยซื้อ", value: `${formatNumber(neverCount)} คน`, swatch: "shadow-[inset_0_0_0_2px_var(--color-bar-muted)]" },
            ]} />
            <p className="mt-4 max-w-2xl rounded-xl bg-canvas px-4 py-3 text-[15px] leading-relaxed text-ink">
              💡 {formatNumber(lapsedCount + neverCount)} คนนี้รู้จักร้านแล้ว ส่งโปรฯ ชวนกลับมาได้เลย ง่ายกว่าหาลูกค้าใหม่
            </p>
          </>
        )}
      </Chapter>

      {/* ตอน 5 */}
      <Chapter
        n={5}
        kicker="สมาชิกใหม่มาเร็วแค่ไหน"
        title={(seen) => (
          <>
            ได้สมาชิกใหม่เดือนละ <span className="text-chart"><Count value={avgNew} seen={seen} /> คน</span>
            {growth > 0.05 && <> เพิ่มจากช่วงแรก {pct0(growth)}</>}
          </>
        )}
        note={`เฉลี่ย ${recent.length} เดือนล่าสุดที่ข้อมูลครบ เทียบกับ ${firstFull.length} เดือนแรก${
          newMembers.at(-1)?.partial ? ` · ${formatMonth(`${newMembers.at(-1).month}-01`)} สีจาง เพราะมีข้อมูลแค่ ${newMembers.at(-1).days}/${newMembers.at(-1).fullDays} วัน` : ""
        }`}
      >
        {(seen) => (
          <>
            <div className="flex h-36 items-end gap-1" role="img" aria-label={`สมาชิกใหม่รายเดือน เฉลี่ย ${formatNumber(avgNew)} คนต่อเดือน`}>
              {newMembers.map((m, i) => (
                <div key={m.month} className="group relative flex h-full flex-1 items-end">
                  <div
                    className={`w-full rounded-t-md bg-chart-bar transition-[height] duration-700 ease-[var(--ease-out)] ${m.partial ? "opacity-45" : ""}`}
                    style={{ height: seen ? `${(m.count / maxNew) * 100}%` : "0%", transitionDelay: `${i * 30}ms` }}
                    title={`${formatMonth(`${m.month}-01`)}: ${formatNumber(m.count)} คน`}
                  />
                </div>
              ))}
            </div>
            <div className="mt-1.5 flex justify-between text-xs text-ink-muted">
              <span>{formatMonth(`${newMembers[0].month}-01`)}</span>
              <span>{formatMonth(`${newMembers.at(-1).month}-01`)}</span>
            </div>
          </>
        )}
      </Chapter>

      {/* ตอน 6 */}
      <Chapter
        n={6}
        kicker="สมาชิกของเราเป็นใคร"
        title={() => (
          <>
            ส่วนใหญ่อายุ <span className="text-chart">{facts[0].top.key} ปี</span> เป็น
            <span className="text-chart">{facts[1].top.key}</span> และเป็นลูกค้าประจำสาขา<span className="text-chart">{facts[2].top.key}</span>
          </>
        )}
        note="นับจากสมาชิกทั้งหมด (customers.csv) · แสดงเฉพาะตัวเลขรวมของแต่ละกลุ่ม ไม่แสดงข้อมูลรายคน (PDPA)"
      >
        {(seen) => (
          <div className="grid gap-3 md:grid-cols-3">
            {facts.map((f) => {
              const max = Math.max(...f.list.map((g) => g.members));
              return (
                <div key={f.label} className="rounded-xl bg-canvas px-5 py-4">
                  <p className="text-[13px] text-ink-subtle">{f.label}</p>
                  <p className="mt-1 text-2xl font-bold text-ink">
                    {f.top.key} <span className="text-chart">{pct0(f.top.share)}</span>
                  </p>
                  <ul className="mt-3 space-y-1.5">
                    {f.list.map((g) => (
                      <li key={g.key} className="flex items-center gap-2 text-xs">
                        <span className="w-20 shrink-0 truncate text-ink-subtle">{g.key}</span>
                        <span className="h-2 flex-1 rounded-full bg-surface">
                          <span
                            className={`block h-full rounded-full transition-[width] duration-700 ease-[var(--ease-out)] ${g === f.top ? "bg-chart" : "bg-bar-muted"}`}
                            style={{ width: seen ? `${(g.members / max) * 100}%` : "0%" }}
                          />
                        </span>
                        <span className="w-9 shrink-0 text-right text-ink tabular-nums">{pct0(g.share)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </Chapter>

      <p className="px-1 text-xs text-ink-muted">
        ข้อมูลถึง {formatMonth(`${data.last.slice(0, 7)}-01`)} · public/customers.csv ตัดชื่อเล่นและเบอร์โทรออกแล้ว (PDPA)
      </p>
    </div>
  );
}
