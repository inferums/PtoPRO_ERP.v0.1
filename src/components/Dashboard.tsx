import { useEffect, useState } from "react";
import {
  calc,
  fmtMoney,
  fmtMoneyShort,
  fmtDate,
  MONTHS_SHORT,
  STATUS_META,
  TYPE_META,
  type Doc,
} from "../lib/store";
import { IconArrow, IconPlus } from "./icons";

function useCountUp(target: number) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setV(target);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const dur = 800;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / dur);
      setV(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return v;
}

function StatTile({ label, value, sub, dark }: { label: string; value: string; sub: string; dark?: boolean }) {
  return (
    <div
      className={`group rounded-xl border p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_34px_-16px_rgba(14,36,60,0.35)] ${
        dark ? "border-navy bg-navy text-white" : "border-line bg-surface"
      }`}
    >
      <p className={`text-[11px] font-semibold uppercase tracking-[0.1em] ${dark ? "text-white/55" : "text-mut"}`}>{label}</p>
      <p className={`mt-3 font-display text-[24px] font-extrabold leading-none tracking-tight ${dark ? "text-white" : "text-[#1a237e]"}`}>{value}</p>
      <p className={`mt-2.5 text-[12px] ${dark ? "text-[#8cc3f2]" : "text-mut"}`}>{sub}</p>
    </div>
  );
}

export default function Dashboard({
  docs,
  parties,
  onOpen,
  onNew,
  onGoDocs,
}: {
  docs: Doc[];
  parties: { id: string; name: string }[];
  onOpen: (id: string) => void;
  onNew: () => void;
  onGoDocs: () => void;
}) {
  const now = new Date();
  const curPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const sum = (list: Doc[]) => list.reduce((s, x) => s + calc(x).total, 0);
  const billedMonth = sum(docs.filter((x) => x.date.startsWith(curPrefix)));
  const paidTotal = sum(docs.filter((x) => x.status === "paid"));
  const awaiting = sum(docs.filter((x) => x.status === "sent" || x.status === "signed" || x.status === "paid_partial"));
  const drafts = docs.filter((x) => x.status === "draft").length;

  const vBilled = useCountUp(billedMonth);
  const vPaid = useCountUp(paidTotal);
  const vAwait = useCountUp(awaiting);

  const months = Array.from({ length: 6 }, (_, i) => {
    const t = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const key = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}`;
    return { key, label: MONTHS_SHORT[t.getMonth()], sum: 0, current: i === 5 };
  });
  docs.forEach((x) => {
    const m = months.find((mm) => x.date.startsWith(mm.key));
    if (m) m.sum += calc(x).total;
  });
  const max = Math.max(...months.map((m) => m.sum), 1);

  const recent = [...docs].sort((a, b) => b.date.localeCompare(a.date) || b.number - a.number).slice(0, 5);
  const partyName = (id: string) => parties.find((p) => p.id === id)?.name ?? "—";

  return (
    <div className="fade-up">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile dark label="Выставлено в этом месяце" value={fmtMoney(Math.round(vBilled))} sub={`${docs.filter((x) => x.date.startsWith(curPrefix)).length} документ(ов) за ${months[5].label}`} />
        <StatTile label="Оплачено всего" value={fmtMoney(Math.round(vPaid))} sub="за всё время" />
        <StatTile label="Ожидают оплаты" value={fmtMoney(Math.round(vAwait))} sub="отправленные и подписанные" />
        <StatTile label="Черновики" value={String(drafts)} sub="ждут отправки" />
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <div className="rounded-xl border border-line bg-surface p-6 shadow-sm">
          <div className="flex items-baseline justify-between gap-4">
            <h3 className="font-display text-[15px] font-bold text-[#1a237e]">Выручка по месяцам</h3>
            <span className="text-[11px] font-medium text-dim">последние 6 мес · ₽</span>
          </div>
          <div className="mt-6 flex h-44 items-end gap-3 sm:gap-4">
            {months.map((m, i) => (
              <div key={m.key} className="group flex h-full flex-1 flex-col items-center justify-end gap-2" title={`${m.label}: ${fmtMoney(m.sum)}`}>
                <span className={`font-mono text-[10px] transition-opacity ${m.sum ? "opacity-70 group-hover:opacity-100" : "opacity-0"}`}>
                  {fmtMoneyShort(m.sum)}
                </span>
                <div
                  className={`grow-y w-full max-w-[54px] transition-colors duration-300 ${m.current ? "bg-brand group-hover:bg-brand2" : "bg-navy/15 group-hover:bg-navy/30"}`}
                  style={{ height: `${Math.max((m.sum / max) * 100, m.sum ? 4 : 1.5)}%`, animationDelay: `${i * 70}ms` }}
                />
                <span className={`font-mono text-[10.5px] uppercase ${m.current ? "font-semibold text-brand" : "text-dim"}`}>{m.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h3 className="font-display text-[15px] font-bold text-[#1a237e]">Последние документы</h3>
            <button onClick={onGoDocs} className="group flex cursor-pointer items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.1em] text-brand transition-colors hover:text-brand2">
              все <IconArrow size={13} className="transition-transform duration-300 group-hover:translate-x-0.5" />
            </button>
          </div>
          <div className="flex-1 divide-y divide-line">
            {recent.length === 0 && (
              <div className="p-8 text-center">
                <p className="text-[13.5px] text-mut">Документов пока нет</p>
                <button onClick={onNew} className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-md bg-brand px-4 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:bg-brand2">
                  <IconPlus size={13} /> создать первый
                </button>
              </div>
            )}
            {recent.map((d, i) => (
              <button
                key={d.id}
                onClick={() => onOpen(d.id)}
                className="fade-up flex w-full cursor-pointer items-center gap-3.5 px-5 py-3.5 text-left transition-colors hover:bg-soft"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <span className="grid h-9 w-11 shrink-0 place-items-center border border-line bg-soft font-mono text-[11.5px] font-semibold text-mut">№{d.number}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-semibold text-ink">
                    {TYPE_META[d.type]?.label ?? "Документ"} · {partyName(d.counterpartyId)}
                  </span>
                  <span className="mt-0.5 block font-mono text-[10.5px] text-dim">{fmtDate(d.date)}</span>
                </span>
                <span className="text-right">
                  <span className="block font-mono text-[13px] font-semibold text-ink">{fmtMoney(calc(d).total)}</span>
                  <span className={`mt-1 inline-block border px-1.5 py-px font-mono text-[9.5px] uppercase tracking-[0.08em] ${STATUS_META[d.status].chip}`}>
                    {STATUS_META[d.status].label}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
