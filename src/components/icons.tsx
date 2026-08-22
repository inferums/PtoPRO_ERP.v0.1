import type { ReactNode } from "react";

type P = { size?: number; className?: string };

function Svg({ size = 18, className = "", children }: P & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      className={className}
      aria-hidden="true"
    >
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

export const IconCheck = (p: P) => (
  <Svg {...p}>
    <path d="m4 10.5 4 4 8-9" />
  </Svg>
);

export const IconContract = (p: P) => (
  <Svg {...p}>
    <path d="M4.5 2.8h8l3 3v11.4h-11V2.8z" />
    <path d="M12.5 2.8v3h3" />
    <path d="M7 11.5c.8-1.4 1.8-1.4 2.4-.4.5.9 1.6 1.4 2.6.2" />
    <path d="M7 14.6h6" />
  </Svg>
);

export const IconCoin = (p: P) => (
  <Svg {...p}>
    <circle cx="10" cy="10" r="6.6" />
    <path d="M8 7.4h3a1.8 1.8 0 0 1 0 3.6H8v1.8M8 7.4v5.4M6.8 9.4h4.4" />
  </Svg>
);

export const IconLetter = (p: P) => (
  <Svg {...p}>
    <rect x="2.8" y="4.6" width="14.4" height="10.8" rx="1.4" />
    <path d="m3.4 5.6 6.6 5.2 6.6-5.2" />
  </Svg>
);

export const IconExit = (p: P) => (
  <Svg {...p}>
    <path d="M7.5 17.5H4.2a1.7 1.7 0 0 1-1.7-1.7V4.2a1.7 1.7 0 0 1 1.7-1.7h3.3" />
    <path d="m13.3 14.2 4.2-4.2-4.2-4.2" />
    <path d="M17.5 10H7.5" />
  </Svg>
);

export function Logo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <rect width="40" height="40" rx="9" fill="#1E88E5" />
      <path d="M12.5 8.5h10L28.5 14.5V31.5h-16V8.5z" fill="#fff" />
      <path d="M22.5 8.5v6h6" stroke="#BBDCF8" strokeWidth="1.4" />
      <path d="M15.8 18.5h8.4M15.8 22h8.4M15.8 25.5h5" stroke="#9CC1E8" strokeWidth="1.6" />
      <circle cx="27.4" cy="26.8" r="5.4" fill="#0E2440" />
      <path d="m25 26.9 1.7 1.7 3.1-3.4" stroke="#4CC38A" strokeWidth="1.8" fill="none" />
    </svg>
  );
}
