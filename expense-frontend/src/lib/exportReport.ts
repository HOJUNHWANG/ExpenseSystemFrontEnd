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
  const infoCardH = infoFields.length * rowH + cardPad * 2 + 6;
  drawSectionCard(y, infoCardH);

  y += cardPad + 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  setColor(C.primary);
  doc.text("Report Details", mx + 4, y);
  y += 5;

  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.2);
  doc.line(mx + 2, y - 1.5, mx + contentW - 2, y - 1.5);

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
  const XLSX = await import("xlsx");

  const wb = XLSX.utils.book_new();

  const perDiemDays = report.perDiemDays || 0;
  const perDiemRate = report.perDiemRate || 0;
  const perDiemAmount = report.perDiemAmount || 0;
  const items = report.items || [];
  const itemsSubtotal = items.reduce((s, it) => s + (it.amount || 0), 0);
  const grandTotal =
    report.totalAmount ?? itemsSubtotal + perDiemAmount;

  const summaryData: (string | number | null)[][] = [
    ["Expense Report Summary"],
    [],
    ["Report ID", report.id],
    ["Title", report.title],
    ["Status", report.status],
    ["Destination", report.destination || "-"],
    ["Departure", report.departureDate || "-"],
    ["Return", report.returnDate || "-"],
    ["Submitter", report.submitterName || "-"],
    ["Approver", report.approverName || "-"],
    [
      "Approved At",
      report.approvedAt ? report.approvedAt.replace("T", " ") : "-",
    ],
    ["Comment", report.approvalComment || "-"],
    [],
    [
      "Per-Diem Rate",
      perDiemDays > 0
        ? `${fmt(perDiemRate)}/day (${perDiemLabel(perDiemRate)})`
        : "N/A",
    ],
    ["Per-Diem Days", perDiemDays > 0 ? perDiemDays : "N/A"],
    ["Per-Diem Amount", perDiemDays > 0 ? fmt(perDiemAmount) : "N/A"],
    [],
    ["Grand Total", fmt(grandTotal)],
  ];

  const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
  ws1["!cols"] = [{ wch: 16 }, { wch: 36 }];
  ws1["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];
  XLSX.utils.book_append_sheet(wb, ws1, "Report Summary");

  const itemRows: (string | number)[][] = items.map((it) => [
    it.date || "-",
    it.description,
    it.category,
    Number(it.amount) || 0,
  ]);
  itemRows.push([]);
  itemRows.push(["", "", "Items Subtotal", itemsSubtotal]);
  if (perDiemDays > 0) {
    itemRows.push(["", "", "Per-Diem", perDiemAmount]);
  }
  itemRows.push(["", "", "Grand Total", grandTotal]);

  const ws2 = XLSX.utils.aoa_to_sheet([
    ["Date", "Description", "Category", "Amount"],
    ...itemRows,
  ]);
  ws2["!cols"] = [{ wch: 12 }, { wch: 28 }, { wch: 16 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, ws2, "Expense Items");

  XLSX.writeFile(wb, `expense-report-${report.id}.xlsx`);
}
