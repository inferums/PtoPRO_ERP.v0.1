import { useEffect, useState } from "react";
import { calc, fmtMoney, plural, uid, type Doc, type Party } from "../lib/store";
import { IconClose, IconPencil, IconPlus, IconTrash } from "./icons";

const inp =
  "w-full border border-line bg-white px-3 py-2.5 text-[13.5px] text-ink outline-none transition-colors placeholder:text-dim focus:border-brand";
const lbl = "mb-1.5 block font-mono text-[10.5px] uppercase tracking-[0.14em] text-mut";

function PartyForm({ initial, onSave, onClose }: { initial: Party | null; onSave: (p: Party) => void; onClose: () => void }) {
  const [f, setF] = useState({
    name: initial?.name ?? "",
    inn: initial?.inn ?? "",
    person: initial?.person ?? "",
    bank: initial?.bank ?? "",
    bik: initial?.bik ?? "",
    account: initial?.account ?? "",
  });
  const [err, setErr] = useState("");

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((p) => ({ ...p, [k]: e.target.value }));

  const submit = () => {
    if (!f.name.trim()) {
      setErr("Укажите наименование контрагента");
      return;
    }
    onSave({
      id: initial?.id ?? uid(),
      name: f.name.trim(),
      inn: f.inn.trim() || undefined,
      person: f.person.trim() || undefined,
      bank: f.bank.trim() || undefined,
      bik: f.bik.trim() || undefined,
      account: f.account.trim() || undefined,
    });
  };

  return (
    <div className="overlay-in fixed inset-0 z-50 overflow-y-auto bg-navy/60 p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-in mx-auto my-10 w-full max-w-lg border border-line bg-surface shadow-[0_40px_90px_-30px_rgba(14,36,60,0.55)]">
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h3 className="font-display text-[16px] font-bold text-ink">{initial ? "Контрагент" : "Новый контрагент"}</h3>
          <button onClick={onClose} className="cursor-pointer border border-line p-2 text-mut transition-colors hover:border-danger hover:text-danger">
            <IconClose size={14} />
          </button>
        </div>
        <div className="grid gap-4 px-6 py-6 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={lbl}>Наименование *</label>
            <input value={f.name} onChange={set("name")} placeholder="ООО «Ромашка» / ИП …" className={`${inp} ${err ? "border-danger" : ""}`} />
            {err && <p className="mt-1.5 text-[12px] font-medium text-danger">{err}</p>}
          </div>
          <div>
            <label className={lbl}>ИНН</label>
            <input value={f.inn} onChange={set("inn")} placeholder="10 или 12 цифр" className={inp} />
          </div>
          <div>
            <label className={lbl}>Контактное лицо</label>
            <input value={f.person} onChange={set("person")} placeholder="Фамилия И. О." className={inp} />
          </div>
          <div className="sm:col-span-2">
            <label className={lbl}>Банк</label>
            <input value={f.bank} onChange={set("bank")} placeholder="ПАО Сбербанк" className={inp} />
          </div>
          <div>
            <label className={lbl}>БИК</label>
            <input value={f.bik} onChange={set("bik")} placeholder="044525225" className={inp} />
          </div>
          <div>
            <label className={lbl}>Расчётный счёт</label>
            <input value={f.account} onChange={set("account")} placeholder="40702810…" className={inp} />
          </div>
        </div>
        <div className="flex justify-end gap-2.5 border-t border-line bg-soft/50 px-6 py-4">
          <button onClick={onClose} className="cursor-pointer border border-line px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.1em] text-mut transition-colors hover:border-navy hover:text-navy">
            отмена
          </button>
          <button onClick={submit} className="cursor-pointer bg-brand px-6 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:bg-brand2">
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

  useEffect(() => {
    if (!confirmId) return;
    const t = setTimeout(() => setConfirmId(null), 2600);
    return () => clearTimeout(t);
  }, [confirmId]);

  const statsFor = (id: string) => {
    const list = docs.filter((d) => d.counterpartyId === id);
    return { n: list.length, sum: list.reduce((s, d) => s + calc(d).total, 0) };
  };

  return (
    <div className="fade-up">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-[11.5px] uppercase tracking-[0.14em] text-dim">
          {parties.length} {plural(parties.length, ["контрагент", "контрагента", "контрагентов"])} в базе
        </p>
        <button
          onClick={() => setEditing("new")}
          className="flex cursor-pointer items-center gap-2 bg-brand px-4 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-white transition-all hover:bg-brand2 hover:shadow-[0_8px_24px_-8px_rgba(30,136,229,0.6)]"
        >
          <IconPlus size={13} /> добавить контрагента
        </button>
      </div>

      <div className="mt-4 overflow-x-auto border border-line bg-surface">
        <table className="w-full min-w-[760px] border-collapse text-left">
          <thead>
            <tr className="border-b border-line bg-soft">
              {["Наименование", "ИНН", "Контактное лицо", "Документы", "Оборот", ""].map((h, i) => (
                <th key={i} className={`px-4 py-3 font-mono text-[10.5px] font-medium uppercase tracking-[0.14em] text-dim ${i === 4 ? "text-right" : ""}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {parties.map((p, i) => {
              const st = statsFor(p.id);
              return (
                <tr key={p.id} className="fade-up group transition-colors hover:bg-soft" style={{ animationDelay: `${Math.min(i * 40, 300)}ms` }}>
                  <td className="px-4 py-3.5">
                    <span className="text-[13.5px] font-semibold text-ink">{p.name}</span>
                    {p.bank && <span className="mt-0.5 block truncate text-[11.5px] text-dim">{p.bank} · р/с {p.account ?? "—"}</span>}
                  </td>
                  <td className="px-4 py-3.5 font-mono text-[12.5px] text-mut">{p.inn ?? "—"}</td>
                  <td className="px-4 py-3.5 text-[13px] text-mut">{p.person ?? "—"}</td>
                  <td className="px-4 py-3.5">
                    <span className="border border-line bg-soft px-2 py-1 font-mono text-[11px] text-mut">{st.n}</span>
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono text-[13px] font-semibold text-ink">{fmtMoney(st.sum)}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-end gap-1.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      <button onClick={() => setEditing(p)} className="cursor-pointer border border-line p-2 text-mut transition-colors hover:border-navy hover:text-navy" title="Изменить">
                        <IconPencil size={13} />
                      </button>
                      {st.n > 0 ? (
                        <span className="border border-line px-2.5 py-2 font-mono text-[9.5px] uppercase text-dim" title="Сначала удалите документы контрагента">
                          {st.n} док.
                        </span>
                      ) : confirmId === p.id ? (
                        <button
                          onClick={() => {
                            onDelete(p.id);
                            setConfirmId(null);
                          }}
                          className="cursor-pointer border border-danger bg-danger px-2.5 py-2 font-mono text-[10px] font-semibold uppercase text-white transition-colors hover:bg-[#c74444]"
                        >
                          точно удалить?
                        </button>
                      ) : (
                        <button onClick={() => setConfirmId(p.id)} className="cursor-pointer border border-line p-2 text-mut transition-colors hover:border-danger hover:text-danger" title="Удалить">
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
        {parties.length === 0 && (
          <div className="p-12 text-center">
            <p className="font-display text-[15px] font-bold text-ink">База контрагентов пуста</p>
            <p className="mt-2 text-[13px] text-mut">Добавьте первого — и сможете выставлять документы</p>
          </div>
        )}
      </div>

      {editing !== null && (
        <PartyForm
          initial={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSave={(p) => {
            onUpsert(p);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}
