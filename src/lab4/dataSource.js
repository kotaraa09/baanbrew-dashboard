// Lab 4 · ที่มาของผลวิเคราะห์ที่แท็บ "ลูกค้า & เมนู" และ "พยากรณ์ & ผิดปกติ" ใช้ (source ที่ useAnalytics รับ)
// firestoreSource อ่านเอกสารสรุป 5 ชิ้นใน collection "analytics" (ไม่อ่าน sales ดิบ: ~53,000 reads)
// demoSource (?demo) คำนวณในเบราว์เซอร์จาก CSV ด้วยฟังก์ชันชุดเดียวกับ pipeline ไม่ใช้โควตา
import Papa from "papaparse";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { auth, db, googleProvider } from "../lab3/firebase.js";
import { prepareRows } from "../lib/metrics.js";
import { buildDemoAnalytics } from "./demoAnalytics.js";

const DOCS = ["meta", "daily", "rfm", "cohort", "abc"];

// บัญชีอีเมลที่ยังไม่ยืนยัน rules จะไม่ให้อ่าน (email_verified) จึงถือว่ายังไม่ได้ล็อกอินสำหรับหน้านี้
const verified = (u) => (u && u.emailVerified ? u : null);

export const firestoreSource = {
  onAuth: (cb) => onAuthStateChanged(auth, (u) => cb(verified(u))),
  signIn: () => signInWithPopup(auth, googleProvider),
  signOut: () => signOut(auth),
  async loadAnalytics() {
    const snaps = await Promise.all(DOCS.map((id) => getDoc(doc(db, "analytics", id))));
    if (!snaps[0].exists()) throw new Error("ยังไม่มีผลวิเคราะห์ใน Firestore: รัน npm run analytics ก่อน");
    const out = Object.fromEntries(snaps.map((s, i) => [DOCS[i], s.exists() ? s.data() : { error: `ไม่พบ analytics/${DOCS[i]}` }]));
    // builtAt เป็น Firestore Timestamp แปลงเป็นมิลลิวินาทีให้ new Date() ใช้ได้
    if (out.meta.builtAt?.toMillis) out.meta.builtAt = out.meta.builtAt.toMillis();
    return { reads: DOCS.length, ...out };
  },
};

const loadCsv = (name) =>
  new Promise((resolve, reject) =>
    Papa.parse(`${import.meta.env.BASE_URL}${name}`, {
      download: true, header: true, skipEmptyLines: true,
      complete: (r) => resolve(r.data), error: reject,
    }),
  );

// โหมดสาธิต: ไม่ต้องล็อกอิน (ผู้ใช้สมมติ) และไม่แตะ Firestore
const demoUser = { uid: "demo", displayName: "โหมดสาธิต" };
export const demoSource = {
  onAuth: (cb) => { cb(demoUser); return () => {}; },
  signIn: async () => {},
  signOut: () => { window.location.search = ""; },
  async loadAnalytics() {
    const [sales, products, holidays] = await Promise.all([loadCsv("sales.csv"), loadCsv("products.csv"), loadCsv("thai_holidays.csv")]);
    return buildDemoAnalytics(prepareRows(sales), products, Object.fromEntries(holidays.map((h) => [h.date, h.holiday])));
  },
};

export const isDemo = () => new URLSearchParams(window.location.search).has("demo");
