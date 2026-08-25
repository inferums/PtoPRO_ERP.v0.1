/* Фирменный стиль системы: логотип, печать и подпись.
   Приоритет логотипа: загруженный пользователем (localStorage) →
   файл /logo.svg или /logo.png в public/ → встроенный рисованный знак.
   Всё хранится локально и переживает перезагрузку — загружать заново не нужно. */

import { useEffect, useState } from "react";

export type BrandKey = "logo" | "stamp" | "signature";

const KEY_PREFIX = "ip-dok-v2:brand-";
const BRAND_EVENT = "brand:changed";

/* ---------- чтение / запись ---------- */

export function readBrand(key: BrandKey): string | null {
  try {
    return localStorage.getItem(KEY_PREFIX + key);
  } catch {
    return null;
  }
}

export function writeBrand(key: BrandKey, dataUrl: string | null): void {
  try {
    if (dataUrl) localStorage.setItem(KEY_PREFIX + key, dataUrl);
    else localStorage.removeItem(KEY_PREFIX + key);
  } catch {
    /* переполнение localStorage или приватный режим — молча пропускаем */
  }
  if (key === "logo") setFavicon(dataUrl ?? undefined);
  window.dispatchEvent(new CustomEvent(BRAND_EVENT, { detail: key }));
}

/* ---------- подготовка файла: проверка + уменьшение до разумного размера ---------- */

export function fileToDataUrl(file: File, maxDim = 512): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Нужен файл изображения (PNG, JPG, SVG или WEBP)"));
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      reject(new Error("Файл больше 4 МБ — сожмите изображение и попробуйте снова"));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Не удалось прочитать файл"));
    reader.onload = () => {
      const src = String(reader.result);
      /* SVG не растровый — храним как есть */
      if (file.type === "image/svg+xml" || src.startsWith("data:image/svg")) {
        resolve(src);
        return;
      }
      const img = new Image();
      img.onerror = () => reject(new Error("Файл повреждён или имеет неподдерживаемый формат"));
      img.onload = () => {
        try {
          const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
          const w = Math.max(1, Math.round(img.width * scale));
          const h = Math.max(1, Math.round(img.height * scale));
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(src);
            return;
          }
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL("image/png"));
        } catch {
          resolve(src);
        }
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  });
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

/* ---------- автоопределение файла в public/ (фолбэк логотипа) ---------- */

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
    for (const candidate of ["/logo.svg", "/logo.png"]) {
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

/* ---------- хуки ---------- */

/* Логотип: undefined = ещё определяется, null = встроенный знак, string = URL */
export function useBrandLogo(): string | null | undefined {
  const [src, setSrc] = useState<string | null | undefined>(() => readBrand("logo") ?? undefined);

  useEffect(() => {
    let mounted = true;
    const load = () => {
      const stored = readBrand("logo");
      if (stored) {
        setSrc(stored);
        return;
      }
      detectFileLogo().then((u) => {
        if (mounted) setSrc(u);
      });
    };
    load();
    const onBrand = () => load();
    window.addEventListener(BRAND_EVENT, onBrand);
    return () => {
      mounted = false;
      window.removeEventListener(BRAND_EVENT, onBrand);
    };
  }, []);

  return src;
}

/* Печать / подпись: null = не загружено */
export function useBrandImage(key: BrandKey): string | null {
  const [src, setSrc] = useState<string | null>(() => readBrand(key));

  useEffect(() => {
    const load = () => setSrc(readBrand(key));
    load();
    window.addEventListener(BRAND_EVENT, load);
    return () => window.removeEventListener(BRAND_EVENT, load);
  }, [key]);

  return src;
}

/* Вызывается при старте приложения */
export function applyBrandFavicon(): void {
  const stored = readBrand("logo");
  if (stored) {
    setFavicon(stored);
    return;
  }
  detectFileLogo().then((url) => {
    if (url) setFavicon(url);
  });
}
