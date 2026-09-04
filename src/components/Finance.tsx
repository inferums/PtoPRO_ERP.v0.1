import { useMemo, useState } from "react";
import {
  calc,
  fmtMoney,
  fmtDate,
  contractActuals,
  suggestPaymentName,
  type Contract,
  type Doc,
  type Party,
  type Payment,
} from "../lib/store";
import { IconCoin, IconPencil, IconPlus, IconTrash } from "./icons";
import PaymentForm from "./PaymentForm";

export default function Finance({
  contracts,
  docs,
  payments,
  parties,
  onAddPayment,
  onUpdatePayment,
  onDeletePayment,
  onOpenContract,
}: {
  contracts: Contract[];
  docs: Doc[];
  payments: Payment[];
  parties: Party[];
  onAddPayment: (p: Payment) => void;
  onUpdatePayment: (p: Payment) => void;
  onDeletePayment: (id: string) => void;
  onOpenContract: (id: string) => void;
}) {
  const [payForm, setPayForm] = useState<null | { mode: "add" } | { mode: "edit"; pay: Payment }>(null);
  const [confirmPay, setConfirmPay] = useState<string | null>(null);

  /* фактические значения каждого договора — из оплат */
  const actualsById = useMemo(() => {
    const m = new Map<string, { income: number; expense: number; profit: number }>();
    contracts.forEach((c) => m.set(c.id, contractActuals(c, docs, payments, contracts)));
    return m;
  }, [contracts, docs, payments]);

  const sumIncome = contracts.reduce((s, c) => s + (actualsById.get(c.id)?.income ?? 0), 0);
  const sumExpense = contracts.reduce((s, c) => s + (actualsById.get(c.id)?.expense ?? 0), 0);
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
    <div className="rounded-xl border border-line bg-surface px-4 py-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_34px_-16px_rgba(14,36,60,0.3)]">
      <p className="text-center text-[11px] font-semibold text-mut">{label}</p>
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
      <div className="overflow-x-auto rounded-xl border border-line bg-surface shadow-sm">
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
              const a = actualsById.get(c.id) ?? { income: 0, expense: 0, profit: 0 };
              const np = a.profit;
              return (
                <tr key={c.id} onClick={() => onOpenContract(c.id)} className="fade-up cursor-pointer transition-colors hover:bg-soft" style={{ animationDelay: `${Math.min(i * 35, 280)}ms` }}>
                  <td className="px-3 py-3 font-mono text-[12.5px] font-semibold text-brand">{c.number}</td>
                  <td className="max-w-[220px] truncate px-3 py-3 text-[13px] font-medium text-ink">{c.subject}</td>
                  <td className="px-3 py-3 text-right font-mono text-[12.5px] text-mut">{fmtMoney(c.plannedIncome)}</td>
                  <td className="px-3 py-3 text-right font-mono text-[12.5px] text-mut">{fmtMoney(c.plannedExpense)}</td>
                  <td className="px-3 py-3 text-right font-mono text-[12.5px] text-[#2E7D32]">{fmtMoney(a.income)}</td>
                  <td className="px-3 py-3 text-right font-mono text-[12.5px] text-[#C62828]">{fmtMoney(a.expense)}</td>
                  <td className={`px-3 py-3 text-right font-mono text-[13px] font-semibold ${np >= 0 ? "text-[#2E7D32]" : "text-[#C62828]"}`}>{fmtMoney(np)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {contracts.length === 0 && <p className="p-10 text-center text-[13px] text-mut">Договоров пока нет — создайте первый в разделе «Договоры»</p>}
      </div>

      {/* реестр оплат */}
      <div className="overflow-x-auto rounded-xl border border-line bg-surface shadow-sm">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h3 className="font-display text-[14px] font-bold text-ink">Реестр платежей · {payments.length}</h3>
          <button
            onClick={() => setPayForm({ mode: "add" })}
            className="flex cursor-pointer items-center gap-2 rounded-md bg-paid px-3.5 py-2 font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#268257]"
            title="Оплату можно привязать к документу или оставить без привязки"
          >
            <IconPlus size={12} /> оплата
          </button>
        </div>
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead>
            <tr className="border-b border-line bg-soft">
              {["Дата", "Наименование", "Документ", "Контрагент", "Способ", "Сумма", ""].map((h, i) => (
                <th key={i} className={`px-3 py-2.5 font-mono text-[10.5px] font-medium uppercase tracking-[0.12em] text-dim ${i === 5 ? "text-right" : ""}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {sortedPays.map((p) => {
              const doc = docById(p.docId);
              return (
                <tr key={p.id} className="group transition-colors hover:bg-soft">
                  <td className="px-3 py-3 font-mono text-[12px] text-mut">{fmtDate(p.date)}</td>
                  <td className="max-w-[240px] truncate px-3 py-3 text-[13px] font-medium text-ink" title={p.name}>{p.name}</td>
                  <td className="px-3 py-3 font-mono text-[12.5px] font-semibold text-ink">{doc ? `№ ${doc.number}` : "—"}</td>
                  <td className="max-w-[180px] truncate px-3 py-3 text-[13px] text-mut">{doc ? partyName(doc.counterpartyId) : "—"}</td>
                  <td className="px-3 py-3 text-[12.5px] text-mut">{p.method}</td>
                  <td className="px-3 py-3 text-right font-mono text-[12.5px] font-semibold text-paid">{fmtMoney(p.amount)}</td>
                  <td className="px-3 py-3">
                    <div className="flex justify-end gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      <button
                        onClick={() => setPayForm({ mode: "edit", pay: p })}
                        className="cursor-pointer rounded-md p-1.5 text-mut transition-colors hover:bg-line/60 hover:text-ink"
                        title="Редактировать"
                      >
                        <IconPencil size={13} />
                      </button>
                      {confirmPay === p.id ? (
                        <button
                          onClick={() => {
                            onDeletePayment(p.id);
                            setConfirmPay(null);
                          }}
                          className="cursor-pointer rounded-md bg-danger px-2 py-1 font-mono text-[9px] font-semibold uppercase tracking-[0.06em] text-white hover:bg-[#c74444]"
                        >
                          удалить
                        </button>
                      ) : (
                        <button
                          onClick={() => setConfirmPay(p.id)}
                          className="cursor-pointer rounded-md p-1.5 text-mut transition-colors hover:bg-[#fbe7e5] hover:text-danger"
                          title="Удалить"
                        >
                          <IconTrash size={13} />
                        </button>
                      )}
                    </div>
                  </td>
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

      {payForm && (
        <PaymentForm
          title={payForm.mode === "add" ? "Новая оплата" : "Редактирование оплаты"}
          docs={
            payForm.mode === "add"
              ? docs.map((d) => ({
                  id: d.id,
                  label: `№ ${d.number} · ${partyName(d.counterpartyId)} · ${fmtMoney(calc(d).total)}`,
                  total: calc(d).total,
                  paid: paidByDoc.get(d.id) ?? 0,
                  suggestedName: suggestPaymentName(d, contracts.find((c) => c.id === d.contractId)),
                }))
              : undefined
          }
          initial={payForm.mode === "edit" ? payForm.pay : null}
          onSave={(p) => {
            if (payForm.mode === "add") onAddPayment(p);
            else onUpdatePayment(p);
            setPayForm(null);
          }}
          onClose={() => setPayForm(null)}
        />
      )}
    </div>
  );
}
