import { useState } from "react";
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
import Modal from "./Modal";
import { IconPlus, IconTrash } from "./icons";

const emptyItem = (): LineItem => ({ id: uid(), name: "", qty: 1, unit: "шт", price: 0 });

export default function DocumentForm({
  initial,
  parties,
  contracts,
  fallbackNumber,
  forcedType,
  onSave,
  onClose,
}: {
  initial: Doc | null;
  parties: Party[];
  contracts: { id: string; number: string; subject: string }[];
  fallbackNumber: number;
  forcedType?: DocType;
  onSave: (doc: Doc) => void;
  onClose: () => void;
}) {
  const [type, setType] = useState<DocType>(initial?.type ?? forcedType ?? "invoice");
  const [date, setDate] = useState(initial?.date ?? todayISO());
  const [counterpartyId, setCounterpartyId] = useState(initial?.counterpartyId ?? parties[0]?.id ?? "");
  const [contractId, setContractId] = useState(initial?.contractId ?? "");
  const [vat, setVat] = useState(initial?.vat ?? false);
  const [note, setNote] = useState(initial?.note ?? "");
  const [items, setItems] = useState<LineItem[]>(initial ? initial.items.map((i) => ({ ...i })) : [emptyItem()]);
  const [errors, setErrors] = useState<{ party?: string; items?: string }>({});

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

  const inp =
    "w-full rounded-md border border-line bg-white px-3 py-2.5 text-[13.5px] text-ink outline-none transition-colors placeholder:text-dim focus:border-brand focus:ring-[3px] focus:ring-brand/15";
  const lbl = "mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.1em] text-mut";

  return (
    <Modal
      title={initial ? `${TYPE_META[initial.type]?.label ?? "Документ"} № ${initial.number}` : "Новый документ"}
      subtitle={initial ? "редактирование" : `будет присвоен № ${fallbackNumber}`}
      onClose={onClose}
      width="max-w-3xl"
      tall
    >
      <div className="grid gap-5 px-6 py-5 sm:grid-cols-2">
          {forcedType ? (
            <div>
              <span className={lbl}>Тип документа</span>
              <p className="flex h-[42px] items-center border border-line bg-soft px-3 font-mono text-[11.5px] uppercase tracking-[0.08em] text-brand">
                {TYPE_META[forcedType].label}
              </p>
            </div>
          ) : (
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
          )}

          <div>
            <label className={lbl}>Дата</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inp} />
          </div>

          <div>
            <label className={lbl}>Контрагент</label>
            <select value={counterpartyId} onChange={(e) => setCounterpartyId(e.target.value)} className={`${inp} cursor-pointer ${errors.party ? "border-danger" : ""}`}>
              <option value="">— не выбран —</option>
              {parties.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            {errors.party && <p className="mt-1.5 text-[12px] font-medium text-danger">{errors.party}</p>}
          </div>

          <div className="sm:col-span-2">
            <label className={lbl}>Договор (основание)</label>
            <select value={contractId} onChange={(e) => setContractId(e.target.value)} className={`${inp} cursor-pointer`}>
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
              {items.map((it) => (
                <div key={it.id} className="grid grid-cols-[1fr_74px_64px_110px_120px_34px] items-center gap-2">
                  <input value={it.name} onChange={(e) => setItem(it.id, { name: e.target.value })} placeholder="Наименование работ" className={inp} />
                  <input type="number" min={0} step="any" value={it.qty || ""} onChange={(e) => setItem(it.id, { qty: Number(e.target.value) || 0 })} placeholder="Кол-во" className={inp} />
                  <input value={it.unit} onChange={(e) => setItem(it.id, { unit: e.target.value })} placeholder="ед." className={inp} />
                  <input type="number" min={0} step="any" value={it.price || ""} onChange={(e) => setItem(it.id, { price: Number(e.target.value) || 0 })} placeholder="Цена" className={inp} />
                  <div className="px-1 text-right font-mono text-[12.5px] font-semibold text-ink">{fmtMoney(it.qty * it.price)}</div>
                  <button
                    type="button"
                    onClick={() => setItems((p) => p.filter((x) => x.id !== it.id))}
                    className="cursor-pointer border border-line p-2 text-mut transition-colors hover:border-danger hover:text-danger"
                    title="Удалить позицию"
                  >
                    <IconTrash size={13} />
                  </button>
                </div>
              ))}
            </div>
            {errors.items && <p className="mt-2 text-[12px] font-medium text-danger">{errors.items}</p>}
          </div>

          <div className="sm:col-span-2">
            <label className={lbl}>Примечание</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Условия оплаты, срок действия…" className={inp} />
          </div>
        </div>

        <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-4 border-t border-line bg-soft px-6 py-4">
          <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-mut">
            <input type="checkbox" checked={vat} onChange={(e) => setVat(e.target.checked)} className="h-4 w-4 accent-[#1e88e5]" />
            НДС 20 % (в т.ч.)
          </label>
          <div className="text-right">
            <p className="font-mono text-[11px] text-dim">
              итого {fmtMoney(subtotal)} · НДС {vat ? fmtMoney(vatSum) : "—"}
            </p>
            <p className="mt-0.5 font-display text-[17px] font-extrabold text-ink">{fmtMoney(subtotal)}</p>
          </div>
          <div className="flex gap-2.5">
            <button onClick={onClose} className="cursor-pointer border border-line px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.1em] text-mut transition-colors hover:text-ink">
              отмена
            </button>
            <button onClick={submit} className="cursor-pointer rounded-md bg-brand px-6 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-white transition-all hover:bg-brand2 hover:shadow-[0_8px_24px_-8px_rgba(30,136,229,0.6)]">
              сохранить
            </button>
          </div>
        </div>
    </Modal>
  );
}
