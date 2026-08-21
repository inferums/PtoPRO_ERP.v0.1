import { useEffect } from "react";
import {
  amountInWords,
  calc,
  fmtDate,
  fmtMoney,
  STATUS_META,
  TYPE_META,
  type Doc,
  type Own,
  type Party,
} from "../lib/store";
import { IconArrow, IconClose, IconDownload, IconPencil, IconPrint } from "./icons";

function Stamp({ date, short }: { date: string; short: string }) {
  return (
    <div className="stamp-in pointer-events-none absolute right-10 top-[56%] z-10 grid h-36 w-36 place-items-center rounded-full border-[3px] border-stamp/70 text-stamp mix-blend-multiply">
      <div className="grid h-[130px] w-[130px] place-items-center rounded-full border border-stamp/70 text-center">
        <div>
          <p className="font-display text-[13px] font-extrabold tracking-[0.16em]">ОПЛАЧЕНО</p>
          <p className="mt-1 font-mono text-[10px]">{fmtDate(date)}</p>
          <p className="mt-0.5 font-mono text-[9px] opacity-80">{short}</p>
        </div>
      </div>
    </div>
  );
}

export default function DocumentPreview({
  doc,
  party,
  own,
  onClose,
  onStatus,
  onEdit,
}: {
  doc: Doc;
  party: Party | undefined;
  own: Own;
  onClose: () => void;
  onStatus: (id: string, s: NonNullable<(typeof STATUS_META)[keyof typeof STATUS_META]["next"]>) => void;
  onEdit: (doc: Doc) => void;
}) {
  const meta = STATUS_META[doc.status];
  const { subtotal, vat, total } = calc(doc);

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  /* библиотека docx подгружается только по нажатию — не тянет основной бандл */
  const downloadWord = async () => {
    const { downloadDocx } = await import("../lib/docx");
    await downloadDocx(doc, party, own);
  };

  return (
    <div className="overlay-in fixed inset-0 z-50 overflow-y-auto bg-navy/70">
      {/* панель действий */}
      <div className="sticky top-0 z-20 border-b border-white/10 bg-navy px-4 py-3">
        <div className="mx-auto flex max-w-[900px] flex-wrap items-center gap-2">
          <button onClick={onClose} className="flex cursor-pointer items-center gap-2 border border-white/20 px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.08em] text-white/80 transition-colors hover:border-white/50 hover:text-white">
            <IconArrow size={13} className="rotate-180" /> к списку
          </button>
          <span className={`ml-1 hidden border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.08em] sm:inline-block ${meta.chip}`}>
            {meta.label}
          </span>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            {meta.next && (
              <button
                onClick={() => onStatus(doc.id, meta.next!)}
                className="flex cursor-pointer items-center gap-2 bg-brand px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-white transition-all hover:bg-brand2 hover:shadow-[0_6px_20px_-6px_rgba(30,136,229,0.7)]"
              >
                {meta.nextLabel} <IconArrow size={12} />
              </button>
            )}
            <button onClick={() => onEdit(doc)} className="flex cursor-pointer items-center gap-2 border border-white/20 px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.08em] text-white/80 transition-colors hover:border-white/50 hover:text-white">
              <IconPencil size={13} /> изменить
            </button>
            <button onClick={() => window.print()} className="flex cursor-pointer items-center gap-2 border border-white/20 px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.08em] text-white/80 transition-colors hover:border-white/50 hover:text-white">
              <IconPrint size={13} /> печать
            </button>
            <button onClick={() => void downloadWord()} className="flex cursor-pointer items-center gap-2 border border-amber/50 px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.08em] text-amber transition-colors hover:border-amber hover:bg-amber/10">
              <IconDownload size={13} /> word
            </button>
            <button onClick={onClose} className="cursor-pointer border border-white/20 p-2 text-white/70 transition-colors hover:border-danger hover:text-danger" title="Закрыть">
              <IconClose size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* лист А4 */}
      <div className="px-4 py-8">
        <div id="print-sheet" className="relative mx-auto w-[840px] max-w-full bg-white px-12 py-11 text-ink shadow-[0_50px_110px_-30px_rgba(0,0,0,0.6)]">
          {doc.status === "paid" && <Stamp date={doc.date} short={own.short} />}

          {/* шапка с реквизитами */}
          <div className="grid grid-cols-[1.25fr_1fr] border border-ink/80 text-[12px] leading-relaxed">
            <div className="border-r border-ink/80 p-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-dim">Поставщик</span>
              <p className="mt-1 font-semibold">{own.name}</p>
              <p className="mt-0.5">ИНН {own.inn ?? "—"}</p>
              {own.address && <p>{own.address}</p>}
            </div>
            <div className="flex flex-col">
              <div className="flex-1 border-b border-ink/80 p-3">{own.bank}</div>
              <div className="grid grid-cols-2">
                <div className="border-r border-ink/80 p-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-dim">БИК</span>
                  <p className="mt-0.5 font-mono">{own.bik}</p>
                </div>
                <div className="p-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-dim">Счёт</span>
                  <p className="mt-0.5 font-mono">{own.account}</p>
                </div>
              </div>
            </div>
          </div>

          <h2 className="mt-9 font-display text-[24px] font-extrabold tracking-[0.04em]">
            {TYPE_META[doc.type].title} № {doc.number}
          </h2>
          <p className="mt-1 text-[13.5px] text-mut">от {fmtDate(doc.date)}</p>

          <div className="mt-7 text-[13px] leading-relaxed">
            <p>
              <span className="font-semibold">Покупатель:</span> {party?.name ?? "— не указан —"}
              {party?.inn ? `, ИНН ${party.inn}` : ""}
            </p>
            {party?.person && <p className="text-mut">Контактное лицо: {party.person}</p>}
          </div>

          {/* позиции */}
          <table className="mt-8 w-full border-collapse text-[12.5px]">
            <thead>
              <tr className="bg-soft">
                {["№", "Наименование", "Кол-во", "Ед.", "Цена", "Сумма"].map((h, i) => (
                  <th key={h} className={`border border-line2 px-2.5 py-2.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-mut ${i === 1 ? "text-left" : "text-center"} ${i >= 4 ? "text-right" : ""}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {doc.items.map((it, i) => (
                <tr key={it.id}>
                  <td className="border border-line2 px-2.5 py-2.5 text-center font-mono text-mut">{i + 1}</td>
                  <td className="border border-line2 px-2.5 py-2.5">{it.name}</td>
                  <td className="border border-line2 px-2.5 py-2.5 text-center font-mono">{it.qty}</td>
                  <td className="border border-line2 px-2.5 py-2.5 text-center">{it.unit}</td>
                  <td className="border border-line2 px-2.5 py-2.5 text-right font-mono">{fmtMoney(it.price)}</td>
                  <td className="border border-line2 px-2.5 py-2.5 text-right font-mono font-semibold">{fmtMoney(it.qty * it.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* итоги */}
          <div className="ml-auto mt-5 w-72 text-[13px]">
            <p className="flex justify-between py-1"><span className="text-mut">Итого:</span><span className="font-mono font-semibold">{fmtMoney(subtotal)}</span></p>
            <p className="flex justify-between py-1">
              <span className="text-mut">{doc.vat ? "в т.ч. НДС 20 %:" : "НДС:"}</span>
              <span className="font-mono font-semibold">{doc.vat ? fmtMoney(vat) : "не облагается"}</span>
            </p>
            <p className="mt-1 flex justify-between border-t-2 border-ink pt-2.5 text-[15px] font-bold">
              <span>ВСЕГО К ОПЛАТЕ:</span><span className="font-mono">{fmtMoney(total)}</span>
            </p>
          </div>

          <p className="mt-6 text-[12.5px] italic text-mut">{amountInWords(total)}</p>
          {doc.note && <p className="mt-4 text-[12.5px]"><span className="font-semibold">Примечание:</span> {doc.note}</p>}

          {/* подписи */}
          <div className="mt-16 grid grid-cols-2 gap-10 text-[13px]">
            <p>
              Руководитель
              <span className="mx-3 inline-block w-36 border-b border-dotted border-ink align-baseline" />
              {own.director}
            </p>
            <p>
              Бухгалтер
              <span className="mx-3 inline-block w-36 border-b border-dotted border-ink align-baseline" />
            </p>
          </div>

          <p className="mt-12 border-t border-line pt-4 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-dim">
            сформировано в системе «ИП Документооборот» · статус: {meta.label.toLowerCase()}
          </p>
        </div>
      </div>
    </div>
  );
}
