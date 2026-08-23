import {
  AlignmentType,
  BorderStyle,
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from "docx";
import {
  amountInWords,
  calc,
  displayName,
  fmtDate,
  fmtMoney,
  netProfit,
  STATUS_META,
  TYPE_META,
  type Contract,
  type Doc,
  type Own,
  type Party,
  type Payment,
} from "./store";

const INK = "12243C";
const GREY = "5C6C84";
const BRAND = "1E88E5";

const thin = { style: BorderStyle.SINGLE, size: 4, color: "9AA7B8" } as const;
const borders = { top: thin, bottom: thin, left: thin, right: thin, insideHorizontal: thin, insideVertical: thin };

function run(text: string, opts: Partial<{ size: number; bold: boolean; color: string }> = {}) {
  return new TextRun({ text, size: opts.size ?? 20, bold: opts.bold, color: opts.color ?? INK, font: { name: "Arial" } });
}

type Align = (typeof AlignmentType)[keyof typeof AlignmentType];

function cell(text: string, opts: Partial<{ bold: boolean; width: number; align: Align; color: string; fill: string }> = {}) {
  return new TableCell({
    children: [new Paragraph({ alignment: opts.align ?? AlignmentType.LEFT, spacing: { before: 40, after: 40 }, children: [run(text, { bold: opts.bold, color: opts.color, size: 19 })] })],
    width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
    shading: opts.fill ? { fill: opts.fill } : undefined,
    verticalAlign: VerticalAlign.CENTER,
  });
}

function save(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = window.document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 800);
}

const requisitesTable = (own: Own) =>
  new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 55, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({ spacing: { before: 60, after: 20 }, children: [run("ПОСТАВЩИК", { size: 15, bold: true, color: GREY })] }),
              new Paragraph({ spacing: { after: 20 }, children: [run(displayName(own.name), { bold: true })] }),
              new Paragraph({ spacing: { after: 20 }, children: [run(`ИНН ${own.inn ?? "—"}`)] }),
              ...(own.address ? [new Paragraph({ spacing: { after: 60 }, children: [run(own.address)] })] : []),
            ],
          }),
          new TableCell({
            children: [
              new Paragraph({ spacing: { before: 60, after: 20 }, children: [run(own.bank)] }),
              new Paragraph({ spacing: { after: 20 }, children: [run(`БИК ${own.bik}${own.corrAccount ? "   ·   Корр. счёт " + own.corrAccount : ""}`)] }),
              new Paragraph({ spacing: { after: 20 }, children: [run(`Р/счёт ${own.account}`)] }),
            ],
          }),
        ],
      }),
    ],
  });

const footerLine = (own: Own) =>
  new Paragraph({
    spacing: { before: 500 },
    alignment: AlignmentType.CENTER,
    children: [run([own.address, own.phone, own.email, own.website].filter(Boolean).join("  ·  "), { size: 15, color: GREY })],
  });

