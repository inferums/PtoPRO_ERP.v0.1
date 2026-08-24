import { useMemo, useState } from "react";
import {
  calc,
  fmtMoney,
  fmtDate,
  STATUS_META,
  STATUS_ORDER,
  TYPE_META,
  type Doc,
  type DocStatus,
  type DocType,
  type Party,
} from "../lib/store";
import { IconArrow, IconPencil, IconPlus, IconSearch } from "./icons";

export default function Documents({
  docs,
  parties,
  contracts,
  typeFilter,
  onPreview,
  onEdit,
  onNew,
  onStatus,
  onOpenContract,
}: {
  docs: Doc[];
  parties: Party[];
  contracts: { id: string; number: string }[];
  typeFilter?: DocType;
  onPreview: (id: string) => void;
  onEdit: (doc: Doc) => void;
  onNew: () => void;
  onStatus: (id: string, s: DocStatus) => void;
  onOpenContract: (id: string) => void;
}) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<DocStatus | "all">("all");

  const base = useMemo(
    () => (typeFilter ? docs.filter((d) => d.type === typeFilter) : docs),
    [docs, typeFilter]
  );

  const partyName = (id: string) => parties.find((p) => p.id === id)?.name ?? "—";

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return [...base]
      .sort((a, b) => b.date.localeCompare(a.date) || b.number - a.number)
      .filter((d) => (filter === "all" ? true : d.status === filter))
      .filter((d) => {
        if (!query) return true;
        return (
          String(d.number).includes(query) ||
          partyName(d.counterpartyId).toLowerCase().includes(query) ||
          d.items.some((it) => it.name.toLowerCase().includes(query))
        );
      });
  }, [base, parties, q, filter]);

  const counts = STATUS_ORDER.map((s) => ({ s, n: base.filter((d) => d.status === s).length }));

  return (
    <div className="fade-up">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setFilter("all")}
            className={`cursor-pointer rounded-md border px-3 py-1.5 text-[11.5px] font-semibold transition-all ${
              filter === "all" ? "border-navy bg-navy text-white shadow-sm" : "border-line bg-surface text-mut hover:border-line2 hover:text-ink"
            }`}
          >
            все · {docs.length}
          </button>
          {counts.map(({ s, n }) => (
            <button
              key={s}
              onClick={() => setFilter(filter === s ? "all" : s)}
              className={`cursor-pointer rounded-md border px-3 py-1.5 text-[11.5px] font-semibold transition-all ${
                filter === s ? "border-navy bg-navy text-white shadow-sm" : "border-line bg-surface text-mut hover:border-line2 hover:text-ink"
              }`}
            >
              <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full align-middle" style={{ background: STATUS_META[s].dot }} />
              {STATUS_META[s].label} · {n}
            </button>
          ))}
        </div>
        <div className="relative lg:w-72">
          <IconSearch size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-dim" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Поиск: номер, контрагент, позиция"
            className="w-full rounded-md border border-line bg-surface py-2.5 pl-9 pr-3 text-[13px] outline-none transition-colors placeholder:text-dim focus:border-brand focus:ring-[3px] focus:ring-brand/15"
          />
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left">
          <thead>
            <tr className="border-b border-line bg-soft">
              {(typeFilter ? ["№ и дата", "Контрагент", "Сумма", "Статус", ""] : ["№ и дата", "Тип", "Контрагент", "Сумма", "Статус", ""]).map((h, i, arr) => (
                <th key={i} className={`px-4 py-3 font-mono text-[10.5px] font-medium uppercase tracking-[0.14em] text-dim ${h === "Сумма" ? "text-right" : ""} ${i === arr.length - 1 ? "w-28" : ""}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {filtered.map((d, i) => {
              const meta = STATUS_META[d.status];
              const contract = d.contractId ? contracts.find((c) => c.id === d.contractId) : undefined;
              return (
                <tr
                  key={d.id}
                  onClick={() => onPreview(d.id)}
                  className="fade-up group cursor-pointer transition-colors hover:bg-soft"
                  style={{ animationDelay: `${Math.min(i * 35, 320)}ms` }}
                >
                  <td className="px-4 py-3.5 align-top">
                    <span className="font-mono text-[13px] font-semibold text-ink">№ {d.number}</span>
                    <span className="mt-0.5 block font-mono text-[10.5px] text-dim">{fmtDate(d.date)}</span>
                    {contract && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenContract(contract.id);
                        }}
                        className="mt-1.5 inline-flex cursor-pointer items-center gap-1 border border-brand/40 bg-brand/5 px-1.5 py-px font-mono text-[9.5px] uppercase tracking-[0.06em] text-brand transition-colors hover:bg-brand hover:text-white"
                        title={`Открыть договор № ${contract.number}`}
                      >
                        <svg width="9" height="9" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                          <path d="M5 2.6h7.2l3.2 3.2v11.6H5z" />
                        </svg>
                        д-р № {contract.number}
                      </button>
                    )}
                  </td>
                  {!typeFilter && <td className="px-4 py-3.5 text-[13px] text-mut">{TYPE_META[d.type]?.label ?? "—"}</td>}
                  <td className="max-w-[240px] truncate px-4 py-3.5 text-[13.5px] font-medium text-ink">{partyName(d.counterpartyId)}</td>
                  <td className="px-4 py-3.5 text-right font-mono text-[13px] font-semibold text-ink">{fmtMoney(calc(d).total)}</td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.08em] ${meta.chip}`}>
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.dot }} />
                      {meta.label}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-end gap-1.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      {meta.next && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onStatus(d.id, meta.next!);
                          }}
                          className="flex cursor-pointer items-center gap-1.5 border border-brand/50 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-brand transition-all hover:bg-brand hover:text-white"
                          title={`Перевести в статус «${meta.nextLabel}»`}
                        >
                          {meta.nextLabel} <IconArrow size={11} />
                        </button>
                      )}
                      {meta.altNext && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onStatus(d.id, meta.altNext!);
                          }}
                          className="cursor-pointer border border-[#26a69a]/60 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-[#00796b] transition-all hover:bg-[#e0f2f1]"
                          title="Записать частичную оплату"
                        >
                          {meta.altLabel}
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(d);
                        }}
                        className="cursor-pointer border border-line p-1.5 text-mut transition-colors hover:border-navy hover:text-navy"
                        title="Изменить"
                      >
                        <IconPencil size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        </div>
        {filtered.length === 0 && (
          <div className="p-12 text-center">
            <p className="font-display text-[15px] font-bold text-ink">Ничего не нашлось</p>
            <p className="mt-2 text-[13px] text-mut">Попробуйте сбросить фильтры или создайте новый документ</p>
            <div className="mt-5 flex justify-center gap-3">
              <button
                onClick={() => {
                  setQ("");
                  setFilter("all");
                }}
                className="cursor-pointer border border-line px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.1em] text-mut transition-colors hover:border-navy hover:text-navy"
              >
                сбросить
              </button>
              <button onClick={onNew} className="flex cursor-pointer items-center gap-2 rounded-md bg-brand px-4 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:bg-brand2">
                <IconPlus size={13} /> новый документ
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="mt-3 font-mono text-[11px] text-dim">показано {filtered.length} из {base.length} · наведение на строку — быстрые действия</p>
    </div>
  );
}
