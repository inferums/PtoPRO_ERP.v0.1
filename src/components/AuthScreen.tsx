import { useState } from "react";
import { demoLogin, login, makeCaptcha, register, type User } from "../lib/auth";
import { Logo, IconDownload } from "./icons";

type Mode = "login" | "register";

const PAPERS = [
  { title: "СЧЁТ № 12", lines: 4, stamp: false, rotate: "-3deg", tone: "border-line2" },
  { title: "АКТ № 8", lines: 3, stamp: true, rotate: "2deg", tone: "border-brand/40" },
  { title: "ДОГОВОР № 3", lines: 5, stamp: false, rotate: "-1.5deg", tone: "border-line2" },
];

export default function AuthScreen({ onAuthed }: { onAuthed: (user: User, seed: boolean) => void }) {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgName, setOrgName] = useState("");
  const [captcha, setCaptcha] = useState(makeCaptcha);
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [stamped, setStamped] = useState(false);
  const [shake, setShake] = useState(0);

  const fail = (msg: string) => {
    setError(msg);
    setCaptcha(makeCaptcha());
    setCaptchaAnswer("");
    setShake((s) => s + 1);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError(null);

    if (Number(captchaAnswer) !== captcha.a + captcha.b) {
      fail("Проверка не пройдена — решите пример ещё раз");
      return;
    }

    setBusy(true);
    const res =
      mode === "login" ? await login(email, password) : await register(email, password, orgName);
    setBusy(false);

    if (!res.ok) {
      fail(res.error);
      return;
    }

    setStamped(true);
    setTimeout(
      () => onAuthed(res.user, false),
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 500
    );
  };

  const demo = async () => {
    setBusy(true);
    const res = await demoLogin();
    setBusy(false);
    if (res.ok) onAuthed(res.user, true);
  };

  const inp =
    "w-full border-0 border-b-2 border-line2 bg-transparent py-2.5 text-[14.5px] text-ink outline-none transition-colors placeholder:text-dim focus:border-brand";

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* левая панель — «архив» */}
      <aside className="relative hidden overflow-hidden bg-navy lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(115deg, rgba(255,255,255,0.045) 0 2px, transparent 2px 26px)",
          }}
        />
        <div className="relative flex items-center gap-4">
          <Logo size={46} />
          <div>
            <p className="font-display text-[17px] font-extrabold leading-tight tracking-wide text-white">
              ИП Документооборот
            </p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.22em] text-white/40">
              система управления документами
            </p>
          </div>
        </div>

        <div className="relative">
          <p className="font-display text-[34px] font-extrabold leading-[1.12] tracking-tight text-white">
            Счета, акты
            <br />
            и договоры — <span className="text-brand">в одном</span>
            <br />
            реестре
          </p>
          <p className="mt-5 max-w-sm text-[14.5px] leading-relaxed text-white/60">
            Формируйте документы по шаблону, отслеживайте оплату, выгружайте в Word. Данные — у вас,
            работает без интернета.
          </p>

          {/* стопка бумаг */}
          <div className="mt-10 flex items-end gap-4">
            {PAPERS.map((p, i) => (
              <div
                key={p.title}
                className={`relative w-32 border ${p.tone} bg-white/95 p-3 shadow-[0_22px_44px_-16px_rgba(0,0,0,0.55)] transition-transform duration-500 hover:-translate-y-2`}
                style={{ transform: `rotate(${p.rotate})`, marginBottom: `${i * -6}px` }}
              >
                <p className="font-mono text-[9px] font-bold tracking-[0.12em] text-ink">{p.title}</p>
                <div className="mt-2.5 space-y-1.5">
                  {Array.from({ length: p.lines }).map((_, j) => (
                    <div key={j} className="h-[3px] bg-line" style={{ width: `${88 - j * 12}%` }} />
                  ))}
                </div>
                {p.stamp && (
                  <span className="absolute -right-2 bottom-3 grid h-12 w-12 rotate-[-14deg] place-items-center rounded-full border-2 border-stamp/70 text-center font-display text-[8px] font-extrabold uppercase tracking-widest text-stamp">
                    опла-
                    <br />
                    чено
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">
          <span className="pulse-soft h-1.5 w-1.5 rounded-full bg-paid" />
          локальный режим · pwa · v0.2
        </div>
      </aside>

      {/* правая панель — бланк входа */}
      <main className="bg-dots relative flex items-center justify-center bg-bg px-5 py-10">
        <div key={shake} className={`${shake ? "shake" : ""} relative w-full max-w-[430px]`}>
          <div className="relative border border-line bg-white p-8 shadow-[0_30px_70px_-24px_rgba(14,36,60,0.3)] md:p-10">
            {/* уголки-метки */}
            {(["-top-px -left-px border-t-2 border-l-2", "-top-px -right-px border-t-2 border-r-2", "-bottom-px -left-px border-b-2 border-l-2", "-bottom-px -right-px border-b-2 border-r-2"] as const).map(
              (pos) => (
                <span key={pos} aria-hidden="true" className={`absolute h-4 w-4 border-brand ${pos}`} />
              )
            )}

            {stamped && (
              <div className="stamp-in pointer-events-none absolute right-6 top-6 z-10 grid h-24 w-24 place-items-center rounded-full border-[3px] border-paid/80 text-paid">
                <div className="grid h-[82px] w-[82px] place-items-center rounded-full border border-paid/80 text-center">
                  <p className="font-display text-[11px] font-extrabold uppercase leading-tight tracking-[0.14em]">
                    доступ
                    <br />
                    открыт
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 lg:hidden">
              <Logo size={38} />
              <p className="font-display text-[15px] font-extrabold tracking-wide text-ink">ИП Документооборот</p>
            </div>

            <h1 className="mt-6 font-display text-[24px] font-extrabold tracking-tight text-ink lg:mt-0">
              {mode === "login" ? "Вход в систему" : "Регистрация"}
            </h1>
            <p className="mt-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-dim">
              {mode === "login" ? "форма № ВХ-01" : "форма № РЕГ-01"} · заполняется на русском
            </p>

            {error && (
              <p className="fade-up mt-5 border-l-[3px] border-danger bg-danger/[0.07] px-4 py-3 text-[13px] leading-snug text-danger">
                {error}
              </p>
            )}

            <form onSubmit={submit} className="mt-6 space-y-5">
              {mode === "register" && (
                <div>
                  <label className="mb-1 block font-mono text-[10.5px] uppercase tracking-[0.14em] text-mut">
                    Название организации
                  </label>
                  <input value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="ИП Иванов И. И." className={inp} />
                </div>
              )}
              <div>
                <label className="mb-1 block font-mono text-[10.5px] uppercase tracking-[0.14em] text-mut">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.ru"
                  autoComplete="email"
                  className={inp}
                />
              </div>
              <div>
                <label className="mb-1 block font-mono text-[10.5px] uppercase tracking-[0.14em] text-mut">Пароль</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "register" ? "минимум 6 символов" : "••••••••"}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  className={inp}
                />
              </div>

              {/* капча */}
              <div className="border border-dashed border-line2 bg-soft px-4 py-3.5">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-dim">Докажите, что вы не робот</p>
                <div className="mt-2 flex items-center gap-3">
                  <span className="font-mono text-[18px] font-bold text-ink">
                    {captcha.a} + {captcha.b} =
                  </span>
                  <input
                    value={captchaAnswer}
                    onChange={(e) => setCaptchaAnswer(e.target.value.replace(/\D/g, "").slice(0, 3))}
                    inputMode="numeric"
                    placeholder="?"
                    className="w-16 border-0 border-b-2 border-line2 bg-transparent pb-0.5 text-center font-mono text-[18px] font-bold text-brand outline-none transition-colors placeholder:text-dim focus:border-brand"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setCaptcha(makeCaptcha());
                      setCaptchaAnswer("");
                    }}
                    className="ml-auto cursor-pointer font-mono text-[10px] uppercase tracking-[0.1em] text-dim transition-colors hover:text-brand"
                    title="Другой пример"
                  >
                    ↻ другой
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full cursor-pointer bg-brand py-3.5 font-mono text-[12px] font-bold uppercase tracking-[0.16em] text-white transition-all duration-200 hover:bg-brand2 hover:shadow-[0_10px_30px_-8px_rgba(30,136,229,0.55)] disabled:cursor-wait disabled:opacity-60"
              >
                {busy ? "проверка…" : mode === "login" ? "Войти" : "Создать аккаунт"}
              </button>
            </form>

            <p className="mt-5 text-center text-[13px] text-mut">
              {mode === "login" ? (
                <>
                  Нет аккаунта?{" "}
                  <button
                    onClick={() => {
                      setMode("register");
                      setError(null);
                    }}
                    className="cursor-pointer font-semibold text-brand underline-offset-4 transition-colors hover:text-brand2 hover:underline"
                  >
                    Зарегистрироваться
                  </button>
                </>
              ) : (
                <>
                  Уже есть аккаунт?{" "}
                  <button
                    onClick={() => {
                      setMode("login");
                      setError(null);
                    }}
                    className="cursor-pointer font-semibold text-brand underline-offset-4 transition-colors hover:text-brand2 hover:underline"
                  >
                    Войти
                  </button>
                </>
              )}
            </p>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <span className="h-px flex-1 bg-line2" />
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-dim">или</span>
            <span className="h-px flex-1 bg-line2" />
          </div>

          <button
            onClick={demo}
            disabled={busy}
            className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2.5 border border-brand/50 bg-white/70 py-3.5 font-mono text-[12px] font-semibold uppercase tracking-[0.14em] text-brand transition-all duration-200 hover:border-brand hover:bg-white hover:shadow-[0_10px_26px_-10px_rgba(30,136,229,0.4)] disabled:cursor-wait disabled:opacity-60"
          >
            <IconDownload size={14} className="rotate-180" />
            Создать демо-данные
          </button>
          <p className="mt-3 text-center font-mono text-[10.5px] leading-relaxed text-dim">
            демо-аккаунт заполнится примерами счетов, актов и контрагентов
          </p>
        </div>
      </main>
    </div>
  );
}
