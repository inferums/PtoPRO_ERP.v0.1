import { useState } from "react";
import {
  calc,
  fmtDate,
  fmtMoney,
  paidOf,
  todayISO,
  uid,
  type Doc,
  type Party,
  type Payment,
} from "../lib/store";
import { IconClose, IconCoin, IconPlus } from "./icons";

function Form({
  docs,
  parties,
  payments,
  onSave,
  onClose,
  presetDocId,
}: {
  docs: Doc[];
  parties: Party[];
  payments: Payment[];
  onSave: (p: Payment) => void;
  onClose: () => void;
  presetDocId?: string;
}) {
  const [f, setF] = useState<Payment>({
    id: uid(),
    docId: presetDocId ?? docs[0]?.id ?? "",
    date: todayISO(),
    amount: 0,
    method: "Банковский перевод",
    comment: "",
  });
  const partyName = (id: string) => parties.find((p) => p.id === id)?.name ?? "—";
  const sel = docs.find((d) => d.id === f.docId);
  const remaining = sel ? Math.max(calc(sel).total - paidOf(sel.id, payments), 0) : 0;
  const inp =
    "w-full border border-line bg-white px-3 py-2.5 text-[13.5px] text-ink outline-none transition-colors placeholder:text-dim focus:border-brand";
  const lbl = "mb-1.5 block font-mono text-[10.5px] uppercase tracking-[0.14em] text-mut";

  return (
    <div className="overlay-in fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-navy/70 p-4" onClick={onClose}>
      <div className="modal-in w-full max-w-lg border border-line bg-surface p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-display text-[16px] font-bold text-ink">Записать оплату</h3>
          <button onClick={onClose} className="cursor-pointer border border-line p-2 text-mut hover:border-navy hover:text-navy">
            <IconClose size={14} />
          </button>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={lbl}>Документ</label>
            <select value={f.docId} onChange={(e) => setF({ ...f, docId: e.target.value })} className={inp}>
              {docs.map((d) => (
                <option key={d.id} value={d.id}>
                  № {d.number} · {d.type === "invoice" ? "Счёт" : "Акт"} · {partyName(d.counterpartyId)} · {fmtMoney(calc(d).total)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={lbl}>Дата</label>
            <input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} className={inp} />
          </div>
          <div>
            <label className={lbl}>Сумма, ₽</label>
            <input type="number" min={0} value={f.amount || ""} onChange={(e) => setF({ ...f, amount: Number(e.target.value) || 0 })} className={inp} />
          </div>
          <div className="sm:col-span-2">
            <label className={lbl}>Способ</label>
            <select value={f.method} onChange={(e) => setF({ ...f, method: e.target.value })} className={inp}>
              <option>Банковский перевод</option>
              <option>Наличные</option>
              <option>Карта</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={lbl}>Комментарий</label>
            <input value={f.comment ?? ""} onChange={(e) => setF({ ...f, comment: e.target.value })} placeholder="по договору 12/25" className={inp} />
          </div>
        </div>

        {sel && (
          <div className="mt-4 flex items-center justify-between border border-line bg-soft px-4 py-3">
            <span className="font-mono text-[11px] text-mut">осталось по № {sel.number}</span>
            <span className="font-mono text-[13px] font-semibold text-ink">{fmtMoney(remaining)}</span>
            <button
              onClick={() => setF({ ...f, amount: remaining })}
              className="cursor-pointer border border-brand px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-brand hover:bg-brand hover:text-white"
            >
              внести всё
            </button>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2.5">
          <button onClick={onClose} className="cursor-pointer border border-line px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.1em] text-mut hover:text-ink">
            отмена
          </button>
          <button
            onClick={() => f.docId && f.amount > 0 && onSave(f)}
            className="cursor-pointer bg-brand px-5 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:bg-brand2"
          >
            записать
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
  const partyName = (id: string) => parties.find((p) => p.id === id)?.name ?? "—";
  const sorted = [...payments].sort((a, b) => b.date.localeCompare(a.date));
  const total = payments.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="fade-up">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-dim">
          платежей: {payments.length} · получено: <span className="text-paid">{fmtMoney(total)}</span>
        </p>
        <button
          onClick={() => setAdding(true)}
          className="flex cursor-pointer items-center gap-2 bg-brand px-4 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:bg-brand2"
        >
          <IconPlus size={13} /> оплата
        </button>
      </div>

      <div className="mt-4 overflow-x-auto border border-line bg-surface">
        <table className="w-full min-w-[640px] border-collapse text-left">
          <thead>
            <tr className="border-b border-line bg-soft">
              {["Дата", "Документ", "Контрагент", "Способ", "Сумма"].map((h, i) => (
                <th key={h} className={`px-4 py-3 font-mono text-[10.5px] font-medium uppercase tracking-[0.14em] text-dim ${i === 4 ? "text-right" : ""}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {sorted.map((p, i) => {
              const doc = docs.find((d) => d.id === p.docId);
              return (
                <tr key={p.id} className="fade-up transition-colors hover:bg-soft" style={{ animationDelay: `${i * 40}ms` }}>
                  <td className="px-4 py-3.5 font-mono text-[12.5px] text-mut">{fmtDate(p.date)}</td>
                  <td className="px-4 py-3.5">
                    <span className="font-mono text-[13px] font-semibold text-ink">№ {doc?.number ?? "—"}</span>
                    {p.comment && <span className="mt-0.5 block text-[11.5px] text-dim">{p.comment}</span>}
                  </td>
                  <td className="max-w-[220px] truncate px-4 py-3.5 text-[13px] font-medium text-ink">
                    {doc ? partyName(doc.counterpartyId) : "—"}
                  </td>
                  <td className="px-4 py-3.5 text-[12.5px] text-mut">{p.method}</td>
                  <td className="px-4 py-3.5 text-right font-mono text-[13.5px] font-semibold text-paid">+{fmtMoney(p.amount)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {sorted.length === 0 && (
          <div className="p-12 text-center">
            <IconCoin size={36} className="mx-auto text-dim" />
            <p className="mt-4 font-display text-[15px] font-bold text-ink">Платежей пока нет</p>
            <p className="mt-2 text-[13px] text-mut">Запишите первую оплату — она появится и в карточке счёта</p>
          </div>
        )}
      </div>

      {adding && <Form docs={docs} parties={parties} payments={payments} onSave={(p) => { onAdd(p); setAdding(false); }} onClose={() => setAdding(false)} />}
    </div>
  );
}
