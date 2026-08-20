import { useState } from "react";
import Reveal from "./Reveal";
import { copyText } from "../lib/utils";

const ICON_PNG_URL =
  "https://image.qwenlm.ai/generated-images/c2533eba-1652-4065-adf8-6d600161e1df/_result.png";

const MANIFEST_FINAL = `{
  "name": "ИП Документооборот",
  "short_name": "ИП Документы",
  "description": "Система управления документами для ИП",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "any",
  "background_color": "#ffffff",
  "theme_color": "#1E88E5",
  "lang": "ru",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
    { "src": "/icon-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}`;

type Row = {
  no: string;
  file: string;
  dest: string;
  status: "ready" | "out";
  action:
    | { kind: "copy"; label: string; payload: string }
    | { kind: "link"; label: string; href: string }
    | { kind: "save"; label: string; href: string }
    | null;
};

const WAYBILL: Row[] = [
  { no: "01", file: "manifest.json", dest: "public/manifest.json", status: "ready", action: { kind: "copy", label: "копировать", payload: MANIFEST_FINAL } },
  { no: "02", file: "sw.js (патч)", dest: "public/sw.js", status: "ready", action: { kind: "link", label: "к патчу ↓", href: "#sw" } },
  { no: "03", file: "sw-register.tsx", dest: "app/sw-register.tsx", status: "ready", action: { kind: "link", label: "к коду ↓", href: "#sw" } },
  { no: "04", file: "icon-maskable.png", dest: "public/icon-maskable.png", status: "ready", action: { kind: "save", label: "скачать", href: ICON_PNG_URL } },
  { no: "05", file: "icon-maskable.svg", dest: "public/icon-maskable.svg", status: "ready", action: { kind: "save", label: "скачать", href: "/icon-maskable.svg" } },
  { no: "06", file: "Next.js · Prisma · SQLite · Python", dest: "VPS + Caddy + Bun", status: "out", action: null },
];

const LAST_STEPS = [
  {
    t: "Положи файлы",
    d: "icon-maskable.png и icon-maskable.svg — в public/, содержимое manifest.json — подмени в существующем public/manifest.json.",
  },
  {
    t: "Подключи регистрацию",
    d: "Проверь <link rel=\"manifest\"> в layout и добавь sw-register.tsx из секции 04 — без него sw.js лежит мёртвым грузом.",
  },
  {
    t: "Задеплой и установи",
    d: "git push → сервер поднимет Caddy с HTTPS → открой сайт на Android/Chrome → появится «Установить приложение».",
  },
];

