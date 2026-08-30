import { useState } from "react";
import { fmtMoney, todayISO, uid, type Payment } from "../lib/store";
import Modal, { BTN_GHOST, BTN_PRIMARY, INP, LBL } from "./Modal";

export type DocOption = {
  id: string;
  label: string;
  total: number;
  paid: number;
  suggestedName?: string;
};

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
  docs?: DocOption[]; // список документов для привязки; undefined — документ не выбирается
  initial?: Payment | null; // режим редактирования
  defaultAmount?: number;
  info?: React.ReactNode;
  onSave: (p: Payment) => void;
  onClose: () => void;
}) {
  const [docId, setDocId] = useState(initial?.docId || docs?.[0]?.id || "");
  const sel = docs?.find((d) => d.id === docId);
  const [amount, setAmount] = useState<number>(
    initial?.amount ?? defaultAmount ?? (sel ? Math.max(sel.total - sel.paid, 0) : 0)
  );
  const [date, setDate] = useState(initial?.date ?? todayISO());
  const [method, setMethod] = useState(initial?.method ?? METHODS[0]);
  const [name, setName] = useState(initial?.name ?? (docId ? sel?.suggestedName ?? "" : ""));
  const [nameTouched, setNameTouched] = useState(!!initial?.name);

  const pick = (id: string) => {
    setDocId(id);
    const d = docs?.find((x) => x.id === id);
    if (!initial) {
      if (d) setAmount(Math.max(d.total - d.paid, 0));
      if (!nameTouched) setName(d?.suggestedName ?? "");
    }
  };

  return (
    <Modal title={title} subtitle="платёж" onClose={onClose} width="max-w-2xl">
      <div className="px-1 py-1">
        {info && <div className="mb-4 rounded-lg border border-line bg-soft px-3.5 py-2.5 text-[12.5px] leading-relaxed text-mut">{info}</div>}

        <div className="grid gap-3.5">
          <div>
            <label className={LBL}>Наименование</label>
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setNameTouched(true);
              }}
              placeholder="Оплата по договору №Д-002/2024 от 01.03.2024"
              className={INP}
            />
            {!nameTouched && (
              <p className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.1em] text-dim">подставится автоматически — можно отредактировать</p>
            )}
          </div>

          {docs && (
            <div>
              <label className={LBL}>Документ (необязательно)</label>
              <select value={docId} onChange={(e) => pick(e.target.value)} disabled={!!initial} className={`${INP} cursor-pointer disabled:bg-soft disabled:text-mut`}>
                <option value="">— без привязки к документу —</option>
                {docs.map((d) => (
                  <option key={d.id} value={d.id}>{d.label}</option>
                ))}
              </select>
              {sel && (
                <p className="mt-1.5 font-mono text-[10.5px] text-dim">
                  к оплате {fmtMoney(sel.total)} · получено {fmtMoney(sel.paid)} · остаток{" "}
                  <span className="font-semibold text-wait">{fmtMoney(Math.max(sel.total - sel.paid, 0))}</span>
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className={LBL}>Сумма, ₽</label>
              <input type="number" min={0} step="any" value={amount || ""} onChange={(e) => setAmount(Number(e.target.value) || 0)} className={INP} />
            </div>
            <div>
              <label className={LBL}>Дата</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={INP} />
            </div>
          </div>

          <div>
            <label className={LBL}>Способ оплаты</label>
            <select value={method} onChange={(e) => setMethod(e.target.value)} className={`${INP} cursor-pointer`}>
              {METHODS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2.5 border-t border-line bg-soft px-5 py-3.5">
        <button onClick={onClose} className={BTN_GHOST}>отмена</button>
        <button
          onClick={() => amount > 0 && onSave({ id: initial?.id ?? uid(), docId, date, amount, method, name: name.trim() || "Оплата" })}
          className={BTN_PRIMARY}
        >
          сохранить
        </button>
      </div>
    </Modal>
  );
}
