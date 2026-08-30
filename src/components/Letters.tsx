import { useState } from "react";
import { fmtDate, todayISO, uid, type Letter, type Party } from "../lib/store";
import Modal from "./Modal";
import { IconLetter, IconPlus } from "./icons";

function Form({ parties, onSave, onClose }: { parties: Party[]; onSave: (l: Letter) => void; onClose: () => void }) {
  const [f, setF] = useState<Letter>({
    id: uid(),
    number: "",
    date: todayISO(),
    counterpartyId: parties[0]?.id ?? "",
    direction: "out",
    subject: "",
    body: "",
  });
  const inp =
    "w-full border border-line bg-white px-3 py-2.5 text-[13.5px] text-ink outline-none transition-colors placeholder:text-dim focus:border-brand";
  const lbl = "mb-1.5 block font-mono text-[10.5px] uppercase tracking-[0.14em] text-mut";

  return (
    <Modal title="Новое письмо" subtitle="входящее или исходящее" onClose={onClose} width="max-w-3xl">
      <div className="grid gap-4 px-5 py-4 sm:grid-cols-2">
          <div>
            <label className={lbl}>Номер</label>
            <input value={f.number} onChange={(e) => setF({ ...f, number: e.target.value })} placeholder="исх-32" className={inp} />
          </div>
          <div>
            <label className={lbl}>Дата</label>
            <input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} className={inp} />
          </div>
          <div>
            <label className={lbl}>Направление</label>
            <select value={f.direction} onChange={(e) => setF({ ...f, direction: e.target.value as Letter["direction"] })} className={`${inp} cursor-pointer`}>
              <option value="out">Исходящее</option>
              <option value="in">Входящее</option>
            </select>
          </div>
          <div>
            <label className={lbl}>Контрагент</label>
            <select value={f.counterpartyId} onChange={(e) => setF({ ...f, counterpartyId: e.target.value })} className={`${inp} cursor-pointer`}>
              {parties.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={lbl}>Тема</label>
            <input value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} placeholder="О сроках подачи заявки" className={inp} />
          </div>
          <div className="sm:col-span-2">
            <label className={lbl}>Текст</label>
            <textarea value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} rows={5} className={`${inp} resize-none`} />
          </div>
        </div>
        <div className="flex justify-end gap-2.5 border-t border-line bg-soft px-5 py-3.5">
          <button onClick={onClose} className="cursor-pointer rounded-md border border-line px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.1em] text-mut transition-colors hover:border-line2 hover:text-ink">
            отмена
          </button>
          <button
            onClick={() => f.subject.trim() && onSave(f)}
            className="cursor-pointer rounded-md bg-brand px-5 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:bg-brand2"
          >
            сохранить
          </button>
        </div>
    </Modal>
  );
}

export default function Letters({ letters, parties, onAdd }: { letters: Letter[]; parties: Party[]; onAdd: (l: Letter) => void }) {
  const [adding, setAdding] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const partyName = (id: string) => parties.find((p) => p.id === id)?.name ?? "—";
  const sorted = [...letters].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="fade-up">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-dim">
          писем: {letters.length} · входящих: {letters.filter((l) => l.direction === "in").length}
        </p>
        <button
          onClick={() => setAdding(true)}
          disabled={parties.length === 0}
          className="flex cursor-pointer items-center gap-2 rounded-md bg-brand px-4 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:bg-brand2 disabled:cursor-not-allowed disabled:opacity-50"
          title={parties.length === 0 ? "Сначала добавьте контрагента" : ""}
        >
          <IconPlus size={13} /> письмо
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {sorted.map((l, i) => {
          const open = openId === l.id;
          const isIn = l.direction === "in";
          return (
            <div key={l.id} className="fade-up overflow-hidden rounded-xl border border-line bg-surface shadow-sm transition-all duration-300 hover:border-line2 hover:shadow-[0_12px_28px_-16px_rgba(14,36,60,0.3)]" style={{ animationDelay: `${i * 50}ms` }}>
              <button onClick={() => setOpenId(open ? null : l.id)} className="flex w-full cursor-pointer items-center gap-4 px-5 py-4 text-left">
                <span
                  className={`grid h-9 w-16 shrink-0 place-items-center border font-mono text-[10px] font-semibold uppercase tracking-[0.06em] ${
                    isIn ? "border-[#bfd9f2] bg-[#e3f0fc] text-[#1567c2]" : "border-[#f0dbb4] bg-[#fbf0dc] text-[#a96f14]"
                  }`}
                >
                  {isIn ? "вх" : "исх"}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-semibold text-ink">{l.subject}</span>
                  <span className="mt-0.5 block truncate text-[12px] text-mut">{l.number} · {partyName(l.counterpartyId)}</span>
                </span>
                <span className="font-mono text-[11.5px] text-dim">{fmtDate(l.date)}</span>
                <IconLetter size={16} className={`shrink-0 text-dim transition-transform duration-300 ${open ? "rotate-12 text-brand" : ""}`} />
              </button>
              {open && (
                <div className="border-t border-line bg-soft px-5 py-4">
                  <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-ink">{l.body}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {sorted.length === 0 && (
        <div className="mt-4 rounded-xl border border-dashed border-line2 bg-surface p-12 text-center">
          <IconLetter size={36} className="mx-auto text-dim" />
          <p className="mt-4 font-display text-[15px] font-bold text-ink">Переписки пока нет</p>
          <p className="mt-2 text-[13px] text-mut">Входящие и исходящие письма по контрагентам — здесь</p>
        </div>
      )}

      {adding && <Form parties={parties} onSave={(l) => { onAdd(l); setAdding(false); }} onClose={() => setAdding(false)} />}
    </div>
  );
}
