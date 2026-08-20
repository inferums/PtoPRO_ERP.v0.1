const NAV = [
  { href: "#upload", label: "Загрузка" },
  { href: "#checklist", label: "Чек-лист" },
  { href: "#validator", label: "Валидатор" },
  { href: "#sw", label: "SW" },
  { href: "#steps", label: "Интеграция" },
  { href: "#env", label: "Среда" },
  { href: "#faq", label: "FAQ" },
  { href: "#final", label: "Накладная" },
];

function LogoMark() {
  return (
    <svg width="30" height="30" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="30" height="30" rx="7" stroke="#3ed6c0" strokeWidth="1.5" fill="#0f2731" />
      <path d="M17.5 4.5 8.5 18h5.7L12.8 27.5 22.5 14h-5.9l0.9-9.5z" fill="#ffb454" />
    </svg>
  );
}

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-line bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <a href="#top" className="group flex items-center gap-3">
          <span className="transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105">
            <LogoMark />
          </span>
          <span className="font-display text-sm font-700 tracking-[0.14em] text-ink">
            PWA<span className="text-teal">·</span>DOCK
          </span>
        </a>

        <nav className="hidden items-center gap-4 md:flex lg:gap-6">
          {NAV.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className={`group relative font-mono text-[11.5px] uppercase tracking-[0.12em] text-mut transition-colors hover:text-teal ${
                n.href === "#env" ? "hidden lg:inline" : ""
              }`}
            >
              <span className="text-dim mr-1.5 transition-colors group-hover:text-teal2">/</span>
              {n.label}
              <span className="absolute -bottom-1 left-0 h-px w-0 bg-teal transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
        </nav>

        <a
          href="#steps"
          className="hidden items-center gap-2.5 border border-line bg-panel px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-mut transition-all duration-300 hover:border-teal2 hover:text-teal xl:flex"
        >
          <span className="pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-teal" />
          среда готова
        </a>
      </div>
    </header>
  );
}
