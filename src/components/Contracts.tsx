import { useState } from "react";
import {
  CONTRACT_STATUS_META,
  fmtDate,
  fmtMoney,
  todayISO,
  uid,
  type Contract,
  type ContractStatus,
  type Doc,
  type Party,
} from "../lib/store";
import { IconClose, IconContract, IconPencil, IconPlus, IconTrash } from "./icons";

function Form({
  initial,
  parties,
  onSave,
  onClose,
}: {
  initial: Contract | null;
  parties: Party[];
  onSave: (c: Contract) => void;
  onClose: () => void;
}) {
  const [f, setF] = useState<Contract>(
    initial ?? {
      id: uid(),
      number: "",
      date: todayISO(),
      counterpartyId: parties[0]?.id ?? "",
      subject: "",
      amount: 0,
      validUntil: "",
      status: "active",
    }
  );
  const inp =
    "w-full border border-line bg-white px-3 py-2.5 text-[13.5px] text-ink outline-none transition-colors placeholder:text-dim focus:border-brand";
  const lbl = "mb-1.5 block font-mono text-[10.5px] uppercase tracking-[0.14em] text-mut";

  return (
    <div className="overlay-in fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-navy/70 p-4" onClick={onClose}>
      <div className="modal-in w-full max-w-lg border border-line bg-surface p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-display text-[16px] font-bold text-ink">{initial ? "Договор" : "Новый договор"}</h3>
          <button onClick={onClose} className="cursor-pointer border border-line p-2 text-mut hover:border-navy hover:text-navy">
            <IconClose size={14} />
          </button>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={lbl}>Номер</label>
            <input value={f.number} onChange={(e) => setF({ ...f, number: e.target.value })} placeholder="12/25" className={inp} />
          </div>
          <div>
            <label className={lbl}>Дата</label>
            <input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} className={inp} />
          </div>
          <div className="sm:col-span-2">
            <label className={lbl}>Контрагент</label>
            <select value={f.counterpartyId} onChange={(e) => setF({ ...f, counterpartyId: e.target.value })} className={inp}>
              {parties.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={lbl}>Предмет договора</label>
            <input value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} placeholder="Абонентское сопровождение" className={inp} />
          </div>
          <div>
            <label className={lbl}>Сумма, ₽</label>
            <input type="number" min={0} value={f.amount || ""} onChange={(e) => setF({ ...f, amount: Number(e.target.value) || 0 })} className={inp} />
          </div>
          <div>
            <label className={lbl}>Действует до</label>
            <input type="date" value={f.validUntil ?? ""} onChange={(e) => setF({ ...f, validUntil: e.target.value })} className={inp} />
          </div>
          <div className="sm:col-span-2">
            <label className={lbl}>Статус</label>
            <select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value as ContractStatus })} className={inp}>
              {(Object.keys(CONTRACT_STATUS_META) as ContractStatus[]).map((s) => (
                <option key={s} value={s}>{CONTRACT_STATUS_META[s].label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2.5">
          <button onClick={onClose} className="cursor-pointer border border-line px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.1em] text-mut hover:text-ink">
            отмена
          </button>
          <button
            onClick={() => f.number.trim() && onSave(f)}
            className="cursor-pointer bg-brand px-5 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:bg-brand2"
          >
            сохранить
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Contracts({
  contracts,
  parties,
  docs,
  onUpsert,
  onDelete,
}: {
  contracts: Contract[];
  parties: Party[];
  docs: Doc[];
  onUpsert: (c: Contract) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState<Contract | null | "new">(null);
  const partyName = (id: string) => parties.find((p) => p.id === id)?.name ?? "—";
  const linkedCount = (id: string) => docs.filter((d) => d.contractId === id).length;

  return (
    <div className="fade-up">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-dim">
          договоров: {contracts.length} · действует: {contracts.filter((c) => c.status === "active").length}
        </p>
        <button
          onClick={() => setEditing("new")}
          className="flex cursor-pointer items-center gap-2 bg-brand px-4 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:bg-brand2"
        >
          <IconPlus size={13} /> договор
        </button>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {contracts.map((c, i) => {
          const meta = CONTRACT_STATUS_META[c.status];
          return (
            <div
              key={c.id}
              className="fade-up group flex flex-col border border-line bg-surface p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-line2 hover:shadow-[0_14px_34px_-16px_rgba(14,36,60,0.3)]"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-start justify-between">
                <div className="grid h-10 w-10 place-items-center border border-line bg-soft text-brand">
                  <IconContract size={20} />
                </div>
                <span className={`inline-flex items-center gap-1.5 border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.08em] ${meta.chip}`}>
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.dot }} />
                  {meta.label}
                </span>
              </div>
              <p className="mt-4 font-display text-[15px] font-bold text-ink">№ {c.number}</p>
              <p className="mt-0.5 truncate text-[13px] text-mut" title={c.subject}>{c.subject}</p>
              <p className="mt-1 truncate text-[12.5px] font-medium text-ink">{partyName(c.counterpartyId)}</p>

              <div className="mt-4 flex items-baseline justify-between border-t border-line pt-3.5">
                <span className="font-mono text-[11px] text-dim">{fmtDate(c.date)}</span>
                <span className="font-mono text-[15px] font-semibold text-ink">{fmtMoney(c.amount)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="font-mono text-[10.5px] text-dim">
                  {linkedCount(c.id)} документ(ов) · {c.validUntil ? `до ${fmtDate(c.validUntil)}` : "бессрочно"}
                </span>
                <span className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button onClick={() => setEditing(c)} className="cursor-pointer border border-line p-1.5 text-mut hover:border-navy hover:text-navy" title="Изменить">
                    <IconPencil size={13} />
                  </button>
                  <button onClick={() => onDelete(c.id)} className="cursor-pointer border border-line p-1.5 text-mut hover:border-danger hover:text-danger" title="Удалить">
                    <IconTrash size={13} />
                  </button>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {contracts.length === 0 && (
        <div className="mt-4 border border-dashed border-line2 bg-surface p-12 text-center">
          <IconContract size={36} className="mx-auto text-dim" />
          <p className="mt-4 font-display text-[15px] font-bold text-ink">Договоров пока нет</p>
          <p className="mt-2 text-[13px] text-mut">Договор — это «зонтик», к которому привязываются счета и акты</p>
        </div>
      )}

      {editing !== null && (
        <Form initial={editing === "new" ? null : editing} parties={parties} onSave={(c) => { onUpsert(c); setEditing(null); }} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}
