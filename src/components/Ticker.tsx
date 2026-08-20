const ITEMS = [
  "manifest.webmanifest",
  "service worker",
  "offline-first",
  "install prompt",
  "https из коробки",
  "иконки 192×192 + 512×512",
  "cache api",
  "standalone-режим",
  "beforeinstallprompt",
  "maskable icons",
  "appinstalled",
  "skipWaiting()",
];

function Row() {
  return (
    <>
      {ITEMS.map((it, i) => (
        <span key={i} className="flex items-center gap-6 pr-6">
          <span className="font-mono text-[12px] uppercase tracking-[0.18em] text-mut transition-colors hover:text-teal">
            {it}
          </span>
          <svg width="7" height="7" viewBox="0 0 7 7" aria-hidden="true">
            <path d="M3.5 0 7 3.5 3.5 7 0 3.5z" fill="#ffb454" opacity="0.7" />
          </svg>
        </span>
      ))}
    </>
  );
}

export default function Ticker() {
  return (
    <div className="relative overflow-hidden border-y border-line bg-bg2/70 py-3.5">
      <div className="ticker-track flex items-center">
        <Row />
        <Row />
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-bg to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-bg to-transparent" />
    </div>
  );
}
