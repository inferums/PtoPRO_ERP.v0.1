import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  nextNumber,
  todayISO,
  uid,
  fmtMoney,
  suggestPaymentName,
  STATUS_META,
  CONTRACT_STATUS_META,
  emptyState,
  seedState,
  type Contract,
  type ContractStatus,
  type Doc,
  type DocStatus,
  type Letter,
  type Own,
  type Party,
  type Payment,
  type State,
  type View,
} from "./lib/store";
import { clearSession, loadSession, onAuthStateChange, fetchUserContext, type Session } from "./lib/auth";
import type { UserContext } from "./lib/db-types";
import { fetchFullState, upsertParty as apiUpsertParty, deleteParty as apiDeleteParty, upsertContract as apiUpsertContract, deleteContract as apiDeleteContract, upsertDocument as apiUpsertDocument, deleteDocument as apiDeleteDocument, upsertPayment as apiUpsertPayment, deletePayment as apiDeletePayment, upsertLetter as apiUpsertLetter, saveOrgDetails, updateOrgProfile, uploadLogo, migrateStateToSupabase } from "./lib/api";
import { PermissionsProvider, usePermissions } from "./lib/permissions";
import AuthScreen from "./components/AuthScreen";
import Dashboard from "./components/Dashboard";
import Documents from "./components/Documents";
import DocumentForm from "./components/DocumentForm";
import DocumentPreview from "./components/DocumentPreview";
import Contracts from "./components/Contracts";
import ContractDetail from "./components/ContractDetail";
import Finance from "./components/Finance";
import PaymentForm from "./components/PaymentForm";
import Letters from "./components/Letters";
import Counterparties from "./components/Counterparties";
import {
  Logo,
  IconGrid,
  IconContract,
  IconReceipt,
  IconClipboard,
  IconSwap,
  IconLetter,
  IconPeople,
  IconSliders,
  IconPlus,
  IconDownload,
  IconLogout,
  IconMonitor,
  IconPhone,
} from "./components/icons";

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
type Toast = { id: number; text: string; tone: "ok" | "err" };

const NAV: { id: View; label: string; icon: (p: { size?: number }) => ReactNode }[] = [
  { id: "dashboard", label: "Главная", icon: (p) => <IconGrid {...p} /> },
  { id: "contracts", label: "Договоры", icon: (p) => <IconContract {...p} /> },
  { id: "invoices", label: "Счета", icon: (p) => <IconReceipt {...p} /> },
  { id: "acts", label: "Акты", icon: (p) => <IconClipboard {...p} /> },
  { id: "finance", label: "Доходы и расходы", icon: (p) => <IconSwap {...p} /> },
  { id: "letters", label: "Письма", icon: (p) => <IconLetter {...p} /> },
  { id: "parties", label: "Контрагенты", icon: (p) => <IconPeople {...p} /> },
  { id: "settings", label: "Настройки", icon: (p) => <IconSliders {...p} /> },
];

const TITLES: Record<View, { t: string; s: string }> = {
  dashboard: { t: "Главная", s: "сводка по договорам, счетам и оплатам" },
  contracts: { t: "Договоры", s: "доходные и расходные соглашения" },
  invoices: { t: "Счета", s: "счета на оплату по договорам" },
  acts: { t: "Акты", s: "акты выполненных работ" },
  finance: { t: "Доходы и расходы", s: "план · факт · чистая прибыль" },
  letters: { t: "Письма", s: "входящая и исходящая переписка" },
  parties: { t: "Контрагенты", s: "база покупателей и заказчиков" },
  settings: { t: "Настройки", s: "реквизиты, резервные копии, среда" },
};

/* ---------- реквизиты ---------- */

