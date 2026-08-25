import { useEffect, useState } from "react";
import {
  amountInWords,
  calc,
  displayName,
  fmtDate,
  fmtMoney,
  personName,
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
import { IconArrow, IconDownload, IconPencil, IconPrint, IconTrash, Logo } from "./icons";

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
    await downloadDocx(doc, party, own, contract?.number);
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

            {/* фирменная шапка: логотип + контакты */}
            <div className="flex items-start justify-between gap-4 border-b-2 border-brand pb-4">
              <div className="flex items-center gap-3">
                <Logo size={48} />
                <div>
                  <p className="font-display text-[15px] font-extrabold leading-tight text-ink">PtoPRO</p>
                  <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-dim">документооборот</p>
                </div>
              </div>
              <div className="text-right text-[10.5px] leading-relaxed text-mut">
                {own.address && <p>{own.address}</p>}
                <p className="mt-0.5">
                  {own.phone ? `тел.: ${own.phone}` : ""}
                  {own.email ? ` · e-mail: ${own.email}` : ""}
                </p>
                {own.website && <p>{own.website}</p>}
              </div>
            </div>

            {/* банковские реквизиты */}
            <table className="mt-4 w-full border-collapse text-[10.5px] leading-snug">
              <tbody>
                <tr>
                  <td className="border border-ink/70 px-2 py-1.5 align-top" rowSpan={2}>
                    <p className="font-semibold">{own.bank}</p>
                    <p className="text-dim">Банк получателя</p>
                  </td>
                  <td className="border border-ink/70 px-2 py-1.5 text-dim">БИК</td>
                  <td className="border border-ink/70 px-2 py-1.5 font-mono">{own.bik}</td>
                </tr>
                <tr>
                  <td className="border border-ink/70 px-2 py-1.5 text-dim">Сч. №</td>
                  <td className="border border-ink/70 px-2 py-1.5 font-mono">{own.corrAccount ?? ""}</td>
                </tr>
                <tr>
                  <td className="border border-ink/70 px-2 py-1.5">
                    ИНН {own.inn ?? "—"}
                  </td>
                  <td className="border border-ink/70 px-2 py-1.5 text-dim">Сч. №</td>
                  <td className="border border-ink/70 px-2 py-1.5 font-mono">{own.account}</td>
                </tr>
                <tr>
                  <td className="border border-ink/70 px-2 py-1.5 font-semibold" colSpan={3}>{displayName(own.name)}</td>
                </tr>
                <tr>
                  <td className="border border-ink/70 px-2 py-1 text-dim" colSpan={3}>Получатель</td>
                </tr>
              </tbody>
            </table>

            {/* заголовок */}
            <h2 className="mt-6 text-center text-[17px] font-bold text-ink">
              {TYPE_META[doc.type]?.title ?? "Документ"} № {doc.number} от {fmtDate(doc.date)} г.
            </h2>

            {/* поставщик / покупатель / основание */}
            <table className="mt-4 w-full border-collapse text-[11.5px] leading-relaxed">
              <tbody>
                <tr>
                  <td className="border border-ink/60 px-2 py-1.5 align-top font-semibold text-dim">Поставщик:</td>
                  <td className="border border-ink/60 px-2 py-1.5">
                    {displayName(own.name)}, ИНН {own.inn ?? "—"}{own.address ? `, ${own.address}` : ""}
                  </td>
                </tr>
                <tr>
                  <td className="border border-ink/60 px-2 py-1.5 align-top font-semibold text-dim">Покупатель:</td>
                  <td className="border border-ink/60 px-2 py-1.5">
                    {party?.name ?? ""}
                    {party?.inn ? `, ИНН ${party.inn}` : ""}
                  </td>
                </tr>
                <tr>
                  <td className="border border-ink/60 px-2 py-1.5 align-top font-semibold text-dim">Основание:</td>
                  <td className="border border-ink/60 px-2 py-1.5">
                    {contract ? `договор № ${contract.number} от ${fmtDate(doc.date)} г.` : "—"}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* позиции с колонкой НДС */}
            <table className="mt-4 w-full border-collapse text-[11.5px]">
              <thead>
                <tr className="bg-soft">
                  {["№", "Товары (работы, услуги)", "Кол-во", "Ед.", "НДС", "Цена", "Сумма"].map((h, i) => (
                    <th key={h} className={`border border-ink/60 px-2 py-2 font-mono text-[9.5px] font-semibold uppercase tracking-[0.06em] text-mut ${i === 1 ? "text-left" : "text-center"}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {doc.items.map((it, i) => (
                  <tr key={it.id}>
                    <td className="border border-ink/60 px-2 py-2 text-center font-mono text-mut">{i + 1}</td>
                    <td className="border border-ink/60 px-2 py-2">{it.name}</td>
                    <td className="border border-ink/60 px-2 py-2 text-center font-mono">{it.qty}</td>
                    <td className="border border-ink/60 px-2 py-2 text-center">{it.unit}</td>
                    <td className="border border-ink/60 px-2 py-2 text-center text-[10.5px] text-mut">{doc.vat ? "20 %" : "Без НДС"}</td>
                    <td className="border border-ink/60 px-2 py-2 text-right font-mono">{fmtMoney(it.price)}</td>
                    <td className="border border-ink/60 px-2 py-2 text-right font-mono font-semibold">{fmtMoney(it.qty * it.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* итоги */}
            <div className="ml-auto mt-3 w-80 text-[12px]">
              <p className="flex justify-between border-b border-line py-1.5"><span className="text-mut">Итого:</span><span className="font-mono font-semibold">{fmtMoney(subtotal)}</span></p>
              <p className="flex justify-between border-b border-line py-1.5">
                <span className="text-mut">Сумма НДС:</span>
                <span className="font-mono font-semibold">{doc.vat ? fmtMoney(vat) : "0,00"}</span>
              </p>
              <p className="flex justify-between py-2 text-[14px] font-bold">
                <span>Всего к оплате:</span><span className="font-mono">{fmtMoney(total)}</span>
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

            <div className="mt-14 grid grid-cols-2 gap-8 text-[11.5px]">
              <div>
                <p className="border-b border-dotted border-ink pb-1 text-center" />
                <p className="mt-1 text-center font-semibold">{displayName(own.name)}</p>
              </div>
              <div>
                <p className="border-b border-dotted border-ink pb-1 text-center" />
                <p className="mt-1 text-center">Бухгалтер {personName(own.name)}</p>
              </div>
            </div>

            <div className="mt-10 flex items-end justify-between gap-4 border-t-2 border-ink pt-4">
              {/* фирменная печать */}
              <svg width="86" height="86" viewBox="0 0 100 100" className="shrink-0 -rotate-12 opacity-80" aria-hidden="true">
                <circle cx="50" cy="50" r="47" fill="none" stroke="#2743c7" strokeWidth="2.5" />
                <circle cx="50" cy="50" r="36" fill="none" stroke="#2743c7" strokeWidth="1.5" />
                <circle cx="50" cy="50" r="20" fill="none" stroke="#2743c7" strokeWidth="1" />
                <text x="50" y="47" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#2743c7" fontFamily="Arial">
                  {own.short}
                </text>
                <text x="50" y="57" textAnchor="middle" fontSize="5.5" fill="#2743c7" fontFamily="Arial">
                  ДЛЯ ДОКУМЕНТОВ
                </text>
              </svg>
              <div className="min-w-0 flex-1 text-right">
                <p className="font-display text-[11px] font-bold tracking-[0.08em] text-ink">{own.short}</p>
                <p className="mt-1 text-[10px] leading-relaxed text-mut">
                  {[own.address, own.phone, own.email, own.website].filter(Boolean).join("  ·  ") || "реквизиты не заполнены"}
                </p>
              </div>
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
