import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { IconClose } from "./icons";

/* Единое модальное окно: скруглённая карточка, серый затемнённый фон,
   закрытие по клику на фон и по Esc */
export default function Modal({
  title,
  subtitle,
  onClose,
  children,
  width = "max-w-2xl",
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  width?: string;
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-[#39424e]/55 p-4 sm:p-6"
      style={{ overflow: 'auto' }}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={`modal-in my-8 w-full ${width} flex-col rounded-xl bg-surface shadow-[0_45px_100px_-28px_rgba(28,36,50,0.55)]`}
        style={{ display: 'flex', maxHeight: 'calc(100vh - 4rem)' }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-line px-6 py-4">
          <div className="min-w-0">
            <h3 className="truncate font-display text-[15px] font-bold text-ink">{title}</h3>
            {subtitle && <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-dim">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-md text-mut transition-colors hover:bg-soft hover:text-ink"
            title="Закрыть"
          >
            <IconClose size={15} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>,
    document.body
  );
}

/* общие классы контролов — единый стиль всех форм */
export const INP =
  "w-full rounded-md border border-line bg-white px-3 py-2 text-[13px] text-ink outline-none transition-colors placeholder:text-dim focus:border-brand focus:ring-2 focus:ring-brand/15";
export const LBL = "mb-1 block font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-mut";
export const BTN_PRIMARY =
  "cursor-pointer rounded-md bg-brand px-5 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-white transition-all hover:bg-brand2 hover:shadow-[0_8px_20px_-8px_rgba(30,136,229,0.6)]";
export const BTN_GHOST =
  "cursor-pointer rounded-md border border-line px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.1em] text-mut transition-colors hover:border-line2 hover:text-ink";
