import { jsPDF } from "jspdf";

function money(n) {
  return `R${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Builds the same content as BusinessInvoiceDocument.jsx, as a real
// downloadable PDF file, and triggers the save dialog.
export function generateBusinessInvoicePdf({ company, invoice, total }) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const marginX = 48;
  let y = 56;

  if (company.logo) {
    try {
      const format = company.logo.startsWith("data:image/png") ? "PNG" : "JPEG";
      doc.addImage(company.logo, format, marginX, y, 100, 50, undefined, "FAST");
      y += 64;
    } catch {
      // Malformed/unsupported image data - skip the logo rather than fail the whole PDF.
    }
  }

  doc.setFontSize(18);
  doc.text(company.name, marginX, y);
  y += 24;

  doc.setFontSize(10);
  doc.text(`Date: ${new Date(invoice.date).toLocaleDateString()}`, marginX, y);
  y += 28;

  doc.setFontSize(11);
  doc.text("Billed to", marginX, y);
  y += 16;
  doc.setFontSize(10);
  const customerLines = [
    invoice.customer.name,
    invoice.customer.phone,
    invoice.customer.email,
    invoice.customer.address,
  ].filter(Boolean);
  for (const line of customerLines) {
    doc.text(line, marginX, y);
    y += 14;
  }
  y += 14;

  doc.setFontSize(10);
  invoice.items.forEach((item, i) => {
    doc.text(`[${i + 1}] ${item.description}`, marginX, y);
    doc.text(money(item.amount), marginX + 380, y);
    y += 18;
  });
  y += 6;
  doc.setFont(undefined, "bold");
  doc.text("Total", marginX, y);
  doc.text(money(total), marginX + 380, y);
  doc.setFont(undefined, "normal");
  y += 28;

  if (invoice.notes) {
    const wrapped = doc.splitTextToSize(invoice.notes, 500);
    doc.setFontSize(9);
    doc.text(wrapped, marginX, y);
    y += wrapped.length * 12 + 14;
  }

  const hasBanking = company.bankAccountHolder || company.bankAccountNumber || company.bankName || company.branchCode;
  if (hasBanking) {
    doc.setFontSize(11);
    doc.text("Banking details", marginX, y);
    y += 16;
    doc.setFontSize(10);
    const bankLines = [
      company.bankAccountHolder && `Account holder: ${company.bankAccountHolder}`,
      company.bankAccountNumber && `Account number: ${company.bankAccountNumber}`,
      company.bankName && `Bank name: ${company.bankName}`,
      company.branchCode && `Branch code: ${company.branchCode}`,
    ].filter(Boolean);
    for (const line of bankLines) {
      doc.text(line, marginX, y);
      y += 14;
    }
  }

  doc.save(`invoice-${invoice.id}.pdf`);
}
