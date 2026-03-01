// All heavy libraries are lazy-loaded via dynamic import()
import type { ExpenseReport } from "../types";

function fmt(n: number | string): string {
  return `$${Number(n).toFixed(2)}`;
}

function perDiemLabel(rate: number): string {
  return rate === 25 ? "Domestic" : "International";
}

type RGB = [number, number, number];

// ─── Color palette (matches shadcn/ui theme) ────────────────────────────────
const C: Record<string, RGB> = {
  primary: [17, 24, 39],
  muted: [107, 114, 128],
  mutedBg: [243, 244, 246],
  border: [229, 231, 235],
  white: [255, 255, 255],
  green: [22, 163, 74],
  greenBg: [220, 252, 231],
  accent: [59, 130, 246],
};

// ─── PDF ────────────────────────────────────────────────────────────────────

export async function exportReportPdf(report: ExpenseReport): Promise<void> {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

  const doc = new jsPDF("p", "mm", "a4");
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const mx = 16;
  const contentW = pw - mx * 2;
  let y = 0;

  const setColor = (rgb: RGB) => doc.setTextColor(...rgb);
  const drawRect = (
    x: number,
    yy: number,
    w: number,
    h: number,
    rgb: RGB,
    r = 0
  ) => {
    doc.setFillColor(...rgb);
    if (r > 0) doc.roundedRect(x, yy, w, h, r, r, "F");
    else doc.rect(x, yy, w, h, "F");
  };

  const headerH = 36;
  drawRect(0, 0, pw, headerH, C.primary);

  setColor(C.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Expense Report", mx, 14);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`#${report.id}  —  ${report.title}`, mx, 22);

  const statusText = report.status;
  doc.setFontSize(8);
  const stW = doc.getTextWidth(statusText) + 8;
  const stX = pw - mx - stW;
  drawRect(stX, 8, stW, 6, C.green, 1.5);
  setColor(C.white);
  doc.setFont("helvetica", "bold");
  doc.text(statusText, stX + 4, 12.5);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  setColor([200, 210, 230]);
  const dateStr = report.approvedAt
    ? `Approved ${report.approvedAt.replace("T", " ")}`
    : `Created ${(report.createdAt || "").replace("T", " ")}`;
  doc.text(dateStr, mx, 30);

  y = headerH + 10;

  const drawSectionCard = (startY: number, height: number) => {
    drawRect(mx - 2, startY, contentW + 4, height, C.white);
    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.3);
    doc.roundedRect(mx - 2, startY, contentW + 4, height, 2, 2, "S");
  };

  const infoFields: [string, string][] = [
    ["Destination", report.destination || "-"],
    ["Departure", report.departureDate || "-"],
    ["Return", report.returnDate || "-"],
    ["Submitter", report.submitterName || "-"],
    ["Approver", report.approverName || "-"],
    ["Created", report.createdAt ? report.createdAt.replace("T", " ") : "-"],
    ["Approved", report.approvedAt ? report.approvedAt.replace("T", " ") : "-"],
    ["Comment", report.approvalComment || "-"],
  ];

  const rowH = 7;
  const cardPad = 5;
  const infoCardH = infoFields.length * rowH + cardPad * 2 + 9;
  drawSectionCard(y, infoCardH);

  y += cardPad + 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  setColor(C.primary);
  doc.text("Report Details", mx + 4, y);
  y += 6;

  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.2);
  doc.line(mx + 2, y - 1.5, mx + contentW - 2, y - 1.5);
  y += 2;

  doc.setFontSize(9);
  const labelX = mx + 6;
  const valueX = mx + 42;

  for (const [label, value] of infoFields) {
    doc.setFont("helvetica", "normal");
    setColor(C.muted);
    doc.text(label, labelX, y);
    doc.setFont("helvetica", "normal");
    setColor(C.primary);
    doc.text(String(value), valueX, y);
    y += rowH;
  }

  y += 6;

  const perDiemDays = report.perDiemDays || 0;
  const perDiemRate = report.perDiemRate || 0;
  const perDiemAmount = report.perDiemAmount || 0;

  if (perDiemDays > 0) {
    const pdCardH = 22;
    drawSectionCard(y, pdCardH);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    setColor(C.primary);
    doc.text("Per-Diem Allowance", mx + 4, y + 9);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    setColor(C.muted);
    doc.text(
      `${fmt(perDiemRate)}/day (${perDiemLabel(perDiemRate)})  ×  ${perDiemDays} days`,
      mx + 4,
      y + 16
    );

    doc.setFont("helvetica", "bold");
    setColor(C.primary);
    doc.text(fmt(perDiemAmount), mx + contentW - 4, y + 12.5, {
      align: "right",
    });

    y += pdCardH + 6;
  }

  const items = report.items || [];
  if (items.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    setColor(C.primary);
    doc.text("Expense Items", mx + 2, y + 1);
    y += 5;

    autoTable(doc, {
      startY: y,
      margin: { left: mx, right: mx },
      head: [["Date", "Description", "Category", "Amount"]],
      body: items.map((it) => [
        it.date || "-",
        it.description,
        it.category,
        fmt(it.amount),
      ]),
      styles: {
        fontSize: 8.5,
        cellPadding: 3,
        lineColor: C.border,
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: C.primary,
        textColor: C.white,
        fontStyle: "bold",
        fontSize: 8.5,
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251],
      },
      columnStyles: {
        0: { cellWidth: 26 },
        3: { halign: "right", cellWidth: 28 },
      },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
      .finalY + 8;
  }

  const itemsSubtotal = items.reduce((s, it) => s + (it.amount || 0), 0);
  const grandTotal =
    report.totalAmount ?? itemsSubtotal + perDiemAmount;

  const totalCardH = perDiemDays > 0 ? 28 : 20;
  drawSectionCard(y, totalCardH);

  const rightEdge = mx + contentW - 4;
  let ty = y + 8;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  setColor(C.muted);
  doc.text("Items Subtotal", mx + 6, ty);
  setColor(C.primary);
  doc.text(fmt(itemsSubtotal), rightEdge, ty, { align: "right" });
  ty += 6;

  if (perDiemDays > 0) {
    setColor(C.muted);
    doc.text("Per-Diem Allowance", mx + 6, ty);
    setColor(C.primary);
    doc.text(fmt(perDiemAmount), rightEdge, ty, { align: "right" });
    ty += 6;
  }

  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.3);
  doc.line(mx + contentW * 0.45, ty - 2, rightEdge, ty - 2);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  setColor(C.primary);
  doc.text("Grand Total", mx + 6, ty + 2);
  doc.text(fmt(grandTotal), rightEdge, ty + 2, { align: "right" });

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  setColor(C.muted);
  const footerY = ph - 8;
  doc.text(
    `Generated on ${new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })}`,
    mx,
    footerY
  );
  doc.text(`expense-report-${report.id}`, pw - mx, footerY, {
    align: "right",
  });

  doc.save(`expense-report-${report.id}.pdf`);
}

