import { useEffect, useState, type ReactNode } from "react";
import { detectBrandLogo } from "../lib/brand";

type P = { size?: number; className?: string };

/* Встроенный фирменный знак PtoPRO — квадратная иконка */
function BuiltinLogo({ size }: { size: number }) {
  return (
    <img
      src="/icon-maskable.svg"
      width={size}
      height={size}
      alt="PtoPRO"
      className="shrink-0"
      style={{ width: size, height: size }}
    />
  );
}

function Svg({ size = 18, className = "", children }: P & { children: ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.7} className={className} aria-hidden="true">
      {children}
    </svg>
  );
}

export const IconGrid = (p: P) => (
  <Svg {...p}>
    <rect x="2.8" y="2.8" width="6" height="6" />
    <rect x="11.2" y="2.8" width="6" height="6" />
    <rect x="2.8" y="11.2" width="6" height="6" />
    <rect x="11.2" y="11.2" width="6" height="6" />
  </Svg>
);

export const IconDoc = (p: P) => (
  <Svg {...p}>
    <path d="M5 2.6h7.2l3.2 3.2v11.6H5V2.6z" />
    <path d="M12.2 2.6v3.2h3.2" />
    <path d="M7.6 10h5M7.6 13h5" />
  </Svg>
);

export const IconContract = (p: P) => (
  <Svg {...p}>
    <path d="M4 2.8h9.4l2.8 2.8v11.6H4V2.8z" />
    <path d="M13.4 2.8v2.8h2.8" />
    <path d="M6.6 9h7M6.6 11.6h7" />
    <path d="M6.6 14.6c1-.9 1.8.3 2.8-.4" />
  </Svg>
);

export const IconCoin = (p: P) => (
  <Svg {...p}>
    <circle cx="10" cy="10" r="6.8" />
    <path d="M10 6.4v7.2M7.8 8.2h3.4a1.7 1.7 0 1 1 0 3.4H7.8" />
  </Svg>
);

export const IconLetter = (p: P) => (
  <Svg {...p}>
    <rect x="2.8" y="4.6" width="14.4" height="10.8" />
    <path d="m3.4 5.4 6.6 5.4 6.6-5.4" />
  </Svg>
);

export const IconPeople = (p: P) => (
  <Svg {...p}>
    <circle cx="7.2" cy="6.6" r="2.6" />
    <path d="M2.6 16.4c.5-3 2.4-4.6 4.6-4.6s4.1 1.6 4.6 4.6" />
    <circle cx="13.8" cy="7.4" r="2" />
    <path d="M13.6 11.9c2 .2 3.4 1.6 3.8 4" />
  </Svg>
);

export const IconSliders = (p: P) => (
  <Svg {...p}>
    <path d="M3 5.4h14M3 10h14M3 14.6h14" />
    <circle cx="7.5" cy="5.4" r="1.7" fill="var(--color-surface)" />
    <circle cx="12.5" cy="10" r="1.7" fill="var(--color-surface)" />
    <circle cx="6" cy="14.6" r="1.7" fill="var(--color-surface)" />
  </Svg>
);

export const IconPlus = (p: P) => (
  <Svg {...p}>
    <path d="M10 3.8v12.4M3.8 10h12.4" />
  </Svg>
);

export const IconPrint = (p: P) => (
  <Svg {...p}>
    <path d="M6 7V2.8h8V7" />
    <rect x="3.2" y="7" width="13.6" height="6.4" />
    <path d="M6 11h8v6.2H6z" />
  </Svg>
);

export const IconDownload = (p: P) => (
  <Svg {...p}>
    <path d="M10 3v9m0 0L6.8 8.9M10 12l3.2-3.1" />
    <path d="M3.5 13.5v3.7h13v-3.7" />
  </Svg>
);

export const IconClose = (p: P) => (
  <Svg {...p}>
    <path d="m5 5 10 10M15 5 5 15" />
  </Svg>
);

export const IconPencil = (p: P) => (
  <Svg {...p}>
    <path d="m12.6 4.2 3.2 3.2L7 16.2l-4 .9.9-4 8.7-8.9z" />
    <path d="m11 5.8 3.2 3.2" />
  </Svg>
);

export const IconTrash = (p: P) => (
  <Svg {...p}>
    <path d="M3.6 5.4h12.8M8 5.4V3.4h4v2M5.4 5.4l.8 11.8h7.6l.8-11.8" />
    <path d="M8.4 8.6v5.6M11.6 8.6v5.6" />
  </Svg>
);

export const IconArrow = (p: P) => (
  <Svg {...p}>
    <path d="M3.4 10h12.2m0 0L11.4 5.8M15.6 10l-4.2 4.2" />
  </Svg>
);

export const IconSearch = (p: P) => (
  <Svg {...p}>
    <circle cx="9" cy="9" r="5.4" />
    <path d="m13.2 13.2 3.6 3.6" />
  </Svg>
);

export const IconExit = (p: P) => (
  <Svg {...p}>
    <path d="M8 3.4H3.4v13.2H8" />
    <path d="M12.6 6.8 16 10l-3.4 3.2M16 10H7.6" />
  </Svg>
);

export const IconReceipt = (p: P) => (
  <Svg {...p}>
    <path d="M4.5 2.8v14.4l1.8-.9 1.7.9 2-.9 2 .9 1.7-.9 1.8.9V2.8l-1.8.9-1.7-.9-2 .9-2-.9-1.7.9z" />
    <path d="M8 8h4.5M8 11.2h3" />
  </Svg>
);

export const IconClipboard = (p: P) => (
  <Svg {...p}>
    <rect x="4" y="4" width="12" height="13.4" />
    <rect x="7.4" y="2.4" width="5.2" height="3" />
    <path d="m7.6 11.4 1.8 1.8 3.4-3.6" />
  </Svg>
);

export const IconSwap = (p: P) => (
  <Svg {...p}>
    <path d="M7 4 3.6 7.2 7 10.4M3.6 7.2H16.4" />
    <path d="m13 9.6 3.4 3.2-3.4 3.2M16.4 12.8H3.6" />
  </Svg>
);

export const IconLogout = (p: P) => (
  <Svg {...p}>
    <path d="m13.2 13.4 3.6-3.4-3.6-3.4M16.8 10H7.6" />
    <path d="M9.2 16.8H4.4V3.2h4.8" />
  </Svg>
);

export const IconMonitor = (p: P) => (
  <Svg {...p}>
    <rect x="2.8" y="4" width="14.4" height="9.4" />
    <path d="M7 16.8h6M10 13.4v3.4" />
  </Svg>
);

export const IconPhone = (p: P) => (
  <Svg {...p}>
    <rect x="5.6" y="2.8" width="8.8" height="14.4" />
    <path d="M9.2 14.6h1.6" />
  </Svg>
);

export function Logo({ size = 36 }: { size?: number }) {
  const [brandUrl, setBrandUrl] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    let mounted = true;
    detectBrandLogo().then((url) => {
      if (mounted) setBrandUrl(url);
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (brandUrl) {
    return (
      <img
        src={brandUrl}
        width={size}
        height={size}
        alt="PtoPRO-ERP"
        className="shrink-0 rounded-xl object-contain"
        style={{ width: size, height: size }}
      />
    );
  }

  return <BuiltinLogo size={size} />;
}
