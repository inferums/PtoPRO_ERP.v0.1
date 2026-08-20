import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "../lib/utils";

const SCRAMBLE_CHARS = "█▓▒░<>/{}[]=+*#%@10";

function useScramble(text: string, startDelay = 0) {
  const [out, setOut] = useState(() => (prefersReducedMotion() ? text : ""));

  useEffect(() => {
    if (prefersReducedMotion()) {
      setOut(text);
      return;
    }
    let interval: ReturnType<typeof setInterval> | undefined;
    const totalFrames = Math.max(24, Math.round(text.length * 1.9));
    let frame = 0;
    const timeout = setTimeout(() => {
      interval = setInterval(() => {
        frame++;
        const p = frame / totalFrames;
        const settled = Math.floor(p * text.length * 1.15);
        let s = "";
        for (let i = 0; i < text.length; i++) {
          const ch = text[i];
          if (ch === " " || i < settled) s += ch;
          else s += SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
        }
        setOut(s);
        if (p >= 1) {
          setOut(text);
          if (interval) clearInterval(interval);
        }
      }, 30);
    }, startDelay);
    return () => {
      clearTimeout(timeout);
      if (interval) clearInterval(interval);
    };
  }, [text, startDelay]);

  return out;
}

const TERMINAL_LINES: { text: string; tone: "cmd" | "dim" | "ok" | "amber" }[] = [
  { text: "$ pwa-dock deploy ./my-app", tone: "cmd" },
  { text: "▸ manifest.webmanifest ...... найден", tone: "dim" },
  { text: "▸ /sw.js ..................... зарегистрирован", tone: "dim" },
  { text: "▸ кэш: 14 ресурсов · cache-first", tone: "dim" },
  { text: "▸ https ....................... включён средой", tone: "dim" },
  { text: "✔ сборка готова — можно устанавливать", tone: "ok" },
  { text: "● install prompt активен", tone: "amber" },
];

function Terminal() {
  const [progress, setProgress] = useState(() =>
    prefersReducedMotion() ? { line: TERMINAL_LINES.length, char: 0 } : { line: 0, char: 0 }
  );
  const done = progress.line >= TERMINAL_LINES.length;

  useEffect(() => {
    if (prefersReducedMotion()) return;
    let line = 0;
    let char = 0;
    let timer: ReturnType<typeof setInterval>;
    const start = setTimeout(() => {
      timer = setInterval(() => {
        const current = TERMINAL_LINES[line];
        if (!current) {
          clearInterval(timer);
          return;
        }
        char += 2;
        if (char >= current.text.length) {
          char = 0;
          line++;
          setProgress({ line, char: 0 });
          if (line >= TERMINAL_LINES.length) clearInterval(timer);
        } else {
          setProgress({ line, char });
        }
      }, 24);
    }, 700);
    return () => {
      clearTimeout(start);
      if (timer!) clearInterval(timer);
    };
  }, []);

  return (
    <div className="floaty-late relative -rotate-1 border border-line bg-[#08161c] shadow-[0_24px_60px_-20px_rgba(0,0,0,0.7)]">
      <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-coral/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-teal/80" />
        <span className="ml-3 font-mono text-[11px] text-dim">pwa-dock — деплой</span>
      </div>
      <div className="min-h-[172px] px-4 py-3.5 font-mono text-[12.5px] leading-[1.85]">
        {TERMINAL_LINES.slice(0, Math.min(progress.line + 1, TERMINAL_LINES.length)).map((l, i) => {
          const isTyping = i === progress.line && !done;
          const text = isTyping ? l.text.slice(0, progress.char) : l.text;
          if (i > progress.line) return null;
          const color =
            l.tone === "cmd" ? "text-ink" : l.tone === "ok" ? "text-teal" : l.tone === "amber" ? "text-amber" : "text-dim";
          return (
            <div key={i} className={color}>
              {text}
              {isTyping && <span className="cursor-blink text-teal">▍</span>}
            </div>
          );
        })}
        {done && (
          <div className="text-ink">
            <span className="text-teal">$</span> <span className="cursor-blink text-teal">▍</span>
          </div>
        )}
      </div>
    </div>
  );
}

function InstallDialog() {
  const [installed, setInstalled] = useState(false);

  return (
    <div className="floaty relative z-10 border border-line2 bg-panel shadow-[0_30px_70px_-18px_rgba(0,0,0,0.75)]">
      <div className="flex items-center gap-2 border-b border-line px-4 py-2">
        <svg width="11" height="12" viewBox="0 0 11 12" fill="none" aria-hidden="true">
          <rect x="0.75" y="4.75" width="9.5" height="6.5" rx="1.5" stroke="#3ed6c0" strokeWidth="1.2" />
          <path d="M3 4.5V3.4a2.5 2.5 0 0 1 5 0v1.1" stroke="#3ed6c0" strokeWidth="1.2" />
        </svg>
        <span className="font-mono text-[11px] text-mut">https://tvoya-pwa.app</span>
      </div>

      {!installed ? (
        <div className="pop-in px-5 py-5">
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center border border-amber/40 bg-bg2">
              <svg width="22" height="26" viewBox="0 0 22 26" fill="none" aria-hidden="true">
                <path d="M13 1 2 15h6.5L7 25l13-15h-7l0-9z" fill="#ffb454" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="font-display text-[15px] font-700 leading-snug text-ink">Установить приложение?</p>
              <p className="mt-1 font-mono text-[11px] text-dim">tvoya-pwa.app · 2,1 МБ · от другого ИИ</p>
            </div>
          </div>
          <div className="mt-5 flex justify-end gap-2.5">
            <button
              onClick={() => setInstalled(true)}
              className="cursor-pointer border border-line px-4 py-2 font-mono text-[11px] uppercase tracking-[0.1em] text-mut transition-colors hover:border-coral/60 hover:text-coral"
            >
              Отмена
            </button>
            <button
              onClick={() => setInstalled(true)}
              className="cursor-pointer bg-amber px-5 py-2 font-mono text-[11px] font-700 uppercase tracking-[0.1em] text-bg transition-all duration-200 hover:bg-amber2 hover:shadow-[0_0_24px_rgba(255,180,84,0.35)]"
            >
              Установить
            </button>
          </div>
        </div>
      ) : (
        <div className="pop-in px-5 py-6 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-teal/50 bg-teal/10">
            <svg width="20" height="16" viewBox="0 0 20 16" fill="none" aria-hidden="true">
              <path d="M2 8.5 7 13 18 2" stroke="#3ed6c0" strokeWidth="2.4" strokeLinecap="square" />
            </svg>
          </div>
          <p className="mt-3.5 font-display text-[15px] font-700 text-teal">Установлено</p>
          <p className="mt-1 font-mono text-[11px] leading-relaxed text-dim">
            ярлык на главном экране · работает offline
          </p>
        </div>
      )}
    </div>
  );
}

