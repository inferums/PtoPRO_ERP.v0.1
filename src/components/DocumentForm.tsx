import { useEffect, useState } from "react";
import {
  fmtMoney,
  todayISO,
  uid,
  TYPE_META,
  type Doc,
  type DocType,
  type LineItem,
  type Party,
} from "../lib/store";
import { IconClose, IconPlus } from "./icons";

const inp =
  "w-full border border-line bg-white px-3 py-2.5 text-[13.5px] text-ink outline-none transition-colors placeholder:text-dim focus:border-brand";
const lbl = "mb-1.5 block font-mono text-[10.5px] uppercase tracking-[0.14em] text-mut";

const emptyItem = (): LineItem => ({ id: uid(), name: "", qty: 1, unit: "услуга", price: 0 });

export default function DocumentForm({
  initial,
  parties,
  contracts,
  fallbackNumber,
  onSave,
  onClose,
}: {
  initial: Doc | null;
  parties: Party[];
  contracts: { id: string; number: string; subject: string }[];
  fallbackNumber: number;
  onSave: (doc: Doc) => void;
  onClose: () => void;
}) {
  const [type, setType] = useState<DocType>(initial?.type ?? "invoice");
  const [date, setDate] = useState(initial?.date ?? todayISO());
  const [counterpartyId, setCounterpartyId] = useState(initial?.counterpartyId ?? parties[0]?.id ?? "");
  const [contractId, setContractId] = useState(initial?.contractId ?? "");
  const [vat, setVat] = useState(initial?.vat ?? false);
  const [note, setNote] = useState(initial?.note ?? "");
  const [items, setItems] = useState<LineItem[]>(initial ? initial.items.map((i) => ({ ...i })) : [emptyItem()]);
  const [errors, setErrors] = useState<{ party?: string; items?: string }>({});

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const subtotal = items.reduce((s, it) => s + it.qty * it.price, 0);
  const vatSum = vat ? Math.round((subtotal * 20) / 120) : 0;

  const setItem = (id: string, patch: Partial<LineItem>) =>
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));

  const submit = () => {
    const errs: typeof errors = {};
    if (!counterpartyId) errs.party = "Выберите контрагента";
    if (items.length === 0) errs.items = "Добавьте хотя бы одну позицию";
    else if (items.some((it) => !it.name.trim() || it.qty <= 0 || it.price < 0))
      errs.items = "В каждой позиции: наименование, количество больше нуля и цена не меньше нуля";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    onSave({
      id: initial?.id ?? uid(),
      number: initial?.number ?? fallbackNumber,
      type,
      status: initial?.status ?? "draft",
      date,
      counterpartyId,
      contractId: contractId || undefined,
      items,
      vat,
      note: note.trim() || undefined,
    });
  };

  return (
    <div className="overlay-in fixed inset-0 z-50 overflow-y-auto bg-navy/60 p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-in mx-auto my-6 w-full max-w-3xl border border-line bg-surface shadow-[0_40px_90px_-30px_rgba(14,36,60,0.55)]">
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <div>
            <h3 className="font-display text-[17px] font-bold text-ink">
              {initial ? `Документ № ${initial.number}` : "Новый документ"}
            </h3>
            <p className="mt-0.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-dim">
              {initial ? "редактирование" : `будет присвоен № ${fallbackNumber}`}
            </p>
          </div>
          <button onClick={onClose} className="cursor-pointer border border-line p-2 text-mut transition-colors hover:border-danger hover:text-danger" title="Закрыть">
            <IconClose size={15} />
          </button>
        </div>

        <div className="grid gap-5 px-6 py-6 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <span className={lbl}>Тип документа</span>
            <div className="grid grid-cols-2 gap-1 border border-line bg-soft p-1">
              {(Object.keys(TYPE_META) as DocType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`cursor-pointer px-3 py-2 font-mono text-[11.5px] uppercase tracking-[0.08em] transition-all ${
                    type === t ? "bg-white font-semibold text-brand shadow-sm" : "text-mut hover:text-ink"
                  }`}
                >
                  {TYPE_META[t].label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={lbl} htmlFor="doc-date">Дата</label>
            <input id="doc-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inp} />
          </div>

          <div>
            <label className={lbl} htmlFor="doc-party">Контрагент</label>
            <select id="doc-party" value={counterpartyId} onChange={(e) => setCounterpartyId(e.target.value)} className={`${inp} cursor-pointer ${errors.party ? "border-danger" : ""}`}>
              <option value="">— не выбран —</option>
              {parties.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            {errors.party && <p className="mt-1.5 text-[12px] font-medium text-danger">{errors.party}</p>}
          </div>

          <div className="sm:col-span-2">
            <label className={lbl} htmlFor="doc-contract">Договор (основание)</label>
            <select id="doc-contract" value={contractId} onChange={(e) => setContractId(e.target.value)} className={`${inp} cursor-pointer`}>
              <option value="">— без договора —</option>
              {contracts.map((c) => (
                <option key={c.id} value={c.id}>№ {c.number} · {c.subject}</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <div className="flex items-center justify-between">
              <span className={lbl}>Позиции</span>
              <button
                type="button"
                onClick={() => setItems((p) => [...p, emptyItem()])}
                className="mb-1.5 flex cursor-pointer items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.1em] text-brand transition-colors hover:text-brand2"
              >
                <IconPlus size={12} /> добавить позицию
              </button>
            </div>

            <div className="space-y-2">
              {items.map((it, idx) => (
                <div key={it.id} className="grid grid-cols-2 gap-2 border border-line bg-soft/60 p-2.5 md:grid-cols-[1fr_74px_86px_116px_104px_34px] md:items-center">
                  <input
                    value={it.name}
                    onChange={(e) => setItem(it.id, { name: e.target.value })}
                    placeholder={`Наименование работ или услуг (позиция ${idx + 1})`}
                    className={`${inp} col-span-2 md:col-span-1`}
                  />
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={it.qty}
                    onChange={(e) => setItem(it.id, { qty: Number(e.target.value) || 0 })}
                    className={inp}
                    title="Количество"
                  />
                  <input
                    value={it.unit}
                    onChange={(e) => setItem(it.id, { unit: e.target.value })}
                    placeholder="ед."
                    className={inp}
                    title="Единица измерения"
                  />
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={it.price}
                    onChange={(e) => setItem(it.id, { price: Number(e.target.value) || 0 })}
                    className={inp}
                    title="Цена за единицу, ₽"
                  />
                  <span className="hidden px-2 text-right font-mono text-[12.5px] font-semibold text-ink md:block">
                    {fmtMoney(it.qty * it.price)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setItems((p) => p.filter((x) => x.id !== it.id))}
                    className="col-span-2 cursor-pointer justify-self-end border border-line px-2 py-1 font-mono text-[10px] uppercase text-mut transition-colors hover:border-danger hover:text-danger md:col-span-1 md:px-0 md:py-1.5"
                    title="Удалить позицию"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            {errors.items && <p className="mt-2 text-[12px] font-medium text-danger">{errors.items}</p>}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setVat((v) => !v)}
              className={`relative h-6 w-11 shrink-0 cursor-pointer border transition-colors ${vat ? "border-brand bg-brand" : "border-line2 bg-line"}`}
              role="switch"
              aria-checked={vat}
            >
              <span className={`absolute top-[3px] h-[16px] w-[16px] bg-white shadow transition-all ${vat ? "left-[24px]" : "left-[3px]"}`} />
            </button>
            <span className="text-[13px] text-mut">НДС 20 % (в том числе)</span>
          </div>

          <div className="sm:col-span-2">
            <label className={lbl} htmlFor="doc-note">Примечание (необязательно)</label>
            <textarea
              id="doc-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Например: оплата в течение 5 рабочих дней с момента выставления"
              className={`${inp} resize-none`}
            />
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-line bg-soft/50 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="font-mono text-[12.5px] text-mut">
            <p>Итого: <span className="font-semibold text-ink">{fmtMoney(subtotal)}</span></p>
            <p className="mt-0.5">
              {vat ? <>в т.ч. НДС 20 %: <span className="font-semibold text-ink">{fmtMoney(vatSum)}</span></> : "Без НДС"}
            </p>
          </div>
          <div className="flex gap-2.5">
            <button onClick={onClose} className="cursor-pointer border border-line px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.1em] text-mut transition-colors hover:border-navy hover:text-navy">
              отмена
            </button>
            <button onClick={submit} className="cursor-pointer bg-brand px-6 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-white transition-all hover:bg-brand2 hover:shadow-[0_8px_24px_-8px_rgba(30,136,229,0.6)]">
              сохранить документ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
