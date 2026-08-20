import { useEffect, useMemo, useState } from "react";
import Reveal from "./Reveal";
import { prefersReducedMotion } from "../lib/utils";

type Level = "ok" | "warn" | "err";
type Result = { level: Level; field: string; msg: string };

const SAMPLE = `{
  "name": "Моя PWA от другого ИИ",
  "short_name": "Моя PWA",
  "description": "Приложение, сгенерированное ИИ и развёрнутое вручную",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0a1a20",
  "theme_color": "#0a1a20",
  "lang": "ru",
  "scope": "/",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-maskable.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}`;

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

function validate(src: string): { parseError?: string; results: Result[]; score: number } {
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(src);
    if (typeof data !== "object" || data === null || Array.isArray(data)) {
      return { parseError: "Корень документа должен быть JSON-объектом { … }", results: [], score: 0 };
    }
  } catch (e) {
    return { parseError: e instanceof Error ? e.message : "Не удалось разобрать JSON", results: [], score: 0 };
  }

  const r: Result[] = [];
  const ok = (field: string, msg: string) => r.push({ level: "ok", field, msg });
  const warn = (field: string, msg: string) => r.push({ level: "warn", field, msg });
  const err = (field: string, msg: string) => r.push({ level: "err", field, msg });

  // name / short_name
  if (typeof data.name === "string" && data.name.trim().length > 0) ok("name", `«${data.name}» — есть, установимость не блокируется`);
  else err("name", "обязательное поле: без name браузер не покажет установку");
  if (typeof data.short_name === "string" && data.short_name.trim().length > 0) ok("short_name", "короткое имя для ярлыка на месте");
  else warn("short_name", "добавь short_name — иначе ярлык обрежет длинное имя");

  // start_url / scope
  if (typeof data.start_url === "string" && data.start_url.trim()) {
    if (data.start_url.startsWith("/") || data.start_url.startsWith("http")) ok("start_url", `«${data.start_url}» — корректная стартовая страница`);
    else warn("start_url", "лучше начать с «/» — относительные пути без «/» ломают scope");
  } else err("start_url", "обязательное поле: с чего открывается установленное приложение");
  if (typeof data.scope === "string") ok("scope", `ограничение навигации: «${data.scope}»`);
  else warn("scope", "необязательно, но scope защищает от «вылёта» в обычный браузер");

  // display
  const display = data.display;
  if (display === "standalone" || display === "fullscreen" || display === "minimal-ui")
    ok("display", `«${display}» — приложение откроется без браузерной строки`);
  else if (display === "browser" || display === undefined)
    warn("display", "«standalone» даст ощущение нативного приложения — сейчас его нет");
  else err("display", `неизвестное значение «${String(display)}» — допустимы standalone, fullscreen, minimal-ui, browser`);

  // colors
  if (typeof data.theme_color === "string") {
    if (HEX.test(data.theme_color)) ok("theme_color", `${data.theme_color} — валидный цвет панели`);
    else warn("theme_color", `«${data.theme_color}» не похоже на hex-цвет (#rrggbb)`);
  } else warn("theme_color", "без theme-color верхняя панель будет дефолтной");
  if (typeof data.background_color === "string") {
    if (HEX.test(data.background_color)) ok("background_color", `${data.background_color} — цвет splash-экрана задан`);
    else warn("background_color", "проверь формат hex-цвета");
  } else warn("background_color", "без него splash-экран при запуске мигнёт белым");

  // lang
  if (typeof data.lang === "string") ok("lang", `язык контента: «${data.lang}»`);
  else warn("lang", "укажи lang — скринридеры скажут спасибо");

  // icons
  const icons = data.icons;
  if (!Array.isArray(icons) || icons.length === 0) {
    err("icons", "критично: без иконок установка невозможна — нужны 192×192 и 512×512");
  } else {
    const sizes = icons
      .map((ic) => (typeof ic === "object" && ic !== null && typeof (ic as Record<string, unknown>).sizes === "string" ? ((ic as Record<string, string>).sizes.toLowerCase()) : ""));
    const srcs = icons.map((ic) => (typeof ic === "object" && ic !== null ? String((ic as Record<string, unknown>).src ?? "") : ""));
    const has192 = sizes.some((s) => s.includes("192x192"));
    const has512 = sizes.some((s) => s.includes("512x512"));
    const hasMaskable = icons.some((ic) => typeof ic === "object" && ic !== null && String((ic as Record<string, unknown>).purpose ?? "").includes("maskable"));
    const allSrc = srcs.every((s) => s.length > 0);

    if (has192) ok("icons[192]", "иконка 192×192 найдена");
    else err("icons[192]", "нужна иконка 192×192 — минимальный размер для установки");
    if (has512) ok("icons[512]", "иконка 512×512 найдена — splash-экран будет чётким");
    else err("icons[512]", "нужна иконка 512×512 — без неё Chromium откажет в установке");
    if (hasMaskable) ok("icons[maskable]", "maskable-иконка есть — Android не обрежет края");
    else warn("icons[maskable]", "добавь purpose: «maskable» — адаптивные иконки Android скажут спасибо");
    if (allSrc) ok("icons.src", "у всех иконок указан путь src");
    else err("icons.src", "у какой-то иконки пустой src");
  }

  let score = 0;
  r.forEach((x) => (score += x.level === "ok" ? 1 : x.level === "warn" ? 0.5 : 0));
  return { results: r, score: Math.round((score / Math.max(r.length, 1)) * 100) };
}

