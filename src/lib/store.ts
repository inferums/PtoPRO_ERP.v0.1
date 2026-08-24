export type View = "dashboard" | "contracts" | "invoices" | "acts" | "finance" | "letters" | "parties" | "settings";
export type DocType = "invoice" | "act";
export type DocStatus = "draft" | "sent" | "signed" | "paid_partial" | "paid";

export type LineItem = { id: string; name: string; qty: number; unit: string; price: number };

export type Doc = {
  id: string;
  number: number;
  type: DocType;
  status: DocStatus;
  date: string; // YYYY-MM-DD
  counterpartyId: string;
  contractId?: string; // привязка к договору
  items: LineItem[];
  vat: boolean;
  note?: string;
};

export type Party = {
  id: string;
  name: string;
  inn?: string;
  person?: string;
  bank?: string;
  bik?: string;
  account?: string;
};

/* Реквизиты ИП — включая колонтитулы (адрес, телефон, email, сайт) и корр. счёт */
export type Own = {
  name: string;
  short: string;
  inn?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  bank: string;
  corrAccount?: string;
  bik: string;
  account: string;
  director: string;
};

export type ContractStatus = "active" | "completed" | "terminated";
export type ContractKind = "income" | "expense";
export type Contract = {
  id: string;
  number: string; // «Д-002/2024»
  counterpartyId: string;
  subject: string;
  kind: ContractKind; // Доход / Расход
  plannedIncome: number;
  plannedExpense: number;
  actualIncome: number;
  actualExpense: number;
  status: ContractStatus;
  startDate: string;
  endDate: string;
  parentId?: string; // субдоговор
  description?: string;
};

export const netProfit = (c: Contract) => c.actualIncome - c.actualExpense;

export type Payment = {
  id: string;
  docId: string; // пустая строка — оплата не привязана к документу
  date: string;
  amount: number;
  method: string;
  name: string; // наименование платежа
};

/* авто-наименование платежа: из договора или из документа */
export function suggestPaymentName(doc?: Doc, contract?: Contract): string {
  if (contract) return `Оплата по договору №${contract.number} от ${fmtDate(contract.startDate)}`;
  if (doc) return `Оплата по ${TYPE_META[doc.type]?.label.toLowerCase() ?? "документу"} №${doc.number} от ${fmtDate(doc.date)}`;
  return "";
}

export type Letter = {
  id: string;
  number: string;
  date: string;
  counterpartyId: string;
  direction: "in" | "out";
  subject: string;
  body: string;
};

export type State = {
  docs: Doc[];
  parties: Party[];
  contracts: Contract[];
  payments: Payment[];
  letters: Letter[];
  own: Own;
};

const LS_PREFIX = "ip-dok-v2";

export const uid = () => Math.random().toString(36).slice(2, 10);

const stateKey = (userId: string) => `${LS_PREFIX}:state:${userId}`;

