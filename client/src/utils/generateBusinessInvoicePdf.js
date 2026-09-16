import { jsPDF } from "jspdf";

function money(n) {
  return `R${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

const LOGO_MAX_WIDTH = 70;
const LOGO_MAX_HEIGHT = 70;

const GREEN = [31, 111, 74]; // matches --green
const GREEN_TINT = [238, 246, 241];
const DARK_TEXT = [26, 26, 26];
const GRAY_TEXT = [85, 85, 85];
const MUTED_TEXT = [136, 136, 136];
const BORDER = [224, 224, 224];
const STRIPE = [250, 251, 250];

// Builds the same content as BusinessInvoiceDocument.jsx, as a real
// downloadable PDF file, and triggers the save dialog.
export async function generateBusinessInvoicePdf({ company, invoice, total }) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 48;
  const contentWidth = pageWidth - marginX * 2;
  const rightEdge = marginX + contentWidth;
  let y = 50;

  // --- Header: logo + company name on the left, invoice #/date on the right ---
  let logoW = 0;
  let logoH = 0;
  if (company.logo) {
    try {
      const img = await loadImage(company.logo);
      const scale = Math.min(LOGO_MAX_WIDTH / img.naturalWidth, LOGO_MAX_HEIGHT / img.naturalHeight);
      logoW = img.naturalWidth * scale;
      logoH = img.naturalHeight * scale;
      const format = company.logo.startsWith("data:image/png") ? "PNG" : "JPEG";
      doc.addImage(company.logo, format, marginX, y, logoW, logoH, undefined, "FAST");
    } catch {
      // Malformed/unsupported image data - skip the logo rather than fail the whole PDF.
      logoW = 0;
      logoH = 0;
    }
  }

  const nameX = marginX + (logoW ? logoW + 14 : 0);
  const nameBaselineY = logoH ? y + logoH / 2 + 6 : y + 16;
  doc.setFont(undefined, "bold");
  doc.setFontSize(18);
  doc.setTextColor(...GREEN);
  doc.text(company.name, nameX, nameBaselineY);

  doc.setFont(undefined, "bold");
  doc.setFontSize(14);
  doc.setTextColor(...DARK_TEXT);
  doc.text(`INVOICE #${invoice.id}`, rightEdge, y + 10, { align: "right" });
  doc.setFont(undefined, "normal");
  doc.setFontSize(10);
  doc.setTextColor(...MUTED_TEXT);
  doc.text(new Date(invoice.date).toLocaleDateString(), rightEdge, y + 26, { align: "right" });

  const headerBottom = Math.max(y + logoH, y + 34) + 14;
  doc.setDrawColor(...GREEN);
  doc.setLineWidth(2);
  doc.line(marginX, headerBottom, rightEdge, headerBottom);
  y = headerBottom + 26;

  // --- Billed to ---
  doc.setFont(undefined, "bold");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED_TEXT);
  doc.text("BILLED TO", marginX, y);
  y += 16;
  doc.setFont(undefined, "bold");
  doc.setFontSize(13);
  doc.setTextColor(...DARK_TEXT);
  doc.text(invoice.customer.name, marginX, y);
  y += 16;
  doc.setFont(undefined, "normal");
  doc.setFontSize(10);
  doc.setTextColor(...GRAY_TEXT);
  const customerLines = [invoice.customer.phone, invoice.customer.email, invoice.customer.address].filter(Boolean);
  for (const line of customerLines) {
    doc.text(line, marginX, y);
    y += 14;
  }
  y += 18;

  // --- Items table ---
  const headerRowHeight = 26;
  const rowHeight = 24;

  doc.setFillColor(...GREEN);
  doc.rect(marginX, y, contentWidth, headerRowHeight, "F");
  doc.setFont(undefined, "bold");
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text("DESCRIPTION", marginX + 10, y + headerRowHeight / 2 + 3);
  doc.text("AMOUNT", rightEdge - 10, y + headerRowHeight / 2 + 3, { align: "right" });
  y += headerRowHeight;

  doc.setFont(undefined, "normal");
  doc.setFontSize(10);
  invoice.items.forEach((item, i) => {
    if (i % 2 === 1) {
      doc.setFillColor(...STRIPE);
      doc.rect(marginX, y, contentWidth, rowHeight, "F");
    }
    doc.setTextColor(...DARK_TEXT);
    doc.text(item.description, marginX + 10, y + rowHeight / 2 + 3);
    doc.text(money(item.amount), rightEdge - 10, y + rowHeight / 2 + 3, { align: "right" });
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.5);
    doc.line(marginX, y + rowHeight, rightEdge, y + rowHeight);
    y += rowHeight;
  });

  const totalRowHeight = 30;
  doc.setFillColor(...GREEN_TINT);
  doc.rect(marginX, y, contentWidth, totalRowHeight, "F");
  doc.setDrawColor(...GREEN);
  doc.setLineWidth(1.5);
  doc.line(marginX, y, rightEdge, y);
  doc.setFont(undefined, "bold");
  doc.setFontSize(12);
  doc.setTextColor(...GREEN);
  doc.text("TOTAL", marginX + 10, y + totalRowHeight / 2 + 4);
  doc.text(money(total), rightEdge - 10, y + totalRowHeight / 2 + 4, { align: "right" });
  y += totalRowHeight + 22;

  // --- Notes ---
  if (invoice.notes) {
    doc.setFont(undefined, "italic");
    doc.setFontSize(9);
    doc.setTextColor(...MUTED_TEXT);
    const wrapped = doc.splitTextToSize(invoice.notes, contentWidth);
    doc.text(wrapped, marginX, y);
    y += wrapped.length * 12 + 18;
  }

  // --- Banking details box ---
  const bankLines = [
    company.bankAccountHolder && ["Account holder", company.bankAccountHolder],
    company.bankAccountNumber && ["Account number", company.bankAccountNumber],
    company.bankName && ["Bank name", company.bankName],
    company.branchCode && ["Branch code", company.branchCode],
  ].filter(Boolean);

  if (bankLines.length > 0) {
    const lineHeight = 15;
    const boxPaddingY = 14;
    const boxHeight = boxPaddingY * 2 + 12 + bankLines.length * lineHeight;

    doc.setFillColor(...STRIPE);
    doc.rect(marginX, y, contentWidth, boxHeight, "F");
    doc.setFillColor(...GREEN);
    doc.rect(marginX, y, 4, boxHeight, "F");

    let by = y + boxPaddingY + 8;
    doc.setFont(undefined, "bold");
    doc.setFontSize(9);
    doc.setTextColor(...MUTED_TEXT);
    doc.text("BANKING DETAILS", marginX + 16, by);
    by += lineHeight;

    doc.setFontSize(10);
    for (const [label, value] of bankLines) {
      doc.setFont(undefined, "bold");
      doc.setTextColor(60, 60, 60);
      doc.text(`${label}:`, marginX + 16, by);
      doc.setFont(undefined, "normal");
      doc.setTextColor(...DARK_TEXT);
      doc.text(value, marginX + 140, by);
      by += lineHeight;
    }
  }

  doc.save(`invoice-${invoice.id}.pdf`);
}
