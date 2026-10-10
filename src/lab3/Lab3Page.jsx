// Lab 3 · ทางเข้าของแท็บ "สด · Firestore", "ทดสอบ Rules" และหน้าเข้าสู่ระบบ (#login)
// App โหลดไฟล์นี้แบบ lazy เพื่อให้ Firebase SDK ไม่ทำให้แท็บภาพรวมโหลดช้าลง
// ยังไม่ใส่ค่าใน .env → แสดงวิธีตั้งค่าแทน (LiveTab และ RulesTester ต้องมี db)
import { isConfigured } from "./firebase.js";
import SetupGuide from "./SetupGuide.jsx";
import LiveTab from "./LiveTab.jsx";
import RulesTester from "./RulesTester.jsx";
import LoginPage from "./LoginPage.jsx";

export default function Lab3Page({ view, onSignedIn }) {
  if (!isConfigured) return <SetupGuide />;
  if (view === "login") return <LoginPage onDone={onSignedIn} />;
  return view === "rules" ? <RulesTester /> : <LiveTab />;
}