export async function downloadDocx(doc: Doc, party: Party | undefined, own: Own) {
  const { subtotal, vat, total } = calc(doc);
  const typeMeta = TYPE_META[doc.type];

  const headerRow = new TableRow({
    children: [
      cell("№", { width: 6, align: AlignmentType.CENTER, bold: true, fill: "F2F6FB" }),
      cell("Наименование", { bold: true, fill: "F2F6FB" }),
      cell("Кол-во", { width: 11, align: AlignmentType.CENTER, bold: true, fill: "F2F6FB" }),
      cell("Ед.", { width: 9, align: AlignmentType.CENTER, bold: true, fill: "F2F6FB" }),
      cell("Цена", { width: 16, align: AlignmentType.RIGHT, bold: true, fill: "F2F6FB" }),
      cell("Сумма", { width: 16, align: AlignmentType.RIGHT, bold: true, fill: "F2F6FB" }),
    ],
  });

  const itemRows = doc.items.map(
    (it, i) =>
      new TableRow({
        children: [
          cell(String(i + 1), { align: AlignmentType.CENTER, color: GREY }),
          cell(it.name),
          cell(String(it.qty), { align: AlignmentType.CENTER }),
          cell(it.unit, { align: AlignmentType.CENTER }),
          cell(fmtMoney(it.price), { align: AlignmentType.RIGHT }),
          cell(fmtMoney(it.qty * it.price), { align: AlignmentType.RIGHT, bold: true }),
        ],
      })
  );

  const docxFile = new Document({
    styles: { default: { document: { run: { font: { name: "Arial" } } } } },
    sections: [
      {
        properties: {},
        children: [
          requisitesTable(own),
          new Paragraph({ spacing: { before: 480, after: 60 }, children: [run(`${typeMeta.title} № ${doc.number}`, { size: 32, bold: true })] }),
          new Paragraph({ spacing: { after: 300 }, children: [run(`от ${fmtDate(doc.date)}`, { color: GREY })] }),
          new Paragraph({
            spacing: { after: 60 },
            children: [run("Покупатель: ", { bold: true }), run(`${party?.name ?? "— не указан —"}${party?.inn ? ", ИНН " + party.inn : ""}`)],
          }),
          ...(party?.person ? [new Paragraph({ spacing: { after: 200 }, children: [run(`Контактное лицо: ${party.person}`, { color: GREY })] })] : []),
          new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders, rows: [headerRow, ...itemRows] }),
          new Paragraph({ spacing: { before: 240 }, alignment: AlignmentType.RIGHT, children: [run("Итого: ", { color: GREY }), run(fmtMoney(subtotal), { bold: true })] }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [run(doc.vat ? "в т.ч. НДС 20 %: " : "НДС: ", { color: GREY }), run(doc.vat ? fmtMoney(vat) : "не облагается", { bold: true })],
          }),
          new Paragraph({
            spacing: { before: 120 },
            alignment: AlignmentType.RIGHT,
            children: [run("ВСЕГО К ОПЛАТЕ: ", { size: 24, bold: true }), run(fmtMoney(total), { size: 24, bold: true, color: BRAND })],
          }),
          new Paragraph({ spacing: { before: 200 }, children: [run(amountInWords(total), { color: GREY })] }),
          ...(doc.note ? [new Paragraph({ spacing: { before: 160 }, children: [run("Примечание: ", { bold: true }), run(doc.note)] })] : []),
          ...(doc.status === "paid"
            ? [new Paragraph({ spacing: { before: 400 }, alignment: AlignmentType.CENTER, children: [run(`ОПЛАЧЕНО · ${fmtDate(doc.date)}`, { size: 28, bold: true, color: "2743C7" })] })]
            : []),
          new Paragraph({ spacing: { before: 700 }, children: [run(`Руководитель  ______________________  ${own.director}`)] }),
          new Paragraph({ spacing: { before: 200 }, children: [run("Бухгалтер  ______________________")] }),
          footerLine(own),
        ],
      },
    ],
  });

  save(await Packer.toBlob(docxFile), `${doc.type}-${doc.number}.docx`);
}

