import { useEffect, useState } from "react";

// สถานะล็อกอินของทั้งเว็บ (แถบบนใช้ซ่อน/แสดงหน้าที่ต้องล็อกอิน)
// โหลด Firebase แบบ lazy หลังหน้าแรกขึ้นแล้ว หน้าภาพรวมจึงไม่ช้าลงเพราะ SDK
// user: undefined = ยังไม่รู้ · null = ไม่ได้ล็อกอิน · configured: false = ยังไม่ได้ใส่ .env
export function useAuthUser() {
  const [state, setState] = useState({ user: undefined, configured: true, signOut: null });
  useEffect(() => {
    let cancelled = false;
    let unsubscribe = () => {};
    Promise.all([import("./firebase.js"), import("firebase/auth")]).then(([fb, a]) => {
      if (cancelled) return;
      if (!fb.isConfigured) return setState({ user: null, configured: false, signOut: null });
      unsubscribe = a.onAuthStateChanged(fb.auth, (user) =>
        setState({ user, configured: true, signOut: () => a.signOut(fb.auth) }),
      );
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);
  return state;
}
