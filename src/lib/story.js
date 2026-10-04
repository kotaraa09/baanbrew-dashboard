// ตรรกะของเรื่องเล่า "ห้าสาขา ห้าจังหวะชีวิต" (หน้าภาพรวม ส่วนบน)
// หน่วยของเรื่องคือ "บิล" (order_id ไม่ซ้ำ) ไม่ใช่แถว: ทุกตัวเลขในข้อความคำนวณจากฟังก์ชันในไฟล์นี้
// และตรวจซ้ำได้ด้วย Pivot Table ตามขั้นตอนใน docs/VERIFY.md

const WEEKDAY = (date) => {
  const [y, m, d] = date.split("-").map(Number);
  return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7; // 0 = จันทร์ … 6 = อาทิตย์
};

// รวมแถวเป็นบิล: หนึ่งบิลมีสาขา/เวลา/ลูกค้าเดียว ยอดขายของบิล = ผลรวม qty × unit_price ของทุกแถวในบิล
// เรียงตามเวลา ลำดับนี้ใช้เป็นตัวตนของจุดในเรื่องเล่า (จุดที่ i คือบิลเดิมเสมอทุกขั้น)
export function buildBills(rows) {
  const map = new Map();
  for (const r of rows) {
    let b = map.get(r.order_id);
    if (!b) {
      b = {
        id: r.order_id,
        datetime: r.datetime,
        date: r.date,
        month: r.date.slice(0, 7),
        hour: Number(r.datetime.slice(11, 13)),
        weekday: WEEKDAY(r.date),
        branch: r.branch,
        customer: r.customer_id,
        revenue: 0,
      };
      map.set(r.order_id, b);
    }
    b.revenue += r.revenue;
  }
  return [...map.values()].sort((a, b) => (a.datetime < b.datetime ? -1 : a.datetime > b.datetime ? 1 : 0));
}

// สาขาเรียงตามจำนวนบิลมากไปน้อย (ลำดับแถวในภาพ)
export function branchOrder(bills) {
  const n = new Map();
  for (const b of bills) n.set(b.branch, (n.get(b.branch) ?? 0) + 1);
  return [...n].sort((a, b) => b[1] - a[1]).map(([branch, count]) => ({ branch, count }));
}

// สัดส่วนบิลตามชั่วโมงของแต่ละสาขา (% ของบิลทั้งหมดของสาขานั้น) + ชั่วโมงพีค + สัดส่วนก่อน 10:00 และตั้งแต่ 17:00
export function hourProfiles(bills, branches) {
  return branches.map((branch) => {
    const counts = Array(24).fill(0);
    let total = 0;
    for (const b of bills) {
      if (b.branch !== branch) continue;
      counts[b.hour] += 1;
      total += 1;
    }
    const share = counts.map((c) => (total ? c / total : 0));
    const sum = (from, to) => share.slice(from, to).reduce((a, v) => a + v, 0);
    return {
      branch,
      total,
      counts,
      share,
      peakHour: counts.indexOf(Math.max(...counts)),
      beforeTen: sum(0, 10),
      fromFive: sum(17, 24),
    };
  });
}

// ยอดขายรวมรายวันของแต่ละสาขา: Map "สาขา|วันที่" → ยอดขาย (เฉพาะวันที่สาขานั้นมีบิล)
function dailyRevenue(bills) {
  const day = new Map();
  for (const b of bills) {
    const k = `${b.branch}|${b.date}`;
    day.set(k, (day.get(k) ?? 0) + b.revenue);
  }
  return day;
}

const mean = (xs) => (xs.length ? xs.reduce((a, v) => a + v, 0) / xs.length : 0);

// จังหวะรายสัปดาห์และวันหยุด ต่อสาขา (ยอดขายเฉลี่ยต่อวัน นับเฉพาะวันที่สาขาเปิดและมีบิล)
// - weekday: วันจันทร์–ศุกร์ที่ไม่ใช่วันหยุดนักขัตฤกษ์
// - weekend: เสาร์–อาทิตย์ที่ไม่ใช่วันหยุดนักขัตฤกษ์
// - holiday: วันหยุดนักขัตฤกษ์ (thai_holidays.csv)
// ratio = ยอดเฉลี่ยต่อวัน ÷ ยอดเฉลี่ยต่อวันทำงานปกติ (ตรวจด้วย AVERAGEIFS ได้)
export function weekProfiles(bills, branches, holidays) {
  const day = dailyRevenue(bills);
  return branches.map((branch) => {
    const weekdays = [];
    const weekends = [];
    const hols = [];
    const byWeekday = Array.from({ length: 7 }, () => []);
    for (const [k, v] of day) {
      const [br, date] = k.split("|");
      if (br !== branch) continue;
      const w = WEEKDAY(date);
      if (holidays.has(date)) hols.push(v);
      else {
        (w >= 5 ? weekends : weekdays).push(v);
        byWeekday[w].push(v);
      }
    }
    const base = mean(weekdays);
    return {
      branch,
      weekdayAvg: base,
      weekendAvg: mean(weekends),
      holidayAvg: mean(hols),
      holidayDays: hols.length,
      weekendRatio: base ? mean(weekends) / base : null,
      holidayRatio: base && hols.length ? mean(hols) / base : null,
      byWeekday: byWeekday.map(mean),
    };
  });
}