export async function downloadContractDocx(
  contract: Contract,
  party: Party | undefined,
  own: Own,
  docs: Doc[],
  payments: Payment[]
) {
  const paidTotal = payments.reduce((s, p) => s + p.amount, 0);
  const baseTotal = contract.plannedIncome || docs.reduce((s, d) => s + calc(d).total, 0);
  const profit = netProfit(contract);

  const plTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders,
    rows: [
      new TableRow({
        children: [
          cell("Показатель", { bold: true, fill: "F2F6FB" }),
          cell("План", { width: 24, align: AlignmentType.RIGHT, bold: true, fill: "F2F6FB" }),
          cell("Факт", { width: 24, align: AlignmentType.RIGHT, bold: true, fill: "F2F6FB" }),
        ],
      }),
      new TableRow({
        children: [
          cell("Доход"),
          cell(fmtMoney(contract.plannedIncome), { align: AlignmentType.RIGHT }),
          cell(fmtMoney(contract.actualIncome), { align: AlignmentType.RIGHT, color: "2E7D32" }),
        ],
      }),
      new TableRow({
        children: [
          cell("Расход"),
          cell(fmtMoney(contract.plannedExpense), { align: AlignmentType.RIGHT }),
          cell(fmtMoney(contract.actualExpense), { align: AlignmentType.RIGHT, color: "C62828" }),
        ],
      }),
      new TableRow({
        children: [
          cell("Чистая прибыль", { bold: true }),
          cell(fmtMoney(contract.plannedIncome - contract.plannedExpense), { align: AlignmentType.RIGHT }),
          cell(fmtMoney(profit), { align: AlignmentType.RIGHT, bold: true, color: profit >= 0 ? "2E7D32" : "C62828" }),
        ],
      }),
    ],
  });

  const docsRows = docs.map(
    (d) =>
      new TableRow({
        children: [
          cell(`${TYPE_META[d.type].label} № ${d.number}`),
          cell(fmtDate(d.date), { align: AlignmentType.RIGHT }),
          cell(fmtMoney(calc(d).total), { align: AlignmentType.RIGHT }),
          cell(STATUS_META[d.status].label, { align: AlignmentType.CENTER }),
        ],
      })
  );

  const children: Paragraph[] = [
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 }, children: [run(`ДОГОВОР № ${contract.number}`, { size: 30, bold: true })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 360 }, children: [run(`${fmtDate(contract.startDate)} — ${fmtDate(contract.endDate)}`, { color: GREY })] }),
    new Paragraph({
      spacing: { after: 240 },
      children: [
        run(`${displayName(own.name)}, ИНН ${own.inn ?? "—"}, именуемый в дальнейшем «Исполнитель», с одной стороны, и `, {}),
        run(`${party?.name ?? "____________________"}${party?.inn ? ", ИНН " + party.inn : ""}`, { bold: true }),
        run(", именуемый в дальнейшем «Заказчик», с другой стороны, заключили настоящий договор о нижеследующем."),
      ],
    }),
    new Paragraph({ spacing: { before: 200, after: 100 }, children: [run("1. Предмет договора", { bold: true })] }),
    new Paragraph({ spacing: { after: 80 }, children: [run(`1.1. Исполнитель обязуется оказать Заказчику услуги: ${contract.subject || "____________________"}, а Заказчик — принять и оплатить их.`)] }),
    new Paragraph({ spacing: { after: 80 }, children: [run(`1.2. Тип договора: ${contract.kind === "income" ? "Доход" : "Расход"}.`)] }),
    new Paragraph({ spacing: { before: 200, after: 100 }, children: [run("2. Финансовые показатели (план / факт)", { bold: true })] }),
    new Paragraph({ spacing: { before: 200, after: 100 }, children: [run("3. Порядок оказания услуг", { bold: true })] }),
    new Paragraph({ spacing: { after: 80 }, children: [run("3.1. Услуги оказываются поэтапно; по факту оказания направляются счёт и акт выполненных работ.")] }),
    new Paragraph({ spacing: { after: 80 }, children: [run(`3.2. Договор действует с ${fmtDate(contract.startDate)} по ${fmtDate(contract.endDate)}.`)] }),
    new Paragraph({ spacing: { before: 200, after: 100 }, children: [run("3. Стоимость и порядок расчётов", { bold: true })] }),
    new Paragraph({ spacing: { after: 80 }, children: [run("3.1. Оплата — в течение 5 банковских дней с момента подписания акта.")] }),
    new Paragraph({ spacing: { after: 80 }, children: [run("3.2. Документы, выставленные в рамках договора:")] }),
  ];

  const tables: Table[] = [plTable];
  if (docsRows.length) {
    tables.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders,
        rows: [
          new TableRow({
            children: [
              cell("Документ", { bold: true, fill: "F2F6FB" }),
              cell("Дата", { width: 16, align: AlignmentType.RIGHT, bold: true, fill: "F2F6FB" }),
              cell("Сумма", { width: 20, align: AlignmentType.RIGHT, bold: true, fill: "F2F6FB" }),
              cell("Статус", { width: 16, align: AlignmentType.CENTER, bold: true, fill: "F2F6FB" }),
            ],
          }),
          ...docsRows,
        ],
      })
    );
  }

  children.push(
    new Paragraph({ spacing: { before: 120, after: 80 }, children: [run(`3.3. Получено оплат: ${fmtMoney(paidTotal)} из ${fmtMoney(baseTotal)} (${baseTotal > 0 ? Math.min(Math.round((paidTotal / baseTotal) * 100), 100) : 0} %).`, { bold: paidTotal > 0 })] }),
    new Paragraph({ spacing: { before: 200, after: 100 }, children: [run("4. Ответственность сторон", { bold: true })] }),
    new Paragraph({ spacing: { after: 80 }, children: [run("4.1. За просрочку оплаты Заказчик уплачивает пени 0,1 % от суммы задолженности за каждый день.")] }),
    new Paragraph({ spacing: { before: 200, after: 100 }, children: [run("5. Заключительные положения", { bold: true })] }),
    new Paragraph({ spacing: { after: 80 }, children: [run("5.1. Договор составлен в двух экземплярах, имеющих одинаковую юридическую силу.")] }),
    new Paragraph({ spacing: { before: 600 }, children: [run(`Исполнитель: ${displayName(own.name)}`, { bold: true })] }),
    new Paragraph({ children: [run(`ИНН ${own.inn ?? "—"} · ${own.bank}`, { color: GREY })] }),
    new Paragraph({ children: [run(`БИК ${own.bik} · р/с ${own.account}`, { color: GREY })] }),
    new Paragraph({ spacing: { before: 300 }, children: [run("______________ / " + own.director)] }),
    new Paragraph({ spacing: { before: 400 }, children: [run(`Заказчик: ${party?.name ?? "____________________"}`, { bold: true })] }),
    new Paragraph({ children: [run(`ИНН ${party?.inn ?? "—"}`, { color: GREY })] }),
    new Paragraph({ spacing: { before: 300 }, children: [run("______________ / " + (party?.person ?? "________________"))] }),
    footerLine(own)
  );

  const docxFile = new Document({
    styles: { default: { document: { run: { font: { name: "Arial" } } } } },
    sections: [{ properties: {}, children: [...children, ...tables] }],
  });

  save(await Packer.toBlob(docxFile), `dogovor-${contract.number.replace(/[^\w-]+/g, "_")}.docx`);
}
