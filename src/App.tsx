import { useEffect, useState } from "react";
import {
  loadState,
  saveState,
  seedState,
  nextNumber,
  STATUS_META,
  type Doc,
  type DocStatus,
  type Own,
  type Party,
  type State,
  type View,
} from "./lib/store";
import Dashboard from "./components/Dashboard";
import Documents from "./components/Documents";
import DocumentForm from "./components/DocumentForm";
import DocumentPreview from "./components/DocumentPreview";
import Counterparties from "./components/Counterparties";
import {
  Logo,
  IconGrid,
  IconDoc,
  IconPeople,
  IconSliders,
  IconPlus,
  IconDownload,
} from "./components/icons";

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
type Toast = { id: number; text: string };

const NAV: { id: View; label: string; icon: (p: { size?: number }) => React.ReactNode }[] = [
  { id: "dashboard", label: "Обзор", icon: (p) => <IconGrid {...p} /> },
  { id: "docs", label: "Документы", icon: (p) => <IconDoc {...p} /> },
  { id: "parties", label: "Контрагенты", icon: (p) => <IconPeople {...p} /> },
  { id: "settings", label: "Реквизиты", icon: (p) => <IconSliders {...p} /> },
];

const TITLES: Record<View, { t: string; s: string }> = {
  dashboard: { t: "Обзор", s: "сводка по документам и оплатам" },
  docs: { t: "Документы", s: "счета · акты · договоры" },
  parties: { t: "Контрагенты", s: "база покупателей и заказчиков" },
  settings: { t: "Реквизиты", s: "данные ИП для шапки документов" },
};

/* ---------- реквизиты ---------- */

function SettingsView({ own, onSave, onReset }: { own: Own; onSave: (o: Own) => void; onReset: () => void }) {
  const [f, setF] = useState({ ...own });
  const [confirmReset, setConfirmReset] = useState(false);
  const set = (k: keyof Own) => (e: React.ChangeEvent<HTMLInputElement>) => setF((p) => ({ ...p, [k]: e.target.value }));
  const inp =
    "w-full border border-line bg-white px-3 py-2.5 text-[13.5px] text-ink outline-none transition-colors placeholder:text-dim focus:border-brand";
  const lbl = "mb-1.5 block font-mono text-[10.5px] uppercase tracking-[0.14em] text-mut";

  return (
    <div className="fade-up grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
      <div className="border border-line bg-surface p-6 md:p-7">
        <h3 className="font-display text-[15px] font-bold text-ink">Реквизиты поставщика</h3>
        <p className="mt-1 text-[12.5px] text-mut">Эти данные попадают в шапку каждого счёта, акта и договора</p>

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
          <div className="sm:col-span-2">
            <label className={lbl}>Банк</label>
            <input value={f.bank} onChange={set("bank")} className={inp} />
          </div>
          <div>
            <label className={lbl}>БИК</label>
            <input value={f.bik} onChange={set("bik")} className={inp} />
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

        <button
          onClick={() => onSave(f)}
          className="mt-6 cursor-pointer bg-brand px-6 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-white transition-all hover:bg-brand2 hover:shadow-[0_8px_24px_-8px_rgba(30,136,229,0.6)]"
        >
          сохранить реквизиты
        </button>
      </div>

      <div className="flex flex-col gap-4">
        <div className="border border-line bg-surface p-6">
          <h3 className="font-display text-[14px] font-bold text-ink">Где живут данные</h3>
          <p className="mt-2.5 text-[13px] leading-relaxed text-mut">
            Всё хранится <span className="font-semibold text-ink">локально в браузере</span> (localStorage) и
            доступно офлайн через service worker. Сервер не нужен — это и есть preview-режим.
          </p>
          <p className="mt-3 text-[13px] leading-relaxed text-mut">
            Для переноса на свой сервер достаточно залить собранную папку{" "}
            <span className="font-mono text-[12px] text-brand">dist/</span> — приложение полностью статическое.
          </p>
        </div>

        <div className="border border-line bg-surface p-6">
          <h3 className="font-display text-[14px] font-bold text-ink">PWA-установка</h3>
          <p className="mt-2.5 text-[13px] leading-relaxed text-mut">
            В Chrome и Edge кнопка «Установить» появится в адресной строке, на Android — системный диалог.
            На iPhone: Safari → «Поделиться» → «На экран „Домой"».
          </p>
        </div>

        <div className="border border-danger/30 bg-surface p-6">
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
      </div>
    </div>
  );
}

