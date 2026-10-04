import { useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Card, CardHeader, Segmented } from "./ui.jsx";
import { customerView, ACTIVE_DAYS } from "../lib/customerMetrics.js";
import CustomersStory from "./CustomersStory.jsx";
import { formatBaht, formatBahtExact, formatDate, formatMonth, formatNumber } from "../lib/metrics.js";

const pct = (n) => `${(n * 100).toFixed(1)}%`;
// ช่องว่างแบบไม่ตัดบรรทัด: ตัวเลขกับหน่วยอยู่บรรทัดเดียวกันเสมอ
const NB = "\u00a0";
const tick = { fontSize: 12, fill: "var(--color-ink-subtle)" };

function Kpi({ label, value, note }) {
  return (
    <div className="flex flex-col gap-1 px-3 py-2.5">
      <span className="text-[13px] font-medium text-ink-subtle">{label}</span>
      <span className="text-xl font-semibold tracking-tight text-ink tabular-nums sm:text-2xl">{value}</span>
      <span className="text-xs text-ink-muted">{note}</span>
    </div>
  );
}

// แถวแท่งแนวนอนแบบ CSS: ป้ายซ้าย ตัวเลขขวา แท่งเต็มความกว้างอยู่ใต้ป้าย
function BarRow({ label, value, detail, ratio, muted = false }) {
  return (
    <li className="py-1.5">
      <div className="flex items-baseline justify-between gap-3 text-[13px]">
        <span className="text-ink">{label}</span>
        <span className="text-right tabular-nums">
          <span className="font-medium text-ink">{value}</span>
          {detail && <span className="ml-2 text-ink-muted">{detail}</span>}
        </span>
      </div>
      <div className="mt-1 h-2.5 rounded-full bg-canvas">
        <div
          className={`h-full rounded-full ${muted ? "bg-bar-muted" : "bg-chart-bar"}`}
          style={{ width: `${Math.max(ratio * 100, ratio > 0 ? 1 : 0)}%` }}
        />
      </div>
    </li>
  );
}

function NewMembersTip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg bg-surface px-3 py-2 text-[13px] shadow-[0_4px_16px_rgb(0_0_0/0.12),0_0_0_1px_rgb(0_0_0/0.06)]">
      <p className="font-semibold text-ink">{formatMonth(`${d.month}-01`)}</p>
      <p className="text-ink-subtle">
        สมาชิกใหม่ <span className="font-medium text-ink tabular-nums">{formatNumber(d.count)} คน</span>
        {d.partial && ` (มีข้อมูลแค่ ${d.days}/${d.fullDays}${NB}วัน)`}
      </p>
    </div>
  );
}

