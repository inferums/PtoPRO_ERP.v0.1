import { useState } from "react";
import Reveal from "./Reveal";
import { copyText, downloadFile } from "../lib/utils";

const LANES = [
  {
    pattern: "/_next/static/**",
    strat: "cache-first",
    tone: "teal" as const,
    note: "чанк уже в кэше → отдаётся мгновенно; нет → забирается и кладётся навсегда (хэш контента не меняется)",
  },
  {
    pattern: "страницы · manifest · public/",
    strat: "network-first",
    tone: "amber" as const,
    note: "свежий HTML при каждом заходе; при офлайне — страница из кэша, затем корень «/»",
  },
  {
    pattern: "/api/**",
    strat: "network-only",
    tone: "coral" as const,
    note: "запросы к Prisma/SQLite не кэшируются никогда; офлайн → 503 с JSON, который SPA умеет обработать",
  },
];

const TONE = {
  teal: { chip: "border-teal/60 text-teal", arrow: "#3ed6c0" },
  amber: { chip: "border-amber/60 text-amber", arrow: "#ffb454" },
  coral: { chip: "border-coral/60 text-coral", arrow: "#ff7a6b" },
};

const FINDINGS: { tone: "ok" | "warn"; title: string; body: string }[] = [
  {
    tone: "ok",
    title: "API никогда не кэшируется",
    body: "Network-only для /api/ плюс 503-JSON при офлайне — фронтенд получает обрабатываемую ошибку, а не мёртвые данные из кэша.",
  },
  {
    tone: "ok",
    title: "Хэшированные чанки — cache-first",
    body: "/_next/static/* иммутабелен по контент-хэшу, поэтому кэшировать его «навсегда» — единственно верная стратегия.",
  },
  {
    tone: "ok",
    title: "Страницы — network-first",
    body: "HTML всегда свежий, а кэш работает как офлайн-фолбэк. Для документооборота, где данные меняются, это правильно.",
  },
  {
    tone: "ok",
    title: "Мгновенный перехват версий",
    body: "skipWaiting() + clients.claim() — новый воркер вступает в права сразу, без «перезапустите вкладку».",
  },
  {
    tone: "warn",
    title: "Прекэша нет вообще",
    body: "install ничего не кладёт в кэш: сразу после установки приложение не откроется офлайн, пока пользователь не зайдёт хотя бы раз. Лечится cache.addAll(['/']).",
  },
  {
    tone: "warn",
    title: "Мёртвый код: IS_HTML и IS_PAGE",
    body: "Объявлены, но не используются ни в одной ветке. Причём IS_HTML = /\\.(?:html)?$/i матчит вообще любую строку — хорошо, что до дела не дошло.",
  },
  {
    tone: "warn",
    title: "Кэш растёт без ограничений",
    body: "Каждая посещённая страница ложится в кэш навсегда. Для системы документов это сотни страниц за месяцы — нужен prune до ~60 записей.",
  },
  {
    tone: "warn",
    title: "Дыра в офлайн-фолбэке",
    body: "Если «/» в кэше нет, caches.match('/') вернёт undefined — и respondWith бросит TypeError прямо в консоль. Нужен финальный Response, а не пустота.",
  },
];

const PATCHED = `// public/sw.js — пропатчен PWA Dock'ом
// CACHE_NAME с меткой времени оставлен как есть:
// его, судя по всему, генерирует scripts/build.js при каждой сборке.

const CACHE_NAME = 'ptopro-v1787122030683';
const SHELL = ['/']; // ядро для офлайна с первого запуска (можно добавить '/offline.html')
const MAX_PAGES = 60;

const IS_HASHED_CHUNK = /\\/_next\\/static\\/(chunks|css|media)\\//;

self.addEventListener('install', (event) => {
  self.skipWaiting();
  // FIX 1: прекэш — офлайн работает сразу после установки
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      // FIX 2: удаляем только чужие кэши — свой беречь
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// FIX 3: не даём кэшу страниц распухнуть до сотен записей
async function prunePages(cache) {
  const keys = await cache.keys();
  const pages = keys.filter((req) => req.mode === 'navigate');
  for (const req of pages.slice(0, pages.length - MAX_PAGES)) await cache.delete(req);
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return; // чужие домены — мимо кэша

  // API: network-only, офлайн -> 503 JSON (без изменений, было правильно)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request).catch(
        () =>
          new Response(JSON.stringify({ error: 'Нет подключения к серверу' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          })
      )
    );
    return;
  }

  // Хэшированные чанки: cache-first (без изменений)
  if (IS_HASHED_CHUNK.test(url.pathname)) {
    event.respondWith(
      caches.match(event.request).then(
        (cached) =>
          cached ||
          fetch(event.request).then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
            }
            return response;
          })
      )
    );
    return;
  }

  // Всё остальное: network-first с кэшем и честным финальным фолбэком
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(async (cache) => {
            await cache.put(event.request, clone);
            if (event.request.mode === 'navigate') await prunePages(cache);
          });
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        if (event.request.mode === 'navigate') {
          // FIX 4: '/' теперь точно в кэше благодаря прекэшу,
          // а undefined из respondWith больше не улетит
          const shell = await caches.match('/');
          if (shell) return shell;
        }
        return new Response('Офлайн', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      })
  );
});`;

