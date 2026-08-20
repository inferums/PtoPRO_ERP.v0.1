import { useEffect, useState } from "react";
import Reveal from "./Reveal";

type Item = { id: string; title: string; desc: string };

const ITEMS: Item[] = [
  {
    id: "manifest",
    title: "manifest.webmanifest подключён",
    desc: "Файл лежит в public/ и связан с страницей через <link rel=\"manifest\">.",
  },
  {
    id: "sw",
    title: "Service worker зарегистрирован",
    desc: "sw.js кэширует оболочку и отдаёт её offline — сердце любой PWA.",
  },
  {
    id: "icons",
    title: "Иконки 192×192 и 512×512",
    desc: "PNG-иконки в manifest + отдельная maskable-версия для Android.",
  },
  {
    id: "https",
    title: "HTTPS-хостинг",
    desc: "Без https install prompt не появится. В этой среде — автоматически.",
  },
  {
    id: "meta",
    title: "meta theme-color и apple-touch-icon",
    desc: "Цвет верхней панели браузера и иконка для домашнего экрана iOS.",
  },
  {
    id: "build",
    title: "Сборка проходит без ошибок",
    desc: "npm run build отдаёт чистый dist/ — значит док примет проект.",
  },
];

const LS_KEY = "pwa-dock-checklist";

function readStored(): string[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

const R = 74;
const C = 2 * Math.PI * R;

export default function Checklist() {
  const [checked, setChecked] = useState<string[]>(readStored);

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(checked));
    } catch {
      /* приватный режим — просто не сохраняем */
    }
  }, [checked]);

  const done = checked.length;
  const p = done / ITEMS.length;
  const complete = done === ITEMS.length;

  const toggle = (id: string) =>
    setChecked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const status =
    done === 0
      ? { text: "Пока ноль — начни с manifest", color: "text-dim", ring: "var(--color-line2)" }
      : complete
        ? { text: "Готово к установке", color: "text-teal", ring: "var(--color-teal)" }
        : { text: `В процессе: ${done} из ${ITEMS.length}`, color: "text-amber", ring: "var(--color-amber)" };

  return (
    <section id="checklist" className="relative scroll-mt-24 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal>
          <p className="font-mono text-[12px] uppercase tracking-[0.22em] text-teal">02 — чек-лист</p>
          <h2 className="mt-4 max-w-2xl font-display text-3xl font-900 leading-tight text-ink md:text-5xl">
            Шесть пунктов <span className="text-amber">до кнопки</span> «Установить»
          </h2>
          <p className="mt-5 max-w-xl text-[15.5px] leading-relaxed text-mut">
            Chromium показывает install prompt только когда всё сходится. Отмечай, что уже есть в
            проекте от другого ИИ, — прогресс сохранится в браузере.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-10 lg:grid-cols-[340px_1fr] lg:gap-14">
          <Reveal className="lg:sticky lg:top-28 lg:self-start">
            <div className="relative border border-line bg-panel/70 p-8">
              <div className="relative mx-auto h-[176px] w-[176px]">
                <svg viewBox="0 0 176 176" className="h-full w-full -rotate-90">
                  <circle cx="88" cy="88" r={R} fill="none" stroke="var(--color-line)" strokeWidth="9" />
                  <circle
                    cx="88"
                    cy="88"
                    r={R}
                    fill="none"
                    stroke={status.ring}
                    strokeWidth="9"
                    strokeLinecap="butt"
                    strokeDasharray={C}
                    strokeDashoffset={C * (1 - p)}
                    style={{ transition: "stroke-dashoffset 0.7s cubic-bezier(0.22,1,0.36,1), stroke 0.4s" }}
                  />
                </svg>
                <div className="absolute inset-0 grid place-items-center">
                  <div className="text-center">
                    <p className="font-display text-4xl font-900 text-ink">
                      {done}
                      <span className="text-xl text-dim">/{ITEMS.length}</span>
                    </p>
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-dim">install-ready</p>
                  </div>
                </div>
              </div>

              <p className={`mt-6 text-center font-display text-[15px] font-700 ${status.color} transition-colors`}>
                {status.text}
              </p>

              {complete && (
                <div className="pop-in mt-5 border border-teal/40 bg-teal/10 px-4 py-3 text-center font-mono text-[11.5px] leading-relaxed text-teal">
                  ✔ всё сходится — запускай сборку,
                  <br />
                  диалог установки появится сам
                </div>
              )}

              <p className="mt-6 border-t border-line pt-5 font-mono text-[11px] leading-relaxed text-dim">
                * критерий — реальный аудит Lighthouse «PWA», а не галочка для красоты
              </p>
            </div>
          </Reveal>

          <div className="grid gap-3.5 sm:grid-cols-2">
            {ITEMS.map((it, i) => {
              const on = checked.includes(it.id);
              return (
                <Reveal key={it.id} delay={i * 70}>
                  <button
                    onClick={() => toggle(it.id)}
                    aria-pressed={on}
                    className={`group flex h-full w-full cursor-pointer flex-col border p-5 text-left transition-all duration-300 ${
                      on
                        ? "border-teal/50 bg-teal/[0.07]"
                        : "border-line bg-panel/50 hover:-translate-y-1 hover:border-line2 hover:bg-panel"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-mono text-[11px] tracking-[0.14em] ${on ? "text-teal" : "text-dim"}`}>
                        0{i + 1}
                      </span>
                      <span
                        className={`grid h-5 w-5 place-items-center border transition-all duration-300 ${
                          on ? "border-teal bg-teal" : "border-line2 group-hover:border-mut"
                        }`}
                      >
                        {on && (
                          <svg width="11" height="9" viewBox="0 0 11 9" fill="none" aria-hidden="true">
                            <path d="M1 4.5 4 7.5 10 1" stroke="#0a1a20" strokeWidth="2" strokeLinecap="square" />
                          </svg>
                        )}
                      </span>
                    </div>
                    <p className={`mt-4 font-display text-[14.5px] font-700 leading-snug transition-colors ${on ? "text-teal" : "text-ink"}`}>
                      {it.title}
                    </p>
                    <p className="mt-2 text-[13px] leading-relaxed text-mut">{it.desc}</p>
                  </button>
                </Reveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
