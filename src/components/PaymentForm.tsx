import { useEffect, useState, type ReactNode } from "react";
import { fmtMoney, todayISO, uid, type Payment } from "../lib/store";
import { IconClose } from "./icons";

export type DocOption = { id: string; label: string; total: number; paid: number };

const METHODS = ["Банковский перевод", "Наличные", "Карта"];

export default function PaymentForm({
  title,
  docs,
  initial,
  defaultAmount,
  info,
  onSave,
  onClose,
}: {
  title: string;
  docs?: DocOption[]; // если передан — выбираем, к какому документу относится оплата
  initial?: Payment | null; // режим редактирования
  defaultAmount?: number;
  info?: ReactNode;
  onSave: (p: Payment) => void;
  onClose: () => void;
}) {
  const [docId, setDocId] = useState(initial?.docId ?? docs?.[0]?.id ?? "");
  const sel = docs?.find((d) => d.id === docId);
  const [amount, setAmount] = useState<number>(
    initial?.amount ?? defaultAmount ?? (sel ? Math.max(sel.total - sel.paid, 0) : 0)
  );
  const [date, setDate] = useState(initial?.date ?? todayISO());
  const [method, setMethod] = useState(initial?.method ?? METHODS[0]);
  const [comment, setComment] = useState(initial?.comment ?? "");

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const pick = (id: string) => {
    setDocId(id);
    const d = docs?.find((x) => x.id === id);
    if (d && !initial) setAmount(Math.max(d.total - d.paid, 0));
  };

  const inp =
    "w-full border border-line bg-white px-3 py-2.5 text-[13.5px] text-ink outline-none transition-colors placeholder:text-dim focus:border-brand";
  const lbl = "mb-1.5 block font-mono text-[10.5px] uppercase tracking-[0.14em] text-mut";

  return (
    <div className="overlay-in fixed inset-0 z-[70] grid place-items-center overflow-y-auto bg-navy/70 p-4" onClick={onClose}>
      <div className="modal-in w-full max-w-md border border-line bg-surface p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-display text-[16px] font-bold text-ink">{title}</h3>
          <button onClick={onClose} className="cursor-pointer border border-line p-2 text-mut hover:border-navy hover:text-navy">
            <IconClose size={14} />
          </button>
        </div>

        {info && <div className="mt-4 border border-line bg-soft px-3.5 py-2.5 text-[12.5px] leading-relaxed text-mut">{info}</div>}

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {docs && (
            <div className="sm:col-span-2">
              <label className={lbl}>Документ</label>
              <select value={docId} onChange={(e) => pick(e.target.value)} disabled={!!initial} className={`${inp} cursor-pointer disabled:bg-soft`}>
                {docs.map((d) => (
                  <option key={d.id} value={d.id}>{d.label}</option>
                ))}
              </select>
              {sel && (
                <p className="mt-1.5 font-mono text-[11px] text-dim">
                  к оплате {fmtMoney(sel.total)} · получено {fmtMoney(sel.paid)} · остаток{" "}
                  <span className="font-semibold text-wait">{fmtMoney(Math.max(sel.total - sel.paid, 0))}</span>
                </p>
              )}
            </div>
          )}
          <div>
            <label className={lbl}>Сумма, ₽</label>
            <input type="number" min={0} step="any" value={amount || ""} onChange={(e) => setAmount(Number(e.target.value) || 0)} className={inp} />
          </div>
          <div>
            <label className={lbl}>Дата</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inp} />
          </div>
          <div>
            <label className={lbl}>Способ</label>
            <select value={method} onChange={(e) => setMethod(e.target.value)} className={`${inp} cursor-pointer`}>
              {METHODS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={lbl}>Комментарий</label>
            <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="по договору Д-001…" className={inp} />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2.5">
          <button onClick={onClose} className="cursor-pointer border border-line px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.1em] text-mut hover:text-ink">
            отмена
          </button>
          <button
            onClick={() =>
              amount > 0 &&
              onSave({ id: initial?.id ?? uid(), docId, date, amount, method, comment: comment.trim() || undefined })
            }
            className="cursor-pointer bg-paid px-5 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#268257]"
          >
            сохранить
          </button>
        </div>
      </div>
    </div>
  );
}
