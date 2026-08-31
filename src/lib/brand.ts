/* Фирменный логотип системы.
   Приоритет: загруженный пользователем логотип (localStorage) →
   файл /logo.svg или /logo.png в public/ → встроенный рисованный знак.
   Логотип глобальный (один на установку), поэтому виден и на экране входа. */

import { useEffect, useState } from "react";

const LOGO_KEY = "ip-dok-v2:logo";
const LOGO_EVENT = "brand:logo";

export function getStoredLogo(): string | null {
  try {
    return localStorage.getItem(LOGO_KEY);
  } catch {
    return null;
  }
}

/* Сохраняет (или очищает) загруженный логотип и сразу обновляет favicon */
export function storeLogo(dataUrl: string | null): void {
  try {
    if (dataUrl) localStorage.setItem(LOGO_KEY, dataUrl);
    else localStorage.removeItem(LOGO_KEY);
  } catch {
    /* приватный режим — просто не сохраняем */
  }
  setFavicon(dataUrl ?? undefined);
  window.dispatchEvent(new Event(LOGO_EVENT));
}

/* ---------- favicon ---------- */

function setFavicon(href: string | undefined): void {
  let icon = document.querySelector<HTMLLinkElement>("link[rel='icon']");
  if (!icon) {
    icon = document.createElement("link");
    icon.rel = "icon";
    document.head.appendChild(icon);
  }
  if (href) {
    icon.type = href.startsWith("data:image/svg") || href.endsWith(".svg") ? "image/svg+xml" : "image/png";
    icon.href = href;
  } else {
    icon.href = "/icon-maskable.svg";
    icon.type = "image/svg+xml";
  }
  const apple = document.querySelector<HTMLLinkElement>("link[rel='apple-touch-icon']");
  if (apple) apple.href = href ?? "/icon-maskable.svg";
}

/* ---------- автоопределение файла в public/ (фолбэк) ---------- */

let fileLogo: string | null | undefined = undefined;
let filePending: Promise<string | null> | null = null;

async function probe(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "HEAD" });
    return res.ok;
  } catch {
    return false;
  }
}

function detectFileLogo(): Promise<string | null> {
  if (fileLogo !== undefined) return Promise.resolve(fileLogo);
  if (filePending) return filePending;
  filePending = (async () => {
    for (const candidate of ["/icon-maskable.svg", "/logo.png", "/logo.svg"]) {
      if (await probe(candidate)) {
        fileLogo = candidate;
        return fileLogo;
      }
    }
    fileLogo = null;
    return fileLogo;
  })();
  return filePending;
}

/* ---------- хук: актуальный логотип (undefined = ещё определяется, null = нет, string = URL) ---------- */

export function useBrandLogo(): string | null | undefined {
  const [src, setSrc] = useState<string | null | undefined>(() => getStoredLogo() ?? undefined);

  useEffect(() => {
    let mounted = true;
    const load = () => {
      const stored = getStoredLogo();
      if (stored) {
        setSrc(stored);
        return;
      }
      detectFileLogo().then((u) => {
        if (mounted) setSrc(u);
      });
    };
    load();
    window.addEventListener(LOGO_EVENT, load);
    return () => {
      mounted = false;
      window.removeEventListener(LOGO_EVENT, load);
    };
  }, []);

  return src;
}

/* Возвращает URL логотипа: localStorage → public/ → null */
export async function detectBrandLogo(): Promise<string | null> {
  const stored = getStoredLogo();
  if (stored) return stored;
  return detectFileLogo();
}

/* Вызывается при старте: ставит favicon (загруженный логотип или найденный файл) */
export function applyBrandFavicon(): void {
  const stored = getStoredLogo();
  if (stored) {
    setFavicon(stored);
    return;
  }
  detectFileLogo().then((url) => {
    if (url) setFavicon(url);
  });
}
