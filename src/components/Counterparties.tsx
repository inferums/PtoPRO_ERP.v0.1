import { useState } from "react";
import { calc, fmtMoney, uid, type Doc, type Party } from "../lib/store";
import { IconClose, IconPencil, IconPeople, IconPlus, IconTrash } from "./icons";

function Form({ initial, onSave, onClose }: { initial: Party | null; onSave: (p: Party) => void; onClose: () => void }) {
  const [f, setF] = useState<Party>(initial ?? { id: uid(), name: "" });
  const inp =
    "w-full border border-line bg-white px-3 py-2.5 text-[13.5px] text-ink outline-none transition-colors placeholder:text-dim focus:border-brand";
  const lbl = "mb-1.5 block font-mono text-[10.5px] uppercase tracking-[0.14em] text-mut";

  return (
    <div className="overlay-in fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-navy/70 p-4" onClick={onClose}>
      <div className="modal-in w-full max-w-lg border border-line bg-surface p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-display text-[16px] font-bold text-ink">{initial ? "Контрагент" : "Новый контрагент"}</h3>
          <button onClick={onClose} className="cursor-pointer border border-line p-2 text-mut hover:border-navy hover:text-navy">
            <IconClose size={14} />
          </button>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={lbl}>Наименование</label>
            <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="ООО «Ромашка»" className={inp} />
          </div>
          <div>
            <label className={lbl}>ИНН</label>
            <input value={f.inn ?? ""} onChange={(e) => setF({ ...f, inn: e.target.value })} className={inp} />
          </div>
          <div>
            <label className={lbl}>Контактное лицо</label>
            <input value={f.person ?? ""} onChange={(e) => setF({ ...f, person: e.target.value })} className={inp} />
          </div>
          <div className="sm:col-span-2">
            <label className={lbl}>Банк</label>
            <input value={f.bank ?? ""} onChange={(e) => setF({ ...f, bank: e.target.value })} className={inp} />
          </div>
          <div>
            <label className={lbl}>БИК</label>
            <input value={f.bik ?? ""} onChange={(e) => setF({ ...f, bik: e.target.value })} className={inp} />
          </div>
          <div>
            <label className={lbl}>Расчётный счёт</label>
            <input value={f.account ?? ""} onChange={(e) => setF({ ...f, account: e.target.value })} className={inp} />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2.5">
          <button onClick={onClose} className="cursor-pointer border border-line px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.1em] text-mut hover:text-ink">
            отмена
          </button>
          <button
            onClick={() => f.name.trim() && onSave({ ...f, name: f.name.trim() })}
            className="cursor-pointer bg-brand px-5 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:bg-brand2"
          >
            сохранить
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Counterparties({
  parties,
  docs,
  onUpsert,
  onDelete,
}: {
  parties: Party[];
  docs: Doc[];
  onUpsert: (p: Party) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState<Party | null | "new">(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const turnover = (id: string) => docs.filter((d) => d.counterpartyId === id).reduce((s, d) => s + calc(d).total, 0);
  const docsCount = (id: string) => docs.filter((d) => d.counterpartyId === id).length;

  return (
    <div className="fade-up">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-dim">в базе: {parties.length}</p>
        <button
          onClick={() => setEditing("new")}
          className="flex cursor-pointer items-center gap-2 bg-brand px-4 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:bg-brand2"
        >
          <IconPlus size={13} /> контрагент
        </button>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {parties.map((p, i) => (
          <div
            key={p.id}
            className="fade-up group border border-line bg-surface p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-line2 hover:shadow-[0_14px_34px_-16px_rgba(14,36,60,0.3)]"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-[15px] font-semibold text-ink">{p.name}</p>
                <p className="mt-0.5 font-mono text-[11px] text-dim">{p.inn ? `ИНН ${p.inn}` : "ИНН не указан"}{p.person ? ` · ${p.person}` : ""}</p>
              </div>
              <span className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button onClick={() => setEditing(p)} className="cursor-pointer border border-line p-1.5 text-mut hover:border-navy hover:text-navy" title="Изменить">
                  <IconPencil size={13} />
                </button>
                <button onClick={() => setConfirmId(confirmId === p.id ? null : p.id)} className="cursor-pointer border border-line p-1.5 text-mut hover:border-danger hover:text-danger" title="Удалить">
                  <IconTrash size={13} />
                </button>
              </span>
            </div>

            <div className="mt-4 flex items-baseline justify-between border-t border-line pt-3.5">
              <span className="font-mono text-[11px] text-dim">{docsCount(p.id)} документ(ов)</span>
              <span className="font-mono text-[15px] font-semibold text-ink">{fmtMoney(turnover(p.id))}</span>
            </div>

            {confirmId === p.id && (
              <div className="pop-in mt-3 border border-danger/40 bg-[#fbe7e5] p-3" style={{ animation: "toastIn 0.3s both" }}>
                <p className="text-[12px] text-[#b03a30]">Удалить «{p.name}» из базы?</p>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => {
                      onDelete(p.id);
                      setConfirmId(null);
                    }}
                    className="cursor-pointer bg-danger px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-white hover:bg-[#c74444]"
                  >
                    удалить
                  </button>
                  <button onClick={() => setConfirmId(null)} className="cursor-pointer border border-line px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-mut hover:text-ink">
                    отмена
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {parties.length === 0 && (
        <div className="mt-4 border border-dashed border-line2 bg-surface p-12 text-center">
          <IconPeople size={36} className="mx-auto text-dim" />
          <p className="mt-4 font-display text-[15px] font-bold text-ink">База контрагентов пуста</p>
          <p className="mt-2 text-[13px] text-mut">Добавьте первого покупателя или заказчика</p>
        </div>
      )}

      {editing !== null && (
        <Form initial={editing === "new" ? null : editing} onSave={(p) => { onUpsert(p); setEditing(null); }} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}