function SettingsView({
  own,
  orgName,
  orgLogoUrl,
  isAdmin,
  onSave,
  onReset,
  onExport,
  onImport,
  onOrgNameSave,
  onLogoUpload,
}: {
  own: Own;
  orgName: string;
  orgLogoUrl: string | null;
  isAdmin: boolean;
  onSave: (o: Own) => void;
  onReset: () => void;
  onExport: () => void;
  onImport: (f: File) => void;
  onOrgNameSave: (name: string) => void;
  onLogoUpload: (file: File) => void;
}) {
  const [f, setF] = useState({ ...own });
  const [confirmReset, setConfirmReset] = useState(false);
  const [editingOrgName, setEditingOrgName] = useState(false);
  const [orgNameDraft, setOrgNameDraft] = useState(orgName);
  const importRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const set = (k: keyof Own) => (e: React.ChangeEvent<HTMLInputElement>) => setF((p) => ({ ...p, [k]: e.target.value }));
  const inp =
    "w-full rounded-md border border-line bg-white px-3 py-2.5 text-[13.5px] text-ink outline-none transition-colors placeholder:text-dim focus:border-brand focus:ring-[3px] focus:ring-brand/15";
  const lbl = "mb-1.5 block font-mono text-[10.5px] uppercase tracking-[0.14em] text-mut";

  return (
    <div className="fade-up grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
      {/* ─── профиль организации ─── */}
      <div className="rounded-xl border border-line bg-surface p-6 shadow-sm md:p-7">
        <h3 className="font-display text-[15px] font-bold text-ink">Профиль организации</h3>
        <p className="mt-1 text-[12.5px] text-mut">Название и логотип — отображаются в интерфейсе и документах</p>

        <div className="mt-5 flex items-start gap-5">
          {/* логотип */}
          <div className="flex shrink-0 flex-col items-center gap-2">
            <div className="flex size-16 items-center justify-center overflow-hidden rounded-xl border border-line bg-soft">
              {orgLogoUrl ? (
                <img src={orgLogoUrl} alt="Логотип" className="size-full object-contain" />
              ) : (
                <span className="font-mono text-[10px] text-dim">нет</span>
              )}
            </div>
            {isAdmin && (
              <button
                type="button"
                onClick={() => logoRef.current?.click()}
                className="cursor-pointer font-mono text-[10px] uppercase tracking-[0.1em] text-brand hover:underline"
              >
                загрузить
              </button>
            )}
            <input
              ref={logoRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file && isAdmin) onLogoUpload(file);
                e.target.value = "";
              }}
            />
          </div>

          {/* название */}
          <div className="min-w-0 flex-1">
            <label className={lbl}>Наименование</label>
            {editingOrgName ? (
              <div className="flex gap-2">
                <input
                  value={orgNameDraft}
                  onChange={(e) => setOrgNameDraft(e.target.value)}
                  className={inp}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => { onOrgNameSave(orgNameDraft); setEditingOrgName(false); }}
                  className="shrink-0 cursor-pointer bg-brand px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-white hover:bg-brand2"
                >
                  сохранить
                </button>
                <button
                  type="button"
                  onClick={() => { setEditingOrgName(false); setOrgNameDraft(orgName); }}
                  className="shrink-0 cursor-pointer border border-line px-4 py-2 font-mono text-[10px] uppercase tracking-[0.1em] text-mut hover:text-ink"
                >
                  отмена
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-semibold text-ink">{orgName || "—"}</span>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => { setEditingOrgName(true); setOrgNameDraft(orgName); }}
                    className="cursor-pointer font-mono text-[10px] uppercase tracking-[0.1em] text-brand hover:underline"
                  >
                    изменить
                  </button>
                )}
              </div>
            )}
            <p className="mt-2 text-[11.5px] text-dim">
              Роль: <span className="font-semibold text-ink">{isAdmin ? "Администратор" : "Пользователь"}</span>
            </p>
          </div>
        </div>
      </div>

      {/* ─── реквизиты ─── */}
      <div className="rounded-xl border border-line bg-surface p-6 shadow-sm md:p-7">
        <h3 className="font-display text-[15px] font-bold text-ink">Реквизиты поставщика</h3>
        <p className="mt-1 text-[12.5px] text-mut">Эти данные попадают в шапку и колонтитул каждого счёта, акта и договора</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={lbl}>Полное наименование</label>
            <input value={f.name} onChange={set("name")} className={inp} />
          </div>
          <div>
            <label className={lbl}>Короткое имя</label>
            <input value={f.short} onChange={set("short")} className={inp} />
          </div>
          <div>
            <label className={lbl}>ИНН</label>
            <input value={f.inn ?? ""} onChange={set("inn")} className={inp} />
          </div>
          <div className="sm:col-span-2">
            <label className={lbl}>Адрес</label>
            <input value={f.address ?? ""} onChange={set("address")} className={inp} />
          </div>
          <div>
            <label className={lbl}>Телефон (колонтитул)</label>
            <input value={f.phone ?? ""} onChange={set("phone")} className={inp} />
          </div>
          <div>
            <label className={lbl}>Email (колонтитул)</label>
            <input value={f.email ?? ""} onChange={set("email")} className={inp} />
          </div>
          <div className="sm:col-span-2">
            <label className={lbl}>Сайт (колонтитул)</label>
            <input value={f.website ?? ""} onChange={set("website")} className={inp} />
          </div>
          <div className="sm:col-span-2">
            <label className={lbl}>Банк</label>
            <input value={f.bank} onChange={set("bank")} className={inp} />
          </div>
          <div>
            <label className={lbl}>БИК</label>
            <input value={f.bik} onChange={set("bik")} className={inp} />
          </div>
          <div>
            <label className={lbl}>Корр. счёт</label>
            <input value={f.corrAccount ?? ""} onChange={set("corrAccount")} className={inp} />
          </div>
          <div>
            <label className={lbl}>Расчётный счёт</label>
            <input value={f.account} onChange={set("account")} className={inp} />
          </div>
          <div>
            <label className={lbl}>Подпись (руководитель)</label>
            <input value={f.director} onChange={set("director")} className={inp} />
          </div>
        </div>

        {isAdmin && (
          <button
            onClick={() => onSave(f)}
            className="mt-6 cursor-pointer bg-brand px-6 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-white transition-all hover:bg-brand2 hover:shadow-[0_8px_24px_-8px_rgba(30,136,229,0.6)]"
          >
            сохранить реквизиты
          </button>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <div className="rounded-xl border border-line bg-surface p-6 shadow-sm">
          <h3 className="font-display text-[14px] font-bold text-ink">Где живут данные</h3>
          <p className="mt-2.5 text-[13px] leading-relaxed text-mut">
            Данные хранятся в <span className="font-semibold text-ink">облачной базе Supabase</span> и
            синхронизируются в реальном времени. Доступны с любого устройства после входа.
          </p>
          <p className="mt-3 text-[13px] leading-relaxed text-mut">
            Организация: <span className="font-semibold text-ink">{orgName || "—"}</span>
          </p>
        </div>

        {isAdmin && (
        <div className="border border-line bg-surface p-6">
          <h3 className="font-display text-[14px] font-bold text-ink">Резервные копии</h3>
          <p className="mt-2.5 text-[13px] leading-relaxed text-mut">
            Вся база выгружается одним JSON-файлом — переносите между браузерами и устройствами.
          </p>
          <div className="mt-4 flex flex-wrap gap-2.5">
            <button
              onClick={onExport}
              className="flex cursor-pointer items-center gap-2 border border-brand px-4 py-2.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-brand transition-colors hover:bg-brand hover:text-white"
            >
              <IconDownload size={13} /> выгрузить json
            </button>
            <button
              onClick={() => importRef.current?.click()}
              className="cursor-pointer border border-line px-4 py-2.5 font-mono text-[10.5px] uppercase tracking-[0.1em] text-mut transition-colors hover:border-navy hover:text-navy"
            >
              загрузить копию
            </button>
            <input
              ref={importRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onImport(file);
                e.target.value = "";
              }}
            />
          </div>
        </div>
        )}

        <div className="rounded-xl border border-line bg-surface p-6 shadow-sm">
          <h3 className="font-display text-[14px] font-bold text-ink">PWA-установка</h3>
          <p className="mt-2.5 text-[13px] leading-relaxed text-mut">
            В Chrome и Edge кнопка «Установить» появится в адресной строке, на Android — системный диалог.
            На iPhone: Safari → «Поделиться» → «На экран „Домой"».
          </p>
        </div>

        {isAdmin && (
        <div className="rounded-xl border border-danger/30 bg-surface p-6 shadow-sm">
          <h3 className="font-display text-[14px] font-bold text-danger">Сброс</h3>
          <p className="mt-2 text-[12.5px] leading-relaxed text-mut">Вернуть демо-данные, удалив все свои изменения.</p>
          {confirmReset ? (
            <div className="mt-4 flex gap-2.5">
              <button
                onClick={() => {
                  onReset();
                  setConfirmReset(false);
                }}
                className="cursor-pointer bg-danger px-4 py-2.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#c74444]"
              >
                да, сбросить всё
              </button>
              <button onClick={() => setConfirmReset(false)} className="cursor-pointer border border-line px-4 py-2.5 font-mono text-[10.5px] uppercase tracking-[0.1em] text-mut hover:text-ink">
                отмена
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmReset(true)}
              className="mt-4 cursor-pointer border border-danger/40 px-4 py-2.5 font-mono text-[10.5px] uppercase tracking-[0.1em] text-danger transition-colors hover:bg-danger/10"
            >
              восстановить демо-данные
            </button>
          )}
        </div>
        )}
      </div>
    </div>
  );
}

