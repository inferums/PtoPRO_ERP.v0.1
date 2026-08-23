import { useEffect, useState } from "react";
import { demoLogin, login, register, type User } from "../lib/auth";
import { Logo } from "./icons";

type Mode = "login" | "register";

const freshCaptcha = () => ({ a: 10 + Math.floor(Math.random() * 60), b: 3 + Math.floor(Math.random() * 30) });

export default function AuthScreen({ onAuthed }: { onAuthed: (user: User, seedDemo: boolean) => void }) {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgName, setOrgName] = useState("");
  const [captcha, setCaptcha] = useState(freshCaptcha);
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);

  useEffect(() => {
    setError(null);
    setCaptcha(freshCaptcha());
    setCaptchaAnswer("");
  }, [mode]);

  const fail = (msg: string) => {
    setError(msg);
    setCaptcha(freshCaptcha());
    setCaptchaAnswer("");
    setShakeKey((k) => k + 1);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (Number(captchaAnswer) !== captcha.a + captcha.b) {
      fail("Проверка не пройдена — решите пример ещё раз");
      return;
    }
    setBusy(true);
    setError(null);
    const res = mode === "login" ? await login(email, password) : await register(email, password, orgName);
    setBusy(false);
    if (!res.ok) {
      fail(res.error);
      return;
    }
    onAuthed(res.user, false);
  };

  const demo = async () => {
    if (busy) return;
    setBusy(true);
    const res = await demoLogin();
    setBusy(false);
    if (res.ok) onAuthed(res.user, true);
  };

  const inp =
    "w-full border border-line bg-white px-3.5 py-3 text-[14px] text-ink outline-none transition-all placeholder:text-dim focus:border-brand focus:shadow-[0_0_0_3px_rgba(30,136,229,0.12)]";
  const lbl = "mb-1.5 block font-mono text-[10.5px] uppercase tracking-[0.16em] text-mut";

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg p-5">
      <div aria-hidden="true" className="bg-dots absolute inset-0" />
      <div aria-hidden="true" className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-brand/10 blur-3xl" />
      <div aria-hidden="true" className="absolute -bottom-32 -right-20 h-[28rem] w-[28rem] rounded-full bg-navy/10 blur-3xl" />

      <div key={shakeKey} className={`fade-up relative w-full max-w-[420px] ${shakeKey ? "shake" : ""}`}>
        {/* фирменный верх */}
        <div className="flex items-center gap-3.5">
          <Logo size={46} />
          <div>
            <p className="font-display text-[17px] font-extrabold tracking-wide text-ink">PtoPRO-ERP</p>
            <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-dim">система документооборота</p>
          </div>
        </div>

        <div className="mt-6 border border-line bg-surface shadow-[0_30px_70px_-30px_rgba(14,36,60,0.35)]">
          <div className="grid grid-cols-2 border-b border-line">
            {(["login", "register"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`cursor-pointer px-4 py-3.5 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] transition-all ${
                  mode === m ? "bg-navy text-white" : "bg-soft text-mut hover:text-ink"
                }`}
              >
                {m === "login" ? "Вход в систему" : "Регистрация"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-4 p-6">
            {mode === "register" && (
              <div>
                <label className={lbl}>Организация / ФИО</label>
                <input value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="ИП Иванов И. И." className={inp} />
              </div>
            )}
            <div>
              <label className={lbl}>Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.ru" autoComplete="email" className={inp} />
            </div>
            <div>
              <label className={lbl}>Пароль</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="минимум 6 символов" autoComplete={mode === "login" ? "current-password" : "new-password"} className={inp} />
            </div>

            <div className="border border-dashed border-line2 bg-soft px-4 py-3.5">
              <label className={lbl}>
                Докажите, что вы не робот: <span className="font-semibold text-ink">{captcha.a} + {captcha.b} =</span>
              </label>
              <div className="flex items-center gap-2.5">
                <input
                  inputMode="numeric"
                  required
                  value={captchaAnswer}
                  onChange={(e) => setCaptchaAnswer(e.target.value.replace(/\D/g, ""))}
                  placeholder="?"
                  className={`${inp} !w-24 text-center font-mono`}
                />
                <button
                  type="button"
                  onClick={() => {
                    setCaptcha(freshCaptcha());
                    setCaptchaAnswer("");
                  }}
                  className="cursor-pointer border border-line bg-white px-3 py-3 font-mono text-[11px] text-mut transition-colors hover:border-brand hover:text-brand"
                  title="Другой пример"
                >
                  ↻ другой
                </button>
              </div>
            </div>

            {error && (
              <p className="border-l-[3px] border-danger bg-[#fbe7e5] px-3.5 py-2.5 text-[12.5px] font-medium text-[#b03a30]">{error}</p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full cursor-pointer bg-brand py-3.5 font-mono text-[12px] font-bold uppercase tracking-[0.16em] text-white transition-all hover:bg-brand2 hover:shadow-[0_10px_28px_-8px_rgba(30,136,229,0.55)] disabled:opacity-60"
            >
              {busy ? "проверяем…" : mode === "login" ? "войти" : "создать аккаунт"}
            </button>

            <button
              type="button"
              onClick={demo}
              disabled={busy}
              className="w-full cursor-pointer border border-brand/50 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-brand transition-colors hover:bg-brand/10 disabled:opacity-60"
            >
              Создать демо-данные
            </button>
          </form>
        </div>

        <p className="mt-5 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-dim">
          данные хранятся локально в вашем браузере
        </p>
      </div>
    </div>
  );
}