const REGISTER = `// app/sw-register.tsx — добавить в корневой layout: <SWRegister />
'use client';
import { useEffect } from 'react';

export default function SWRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch(console.error);
    }
  }, []);
  return null;
}`;

function CodeBlock({
  file,
  code,
  badge,
  onDownload,
}: {
  file: string;
  code: string;
  badge?: string;
  onDownload?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const doCopy = async () => {
    if (await copyText(code)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  return (
    <div className="code-surface overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-2.5">
        <div className="flex items-center gap-3">
          <span className="flex gap-1.5">
            <span className="h-2 w-2 rounded-full bg-coral/70" />
            <span className="h-2 w-2 rounded-full bg-amber/70" />
            <span className="h-2 w-2 rounded-full bg-teal/70" />
          </span>
          <span className="font-mono text-[11.5px] text-mut">{file}</span>
          {badge && (
            <span className="border border-teal/50 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.1em] text-teal">
              {badge}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={doCopy}
            className="cursor-pointer border border-line px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.1em] text-mut transition-colors hover:border-teal2 hover:text-teal"
          >
            {copied ? "✓ скопировано" : "скопировать"}
          </button>
          {onDownload && (
            <button
              onClick={onDownload}
              className="cursor-pointer border border-amber/50 px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.1em] text-amber transition-all hover:bg-amber/10 hover:shadow-[0_0_16px_rgba(255,180,84,0.25)]"
            >
              ↓ скачать
            </button>
          )}
        </div>
      </div>
      <pre className="max-h-[430px] overflow-auto p-5">
        {code.split("\n").map((line, i) => (
          <div key={i} className={/^\s*\/\//.test(line) ? "text-dim" : line.includes("FIX") ? "text-teal" : "text-ink/85"}>
            {line || " "}
          </div>
        ))}
      </pre>
    </div>
  );
}

export default function SWAudit() {
  const okCount = FINDINGS.filter((f) => f.tone === "ok").length;
  const warnCount = FINDINGS.length - okCount;

  return (
    <section id="sw" className="relative scroll-mt-24 border-t border-line py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="font-mono text-[12px] uppercase tracking-[0.22em] text-teal">04 — service worker</p>
              <h2 className="mt-4 max-w-2xl font-display text-3xl font-900 leading-tight text-ink md:text-5xl">
                Ваш sw.js <span className="text-teal">под микроскопом</span>
              </h2>
              <p className="mt-5 max-w-xl text-[15.5px] leading-relaxed text-mut">
                Маршрутизация в нём выстроена грамотно — три ветки, три стратегии, всё по учебнику
                для Next.js. Но исполнение оставило <span className="text-amber">{warnCount} находки</span>,
                которые чинятся одним патчем.
              </p>
            </div>
            <div className="flex items-center gap-3 border border-line bg-panel/70 px-4 py-3">
              <span className="pulse-dot h-2 w-2 rounded-full bg-teal" />
              <p className="font-mono text-[11.5px] leading-relaxed text-mut">
                стратегия <span className="text-teal">верная</span>
                <br />
                исполнение <span className="text-amber">{okCount}/{FINDINGS.length}</span>
              </p>
            </div>
          </div>
        </Reveal>

        {/* маршрутизация */}
        <Reveal delay={100} className="mt-12">
          <div className="border border-line bg-panel/50 p-6 md:p-8">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-dim">
              как воркер рулит запросами
            </p>
            <div className="mt-6 flex flex-col gap-4">
              {LANES.map((lane) => (
                <div
                  key={lane.strat}
                  className="group grid items-center gap-3 border border-line/70 bg-bg2/60 p-4 transition-all duration-300 hover:border-line2 hover:bg-bg2 md:grid-cols-[240px_64px_170px_1fr] md:gap-5 md:p-5"
                >
                  <span className="truncate border border-line2 bg-[#08161c] px-3 py-2 font-mono text-[12px] text-ink" title={lane.pattern}>
                    {lane.pattern}
                  </span>
                  <svg className="hidden rotate-0 md:block" width="64" height="14" viewBox="0 0 64 14" fill="none" aria-hidden="true">
                    <path className="dash-flow" d="M0 7h54" stroke={TONE[lane.tone].arrow} strokeWidth="1.6" />
                    <path d="M52 2.5 60 7l-8 4.5" fill="none" stroke={TONE[lane.tone].arrow} strokeWidth="1.6" />
                  </svg>
                  <span className={`w-fit border px-3 py-2 font-mono text-[11px] font-700 uppercase tracking-[0.12em] ${TONE[lane.tone].chip}`}>
                    {lane.strat}
                  </span>
                  <p className="text-[13.5px] leading-relaxed text-mut">{lane.note}</p>
                </div>
              ))}
            </div>
            <p className="mt-5 font-mono text-[11px] leading-relaxed text-dim">
              * порядок веток в коде важен: /api/ → чанки → всё остальное. Здесь он соблюдён.
            </p>
          </div>
        </Reveal>

        {/* находки */}
        <div className="mt-10 grid gap-3.5 sm:grid-cols-2">
          {FINDINGS.map((f, i) => (
            <Reveal key={i} delay={i * 60}>
              <div
                className={`group h-full border-l-2 bg-panel/50 p-5 transition-all duration-300 hover:-translate-y-1 hover:bg-panel ${
                  f.tone === "ok" ? "border-l-teal hover:shadow-[0_14px_36px_-16px_rgba(62,214,192,0.25)]" : "border-l-amber hover:shadow-[0_14px_36px_-16px_rgba(255,180,84,0.25)]"
                }`}
              >
                <div className="flex items-center gap-3">
                  {f.tone === "ok" ? (
                    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                      <circle cx="8" cy="8" r="7" stroke="#3ed6c0" strokeWidth="1.4" fill="none" />
                      <path d="M4.7 8.2 7.2 10.6 11.4 5.6" stroke="#3ed6c0" strokeWidth="1.7" fill="none" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                      <path d="M8 1.6 15.2 14H0.8z" stroke="#ffb454" strokeWidth="1.4" fill="none" />
                      <path d="M8 6v3.4" stroke="#ffb454" strokeWidth="1.7" />
                      <circle cx="8" cy="11.7" r="0.95" fill="#ffb454" />
                    </svg>
                  )}
                  <span className="font-mono text-[11px] tracking-[0.14em] text-dim">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className={`font-display text-[14.5px] font-700 leading-snug ${f.tone === "ok" ? "text-teal" : "text-amber"}`}>
                    {f.title}
                  </h3>
                </div>
                <p className="mt-3 text-[13.5px] leading-relaxed text-mut">{f.body}</p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* патч */}
        <Reveal delay={120} className="mt-14">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h3 className="font-display text-2xl font-900 text-ink md:text-3xl">
                Патч — <span className="text-amber">4 фикса</span>, одна замена файла
              </h3>
              <p className="mt-3 max-w-xl text-[14.5px] leading-relaxed text-mut">
                Всё, что было правильно, не тронуто. Меняется только install, activate и хвост
                офлайн-фолбэка.
              </p>
            </div>
            <p className="max-w-xs pb-1 font-mono text-[10.5px] leading-relaxed text-dim">
              метка времени в CACHE_NAME сохранена — конвейер scripts/build.js не ломается
            </p>
          </div>
          <div className="mt-6">
            <CodeBlock
              file="public/sw.js"
              badge="патч дока"
              code={PATCHED}
              onDownload={() => downloadFile("sw.js", PATCHED, "application/javascript")}
            />
          </div>
        </Reveal>

        {/* регистрация */}
        <Reveal delay={140} className="mt-8">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <CodeBlock file="app/sw-register.tsx" badge="next.js" code={REGISTER} />
            <div className="flex flex-col gap-4">
              <div className="border border-line bg-panel/60 p-6">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-amber">не забудьте</p>
                <ul className="mt-4 flex flex-col gap-3.5">
                  {[
                    "Next.js сам воркер не регистрирует — без этого компонента sw.js лежит мёртвым грузом в public/",
                    "register() только в production: в dev воркер перехватит запросы и сломает hot reload",
                    "опционально — public/offline.html в массив SHELL: красивая заглушка вместо «Офлайн»",
                  ].map((t, i) => (
                    <li key={i} className="flex items-start gap-3 text-[13.5px] leading-relaxed text-mut">
                      <span className="mt-[7px] h-1.5 w-1.5 shrink-0 bg-amber" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="border border-teal/40 bg-teal/[0.07] p-6">
                <p className="font-display text-[14px] font-700 text-teal">После деплоя</p>
                <p className="mt-2.5 text-[13.5px] leading-relaxed text-mut">
                  Откройте DevTools → Application → Service Workers: статус{" "}
                  <span className="font-mono text-[12px] text-ink">activated and running</span>. Затем
                  выключите сеть и перезагрузите страницу — документ должен открыться из кэша.
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
