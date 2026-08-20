import { useRef, useState } from "react";
import Reveal from "./Reveal";
import { copyText } from "../lib/utils";

type Origin = "local" | "repo";
type Kind = "manifest" | "sw" | "icon" | "server" | "code" | "other";
type Incoming = { path: string; size: number; kind: Kind; origin: Origin; text?: string };

const SKIP_DIRS = /(\/|^)(node_modules|\.git|dist|build|\.next|\.cache|coverage)(\/|$)/;
const SKIP_FILES = /^(\.DS_Store|Thumbs\.db|package-lock\.json|yarn\.lock|pnpm-lock\.yaml|.*\.map)$/;
const MAX_TEXT = 400_000;
const MAX_FILES = 200;

function detectKind(path: string): Kind {
  const name = path.split("/").pop()!.toLowerCase();
  if (name === "manifest.json" || name.endsWith(".webmanifest")) return "manifest";
  if (/(^|\/)(sw|service-worker|serviceworker)([-.][\w-]*)?\.js$/.test(path.toLowerCase())) return "sw";
  if (
    /(^|\/)(prisma|migrations|app\/api|pages\/api|drizzle)\//i.test(path) ||
    /\.(db|sqlite3?|sql|py)$/i.test(name) ||
    /^(requirements\.txt|caddyfile|dockerfile|docker-compose.*|nginx\.conf|run-server\.sh|manage\.py|procfile|go\.mod|cargo\.toml|server\.(js|ts))$/i.test(name)
  )
    return "server";
  if (/\.(png|svg|ico|jpe?g|webp)$/.test(name)) return "icon";
  if (/\.(js|ts|jsx|tsx|css|html|json|md|vue|svelte|astro|php)$/.test(name)) return "code";
  return "other";
}