function NewMembersCard({ data }) {
  const full = data.filter((d) => !d.partial);
  const recent = full.slice(-3);
  const avg = recent.reduce((s, d) => s + d.count, 0) / (recent.length || 1);
  const last = data[data.length - 1];
  return (
    <Card>
      <CardHeader
        title="สมาชิกใหม่รายเดือน"
        subtitle={`เฉลี่ยเดือนละ ${formatNumber(avg)}${NB}คน ดูจาก ${recent.length}${NB}เดือนล่าสุดที่ข้อมูลครบ${
          last?.partial ? ` · ${formatMonth(`${last.month}-01`)} มีข้อมูลแค่ ${last.days}/${last.fullDays}${NB}วัน เลยเป็นสีจาง` : ""
        }`}
      />
      <div className="h-64 px-2 pt-3 pb-2 sm:px-3">
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="var(--color-line)" vertical={false} />
            <XAxis dataKey="month" tickFormatter={(m) => formatMonth(`${m}-01`)} tick={tick} tickLine={false}
              axisLine={{ stroke: "var(--color-line-strong)" }} interval="preserveStartEnd" minTickGap={16} />
            <YAxis tick={tick} tickLine={false} axisLine={false} width={40} allowDecimals={false} />
            <Tooltip content={<NewMembersTip />} cursor={{ fill: "var(--color-surface-hover)" }} />
            <Bar dataKey="count" fill="var(--color-chart-bar)" radius={[4, 4, 0, 0]} isAnimationActive={false}>
              {data.map((d) => <Cell key={d.month} fillOpacity={d.partial ? 0.45 : 1} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function ComparisonCard({ comparison }) {
  const { member, walkin, medianBills } = comparison;
  const rows = [
    ["ส่วนแบ่งยอดขาย", pct(member.revenueShare), pct(walkin.revenueShare)],
    ["ส่วนแบ่งบิล", pct(member.billShare), pct(walkin.billShare)],
    ["จ่ายเฉลี่ยต่อบิล", formatBahtExact(member.avgBill), formatBahtExact(walkin.avgBill)],
  ];
  const diff = (member.avgBill - walkin.avgBill) / walkin.avgBill;
  const verdict =
    Math.abs(diff) < 0.05
      ? `ต่อบิลจ่ายพอ ๆ กัน (ต่างกันแค่ ${pct(Math.abs(diff))}) สมาชิกไม่ได้จ่ายต่อบิลเยอะกว่า แต่กลับมาซื้อบ่อย ค่ากลางอยู่ที่คนละ ${medianBills}${NB}บิล`
      : `สมาชิกจ่ายต่อบิล${diff > 0 ? "มากกว่า" : "น้อยกว่า"}ลูกค้าทั่วไป ${pct(Math.abs(diff))} และกลับมาซื้อซ้ำ ค่ากลางอยู่ที่คนละ ${medianBills}${NB}บิล`;
  return (
    <Card className="flex flex-col">
      <CardHeader title="สมาชิก เทียบกับลูกค้าทั่วไป" subtitle="ลูกค้าทั่วไป คือบิลที่ไม่มี customer_id" />
      <div className="px-4 pt-3 pb-4 sm:px-5">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-ink-subtle">
              <th className="pb-2 text-left font-medium" />
              <th className="pb-2 text-right font-medium">สมาชิก</th>
              <th className="pb-2 text-right font-medium">ลูกค้าทั่วไป</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, m, w]) => (
              <tr key={label} className="border-t border-line">
                <td className="py-2 text-ink-subtle">{label}</td>
                <td className="py-2 text-right font-medium text-ink tabular-nums">{m}</td>
                <td className="py-2 text-right text-ink tabular-nums">{w}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 rounded-lg bg-canvas px-3 py-2 text-[13px] text-ink">{verdict}</p>
      </div>
    </Card>
  );
}

function RecencyCard({ recency, never, lapsed, total, lastDate }) {
  const max = Math.max(...recency.map((r) => r.count));
  return (
    <Card className="flex flex-col">
      <CardHeader
        title="มาซื้อครั้งล่าสุดเมื่อไหร่"
        subtitle={`นับถึง ${formatDate(lastDate)} · แท่งสีเทาคือคนที่ควรชวนกลับมา`}
      />
      <div className="px-4 pt-2 pb-4 sm:px-5">
        <ul>
          {recency.map((r) => (
            <BarRow key={r.key} label={r.label} value={`${formatNumber(r.count)}${NB}คน`} detail={pct(r.count / total)}
              ratio={max ? r.count / max : 0} muted={r.lapsed} />
          ))}
        </ul>
        <p className="mt-2 rounded-lg bg-canvas px-3 py-2 text-[13px] text-ink">
          <span className="whitespace-nowrap">{formatNumber(lapsed)} คน</span>ไม่ได้มาซื้อเกิน <span className="whitespace-nowrap">{ACTIVE_DAYS} วัน</span> อีก{" "}
          <span className="whitespace-nowrap">{formatNumber(never)} คน</span>สมัครแล้วไม่เคยซื้อเลย
          รวมเป็น {pct((lapsed + never) / total)} ของสมาชิก กลุ่มนี้ส่งโปรฯ ชวนกลับมาได้
        </p>
      </div>
    </Card>
  );
}

const SEGMENTS = [
  { value: "age", label: "ช่วงอายุ" },
  { value: "gender", label: "เพศ" },
  { value: "branch", label: "สาขาประจำ" },
];

function SegmentsCard({ segments }) {
  const [by, setBy] = useState("age");
  const list = segments[by];
  const maxMembers = Math.max(...list.map((g) => g.members));
  const top = [...list].sort((a, b) => b.perMember - a.perMember)[0];
  return (
    <Card>
      <CardHeader
        title="สมาชิกแต่ละกลุ่ม"
        subtitle={`มีกี่คน และแต่ละคนใช้จ่ายเฉลี่ยเท่าไหร่ตลอดช่วงข้อมูล · ใช้จ่ายต่อคนเยอะสุด: ${top.key} (${formatBaht(top.perMember)})`}
      >
        <Segmented label="แบ่งตาม" value={by} onChange={setBy} options={SEGMENTS} />
      </CardHeader>
      <ul key={by} className="grid animate-fade-in gap-x-8 px-4 pt-2 pb-4 sm:px-5 md:grid-cols-2">
        {list.map((g) => (
          <BarRow key={g.key} label={g.key} value={`${formatNumber(g.members)}${NB}คน`}
            detail={`${pct(g.share)} · ${formatBaht(g.perMember)}/คน`} ratio={g.members / maxMembers} />
        ))}
      </ul>
    </Card>
  );
}

const MODES = [
  { value: "story", label: "แบบเล่าเรื่อง" },
  { value: "detail", label: "ตัวเลขละเอียด" },
];
const MODE_KEY = "baanbrew-customers-mode";

// จำแบบที่เลือกไว้ในเบราว์เซอร์ (เปิด private / บล็อก storage ก็ยังใช้ได้ แค่ไม่จำ)
function useMode() {
  const [mode, setMode] = useState(() => {
    try {
      return localStorage.getItem(MODE_KEY) === "detail" ? "detail" : "story";
    } catch {
      return "story";
    }
  });
  const change = (value) => {
    setMode(value);
    try {
      localStorage.setItem(MODE_KEY, value);
    } catch {
      // ไม่จำก็ไม่เป็นไร
    }
  };
  return [mode, change];
}

export default function CustomersView({ data }) {
  const [mode, setMode] = useMode();
  const view = useMemo(
    () => customerView(data.rows, data.customers, data.branchInfo, data.last),
    [data]
  );

  return (
    <>
      <div className="flex items-center gap-2">
        <Segmented label="ดูแบบไหน" value={mode} onChange={setMode} options={MODES} />
      </div>
      {mode === "story" && data.customers.length > 0 ? (
        <CustomersStory view={view} data={data} />
      ) : (
        <DetailView data={data} view={view} />
      )}
    </>
  );
}

function DetailView({ data, view }) {
  if (data.customers.length === 0) {
    return (
      <Card className="px-5 py-8 text-center">
        <p className="text-sm font-semibold text-ink">ยังไม่มีข้อมูลสมาชิก</p>
        <p className="mx-auto mt-1 max-w-md text-[13px] text-ink-subtle">
          ลองเช็กว่ามีไฟล์ <code>public/customers.csv</code> อยู่ไหม แล้วรีเฟรชหน้าใหม่
        </p>
      </Card>
    );
  }

  const { kpis } = view;
  return (
    <>
      <Card className="animate-rise p-2">
        <div className="grid grid-cols-2 gap-1 lg:grid-cols-4">
          <Kpi label="สมาชิกทั้งหมด" value={formatNumber(kpis.members)} note="จาก customers.csv" />
          <Kpi label={`ซื้อใน ${ACTIVE_DAYS}${NB}วันล่าสุด`} value={formatNumber(kpis.active)} note={`${pct(kpis.active / kpis.members)} ของสมาชิก`} />
          <Kpi label="ยอดขายจากสมาชิก" value={pct(kpis.memberShare)} note="ของยอดขายทั้งหมด" />
          <Kpi label="กลับมาซื้อซ้ำ" value={pct(kpis.repeatRate)} note={`ของสมาชิกที่เคยซื้อ (ซื้อ 2${NB}บิลขึ้นไป)`} />
        </div>
      </Card>

      <div className="animate-rise" style={{ animationDelay: "70ms" }}>
        <NewMembersCard data={view.newMembers} />
      </div>

      <div className="grid animate-rise gap-4 lg:grid-cols-2" style={{ animationDelay: "140ms" }}>
        <ComparisonCard comparison={view.comparison} />
        <RecencyCard recency={view.recency} never={view.never} lapsed={view.lapsed} total={kpis.members} lastDate={data.last} />
      </div>

      <div className="animate-rise" style={{ animationDelay: "200ms" }}>
        <SegmentsCard segments={view.segments} />
      </div>

      <p className="text-xs text-ink-muted">
        ตรงนี้มีแค่ตัวเลขรวมของแต่ละกลุ่ม ไม่มีข้อมูลรายคน · ใน public/customers.csv ตัดชื่อเล่นกับเบอร์โทรออกแล้ว (PDPA)
      </p>
    </>
  );
}
