import { useState } from "react";
import Reveal from "./Reveal";

const QA = [
  {
    q: "А если PWA собрана не на React и не на Vite?",
    a: "Вообще не важно. PWA — это не фреймворк, а контракт между сайтом и браузером: manifest, service worker, HTTPS. Next.js с export, Vue CLI, Astro, голый HTML с gulp — всё, что складывается в папку статики, сюда встанет.",
  },
  {
    q: "Другой ИИ отдал код без иконок. Что делать?",
    a: "Без иконок 192×192 и 512×512 установка не взлетит — это жёсткое требование Chromium. Скачай icon.svg из шаблона выше, прогони через любой конвертер в PNG двух размеров (плюс одна maskable-версия с отступами под безопасную зону Android) — и вопрос закрыт.",
  },
  {
    q: "Кнопка «Установить» появится сама?",
    a: "Да, когда сойдутся четыре условия: валидный manifest, живой service worker, HTTPS и хотя бы минимальная активность пользователя на странице. В Chrome/Edge и на Android — системный диалог, в Safari — пункт «На экран „Домой”» в меню «Поделиться».",
  },
  {
    q: "Как обновлять сервис-воркер, чтобы пользователи видели новую версию?",
    a: "Подними версию кэша: было CACHE = \"pwa-v1\" — стало \"pwa-v2\". При activate старый кэш удаляется (это уже есть в шаблоне), а skipWaiting() + clients.claim() не дают воркеру «зависнуть» в ожидании закрытых вкладок.",
  },
  {
    q: "Можно ли сюда проект с бэкендом?",
    a: "Саму PWA — да, фронтенд развернётся как есть. Но запросы к API пойдут на твой сервер, и его уже хостишь ты. Для чисто офлайн-приложений (заметки, калькуляторы, игры) бэкенд не нужен вовсе — и такие проекты здесь чувствуют себя идеально.",
  },
  {
    q: "Чем это лучше «просто открыть сайт»?",
    a: "Ярлык на главном экране, запуск в полноэкранном standalone-режиме без адресной строки, мгновенный старт из кэша и работа в метро без сети. Плюс Android умеет устанавливать такие приложения в обход сторов, а TWA-обёртка при желании выводит их в Google Play.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="relative scroll-mt-24 border-t border-line py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="font-mono text-[12px] uppercase tracking-[0.22em] text-teal">05 — faq</p>
              <h2 className="mt-4 font-display text-3xl font-black leading-tight text-ink md:text-5xl">
                Спрашивают <span className="text-amber">перед стыковкой</span>
              </h2>
            </div>
            <p className="max-w-xs pb-1 font-mono text-[11.5px] leading-relaxed text-dim">
              шесть вопросов, которые задают чаще всего, — от иконок до сторов
            </p>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <Reveal delay={80} className="hidden lg:block">
            <div className="sticky top-28 border border-line bg-panel/70 p-7">
              <svg width="52" height="52" viewBox="0 0 52 52" fill="none" aria-hidden="true">
                <rect x="2" y="2" width="48" height="48" rx="10" stroke="#28505e" strokeWidth="1.5" />
                <path d="M20 20.5c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5c0 4.5-6.5 5-6.5 9.5" stroke="#ffb454" strokeWidth="2.4" strokeLinecap="square" />
                <rect x="24" y="35" width="4.5" height="4.5" fill="#3ed6c0" />
              </svg>
              <p className="mt-6 font-display text-[17px] font-bold leading-snug text-ink">
                Не нашёл свой вопрос?
              </p>
              <p className="mt-3 text-[14px] leading-relaxed text-mut">
                Просто вставь сюда manifest из шага «02 — валидатор» и посмотри, что скажет
                среда. В 9 случаях из 10 весь ответ — в зелёных галочках.
              </p>
              <a
                href="#validator"
                className="mt-6 inline-flex items-center gap-2.5 font-mono text-[11.5px] uppercase tracking-[0.14em] text-teal transition-colors hover:text-amber"
              >
                к валидатору
                <svg width="13" height="10" viewBox="0 0 13 10" fill="none" aria-hidden="true">
                  <path d="M0 5h10m0 0L6.5 1.5M10 5 6.5 8.5" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </a>
            </div>
          </Reveal>

          <div>
            {QA.map((item, i) => {
              const isOpen = open === i;
              return (
                <Reveal key={i} delay={i * 50}>
                  <div
                    className={`border-b border-line transition-colors duration-300 ${isOpen ? "bg-panel/40" : "hover:bg-panel/25"}`}
                  >
                    <button
                      onClick={() => setOpen(isOpen ? null : i)}
                      aria-expanded={isOpen}
                      className="flex w-full cursor-pointer items-center gap-5 px-2 py-5 text-left sm:px-4"
                    >
                      <span className={`font-mono text-[12px] ${isOpen ? "text-amber" : "text-dim"}`}>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className={`flex-1 font-display text-[14.5px] font-bold leading-snug transition-colors sm:text-[16px] ${isOpen ? "text-amber" : "text-ink"}`}>
                        {item.q}
                      </span>
                      <span
                        className={`grid h-8 w-8 shrink-0 place-items-center border transition-all duration-300 ${
                          isOpen ? "rotate-45 border-amber/60 text-amber" : "border-line2 text-mut"
                        }`}
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                          <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.6" />
                        </svg>
                      </span>
                    </button>
                    <div className={`acc-body ${isOpen ? "open" : ""}`}>
                      <div className="acc-inner">
                        <p className="px-2 pb-6 pl-[52px] pr-10 text-[14.5px] leading-relaxed text-mut sm:px-4 sm:pl-[60px]">
                          {item.a}
                        </p>
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
