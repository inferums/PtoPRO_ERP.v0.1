/* Автоопределение фирменного логотипа.
   Если в public/ лежит logo.svg или logo.png — он подхватывается везде
   (favicon, панель, форма входа, шапка счёта). Иначе используется встроенный знак. */

let cached: string | null | undefined = undefined;
let pending: Promise<string | null> | null = null;

async function probe(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "HEAD" });
    return res.ok;
  } catch {
    return false;
  }
}

export function detectBrandLogo(): Promise<string | null> {
  if (cached !== undefined) return Promise.resolve(cached);
  if (pending) return pending;
  pending = (async () => {
    for (const candidate of ["/logo.svg", "/logo.png"]) {
      if (await probe(candidate)) {
        cached = candidate;
        return cached;
      }
    }
    cached = null;
    return cached;
  })();
  return pending;
}

/* Подменяет favicon и apple-touch-icon на реальный логотип, если он есть */
export function applyBrandFavicon(): void {
  detectBrandLogo().then((url) => {
    if (!url) return;
    let icon = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    if (!icon) {
      icon = document.createElement("link");
      icon.rel = "icon";
      document.head.appendChild(icon);
    }
    icon.type = url.endsWith(".svg") ? "image/svg+xml" : "image/png";
    icon.href = url;

    const apple = document.querySelector<HTMLLinkElement>("link[rel='apple-touch-icon']");
    if (apple) apple.href = url;
  });
}
