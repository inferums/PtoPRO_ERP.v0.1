import { useEffect, useState, type ReactNode } from "react";
import {
  calc,
  CONTRACT_KIND_META,
  CONTRACT_STATUS_META,
  CONTRACT_STATUS_ORDER,
  displayName,
  fmtDate,
  fmtMoney,
  netProfit,
  STATUS_META,
  TYPE_META,
  type Contract,
  type ContractStatus,
  type Doc,
  type Own,
  type Party,
  type Payment,
} from "../lib/store";
import { ContractForm } from "./Contracts";
import { IconArrow, IconClose, IconDownload, IconPencil, IconPrint } from "./icons";

function Clause({ n, title, children }: { n: string; title: string; children: ReactNode }) {
  return (
    <div className="mt-6">
      <p className="font-semibold">{n}. {title}</p>
      <div className="mt-2 space-y-2 text-[12.5px] leading-relaxed">{children}</div>
    </div>
  );
}

const P = ({ children }: { children: ReactNode }) => <p>{children}</p>;

export default function ContractDetail({
  contract,
  party,
  docs,
  payments,
  own,
  parties,
  parents,
  onClose,
  onStatus,
  onUpdate,
  onOpenDoc,
}: {
  contract: Contract;
  party: Party | undefined;
  docs: Doc[];
  payments: Payment[];
  own: Own;
  parties: Party[];
  parents: { id: string; number: string }[];
  onClose: () => void;
  onStatus: (id: string, s: ContractStatus) => void;
  onUpdate: (c: Contract) => void;
  onOpenDoc: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const status = CONTRACT_STATUS_META[contract.status];
  const kind = CONTRACT_KIND_META[contract.kind];
  const profit = netProfit(contract);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (editing) setEditing(false);
        else onClose();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose, editing]);

  const docsTotal = docs.reduce((s, d) => s + calc(d).total, 0);
  const paidTotal = payments.reduce((s, p) => s + p.amount, 0);
  const progress = contract.plannedIncome > 0 ? Math.min((contract.actualIncome / contract.plannedIncome) * 100, 100) : 0;

  const downloadWord = async () => {
    const { downloadContractDocx } = await import("../lib/docx");
    await downloadContractDocx(contract, party, own, docs, payments);
  };

  return (
    <div className="overlay-in fixed inset-0 z-50 overflow-y-auto bg-navy/70">
      <div className="sticky top-0 z-20 border-b border-white/10 bg-navy px-4 py-3">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-2">
          <button onClick={onClose} className="flex cursor-pointer items-center gap-2 border border-white/20 px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.08em] text-white/80 transition-colors hover:border-white/50 hover:text-white">
            <IconArrow size={13} className="rotate-180" /> к договорам
          </button>
          <span className="ml-1 hidden font-display text-[13px] font-bold text-white sm:block">{contract.number}</span>
          <span className={`hidden border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.08em] md:inline-block ${status.chip}`}>{status.label}</span>
          <span className={`hidden border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.08em] md:inline-block ${kind.chip}`}>{kind.label}</span>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <select
              value={contract.status}
              onChange={(e) => onStatus(contract.id, e.target.value as ContractStatus)}
              className="cursor-pointer border border-white/20 bg-navy px-2.5 py-2 font-mono text-[11px] uppercase tracking-[0.06em] text-white/80 outline-none transition-colors hover:border-white/50"
            >
              {CONTRACT_STATUS_ORDER.map((s) => (
                <option key={s} value={s} className="text-ink">{CONTRACT_STATUS_META[s].label}</option>
              ))}
            </select>
            <button onClick={() => setEditing(true)} className="flex cursor-pointer items-center gap-2 border border-white/20 px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.08em] text-white/80 transition-colors hover:border-white/50 hover:text-white">
              <IconPencil size={13} /> изменить
            </button>
            <button onClick={() => window.print()} className="flex cursor-pointer items-center gap-2 border border-white/20 px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.08em] text-white/80 transition-colors hover:border-white/50 hover:text-white">
              <IconPrint size={13} /> печать
            </button>
            <button onClick={downloadWord} className="flex cursor-pointer items-center gap-2 bg-brand px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-white transition-all hover:bg-brand2 hover:shadow-[0_6px_20px_-6px_rgba(30,136,229,0.7)]">
              <IconDownload size={13} /> word
            </button>
            <button onClick={onClose} className="cursor-pointer border border-white/20 p-2 text-white/70 transition-colors hover:border-danger hover:text-danger" title="Закрыть">
              <IconClose size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1180px] gap-6 px-4 py-7 lg:grid-cols-[330px_1fr]">
        {/* карточка */}
        <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="border border-line bg-surface p-5">
            <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-dim">Финансовая модель</p>
            <dl className="mt-4 space-y-2.5 text-[13px]">
              <div className="flex justify-between gap-3"><dt className="text-mut">Контрагент</dt><dd className="max-w-[55%] text-right font-medium text-ink">{party?.name ?? "—"}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-mut">Срок</dt><dd className="font-mono text-ink">{fmtDate(contract.startDate)} — {fmtDate(contract.endDate)}</dd></div>
              <div className="flex justify-between gap-3 border-t border-line pt-2.5"><dt className="text-mut">Плановый доход</dt><dd className="font-mono font-semibold text-ink">{fmtMoney(contract.plannedIncome)}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-mut">Плановый расход</dt><dd className="font-mono font-semibold text-ink">{fmtMoney(contract.plannedExpense)}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-mut">Фактический доход</dt><dd className="font-mono font-semibold text-[#2E7D32]">{fmtMoney(contract.actualIncome)}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-mut">Фактический расход</dt><dd className="font-mono font-semibold text-[#C62828]">{fmtMoney(contract.actualExpense)}</dd></div>
              <div className="flex justify-between gap-3 border-t border-line pt-2.5">
                <dt className="text-mut">Чистая прибыль</dt>
                <dd className={`font-mono font-bold ${profit >= 0 ? "text-[#2E7D32]" : "text-[#C62828]"}`}>{fmtMoney(profit)}</dd>
              </div>
            </dl>
            <div className="mt-4">
              <div className="flex justify-between font-mono text-[10px] text-dim"><span>выполнение плана по доходу</span><span>{Math.round(progress)}%</span></div>
              <div className="mt-1 h-1.5 w-full bg-bg">
                <div className="h-full bg-[#2E7D32] transition-all duration-700" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>

          <div className="border border-line bg-surface">
            <p className="border-b border-line px-5 py-3 font-mono text-[10.5px] uppercase tracking-[0.16em] text-dim">Документы · {docs.length} · {fmtMoney(docsTotal)}</p>
            <div className="divide-y divide-line">
              {docs.map((d) => (
                <button key={d.id} onClick={() => onOpenDoc(d.id)} className="group flex w-full cursor-pointer items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-soft">
                  <span className="grid h-8 w-10 shrink-0 place-items-center border border-line bg-soft font-mono text-[10.5px] font-semibold text-mut">№{d.number}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12.5px] font-medium text-ink">{TYPE_META[d.type]?.label ?? "Документ"}</span>
                    <span className="font-mono text-[10px] text-dim">{fmtDate(d.date)}</span>
                  </span>
                  <span className="text-right">
                    <span className="block font-mono text-[12px] font-semibold text-ink">{fmtMoney(calc(d).total)}</span>
                    <span className={`mt-0.5 inline-block border px-1.5 py-px font-mono text-[8.5px] uppercase tracking-[0.06em] ${STATUS_META[d.status].chip}`}>{STATUS_META[d.status].label}</span>
                  </span>
                  <IconArrow size={13} className="shrink-0 text-dim transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-brand" />
                </button>
              ))}
              {docs.length === 0 && (
                <p className="px-5 py-6 text-center text-[12.5px] text-mut">
                  Документов пока нет.<br />Привяжите счёт или акт через форму «Новый документ» → «Договор».
                </p>
              )}
            </div>
          </div>

          {payments.length > 0 && (
            <div className="border border-line bg-surface">
              <p className="border-b border-line px-5 py-3 font-mono text-[10.5px] uppercase tracking-[0.16em] text-dim">Оплаты · {payments.length}</p>
              <div className="divide-y divide-line">
                {payments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-3 px-5 py-2.5 text-[12.5px]">
                    <span className="font-mono text-dim">{fmtDate(p.date)}</span>
                    <span className="flex-1 truncate text-mut">{p.method}</span>
                    <span className="font-mono font-semibold text-[#2E7D32]">{fmtMoney(p.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* лист договора */}
        <div id="print-sheet" className="relative h-fit w-full bg-white px-10 py-10 text-ink shadow-[0_50px_110px_-30px_rgba(0,0,0,0.6)] sm:px-12">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-[24px] font-extrabold tracking-[0.04em]">ДОГОВОР {contract.number}</h2>
            <p className="font-mono text-[11.5px] text-mut">{fmtDate(contract.startDate)} — {fmtDate(contract.endDate)}</p>
          </div>

          <p className="mt-7 text-[12.5px] leading-relaxed">
            <span className="font-semibold">{displayName(own.name)}</span>, ИНН {own.inn ?? "—"}, именуемый в дальнейшем{" "}
            <span className="font-semibold">«Исполнитель»</span>, с одной стороны, и{" "}
            <span className="font-semibold">{party?.name ?? "____________________"}</span>
            {party?.inn ? `, ИНН ${party.inn}` : ""}, именуемый в дальнейшем <span className="font-semibold">«Заказчик»</span>, с другой
            стороны, заключили настоящий договор о нижеследующем.
          </p>

          <Clause n="1" title="Предмет договора">
            <P>1.1. Исполнитель обязуется оказать Заказчику услуги: <span className="font-semibold">{contract.subject || "____________________"}</span>, а Заказчик — принять и оплатить их.</P>
            <P>1.2. Тип договора: <span className="font-semibold">{kind.label}</span>. Договор действует с {fmtDate(contract.startDate)} по {fmtDate(contract.endDate)}.</P>
          </Clause>

          <Clause n="2" title="Финансовые показатели">
            <table className="w-full border-collapse text-[11.5px]">
              <thead>
                <tr className="bg-soft">
                  {["Показатель", "План", "Факт"].map((h, i) => (
                    <th key={h} className={`border border-line2 px-2 py-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-mut ${i === 0 ? "text-left" : "text-right"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-line2 px-2 py-1.5">Доход</td>
                  <td className="border border-line2 px-2 py-1.5 text-right font-mono">{fmtMoney(contract.plannedIncome)}</td>
                  <td className="border border-line2 px-2 py-1.5 text-right font-mono text-[#2E7D32]">{fmtMoney(contract.actualIncome)}</td>
                </tr>
                <tr>
                  <td className="border border-line2 px-2 py-1.5">Расход</td>
                  <td className="border border-line2 px-2 py-1.5 text-right font-mono">{fmtMoney(contract.plannedExpense)}</td>
                  <td className="border border-line2 px-2 py-1.5 text-right font-mono text-[#C62828]">{fmtMoney(contract.actualExpense)}</td>
                </tr>
                <tr>
                  <td className="border border-line2 px-2 py-1.5 font-semibold">Чистая прибыль</td>
                  <td className="border border-line2 px-2 py-1.5 text-right font-mono">{fmtMoney(contract.plannedIncome - contract.plannedExpense)}</td>
                  <td className={`border border-line2 px-2 py-1.5 text-right font-mono font-bold ${profit >= 0 ? "text-[#2E7D32]" : "text-[#C62828]"}`}>{fmtMoney(profit)}</td>
                </tr>
              </tbody>
            </table>
          </Clause>

          <Clause n="3" title="Документы и оплаты">
            {docs.length > 0 ? (
              <table className="w-full border-collapse text-[11.5px]">
                <thead>
                  <tr className="bg-soft">
                    {["Документ", "Дата", "Сумма", "Статус"].map((h, i) => (
                      <th key={h} className={`border border-line2 px-2 py-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-mut ${i === 0 ? "text-left" : "text-right"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {docs.map((d) => (
                    <tr key={d.id}>
                      <td className="border border-line2 px-2 py-1.5">{TYPE_META[d.type]?.label ?? "Документ"} № {d.number}</td>
                      <td className="border border-line2 px-2 py-1.5 text-right font-mono">{fmtDate(d.date)}</td>
                      <td className="border border-line2 px-2 py-1.5 text-right font-mono">{fmtMoney(calc(d).total)}</td>
                      <td className="border border-line2 px-2 py-1.5 text-right">{STATUS_META[d.status].label}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <P>3.1. Документы в рамках договора на дату формирования не выставлялись.</P>
            )}
            {payments.length > 0 && (
              <P>Получено оплат: <span className="font-semibold text-[#2E7D32]">{fmtMoney(paidTotal)}</span>.</P>
            )}
          </Clause>

          <Clause n="4" title="Ответственность сторон и заключительные положения">
            <P>4.1. За нарушение сроков оплаты Заказчик уплачивает пени 0,1 % от суммы задолженности за каждый день просрочки.</P>
            <P>4.2. Договор составлен в двух экземплярах, имеющих одинаковую юридическую силу.</P>
          </Clause>

          <div className="mt-10 grid grid-cols-2 gap-8">
            <div className="border border-ink/70 p-3.5 text-[11px] leading-relaxed">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-dim">Исполнитель</p>
              <p className="mt-1.5 font-semibold">{displayName(own.name)}</p>
              <p>ИНН {own.inn ?? "—"}</p>
              <p>{own.bank}</p>
              <p>БИК {own.bik} · р/с {own.account}</p>
              <p className="mt-5">______________ / {own.director}</p>
            </div>
            <div className="border border-ink/70 p-3.5 text-[11px] leading-relaxed">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-dim">Заказчик</p>
              <p className="mt-1.5 font-semibold">{party?.name ?? "____________________"}</p>
              <p>ИНН {party?.inn ?? "—"}</p>
              <p>{party?.bank ?? "Банк: ______________"}</p>
              <p className="mt-5">______________ / {party?.person ?? "________________"}</p>
            </div>
          </div>

          <p className="mt-8 border-t border-line pt-4 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-dim">
            сформировано в системе «ИП Документооборот» · {status.label.toLowerCase()}
          </p>
        </div>
      </div>

      {editing && (
        <ContractForm initial={contract} parties={parties} parents={parents} onSave={(c) => { onUpdate(c); setEditing(false); }} onClose={() => setEditing(false)} />
      )}
    </div>
  );
}
