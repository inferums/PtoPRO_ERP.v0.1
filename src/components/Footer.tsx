export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-line bg-bg2/60">
      <div aria-hidden="true" className="ghost-word pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap font-display text-[18vw] font-black">
        РАЗВЕРНИ
      </div>

      <div className="relative mx-auto max-w-6xl px-5 pb-10 pt-16">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="font-display text-2xl font-black text-ink md:text-3xl">
              PWA<span className="text-teal">·</span>DOCK
            </p>
            <p className="mt-3 max-w-sm text-[14px] leading-relaxed text-mut">
              Причал для приложений, рождённых в других ИИ. Привозишь manifest и service worker —
              увозишь ярлык на главном экране.
            </p>
          </div>

          <nav className="grid grid-cols-2 gap-x-14 gap-y-2.5">
            {[
              { href: "#upload", label: "Загрузка" },
              { href: "#checklist", label: "Чек-лист" },
              { href: "#validator", label: "Валидатор" },
              { href: "#sw", label: "Разбор SW" },
              { href: "#steps", label: "Интеграция" },
              { href: "#env", label: "Среда" },
              { href: "#faq", label: "FAQ" },
              { href: "#final", label: "Накладная" },
              { href: "#top", label: "Наверх ↑" },
            ].map((l) => (
              <a
                key={l.href + l.label}
                href={l.href}
                className="font-mono text-[12px] uppercase tracking-[0.12em] text-mut transition-colors hover:text-amber"
              >
                {l.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-line pt-6 font-mono text-[11px] uppercase tracking-[0.12em] text-dim md:flex-row md:items-center md:justify-between">
          <span>© 2026 · pwa·dock · отвечает «да» на вопрос из чата</span>
          <span className="flex items-center gap-2">
            <span className="pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-teal" />
            react + vite + tailwind · собрано в этой же среде
          </span>
        </div>
      </div>
    </footer>
  );
}