/* ---------- приложение ---------- */

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [userCtx, setUserCtx] = useState<UserContext | null>(null);
  const [state, setState] = useState<State>(emptyState);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("dashboard");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [contractId, setContractId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Doc | null | "new">(null);
  const [partialFor, setPartialFor] = useState<Doc | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [installEvt, setInstallEvt] = useState<BIPEvent | null>(null);
  const [mobileMode, setMobileMode] = useState<boolean>(() => {
    try { return localStorage.getItem("ip-dok-v2:mobileui") === "1"; } catch { return false; }
  });

  const toggleMobileMode = () => {
    setMobileMode((m) => {
      const next = !m;
      try { localStorage.setItem("ip-dok-v2:mobileui", next ? "1" : "0"); } catch { /* incognito */ }
      return next;
    });
  };

  const toast = useCallback((text: string, tone: "ok" | "err" = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800);
  }, []);

  /* загрузка данных из Supabase */
  const loadData = useCallback(async (orgId: string) => {
    try {
      const data = await fetchFullState(orgId);
      setState(data);
    } catch (e) {
      console.error("Failed to load data:", e);
      toast("Не удалось загрузить данные из облака", "err");
    }
  }, [toast]);

  /* инициализация сессии */
  useEffect(() => {
    loadSession().then(async (s) => {
      if (s) {
        setSession(s);
        const ctx = await fetchUserContext();
        setUserCtx(ctx);
        if (ctx) await loadData(ctx.orgId);
      }
      setLoading(false);
    });

    const { data: { subscription } } = onAuthStateChange(async (s) => {
      if (!s) {
        setSession(null);
        setUserCtx(null);
        setState(emptyState());
        setPreviewId(null);
        setContractId(null);
        setEditing(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadData]);

  const handleAuthed = async () => {
    const s = await loadSession();
    if (!s) return;
    setSession(s);
    const ctx = await fetchUserContext();
    setUserCtx(ctx);
    if (ctx) {
      await loadData(ctx.orgId);
      toast(`Добро пожаловать, ${ctx.fullName || ctx.email}`);
    }
    setView("dashboard");
  };

  const logout = () => {
    clearSession();
    setSession(null);
    setUserCtx(null);
    setPreviewId(null);
    setContractId(null);
    setEditing(null);
  };

  useEffect(() => {
    if ("serviceWorker" in navigator && window.location.protocol.startsWith("http")) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
    const h = (e: Event) => { e.preventDefault(); setInstallEvt(e as BIPEvent); };
    window.addEventListener("beforeinstallprompt", h);
    return () => window.removeEventListener("beforeinstallprompt", h);
  }, []);

  const orgId = userCtx?.orgId ?? "";

  const setStatus = (id: string, s: DocStatus) => {
    const doc = state.docs.find((d) => d.id === id);
    if (!doc) return;

    if (s === "paid") {
      const total = doc.items.reduce((sm, it) => sm + it.qty * it.price, 0);
      const paidSum = state.payments.filter((p) => p.docId === id).reduce((sm, p) => sm + p.amount, 0);
      const rest = Math.max(total - paidSum, 0);
      const contract = state.contracts.find((c) => c.id === doc.contractId);
      const autoName = suggestPaymentName(doc, contract);
      const autoPayment = rest > 0 ? { id: uid(), docId: id, date: todayISO(), amount: rest, method: "Банковский перевод", name: autoName } : null;

      setState((st) => ({
        ...st,
        payments: autoPayment ? [...st.payments, autoPayment] : st.payments,
        docs: st.docs.map((d) => (d.id === id ? { ...d, status: s } : d)),
      }));

      /* sync to Supabase */
      apiUpsertDocument(orgId, { ...doc, status: s }).catch(() => {});
      if (autoPayment) apiUpsertPayment(orgId, autoPayment).catch(() => {});

      toast(rest > 0 ? `№ ${doc.number} оплачен — платёж на ${rest.toLocaleString("ru-RU")} ₽ создан автоматически` : `№ ${doc.number}: «Оплачен»`);
      return;
    }

    if (s === "paid_partial") { setPartialFor(doc); return; }

    setState((st) => ({ ...st, docs: st.docs.map((d) => (d.id === id ? { ...d, status: s } : d)) }));
    apiUpsertDocument(orgId, { ...doc, status: s }).catch(() => {});
    toast(`№ ${doc.number}: «${STATUS_META[s].label}»`);
  };

  const saveDoc = (doc: Doc) => {
    setState((st) => {
      const exists = st.docs.some((d) => d.id === doc.id);
      return { ...st, docs: exists ? st.docs.map((d) => (d.id === doc.id ? doc : d)) : [...st.docs, doc] };
    });
    setEditing(null);
    setPreviewId(doc.id);
    apiUpsertDocument(orgId, doc).catch(() => toast("Ошибка сохранения в облако", "err"));
    toast(`Документ № ${doc.number} сохранён`);
  };

  const upsertParty = (p: Party) => {
    setState((st) => {
      const exists = st.parties.some((x) => x.id === p.id);
      return { ...st, parties: exists ? st.parties.map((x) => (x.id === p.id ? p : x)) : [...st.parties, p] };
    });
    apiUpsertParty(orgId, p).catch(() => toast("Ошибка сохранения", "err"));
    toast(`Контрагент «${p.name}» сохранён`);
  };

  const deleteParty = (id: string) => {
    if (state.docs.some((d) => d.counterpartyId === id)) { toast("Нельзя удалить: по контрагенту есть документы", "err"); return; }
    const p = state.parties.find((x) => x.id === id);
    setState((st) => ({ ...st, parties: st.parties.filter((x) => x.id !== id) }));
    apiDeleteParty(id).catch(() => toast("Ошибка удаления", "err"));
    if (p) toast(`«${p.name}» удалён из базы`);
  };

  const upsertContract = (c: Contract) => {
    setState((st) => {
      const exists = st.contracts.some((x) => x.id === c.id);
      return { ...st, contracts: exists ? st.contracts.map((x) => (x.id === c.id ? c : x)) : [...st.contracts, c] };
    });
    apiUpsertContract(orgId, c).catch(() => toast("Ошибка сохранения", "err"));
    toast(`Договор № ${c.number} сохранён`);
  };

  const setContractStatus = (id: string, s: ContractStatus) => {
    const c = state.contracts.find((x) => x.id === id);
    setState((st) => ({ ...st, contracts: st.contracts.map((x) => (x.id === id ? { ...x, status: s } : x)) }));
    if (c) apiUpsertContract(orgId, { ...c, status: s }).catch(() => {});
    if (c) toast(`Договор № ${c.number}: «${CONTRACT_STATUS_META[s].label}»`);
  };

  const deleteContract = (id: string) => {
    if (state.docs.some((d) => d.contractId === id)) { toast("Нельзя удалить: к договору привязаны документы", "err"); return; }
    const c = state.contracts.find((x) => x.id === id);
    setState((st) => ({ ...st, contracts: st.contracts.filter((x) => x.id !== id) }));
    apiDeleteContract(id).catch(() => toast("Ошибка удаления", "err"));
    if (c) toast(`Договор № ${c.number} удалён`);
  };

  const addPayment = (p: Payment) => {
    setState((st) => {
      const doc = st.docs.find((d) => d.id === p.docId);
      const docTotal = doc ? doc.items.reduce((s, it) => s + it.qty * it.price, 0) : Infinity;
      const alreadyPaid = st.payments.filter((x) => x.docId === p.docId).reduce((s, x) => s + x.amount, 0);
      const newSum = alreadyPaid + p.amount;
      const docs = doc
        ? st.docs.map((d) => d.id === p.docId ? { ...d, status: (newSum >= docTotal ? "paid" : newSum > 0 && d.status !== "paid" ? "paid_partial" : d.status) as DocStatus } : d)
        : st.docs;
      return { ...st, payments: [...st.payments, p], docs };
    });
    apiUpsertPayment(orgId, p).catch(() => toast("Ошибка сохранения оплаты", "err"));
    toast(`Оплата ${p.amount.toLocaleString("ru-RU")} ₽ записана`);
  };

  const updatePayment = (p: Payment) => {
    setState((st) => ({ ...st, payments: st.payments.map((x) => (x.id === p.id ? p : x)) }));
    apiUpsertPayment(orgId, p).catch(() => {});
    toast("Оплата обновлена");
  };

  const deletePayment = (id: string) => {
    setState((st) => ({ ...st, payments: st.payments.filter((x) => x.id !== id) }));
    apiDeletePayment(id).catch(() => {});
    toast("Оплата удалена");
  };

  /* подтверждение частичной оплаты из модального окна */
  const confirmPartial = (p: Payment) => {
    if (!partialFor) return;
    addPayment({ ...p, docId: partialFor.id });
    setPartialFor(null);
  };

  const addLetter = (l: Letter) => {
    setState((st) => ({ ...st, letters: [...st.letters, l] }));
    apiUpsertLetter(orgId, l).catch(() => toast("Ошибка сохранения письма", "err"));
    toast(`Письмо «${l.subject}» сохранено`);
  };

  const exportBackup = () => {
    const date = new Date().toISOString().slice(0, 10);
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ip-dokumenty-backup-${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 800);
    toast("Резервная копия выгружена в JSON");
  };

  const importBackup = (file: File) => {
    file
      .text()
      .then(async (text) => {
        const parsed = JSON.parse(text) as Partial<State>;
        if (!Array.isArray(parsed.docs) || !Array.isArray(parsed.parties) || !parsed.own) {
          throw new Error("bad shape");
        }
        const imported: State = {
          docs: parsed.docs.filter((d) => d && (d.type === "invoice" || d.type === "act")),
          parties: parsed.parties,
          contracts: Array.isArray(parsed.contracts) ? parsed.contracts : [],
          payments: Array.isArray(parsed.payments) ? parsed.payments : [],
          letters: Array.isArray(parsed.letters) ? parsed.letters : [],
          own: { ...emptyState().own, ...parsed.own },
        };
        setState(imported);
        /* sync to Supabase */
        if (orgId) {
          try {
            await migrateStateToSupabase(orgId, imported);
          } catch { toast("Импорт в локальное состояние OK, но ошибка загрузки в облако", "err"); }
        }
        toast(`Импортировано: ${parsed.docs.length} документов, ${parsed.parties.length} контрагентов`);
      })
      .catch(() => toast("Файл не похож на резервную копию — импорт отменён", "err"));
  };

  const install = async () => {
    if (!installEvt) return;
    await installEvt.prompt();
    const choice = await installEvt.userChoice;
    if (choice.outcome === "accepted") toast("Приложение установлено");
    setInstallEvt(null);
  };

  const previewDoc = previewId ? state.docs.find((d) => d.id === previewId) ?? null : null;
  const previewContract = contractId ? state.contracts.find((c) => c.id === contractId) ?? null : null;
  const title = TITLES[view];

  /* загрузка сессии */
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-4">
          <Logo size={48} />
          <div className="h-1 w-32 overflow-hidden rounded-full bg-line">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-brand" />
          </div>
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">загрузка…</p>
        </div>
      </div>
    );
  }

  /* без сессии — только вход в систему */
  if (!session) {
    return (
      <>
        <AuthScreen onAuthed={handleAuthed} />
        <div className="pointer-events-none fixed bottom-5 right-5 z-[90] flex flex-col items-end gap-2">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`toast-in rounded-lg border-l-[3px] bg-navy px-4 py-3 text-[12px] font-medium text-white shadow-[0_18px_40px_-12px_rgba(14,36,60,0.5)] ${
                t.tone === "ok" ? "border-paid" : "border-danger"
              }`}
            >
              {t.text}
            </div>
          ))}
        </div>
      </>
    );
  }

  /* переход по меню: всегда закрывает открытый договор, чтобы смена вкладки сработала */
  const go = (id: View) => {
    setContractId(null);
    setView(id);
  };

  const navBtn = (n: (typeof NAV)[number], mobile = false) => {
    const active = view === n.id && !previewContract;
    return (
      <button
        key={n.id}
        onClick={() => go(n.id)}
        title={mobile ? undefined : n.label}
        className={`flex cursor-pointer items-center whitespace-nowrap transition-all duration-200 ${
          mobile
            ? `shrink-0 gap-1.5 border-b-2 px-3 pb-2.5 pt-1 font-mono text-[11px] uppercase tracking-[0.08em] ${
                active ? "border-brand text-white" : "border-transparent text-white/55 hover:text-white/85"
              }`
            : `w-full gap-3 rounded-xl px-4 py-3 text-sm font-medium ${
                active
                  ? "bg-[#1E88E5] text-white shadow-md"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`
        }`}
      >
        <span className="shrink-0">{n.icon({ size: 20 })}</span>
        <span
          className={`overflow-hidden transition-all duration-200 ${
            mobile ? "" : "max-w-[150px] opacity-100"
          }`}
        >
          {n.label}
        </span>
      </button>
    );
  };

  return (
    <PermissionsProvider ctx={userCtx}>
    <div className="min-h-screen bg-bg text-ink">
      {/* сайдбар: фиксированная ширина, иконки + метки всегда видны */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-56 flex-col bg-[#323233] shadow-xl ${
          mobileMode ? "hidden" : "hidden md:flex"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-white/10 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl shadow-md">
                <Logo size={36} />
              </div>
              <span className="whitespace-nowrap text-sm font-semibold text-white">
                PtoPRO-ERP
              </span>
            </div>
          </div>

          <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">{NAV.map((n) => navBtn(n))}</nav>

          <div className="border-t border-white/10 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs text-white/60">ПК</span>
              <div className="flex items-center gap-1.5">
                <IconMonitor size={14} className="text-white/60" />
                <button
                  type="button"
                  role="switch"
                  aria-checked={mobileMode}
                  onClick={toggleMobileMode}
                  title="Мобильная версия интерфейса"
                  className={`inline-flex h-[1.15rem] w-8 shrink-0 cursor-pointer items-center rounded-full border border-transparent shadow-xs transition-all ${
                    mobileMode ? "bg-[#1E88E5]" : "bg-white/20"
                  }`}
                >
                  <span
                    className={`pointer-events-none block size-4 rounded-full bg-white ring-0 transition-transform ${
                      mobileMode ? "translate-x-[calc(100%-2px)]" : "translate-x-0"
                    }`}
                  />
                </button>
                <IconPhone size={14} className="text-white/60" />
              </div>
              <span className="text-xs text-white/60">Тел</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="min-w-0 flex-1 truncate text-sm text-white/70">
                {state.own.short}
              </span>
              {installEvt && (
                <button
                  onClick={install}
                  title="Установить приложение"
                  className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-white/50 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <IconDownload size={15} />
                </button>
              )}
              <button
                onClick={logout}
                title="Выйти"
                className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-white/50 transition-colors hover:bg-white/10 hover:text-danger"
              >
                <IconLogout size={15} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* мобильная шапка (на телефонах всегда; на ПК — когда включён мобильный режим) */}
      <div className={`sticky top-0 z-40 bg-[#323233] shadow-lg ${mobileMode ? "" : "md:hidden"}`}>
        <div className="flex items-center justify-between px-4 pb-2 pt-3">
          <div className="flex items-center gap-2.5">
            <Logo size={32} />
            <p className="text-sm font-semibold text-white">PtoPRO-ERP</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMobileMode}
              className="cursor-pointer border border-white/15 p-2 text-white/60 transition-colors hover:text-white"
              title="Вернуть десктопную версию"
            >
              <IconMonitor size={14} />
            </button>
            <button onClick={logout} className="cursor-pointer border border-white/15 p-2 text-white/60 transition-colors hover:text-danger" title="Выйти">
              <IconLogout size={14} />
            </button>
            <button
              onClick={() => setEditing("new")}
              className="flex cursor-pointer items-center gap-1.5 rounded-md bg-brand px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-white"
            >
              <IconPlus size={12} /> документ
            </button>
          </div>
        </div>
        <div className="flex overflow-x-auto px-3">{NAV.map((n) => navBtn(n, true))}</div>
      </div>

      {/* контент */}
      <main className={`relative ${mobileMode ? "" : "md:pl-56"}`}>
        <div aria-hidden="true" className="bg-dots pointer-events-none absolute inset-0" />
        <div className="relative">
          <div className="sticky top-0 z-30 hidden border-b border-line bg-bg/95 px-8 py-4 backdrop-blur-sm md:flex md:items-center md:justify-between">
            <div>
              <h1 className="font-display text-[20px] font-extrabold tracking-tight text-ink">{title.t}</h1>
              <p className="mt-0.5 font-mono text-[10.5px] uppercase tracking-[0.16em] text-dim">{title.s}</p>
            </div>
            <div className="flex items-center gap-2.5">
              {installEvt && (
                <button
                  onClick={install}
                  className="flex cursor-pointer items-center gap-2 border border-brand px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.1em] text-brand transition-colors hover:bg-brand hover:text-white"
                >
                  <IconDownload size={13} /> установить
                </button>
              )}
              <button
                onClick={() => setEditing("new")}
                className="flex cursor-pointer items-center gap-2 rounded-md bg-brand px-5 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-white transition-all hover:bg-brand2 hover:shadow-[0_8px_24px_-8px_rgba(30,136,229,0.6)]"
              >
                <IconPlus size={13} /> новый документ
              </button>
            </div>
          </div>

          <div className="px-4 py-6 md:px-8 md:py-7">
            {previewContract ? (
              <ContractDetail
                contract={previewContract}
                party={state.parties.find((p) => p.id === previewContract.counterpartyId)}
                docs={state.docs.filter((d) => d.contractId === previewContract.id)}
                payments={state.payments.filter((p) =>
                  state.docs.some((d) => d.id === p.docId && d.contractId === previewContract.id)
                )}
                letters={state.letters.filter((l) => l.counterpartyId === previewContract.counterpartyId)}
                contracts={state.contracts}
                parties={state.parties}
                own={state.own}
                onBack={() => setContractId(null)}
                onOpenContract={(id) => setContractId(id)}
                onStatus={setContractStatus}
                onUpdate={upsertContract}
                onDelete={(id) => {
                  deleteContract(id);
                  setContractId(null);
                }}
                onOpenDoc={(id) => setPreviewId(id)}
                onAddPayment={addPayment}
                onUpdatePayment={updatePayment}
                onDeletePayment={deletePayment}
              />
            ) : (
              <>
            {view === "dashboard" && (
              <Dashboard
                docs={state.docs}
                parties={state.parties}
                onOpen={(id) => setPreviewId(id)}
                onNew={() => setEditing("new")}
                onGoDocs={() => go("contracts")}
              />
            )}
            {(view === "invoices" || view === "acts") && (
              <Documents
                docs={state.docs}
                parties={state.parties}
                contracts={state.contracts.map((c) => ({ id: c.id, number: c.number }))}
                typeFilter={view === "invoices" ? "invoice" : "act"}
                onPreview={(id) => setPreviewId(id)}
                onEdit={(d) => setEditing(d)}
                onNew={() => setEditing("new")}
                onStatus={setStatus}
                onOpenContract={(id) => setContractId(id)}
              />
            )}
            {view === "contracts" && (
              <Contracts
                contracts={state.contracts}
                parties={state.parties}
                docs={state.docs}
                onUpsert={upsertContract}
                onDelete={deleteContract}
                onOpen={(id) => setContractId(id)}
              />
            )}
            {view === "finance" && (
              <Finance
                contracts={state.contracts}
                docs={state.docs}
                payments={state.payments}
                parties={state.parties}
                onAddPayment={addPayment}
                onUpdatePayment={updatePayment}
                onDeletePayment={deletePayment}
                onOpenContract={(id) => setContractId(id)}
              />
            )}
            {view === "letters" && <Letters letters={state.letters} parties={state.parties} onAdd={addLetter} />}
            {view === "parties" && (
              <Counterparties parties={state.parties} docs={state.docs} onUpsert={upsertParty} onDelete={deleteParty} />
            )}
            {view === "settings" && (
              <SettingsView
                own={state.own}
                orgName={userCtx?.orgName ?? ""}
                orgLogoUrl={userCtx?.orgLogoUrl ?? null}
                isAdmin={userCtx?.role === "admin"}
                onSave={(o) => {
                  setState((st) => ({ ...st, own: o }));
                  saveOrgDetails(orgId, o).catch(() => toast("Ошибка сохранения реквизитов", "err"));
                  toast("Реквизиты сохранены");
                }}
                onOrgNameSave={(name) => {
                  setUserCtx((ctx) => ctx ? { ...ctx, orgName: name } : ctx);
                  updateOrgProfile(orgId, { name, short_name: name }).catch(() => toast("Ошибка сохранения", "err"));
                  toast("Название организации обновлено");
                }}
                onLogoUpload={async (file) => {
                  try {
                    const url = await uploadLogo(orgId, file);
                    setUserCtx((ctx) => ctx ? { ...ctx, orgLogoUrl: url } : ctx);
                    toast("Логотип загружен");
                  } catch { toast("Ошибка загрузки логотипа", "err"); }
                }}
                onReset={() => {
                  setState(seedState());
                  if (orgId) migrateStateToSupabase(orgId, seedState()).catch(() => {});
                  toast("Демо-данные восстановлены");
                }}
                onExport={exportBackup}
                onImport={importBackup}
              />
            )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* оверлеи */}
      {previewDoc &&
        (() => {
          const docContract = state.contracts.find((x) => x.id === previewDoc.contractId);
          return (
            <DocumentPreview
              doc={previewDoc}
              party={state.parties.find((p) => p.id === previewDoc.counterpartyId)}
              own={state.own}
              contract={docContract}
              payments={state.payments.filter((p) => p.docId === previewDoc.id)}
              onClose={() => setPreviewId(null)}
              onStatus={setStatus}
              onEdit={(d) => {
                setPreviewId(null);
                setEditing(d);
              }}
              onQuickPay={(amount) =>
                addPayment({
                  id: uid(),
                  docId: previewDoc.id,
                  date: todayISO(),
                  amount,
                  method: "Банковский перевод",
                  name: suggestPaymentName(previewDoc, docContract),
                })
              }
              onAddPayment={addPayment}
              onUpdatePayment={updatePayment}
              onDeletePayment={deletePayment}
            />
          );
        })()}

      {editing !== null && (
        <DocumentForm
          initial={editing === "new" ? null : editing}
          parties={state.parties}
          contracts={state.contracts.map((c) => ({ id: c.id, number: c.number, subject: c.subject }))}
          fallbackNumber={nextNumber(state.docs)}
          forcedType={view === "acts" ? "act" : view === "invoices" ? "invoice" : undefined}
          onSave={saveDoc}
          onClose={() => setEditing(null)}
        />
      )}

      {/* запрос суммы частичной оплаты */}
      {partialFor && (
        <PaymentForm
          title={`Частичная оплата · № ${partialFor.number}`}
          docs={[
            {
              id: partialFor.id,
              label: `№ ${partialFor.number} · ${fmtMoney(partialFor.items.reduce((s, it) => s + it.qty * it.price, 0))}`,
              total: partialFor.items.reduce((s, it) => s + it.qty * it.price, 0),
              paid: state.payments.filter((p) => p.docId === partialFor.id).reduce((s, p) => s + p.amount, 0),
              suggestedName: suggestPaymentName(partialFor, state.contracts.find((c) => c.id === partialFor.contractId)),
            },
          ]}
          info={
            <>
              Введите полученную сумму — счёт получит статус{" "}
              <b className="text-[#00796b]">«Частично оплачен»</b>. Когда оплаты покроют счёт целиком, статус
              автоматически станет <b className="text-paid">«Оплачен»</b>.
            </>
          }
          onSave={confirmPartial}
          onClose={() => setPartialFor(null)}
        />
      )}

      {/* тосты */}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[90] flex flex-col items-end gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast-in rounded-lg border-l-[3px] bg-navy px-4 py-3 text-[12px] font-medium text-white shadow-[0_18px_40px_-12px_rgba(14,36,60,0.5)] ${
              t.tone === "ok" ? "border-paid" : "border-danger"
            }`}
          >
            {t.text}
          </div>
        ))}
      </div>
    </div>
    </PermissionsProvider>
  );
}