/* ---------- приложение ---------- */

export default function App() {
  const [state, setState] = useState<State>(loadState);
  const [view, setView] = useState<View>("dashboard");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Doc | null | "new">(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [installEvt, setInstallEvt] = useState<BIPEvent | null>(null);

  useEffect(() => saveState(state), [state]);

  useEffect(() => {
    if ("serviceWorker" in navigator && window.location.protocol.startsWith("http")) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
    const h = (e: Event) => {
      e.preventDefault();
      setInstallEvt(e as BIPEvent);
    };
    window.addEventListener("beforeinstallprompt", h);
    return () => window.removeEventListener("beforeinstallprompt", h);
  }, []);

  const toast = (text: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800);
  };

  const setStatus = (id: string, s: DocStatus) => {
    const doc = state.docs.find((d) => d.id === id);
    setState((st) => ({ ...st, docs: st.docs.map((d) => (d.id === id ? { ...d, status: s } : d)) }));
    if (doc) {
      toast(
        s === "paid"
          ? `№ ${doc.number} оплачен — печать поставлена`
          : `№ ${doc.number}: «${STATUS_META[s].label}»`
      );
    }
  };

  const saveDoc = (doc: Doc) => {
    setState((st) => {
      const exists = st.docs.some((d) => d.id === doc.id);
      return { ...st, docs: exists ? st.docs.map((d) => (d.id === doc.id ? doc : d)) : [...st.docs, doc] };
    });
    setEditing(null);
    setPreviewId(doc.id);
    toast(`Документ № ${doc.number} сохранён`);
  };

  const upsertParty = (p: Party) => {
    setState((st) => {
      const exists = st.parties.some((x) => x.id === p.id);
      return { ...st, parties: exists ? st.parties.map((x) => (x.id === p.id ? p : x)) : [...st.parties, p] };
    });
    toast(`Контрагент «${p.name}» сохранён`);
  };

  const deleteParty = (id: string) => {
    const p = state.parties.find((x) => x.id === id);
    setState((st) => ({ ...st, parties: st.parties.filter((x) => x.id !== id) }));
    if (p) toast(`«${p.name}» удалён из базы`);
  };

  const install = async () => {
    if (!installEvt) return;
    await installEvt.prompt();
    const choice = await installEvt.userChoice;
    if (choice.outcome === "accepted") toast("Приложение установлено");
    setInstallEvt(null);
  };

  const previewDoc = previewId ? state.docs.find((d) => d.id === previewId) ?? null : null;
  const title = TITLES[view];

  const navBtn = (n: (typeof NAV)[number], mobile = false) => {
    const active = view === n.id;
    return (
      <button
        key={n.id}
        onClick={() => setView(n.id)}
        className={`relative flex cursor-pointer items-center gap-3 transition-all duration-200 ${
          mobile
            ? `shrink-0 border-b-2 px-3 pb-2.5 pt-1 font-mono text-[11px] uppercase tracking-[0.1em] ${
                active ? "border-brand text-white" : "border-transparent text-white/55 hover:text-white/85"
              }`
            : `w-full px-3.5 py-2.5 text-left text-[13.5px] font-medium ${
                active ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
              }`
        }`}
      >
        {!mobile && active && <span className="absolute bottom-1.5 left-0 top-1.5 w-[3px] rounded-r bg-brand" />}
        {n.icon({ size: 17 })}
        {n.label}
        {n.id === "docs" && !mobile && (
          <span className={`ml-auto border px-1.5 py-px font-mono text-[10px] ${active ? "border-white/25 text-white/80" : "border-white/15 text-white/45"}`}>
            {state.docs.length}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-bg text-ink">
      {/* сайдбар (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col bg-navy md:flex">
        <div className="flex items-center gap-3 px-5 py-5">
          <Logo size={38} />
          <div>
            <p className="font-display text-[13px] font-bold leading-tight tracking-wide text-white">ИП Документы</p>
            <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-white/40">документооборот</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3 pt-2">{NAV.map((n) => navBtn(n))}</nav>
        <div className="border-t border-white/10 px-5 py-4">
          <p className="text-[12.5px] font-semibold text-white">{state.own.short}</p>
          <p className="mt-0.5 font-mono text-[10px] text-white/40">ИНН {state.own.inn ?? "—"}</p>
          {installEvt ? (
            <button
              onClick={install}
              className="mt-3 flex w-full cursor-pointer items-center justify-center gap-2 bg-brand py-2.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:bg-brand2"
            >
              <IconDownload size={13} /> установить приложение
            </button>
          ) : (
            <p className="mt-3 flex items-center gap-2 font-mono text-[9.5px] uppercase tracking-[0.12em] text-white/35">
              <span className="pulse-soft h-1.5 w-1.5 rounded-full bg-paid" /> pwa · offline-режим
            </p>
          )}
        </div>
      </aside>

      {/* мобильная шапка */}
      <div className="sticky top-0 z-40 bg-navy md:hidden">
        <div className="flex items-center justify-between px-4 pb-2 pt-3">
          <div className="flex items-center gap-2.5">
            <Logo size={32} />
            <p className="font-display text-[13px] font-bold tracking-wide text-white">ИП Документы</p>
          </div>
          <button
            onClick={() => setEditing("new")}
            className="flex cursor-pointer items-center gap-1.5 bg-brand px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-white"
          >
            <IconPlus size={12} /> документ
          </button>
        </div>
        <div className="flex overflow-x-auto px-3">{NAV.map((n) => navBtn(n, true))}</div>
      </div>

      {/* контент */}
      <main className="relative md:pl-60">
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
                className="flex cursor-pointer items-center gap-2 bg-brand px-5 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-white transition-all hover:bg-brand2 hover:shadow-[0_8px_24px_-8px_rgba(30,136,229,0.6)]"
              >
                <IconPlus size={13} /> новый документ
              </button>
            </div>
          </div>

          <div className="px-4 py-6 md:px-8 md:py-7">
            {view === "dashboard" && (
              <Dashboard
                docs={state.docs}
                parties={state.parties}
                onOpen={(id) => setPreviewId(id)}
                onNew={() => setEditing("new")}
                onGoDocs={() => setView("docs")}
              />
            )}
            {view === "docs" && (
              <Documents
                docs={state.docs}
                parties={state.parties}
                onPreview={(id) => setPreviewId(id)}
                onEdit={(d) => setEditing(d)}
                onNew={() => setEditing("new")}
                onStatus={setStatus}
              />
            )}
            {view === "parties" && (
              <Counterparties parties={state.parties} docs={state.docs} onUpsert={upsertParty} onDelete={deleteParty} />
            )}
            {view === "settings" && (
              <SettingsView
                own={state.own}
                onSave={(o) => {
                  setState((st) => ({ ...st, own: o }));
                  toast("Реквизиты сохранены");
                }}
                onReset={() => {
                  setState(seedState());
                  toast("Демо-данные восстановлены");
                }}
              />
            )}
          </div>
        </div>
      </main>

      {/* оверлеи */}
      {previewDoc && (
        <DocumentPreview
          doc={previewDoc}
          party={state.parties.find((p) => p.id === previewDoc.counterpartyId)}
          own={state.own}
          onClose={() => setPreviewId(null)}
          onStatus={setStatus}
          onEdit={(d) => {
            setPreviewId(null);
            setEditing(d);
          }}
        />
      )}

      {editing !== null && (
        <DocumentForm
          initial={editing === "new" ? null : editing}
          parties={state.parties}
          fallbackNumber={nextNumber(state.docs)}
          onSave={saveDoc}
          onClose={() => setEditing(null)}
        />
      )}

      {/* тосты */}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[90] flex flex-col items-end gap-2">
        {toasts.map((t) => (
          <div key={t.id} className="toast-in border-l-[3px] border-paid bg-navy px-4 py-3 font-mono text-[12px] text-white shadow-[0_18px_40px_-12px_rgba(14,36,60,0.5)]">
            {t.text}
          </div>
        ))}
      </div>
    </div>
  );
}
