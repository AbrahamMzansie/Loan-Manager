import { jsPDF } from "jspdf";

function money(n) {
  return `R${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Builds the same content as InvoiceDocument.jsx, as a real downloadable
// PDF file (not a browser print-to-PDF), and triggers the save dialog.
export function generateInvoicePdf({ businessName, loan, balanceInfo }) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const marginX = 48;
  let y = 56;

  doc.setFontSize(18);
  doc.text(businessName, marginX, y);
  y += 26;

  doc.setFontSize(13);
  doc.text("Loan statement", marginX, y);
  y += 20;

  doc.setFontSize(10);
  doc.text(`Date issued: ${new Date().toLocaleDateString()}`, marginX, y);
  y += 28;

  doc.setFontSize(11);
  doc.text("Customer", marginX, y);
  y += 16;
  doc.setFontSize(10);
  const customerLines = [
    loan.customer.name,
    loan.customer.phone,
    loan.customer.email,
    loan.customer.address,
  ].filter(Boolean);
  for (const line of customerLines) {
    doc.text(line, marginX, y);
    y += 14;
  }
  y += 14;

  const rows = [
    ["Loan reference", `#${loan.id}`],
    ["Principal borrowed", money(loan.principal)],
    ["Interest rate", `${(loan.interestRate * 100).toFixed(0)}% per ${loan.periodDays} days`],
    ["Loan start date", new Date(loan.startDate).toLocaleDateString()],
    ["Due date", new Date(balanceInfo.dueDate).toLocaleDateString()],
    ["Interest periods elapsed", String(balanceInfo.periodsElapsed)],
    ["Total amount due (incl. interest)", money(balanceInfo.grossDue)],
    ["Total paid to date", money(balanceInfo.totalPaid)],
    ["Balance outstanding", money(balanceInfo.balance)],
  ];

  doc.setFontSize(10);
  for (const [label, value] of rows) {
    doc.setFont(undefined, "normal");
    doc.text(label, marginX, y);
    doc.setFont(undefined, "bold");
    doc.text(value, marginX + 260, y);
    y += 18;
  }
  doc.setFont(undefined, "normal");
  y += 14;

  const note = balanceInfo.isPaid
    ? "This loan has been paid in full."
    : balanceInfo.isOverdue
    ? `This loan is overdue: no full payment was received by the due date shown above. Interest continues to be added for each additional ${loan.periodDays}-day period the balance remains unpaid.`
    : "Payment is due in full by the date shown above.";
  const wrapped = doc.splitTextToSize(note, 500);
  doc.setFontSize(9);
  doc.text(wrapped, marginX, y);

  doc.save(`invoice-loan-${loan.id}.pdf`);
}
