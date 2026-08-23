import { useMemo, useState } from "react";
import {
  calc,
  fmtMoney,
  fmtDate,
  todayISO,
  uid,
  type Doc,
  type Party,
  type Payment,
} from "../lib/store";
import { IconClose, IconCoin, IconPlus } from "./icons";

const METHODS = ["Банковский перевод", "Наличные", "Карта"];

function Form({
  docs,
  parties,
  paidByDoc,
  onSave,
  onClose,
}: {
  docs: Doc[];
  parties: Party[];
  paidByDoc: Map<string, number>;
  onSave: (p: Payment) => void;
  onClose: () => void;
}) {
  const sorted = useMemo(() => [...docs].sort((a, b) => b.date.localeCompare(a.date)), [docs]);
  const [docId, setDocId] = useState(sorted[0]?.id ?? "");
  const doc = docs.find((d) => d.id === docId);
  const remaining = doc ? Math.max(calc(doc).total - (paidByDoc.get(doc.id) ?? 0), 0) : 0;
  const [amount, setAmount] = useState<number>(remaining);
  const [method, setMethod] = useState(METHODS[0]);
  const [comment, setComment] = useState("");
  const [date, setDate] = useState(todayISO());

  const pickDoc = (id: string) => {
    setDocId(id);
    const d = docs.find((x) => x.id === id);
    if (d) setAmount(Math.max(calc(d).total - (paidByDoc.get(d.id) ?? 0), 0));
  };

  const inp =
    "w-full border border-line bg-white px-3 py-2.5 text-[13.5px] text-ink outline-none transition-colors placeholder:text-dim focus:border-brand";
  const lbl = "mb-1.5 block font-mono text-[10.5px] uppercase tracking-[0.14em] text-mut";
  const partyName = (id: string) => parties.find((p) => p.id === id)?.name ?? "—";

  return (
    <div className="overlay-in fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-navy/70 p-4" onClick={onClose}>
      <div className="modal-in w-full max-w-lg border border-line bg-surface p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-display text-[16px] font-bold text-ink">Новая оплата</h3>
          <button onClick={onClose} className="cursor-pointer border border-line p-2 text-mut hover:border-navy hover:text-navy">
            <IconClose size={14} />
          </button>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={lbl}>Документ</label>
            <select value={docId} onChange={(e) => pickDoc(e.target.value)} className={`${inp} cursor-pointer`}>
              {sorted.map((d) => (
                <option key={d.id} value={d.id}>
                  № {d.number} · {partyName(d.counterpartyId)} · {fmtMoney(calc(d).total)}
                </option>
              ))}
            </select>
            {doc && (
              <p className="mt-1.5 font-mono text-[11px] text-dim">
                к оплате {fmtMoney(calc(doc).total)} · уже получено {fmtMoney(paidByDoc.get(doc.id) ?? 0)} · остаток{" "}
                <span className="font-semibold text-wait">{fmtMoney(remaining)}</span>
              </p>
            )}
          </div>
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
            <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="по договору 07/25" className={inp} />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2.5">
          <button onClick={onClose} className="cursor-pointer border border-line px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.1em] text-mut hover:text-ink">
            отмена
          </button>
          <button
            onClick={() => amount > 0 && docId && onSave({ id: uid(), docId, date, amount, method, comment: comment.trim() || undefined })}
            className="cursor-pointer bg-paid px-5 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#268257]"
          >
            записать оплату
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Payments({
  payments,
  docs,
  parties,
  onAdd,
}: {
  payments: Payment[];
  docs: Doc[];
  parties: Party[];
  onAdd: (p: Payment) => void;
}) {
  const [adding, setAdding] = useState(false);

  const paidByDoc = useMemo(() => {
    const m = new Map<string, number>();
    payments.forEach((p) => m.set(p.docId, (m.get(p.docId) ?? 0) + p.amount));
    return m;
  }, [payments]);

  const docById = (id: string) => docs.find((d) => d.id === id);
  const partyName = (id: string) => parties.find((p) => p.id === id)?.name ?? "—";
  const sorted = [...payments].sort((a, b) => b.date.localeCompare(a.date));
  const total = payments.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="fade-up">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-dim">
          платежей: {payments.length} · получено <span className="font-semibold text-paid">{fmtMoney(total)}</span>
        </p>
        <button
          onClick={() => setAdding(true)}
          disabled={docs.length === 0}
          className="flex cursor-pointer items-center gap-2 bg-paid px-4 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#268257] disabled:cursor-not-allowed disabled:opacity-50"
          title={docs.length === 0 ? "Сначала создайте документ" : ""}
        >
          <IconPlus size={13} /> оплата
        </button>
      </div>

      <div className="mt-4 overflow-x-auto border border-line bg-surface">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead>
            <tr className="border-b border-line bg-soft">
              {["Дата", "Документ", "Контрагент", "Способ", "Комментарий", "Сумма"].map((h, i) => (
                <th key={h} className={`px-4 py-3 font-mono text-[10.5px] font-medium uppercase tracking-[0.14em] text-dim ${i === 5 ? "text-right" : ""}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {sorted.map((p, i) => {
              const doc = docById(p.docId);
              return (
                <tr key={p.id} className="fade-up transition-colors hover:bg-soft" style={{ animationDelay: `${Math.min(i * 35, 300)}ms` }}>
                  <td className="px-4 py-3.5 font-mono text-[12.5px] text-mut">{fmtDate(p.date)}</td>
                  <td className="px-4 py-3.5 font-mono text-[13px] font-semibold text-ink">{doc ? `№ ${doc.number}` : "—"}</td>
                  <td className="max-w-[220px] truncate px-4 py-3.5 text-[13.5px] font-medium text-ink">{doc ? partyName(doc.counterpartyId) : "—"}</td>
                  <td className="px-4 py-3.5 text-[13px] text-mut">{p.method}</td>
                  <td className="max-w-[180px] truncate px-4 py-3.5 text-[12.5px] text-dim">{p.comment ?? "—"}</td>
                  <td className="px-4 py-3.5 text-right font-mono text-[13px] font-semibold text-paid">{fmtMoney(p.amount)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {sorted.length === 0 && (
          <div className="p-12 text-center">
            <IconCoin size={36} className="mx-auto text-dim" />
            <p className="mt-4 font-display text-[15px] font-bold text-ink">Оплат пока нет</p>
            <p className="mt-2 text-[13px] text-mut">Записывайте поступления — документы будут автоматически помечаться «Оплачен»</p>
          </div>
        )}
      </div>

      {adding && (
        <Form docs={docs} parties={parties} paidByDoc={paidByDoc} onSave={(p) => { onAdd(p); setAdding(false); }} onClose={() => setAdding(false)} />
      )}
    </div>
  );
}
