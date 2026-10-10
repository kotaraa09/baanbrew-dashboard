// หน้าเข้าสู่ระบบหน้าเดียวของทั้งเว็บ (#login หรือเปิดหน้าที่ต้องล็อกอินตอนยังไม่ได้ล็อกอิน)
// ล็อกอินสำเร็จจากหน้านี้: ค้างไว้ให้แมวกระโดดลาก่อน แล้วค่อยพาไปหน้าที่ตั้งใจจะเปิด (onDone)
import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase.js";
import { SignInCard } from "./SignIn.jsx";
import { LEAVE_MS as CAT_LEAVE_MS } from "./cat/rig.js";

export default function LoginPage({ onDone }) {
  const [celebrating, setCelebrating] = useState(false);
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    let prev;
    let timer = 0;
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u && prev === undefined) {
        // เปิดหน้านี้ตอนล็อกอินอยู่แล้ว: ไปต่อเลย ไม่ต้องเล่นแมว
        done.current();
      } else if (u && prev === null) {
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (reduce) done.current();
        else {
          setCelebrating(true);
          timer = setTimeout(() => done.current(), CAT_LEAVE_MS);
        }
      }
      prev = u;
    });
    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  return <SignInCard success={celebrating} />;
}
