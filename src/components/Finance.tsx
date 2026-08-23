import { useMemo, useState } from "react";
import {
  calc,
  fmtMoney,
  fmtDate,
  netProfit,
  todayISO,
  uid,
  type Contract,
  type Doc,
  type Party,
  type Payment,
} from "../lib/store";
import { IconClose, IconCoin, IconPlus } from "./icons";

const METHODS = ["Банковский перевод", "Наличные", "Карта"];

function PayForm({
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
            <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="по договору Д-002/2024" className={inp} />
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

export default function Finance({
  contracts,
  docs,
  payments,
  parties,
  onAddPayment,
  onOpenContract,
}: {
  contracts: Contract[];
  docs: Doc[];
  payments: Payment[];
  parties: Party[];
  onAddPayment: (p: Payment) => void;
  onOpenContract: (id: string) => void;
}) {
  const [adding, setAdding] = useState(false);

  const sumIncome = contracts.reduce((s, c) => s + c.actualIncome, 0);
  const sumExpense = contracts.reduce((s, c) => s + c.actualExpense, 0);
  const profit = sumIncome - sumExpense;
  const received = payments.reduce((s, p) => s + p.amount, 0);

  const paidByDoc = useMemo(() => {
    const m = new Map<string, number>();
    payments.forEach((p) => m.set(p.docId, (m.get(p.docId) ?? 0) + p.amount));
    return m;
  }, [payments]);

  const partyName = (id: string) => parties.find((p) => p.id === id)?.name ?? "—";
  const docById = (id: string) => docs.find((d) => d.id === id);
  const sortedPays = [...payments].sort((a, b) => b.date.localeCompare(a.date));

  const stat = (label: string, value: number, color: string) => (
    <div className="border border-line bg-surface px-4 py-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_34px_-16px_rgba(14,36,60,0.3)]">
      <p className="text-center text-[11px] font-medium text-mut">{label}</p>
      <p className={`mt-1.5 text-center font-display text-[22px] font-extrabold leading-tight ${color}`}>{fmtMoney(value)}</p>
    </div>
  );

  return (
    <div className="fade-up space-y-4">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {stat("Доходы (факт)", sumIncome, "text-[#2E7D32]")}
        {stat("Расходы (факт)", sumExpense, "text-[#C62828]")}
        {stat("Чистая прибыль", profit, profit >= 0 ? "text-[#2E7D32]" : "text-[#C62828]")}
        {stat("Получено оплат", received, "text-[#1a237e]")}
      </div>

      {/* P&L по договорам */}
      <div className="overflow-x-auto border border-line bg-surface">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h3 className="font-display text-[14px] font-bold text-ink">Прибыли и убытки по договорам</h3>
          <span className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-dim">план / факт</span>
        </div>
        <table className="w-full min-w-[820px] border-collapse text-left">
          <thead>
            <tr className="border-b border-line bg-soft">
              {["Договор", "Предмет", "План доход", "План расход", "Факт доход", "Факт расход", "Чистая прибыль"].map((h) => (
                <th key={h} className={`px-3 py-2.5 font-mono text-[10.5px] font-medium uppercase tracking-[0.12em] text-dim ${h === "Договор" || h === "Предмет" ? "" : "text-right"}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {contracts.map((c, i) => {
              const np = netProfit(c);
              return (
                <tr key={c.id} onClick={() => onOpenContract(c.id)} className="fade-up cursor-pointer transition-colors hover:bg-soft" style={{ animationDelay: `${Math.min(i * 35, 280)}ms` }}>
                  <td className="px-3 py-3 font-mono text-[12.5px] font-semibold text-brand">{c.number}</td>
                  <td className="max-w-[220px] truncate px-3 py-3 text-[13px] font-medium text-ink">{c.subject}</td>
                  <td className="px-3 py-3 text-right font-mono text-[12.5px] text-mut">{fmtMoney(c.plannedIncome)}</td>
                  <td className="px-3 py-3 text-right font-mono text-[12.5px] text-mut">{fmtMoney(c.plannedExpense)}</td>
                  <td className="px-3 py-3 text-right font-mono text-[12.5px] text-[#2E7D32]">{fmtMoney(c.actualIncome)}</td>
                  <td className="px-3 py-3 text-right font-mono text-[12.5px] text-[#C62828]">{fmtMoney(c.actualExpense)}</td>
                  <td className={`px-3 py-3 text-right font-mono text-[13px] font-semibold ${np >= 0 ? "text-[#2E7D32]" : "text-[#C62828]"}`}>{fmtMoney(np)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {contracts.length === 0 && <p className="p-10 text-center text-[13px] text-mut">Договоров пока нет — создайте первый в разделе «Договоры»</p>}
      </div>

      {/* реестр оплат */}
      <div className="overflow-x-auto border border-line bg-surface">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h3 className="font-display text-[14px] font-bold text-ink">Реестр платежей · {payments.length}</h3>
          <button
            onClick={() => setAdding(true)}
            disabled={docs.length === 0}
            className="flex cursor-pointer items-center gap-2 bg-paid px-3.5 py-2 font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#268257] disabled:cursor-not-allowed disabled:opacity-50"
            title={docs.length === 0 ? "Сначала создайте документ" : ""}
          >
            <IconPlus size={12} /> оплата
          </button>
        </div>
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead>
            <tr className="border-b border-line bg-soft">
              {["Дата", "Документ", "Контрагент", "Способ", "Комментарий", "Сумма"].map((h, i) => (
                <th key={h} className={`px-3 py-2.5 font-mono text-[10.5px] font-medium uppercase tracking-[0.12em] text-dim ${i === 5 ? "text-right" : ""}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {sortedPays.map((p) => {
              const doc = docById(p.docId);
              return (
                <tr key={p.id} className="transition-colors hover:bg-soft">
                  <td className="px-3 py-3 font-mono text-[12px] text-mut">{fmtDate(p.date)}</td>
                  <td className="px-3 py-3 font-mono text-[12.5px] font-semibold text-ink">{doc ? `№ ${doc.number}` : "—"}</td>
                  <td className="max-w-[200px] truncate px-3 py-3 text-[13px] font-medium text-ink">{doc ? partyName(doc.counterpartyId) : "—"}</td>
                  <td className="px-3 py-3 text-[12.5px] text-mut">{p.method}</td>
                  <td className="max-w-[170px] truncate px-3 py-3 text-[12px] text-dim">{p.comment ?? "—"}</td>
                  <td className="px-3 py-3 text-right font-mono text-[12.5px] font-semibold text-paid">{fmtMoney(p.amount)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {sortedPays.length === 0 && (
          <div className="p-10 text-center">
            <IconCoin size={30} className="mx-auto text-dim" />
            <p className="mt-3 text-[13px] text-mut">Оплат пока нет — записывайте поступления, и документы будут помечаться «Оплачен»</p>
          </div>
        )}
      </div>

      {adding && (
        <PayForm docs={docs} parties={parties} paidByDoc={paidByDoc} onSave={(p) => { onAddPayment(p); setAdding(false); }} onClose={() => setAdding(false)} />
      )}
    </div>
  );
}