// ─── Excel ──────────────────────────────────────────────────────────────────

export async function exportReportExcel(report: ExpenseReport): Promise<void> {
  const { Workbook } = await import("exceljs");
  const wb = new Workbook();
  wb.creator = "Company Ops";
  wb.created = new Date();

  const perDiemDays = report.perDiemDays || 0;
  const perDiemRate = report.perDiemRate || 0;
  const perDiemAmount = report.perDiemAmount || 0;
  const items = report.items || [];
  const itemsSubtotal = items.reduce((s, it) => s + (it.amount || 0), 0);
  const grandTotal = report.totalAmount ?? itemsSubtotal + perDiemAmount;

  // ── Color palette ──────────────────────────────────────────────
  const NAVY    = "FF1F2937";
  const NAVY2   = "FF374151";
  const NAVY3   = "FF4B5563";
  const BLUE_LT = "FFEFF6FF";
  const BLUE_MD = "FFDBEAFE";
  const GRN_LT  = "FFDCFCE7";
  const GRN_DK  = "FF166534";
  const RED_LT  = "FFFEF2F2";
  const GRAY_LT = "FFF9FAFB";
  const GRAY_MD = "FFF3F4F6";
  const WHITE   = "FFFFFFFF";
  const MUTED   = "FF6B7280";
  const BORDER  = "FFD1D5DB";

  type BorderStyle = "thin" | "medium";
  const border = (style: BorderStyle = "thin", color = BORDER) => ({
    top:    { style, color: { argb: color } },
    left:   { style, color: { argb: color } },
    bottom: { style, color: { argb: color } },
    right:  { style, color: { argb: color } },
  } as const);

  const fill = (argb: string) =>
    ({ type: "pattern" as const, pattern: "solid" as const, fgColor: { argb } });

  const ws = wb.addWorksheet("Expense Report", {
    pageSetup: { paperSize: 9, orientation: "portrait", fitToPage: true, margins: { left: 0.5, right: 0.5, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 } },
  });

  ws.columns = [
    { width: 14 }, // A  No. / Label
    { width: 20 }, // B  Date / Value
    { width: 16 }, // C  Category / Label
    { width: 26 }, // D  Description / Value
    { width: 14 }, // E  Amount / Label
    { width: 14 }, // F  (Amount merged)
  ];

  let r = 1; // current row index (1-based)

  // ── Title banner (rows 1-2) ────────────────────────────────────
  ws.mergeCells(`A${r}:F${r}`);
  const titleCell = ws.getCell(`A${r}`);
  titleCell.value   = "EXPENSE REPORT";
  titleCell.font    = { name: "Calibri", size: 22, bold: true, color: { argb: WHITE } };
  titleCell.fill    = fill(NAVY);
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(r).height = 44;
  r++;

  ws.mergeCells(`A${r}:F${r}`);
  const subCell = ws.getCell(`A${r}`);
  subCell.value   = report.title;
  subCell.font    = { name: "Calibri", size: 12, color: { argb: "FFBFDBFE" } };
  subCell.fill    = fill(NAVY);
  subCell.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(r).height = 22;
  r++;

  // ── Doc-info strip (row 3) ─────────────────────────────────────
  ws.mergeCells(`A${r}:B${r}`);
  ws.mergeCells(`C${r}:D${r}`);
  ws.mergeCells(`E${r}:F${r}`);

  const ripCell = ws.getCell(`A${r}`);
  ripCell.value = `Report #${report.id}`;
  ripCell.font  = { name: "Calibri", size: 11, bold: true, color: { argb: NAVY } };
  ripCell.fill  = fill(BLUE_LT);
  ripCell.alignment = { horizontal: "left", vertical: "middle", indent: 1 };
  ripCell.border = border();

  const genCell = ws.getCell(`C${r}`);
  genCell.value = `Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`;
  genCell.font  = { name: "Calibri", size: 10, color: { argb: MUTED } };
  genCell.fill  = fill(BLUE_LT);
  genCell.alignment = { horizontal: "center", vertical: "middle" };
  genCell.border = border();

  const stCell = ws.getCell(`E${r}`);
  const isApproved = report.status === "APPROVED";
  const isRejected = report.status === "REJECTED";
  stCell.value = report.status;
  stCell.font  = { name: "Calibri", size: 11, bold: true,
    color: { argb: isApproved ? GRN_DK : isRejected ? "FFDC2626" : NAVY } };
  stCell.fill  = fill(isApproved ? GRN_LT : isRejected ? RED_LT : GRAY_MD);
  stCell.alignment = { horizontal: "center", vertical: "middle" };
  stCell.border = border();
  ws.getRow(r).height = 26;
  r++;

  // Spacer
  ws.getRow(r).height = 6; r++;

  // ── Section helper ─────────────────────────────────────────────
  const sectionHeader = (label: string) => {
    ws.mergeCells(`A${r}:F${r}`);
    const hCell = ws.getCell(`A${r}`);
    hCell.value = `  ${label}`;
    hCell.font  = { name: "Calibri", size: 10, bold: true, color: { argb: WHITE } };
    hCell.fill  = fill(NAVY2);
    hCell.alignment = { horizontal: "left", vertical: "middle" };
    ws.getRow(r).height = 20;
    r++;
  };

  // ── Report Details ─────────────────────────────────────────────
  sectionHeader("REPORT DETAILS");

  const infoRows: [string, string, string, string][] = [
    ["Submitter",   report.submitterName  || "—", "Destination",    report.destination   || "—"],
    ["Approver",    report.approverName   || "—", "Departure Date", report.departureDate || "—"],
    ["Created At",  (report.createdAt     || "—").replace("T", " "), "Return Date",  report.returnDate    || "—"],
    ["Approved At", (report.approvedAt    || "—").replace("T", " "), "Comment",      report.approvalComment || "—"],
  ];

  for (const [lbl1, val1, lbl2, val2] of infoRows) {
    ws.mergeCells(`C${r}:D${r}`);
    ws.mergeCells(`E${r}:F${r}`);

    const lbl1c = ws.getCell(`A${r}`);
    lbl1c.value = lbl1; lbl1c.font = { name: "Calibri", size: 10, bold: true };
    lbl1c.fill = fill(BLUE_MD); lbl1c.alignment = { horizontal: "right", vertical: "middle", indent: 1 };
    lbl1c.border = border();

    const val1c = ws.getCell(`B${r}`);
    val1c.value = val1; val1c.font = { name: "Calibri", size: 10 };
    val1c.fill = fill(WHITE); val1c.alignment = { horizontal: "left", vertical: "middle", indent: 1 };
    val1c.border = border();

    const lbl2c = ws.getCell(`C${r}`);
    lbl2c.value = lbl2; lbl2c.font = { name: "Calibri", size: 10, bold: true };
    lbl2c.fill = fill(BLUE_MD); lbl2c.alignment = { horizontal: "right", vertical: "middle", indent: 1 };
    lbl2c.border = border();

    const val2c = ws.getCell(`E${r}`);
    val2c.value = val2; val2c.font = { name: "Calibri", size: 10 };
    val2c.fill = fill(WHITE); val2c.alignment = { horizontal: "left", vertical: "middle", indent: 1, wrapText: true };
    val2c.border = border();

    ws.getRow(r).height = 20; r++;
  }

  ws.getRow(r).height = 6; r++;

  // ── Per-Diem (if applicable) ────────────────────────────────────
  if (perDiemDays > 0) {
    sectionHeader("PER-DIEM ALLOWANCE");

    ws.mergeCells(`A${r}:B${r}`); ws.mergeCells(`C${r}:D${r}`); ws.mergeCells(`E${r}:F${r}`);
    const pdHdrs = [["A", "Daily Rate"], ["C", "Days"], ["E", "Per-Diem Total"]] as const;
    for (const [col, label] of pdHdrs) {
      const c = ws.getCell(`${col}${r}`);
      c.value = label; c.font = { name: "Calibri", size: 10, bold: true, color: { argb: WHITE } };
      c.fill = fill(NAVY3); c.alignment = { horizontal: "center", vertical: "middle" }; c.border = border();
    }
    ws.getRow(r).height = 20; r++;

    ws.mergeCells(`A${r}:B${r}`); ws.mergeCells(`C${r}:D${r}`); ws.mergeCells(`E${r}:F${r}`);
    const rCell = ws.getCell(`A${r}`);
    rCell.value = `$${perDiemRate}/day (${perDiemLabel(perDiemRate)})`;
    rCell.font = { name: "Calibri", size: 10 }; rCell.fill = fill(WHITE);
    rCell.alignment = { horizontal: "center", vertical: "middle" }; rCell.border = border();

    const dCell = ws.getCell(`C${r}`);
    dCell.value = perDiemDays; dCell.font = { name: "Calibri", size: 10 }; dCell.fill = fill(WHITE);
    dCell.alignment = { horizontal: "center", vertical: "middle" }; dCell.border = border();

    const tCell = ws.getCell(`E${r}`);
    tCell.value = perDiemAmount; tCell.numFmt = '"$"#,##0.00';
    tCell.font = { name: "Calibri", size: 10, bold: true }; tCell.fill = fill(WHITE);
    tCell.alignment = { horizontal: "right", vertical: "middle", indent: 1 }; tCell.border = border();
    ws.getRow(r).height = 20; r++;

    ws.getRow(r).height = 6; r++;
  }

  // ── Expense Items table ─────────────────────────────────────────
  sectionHeader("EXPENSE ITEMS");

  // Column header row
  ws.mergeCells(`E${r}:F${r}`);
  const itemHdrDefs: [string, string, "center" | "right" | "left"][] = [
    ["A", "No.",         "center"],
    ["B", "Date",        "center"],
    ["C", "Category",    "center"],
    ["D", "Description", "center"],
    ["E", "Amount (USD)", "right"],
  ];
  for (const [col, label, align] of itemHdrDefs) {
    const c = ws.getCell(`${col}${r}`);
    c.value = label; c.font = { name: "Calibri", size: 10, bold: true, color: { argb: WHITE } };
    c.fill = fill(NAVY); c.alignment = { horizontal: align, vertical: "middle" }; c.border = border();
  }
  ws.getRow(r).height = 22; r++;

  // Data rows
  items.forEach((it, i) => {
    ws.mergeCells(`E${r}:F${r}`);
    const bg = i % 2 === 1 ? GRAY_LT : WHITE;

    const noC = ws.getCell(`A${r}`);
    noC.value = i + 1; noC.font = { name: "Calibri", size: 10, color: { argb: MUTED } };
    noC.fill = fill(bg); noC.alignment = { horizontal: "center", vertical: "middle" }; noC.border = border();

    const dtC = ws.getCell(`B${r}`);
    dtC.value = it.date || "—"; dtC.font = { name: "Calibri", size: 10 };
    dtC.fill = fill(bg); dtC.alignment = { horizontal: "center", vertical: "middle" }; dtC.border = border();

    const catC = ws.getCell(`C${r}`);
    catC.value = it.category; catC.font = { name: "Calibri", size: 10 };
    catC.fill = fill(bg); catC.alignment = { horizontal: "center", vertical: "middle" }; catC.border = border();

    const dscC = ws.getCell(`D${r}`);
    dscC.value = it.description; dscC.font = { name: "Calibri", size: 10 };
    dscC.fill = fill(bg); dscC.alignment = { horizontal: "left", vertical: "middle", indent: 1, wrapText: true }; dscC.border = border();

    const amtC = ws.getCell(`E${r}`);
    amtC.value = Number(it.amount) || 0; amtC.numFmt = '"$"#,##0.00';
    amtC.font = { name: "Calibri", size: 10 }; amtC.fill = fill(bg);
    amtC.alignment = { horizontal: "right", vertical: "middle", indent: 1 }; amtC.border = border();

    ws.getRow(r).height = 20; r++;
  });

  // Subtotal row
  ws.mergeCells(`A${r}:D${r}`); ws.mergeCells(`E${r}:F${r}`);
  const stLbl = ws.getCell(`A${r}`);
  stLbl.value = "Items Subtotal"; stLbl.font = { name: "Calibri", size: 10, bold: true };
  stLbl.fill = fill(GRAY_MD); stLbl.alignment = { horizontal: "right", vertical: "middle", indent: 1 }; stLbl.border = border();
  const stAmt = ws.getCell(`E${r}`);
  stAmt.value = itemsSubtotal; stAmt.numFmt = '"$"#,##0.00';
  stAmt.font = { name: "Calibri", size: 10, bold: true }; stAmt.fill = fill(GRAY_MD);
  stAmt.alignment = { horizontal: "right", vertical: "middle", indent: 1 }; stAmt.border = border();
  ws.getRow(r).height = 20; r++;

  if (perDiemDays > 0) {
    ws.mergeCells(`A${r}:D${r}`); ws.mergeCells(`E${r}:F${r}`);
    const pdLbl = ws.getCell(`A${r}`);
    pdLbl.value = "Per-Diem Allowance"; pdLbl.font = { name: "Calibri", size: 10, bold: true };
    pdLbl.fill = fill(GRAY_MD); pdLbl.alignment = { horizontal: "right", vertical: "middle", indent: 1 }; pdLbl.border = border();
    const pdAmt = ws.getCell(`E${r}`);
    pdAmt.value = perDiemAmount; pdAmt.numFmt = '"$"#,##0.00';
    pdAmt.font = { name: "Calibri", size: 10, bold: true }; pdAmt.fill = fill(GRAY_MD);
    pdAmt.alignment = { horizontal: "right", vertical: "middle", indent: 1 }; pdAmt.border = border();
    ws.getRow(r).height = 20; r++;
  }

  // Grand Total row
  ws.mergeCells(`A${r}:D${r}`); ws.mergeCells(`E${r}:F${r}`);
  const gtLbl = ws.getCell(`A${r}`);
  gtLbl.value = "GRAND TOTAL"; gtLbl.font = { name: "Calibri", size: 13, bold: true, color: { argb: WHITE } };
  gtLbl.fill = fill(NAVY); gtLbl.alignment = { horizontal: "right", vertical: "middle", indent: 1 }; gtLbl.border = border("medium", NAVY);
  const gtAmt = ws.getCell(`E${r}`);
  gtAmt.value = grandTotal; gtAmt.numFmt = '"$"#,##0.00';
  gtAmt.font = { name: "Calibri", size: 13, bold: true, color: { argb: WHITE } }; gtAmt.fill = fill(NAVY);
  gtAmt.alignment = { horizontal: "right", vertical: "middle", indent: 1 }; gtAmt.border = border("medium", NAVY);
  ws.getRow(r).height = 28; r++;

  ws.getRow(r).height = 8; r++;

  // ── Approval section ───────────────────────────────────────────
  sectionHeader("APPROVAL");

  // Three approval boxes: Submitter | Manager/Approver | CFO/Finance
  ws.mergeCells(`A${r}:B${r}`); ws.mergeCells(`C${r}:D${r}`); ws.mergeCells(`E${r}:F${r}`);
  for (const [col, label] of [["A", "Submitter"], ["C", "Manager / Approver"], ["E", "CFO / Finance"]] as const) {
    const c = ws.getCell(`${col}${r}`);
    c.value = label; c.font = { name: "Calibri", size: 9, bold: true, color: { argb: WHITE } };
    c.fill = fill(NAVY3); c.alignment = { horizontal: "center", vertical: "middle" }; c.border = border();
  }
  ws.getRow(r).height = 18; r++;

  // Name row
  ws.mergeCells(`A${r}:B${r}`); ws.mergeCells(`C${r}:D${r}`); ws.mergeCells(`E${r}:F${r}`);
  for (const [col, val] of [[`A`, report.submitterName || ""], [`C`, report.approverName || ""], [`E`, ""]] as const) {
    const c = ws.getCell(`${col}${r}`);
    c.value = val; c.font = { name: "Calibri", size: 10, bold: true };
    c.fill = fill(WHITE); c.alignment = { horizontal: "center", vertical: "bottom" };
    c.border = { top: border().top, left: border().left, right: border().right };
  }
  ws.getRow(r).height = 20; r++;

  // Signature space row
  ws.mergeCells(`A${r}:B${r}`); ws.mergeCells(`C${r}:D${r}`); ws.mergeCells(`E${r}:F${r}`);
  for (const col of ["A", "C", "E"] as const) {
    const c = ws.getCell(`${col}${r}`);
    c.fill = fill(WHITE); c.border = { left: border().left, right: border().right };
  }
  ws.getRow(r).height = 34; r++;

  // Date row
  ws.mergeCells(`A${r}:B${r}`); ws.mergeCells(`C${r}:D${r}`); ws.mergeCells(`E${r}:F${r}`);
  const createdDate  = report.createdAt  ? report.createdAt.split("T")[0]  : "";
  const approvedDate = report.approvedAt ? report.approvedAt.split("T")[0] : "";
  for (const [col, val] of [[`A`, createdDate], [`C`, approvedDate], [`E`, approvedDate]] as const) {
    const c = ws.getCell(`${col}${r}`);
    c.value = val ? `Date: ${val}` : "Date: "; c.font = { name: "Calibri", size: 9, color: { argb: MUTED } };
    c.fill = fill(GRAY_LT); c.alignment = { horizontal: "center", vertical: "middle" };
    c.border = { bottom: border().bottom, left: border().left, right: border().right };
  }
  ws.getRow(r).height = 18; r++;

  ws.getRow(r).height = 8; r++;

  // Footer
  ws.mergeCells(`A${r}:F${r}`);
  const ftCell = ws.getCell(`A${r}`);
  ftCell.value = `Company Ops — Expense System  |  Report #${report.id}  |  Generated ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`;
  ftCell.font = { name: "Calibri", size: 8, color: { argb: "FF9CA3AF" } };
  ftCell.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(r).height = 16;

  // ── Download ───────────────────────────────────────────────────
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `expense-report-${report.id}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
