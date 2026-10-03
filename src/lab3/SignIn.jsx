// Lab 3.3 · หน้าล็อกอิน: Google หรืออีเมล/รหัสผ่าน (Prompt 3.3A + ล็อกอินด้วยอีเมลไว้ทดสอบ)
// บัญชีอีเมลต้องยืนยันอีเมลก่อนใช้งาน เพราะใครก็สมัครด้วยอีเมลของคนอื่นได้
// (Security Rules ตรวจ email_verified ซ้ำอีกชั้น บัญชี Google ยืนยันมาแล้วเสมอ)
import { useId, useState } from "react";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { auth, googleProvider } from "./firebase.js";
import { Card, CupIcon, Segmented } from "../components/ui.jsx";

// error ของ Firebase Auth ที่พบบ่อย → บอกว่าต้องไปแก้ตรงไหน
export function authErrorMessage(e) {
  switch (e.code) {
    case "auth/unauthorized-domain":
      return `โดเมน ${window.location.hostname} ยังไม่ได้รับอนุญาต เพิ่มใน Firebase console → Authentication → Settings → Authorized domains`;
    case "auth/operation-not-allowed":
      return "ยังไม่ได้เปิดวิธีล็อกอินนี้ใน Firebase console → Authentication → Sign-in method";
    case "auth/popup-blocked":
      return "เบราว์เซอร์บล็อกหน้าต่างล็อกอิน อนุญาต popup สำหรับเว็บนี้แล้วกดอีกครั้ง";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "ปิดหน้าต่างล็อกอินก่อนเสร็จ กดเข้าสู่ระบบอีกครั้งได้เลย";
    // Firebase รวมอีเมลไม่มีในระบบกับรหัสผิดเป็น error เดียว เพื่อไม่บอกคนนอกว่าอีเมลไหนมีบัญชี
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
    case "auth/invalid-email":
      return "รูปแบบอีเมลไม่ถูกต้อง";
    case "auth/missing-password":
      return "กรอกรหัสผ่าน";
    case "auth/email-already-in-use":
      return "อีเมลนี้มีบัญชีอยู่แล้ว เปลี่ยนไปที่ “เข้าสู่ระบบ” แทน";
    case "auth/weak-password":
      return "รหัสผ่านต้องยาวอย่างน้อย 6 ตัวอักษร";
    case "auth/too-many-requests":
      return "ลองหลายครั้งเกินไป รอสักครู่แล้วลองใหม่";
    case "auth/network-request-failed":
      return "เชื่อมต่ออินเทอร์เน็ตไม่ได้ ลองใหม่อีกครั้ง";
    default:
      return `เข้าสู่ระบบไม่สำเร็จ: ${e.message}`;
  }
}

const inputClass =
  "h-9 w-full rounded-lg border border-line-strong bg-surface px-2.5 text-sm text-ink transition-colors placeholder:text-ink-muted hover:border-ink-muted";

const MODES = [
  { value: "signin", label: "เข้าสู่ระบบ" },
  { value: "signup", label: "สมัครสมาชิก" },
];

