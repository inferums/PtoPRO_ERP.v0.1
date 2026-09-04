import { useEffect, useMemo, useRef, useState } from "react";
import {
  CONTRACT_KIND_META,
  CONTRACT_STATUS_META,
  CONTRACT_STATUS_ORDER,
  contractActuals,
  fmtDate,
  fmtMoney,
  todayISO,
  uid,
  type Contract,
  type ContractKind,
  type ContractStatus,
  type Doc,
  type Party,
  type Payment,
} from "../lib/store";
import Modal from "./Modal";
import { IconContract, IconDownload, IconPlus } from "./icons";

/* плавный набор числа при смене значения (реакция на фильтры) */
function useCountUp(target: number) {
  const [v, setV] = useState(target);
  const prevRef = useRef(target);
  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setV(target);
      prevRef.current = target;
      return;
    }
    const from = prevRef.current;
    prevRef.current = target;
    if (from === target) return;
    let raf = 0;
    const t0 = performance.now();
    const dur = 500;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / dur);
      setV(from + (target - from) * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return v;
}

/* ---------- сводные показатели по отфильтрованным договорам ---------- */

function TotalsStrip({ count, plan, factIn, factOut, profit }: { count: number; plan: number; factIn: number; factOut: number; profit: number }) {
  const vPlan = useCountUp(plan);
  const vIn = useCountUp(factIn);
  const vOut = useCountUp(factOut);
  const vProfit = useCountUp(profit);

  const cell = (label: string, value: string, cls = "text-ink") => (
    <div className="bg-surface px-3 py-2.5">
      <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-dim">{label}</p>
      <p className={`mt-0.5 whitespace-nowrap font-mono text-[14.5px] font-bold ${cls}`}>{value}</p>
    </div>
  );

  return (
    <div className="fade-up mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line shadow-sm sm:grid-cols-5">
      {cell("Договоров", String(count))}
      {cell("План, доход", fmtMoney(Math.round(vPlan)))}
      {cell("Факт, доход", fmtMoney(Math.round(vIn)), "text-[#2E7D32]")}
      {cell("Факт, расход", fmtMoney(Math.round(vOut)), "text-[#C62828]")}
      {cell("Чистая прибыль", fmtMoney(Math.round(vProfit)), profit >= 0 ? "text-[#2E7D32]" : "text-[#C62828]")}
    </div>
  );
}

/* ---------- форма договора ---------- */

