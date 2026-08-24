import { useEffect, useState } from "react";
import {
  amountInWords,
  calc,
  displayName,
  fmtDate,
  fmtMoney,
  suggestPaymentName,
  STATUS_META,
  TYPE_META,
  type Contract,
  type Doc,
  type DocStatus,
  type Own,
  type Party,
  type Payment,
} from "../lib/store";
import PaymentForm from "./PaymentForm";
import { IconArrow, IconDownload, IconPencil, IconPrint, IconTrash } from "./icons";

function Stamp({ date, short }: { date: string; short: string }) {
  return (
    <div className="stamp-in pointer-events-none absolute right-10 top-[52%] z-10 grid h-36 w-36 place-items-center rounded-full border-[3px] border-stamp/70 text-stamp mix-blend-multiply">
      <div className="grid h-[128px] w-[128px] place-items-center rounded-full border border-stamp/70 text-center">
        <div>
          <p className="font-display text-[13px] font-extrabold tracking-[0.16em]">ОПЛАЧЕНО</p>
          <p className="mt-1 font-mono text-[10px]">{fmtDate(date)}</p>
          <p className="mt-0.5 font-mono text-[9px] opacity-80">{short}</p>
        </div>
      </div>
    </div>
  );
}

export default function DocumentPreview({
  doc,
  party,
  own,
  contract,
  payments,
  onClose,
  onStatus,
  onEdit,
  onQuickPay,
  onAddPayment,
  onUpdatePayment,
  onDeletePayment,
}: {
  doc: Doc;
  party: Party | undefined;
  own: Own;
  contract?: Contract;
  payments: Payment[];
  onClose: () => void;
  onStatus: (id: string, s: DocStatus) => void;
  onEdit: (doc: Doc) => void;
  onQuickPay: (amount: number) => void;
  onAddPayment: (p: Payment) => void;
  onUpdatePayment: (p: Payment) => void;
  onDeletePayment: (id: string) => void;
}) {
  const meta = STATUS_META[doc.status];
  const { subtotal, vat, total } = calc(doc);
  const paid = payments.reduce((s, p) => s + p.amount, 0);
  const rest = Math.max(total - paid, 0);

  const [payForm, setPayForm] = useState<null | { mode: "add" } | { mode: "edit"; pay: Payment }>(null);
  const [confirmPay, setConfirmPay] = useState<string | null>(null);

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const downloadWord = async () => {
    const { downloadDocx } = await import("../lib/docx");
    await downloadDocx(doc, party, own);
  };

  const docOption = {
    id: doc.id,
    label: `№ ${doc.number} · ${fmtMoney(total)}`,
    total,
    paid,
    suggestedName: suggestPaymentName(doc, contract),
  };

  return (
    <div
      className="overlay-in fixed inset-0 z-50 overflow-y-auto bg-[#39424e]/55 p-3 sm:p-6"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="modal-in mx-auto w-full max-w-[1060px] overflow-hidden rounded-xl bg-bg shadow-[0_50px_110px_-30px_rgba(28,36,50,0.6)]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* панель действий — внутри карточки */}
        <div className="flex flex-wrap items-center gap-2 border-b border-line bg-surface px-4 py-3">
          <button
            onClick={onClose}
            className="flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-2 font-mono text-[11px] uppercase tracking-[0.08em] text-mut transition-colors hover:bg-soft hover:text-ink"
          >
            <IconArrow size={13} className="rotate-180" /> закрыть
          </button>
          <span className="hidden min-w-0 items-baseline gap-2 sm:flex">
            <span className="truncate font-display text-[14px] font-bold text-ink">
              {TYPE_META[doc.type]?.label ?? "Документ"} № {doc.number}
            </span>
            <span className="truncate text-[12px] text-mut">{party?.name}</span>
          </span>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-dim">
              статус
              <select
                value={doc.status}
                onChange={(e) => onStatus(doc.id, e.target.value as DocStatus)}
                className="cursor-pointer rounded-md border border-line bg-white px-2 py-1.5 font-mono text-[11px] normal-case tracking-normal text-ink outline-none transition-colors focus:border-brand"
              >
                {(Object.keys(STATUS_META) as DocStatus[]).map((s) => (
                  <option key={s} value={s}>{STATUS_META[s].label}</option>
                ))}
              </select>
            </label>
            <button onClick={() => onEdit(doc)} className="grid h-8 w-8 cursor-pointer place-items-center rounded-md text-mut transition-colors hover:bg-soft hover:text-ink" title="Изменить">
              <IconPencil size={15} />
            </button>
            <button onClick={() => window.print()} className="grid h-8 w-8 cursor-pointer place-items-center rounded-md text-mut transition-colors hover:bg-soft hover:text-ink" title="Печать">
              <IconPrint size={15} />
            </button>
            <button onClick={downloadWord} className="flex cursor-pointer items-center gap-1.5 rounded-md bg-brand px-3 py-2 font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-white transition-all hover:bg-brand2" title="Скачать Word">
              <IconDownload size={13} /> word
            </button>
          </div>
        </div>

        <div className="grid gap-5 p-4 sm:p-5 lg:grid-cols-[1fr_290px]">
          {/* лист А4 */}
          <div id="print-sheet" className="relative h-fit w-full bg-white px-8 py-9 text-ink shadow-[0_24px_60px_-24px_rgba(28,36,50,0.45)] sm:px-11 sm:py-10">
            {doc.status === "paid" && <Stamp date={doc.date} short={own.short} />}

            <div className="grid grid-cols-[1.25fr_1fr] border border-ink/80 text-[11.5px] leading-relaxed">
              <div className="border-r border-ink/80 p-3">
                <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-dim">Поставщик</span>
                <p className="mt-1 font-semibold">{displayName(own.name)}</p>
                <p className="mt-0.5">ИНН {own.inn ?? "—"}</p>
                {own.address && <p>{own.address}</p>}
              </div>
              <div className="flex flex-col">
                <div className="flex-1 border-b border-ink/80 p-3">{own.bank}</div>
                <div className="grid grid-cols-2">
                  <div className="border-r border-ink/80 p-3">
                    <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-dim">БИК</span>
                    <p className="mt-0.5 font-mono">{own.bik}</p>
                  </div>
                  <div className="p-3">
                    <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-dim">Счёт</span>
                    <p className="mt-0.5 font-mono">{own.account}</p>
                  </div>
                </div>
              </div>
            </div>

            <h2 className="mt-8 font-display text-[22px] font-extrabold tracking-[0.04em]">
              {TYPE_META[doc.type]?.title ?? "Документ"} № {doc.number}
            </h2>
            <p className="mt-1 text-[13px] text-mut">от {fmtDate(doc.date)}</p>
            {contract && (
              <p className="mt-1 text-[12px] text-mut">
                Основание: договор № {contract.number} — {contract.subject}
              </p>
            )}

            <div className="mt-6 text-[12.5px] leading-relaxed">
              <p>
                <span className="font-semibold">Покупатель:</span> {party?.name ?? "— не указан —"}
                {party?.inn ? `, ИНН ${party.inn}` : ""}
              </p>
              {party?.person && <p className="text-mut">Контактное лицо: {party.person}</p>}
            </div>

            <table className="mt-7 w-full border-collapse text-[12px]">
              <thead>
                <tr className="bg-soft">
                  {["№", "Наименование", "Кол-во", "Ед.", "Цена", "Сумма"].map((h, i) => (
                    <th key={h} className={`border border-line2 px-2.5 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-mut ${i === 1 ? "text-left" : "text-center"} ${i >= 4 ? "text-right" : ""}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {doc.items.map((it, i) => (
                  <tr key={it.id}>
                    <td className="border border-line2 px-2.5 py-2 text-center font-mono text-mut">{i + 1}</td>
                    <td className="border border-line2 px-2.5 py-2">{it.name}</td>
                    <td className="border border-line2 px-2.5 py-2 text-center font-mono">{it.qty}</td>
                    <td className="border border-line2 px-2.5 py-2 text-center">{it.unit}</td>
                    <td className="border border-line2 px-2.5 py-2 text-right font-mono">{fmtMoney(it.price)}</td>
                    <td className="border border-line2 px-2.5 py-2 text-right font-mono font-semibold">{fmtMoney(it.qty * it.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="ml-auto mt-5 w-72 text-[12.5px]">
              <p className="flex justify-between py-1"><span className="text-mut">Итого:</span><span className="font-mono font-semibold">{fmtMoney(subtotal)}</span></p>
              <p className="flex justify-between py-1">
                <span className="text-mut">{doc.vat ? "в т.ч. НДС 20 %:" : "НДС:"}</span>
                <span className="font-mono font-semibold">{doc.vat ? fmtMoney(vat) : "не облагается"}</span>
              </p>
              <p className="mt-1 flex justify-between border-t-2 border-ink pt-2.5 text-[15px] font-bold">
                <span>ВСЕГО К ОПЛАТЕ:</span><span className="font-mono">{fmtMoney(total)}</span>
              </p>
              {paid > 0 && (
                <p className="mt-2 flex items-baseline justify-between text-[12.5px]">
                  <span className="text-mut">Оплачено:</span>
                  <span className={`font-mono font-semibold ${rest === 0 ? "text-paid" : "text-[#00796b]"}`}>
                    {fmtMoney(paid)} из {fmtMoney(total)}
                  </span>
                </p>
              )}
              {paid > 0 && (
                <div className="mt-1.5 h-1 w-full bg-bg">
                  <div className={`h-full transition-all duration-700 ${rest === 0 ? "bg-paid" : "bg-[#26a69a]"}`} style={{ width: `${Math.min((paid / total) * 100, 100)}%` }} />
                </div>
              )}
            </div>

            <p className="mt-6 text-[12px] italic text-mut">{amountInWords(total)}</p>
            {doc.note && <p className="mt-4 text-[12px]"><span className="font-semibold">Примечание:</span> {doc.note}</p>}

            <div className="mt-12 grid grid-cols-2 gap-10 text-[12.5px]">
              <p>
                Руководитель
                <span className="mx-3 inline-block w-32 border-b border-dotted border-ink align-baseline" />
                {own.director}
              </p>
              <p>
                Бухгалтер
                <span className="mx-3 inline-block w-32 border-b border-dotted border-ink align-baseline" />
              </p>
            </div>

            <div className="mt-10 border-t-2 border-ink pt-3">
              <p className="text-center font-display text-[11px] font-bold tracking-[0.08em] text-ink">{own.short}</p>
              <p className="mt-1 text-center text-[10.5px] leading-relaxed text-mut">
                {[own.address, own.phone, own.email, own.website].filter(Boolean).join("  ·  ") || "реквизиты не заполнены"}
              </p>
            </div>
          </div>

          {/* панель оплат */}
          <div className="space-y-3">
            <div className="rounded-xl border border-line bg-surface shadow-sm">
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-mut">Оплаты · {payments.length}</p>
                <button
                  onClick={() => setPayForm({ mode: "add" })}
                  className="cursor-pointer rounded-md bg-paid px-2.5 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-white transition-colors hover:bg-[#268257]"
                >
                  + оплата
                </button>
              </div>
              <div className="divide-y divide-line">
                {payments.map((p) => (
                  <div key={p.id} className="group flex items-start gap-2.5 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12.5px] font-semibold text-ink" title={p.name}>{p.name}</p>
                      <p className="mt-0.5 font-mono text-[10px] text-dim">{fmtDate(p.date)} · {p.method}</p>
                    </div>
                    <span className="font-mono text-[12.5px] font-bold text-paid">{fmtMoney(p.amount)}</span>
                    <span className="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                      <button onClick={() => setPayForm({ mode: "edit", pay: p })} className="cursor-pointer rounded-md p-1.5 text-mut transition-colors hover:bg-soft hover:text-ink" title="Изменить оплату">
                        <IconPencil size={12} />
                      </button>
                      {confirmPay === p.id ? (
                        <button
                          onClick={() => { onDeletePayment(p.id); setConfirmPay(null); }}
                          className="cursor-pointer rounded-md bg-danger px-1.5 py-1 font-mono text-[8.5px] font-semibold uppercase text-white hover:bg-[#c74444]"
                        >
                          да
                        </button>
                      ) : (
                        <button onClick={() => setConfirmPay(p.id)} className="cursor-pointer rounded-md p-1.5 text-mut transition-colors hover:bg-[#fbe7e5] hover:text-danger" title="Удалить оплату">
                          <IconTrash size={12} />
                        </button>
                      )}
                    </span>
                  </div>
                ))}
                {payments.length === 0 && <p className="px-4 py-5 text-center text-[12px] text-mut">Оплат по документу пока нет</p>}
              </div>
              <div className="border-t border-line px-4 py-3">
                <div className="flex items-baseline justify-between text-[12.5px]">
                  <span className="text-mut">Оплачено</span>
                  <span className={`font-mono font-semibold ${rest === 0 ? "text-paid" : "text-[#00796b]"}`}>{fmtMoney(paid)} / {fmtMoney(total)}</span>
                </div>
                <div className="mt-2 h-1.5 w-full bg-bg">
                  <div className={`h-full rounded-full transition-all duration-700 ${rest === 0 ? "bg-paid" : "bg-[#26a69a]"}`} style={{ width: `${total ? Math.min((paid / total) * 100, 100) : 0}%` }} />
                </div>
                {rest > 0 && doc.status !== "draft" && (
                  <button
                    onClick={() => onQuickPay(rest)}
                    className="mt-3 w-full cursor-pointer rounded-md bg-paid py-2.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#268257]"
                  >
                    записать остаток · {fmtMoney(rest)}
                  </button>
                )}
                {rest === 0 && paid > 0 && doc.status !== "paid" && (
                  <button
                    onClick={() => onStatus(doc.id, "paid")}
                    className="mt-3 w-full cursor-pointer rounded-md bg-brand py-2.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:bg-brand2"
                  >
                    пометить «Оплачен»
                  </button>
                )}
              </div>
            </div>

            <div className={`rounded-xl border px-4 py-3 text-center shadow-sm ${meta.chip}`}>
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] opacity-70">текущий статус</p>
              <p className="mt-1 font-display text-[14px] font-bold">{meta.label}</p>
            </div>
          </div>
        </div>
      </div>

      {payForm && (
        <PaymentForm
          title={payForm.mode === "add" ? `Новая оплата · № ${doc.number}` : "Редактирование оплаты"}
          docs={payForm.mode === "add" ? [docOption] : undefined}
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
