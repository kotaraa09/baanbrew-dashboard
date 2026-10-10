// Lab 3.3 · หน้าล็อกอิน: Google หรืออีเมล/รหัสผ่าน (Prompt 3.3A + ล็อกอินด้วยอีเมลไว้ทดสอบ)
// บัญชีอีเมลต้องยืนยันอีเมลก่อนใช้งาน เพราะใครก็สมัครด้วยอีเมลของคนอื่นได้
// (Security Rules ตรวจ email_verified ซ้ำอีกชั้น บัญชี Google ยืนยันมาแล้วเสมอ)
import { useId, useRef, useState } from "react";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { auth, googleProvider } from "./firebase.js";
import { AlertIcon, Card, CheckIcon, EyeIcon, EyeOffIcon, Segmented } from "../components/ui.jsx";
import LoginCat from "./LoginCat.jsx";

// error ของ Firebase Auth ที่พบบ่อย → บอกว่าต้องไปแก้ตรงไหน
export function authErrorMessage(e) {
  switch (e.code) {
    case "auth/unauthorized-domain":
      return `โดเมน ${window.location.hostname} ยังไม่ได้รับอนุญาต ไปเพิ่มใน Firebase console → Authentication → Settings → Authorized domains`;
    case "auth/operation-not-allowed":
      return "ยังไม่ได้เปิดวิธีล็อกอินนี้ ไปเปิดใน Firebase console → Authentication → Sign-in method";
    case "auth/popup-blocked":
      return "เบราว์เซอร์บล็อกหน้าต่างล็อกอินไว้ อนุญาต popup ของเว็บนี้แล้วกดใหม่อีกที";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "หน้าต่างล็อกอินปิดไปก่อนเสร็จ กดเข้าสู่ระบบใหม่ได้เลย";
    // Firebase รวมอีเมลไม่มีในระบบกับรหัสผิดเป็น error เดียว เพื่อไม่บอกคนนอกว่าอีเมลไหนมีบัญชี
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
    case "auth/invalid-email":
      return "อีเมลพิมพ์ไม่ถูกรูปแบบ";
    case "auth/missing-password":
      return "ยังไม่ได้ใส่รหัสผ่าน";
    case "auth/email-already-in-use":
      return "อีเมลนี้มีบัญชีแล้ว สลับไปที่ “เข้าสู่ระบบ” แทน";
    case "auth/weak-password":
      return "รหัสผ่านต้องมีอย่างน้อย 6 ตัว";
    case "auth/too-many-requests":
      return "ลองบ่อยเกินไป รอสักพักแล้วค่อยลองใหม่";
    case "auth/network-request-failed":
      return "ต่ออินเทอร์เน็ตไม่ได้ ลองใหม่อีกที";
    default:
      return `เข้าสู่ระบบไม่ได้: ${e.message}`;
  }
}

// ช่องพิมพ์หน้าตาเดียวกับ Select และฟอร์มบันทึกยอดขาย
const inputClass =
  "h-8 w-full rounded-lg border border-line-strong bg-surface px-2.5 text-[13px] font-medium text-ink shadow-[0_1px_0_0_rgb(0_0_0/0.05)] transition-colors placeholder:font-normal placeholder:text-ink-muted hover:bg-surface-hover";

// ข้อความผลลัพธ์: ไอคอนวาด (ไม่ใช้ emoji) · error สีแดง · สำเร็จใช้ทองกับตัวอักษรปกติ
function Message({ message, className = "" }) {
  if (!message) return null;
  const error = message.tone === "error";
  return (
    <p role={error ? "alert" : "status"} className={`flex animate-fade-in items-start justify-center gap-1.5 text-[13px] ${error ? "text-down" : "text-ink"} ${className}`}>
      {error ? <AlertIcon className="mt-px size-4 shrink-0" /> : <CheckIcon className="mt-px size-4 shrink-0 text-chart" />}
      <span>{message.text}</span>
    </p>
  );
}

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