export function ContractForm({
  initial,
  parties,
  parents,
  onSave,
  onClose,
  onCreateCounterparty,
}: {
  initial: Contract | null;
  parties: Party[];
  parents: { id: string; number: string }[];
  onSave: (c: Contract) => void;
  onClose: () => void;
  onCreateCounterparty?: () => void;
}) {
  const [f, setF] = useState<Contract>(
    initial ?? {
      id: uid(),
      number: "",
      counterpartyId: parties[0]?.id ?? "",
      subject: "",
      kind: "income",
      plannedIncome: 0,
      plannedExpense: 0,
      actualIncome: 0,
      actualExpense: 0,
      status: "active",
      startDate: todayISO(),
      endDate: todayISO(),
    }
  );
  const inp =
    "w-full rounded-md border border-line bg-white px-3 py-2.5 text-[13.5px] text-ink outline-none transition-colors placeholder:text-dim focus:border-brand focus:ring-[3px] focus:ring-brand/15";
  const lbl = "mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.1em] text-mut";

  return (
    <Modal
      title={initial?.number ? `Договор ${initial.number}` : "Новый договор"}
      subtitle={initial ? (initial.parentId ? "субдоговор · редактирование" : "редактирование") : "доходный или расходный"}
      onClose={onClose}
      width="max-w-3xl"
    >
      <div className="grid gap-4 px-5 py-4 sm:grid-cols-2">
        <div>
          <label className={lbl}>Номер</label>
          <input value={f.number} onChange={(e) => setF({ ...f, number: e.target.value })} placeholder="Д-004/2024" className={inp} />
        </div>
        <div>
          <label className={lbl}>Контрагент</label>
          <div className="flex gap-1.5">
            <select value={f.counterpartyId} onChange={(e) => setF({ ...f, counterpartyId: e.target.value })} className={`${inp} cursor-pointer flex-1`}>
              {parties.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            {onCreateCounterparty && (
              <button type="button" onClick={onCreateCounterparty} title="Создать контрагента" className="flex shrink-0 cursor-pointer items-center justify-center rounded-md border border-line bg-white px-3 text-brand transition-colors hover:border-brand hover:bg-brand hover:text-white">
                <IconPlus size={14} />
              </button>
            )}
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className={lbl}>Предмет договора</label>
          <input value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} placeholder="Техническая поддержка" className={inp} />
        </div>
        <div>
          <label className={lbl}>Тип</label>
          <select value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value as ContractKind })} className={`${inp} cursor-pointer`}>
            <option value="income">Доход</option>
            <option value="expense">Расход</option>
          </select>
        </div>
        <div>
          <label className={lbl}>Статус</label>
          <select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value as ContractStatus })} className={`${inp} cursor-pointer`}>
            {CONTRACT_STATUS_ORDER.map((s) => (
              <option key={s} value={s}>{CONTRACT_STATUS_META[s].label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={lbl}>Плановый доход, ₽</label>
          <input type="number" min={0} value={f.plannedIncome || ""} onChange={(e) => setF({ ...f, plannedIncome: Number(e.target.value) || 0 })} className={inp} />
        </div>
        <div>
          <label className={lbl}>Плановый расход, ₽</label>
          <input type="number" min={0} value={f.plannedExpense || ""} onChange={(e) => setF({ ...f, plannedExpense: Number(e.target.value) || 0 })} className={inp} />
        </div>
        <div>
          <label className={lbl}>Начало</label>
          <input type="date" value={f.startDate} onChange={(e) => setF({ ...f, startDate: e.target.value })} className={inp} />
        </div>
        <div>
          <label className={lbl}>Окончание</label>
          <input type="date" value={f.endDate} onChange={(e) => setF({ ...f, endDate: e.target.value })} className={inp} />
        </div>
        <div className="sm:col-span-2">
          <label className={lbl}>Родительский договор (для субподряда)</label>
          <select value={f.parentId ?? ""} onChange={(e) => setF({ ...f, parentId: e.target.value || undefined })} className={`${inp} cursor-pointer`}>
            <option value="">— нет (самостоятельный) —</option>
            {parents.map((p) => (
              <option key={p.id} value={p.id}>{p.number}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className={lbl}>Описание</label>
          <input value={f.description ?? ""} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="Краткое описание работ" className={inp} />
        </div>
      </div>

      <div className="sticky bottom-0 z-10 flex justify-end gap-2.5 border-t border-line bg-soft px-6 py-4">
        <button onClick={onClose} className="cursor-pointer rounded-md border border-line px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.1em] text-mut transition-colors hover:border-line2 hover:text-ink">
          отмена
        </button>
        <button
          onClick={() => f.number.trim() && onSave(f)}
          className="cursor-pointer rounded-md bg-brand px-5 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:bg-brand2"
        >
          сохранить
        </button>
      </div>
    </Modal>
  );
}

const sel =
  "h-9 w-36 cursor-pointer rounded-md border border-line bg-surface px-3 text-[13px] text-ink outline-none transition-colors focus:border-brand";

export default function Contracts({
  contracts,
  parties,
  docs,
  payments,
  onUpsert,
  onDelete,
  onOpen,
  onCreateCounterparty,
}: {
  contracts: Contract[];
  parties: Party[];
  docs: Doc[];
  payments: Payment[];
  onUpsert: (c: Contract) => void;
  onDelete: (id: string) => void;
  onOpen: (id: string) => void;
  onCreateCounterparty?: () => void;
}) {
  const [editing, setEditing] = useState<Contract | null | "new">(null);
  const [q, setQ] = useState("");
  const [fStatus, setFStatus] = useState<ContractStatus | "all">("all");
  const [fKind, setFKind] = useState<ContractKind | "all">("all");
  const [fParty, setFParty] = useState<string>("all");

  const partyName = (id: string) => parties.find((p) => p.id === id)?.name ?? "—";
  const childrenOf = (id: string) => contracts.filter((c) => c.parentId === id);

  const rows = useMemo(() => {
    const query = q.trim().toLowerCase();
    const match = (c: Contract) =>
      (fStatus === "all" || c.status === fStatus) &&
      (fKind === "all" || c.kind === fKind) &&
      (fParty === "all" || c.counterpartyId === fParty) &&
      (!query ||
        c.number.toLowerCase().includes(query) ||
        c.subject.toLowerCase().includes(query) ||
        partyName(c.counterpartyId).toLowerCase().includes(query));
    const flat: { c: Contract; nested: boolean }[] = [];
    contracts.filter((c) => !c.parentId).forEach((p) => {
      if (match(p)) flat.push({ c: p, nested: false });
      childrenOf(p.id).forEach((ch) => {
        if (match(ch)) flat.push({ c: ch, nested: true });
      });
    });
    return flat;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contracts, parties, q, fStatus, fKind, fParty]);

  /* фактические значения каждого договора — из оплат */
  const actualsById = useMemo(() => {
    const m = new Map<string, { income: number; expense: number; profit: number }>();
    contracts.forEach((c) => m.set(c.id, contractActuals(c, docs, payments, contracts)));
    return m;
  }, [contracts, docs, payments]);

  /* сводные показатели по текущей выборке */
  const totals = useMemo(() => {
    const t = { plan: 0, factIn: 0, factOut: 0, profit: 0 };
    rows.forEach(({ c }) => {
      const a = actualsById.get(c.id) ?? { income: 0, expense: 0, profit: 0 };
      t.plan += c.plannedIncome;
      t.factIn += a.income;
      t.factOut += a.expense;
      t.profit += a.profit;
    });
    return t;
  }, [rows, actualsById]);

  /* экспорт реестра в CSV (открывается в Excel благодаря BOM и «;») */
  const exportCsv = () => {
    const esc = (v: string | number) => {
      const s = String(v);
      return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const head = ["Номер", "Предмет", "Контрагент", "Тип", "Плановый доход", "Плановый расход", "Фактический доход", "Фактический расход", "Чистая прибыль", "Статус", "Начало", "Окончание", "Родительский договор"];
    const lines = rows.map(({ c, nested }) => {
      const a = actualsById.get(c.id) ?? { income: 0, expense: 0, profit: 0 };
      return [
        c.number,
        c.subject,
        partyName(c.counterpartyId),
        CONTRACT_KIND_META[c.kind].label,
        c.plannedIncome,
        c.plannedExpense,
        a.income,
        a.expense,
        a.profit,
        CONTRACT_STATUS_META[c.status].label,
        c.startDate,
        c.endDate,
        nested ? (contracts.find((x) => x.id === c.parentId)?.number ?? "") : "",
      ]
        .map(esc)
        .join(";");
    });
    const csv = "\uFEFF" + [head.join(";"), ...lines].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reestr-dogovorov-${todayISO()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 800);
  };

  const money = (v: number, cls = "") => (
    <td className={`whitespace-nowrap px-2 py-2 text-right text-[13px] ${cls}`}>{fmtMoney(v)}</td>
  );

  return (
    <div className="fade-up">
      {/* панель фильтров */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-dim" aria-hidden="true">
            <path d="m21 21-4.34-4.34" />
            <circle cx="11" cy="11" r="8" />
          </svg>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Поиск..."
            className="h-9 w-full rounded-md border border-line bg-surface pl-9 pr-3 text-[13px] outline-none transition-colors placeholder:text-dim focus:border-brand"
          />
        </div>
        <select value={fStatus} onChange={(e) => setFStatus(e.target.value as ContractStatus | "all")} className={sel} title="Статус">
          <option value="all">Статус</option>
          {CONTRACT_STATUS_ORDER.map((s) => (
            <option key={s} value={s}>{CONTRACT_STATUS_META[s].label}</option>
          ))}
        </select>
        <select value={fKind} onChange={(e) => setFKind(e.target.value as ContractKind | "all")} className={sel} title="Тип">
          <option value="all">Тип</option>
          <option value="income">Доход</option>
          <option value="expense">Расход</option>
        </select>
        <select value={fParty} onChange={(e) => setFParty(e.target.value)} className="h-9 w-44 cursor-pointer rounded-md border border-line bg-surface px-3 text-[13px] outline-none transition-colors focus:border-brand" title="Контрагент">
          <option value="all">Контрагент</option>
          {parties.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <button
          onClick={exportCsv}
          title="Выгрузить реестр в CSV (Excel)"
          className="flex h-9 cursor-pointer items-center gap-1.5 rounded-md border border-line bg-surface px-3 font-mono text-[11px] uppercase tracking-[0.06em] text-mut transition-colors hover:border-line2 hover:text-ink"
        >
          <IconDownload size={14} /> csv
        </button>
        <button
          onClick={() => setEditing("new")}
          className="flex h-9 cursor-pointer items-center gap-1.5 rounded-md bg-brand px-4 font-mono text-[12px] font-semibold uppercase tracking-[0.06em] text-white transition-colors hover:bg-brand2"
        >
          <IconPlus size={14} />
          Новый договор
        </button>
      </div>

      {/* сводные показатели по выборке */}
      <TotalsStrip count={rows.length} plan={totals.plan} factIn={totals.factIn} factOut={totals.factOut} profit={totals.profit} />

      {/* таблица */}
      <div className="mt-4 overflow-x-auto rounded-xl border border-line bg-surface shadow-sm">
        <table className="w-full min-w-[980px] border-collapse text-left">
          <thead>
            <tr className="border-b border-line bg-soft">
              {["Номер", "Предмет", "Контрагент", "Тип", "Плановый доход", "Плановый расход", "Фактический доход", "Фактический расход", "Чистая прибыль", "Статус", "Срок"].map((h, i) => (
                <th key={h} className={`whitespace-nowrap px-2 py-3 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-mut ${i >= 4 && i <= 8 ? "text-right" : i === 0 || i === 3 || i === 9 ? "text-center" : "text-left"}`}>
                  {h}
                </th>
              ))}
              <th className="w-28 px-2 py-3 text-center font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-mut">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map(({ c, nested }, i) => {
              const status = CONTRACT_STATUS_META[c.status];
              const kind = CONTRACT_KIND_META[c.kind];
              const a = actualsById.get(c.id) ?? { income: 0, expense: 0, profit: 0 };
              const profit = a.profit;
              return (
                <tr
                  key={c.id}
                  onClick={() => onOpen(c.id)}
                  className={`fade-up cursor-pointer transition-colors hover:bg-soft ${nested ? "bg-[#E3F2FD]/40" : ""}`}
                  style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}
                >
                  <td className={`whitespace-nowrap px-2 py-2.5 font-medium text-[13px] text-ink ${nested ? "pl-6" : ""}`}>
                    {nested && <span className="mr-1 text-brand">↳</span>}
                    {c.number}
                  </td>
                  <td className="whitespace-nowrap px-2 py-2.5">
                    <span className="block max-w-48 truncate text-[13px] text-ink" title={c.subject}>{c.subject}</span>
                  </td>
                  <td className="whitespace-nowrap px-2 py-2.5 text-[13px] text-ink">{partyName(c.counterpartyId)}</td>
                  <td className="whitespace-nowrap px-2 py-2.5 text-center">
                    <span className={`inline-block rounded-md border px-2 py-0.5 text-[11px] font-medium ${kind.chip}`}>{kind.label}</span>
                  </td>
                  {money(c.plannedIncome)}
                  {money(c.plannedExpense)}
                  {money(a.income, "text-[#2E7D32]")}
                  {money(a.expense, "text-[#C62828]")}
                  {money(profit, `font-medium ${profit >= 0 ? "text-[#2E7D32]" : "text-[#C62828]"}`)}
                  <td className="whitespace-nowrap px-2 py-2.5 text-center">
                    <span className={`inline-block rounded-md border px-2 py-0.5 text-[11px] font-medium ${status.chip}`}>{status.label}</span>
                  </td>
                  <td className="whitespace-nowrap px-2 py-2.5 text-[11.5px] text-mut">
                    {fmtDate(c.startDate)} — {fmtDate(c.endDate)}
                  </td>
                  <td className="whitespace-nowrap px-2 py-2.5">
                    <div className="flex justify-center gap-1">
                      <button onClick={(e) => { e.stopPropagation(); onOpen(c.id); }} title="Открыть" className="cursor-pointer rounded-md p-1.5 text-mut transition-colors hover:bg-line/50 hover:text-brand">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                          <path d="M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0" /><circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setEditing(c); }} title="Редактировать" className="cursor-pointer rounded-md p-1.5 text-mut transition-colors hover:bg-line/50 hover:text-navy">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                          <path d="M21.17 6.81a1 1 0 0 0-3.99-3.99L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.35a.5.5 0 0 0 .62.62l4.35-1.32a2 2 0 0 0 .83-.5z" /><path d="m15 5 4 4" />
                        </svg>
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); onDelete(c.id); }} title="Удалить" className="cursor-pointer rounded-md p-1.5 text-mut transition-colors hover:bg-line/50 hover:text-danger">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                          <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><path d="M10 11v6M14 11v6" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {rows.length === 0 && (
          <div className="p-12 text-center">
            <IconContract size={36} className="mx-auto text-dim" />
            <p className="mt-4 font-display text-[15px] font-bold text-ink">Договоров не найдено</p>
            <p className="mt-2 text-[13px] text-mut">Измените фильтры или создайте новый договор</p>
          </div>
        )}
      </div>

      <p className="mt-3 font-mono text-[11px] text-dim">
        показано {rows.length} из {contracts.length} · субдоговоры отмечены «↳» · клик по строке — карточка договора
      </p>

      {editing !== null && (
        <ContractForm
          initial={editing === "new" ? null : editing}
          parties={parties}
          parents={contracts.filter((c) => !c.parentId && c.id !== (editing === "new" ? "" : editing?.id)).map((c) => ({ id: c.id, number: c.number }))}
          onSave={(c) => { onUpsert(c); setEditing(null); }}
          onClose={() => setEditing(null)}
          onCreateCounterparty={onCreateCounterparty}
        />
      )}
    </div>
  );
}