export default function Hero() {
  const title = useScramble("Да. Развернём.", 350);
  const badgeRef = useRef<HTMLDivElement>(null);

  return (
    <section id="top" className="relative overflow-hidden pt-16">
      <div aria-hidden="true" className="ghost-word pointer-events-none absolute -top-6 right-[-2%] font-display text-[26vw] font-900 md:text-[19vw]">
        PWA
      </div>

      <div className="relative mx-auto grid max-w-6xl gap-14 px-5 pb-16 pt-14 md:grid-cols-[1.15fr_0.85fr] md:pb-24 md:pt-20 lg:gap-10">
        <div>
          <p className="flex items-center gap-3 font-mono text-[12px] uppercase tracking-[0.22em] text-teal">
            <svg width="26" height="10" viewBox="0 0 26 10" fill="none" aria-hidden="true">
              <path d="M0 5h20m0 0-4-4m4 4-4 4" stroke="#3ed6c0" strokeWidth="1.4" />
            </svg>
            вопрос из чата → ответ среды
          </p>

          <blockquote className="mt-6 max-w-xl border-l-2 border-amber bg-panel/60 px-5 py-4 text-[15px] italic leading-relaxed text-mut">
            «Ты можешь у себя развернуть PWA-приложение, разработанное в другом ИИ?»
          </blockquote>

          <h1 className="mt-8 font-display text-[13.5vw] font-900 leading-[1.02] tracking-tight text-ink sm:text-6xl md:text-[64px] lg:text-[76px]">
            {title || "\u00A0"}
            <span className="text-amber">_</span>
          </h1>

          <p className="mt-7 max-w-xl text-[16px] leading-relaxed text-mut md:text-[17px]">
            PWA — это обычные веб-файлы: <span className="text-ink">manifest</span>,{" "}
            <span className="text-ink">service worker</span>, иконки и страница. Неважно, кто их написал —
            другой ИИ, ты вручную или целая команда. Если проект собирается в статику, этот док
            поднимет его за один <span className="font-mono text-[14px] text-teal">build</span>.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <a
              href="#validator"
              className="group inline-flex items-center gap-3 bg-amber px-6 py-3.5 font-mono text-[12px] font-700 uppercase tracking-[0.14em] text-bg transition-all duration-200 hover:bg-amber2 hover:shadow-[0_0_32px_rgba(255,180,84,0.4)]"
            >
              проверить мой manifest
              <svg width="14" height="12" viewBox="0 0 14 12" fill="none" className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">
                <path d="M0 6h11m0 0L7.5 1.5M11 6l-3.5 4.5" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            </a>
            <a
              href="#steps"
              className="inline-flex items-center gap-3 border border-line2 px-6 py-3.5 font-mono text-[12px] uppercase tracking-[0.14em] text-mut transition-all duration-200 hover:border-teal hover:text-teal"
            >
              <svg width="13" height="14" viewBox="0 0 13 14" fill="none" aria-hidden="true">
                <path d="M6.5 1v8m0 0L3 5.8M6.5 9 10 5.8M1.5 12.5h10" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              шаблон pwa
            </a>
          </div>

          <dl className="mt-12 grid max-w-xl grid-cols-3 divide-x divide-line border-y border-line">
            {[
              { v: "≈60 сек", k: "на интеграцию" },
              { v: "3 файла", k: "минимум для PWA" },
              { v: "100/100", k: "Lighthouse PWA" },
            ].map((s, i) => (
              <div key={i} className="group px-4 py-4 transition-colors duration-300 first:pl-0 hover:bg-panel/50">
                <dt className="order-2 mt-1 block font-mono text-[10.5px] uppercase tracking-[0.14em] text-dim transition-colors group-hover:text-mut">
                  {s.k}
                </dt>
                <dd className="font-display text-xl font-700 text-teal md:text-2xl">{s.v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative flex flex-col justify-center gap-6 pb-4 md:pb-0">
          <div ref={badgeRef} className="absolute -top-2 right-2 z-20 hidden rotate-3 items-center gap-2 border border-line bg-bg2 px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.12em] text-mut shadow-lg md:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-amber" />
            lighthouse · pwa 100
          </div>
          <InstallDialog />
          <Terminal />
          <p className="text-center font-mono text-[10.5px] uppercase tracking-[0.18em] text-dim">
            ↑ так выглядит момент, ради которого всё затевалось
          </p>
        </div>
      </div>
    </section>
  );
}