function fmtSize(b: number): string {
  if (b < 1024) return `${b} Б`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1).replace(".0", "")} КБ`;
  return `${(b / 1024 / 1024).toFixed(1)} МБ`;
}

async function readAsText(file: File): Promise<string | undefined> {
  if (file.size > MAX_TEXT) return undefined;
  try {
    return await file.text();
  } catch {
    return undefined;
  }
}

function fileToIncoming(file: File, pathOverride?: string, origin: Origin = "local"): Promise<Incoming> {
  const path = pathOverride || (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
  const kind = detectKind(path);
  const base: Incoming = { path, size: file.size, kind, origin };
  if (kind === "manifest" || kind === "code") return readAsText(file).then((text) => ({ ...base, text }));
  return Promise.resolve(base);
}

/* рекурсивный обход перетащенной папки (WebKit entries API) */
async function collectEntry(entry: FileSystemEntry, prefix: string, out: { file: File; path: string }[], depth: number) {
  if (out.length > 400) return;
  if (entry.isFile) {
    const file = await new Promise<File>((res, rej) => (entry as FileSystemFileEntry).file(res, rej));
    out.push({ file, path: prefix + file.name });
  } else if (entry.isDirectory && depth < 6) {
    const reader = (entry as FileSystemDirectoryEntry).createReader();
    for (;;) {
      const batch = await new Promise<FileSystemEntry[]>((res, rej) => reader.readEntries(res, rej));
      if (!batch.length) break;
      for (const e of batch) await collectEntry(e, prefix + entry.name + "/", out, depth + 1);
    }
  }
}

const KIND_LABEL: Record<Kind, string> = { manifest: "manifest", sw: "sw", icon: "иконка", server: "сервер", code: "код", other: "прочее" };
const KIND_CLS: Record<Kind, string> = {
  manifest: "border-amber/50 text-amber",
  sw: "border-teal/50 text-teal",
  icon: "border-mut/50 text-mut",
  server: "border-coral/50 text-coral",
  code: "border-line2 text-dim",
  other: "border-line text-dim/80",
};

/* маркеры стека: по ним шлюз понимает, что за проект приехал */
const STACK_DETECT: { label: string; re: RegExp }[] = [
  { label: "Next.js", re: /(^|\/)next\.config\.(js|ts|mjs)$/i },
  { label: "Nuxt", re: /(^|\/)nuxt\.config\.(js|ts)$/i },
  { label: "SvelteKit", re: /(^|\/)svelte\.config\.(js|ts)$/i },
  { label: "Bun", re: /(^|\/)bun\.lockb?$/i },
  { label: "Prisma", re: /(^|\/)prisma\/schema\.prisma$/i },
  { label: "SQLite", re: /\.(db|sqlite3?)$/i },
  { label: "Python", re: /(^|\/)requirements\.txt$|\.py$/i },
  { label: "Caddy", re: /(^|\/)caddyfile$/i },
  { label: "Docker", re: /(^|\/)(dockerfile|docker-compose)/i },
  { label: "Vite", re: /(^|\/)vite\.config\.(js|ts|mjs)$/i },
  { label: "shadcn/ui", re: /(^|\/)components\.json$/i },
  { label: "Tailwind", re: /(^|\/)(tailwind|postcss)\.config\.(js|ts|mjs|cjs)$/i },
];
/* стеки, которые не живут в статике — им нужен серверный рантайм */
const SERVER_STACK = new Set(["Next.js", "Nuxt", "SvelteKit", "Prisma", "SQLite", "Python", "Caddy", "Docker"]);

export default function Upload() {
  const [incoming, setIncoming] = useState<Incoming[]>([]);
  const [truncated, setTruncated] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [copied, setCopied] = useState(false);
  const [repoUrl, setRepoUrl] = useState("");
  const [repoState, setRepoState] = useState<{ status: "idle" | "loading" | "error"; error?: string }>({ status: "idle" });
  const fileRef = useRef<HTMLInputElement>(null);
  const dirRef = useRef<HTMLInputElement>(null);

  const accept = async (list: { file: File; path?: string }[]) => {
    const clean = list.filter(
      (x) => !SKIP_DIRS.test(x.path || x.file.name) && !SKIP_FILES.test(x.file.name) && !x.file.name.startsWith(".")
    );
    setTruncated(Math.max(0, clean.length - MAX_FILES));
    const slice = clean.slice(0, MAX_FILES);
    const parsed = await Promise.all(slice.map((x) => fileToIncoming(x.file, x.path)));
    setIncoming(parsed);
    setRepoState({ status: "idle" });
  };

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const items = e.dataTransfer.items;
    const out: { file: File; path: string }[] = [];
    if (items?.length && typeof (items[0] as unknown as { webkitGetAsEntry?: () => FileSystemEntry | null }).webkitGetAsEntry === "function") {
      for (const it of Array.from(items)) {
        const entry = (it as unknown as { webkitGetAsEntry: () => FileSystemEntry | null }).webkitGetAsEntry();
        if (entry) await collectEntry(entry, "", out, 0).catch(() => undefined);
      }
    }
    if (!out.length) {
      for (const f of Array.from(e.dataTransfer.files)) out.push({ file: f, path: f.name });
    }
    if (out.length) void accept(out);
  };

  const onInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length) void accept(files.map((f) => ({ file: f })));
    e.target.value = "";
  };

  /* публичный репозиторий: дерево файлов через GitHub API (CORS открыт) */
  const fetchRepo = async () => {
    const m = repoUrl.match(/github\.com\/([\w.-]+)\/([\w.-]+)/);
    if (!m) {
      setRepoState({ status: "error", error: "не вижу ссылку вида github.com/владелец/репо" });
      return;
    }
    const [, owner, repo] = m;
    setRepoState({ status: "loading" });
    try {
      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { tree?: { path: string; size?: number; type: string }[] };
      const blobs = (data.tree || [])
        .filter((t) => t.type === "blob" && !SKIP_DIRS.test(t.path) && !SKIP_FILES.test(t.path))
        .map((t) => ({ path: t.path, size: t.size ?? 0 }));
      if (!blobs.length) throw new Error("пустое дерево");
      setTruncated(Math.max(0, blobs.length - MAX_FILES));
      const relevant = blobs
        .filter((b) => detectKind(b.path) !== "other")
        .sort((a, b) => a.path.localeCompare(b.path))
        .slice(0, MAX_FILES);
      const manifest = relevant.find((b) => detectKind(b.path) === "manifest");
      let manifestText: string | undefined;
      if (manifest) {
        try {
          const raw = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${manifest.path}`);
          if (raw.ok) manifestText = await raw.text();
        } catch {
          /* без manifest-контента — не страшно */
        }
      }
      setIncoming(
        relevant.map((b) => ({
          path: b.path,
          size: b.size,
          kind: detectKind(b.path),
          origin: "repo" as Origin,
          text: detectKind(b.path) === "manifest" ? manifestText : undefined,
        }))
      );
      setRepoState({ status: "idle" });
    } catch {
      setRepoState({
        status: "error",
        error: "репозиторий приватный, недоступен или исчерпан лимит API — вставь ключевые файлы в чат вручную",
      });
    }
  };

  const summary = {
    total: incoming.length,
    manifest: incoming.find((f) => f.kind === "manifest"),
    sw: incoming.some((f) => f.kind === "sw"),
    icons: incoming.filter((f) => f.kind === "icon").length,
    pkg: incoming.some((f) => f.path.endsWith("package.json")),
  };

  const stack = STACK_DETECT.filter((s) => incoming.some((f) => s.re.test(f.path))).map((s) => s.label);
  const fullstack = incoming.some((f) => f.kind === "server") || stack.some((s) => SERVER_STACK.has(s));

  const sendToValidator = (text: string) => {
    window.dispatchEvent(new CustomEvent("pwa-dock:manifest", { detail: text }));
  };

  const buildReport = () => {
    const lines = [
      "PWA DOCK — ПРОТОКОЛ ПРИЁМА",
      `файлов: ${summary.total} · manifest: ${summary.manifest ? "да" : "НЕТ"} · sw: ${summary.sw ? "да" : "НЕТ"} · иконок: ${summary.icons} · package.json: ${summary.pkg ? "да" : "нет"}`,
      `stack: ${stack.length ? stack.join(" · ") : "не определён"} | режим: ${fullstack ? "FULL-STACK" : "статика"}`,
      "",
      ...incoming.slice(0, 40).map((f) => `— ${f.path} (${KIND_LABEL[f.kind]}, ${fmtSize(f.size)})`),
      incoming.length > 40 ? `… и ещё ${incoming.length - 40}` : "",
      "",
      fullstack
        ? "Режим FULL-STACK: серверная часть (БД, API, скрипты) остаётся на твоём хостинге. В док уходит PWA-слой — пришли в чат СОДЕРЖИМОЕ: manifest, sw.js, package.json."
        : "Готов к стыковке: пришли в чат содержимое ключевых файлов (manifest, sw.js, точка входа) — по одному протоколу файлы не воссоздать.",
    ].filter((l) => l !== undefined);
    return lines.join("\n");
  };

  const copyReport = async () => {
    if (await copyText(buildReport())) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  const hasData = incoming.length > 0;

  return (
    <section id="upload" className="relative scroll-mt-24 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal>
          <p className="font-mono text-[12px] uppercase tracking-[0.22em] text-teal">01 — приёмный шлюз</p>
          <h2 className="mt-4 max-w-2xl font-display text-3xl font-900 leading-tight text-ink md:text-5xl">
            Закинь сюда <span className="text-teal">весь проект</span>
          </h2>
          <p className="mt-5 max-w-xl text-[15.5px] leading-relaxed text-mut">
            Перетащи папку от другого ИИ прямо в шлюз — разбор идёт <span className="text-ink">локально в твоём браузере</span>,
            файлы никуда не отправляются. Шлюз найдёт manifest, service worker и иконки, определит
            стек и честно скажет, что берём на борт, а что останется на твоём сервере.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          {/* левая колонка: шлюз + альтернативные каналы */}
          <div className="flex flex-col gap-5">
            <Reveal delay={60}>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                className={`relative border-2 border-dashed p-8 text-center transition-all duration-300 md:p-10 ${
                  dragOver
                    ? "scale-[1.01] border-amber bg-amber/[0.06]"
                    : "border-line2 bg-panel/40 hover:border-mut/60 hover:bg-panel/70"
                }`}
              >
                {(["-top-px -left-px border-t-2 border-l-2", "-top-px -right-px border-t-2 border-r-2", "-bottom-px -left-px border-b-2 border-l-2", "-bottom-px -right-px border-b-2 border-r-2"] as const).map((pos) => (
                  <span key={pos} aria-hidden="true" className={`absolute h-4 w-4 ${pos} ${dragOver ? "border-amber" : "border-teal2"}`} />
                ))}

                <svg className={`mx-auto transition-colors duration-300 ${dragOver ? "text-amber" : "text-teal"}`} width="54" height="54" viewBox="0 0 54 54" fill="none" aria-hidden="true">
                  <path d="M6 32v13a3 3 0 0 0 3 3h36a3 3 0 0 0 3-3V32" stroke="currentColor" strokeWidth="2" />
                  <path d="M6 32h12l4 6h10l4-6h12" stroke="currentColor" strokeWidth="2" />
                  <path className="dash-flow" d="M27 6v20" stroke="currentColor" strokeWidth="2" />
                  <path d="M19 19.5 27 27l8-7.5" stroke="currentColor" strokeWidth="2" fill="none" />
                </svg>

                <p className="mt-5 font-display text-[17px] font-700 text-ink">
                  {dragOver ? "Отпускай — принимаю" : "Перетащи папку проекта сюда"}
                </p>
                <p className="mt-2 font-mono text-[11.5px] leading-relaxed text-dim">
                  node_modules, dist и lock-файлы отсеются сами · анализ без загрузки на сервер
                </p>

                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <button
                    onClick={() => dirRef.current?.click()}
                    className="cursor-pointer bg-teal px-5 py-2.5 font-mono text-[11.5px] font-700 uppercase tracking-[0.12em] text-bg transition-all duration-200 hover:bg-teal2 hover:shadow-[0_0_26px_rgba(62,214,192,0.35)]"
                  >
                    выбрать папку целиком
                  </button>
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="cursor-pointer border border-line2 px-5 py-2.5 font-mono text-[11.5px] uppercase tracking-[0.12em] text-mut transition-colors hover:border-amber hover:text-amber"
                  >
                    или отдельные файлы
                  </button>
                </div>

                <input ref={fileRef} type="file" multiple className="hidden" onChange={onInput} />
                <input ref={dirRef} type="file" multiple className="hidden" onChange={onInput} {...({ webkitdirectory: "" } as Record<string, string>)} />
              </div>
            </Reveal>

            <Reveal delay={140}>
              <div className="border border-line bg-panel/60 p-6">
                <p className="flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-mut">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <circle cx="4" cy="10" r="2.4" stroke="#ffb454" strokeWidth="1.4" />
                    <circle cx="10.5" cy="3.5" r="2.4" stroke="#ffb454" strokeWidth="1.4" />
                    <path d="m5.8 8.2 3-3" stroke="#ffb454" strokeWidth="1.4" />
                  </svg>
                  канал 2 — публичный репозиторий
                </p>
                <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
                  <input
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && fetchRepo()}
                    placeholder="https://github.com/владелец/репо"
                    spellCheck={false}
                    className="min-w-0 flex-1 border border-line bg-[#08161c] px-4 py-2.5 font-mono text-[12.5px] text-ink placeholder:text-dim/70 focus:border-teal2 focus:outline-none"
                  />
                  <button
                    onClick={fetchRepo}
                    disabled={repoState.status === "loading"}
                    className="cursor-pointer border border-teal2/60 px-5 py-2.5 font-mono text-[11.5px] uppercase tracking-[0.12em] text-teal transition-all hover:bg-teal/10 disabled:cursor-wait disabled:opacity-50"
                  >
                    {repoState.status === "loading" ? "сканирую…" : "разобрать репо"}
                  </button>
                </div>
                {repoState.status === "error" && (
                  <p className="pop-in mt-3 border border-coral/40 bg-coral/[0.07] px-3.5 py-2.5 font-mono text-[11.5px] leading-relaxed text-coral">
                    {repoState.error}
                  </p>
                )}
                <p className="mt-3.5 font-mono text-[11px] leading-relaxed text-dim">
                  дерево файлов заберу через GitHub API, manifest подтяну отдельно. Ровно так же
                  работает и <span className="text-mut">ссылка в чате</span> — скинь её мне, и я сделаю это сам.
                </p>
              </div>
            </Reveal>

            <Reveal delay={200}>
              <div className="flex items-start gap-4 border border-line bg-panel/60 p-6">
                <svg className="mt-0.5 shrink-0" width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <rect x="1.5" y="1.5" width="15" height="15" rx="2" stroke="#8fb0b8" strokeWidth="1.4" />
                  <path d="M5 6h8M5 9h8M5 12h5" stroke="#3ed6c0" strokeWidth="1.4" />
                </svg>
                <p className="text-[13.5px] leading-relaxed text-mut">
                  <span className="text-ink">Канал 3 — самый простой:</span> вставь содержимое файлов прямо в чат.
                  Приоритет: <span className="font-mono text-[12px] text-amber">manifest</span> →{" "}
                  <span className="font-mono text-[12px] text-amber">sw.js</span> →{" "}
                  <span className="font-mono text-[12px] text-amber">index.html</span> → точка входа приложения.
                  Остальное дособеру и допрошу по ходу.
                </p>
              </div>
            </Reveal>
          </div>

          {/* правая колонка: протокол приёма */}
          <Reveal delay={120} className="lg:sticky lg:top-24 lg:self-start">
            <div className="flex min-h-[420px] flex-col border border-line bg-[#08161c]">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-3.5">
                <p className="font-mono text-[11.5px] uppercase tracking-[0.16em] text-mut">протокол приёма</p>
                <div className="flex items-center gap-4 font-mono text-[11px]">
                  <span className={summary.manifest ? "text-teal" : "text-dim"}>manifest {summary.manifest ? "✓" : "·"}</span>
                  <span className={summary.sw ? "text-teal" : "text-dim"}>sw {summary.sw ? "✓" : "·"}</span>
                  <span className={summary.icons > 0 ? "text-teal" : "text-dim"}>иконки {summary.icons || "·"}</span>
                </div>
              </div>

              {!hasData ? (
                <div className="grid flex-1 place-items-center p-8 text-center">
                  <div>
                    <div className="mx-auto grid h-14 w-14 place-items-center border border-line">
                      <span className="pulse-dot h-2 w-2 rounded-full bg-teal" />
                    </div>
                    <p className="mt-5 font-mono text-[12px] leading-relaxed text-dim">
                      канал открыт, жду груз…
                      <br />
                      папка, файлы или ссылка на репо
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {stack.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 border-b border-line px-4 py-2.5">
                      <span className="mr-1 font-mono text-[9.5px] uppercase tracking-[0.16em] text-dim">stack</span>
                      {stack.map((s) => (
                        <span
                          key={s}
                          className={`border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] ${
                            SERVER_STACK.has(s) ? "border-coral/50 text-coral" : "border-line2 text-mut"
                          }`}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="max-h-[330px] flex-1 overflow-y-auto p-2.5">
                    {incoming.map((f, i) => (
                      <div key={f.path + i} className="pop-in group flex items-center gap-3 border-b border-line/50 px-2.5 py-2.5 last:border-0 hover:bg-panel/40" style={{ animationDelay: `${Math.min(i * 30, 400)}ms` }}>
                        <span className={`shrink-0 border px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.1em] ${KIND_CLS[f.kind]}`}>
                          {KIND_LABEL[f.kind]}
                        </span>
                        <span className="min-w-0 flex-1 truncate font-mono text-[12px] text-ink" title={f.path}>
                          {f.path}
                        </span>
                        {f.kind === "manifest" && f.text && (
                          <button
                            onClick={() => sendToValidator(f.text!)}
                            className="shrink-0 cursor-pointer border border-amber/50 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-amber transition-all hover:bg-amber/10 hover:shadow-[0_0_16px_rgba(255,180,84,0.25)]"
                          >
                            → в валидатор
                          </button>
                        )}
                        <span className="shrink-0 font-mono text-[10.5px] text-dim">{fmtSize(f.size)}</span>
                      </div>
                    ))}
                    {truncated > 0 && (
                      <p className="px-3 py-2.5 font-mono text-[11px] text-dim">+ ещё {truncated} файлов (лимит показа)</p>
                    )}
                  </div>

                  <div className="border-t border-line p-4">
                    {fullstack && (
                      <p className="pop-in mb-3 border border-coral/40 bg-coral/[0.07] px-3.5 py-2.5 font-mono text-[11px] leading-relaxed text-coral">
                        это full-stack проект: БД, API и скрипты в статический док не переезжают.
                        На борт идёт фронтенд + PWA-слой — пришли в чат <span className="text-ink">содержимое</span>{" "}
                        manifest и sw.js, остальное я допрошу.
                      </p>
                    )}
                    {!summary.manifest && (
                      <p className="mb-3 border border-amber/40 bg-amber/[0.07] px-3.5 py-2.5 font-mono text-[11.5px] leading-relaxed text-amber">
                        manifest не найден — без него установка не взлетит. Скажи тому ИИ: «добавь
                        manifest.webmanifest по образцу из PWA Dock».
                      </p>
                    )}
                    <div className="flex gap-2.5">
                      <button
                        onClick={copyReport}
                        className="flex-1 cursor-pointer bg-amber px-4 py-2.5 font-mono text-[11.5px] font-700 uppercase tracking-[0.12em] text-bg transition-all duration-200 hover:bg-amber2 hover:shadow-[0_0_22px_rgba(255,180,84,0.35)]"
                      >
                        {copied ? "✓ отчёт скопирован" : "отчёт для чата"}
                      </button>
                      <button
                        onClick={() => {
                          setIncoming([]);
                          setTruncated(0);
                        }}
                        className="cursor-pointer border border-line px-4 py-2.5 font-mono text-[11.5px] uppercase tracking-[0.12em] text-mut transition-colors hover:border-coral/60 hover:text-coral"
                      >
                        очистить
                      </button>
                    </div>
                    <p className="mt-3 text-center font-mono text-[10.5px] leading-relaxed text-dim">
                      {fullstack
                        ? "отчёт — это список; дальше нужны сами файлы (начни с manifest и sw)"
                        : "отчёт покажет список — дальше пришли содержимое ключевых файлов"}
                    </p>
                  </div>
                </>
              )}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
