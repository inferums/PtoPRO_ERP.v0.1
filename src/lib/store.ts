export type View = "dashboard" | "docs" | "parties" | "settings";
export type DocType = "invoice" | "act" | "contract";
export type DocStatus = "draft" | "sent" | "signed" | "paid";

export type LineItem = { id: string; name: string; qty: number; unit: string; price: number };

export type Doc = {
  id: string;
  number: number;
  type: DocType;
  status: DocStatus;
  date: string; // YYYY-MM-DD
  counterpartyId: string;
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

export type Own = {
  name: string;
  short: string;
  inn?: string;
  address?: string;
  bank: string;
  bik: string;
  account: string;
  director: string;
};

export type State = { docs: Doc[]; parties: Party[]; own: Own };

export const LS_KEY = "ip-dok-v1";

export const uid = () => Math.random().toString(36).slice(2, 10);

/* «N месяцев назад» → префикс «YYYY-MM», к которому добавляется день */
const d = (monthsAgo: number) => {
  const t = new Date();
  t.setDate(1);
  t.setMonth(t.getMonth() - monthsAgo);
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}`;
};

export function seedState(): State {
  const parties: Party[] = [
    { id: "p1", name: "ООО «ТехноСтрой»", inn: "7701234567", person: "Гаврилов П. С.", bank: "ПАО Сбербанк", bik: "044525225", account: "40702810400000012345" },
    { id: "p2", name: "ООО «Вектор Плюс»", inn: "7719876543", person: "Ким Д. А.", bank: "АО «АЛЬФА-БАНК»", bik: "044525593", account: "40702810900000067890" },
    { id: "p3", name: "ООО «СтройГарант»", inn: "5024567890", person: "Мельник О. В." },
    { id: "p4", name: "ИП Смирнова Анна Павловна", inn: "772201234567", person: "Смирнова А. П." },
  ];

  const docs: Doc[] = [
    { id: "d1", number: 14, type: "invoice", status: "draft", date: d(0) + "-18", counterpartyId: "p4", vat: false, items: [
      { id: "i1", name: "Оформление актов КС-2, КС-3", qty: 6, unit: "шт", price: 1800 },
    ] },
    { id: "d2", number: 13, type: "act", status: "draft", date: d(0) + "-15", counterpartyId: "p2", vat: false, items: [
      { id: "i1", name: "Аудит сметной документации", qty: 1, unit: "услуга", price: 12000 },
    ] },
    { id: "d3", number: 12, type: "invoice", status: "sent", date: d(0) + "-10", counterpartyId: "p3", vat: false, items: [
      { id: "i1", name: "Подготовка тендерной документации", qty: 1, unit: "компл.", price: 27500 },
      { id: "i2", name: "Сопровождение подачи заявки", qty: 1, unit: "услуга", price: 8000 },
    ] },
    { id: "d4", number: 11, type: "invoice", status: "signed", date: d(0) + "-03", counterpartyId: "p2", vat: false, items: [
      { id: "i1", name: "Технический надзор за монтажом", qty: 16, unit: "час", price: 2500 },
    ] },
    { id: "d5", number: 10, type: "act", status: "paid", date: d(1) + "-22", counterpartyId: "p1", vat: false, items: [
      { id: "i1", name: "Составление исполнительной документации", qty: 1, unit: "компл.", price: 32000 },
    ] },
    { id: "d6", number: 9, type: "contract", status: "signed", date: d(1) + "-12", counterpartyId: "p2", vat: false, items: [
      { id: "i1", name: "Абонентское сопровождение ПТО", qty: 1, unit: "мес", price: 20000 },
    ] },
    { id: "d7", number: 8, type: "act", status: "sent", date: d(1) + "-28", counterpartyId: "p3", vat: false, items: [
      { id: "i1", name: "Обмерные работы", qty: 120, unit: "м²", price: 350 },
    ] },
    { id: "d8", number: 7, type: "invoice", status: "paid", date: d(1) + "-05", counterpartyId: "p4", vat: false, items: [
      { id: "i1", name: "Консультация по документообороту", qty: 2, unit: "час", price: 3000 },
    ] },
    { id: "d9", number: 6, type: "invoice", status: "paid", date: d(3) + "-19", counterpartyId: "p1", vat: false, items: [
      { id: "i1", name: "Разработка проектной документации, раздел АР", qty: 1, unit: "компл.", price: 48000 },
      { id: "i2", name: "Согласование документации в экспертизе", qty: 1, unit: "услуга", price: 15000 },
    ] },
    { id: "d10", number: 5, type: "invoice", status: "paid", date: d(4) + "-24", counterpartyId: "p2", vat: false, items: [
      { id: "i1", name: "Ведение журнала работ", qty: 1, unit: "мес", price: 9000 },
    ] },
  ];

  return { docs, parties, own: DEFAULT_OWN };
}

export const DEFAULT_OWN: Own = {
  name: "Индивидуальный предприниматель Иванов Иван Иванович",
  short: "ИП Иванов И. И.",
  inn: "771234567890",
  address: "г. Москва, ул. Складочная, д. 1, стр. 5",
  bank: "АО «АЛЬФА-БАНК» г. Москва",
  bik: "044525593",
  account: "40802810500000012345",
  director: "Иванов И. И.",
};

/* чистый старт для свежезарегистрированных пользователей */
export function emptyState(): State {
  return { docs: [], parties: [], own: { ...DEFAULT_OWN } };
}

export function hasState(userId: string): boolean {
  try {
    return localStorage.getItem(stateKey(userId)) !== null;
  } catch {
    return false;
  }
}

const stateKey = (userId: string) => `${LS_KEY}:${userId}`;

export function loadState(userId: string): State {
  try {
    const raw = localStorage.getItem(stateKey(userId));
    if (raw) {
      const parsed = JSON.parse(raw) as State;
      if (parsed && Array.isArray(parsed.docs) && Array.isArray(parsed.parties) && parsed.own) return parsed;
    }
  } catch {
    /* повреждённые данные — пересеваем */
  }
  return seedState();
}

export function saveState(s: State, userId: string) {
  try {
    localStorage.setItem(stateKey(userId), JSON.stringify(s));
  } catch {
    /* приватный режим — работаем в памяти */
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
    if (rest >= 20 || rest < 10) {
      const t = Math.floor(rest / 10);
      const u = rest % 10;
      if (t) parts.push(TENS[t]);
      if (u) parts.push(fem ? U_F[u] : U_M[u]);
    }
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
  contract: { label: "Договор", title: "ДОГОВОР", short: "Договор" },
};

export const STATUS_META: Record<
  DocStatus,
  { label: string; next: DocStatus | null; nextLabel: string; chip: string; dot: string }
> = {
  draft: { label: "Черновик", next: "sent", nextLabel: "Отправить", chip: "bg-[#eef1f7] text-[#5c6c84] border-[#d8e0eb]", dot: "#93a2b7" },
  sent: { label: "Отправлен", next: "signed", nextLabel: "Подписан", chip: "bg-[#fbf0dc] text-[#a96f14] border-[#f0dbb4]", dot: "#e8a23d" },
  signed: { label: "Подписан", next: "paid", nextLabel: "Оплачен", chip: "bg-[#e3f0fc] text-[#1567c2] border-[#bfd9f2]", dot: "#1e88e5" },
  paid: { label: "Оплачен", next: null, nextLabel: "", chip: "bg-[#e1f3e9] text-[#1f7a4d] border-[#bcdcc9]", dot: "#2e9e6b" },
};

export const STATUS_ORDER: DocStatus[] = ["draft", "sent", "signed", "paid"];

export const MONTHS_SHORT = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
