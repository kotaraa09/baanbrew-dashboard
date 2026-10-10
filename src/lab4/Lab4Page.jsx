// Lab 4 · ทางเข้าของแท็บ "ลูกค้า & เมนู" และ "พยากรณ์ & ผิดปกติ" (App โหลดแบบ lazy เหมือน Lab3Page)
// ?demo ใช้ได้แม้ยังไม่ตั้งค่า Firebase
import { isConfigured } from "../lab3/firebase.js";
import SetupGuide from "../lab3/SetupGuide.jsx";
import CustomersTab from "./CustomersTab.jsx";
import ForecastTab from "./ForecastTab.jsx";
import { demoSource, firestoreSource, isDemo } from "./dataSource.js";

export default function Lab4Page({ view }) {
  const demo = isDemo();
  if (!demo && !isConfigured) return <SetupGuide />;
  const source = demo ? demoSource : firestoreSource;
  return view === "forecast" ? <ForecastTab source={source} /> : <CustomersTab source={source} />;
}
