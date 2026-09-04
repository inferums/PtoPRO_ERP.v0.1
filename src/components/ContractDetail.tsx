import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  calc,
  CONTRACT_KIND_META,
  CONTRACT_STATUS_META,
  fmtDate,
  fmtMoney,
  netProfit,
  suggestPaymentName,
  STATUS_META,
  TYPE_META,
  type Contract,
  type ContractStatus,
  type Doc,
  type DocType,
  type Letter,
  type Own,
  type Party,
  type Payment,
} from "../lib/store";
import { ContractForm } from "./Contracts";
import PaymentForm from "./PaymentForm";
import { IconArrow, IconCoin, IconDownload, IconLetter, IconPencil, IconPlus, IconPrint, IconTrash } from "./icons";

function Badge({ chip, label }: { chip: string; label: string }) {
  return (
    <span className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-medium ${chip}`}>
      {label}
    </span>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-16px_rgba(14,36,60,0.35)]">
      <div className="px-3 pb-2 pt-2">
        <p className="mb-1.5 text-center text-[11px] font-medium leading-tight text-mut">{label}</p>
        <p className={`text-center text-[22px] font-bold leading-tight ${color}`}>{value}</p>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-3 border-b border-line pb-2 text-sm">
      <span className="shrink-0 text-mut">{label}</span>
      <span className="max-w-[62%] text-right font-medium text-ink">{children}</span>
    </div>
  );
}

type Tab = "card" | "invoices" | "acts" | "payments" | "letters";

export default function ContractDetail({
  contract,
  party,
  docs,
  payments,
  letters,
  contracts,
  parties,
  own,
  onBack,
  onOpenContract,
  onStatus,
  onUpdate,
  onDelete,
  onOpenDoc,
  onAddPayment,
  onUpdatePayment,
  onDeletePayment,
  onNewDoc,
  onNewSubContract,
}: {
  contract: Contract;
  party: Party | undefined;
  docs: Doc[];
  payments: Payment[];
  letters: Letter[];
  contracts: Contract[];
  parties: Party[];
  own: Own;
  onBack: () => void;
  onOpenContract: (id: string) => void;
  onStatus: (id: string, s: ContractStatus) => void;
  onUpdate: (c: Contract) => void;
  onDelete: (id: string) => void;
  onOpenDoc: (id: string) => void;
  onAddPayment: (p: Payment) => void;
  onUpdatePayment: (p: Payment) => void;
  onDeletePayment: (id: string) => void;
  onNewDoc: (type: DocType) => void;
  onNewSubContract: () => void;
}) {
  const [tab, setTab] = useState<Tab>("card");
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [payForm, setPayForm] = useState<null | { mode: "add" } | { mode: "edit"; pay: Payment }>(null);
  const [confirmPay, setConfirmPay] = useState<string | null>(null);
  const [openLetter, setOpenLetter] = useState<string | null>(null);

  const paidByDoc = useMemo(() => {
    const m = new Map<string, number>();
    payments.forEach((p) => m.set(p.docId, (m.get(p.docId) ?? 0) + p.amount));
    return m;
  }, [payments]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onBack();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onBack]);

  const invoices = useMemo(() => docs.filter((d) => d.type === "invoice"), [docs]);
  const acts = useMemo(() => docs.filter((d) => d.type === "act"), [docs]);
  const invoiced = invoices.reduce((s, d) => s + calc(d).total, 0);
  const received = payments.reduce((s, p) => s + p.amount, 0);
  const children = contracts.filter((c) => c.parentId === contract.id);
  const kind = CONTRACT_KIND_META[contract.kind];
  const status = CONTRACT_STATUS_META[contract.status];
  const planPct = contract.plannedIncome > 0 ? Math.min(Math.round((contract.actualIncome / contract.plannedIncome) * 100), 100) : 0;

  const downloadWord = async () => {
    const { downloadContractDocx } = await import("../lib/docx");
    await downloadContractDocx(contract, party, own, docs, payments);
  };

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "card", label: "Карточка" },
    { id: "invoices", label: "Счета", count: invoices.length },
    { id: "acts", label: "Акты", count: acts.length },
    { id: "payments", label: "Оплаты", count: payments.length },
    { id: "letters", label: "Письма", count: letters.length },
  ];

  const docRow = (d: Doc) => (
    <button
      key={d.id}
      onClick={() => onOpenDoc(d.id)}
      className="group flex w-full cursor-pointer items-center gap-3 rounded-lg border border-line bg-surface px-4 py-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/50 hover:shadow-[0_10px_24px_-14px_rgba(14,36,60,0.3)]"
    >
      <span className="grid h-9 w-11 shrink-0 place-items-center rounded-md border border-line bg-soft font-mono text-[11px] font-semibold text-mut">
        №{d.number}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-semibold text-ink">{d.items[0]?.name ?? TYPE_META[d.type].label}</span>
        <span className="font-mono text-[10.5px] text-dim">{fmtDate(d.date)}</span>
      </span>
      <span className="text-right">
        <span className="block font-mono text-[13px] font-semibold text-ink">{fmtMoney(calc(d).total)}</span>
        <Badge chip={STATUS_META[d.status].chip} label={STATUS_META[d.status].label} />
      </span>
      <IconArrow size={14} className="shrink-0 text-dim transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-brand" />
    </button>
  );

  const addDocBtn = (type: DocType) => (
    <button
      onClick={() => onNewDoc(type)}
      className="flex cursor-pointer items-center gap-1.5 rounded-md bg-brand px-3 py-2 font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-white transition-colors hover:bg-brand2"
    >
      <IconPlus size={13} /> {TYPE_META[type].label}
    </button>
  );

  return (
    <div className="fade-up space-y-3">
      {/* шапка: назад + действия */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="-ml-2 flex h-8 cursor-pointer items-center gap-1 rounded-md px-3 font-medium text-[#1a237e] transition-colors hover:bg-[#e8eaf6]"
        >
          <IconArrow size={15} className="rotate-180" />
          Назад
        </button>
        <div className="flex items-center gap-1">
          <button
            onClick={onNewSubContract}
            title="Создать подчинённый расходный договор"
            className="mr-1 flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-line px-2.5 font-mono text-[10px] uppercase tracking-[0.06em] text-mut transition-colors hover:border-brand hover:text-brand"
          >
            <IconPlus size={13} /> субдоговор
          </button>
          <button onClick={() => setEditing(true)} title="Редактировать" className="grid h-8 w-8 cursor-pointer place-items-center rounded-md text-mut transition-colors hover:bg-soft hover:text-ink">
            <IconPencil size={16} />
          </button>
          <button onClick={() => window.print()} title="Печать" className="grid h-8 w-8 cursor-pointer place-items-center rounded-md text-mut transition-colors hover:bg-soft hover:text-ink">
            <IconPrint size={16} />
          </button>
          <button onClick={downloadWord} title="Скачать Word" className="grid h-8 w-8 cursor-pointer place-items-center rounded-md text-mut transition-colors hover:bg-soft hover:text-ink">
            <IconDownload size={16} />
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            title="Удалить"
            className="grid h-8 w-8 cursor-pointer place-items-center rounded-md text-danger transition-colors hover:bg-[#fbe7e5]"
          >
            <IconTrash size={16} />
          </button>
        </div>
      </div>

      {/* заголовок */}
      <h2 className="pl-1 text-base font-semibold leading-snug text-[#1a237e]">
        {contract.number} {contract.subject}
      </h2>

      {/* контрагент + бейджи */}
      <div className="flex items-center justify-between pl-1 text-sm">
        <span className="text-mut">{party?.name ?? "—"}</span>
        <div className="flex items-center gap-2">
          <Badge chip={kind.chip} label={kind.label} />
          <Badge chip={status.chip} label={status.label} />
        </div>
      </div>

      {/* 4 карточки-метрики */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <Stat label="Плановый доход" value={fmtMoney(contract.plannedIncome)} color="text-[#2E7D32]" />
        <Stat label="Выставлено счетов" value={fmtMoney(invoiced)} color="text-[#1a237e]" />
        <Stat label="Получено оплат" value={fmtMoney(received)} color="text-[#2E7D32]" />
        <Stat label="Расходы по договору" value={fmtMoney(contract.actualExpense)} color="text-[#C62828]" />
      </div>

      {/* вкладки */}
      <div className="flex gap-1 overflow-x-auto border-b border-line pb-0">
        {tabs.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative flex cursor-pointer items-center gap-1 whitespace-nowrap border-b-2 px-3 py-2 text-sm transition-colors ${
                active ? "border-[#1E88E5] font-medium text-[#1E88E5]" : "border-transparent text-mut hover:text-ink"
              }`}
            >
              <span>{t.label}</span>
              {t.count !== undefined && (
                <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#C62828] text-[10px] font-bold leading-none text-white">
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* содержимое вкладки */}
      {tab === "card" && (
        <div className="fade-up rounded-xl border border-line bg-surface py-6 shadow-sm">
          <div className="space-y-3 p-4">
            <div className="space-y-2">
              <Row label="Номер">{contract.number}</Row>
              <Row label="Предмет">{contract.subject}</Row>
              <Row label="Контрагент">{party?.name ?? "—"}</Row>
              <Row label="Тип">
                <Badge chip={kind.chip} label={kind.label} />
              </Row>
              <Row label="Статус">
                <Badge chip={status.chip} label={status.label} />
              </Row>

              <div className="border-b border-line pb-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-mut">Подчинённые расходные договоры</span>
                  <button
                    onClick={onNewSubContract}
                    className="cursor-pointer font-mono text-[10px] uppercase tracking-[0.08em] text-brand transition-colors hover:text-brand2 hover:underline"
                  >
                    + добавить
                  </button>
                </div>
                <div className="mt-1 space-y-1">
                  {children.length === 0 && <span className="text-sm text-dim">нет</span>}
                  {children.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => onOpenContract(c.id)}
                      className="block cursor-pointer text-left text-sm text-[#1E88E5] transition-colors hover:text-[#1565C0] hover:underline"
                    >
                      ↳ {c.number} — {c.subject}
                    </button>
                  ))}
                </div>
              </div>

              <Row label="Плановый доход">{fmtMoney(contract.plannedIncome)}</Row>
              <Row label="Плановый расход">{fmtMoney(contract.plannedExpense)}</Row>
              <Row label="Чистая прибыль">
                <span className={netProfit(contract) >= 0 ? "text-[#2E7D32]" : "text-[#C62828]"}>{fmtMoney(netProfit(contract))}</span>
              </Row>

              {contract.plannedIncome > 0 && (
                <div className="border-b border-line pb-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-mut">Выполнение плана по доходу</span>
                    <span className="font-mono text-[12px] font-semibold text-ink">{planPct} %</span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-bg">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${planPct >= 100 ? "bg-paid" : "bg-brand"}`}
                      style={{ width: `${planPct}%` }}
                    />
                  </div>
                </div>
              )}

              <Row label="Начало">{fmtDate(contract.startDate)}</Row>
              <Row label="Окончание">{fmtDate(contract.endDate)}</Row>

              <div className="text-sm">
                <span className="text-mut">Описание:</span>
                <p className="mt-1 text-ink">{contract.description || "—"}</p>
              </div>

              <div className="pt-1 text-sm">
                <span className="text-mut">Статус договора:</span>
                <select
                  value={contract.status}
                  onChange={(e) => onStatus(contract.id, e.target.value as ContractStatus)}
                  className="ml-2 cursor-pointer rounded-md border border-line bg-white px-2 py-1.5 text-[12.5px] text-ink outline-none focus:border-brand"
                >
                  {(Object.keys(CONTRACT_STATUS_META) as ContractStatus[]).map((s) => (
                    <option key={s} value={s}>
                      {CONTRACT_STATUS_META[s].label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "invoices" && (
        <div className="fade-up space-y-2">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-dim">
              счетов: {invoices.length} · на сумму {fmtMoney(invoiced)}
            </p>
            {addDocBtn("invoice")}
          </div>
          {invoices.length === 0 && (
            <p className="rounded-xl border border-dashed border-line2 bg-surface p-8 text-center text-[13px] text-mut">
              По этому договору счетов пока нет — создайте первый
            </p>
          )}
          {invoices.map(docRow)}
        </div>
      )}

      {tab === "acts" && (
        <div className="fade-up space-y-2">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-dim">
              актов: {acts.length} · на сумму {fmtMoney(acts.reduce((s, d) => s + calc(d).total, 0))}
            </p>
            {addDocBtn("act")}
          </div>
          {acts.length === 0 && (
            <p className="rounded-xl border border-dashed border-line2 bg-surface p-8 text-center text-[13px] text-mut">
              По этому договору актов пока нет — создайте первый
            </p>
          )}
          {acts.map(docRow)}
        </div>
      )}

      {tab === "payments" && (
        <div className="fade-up space-y-2">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-dim">
              оплат: {payments.length} · получено {fmtMoney(received)}
            </p>
            <button
              onClick={() => setPayForm({ mode: "add" })}
              className="flex cursor-pointer items-center gap-1.5 rounded-md bg-paid px-3 py-2 font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-white transition-colors hover:bg-[#268257]"
              title="Оплату можно привязать к счёту/акту или оставить без привязки"
            >
              <IconPlus size={13} /> оплата
            </button>
          </div>
          {payments.length === 0 && (
            <p className="rounded-xl border border-dashed border-line2 bg-surface p-8 text-center text-[13px] text-mut">
              Оплат по договору пока нет{docs.length > 0 ? " — добавьте первую" : ""}
            </p>
          )}
          {payments.map((p) => {
            const pDoc = docs.find((d) => d.id === p.docId);
            return (
              <div key={p.id} className="group flex items-center gap-3 rounded-lg border border-line bg-surface px-4 py-3 transition-colors hover:border-line2">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-[#e1f3e9] text-paid">
                  <IconCoin size={17} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold text-ink" title={p.name}>{p.name}</span>
                  <span className="font-mono text-[10.5px] text-dim">
                    {fmtDate(p.date)} · {p.method}
                    {pDoc ? ` · № ${pDoc.number}` : ""}
                  </span>
                </span>
                <span className="font-mono text-[13.5px] font-bold text-[#2E7D32]">{fmtMoney(p.amount)}</span>
                <span className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  <button
                    onClick={() => setPayForm({ mode: "edit", pay: p })}
                    className="cursor-pointer rounded-md p-1.5 text-mut transition-colors hover:bg-soft hover:text-ink"
                    title="Редактировать"
                  >
                    <IconPencil size={14} />
                  </button>
                  {confirmPay === p.id ? (
                    <button
                      onClick={() => {
                        onDeletePayment(p.id);
                        setConfirmPay(null);
                      }}
                      className="cursor-pointer rounded-md bg-danger px-2 py-1.5 font-mono text-[9.5px] font-semibold uppercase tracking-[0.06em] text-white transition-colors hover:bg-[#c74444]"
                    >
                      удалить
                    </button>
                  ) : (
                    <button
                      onClick={() => setConfirmPay(p.id)}
                      className="cursor-pointer rounded-md p-1.5 text-mut transition-colors hover:bg-[#fbe7e5] hover:text-danger"
                      title="Удалить"
                    >
                      <IconTrash size={14} />
                    </button>
                  )}
                </span>
              </div>
            );
          })}

          {payForm && (
            <PaymentForm
              title={payForm.mode === "add" ? "Новая оплата" : "Редактирование оплаты"}
              docs={
                payForm.mode === "add"
                  ? docs.map((d) => ({
                      id: d.id,
                      label: `${TYPE_META[d.type].label} № ${d.number} · ${fmtMoney(calc(d).total)}`,
                      total: calc(d).total,
                      paid: paidByDoc.get(d.id) ?? 0,
                      suggestedName: suggestPaymentName(d, contract),
                    }))
                  : undefined
              }
              initial={payForm.mode === "edit" ? payForm.pay : null}
              onSave={(p) => {
                if (payForm.mode === "add") onAddPayment({ ...p, docId: p.docId || docs[0]?.id || "" });
                else onUpdatePayment(p);
                setPayForm(null);
              }}
              onClose={() => setPayForm(null)}
            />
          )}
        </div>
      )}

      {tab === "letters" && (
        <div className="fade-up space-y-2">
          {letters.length === 0 && (
            <p className="rounded-xl border border-dashed border-line2 bg-surface p-8 text-center text-[13px] text-mut">
              Писем по этому контрагенту пока нет
            </p>
          )}
          {letters.map((l) => {
            const open = openLetter === l.id;
            return (
              <div key={l.id} className="rounded-lg border border-line bg-surface transition-colors hover:border-line2">
                <button onClick={() => setOpenLetter(open ? null : l.id)} className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-[#e3f0fc] text-brand">
                    <IconLetter size={17} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold text-ink">{l.subject}</span>
                    <span className="font-mono text-[10.5px] text-dim">
                      {l.number} · {fmtDate(l.date)} · {l.direction === "in" ? "входящее" : "исходящее"}
                    </span>
                  </span>
                  <IconArrow size={14} className={`shrink-0 text-dim transition-transform duration-300 ${open ? "rotate-90" : ""}`} />
                </button>
                {open && <p className="whitespace-pre-wrap border-t border-line px-4 py-3 text-[13px] leading-relaxed text-ink">{l.body}</p>}
              </div>
            );
          })}
        </div>
      )}

      {/* подтверждение удаления */}
      {confirmDelete && (
        <div className="overlay-in fixed inset-0 z-[70] grid place-items-center bg-navy/60 p-4" onClick={() => setConfirmDelete(false)}>
          <div className="modal-in w-full max-w-sm rounded-xl border border-line bg-surface p-6" onClick={(e) => e.stopPropagation()}>
            <p className="font-display text-[15px] font-bold text-ink">Удалить договор {contract.number}?</p>
            <p className="mt-2 text-[13px] leading-relaxed text-mut">Привязанные счета и акты останутся в системе, но потеряют привязку к договору.</p>
            <div className="mt-5 flex justify-end gap-2.5">
              <button onClick={() => setConfirmDelete(false)} className="cursor-pointer rounded-md border border-line px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.1em] text-mut hover:text-ink">
                отмена
              </button>
              <button onClick={() => onDelete(contract.id)} className="cursor-pointer rounded-md bg-danger px-4 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-white hover:bg-[#c74444]">
                удалить
              </button>
            </div>
          </div>
        </div>
      )}

      {editing && (
        <ContractForm
          initial={contract}
          parties={parties}
          parents={contracts.filter((c) => !c.parentId && c.id !== contract.id).map((c) => ({ id: c.id, number: c.number }))}
          onSave={(c) => {
            onUpdate(c);
            setEditing(false);
          }}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  );
}