/* «N месяцев назад» → префикс «YYYY-MM» */
const d = (monthsAgo: number) => {
  const t = new Date();
  t.setDate(1);
  t.setMonth(t.getMonth() - monthsAgo);
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}`;
};

export const DEFAULT_OWN: Own = {
  name: "Индивидуальный предприниматель Иванов Иван Иванович",
  short: "ИП Иванов И. И.",
  inn: "771234567890",
  address: "г. Москва, ул. Складочная, д. 1, стр. 5",
  phone: "+7 (495) 123-45-67",
  email: "ivanov@ptopro.ru",
  website: "ptopro.space-z.ai",
  bank: "АО «АЛЬФА-БАНК» г. Москва",
  corrAccount: "30101810200000000593",
  bik: "044525593",
  account: "40802810500000012345",
  director: "Иванов И. И.",
};

export function seedState(): State {
  const parties: Party[] = [
    { id: "p1", name: 'ООО "Альфа"', inn: "7701234567", person: "Гаврилов П. С.", bank: "ПАО Сбербанк", bik: "044525225", account: "40702810400000012345" },
    { id: "p2", name: 'ООО "Бета"', inn: "7719876543", person: "Ким Д. А.", bank: "АО «АЛЬФА-БАНК»", bik: "044525593", account: "40702810900000067890" },
    { id: "p3", name: 'ООО "Гамма"', inn: "5024567890", person: "Мельник О. В." },
    { id: "p4", name: "ИП Смирнова Анна Павловна", inn: "772201234567", person: "Смирнова А. П." },
  ];

  const contracts: Contract[] = [
    { id: "c1", number: "Д-001/2024", counterpartyId: "p1", subject: "Разработка информационной системы", kind: "income", plannedIncome: 500000, plannedExpense: 0, actualIncome: 100000, actualExpense: 0, status: "active", startDate: "2024-01-15", endDate: "2024-12-31" },
    { id: "c2", number: "Д-002/2024", counterpartyId: "p2", subject: "Техническая поддержка", kind: "income", plannedIncome: 120000, plannedExpense: 0, actualIncome: 30000, actualExpense: 40000, status: "active", startDate: "2024-03-01", endDate: "2024-12-31", description: 'Техподдержка ООО "Бета"' },
    { id: "c3", number: "Д-003/2024", counterpartyId: "p3", subject: "Субподряд на дизайн", kind: "expense", plannedIncome: 0, plannedExpense: 80000, actualIncome: 0, actualExpense: 40000, status: "active", startDate: "2024-02-01", endDate: "2024-12-31", parentId: "c2" },
  ];

  const docs: Doc[] = [
    { id: "d1", number: 14, type: "invoice", status: "draft", date: d(0) + "-18", counterpartyId: "p4", contractId: "c1", vat: false, items: [
      { id: "i1", name: "Оформление актов КС-2, КС-3", qty: 6, unit: "шт", price: 1800 },
    ] },
    { id: "d2", number: 13, type: "act", status: "draft", date: d(0) + "-15", counterpartyId: "p2", contractId: "c1", vat: false, items: [
      { id: "i1", name: "Аудит сметной документации", qty: 1, unit: "услуга", price: 12000 },
    ] },
    { id: "d3", number: 12, type: "invoice", status: "sent", date: d(0) + "-10", counterpartyId: "p3", contractId: "c3", vat: false, items: [
      { id: "i1", name: "Подготовка тендерной документации", qty: 1, unit: "компл.", price: 27500 },
      { id: "i2", name: "Сопровождение подачи заявки", qty: 1, unit: "услуга", price: 8000 },
    ] },
    { id: "d4", number: 11, type: "invoice", status: "signed", date: d(0) + "-03", counterpartyId: "p2", contractId: "c1", vat: false, items: [
      { id: "i1", name: "Технический надзор за монтажом", qty: 16, unit: "час", price: 2500 },
    ] },
    { id: "d5", number: 10, type: "act", status: "paid", date: d(1) + "-22", counterpartyId: "p1", contractId: "c2", vat: false, items: [
      { id: "i1", name: "Составление исполнительной документации", qty: 1, unit: "компл.", price: 32000 },
    ] },
    { id: "d7", number: 8, type: "act", status: "sent", date: d(1) + "-28", counterpartyId: "p3", contractId: "c3", vat: false, items: [
      { id: "i1", name: "Обмерные работы", qty: 120, unit: "м²", price: 350 },
    ] },
    { id: "d8", number: 7, type: "invoice", status: "paid", date: d(1) + "-05", counterpartyId: "p4", vat: false, items: [
      { id: "i1", name: "Консультация по документообороту", qty: 2, unit: "час", price: 3000 },
    ] },
    { id: "d9", number: 6, type: "invoice", status: "paid", date: d(3) + "-19", counterpartyId: "p1", contractId: "c2", vat: false, items: [
      { id: "i1", name: "Разработка проектной документации, раздел АР", qty: 1, unit: "компл.", price: 48000 },
      { id: "i2", name: "Согласование документации в экспертизе", qty: 1, unit: "услуга", price: 15000 },
    ] },
    { id: "d10", number: 5, type: "invoice", status: "paid", date: d(4) + "-24", counterpartyId: "p2", contractId: "c1", vat: false, items: [
      { id: "i1", name: "Ведение журнала работ", qty: 1, unit: "мес", price: 9000 },
    ] },
  ];

  const payments: Payment[] = [
    { id: "pay1", docId: "d5", date: d(1) + "-26", amount: 32000, method: "Банковский перевод", name: suggestPaymentName(docs.find((x) => x.id === "d5"), contracts.find((c) => c.id === "c2")) },
    { id: "pay2", docId: "d8", date: d(1) + "-08", amount: 6000, method: "Банковский перевод", name: suggestPaymentName(docs.find((x) => x.id === "d8")) },
    { id: "pay3", docId: "d9", date: d(3) + "-25", amount: 63000, method: "Банковский перевод", name: suggestPaymentName(docs.find((x) => x.id === "d9"), contracts.find((c) => c.id === "c2")) },
    { id: "pay4", docId: "d10", date: d(4) + "-28", amount: 9000, method: "Банковский перевод", name: suggestPaymentName(docs.find((x) => x.id === "d10"), contracts.find((c) => c.id === "c1")) },
  ];

  const letters: Letter[] = [
    { id: "l1", number: "исх-31", date: d(0) + "-12", counterpartyId: "p3", direction: "out", subject: "О сроках подачи заявки", body: "Уважаемый Олег Владимирович!\n\nНаправляем уточнённый график подготовки тендерной документации. Просим подтвердить сроки согласования до конца недели." },
    { id: "l2", number: "вх-18", date: d(0) + "-08", counterpartyId: "p2", direction: "in", subject: "Запрос актов за месяц", body: "Просим направить акты выполненных работ за текущий месяц для сверки." },
    { id: "l3", number: "исх-29", date: d(1) + "-14", counterpartyId: "p1", direction: "out", subject: "Согласование исполнительной документации", body: "Направляем комплект исполнительной документации по объекту. Просим подписать и вернуть один экземпляр." },
  ];

  return { docs, parties, contracts, payments, letters, own: { ...DEFAULT_OWN } };
}

export function emptyState(): State {
  return { docs: [], parties: [], contracts: [], payments: [], letters: [], own: { ...DEFAULT_OWN } };
}

export function hasState(userId: string): boolean {
  try {
    return localStorage.getItem(stateKey(userId)) !== null;
  } catch {
    return false;
  }
}

export function loadState(userId: string): State {
  const empty = emptyState();
  try {
    const raw = localStorage.getItem(stateKey(userId));
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as Partial<State>;
    const rawDocs = Array.isArray(parsed.docs) ? parsed.docs : [];
    const contracts: Contract[] = Array.isArray(parsed.contracts) ? parsed.contracts.slice() : [];
    const docs: Doc[] = [];

    /* миграция: документы старого формата с type «contract» переезжают в реестр договоров,
       неизвестные типы отбрасываются — приложение не упадёт на чужих данных */
    rawDocs.forEach((d) => {
      if (!d || typeof d !== "object") return;
      const doc = d as Doc;
      if ((doc.type as string) === "contract") {
        const legacy = doc as unknown as { id: string; number: number; date: string; counterpartyId: string; items: LineItem[] };
        if (!contracts.some((c) => c.id === legacy.id)) {
          const sum = (legacy.items ?? []).reduce((s, it) => s + (it.qty * it.price || 0), 0);
          contracts.push({
            id: legacy.id,
            number: "Д-" + String(legacy.number),
            counterpartyId: legacy.counterpartyId,
            subject: legacy.items?.[0]?.name ?? "Договор",
            kind: "income",
            plannedIncome: sum,
            plannedExpense: 0,
            actualIncome: 0,
            actualExpense: 0,
            status: "active",
            startDate: legacy.date,
            endDate: legacy.date,
          });
        }
        return;
      }
      if (doc.type !== "invoice" && doc.type !== "act") return;
      docs.push(doc);
    });

    return {
      docs,
      parties: Array.isArray(parsed.parties) ? parsed.parties : [],
      contracts,
      payments: Array.isArray(parsed.payments)
        ? (parsed.payments as Record<string, unknown>[]).map((p) => ({
            id: String(p.id ?? uid()),
            docId: String(p.docId ?? ""),
            date: String(p.date ?? todayISO()),
            amount: Number(p.amount ?? 0),
            method: String(p.method ?? "Банковский перевод"),
            name: String(p.name ?? p.comment ?? "Оплата"),
          }))
        : [],
      letters: Array.isArray(parsed.letters) ? parsed.letters : [],
      own: { ...empty.own, ...(parsed.own ?? {}) },
    };
  } catch {
    return empty;
  }
}

export function saveState(state: State, userId: string) {
  try {
    localStorage.setItem(stateKey(userId), JSON.stringify(state));
  } catch {
    /* приватный режим — молча пропускаем */
  }
}

/* ---------- расчёты и форматирование ---------- */

export function calc(doc: Doc) {
  const subtotal = doc.items.reduce((s, it) => s + it.qty * it.price, 0);
  const vat = doc.vat ? Math.round((subtotal * 20) / 120) : 0;
  return { subtotal, vat, total: subtotal };
}

export const fmtMoney = (n: number) =>
  new Intl.NumberFormat("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n) + " ₽";

export const fmtMoneyShort = (n: number) =>
  n >= 1000 ? `${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(Math.round(n / 1000))} тыс.` : String(Math.round(n));

export const fmtDate = (iso: string) => {
  const dt = new Date(`${iso}T12:00:00`);
  return Number.isNaN(dt.getTime()) ? iso : dt.toLocaleDateString("ru-RU");
};

export const todayISO = () => {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
};

export const nextNumber = (docs: Doc[]) => docs.reduce((m, x) => Math.max(m, x.number), 0) + 1;

export function plural(n: number, f: [string, string, string]): string {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return f[2];
  if (b > 1 && b < 5) return f[1];
  if (b === 1) return f[0];
  return f[2];
}

/* «ИП Иванов» — без двойного префикса */
export const displayName = (name: string) =>
  name.trim().toLowerCase().startsWith("ип ") || name.trim().toLowerCase() === "ип" ? name.trim() : `ИП ${name.trim()}`;

/* ---------- сумма прописью ---------- */

const U_M = ["", "один", "два", "три", "четыре", "пять", "шесть", "семь", "восемь", "девять"];
const U_F = ["", "одна", "две", "три", "четыре", "пять", "шесть", "семь", "восемь", "девять"];
const TEENS = ["десять", "одиннадцать", "двенадцать", "тринадцать", "четырнадцать", "пятнадцать", "шестнадцать", "семнадцать", "восемнадцать", "девятнадцать"];
const TENS = ["", "", "двадцать", "тридцать", "сорок", "пятьдесят", "шестьдесят", "семьдесят", "восемьдесят", "девяносто"];
const HUND = ["", "сто", "двести", "триста", "четыреста", "пятьсот", "шестьсот", "семьсот", "восемьсот", "девятьсот"];

function tri(n: number, fem: boolean): string {
  const parts: string[] = [];
  const h = Math.floor(n / 100);
  const rest = n % 100;
  if (h) parts.push(HUND[h]);
  if (rest >= 10 && rest < 20) parts.push(TEENS[rest - 10]);
  else {
    const t = Math.floor(rest / 10);
    const u = rest % 10;
    if (t) parts.push(TENS[t]);
    if (u) parts.push(fem ? U_F[u] : U_M[u]);
  }
  return parts.join(" ");
}

export function amountInWords(total: number): string {
  const rub = Math.floor(total);
  const kop = Math.round((total - rub) * 100);
  const words: string[] = [];
  const millions = Math.floor(rub / 1_000_000);
  const thousands = Math.floor(rub / 1000) % 1000;
  const ones = rub % 1000;
  if (millions) words.push(tri(millions, false), plural(millions, ["миллион", "миллиона", "миллионов"]));
  if (thousands) words.push(tri(thousands, true), plural(thousands, ["тысяча", "тысячи", "тысяч"]));
  if (ones || words.length === 0) words.push(tri(ones, false) || "ноль");
  words.push(plural(rub, ["рубль", "рубля", "рублей"]));
  const s = words.join(" ").replace(/\s+/g, " ").trim();
  return `${s.charAt(0).toUpperCase()}${s.slice(1)} ${String(kop).padStart(2, "0")} ${plural(kop, ["копейка", "копейки", "копеек"])}`;
}

/* ---------- метаданные типов и статусов ---------- */

export const TYPE_META: Record<DocType, { label: string; title: string; short: string }> = {
  invoice: { label: "Счёт", title: "СЧЁТ НА ОПЛАТУ", short: "Счёт на оплату" },
  act: { label: "Акт", title: "АКТ ВЫПОЛНЕННЫХ РАБОТ", short: "Акт выполненных работ" },
};

export const STATUS_META: Record<
  DocStatus,
  { label: string; next: DocStatus | null; nextLabel: string; altNext?: DocStatus; altLabel?: string; chip: string; dot: string }
> = {
  draft: { label: "Черновик", next: "sent", nextLabel: "Отправить", chip: "bg-[#eef1f7] text-[#5c6c84] border-[#d8e0eb]", dot: "#93a2b7" },
  sent: { label: "Отправлен", next: "signed", nextLabel: "Подписан", altNext: "paid_partial", altLabel: "Частично", chip: "bg-[#fbf0dc] text-[#a96f14] border-[#f0dbb4]", dot: "#e8a23d" },
  signed: { label: "Подписан", next: "paid", nextLabel: "Оплачен", altNext: "paid_partial", altLabel: "Частично", chip: "bg-[#e3f0fc] text-[#1567c2] border-[#bfd9f2]", dot: "#1e88e5" },
  paid_partial: { label: "Частично оплачен", next: "paid", nextLabel: "Оплачен", chip: "bg-[#e0f2f1] text-[#00796b] border-[#b2dfdb]", dot: "#26a69a" },
  paid: { label: "Оплачен", next: null, nextLabel: "", chip: "bg-[#e1f3e9] text-[#1f7a4d] border-[#bcdcc9]", dot: "#2e9e6b" },
};

export const STATUS_ORDER: DocStatus[] = ["draft", "sent", "signed", "paid_partial", "paid"];

export const CONTRACT_STATUS_META: Record<ContractStatus, { label: string; chip: string; dot: string }> = {
  active: { label: "Действующий", chip: "bg-[#E3F2FD] text-[#1565C0] border-transparent", dot: "#1565C0" },
  completed: { label: "Завершён", chip: "bg-[#E8F5E9] text-[#2E7D32] border-transparent", dot: "#2E7D32" },
  terminated: { label: "Расторгнут", chip: "bg-[#FFEBEE] text-[#C62828] border-transparent", dot: "#C62828" },
};

export const CONTRACT_KIND_META: Record<ContractKind, { label: string; chip: string }> = {
  income: { label: "Доход", chip: "bg-[#E8F5E9] text-[#2E7D32] border-transparent" },
  expense: { label: "Расход", chip: "bg-[#FFEBEE] text-[#C62828] border-transparent" },
};

export const CONTRACT_STATUS_ORDER: ContractStatus[] = ["active", "completed", "terminated"];

export const MONTHS_SHORT = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
