import { useState, type ReactNode } from "react";
import Reveal from "./Reveal";
import { copyText, downloadFile } from "../lib/utils";

const PROMPT_FOR_AI = `Собери мой проект как PWA. Отдай отдельными файлами:
1) manifest.webmanifest — name, short_name, start_url "/", display "standalone",
   theme_color, background_color, icons 192x192 и 512x512 (png) + maskable;
2) sw.js — кэш оболочки при install (cache-first), версия кэша в константе;
3) регистрацию service worker в точке входа;
4) <link rel="manifest"> и <meta name="theme-color"> в index.html;
5) исходники иконок. Без внешних CDN и без шага, требующего сервер.`;

const TPL_MANIFEST = `{
  "name": "Моя PWA",
  "short_name": "PWA",
  "description": "Развёрнуто через PWA Dock",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "background_color": "#0a1a20",
  "theme_color": "#0a1a20",
  "lang": "ru",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
    { "src": "/icons/icon-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}`;

const TPL_SW = `// sw.js — минимальный offline-кэш
const CACHE = "pwa-v1"; // поменяй версию при обновлении
const ASSETS = ["/", "/index.html", "/manifest.webmanifest"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then(
      (hit) =>
        hit ||
        fetch(e.request).then((res) => {
          const copy = res.clone();
          if (res.ok && new URL(e.request.url).origin === location.origin) {
            caches.open(CACHE).then((c) => c.put(e.request, copy));
          }
          return res;
        })
    )
  );
});`;

const TPL_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#0f2731"/>
  <path d="M280 64 128 288h96l-24 160 176-232h-100l4-152z" fill="#ffb454"/>
</svg>`;

function CodeBlock({ label, code }: { label: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    const ok = await copyText(code);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }
  };
  return (
    <div className="group/code relative mt-4">
      <div className="flex items-center justify-between border border-b-0 border-line bg-bg2 px-3.5 py-2">
        <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-dim">{label}</span>
        <button
          onClick={onCopy}
          className={`flex cursor-pointer items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.1em] transition-colors ${
            copied ? "text-teal" : "text-mut hover:text-amber"
          }`}
        >
          {copied ? (
            <>
              <svg width="11" height="9" viewBox="0 0 11 9" fill="none" aria-hidden="true">
                <path d="M1 4.5 4 7.5 10 1" stroke="currentColor" strokeWidth="1.8" />
              </svg>
              скопировано
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <rect x="3.5" y="3.5" width="7.5" height="7.5" stroke="currentColor" strokeWidth="1.2" />
                <path d="M8.5 3.5v-2.5h-7.5v7.5h2.5" stroke="currentColor" strokeWidth="1.2" />
              </svg>
              copy
            </>
          )}
        </button>
      </div>
      <pre className="code-surface overflow-x-auto p-4 text-mut">
        <code>{code}</code>
      </pre>
    </div>
  );
}

type Step = { n: string; title: string; desc: ReactNode; codeLabel: string; code: string };

const TREE = `my-pwa/
├─ public/
│  ├─ manifest.webmanifest
│  ├─ sw.js
│  └─ icons/
│     ├─ icon-192.png
│     ├─ icon-512.png
│     └─ icon-maskable.png
└─ index.html`;

const HTML_SNIPPET = `<link rel="manifest" href="/manifest.webmanifest" />
<meta name="theme-color" content="#0a1a20" />
<link rel="apple-touch-icon" href="/icons/icon-192.png" />`;

const REGISTER_SNIPPET = `// main.tsx / main.js — после рендера
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then(() => console.log("sw: на связи"))
      .catch((err) => console.error("sw: не взлетел", err));
  });
}`;

const BUILD_SNIPPET = `$ npm run build
✓ 42 модуля · dist/ готов

# что увидит пользователь:
#   Chrome/Edge/Android — кнопка «Установить»
#   iOS — «На экран „Домой"» в меню «Поделиться»`;

const STEPS: Step[] = [
  {
    n: "01",
    title: "Выгрузи файлы у того ИИ",
    desc: (
      <>
        Попроси исходники и проверь, что внутри есть <b className="text-ink">manifest</b>,{" "}
        <b className="text-ink">sw.js</b> и иконки. Каркас должен выглядеть примерно так:
      </>
    ),
    codeLabel: "структура проекта",
    code: TREE,
  },
  {
    n: "02",
    title: "Подключи manifest к странице",
    desc: (
      <>
        В <span className="font-mono text-[13px] text-amber">index.html</span> добавь ссылку на
        манифест, цвет панели и иконку для iOS. Три строки — и браузер понимает, что это приложение.
      </>
    ),
    codeLabel: "index.html → <head>",
    code: HTML_SNIPPET,
  },
  {
    n: "03",
    title: "Положи service worker в public/",
    desc: (
      <>
        Файл <span className="font-mono text-[13px] text-amber">sw.js</span> должен лежать в корне
        сайта — в Vite это папка <span className="font-mono text-[13px] text-teal">public/</span>.
        Ниже — рабочая стратегия cache-first, которую можно забрать прямо отсюда.
      </>
    ),
    codeLabel: "public/sw.js",
    code: TPL_SW,
  },
  {
    n: "04",
    title: "Зарегистрируй worker в точке входа",
    desc: (
      <>
        Service worker не оживает сам — его регистрирует страница. Вставь в{" "}
        <span className="font-mono text-[13px] text-amber">main.tsx</span> (или в{" "}
        <span className="font-mono text-[13px] text-amber">index.html</span> скриптом — неважно,
        где у тебя точка входа).
      </>
    ),
    codeLabel: "точка входа",
    code: REGISTER_SNIPPET,
  },
  {
    n: "05",
    title: "Собери — и лови install prompt",
    desc: (
      <>
        Одна команда собирает <span className="font-mono text-[13px] text-teal">dist/</span>, среда
        отдаёт его по HTTPS. Открой сайт в Chrome с телефона или десктопа — появится диалог
        установки, как в шапке этой страницы.
      </>
    ),
    codeLabel: "терминал",
    code: BUILD_SNIPPET,
  },
];