export default function FinalDock() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const doAction = async (row: Row) => {
    const a = row.action;
    if (!a || a.kind !== "copy") return;
    if (await copyText(a.payload)) {
      setCopiedKey(row.no);
      setTimeout(() => setCopiedKey(null), 1600);
    }
  };

  return (
    <section id="final" className="relative scroll-mt-24 border-t border-line bg-bg2/40 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="font-mono text-[12px] uppercase tracking-[0.22em] text-teal">08 — накладная</p>
              <h2 className="mt-4 max-w-2xl font-display text-3xl font-black leading-tight text-ink md:text-5xl">
                Слой собран. <span className="text-amber">Без logo.svg</span> — нарисовал сам
              </h2>
            </div>
            <div className="hidden -rotate-6 border-[3px] border-double border-teal px-5 py-2.5 text-center md:block">
              <p className="font-display text-[15px] font-black uppercase tracking-[0.22em] text-teal">принято</p>
              <p className="mt-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-dim">pwa-dock · на борт · 2026</p>
            </div>
          </div>
          <p className="mt-5 max-w-2xl text-[15.5px] leading-relaxed text-mut">
            Maskable-иконка — под ваш <span className="font-mono text-[13.5px] text-amber">#1E88E5</span>: документ
            с печатью, вписанный в безопасную зону. PNG сгенерирован, SVG-исходник нарисован вручную — оба файла
            ниже. Полный груз PWA-слоя для «ИП Документооборот» — в накладной.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          {/* иконка: превью с safe-zone + круглая маска */}
          <Reveal delay={80}>
            <div className="border border-line bg-panel/60 p-6 md:p-8">
              <div className="flex items-center justify-between">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-mut">icon-maskable · 512×512</p>
                <span className="border border-amber/50 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.1em] text-amber">
                  purpose: maskable
                </span>
              </div>

              <div className="mt-6 flex items-end justify-center gap-8">
                <div className="group w-[54%] max-w-[240px]">
                  <div className="relative overflow-hidden border border-line2">
                    <img
                      src={ICON_PNG_URL}
                      alt="Сгенерированная maskable-иконка: документ с печатью на синем фоне"
                      className="block h-auto w-full"
                      width={512}
                      height={512}
                    />
                    {/* safe zone 80% */}
                    <svg
                      className="absolute inset-0 h-full w-full opacity-60 transition-opacity duration-300 group-hover:opacity-100"
                      viewBox="0 0 100 100"
                      aria-hidden="true"
                    >
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#3ed6c0" strokeWidth="0.5" strokeDasharray="2.5 2.5" />
                    </svg>
                  </div>
                  <p className="mt-2.5 text-center font-mono text-[10px] uppercase tracking-[0.12em] text-dim">
                    как есть · пунктир — safe zone
                  </p>
                </div>

                <div className="w-[34%] max-w-[150px]">
                  <div className="overflow-hidden rounded-full border border-line2 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.6)]">
                    <img src={ICON_PNG_URL} alt="" className="block h-auto w-full" width={512} height={512} />
                  </div>
                  <p className="mt-2.5 text-center font-mono text-[10px] uppercase tracking-[0.12em] text-dim">
                    как обрежет android
                  </p>
                </div>
              </div>

              <div className="mt-7 grid grid-cols-2 gap-3">
                <a
                  href={ICON_PNG_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center justify-center gap-2.5 bg-amber px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-bg transition-all duration-200 hover:bg-amber2 hover:shadow-[0_0_26px_rgba(255,180,84,0.35)]"
                >
                  <svg width="12" height="13" viewBox="0 0 12 13" fill="none" aria-hidden="true">
                    <path d="M6 1v8m0 0L3 6.2M6 9l3-2.8M1.5 11.5h9" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                  png 512×512
                </a>
                <a
                  href="/icon-maskable.svg"
                  download
                  className="flex items-center justify-center gap-2.5 border border-line2 px-4 py-3 font-mono text-[11px] uppercase tracking-[0.12em] text-mut transition-colors hover:border-teal hover:text-teal"
                >
                  <svg width="12" height="13" viewBox="0 0 12 13" fill="none" aria-hidden="true">
                    <path d="M6 1v8m0 0L3 6.2M6 9l3-2.8M1.5 11.5h9" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                  svg-исходник
                </a>
              </div>
              <p className="mt-4 font-mono text-[10.5px] leading-relaxed text-dim">
                svg можно править текстом и перегонять в png любого размера — знак останется crisp
              </p>
            </div>
          </Reveal>

          {/* накладная */}
          <Reveal delay={140}>
            <div className="flex h-full flex-col border border-line bg-[#08161c]">
              <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
                <p className="font-mono text-[11.5px] uppercase tracking-[0.16em] text-mut">груз · pwa-слой</p>
                <p className="font-mono text-[11px] text-dim">5 на борт · 1 за бортом</p>
              </div>

              <div className="flex-1">
                {WAYBILL.map((row) => (
                  <div
                    key={row.no}
                    className={`group flex items-center gap-4 border-b border-line/60 px-5 py-4 transition-colors last:border-0 ${
                      row.status === "out" ? "opacity-70" : "hover:bg-panel/40"
                    }`}
                  >
                    <span className={`font-mono text-[11px] ${row.status === "out" ? "text-coral" : "text-dim"}`}>{row.no}</span>
                    <div className="min-w-0 flex-1">
                      <p className={`truncate font-mono text-[13px] ${row.status === "out" ? "text-mut line-through decoration-coral/60" : "text-ink"}`}>
                        {row.file}
                      </p>
                      <p className="mt-0.5 truncate font-mono text-[10.5px] text-dim">→ {row.dest}</p>
                    </div>

                    {row.status === "ready" ? (
                      <span className="flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.08em] text-teal">
                        <svg width="11" height="9" viewBox="0 0 11 9" fill="none" aria-hidden="true">
                          <path d="M1 4.5 4 7.5 10 1" stroke="#3ed6c0" strokeWidth="1.8" />
                        </svg>
                        готов
                      </span>
                    ) : (
                      <span className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-coral">на vps</span>
                    )}

                    {row.action && row.action.kind === "copy" && (
                      <button
                        onClick={() => void doAction(row)}
                        className="cursor-pointer border border-amber/50 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-amber transition-all hover:bg-amber/10 hover:shadow-[0_0_16px_rgba(255,180,84,0.25)]"
                      >
                        {copiedKey === row.no ? "✓ скопировано" : row.action.label}
                      </button>
                    )}
                    {row.action && row.action.kind === "link" && (
                      <a
                        href={row.action.href}
                        className="border border-line2 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-mut transition-colors hover:border-teal hover:text-teal"
                      >
                        {row.action.label}
                      </a>
                    )}
                    {row.action && row.action.kind === "save" && (
                      <a
                        href={row.action.href}
                        {...(row.action.href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : { download: "" })}
                        className="border border-line2 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-mut transition-colors hover:border-teal hover:text-teal"
                      >
                        {row.action.label}
                      </a>
                    )}
                  </div>
                ))}
              </div>

              <div className="border-t border-line bg-panel/40 px-5 py-4">
                <p className="font-mono text-[10.5px] leading-relaxed text-dim">
                  строка 06 — не ошибка: серверная часть остаётся там, где и работала. На борт берётся
                  только то, что делает приложение <span className="text-teal">устанавливаемым</span>.
                </p>
              </div>
            </div>
          </Reveal>
        </div>

        {/* последние действия */}
        <Reveal delay={100} className="mt-10">
          <div className="grid gap-px border border-line bg-line md:grid-cols-[auto_1fr_1fr_1fr]">
            <div className="bg-panel/70 px-6 py-6 md:py-7">
              <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-dim">финал</p>
              <p className="mt-2 font-display text-[17px] font-black leading-snug text-ink">
                три действия
                <br />
                <span className="text-teal">на твоей стороне</span>
              </p>
            </div>
            {LAST_STEPS.map((s, i) => (
              <div key={i} className="group bg-bg2/70 px-6 py-6 transition-colors duration-300 hover:bg-panel md:py-7">
                <div className="flex items-center gap-3">
                  <span className="grid h-8 w-8 place-items-center border border-teal/50 font-display text-[13px] font-black text-teal transition-all duration-300 group-hover:bg-teal group-hover:text-bg">
                    {i + 1}
                  </span>
                  <p className="font-display text-[14px] font-bold text-ink">{s.t}</p>
                </div>
                <p className="mt-3.5 text-[13px] leading-relaxed text-mut">{s.d}</p>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={160} className="mt-10">
          <div className="flex flex-col items-center gap-4 border border-dashed border-line2 px-6 py-7 text-center md:flex-row md:justify-between md:text-left">
            <p className="max-w-xl font-mono text-[12px] leading-relaxed text-mut">
              <span className="text-amber">$</span> итог: manifest ✓ · sw.js ✓ (с патчем) · иконки ✓ · регистрация ✓ —{" "}
              <span className="text-teal">критерии установимости закрыты на 100%</span>. Сам документооборот живёт на
              твоём VPS, а ярлык — на главном экране.
            </p>
            <a
              href="#top"
              className="shrink-0 border border-line2 px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.12em] text-mut transition-colors hover:border-amber hover:text-amber"
            >
              наверх ↑
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