function GoogleLogo() {
  return (
    <svg viewBox="0 0 48 48" className="size-4" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

export function SignInCard() {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(null); // "google" | "email" | "reset" | null
  const [message, setMessage] = useState(null); // { tone: "error" | "ok", text }
  const ids = { email: useId(), password: useId() };

  // ครอบทุกการกด: กันกดซ้ำระหว่างรอ และแปลง error เป็นภาษาไทย
  const run = (kind, fn) => async (e) => {
    e?.preventDefault();
    setBusy(kind);
    setMessage(null);
    try {
      await fn();
    } catch (err) {
      setMessage({ tone: "error", text: authErrorMessage(err) });
    } finally {
      setBusy(null);
    }
  };

  const google = run("google", () => signInWithPopup(auth, googleProvider));

  const submitEmail = run("email", async () => {
    if (mode === "signin") {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } else {
      const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password);
      // ส่งลิงก์ยืนยันทันที LiveTab จะแสดงหน้ารอยืนยันจนกว่าจะกดลิงก์
      await sendEmailVerification(user);
    }
  });

  const reset = run("reset", async () => {
    if (!email.trim()) {
      setMessage({ tone: "error", text: "กรอกอีเมลก่อน แล้วกด “ลืมรหัสผ่าน” อีกครั้ง" });
      return;
    }
    await sendPasswordResetEmail(auth, email.trim());
    // ข้อความเดียวกันไม่ว่าอีเมลจะมีบัญชีหรือไม่ ไม่บอกคนนอกว่าใครเป็นสมาชิก
    setMessage({ tone: "ok", text: `ถ้า ${email.trim()} มีบัญชีอยู่ จะได้รับลิงก์ตั้งรหัสผ่านใหม่ทางอีเมล` });
  });

  return (
    <Card className="mx-auto max-w-sm px-6 py-7">
      <div className="text-center">
        <CupIcon className="mx-auto mb-3 size-8 text-chart" />
        <h1 className="text-lg font-semibold text-ink">เข้าสู่ระบบเพื่อดูยอดขายสด</h1>
        <p className="mt-1 text-[13px] text-ink-subtle">ยอดขายเปิดให้เฉพาะผู้ที่ล็อกอิน และทุกรายการที่บันทึกจะผูกกับบัญชีของคุณ</p>
      </div>

      <button
        type="button"
        onClick={google}
        disabled={!!busy}
        className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2.5 rounded-lg border border-line-strong bg-surface text-sm font-medium text-ink transition-[background-color,scale] hover:bg-surface-hover active:scale-[0.98] disabled:cursor-wait disabled:opacity-60"
      >
        <GoogleLogo />
        {busy === "google" ? "กำลังเปิดหน้าต่างล็อกอิน…" : "เข้าสู่ระบบด้วย Google"}
      </button>

      <div className="my-5 flex items-center gap-3 text-xs text-ink-muted" aria-hidden="true">
        <span className="h-px flex-1 bg-line" />
        หรือใช้อีเมล
        <span className="h-px flex-1 bg-line" />
      </div>

      <div className="mb-4 flex justify-center">
        <Segmented label="วิธีใช้อีเมล" value={mode} onChange={(m) => { setMode(m); setMessage(null); }} options={MODES} />
      </div>

      <form onSubmit={submitEmail} className="space-y-3">
        <div>
          <label htmlFor={ids.email} className="mb-1 block text-[13px] font-medium text-ink-subtle">อีเมล</label>
          <input id={ids.email} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
        </div>
        <div>
          <div className="mb-1 flex items-baseline justify-between">
            <label htmlFor={ids.password} className="text-[13px] font-medium text-ink-subtle">รหัสผ่าน</label>
            {mode === "signin" && (
              <button type="button" onClick={reset} disabled={!!busy} className="text-xs text-ink-muted underline-offset-2 hover:text-ink hover:underline">
                ลืมรหัสผ่าน
              </button>
            )}
          </div>
          <input
            id={ids.password}
            type="password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            required
            minLength={mode === "signup" ? 6 : undefined}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
          {mode === "signup" && <p className="mt-1 text-xs text-ink-muted">อย่างน้อย 6 ตัวอักษร · จะส่งลิงก์ยืนยันไปที่อีเมลนี้</p>}
        </div>
        <button
          type="submit"
          disabled={!!busy}
          className="h-10 w-full rounded-lg bg-chart text-sm font-semibold text-on-chart transition-[opacity,scale] active:scale-[0.98] disabled:cursor-wait disabled:opacity-60"
        >
          {busy === "email" ? "กำลังดำเนินการ…" : mode === "signin" ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}
        </button>
      </form>

      {message && (
        <p role={message.tone === "error" ? "alert" : "status"} className={`mt-4 text-center text-[13px] ${message.tone === "error" ? "text-down" : "text-up"}`}>
          {message.text}
        </p>
      )}
    </Card>
  );
}

// ล็อกอินด้วยอีเมลแล้วแต่ยังไม่ยืนยัน: ยังไม่ให้เห็นยอดขาย (rules ก็ปฏิเสธอยู่ดี)
export function VerifyEmailCard({ user, onVerified }) {
  const [busy, setBusy] = useState(null);
  const [message, setMessage] = useState(null);

  const resend = async () => {
    setBusy("resend");
    setMessage(null);
    try {
      await sendEmailVerification(user);
      setMessage({ tone: "ok", text: "ส่งลิงก์ยืนยันอีกครั้งแล้ว ดูในกล่องจดหมาย (และโฟลเดอร์สแปม)" });
    } catch (e) {
      setMessage({ tone: "error", text: authErrorMessage(e) });
    } finally {
      setBusy(null);
    }
  };

  const check = async () => {
    setBusy("check");
    setMessage(null);
    try {
      await user.reload();
      if (!user.emailVerified) {
        setMessage({ tone: "error", text: "ยังไม่ได้ยืนยัน กดลิงก์ในอีเมลก่อน แล้วกดปุ่มนี้อีกครั้ง" });
        return;
      }
      // ขอ token ใหม่ ไม่งั้น Security Rules ยังเห็น email_verified = false จาก token เดิม
      await user.getIdToken(true);
      onVerified();
    } catch (e) {
      setMessage({ tone: "error", text: authErrorMessage(e) });
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card className="mx-auto max-w-sm px-6 py-7 text-center">
      <h1 className="text-lg font-semibold text-ink">ยืนยันอีเมลก่อนใช้งาน</h1>
      <p className="mt-2 text-[13px] text-ink-subtle">
        ส่งลิงก์ยืนยันไปที่ <span className="font-medium text-ink">{user.email}</span> แล้ว กดลิงก์ในอีเมล จากนั้นกลับมากดปุ่มด้านล่าง
      </p>
      <div className="mt-5 space-y-2">
        <button
          type="button"
          onClick={check}
          disabled={!!busy}
          className="h-10 w-full rounded-lg bg-chart text-sm font-semibold text-on-chart disabled:cursor-wait disabled:opacity-60"
        >
          {busy === "check" ? "กำลังตรวจ…" : "ยืนยันแล้ว เข้าใช้งาน"}
        </button>
        <button
          type="button"
          onClick={resend}
          disabled={!!busy}
          className="h-9 w-full rounded-lg border border-line-strong bg-surface text-[13px] font-medium text-ink-subtle hover:bg-surface-hover hover:text-ink disabled:opacity-60"
        >
          ส่งลิงก์อีกครั้ง
        </button>
        <button type="button" onClick={() => signOut(auth)} className="h-9 w-full text-[13px] text-ink-muted hover:text-ink">
          ใช้บัญชีอื่น
        </button>
      </div>
      {message && (
        <p role={message.tone === "error" ? "alert" : "status"} className={`mt-4 text-[13px] ${message.tone === "error" ? "text-down" : "text-up"}`}>
          {message.text}
        </p>
      )}
    </Card>
  );
}
