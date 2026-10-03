// สร้าง (หรืออัปเดต) บัญชีทดสอบสำหรับล็อกอินด้วยอีเมล
//
//   npm run create-test-user
//
// ต้องมีใน .env:
//   FIREBASE_SERVICE_ACCOUNT=./secrets/service-account.json
//   TEST_USER_EMAIL=test@example.com        (ไม่ใส่ = test@example.com)
//   TEST_USER_PASSWORD=รหัสที่ตั้งเอง          (อย่างน้อย 6 ตัว · .env ไม่ขึ้น GitHub)
//
// ทำไมไม่สมัครจากหน้าเว็บ: example.com ไม่มีกล่องจดหมายจริง กดลิงก์ยืนยันอีเมลไม่ได้
// สคริปต์นี้ใช้ Admin SDK ตั้ง emailVerified = true ให้เลย จึงผ่านเงื่อนไข email_verified ใน Security Rules
import fs from "node:fs";

const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT;
const email = (process.env.TEST_USER_EMAIL || "test@example.com").trim();
const password = process.env.TEST_USER_PASSWORD ?? "";

if (!keyPath || !fs.existsSync(keyPath)) {
  console.error("❌ ไม่พบ service account key ตั้งค่า FIREBASE_SERVICE_ACCOUNT ใน .env");
  process.exit(1);
}
if (password.length < 6) {
  console.error("❌ ตั้ง TEST_USER_PASSWORD ใน .env ก่อน (อย่างน้อย 6 ตัวอักษร) แล้วรันใหม่");
  process.exit(1);
}

const { initializeApp, cert } = await import("firebase-admin/app");
const { getAuth } = await import("firebase-admin/auth");
initializeApp({ credential: cert(JSON.parse(fs.readFileSync(keyPath, "utf8"))) });
const auth = getAuth();

const profile = { email, password, emailVerified: true, displayName: "บัญชีทดสอบ" };
let user;
try {
  // มีอยู่แล้ว → อัปเดตรหัสผ่านและสถานะยืนยัน (รันซ้ำได้ ไม่สร้างบัญชีซ้ำ)
  const existing = await auth.getUserByEmail(email);
  user = await auth.updateUser(existing.uid, profile);
  console.log(`✅ อัปเดตบัญชี ${email} แล้ว`);
} catch (e) {
  if (e.code !== "auth/user-not-found") throw e;
  user = await auth.createUser(profile);
  console.log(`✅ สร้างบัญชี ${email} แล้ว`);
}
console.log(`   uid: ${user.uid} · ยืนยันอีเมลแล้ว: ${user.emailVerified}`);
console.log("   ล็อกอินที่แท็บ “สด · Firestore” → หรือใช้อีเมล → เข้าสู่ระบบ ด้วยรหัสผ่านใน .env");
