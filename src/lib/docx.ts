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
import { amountInWords, calc, fmtDate, fmtMoney, TYPE_META, type Doc, type Own, type Party } from "./store";

const INK = "12243C";
const GREY = "5C6C84";
const BRAND = "1E88E5";

const thin = { style: BorderStyle.SINGLE, size: 4, color: "9AA7B8" } as const;
const borders = { top: thin, bottom: thin, left: thin, right: thin, insideHorizontal: thin, insideVertical: thin };

function run(text: string, opts: Partial<{ size: number; bold: boolean; color: string; font: string }> = {}) {
  return new TextRun({
    text,
    size: opts.size ?? 20,
    bold: opts.bold,
    color: opts.color ?? INK,
    font: { name: "Arial" },
  });
}

type Align = (typeof AlignmentType)[keyof typeof AlignmentType];

function cell(text: string, opts: Partial<{ bold: boolean; width: number; align: Align; color: string; fill: string }> = {}) {
  return new TableCell({
    children: [
      new Paragraph({
        alignment: opts.align ?? AlignmentType.LEFT,
        spacing: { before: 40, after: 40 },
        children: [run(text, { bold: opts.bold, color: opts.color, size: 19 })],
      }),
    ],
    width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
    shading: opts.fill ? { fill: opts.fill } : undefined,
    verticalAlign: VerticalAlign.CENTER,
  });
}

export async function downloadDocx(doc: Doc, party: Party | undefined, own: Own) {
  const { subtotal, vat, total } = calc(doc);
  const typeMeta = TYPE_META[doc.type];

  const requisites = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 55, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({ spacing: { before: 60, after: 20 }, children: [run("ПОСТАВЩИК", { size: 15, bold: true, color: GREY })] }),
              new Paragraph({ spacing: { after: 20 }, children: [run(own.name, { bold: true })] }),
              new Paragraph({ spacing: { after: 20 }, children: [run(`ИНН ${own.inn ?? "—"}`)] }),
              ...(own.address ? [new Paragraph({ spacing: { after: 60 }, children: [run(own.address)] })] : []),
            ],
          }),
          new TableCell({
            children: [
              new Paragraph({ spacing: { before: 60, after: 20 }, children: [run(own.bank)] }),
              new Paragraph({ spacing: { after: 20 }, children: [run(`БИК ${own.bik}   ·   Счёт ${own.account}`)] }),
            ],
          }),
        ],
      }),
    ],
  });

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

  const docChildren = [
    requisites,
    new Paragraph({ spacing: { before: 480, after: 60 }, children: [run(`${typeMeta.title} № ${doc.number}`, { size: 32, bold: true })] }),
    new Paragraph({ spacing: { after: 300 }, children: [run(`от ${fmtDate(doc.date)}`, { color: GREY })] }),
    new Paragraph({
      spacing: { after: 60 },
      children: [run("Покупатель: ", { bold: true }), run(`${party?.name ?? "— не указан —"}${party?.inn ? ", ИНН " + party.inn : ""}`)],
    }),
    ...(party?.person ? [new Paragraph({ spacing: { after: 200 }, children: [run(`Контактное лицо: ${party.person}`, { color: GREY })] })] : []),
    new Paragraph({ spacing: { after: 200 }, children: [] }),
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
      ? [
          new Paragraph({
            spacing: { before: 400 },
            alignment: AlignmentType.CENTER,
            children: [run(`ОПЛАЧЕНО · ${fmtDate(doc.date)}`, { size: 28, bold: true, color: "2743C7" })],
          }),
        ]
      : []),
    new Paragraph({
      spacing: { before: 700 },
      children: [run(`Руководитель  ______________________  ${own.director}`)],
    }),
    new Paragraph({ spacing: { before: 200 }, children: [run("Бухгалтер  ______________________")] }),
    new Paragraph({
      spacing: { before: 500 },
      alignment: AlignmentType.CENTER,
      children: [run("Сформировано в системе «ИП Документооборот»", { size: 15, color: GREY })],
    }),
  ];

  const docxFile = new Document({
    styles: { default: { document: { run: { font: { name: "Arial" } } } } },
    sections: [{ properties: {}, children: docChildren }],
  });

  const blob = await Packer.toBlob(docxFile);
  const url = URL.createObjectURL(blob);
  const link = window.document.createElement("a");
  link.href = url;
  link.download = `${doc.type}-${doc.number}.docx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 800);
}