export default function Steps() {
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const copyPrompt = async () => {
    if (await copyText(PROMPT_FOR_AI)) {
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 1600);
    }
  };

  return (
    <section id="steps" className="relative scroll-mt-24 border-t border-line py-20 md:py-28">
      <div aria-hidden="true" className="ghost-word pointer-events-none absolute bottom-0 left-[-3%] font-display text-[20vw] font-black">
        DOCK
      </div>

      <div className="relative mx-auto grid max-w-6xl gap-12 px-5 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        {/* sticky column */}
        <div className="lg:sticky lg:top-28 lg:self-start">
          <Reveal>
            <p className="font-mono text-[12px] uppercase tracking-[0.22em] text-teal">03 — интеграция</p>
            <h2 className="mt-4 font-display text-3xl font-black leading-tight text-ink md:text-5xl">
              Перенос за <span className="text-amber">5 шагов</span>
            </h2>
            <p className="mt-5 max-w-md text-[15.5px] leading-relaxed text-mut">
              Не важно, где родился проект — в другом чате, в другой IDE. Дальше работает одна
              схема: файлы → public/ → build → install prompt.
            </p>
          </Reveal>

          <Reveal delay={100}>
            <div className="mt-8 border border-line bg-panel/70">
              <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
                <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-dim">
                  что попросить у того ИИ
                </span>
                <button
                  onClick={copyPrompt}
                  className={`cursor-pointer font-mono text-[10.5px] uppercase tracking-[0.1em] transition-colors ${
                    copiedPrompt ? "text-teal" : "text-amber hover:text-amber2"
                  }`}
                >
                  {copiedPrompt ? "✔ скопировано" : "⧉ скопировать"}
                </button>
              </div>
              <pre className="max-h-56 overflow-y-auto whitespace-pre-wrap p-4 font-mono text-[11.5px] leading-relaxed text-mut">
                {PROMPT_FOR_AI}
              </pre>
            </div>
          </Reveal>

          <Reveal delay={160}>
            <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.18em] text-dim">
              или забери готовый каркас:
            </p>
            <div className="mt-3.5 flex flex-wrap gap-2.5">
              {[
                { name: "manifest.webmanifest", content: TPL_MANIFEST, mime: "application/manifest+json" },
                { name: "sw.js", content: TPL_SW, mime: "text/javascript" },
                { name: "icon.svg", content: TPL_ICON, mime: "image/svg+xml" },
              ].map((f) => (
                <button
                  key={f.name}
                  onClick={() => downloadFile(f.name, f.content, f.mime)}
                  className="group/dl flex cursor-pointer items-center gap-2.5 border border-line bg-bg2 px-4 py-2.5 font-mono text-[11.5px] text-mut transition-all duration-200 hover:-translate-y-0.5 hover:border-teal2 hover:text-teal"
                >
                  <svg width="12" height="13" viewBox="0 0 12 13" fill="none" className="transition-transform duration-300 group-hover/dl:translate-y-0.5" aria-hidden="true">
                    <path d="M6 1v7.5m0 0L2.8 5.5M6 8.5 9.2 5.5M1.5 11.5h9" stroke="currentColor" strokeWidth="1.4" />
                  </svg>
                  {f.name}
                </button>
              ))}
            </div>
          </Reveal>
        </div>

        {/* steps */}
        <div className="relative">
          <svg className="absolute left-[27px] top-4 hidden h-[calc(100%-40px)] w-px md:block" aria-hidden="true">
            <line x1="0.5" y1="0" x2="0.5" y2="100%" stroke="#28505e" strokeWidth="1" className="dash-flow" />
          </svg>

          <div className="flex flex-col gap-5">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 60}>
                <article className="group relative border border-line bg-panel/60 p-6 transition-all duration-300 hover:border-line2 hover:bg-panel md:pl-20">
                  <div className="mb-3 flex h-11 w-11 items-center justify-center border border-line2 bg-bg font-display text-[13px] font-bold text-amber transition-colors duration-300 group-hover:border-amber/60 md:absolute md:left-6 md:top-6 md:mb-0">
                    {s.n}
                  </div>
                  <h3 className="font-display text-[17px] font-bold text-ink md:mt-4">
                    <span className="mr-2 text-teal md:hidden">{s.n}</span>
                    {s.title}
                  </h3>
                  <p className="mt-2.5 text-[14px] leading-relaxed text-mut">{s.desc}</p>
                  <CodeBlock label={s.codeLabel} code={s.code} />
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
