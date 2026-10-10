import { useEffect, useState } from "react";

/** สถานะล็อกอิน + โหลดผลวิเคราะห์ครั้งเดียว (ไม่ใช้ onSnapshot เพราะข้อมูลเปลี่ยนวันละครั้ง) */
export function useAnalytics(source) {
  const [user, setUser] = useState(undefined);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  // reload(): หลังยืนยันอีเมล user ตัวเดิมถูกแก้ในที่ (ไม่ใช่ object ใหม่) จึงต้องสั่งโหลดซ้ำเอง
  const [tick, setTick] = useState(0);
  useEffect(() => source.onAuth(setUser), [source]);
  useEffect(() => {
    // บัญชีอีเมลที่ยังไม่ยืนยัน rules ไม่ให้อ่าน (email_verified) หน้าจะขึ้นการ์ดยืนยันอีเมลแทน
    if (!user || user.emailVerified === false) return;
    setError(null);
    source.loadAnalytics().then(setData).catch((e) => setError(
      e.code === "permission-denied"
        ? "อ่านผลวิเคราะห์ไม่ได้: Security Rules ยังไม่เปิดให้อ่าน collection analytics (ดู Lab 4.2 ขั้น rules)"
        : e.message
    ));
  }, [source, user, tick]);
  return { user, data, error, reload: () => setTick((t) => t + 1) };
}
