import Reveal from "./Reveal";

type Status = "yes" | "part" | "no";
type Row = { status: Status; name: string; note: string };

const ROWS: Row[] = [
  { status: "yes", name: "HTTPS", note: "Installability и service worker разблокированы автоматически — ничего настраивать не нужно." },
  { status: "yes", name: "Статический build", note: "Любой фронтенд, который отдаёт статику: React, Vue, Svelte, чистый HTML — Vite соберёт в dist/." },
  { status: "yes", name: "public/ → корень сайта", note: "Положил sw.js и manifest.webmanifest в public/ — они лежат в корне, как требует спецификация." },
  { status: "yes", name: "Offline через Cache API", note: "Стратегию кэширования приносишь свою — минимальная рабочая уже есть в шаблоне выше." },
  { status: "part", name: "iOS-нюансы", note: "apple-touch-icon и standalone-мета добавляются одной строкой в head — см. шаг 02." },
  { status: "part", name: "TWA → Google Play", note: "Если захочешь в стор: экспортируешь тот же build через Bubblewrap и подписываешь." },
  { status: "no", name: "Push-уведомления", note: "Нужен сервер с VAPID-ключами. За пределами статического хостинга — но сама PWA от этого не страдает." },
];

function StatusBadge({ s }: { s: Status }) {
  if (s === "yes")
    return (
      <span className="flex items-center gap-2 border border-teal/40 bg-teal/10 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-teal">
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
          <path d="M1 4 3.8 6.8 9 1" stroke="currentColor" strokeWidth="1.8" />
        </svg>
        работает
      </span>
    );
  if (s === "part")
    return (
      <span className="flex items-center gap-2 border border-amber/40 bg-amber/10 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-amber">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
          <circle cx="5" cy="5" r="4.2" stroke="currentColor" strokeWidth="1.4" />
          <path d="M5 0.8v8.4" stroke="currentColor" strokeWidth="1.4" />
          <path d="M5 5a4.2 4.2 0 0 1 0-8.4" fill="currentColor" opacity="0" />
          <path d="M5 0.8A4.2 4.2 0 0 1 5 9.2z" fill="currentColor" />
        </svg>
        частично
      </span>
    );
  return (
    <span className="flex items-center gap-2 border border-coral/40 bg-coral/10 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-coral">
      <svg width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden="true">
        <path d="M1 1l7 7m0-7-7 7" stroke="currentColor" strokeWidth="1.8" />
      </svg>
      вне статики
    </span>
  );
}

export default function EnvSpec() {
  return (
    <section id="env" className="relative scroll-mt-24 border-t border-line bg-bg2/40 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <Reveal>
              <p className="font-mono text-[12px] uppercase tracking-[0.22em] text-teal">06 — среда</p>
              <h2 className="mt-4 font-display text-3xl font-black leading-tight text-ink md:text-5xl">
                Паспорт <span className="text-teal">этого дока</span>
              </h2>
              <p className="mt-5 max-w-md text-[15.5px] leading-relaxed text-mut">
                Честно о том, что берёт на себя среда, а что придётся принести с собой. Коротко:
                всё, что нужно для install prompt, — уже здесь.
              </p>
              <div className="mt-8 inline-flex items-center gap-3 border border-line bg-panel px-4 py-3 font-mono text-[11.5px] text-mut">
                <svg width="15" height="17" viewBox="0 0 15 17" fill="none" aria-hidden="true">
                  <path d="M7.5 1 14 4.5v5c0 3.6-2.8 5.8-6.5 6.5C3.8 15.3 1 13.1 1 9.5v-5z" stroke="#3ed6c0" strokeWidth="1.4" />
                  <path d="M4.5 8.5 6.8 10.8 11 5.8" stroke="#ffb454" strokeWidth="1.6" />
                </svg>
                https · статика · корень public/ — базовый набор PWA закрыт
              </div>
            </Reveal>
          </div>

          <div className="flex flex-col gap-2.5">
            {ROWS.map((row, i) => (
              <Reveal key={row.name} delay={i * 55}>
                <div className="group grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 border border-line bg-panel/50 px-5 py-4 transition-all duration-300 hover:-translate-x-0 hover:border-line2 hover:bg-panel sm:grid-cols-[170px_110px_1fr]">
                  <p className="font-display text-[14px] font-bold text-ink transition-colors group-hover:text-teal sm:order-1">
                    {row.name}
                  </p>
                  <div className="row-start-2 sm:order-2 sm:row-start-1">
                    <StatusBadge s={row.status} />
                  </div>
                  <p className="col-span-2 text-[13.5px] leading-relaxed text-mut sm:order-3 sm:col-span-1">
                    {row.note}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