function LevelIcon({ level }: { level: Level }) {
  if (level === "ok")
    return (
      <svg width="15" height="15" viewBox="0 0 15 15" aria-hidden="true">
        <circle cx="7.5" cy="7.5" r="6.8" stroke="#3ed6c0" strokeWidth="1.3" fill="none" />
        <path d="M4.4 7.6 6.7 9.9 10.8 5.2" stroke="#3ed6c0" strokeWidth="1.6" fill="none" />
      </svg>
    );
  if (level === "warn")
    return (
      <svg width="15" height="15" viewBox="0 0 15 15" aria-hidden="true">
        <path d="M7.5 1.4 14.4 13.6H0.6z" stroke="#ffb454" strokeWidth="1.3" fill="none" />
        <path d="M7.5 5.6v3.4" stroke="#ffb454" strokeWidth="1.6" />
        <circle cx="7.5" cy="11.2" r="0.9" fill="#ffb454" />
      </svg>
    );
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" aria-hidden="true">
      <circle cx="7.5" cy="7.5" r="6.8" stroke="#ff7a6b" strokeWidth="1.3" fill="none" />
      <path d="M5 5l5 5m0-5-5 5" stroke="#ff7a6b" strokeWidth="1.6" />
    </svg>
  );
}

export default function Validator() {
  const [src, setSrc] = useState("");

  /* приём manifest из приёмного шлюза (дропзона / репозиторий) */
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (typeof detail === "string" && detail.trim()) {
        setSrc(detail);
        document.getElementById("validator")?.scrollIntoView({
          behavior: prefersReducedMotion() ? "auto" : "smooth",
          block: "start",
        });
      }
    };
    window.addEventListener("pwa-dock:manifest", handler);
    return () => window.removeEventListener("pwa-dock:manifest", handler);
  }, []);

  const report = useMemo(() => {
    if (!src.trim()) return null;
    return validate(src);
  }, [src]);

  const errs = report?.results.filter((r) => r.level === "err").length ?? 0;
  const warns = report?.results.filter((r) => r.level === "warn").length ?? 0;

  const verdict = !report
    ? null
    : report.parseError
      ? { text: "JSON не разобран", cls: "border-coral/50 bg-coral/10 text-coral" }
      : errs > 0
        ? { text: "Не установится — есть критичные поля", cls: "border-coral/50 bg-coral/10 text-coral" }
        : warns > 0
          ? { text: "Установится, но доведи предупреждения", cls: "border-amber/50 bg-amber/10 text-amber" }
          : { text: "Установима. Хоть сейчас в док", cls: "border-teal/50 bg-teal/10 text-teal" };

  return (
    <section id="validator" className="relative scroll-mt-24 border-t border-line bg-bg2/40 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal>
          <p className="font-mono text-[12px] uppercase tracking-[0.22em] text-teal">03 — валидатор</p>
          <h2 className="mt-4 max-w-2xl font-display text-3xl font-black leading-tight text-ink md:text-5xl">
            Скорми мне manifest <span className="text-teal">от того ИИ</span>
          </h2>
          <p className="mt-5 max-w-xl text-[15.5px] leading-relaxed text-mut">
            Вставь содержимое <span className="font-mono text-[13.5px] text-amber">manifest.webmanifest</span> —
            проверка идёт прямо при вводе, по критериям установимости Chromium. Ничего никуда не
            отправляется.
          </p>
        </Reveal>

        <Reveal delay={120} className="mt-12">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            {/* editor */}
            <div className="border border-line bg-[#08161c]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-coral/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-teal/70" />
                  <span className="ml-2 font-mono text-[11.5px] text-mut">public/manifest.webmanifest</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSrc(SAMPLE)}
                    className="cursor-pointer border border-line px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.1em] text-mut transition-colors hover:border-teal2 hover:text-teal"
                  >
                    вставить пример
                  </button>
                  <button
                    onClick={() => setSrc("")}
                    className="cursor-pointer border border-line px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.1em] text-mut transition-colors hover:border-coral/60 hover:text-coral"
                  >
                    очистить
                  </button>
                </div>
              </div>
              <textarea
                value={src}
                onChange={(e) => setSrc(e.target.value)}
                spellCheck={false}
                placeholder={`{\n  "name": "…",\n  "short_name": "…",\n  "start_url": "/",\n  "display": "standalone",\n  "icons": [ … ]\n}`}
                className="block h-[380px] w-full resize-none bg-transparent p-5 font-mono text-[12.5px] leading-[1.75] text-ink placeholder:text-dim/70 focus:outline-none lg:h-[430px]"
              />
              <div className="flex items-center justify-between border-t border-line px-4 py-2 font-mono text-[10.5px] uppercase tracking-[0.12em] text-dim">
                <span>{src ? `${src.length} символов` : "ожидание ввода"}</span>
                <span className="text-teal">live-проверка ●</span>
              </div>
            </div>

            {/* results */}
            <div className="flex flex-col border border-line bg-panel/60">
              <div className="border-b border-line px-5 py-4">
                {!verdict ? (
                  <p className="font-mono text-[12px] text-dim">// результат появится здесь…</p>
                ) : (
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                    <span className={`border px-3.5 py-2 font-display text-[13px] font-bold ${verdict.cls}`}>
                      {verdict.text}
                    </span>
                    {!report?.parseError && report && (
                      <span className="flex items-baseline gap-4 font-mono text-[11.5px]">
                        <span className="text-teal">{report.results.filter((x) => x.level === "ok").length} ок</span>
                        <span className="text-amber">{warns} предупр.</span>
                        <span className="text-coral">{errs} ошибок</span>
                      </span>
                    )}
                  </div>
                )}
                {report && !report.parseError && (
                  <div className="mt-4 h-1.5 w-full bg-bg">
                    <div
                      className="h-full bg-gradient-to-r from-teal2 to-teal transition-all duration-700"
                      style={{ width: `${report.score}%` }}
                    />
                  </div>
                )}
              </div>

              <div className="max-h-[380px] flex-1 overflow-y-auto p-3 lg:max-h-[430px]">
                {!report && (
                  <div className="grid h-full place-items-center p-6 text-center">
                    <div>
                      <svg className="mx-auto" width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden="true">
                        <path d="M8 8h20l8 8v20H8z" stroke="#28505e" strokeWidth="1.6" />
                        <path d="M28 8v8h8" stroke="#28505e" strokeWidth="1.6" />
                        <path d="M14 22h16M14 28h10" stroke="#3ed6c0" strokeWidth="1.6" />
                      </svg>
                      <p className="mt-4 font-mono text-[12px] leading-relaxed text-dim">
                        пустой manifest — не беда.
                        <br />
                        жми «вставить пример» и смотри, как выглядит эталон
                      </p>
                    </div>
                  </div>
                )}

                {report?.parseError && (
                  <div className="border border-coral/40 bg-coral/[0.07] p-4 font-mono text-[12px] leading-relaxed text-coral">
                    <p className="mb-1 uppercase tracking-[0.14em]">синтаксическая ошибка</p>
                    {report.parseError}
                  </div>
                )}

                {report?.results.map((res, i) => (
                  <div
                    key={i}
                    className="group flex items-start gap-3 border-b border-line/60 px-2 py-3 transition-colors last:border-0 hover:bg-bg/40"
                  >
                    <span className="mt-0.5 shrink-0">
                      <LevelIcon level={res.level} />
                    </span>
                    <div className="min-w-0">
                      <p className="font-mono text-[12px] font-bold text-ink">{res.field}</p>
                      <p className="mt-0.5 text-[12.5px] leading-relaxed text-mut">{res.msg}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
