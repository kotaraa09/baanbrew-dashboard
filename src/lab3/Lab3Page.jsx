// Lab 3 · ทางเข้าของแท็บ "สด · Firestore" และ "ทดสอบ Rules"
// App โหลดไฟล์นี้แบบ lazy เพื่อให้ Firebase SDK ไม่ทำให้แท็บภาพรวมโหลดช้าลง
// ยังไม่ใส่ค่าใน .env → แสดงวิธีตั้งค่าแทน (LiveTab และ RulesTester ต้องมี db)
import { isConfigured } from "./firebase.js";
import SetupGuide from "./SetupGuide.jsx";
import LiveTab from "./LiveTab.jsx";
import RulesTester from "./RulesTester.jsx";

export default function Lab3Page({ view }) {
  if (!isConfigured) return <SetupGuide />;
  return view === "rules" ? <RulesTester /> : <LiveTab />;
}