// success = เพิ่งล็อกอินสำเร็จ LiveTab ค้างหน้านี้ไว้ครู่หนึ่งให้แมวกระโดดลาก่อนเปิด Dashboard
export function SignInCard({ success = false }) {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // ยืนยันรหัสผ่าน (เฉพาะสมัครสมาชิก): บอกว่าไม่ตรงหลังออกจากช่องหรือกดสมัคร ไม่ขึ้นแดงระหว่างกำลังพิมพ์
  const [confirm, setConfirm] = useState("");
  const [confirmTouched, setConfirmTouched] = useState(false);
  const [busy, setBusy] = useState(null); // "google" | "email" | "reset" | null
  const [message, setMessage] = useState(null); // { tone: "error" | "ok", text }
  const [showPassword, setShowPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const ids = { email: useId(), password: useId(), confirm: useId() };
  const cat = useRef(null);
  const confirmRef = useRef(null);
  const signup = mode === "signup";
  const confirmMismatch = signup && confirmTouched && confirm !== password;
  const confirmMatches = signup && confirm !== "" && confirm === password;

  // ให้แมวมองตัวอักษรที่กำลังพิมพ์: วัดความกว้างข้อความก่อนเคอร์เซอร์ด้วย canvas ตามฟอนต์จริงของช่อง
  const followCaret = (input) => {
    const style = getComputedStyle(input);
    const ctx = (followCaret.canvas ??= document.createElement("canvas")).getContext("2d");
    ctx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    const before = input.value.slice(0, input.selectionStart ?? input.value.length);
    const rect = input.getBoundingClientRect();
    const x = rect.left + parseFloat(style.paddingLeft) + ctx.measureText(before).width - input.scrollLeft;
    cat.current?.lookAt({ x: Math.min(x, rect.right - 8), y: rect.top + rect.height / 2 });
  };
  const caretEvents = {
    onFocus: (e) => followCaret(e.target),
    onKeyUp: (e) => followCaret(e.target),
    onClick: (e) => followCaret(e.target),
    onSelect: (e) => followCaret(e.target),
    onBlur: () => cat.current?.lookAt(null),
  };
  // ช่องรหัสผ่าน: หางปิดตา · กดแสดงรหัสผ่าน: แอบมองข้างหนึ่ง
  const catMode = success ? "leave" : passwordFocused ? (showPassword ? "peek" : "cover") : "idle";

  // ครอบทุกการกด: กันกดซ้ำระหว่างรอ และแปลง error เป็นภาษาไทย
  const run = (kind, fn) => async (e) => {
    e?.preventDefault();
    setBusy(kind);
    setMessage(null);
    try {
      await fn();
    } catch (err) {
      setMessage({ tone: "error", text: authErrorMessage(err) });
      // ปิด popup เองไม่ใช่ความผิดพลาดที่ต้องตกใจ
      if (err.code !== "auth/popup-closed-by-user" && err.code !== "auth/cancelled-popup-request") cat.current?.startle();
    } finally {
      setBusy(null);
    }
  };

  const google = run("google", () => signInWithPopup(auth, googleProvider));

  const submitEmail = run("email", async () => {
    if (mode === "signin") {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } else {
      // ตรวจในเบราว์เซอร์ก่อน ไม่ส่งไป Firebase ถ้าพิมพ์รหัสผ่านสองช่องไม่ตรงกัน
      if (confirm !== password) {
        setConfirmTouched(true);
        confirmRef.current?.focus();
        cat.current?.startle();
        return;
      }
      const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password);
      // ส่งลิงก์ยืนยันทันที LiveTab จะแสดงหน้ารอยืนยันจนกว่าจะกดลิงก์
      await sendEmailVerification(user);
    }
  });

  const reset = run("reset", async () => {
    if (!email.trim()) {
      setMessage({ tone: "error", text: "ใส่อีเมลก่อน แล้วกด “ลืมรหัสผ่าน” อีกที" });
      return;
    }
    await sendPasswordResetEmail(auth, email.trim());
    // ข้อความเดียวกันไม่ว่าอีเมลจะมีบัญชีหรือไม่ ไม่บอกคนนอกว่าใครเป็นสมาชิก
    setMessage({ tone: "ok", text: `ถ้า ${email.trim()} มีบัญชีอยู่ จะได้ลิงก์ตั้งรหัสผ่านใหม่ทางอีเมล` });
  });

  return (
    // mt-40: ที่ว่างเหนือการ์ดให้แมวนอน · pt-11: หางกับอุ้งเท้าห้อยลงมาบนการ์ด ไม่ให้ทับหัวข้อ
    <Card className="relative mx-auto mt-40 max-w-sm animate-rise px-6 pt-11 pb-7">
      <LoginCat ref={cat} mode={catMode} />
      <div className="text-center">
        <h1 className="text-base font-semibold text-ink">เข้าสู่ระบบบ้านบรู</h1>
        <p className="mt-1 text-[13px] text-ink-subtle">ข้อมูลลูกค้า พยากรณ์ และยอดขายสด เปิดให้เฉพาะคนที่ล็อกอิน ทุกรายการที่บันทึกจะผูกกับบัญชีของคุณ</p>
      </div>

      <div className="mt-5 mb-4 flex justify-center">
        <Segmented
          label="วิธีใช้อีเมล"
          value={mode}
          onChange={(m) => {
            setMode(m);
            setMessage(null);
            setConfirmTouched(false);
          }}
          options={MODES}
        />
      </div>

      <form onSubmit={submitEmail} className="space-y-3">
        <div>
          <label htmlFor={ids.email} className="mb-1 block text-xs font-medium text-ink-subtle">อีเมล</label>
          <input
            id={ids.email}
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              followCaret(e.target);
            }}
            {...caretEvents}
            className={inputClass}
          />
        </div>
        <div>
          <div className="mb-1 flex items-baseline justify-between">
            <label htmlFor={ids.password} className="text-xs font-medium text-ink-subtle">รหัสผ่าน</label>
            {mode === "signin" && (
              <button type="button" onClick={reset} disabled={!!busy} className="text-xs text-ink-muted underline-offset-2 hover:text-ink hover:underline">
                ลืมรหัสผ่าน
              </button>
            )}
          </div>
          <div className="relative">
            <input
              id={ids.password}
              type={showPassword ? "text" : "password"}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              required
              minLength={mode === "signup" ? 6 : undefined}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              className={`${inputClass} pr-9`}
            />
            <button
              type="button"
              aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "ดูรหัสผ่าน"}
              aria-pressed={showPassword}
              aria-controls={ids.password}
              // ไม่ให้ปุ่มแย่ง focus จากช่องรหัสผ่าน หางแมวจะได้ไม่เด้งออกจากตาทุกครั้งที่กด
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-0 flex w-9 items-center justify-center rounded-r-lg text-ink-muted transition-colors hover:text-ink"
            >
              {showPassword ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
            </button>
          </div>
          {signup && <p className="mt-1 text-xs text-ink-muted">อย่างน้อย 6 ตัว · เดี๋ยวจะส่งลิงก์ยืนยันไปที่อีเมลนี้</p>}
        </div>
        {signup && (
          <div className="animate-fade-in">
            <label htmlFor={ids.confirm} className="mb-1 block text-xs font-medium text-ink-subtle">ยืนยันรหัสผ่าน</label>
            <input
              ref={confirmRef}
              id={ids.confirm}
              // ปุ่มแสดงรหัสผ่านในช่องบนคุมทั้งสองช่อง จะได้เทียบกันด้วยตาได้
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => {
                setPasswordFocused(false);
                if (confirm) setConfirmTouched(true);
              }}
              aria-invalid={confirmMismatch}
              aria-describedby={confirmMismatch || confirmMatches ? `${ids.confirm}-hint` : undefined}
              className={`${inputClass} ${confirmMismatch ? "!border-down" : ""}`}
            />
            {confirmMismatch && (
              <p id={`${ids.confirm}-hint`} className="mt-1 flex items-center gap-1 text-xs text-down">
                <AlertIcon className="size-3.5 shrink-0" />
                รหัสผ่านไม่ตรงกัน
              </p>
            )}
            {!confirmMismatch && confirmMatches && (
              <p id={`${ids.confirm}-hint`} className="mt-1 flex animate-fade-in items-center gap-1 text-xs text-ink-subtle">
                <CheckIcon className="size-3.5 shrink-0 text-chart" />
                รหัสผ่านตรงกัน
              </p>
            )}
          </div>
        )}
        <button
          type="submit"
          disabled={!!busy}
          className="h-9 w-full rounded-lg bg-chart text-[13px] font-semibold text-on-chart transition-[opacity,scale] active:scale-[0.98] disabled:cursor-wait disabled:opacity-60"
        >
          {busy === "email" ? "รอสักครู่…" : mode === "signin" ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs text-ink-muted" aria-hidden="true">
        <span className="h-px flex-1 bg-line" />
        หรือ
        <span className="h-px flex-1 bg-line" />
      </div>

      <button
        type="button"
        onClick={google}
        disabled={!!busy}
        className="inline-flex h-9 w-full items-center justify-center gap-2.5 rounded-lg border border-line-strong bg-surface text-[13px] font-medium text-ink shadow-[0_1px_0_0_rgb(0_0_0/0.05)] transition-[background-color,scale] hover:bg-surface-hover active:scale-[0.98] disabled:cursor-wait disabled:opacity-60"
      >
        <GoogleLogo />
        {busy === "google" ? "กำลังเปิดหน้าต่างล็อกอิน…" : "เข้าสู่ระบบด้วย Google"}
      </button>

      <Message message={success ? { tone: "ok", text: "ล็อกอินแล้ว กำลังเปิดหน้าต่อไป…" } : message} className="mt-4 text-center" />
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
      setMessage({ tone: "ok", text: "ส่งลิงก์ยืนยันไปอีกรอบแล้ว ดูในกล่องจดหมาย (เช็กโฟลเดอร์สแปมด้วย)" });
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
        setMessage({ tone: "error", text: "ยังไม่ได้ยืนยัน กดลิงก์ในอีเมลก่อน แล้วค่อยกดปุ่มนี้อีกที" });
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
    <Card className="mx-auto max-w-sm animate-rise px-6 py-7 text-center">
      <h1 className="text-base font-semibold text-ink">ยืนยันอีเมลก่อนเริ่มใช้</h1>
      <p className="mt-2 text-[13px] text-ink-subtle">
        ส่งลิงก์ยืนยันไปที่ <span className="font-medium text-ink">{user.email}</span> แล้ว กดลิงก์ในอีเมล แล้วกลับมากดปุ่มข้างล่างนี้
      </p>
      <div className="mt-5 space-y-2">
        <button
          type="button"
          onClick={check}
          disabled={!!busy}
          className="h-9 w-full rounded-lg bg-chart text-[13px] font-semibold text-on-chart transition-[opacity,scale] active:scale-[0.98] disabled:cursor-wait disabled:opacity-60"
        >
          {busy === "check" ? "กำลังเช็ก…" : "ยืนยันแล้ว เข้าใช้งาน"}
        </button>
        <button
          type="button"
          onClick={resend}
          disabled={!!busy}
          className="h-9 w-full rounded-lg border border-line-strong bg-surface text-[13px] font-medium text-ink-subtle hover:bg-surface-hover hover:text-ink disabled:opacity-60"
        >
          ส่งลิงก์อีกรอบ
        </button>
        <button type="button" onClick={() => signOut(auth)} className="h-9 w-full text-[13px] text-ink-muted hover:text-ink">
          ใช้บัญชีอื่น
        </button>
      </div>
      <Message message={message} className="mt-4" />
    </Card>
  );
}