// จำนวนบิลต่อวันของแต่ละเดือน (เดือนที่มีข้อมูลไม่ครบ เช่นเดือนสุดท้าย ก็ยังเทียบกันได้เพราะหารด้วยจำนวนวัน)
// วันในเดือน = วันที่มีบิลของทั้งเครือ (ร้านเปิดทุกวัน)
export function monthlyBillsPerDay(bills, branches) {
  const days = new Map();
  for (const b of bills) {
    if (!days.has(b.month)) days.set(b.month, new Set());
    days.get(b.month).add(b.date);
  }
  const months = [...days.keys()].sort();
  return branches.map((branch) => {
    const counts = new Map(months.map((m) => [m, 0]));
    for (const b of bills) if (b.branch === branch) counts.set(b.month, counts.get(b.month) + 1);
    return { branch, months: months.map((m) => ({ month: m, perDay: counts.get(m) / days.get(m).size, bills: counts.get(m) })) };
  });
}

// สมาชิกของสาขาใหม่: ในบรรดาสมาชิกที่เคยซื้อที่สาขานี้ กี่คนไม่เคยมีบิลที่สาขาไหนเลยก่อนวันเปิดสาขา
export function newBranchNewcomers(bills, branch) {
  const opened = bills.find((b) => b.branch === branch)?.date;
  if (!opened) return null;
  const members = new Set(bills.filter((b) => b.branch === branch && b.customer).map((b) => b.customer));
  const before = new Set(bills.filter((b) => b.date < opened && b.customer && members.has(b.customer)).map((b) => b.customer));
  return { opened, members: members.size, newcomers: members.size - before.size, share: members.size ? (members.size - before.size) / members.size : 0 };
}

// บิลต่อวันของเดือนที่ระบุ (เช่น "05" = พฤษภาคมทุกปี) เทียบกับค่าเฉลี่ยของเดือนอื่นที่สาขาเปิดแล้ว
export function monthOfYearRatio(monthly, mm) {
  const open = monthly.months.filter((m) => m.bills > 0);
  const target = open.filter((m) => m.month.endsWith(`-${mm}`));
  const others = open.filter((m) => !m.month.endsWith(`-${mm}`));
  const t = mean(target.map((m) => m.perDay));
  const o = mean(others.map((m) => m.perDay));
  return { months: target.map((m) => m.month), perDay: t, othersPerDay: o, ratio: o ? t / o : null };
}

const shift = (date, days) => {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
};

// วันหยุดเทียบวันปกติแบบจับคู่: วันหยุดแต่ละวันจับคู่กับ "วันเดียวกันของสัปดาห์ถัดไป" (ถ้าวันนั้นเป็นวันหยุดหรือเลยข้อมูล ใช้สัปดาห์ก่อน)
// นับเฉพาะคู่ที่สาขาเปิดแล้วทั้งสองวัน · ratio = บิลในวันหยุด ÷ บิลในวันคู่ (ตรวจด้วย COUNTIFS ตามรายการคู่วันที่ได้)
export function holidayMatches(bills, holidays) {
  const dates = new Set(bills.map((b) => b.date));
  const first = bills[0]?.date;
  const last = bills.at(-1)?.date;
  const pairs = [];
  for (const h of [...holidays].sort()) {
    if (h < first || h > last) continue;
    const next = shift(h, 7);
    const prev = shift(h, -7);
    const match = !holidays.has(next) && next <= last && dates.has(next) ? next : !holidays.has(prev) && prev >= first ? prev : null;
    if (match) pairs.push({ holiday: h, match });
  }
  return pairs;
}

export function holidayComparison(bills, branches, pairs) {
  const opened = new Map();
  for (const b of bills) if (!opened.has(b.branch)) opened.set(b.branch, b.date);
  return branches.map((branch) => {
    const valid = pairs.filter((p) => p.holiday >= opened.get(branch) && p.match >= opened.get(branch));
    const hol = new Set(valid.map((p) => p.holiday));
    const mat = new Set(valid.map((p) => p.match));
    let h = 0;
    let m = 0;
    for (const b of bills) {
      if (b.branch !== branch) continue;
      if (hol.has(b.date)) h += 1;
      else if (mat.has(b.date)) m += 1;
    }
    return { branch, pairs: valid.length, holidayBills: h, matchBills: m, ratio: m ? h / m : null, holidayDates: hol, matchDates: mat };
  });
}
