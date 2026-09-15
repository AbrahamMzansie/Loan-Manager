// Unauthenticated routes reachable via an unguessable share token, e.g. a
// customer opening an invoice link from WhatsApp. No login required -
// access control is entirely "do you have the token", so only expose the
// minimal fields a customer's own invoice needs.
const express = require("express");
const prisma = require("../db");
const { computeLoanBalance } = require("../utils/interest");

const router = express.Router();

router.get("/loan-statements/:token", async (req, res) => {
  const { token } = req.params;
  const loan = await prisma.loan.findUnique({
    where: { shareToken: token },
    include: { customer: true, payments: { orderBy: { date: "asc" } } },
  });
  if (!loan) return res.status(404).json({ error: "Statement not found" });

  const settings = await prisma.settings.findUnique({ where: { id: 1 } });

  res.json({
    businessName: settings?.businessName || "Loan Manager",
    loan: {
      id: loan.id,
      principal: loan.principal,
      interestRate: loan.interestRate,
      periodDays: loan.periodDays,
      startDate: loan.startDate,
      status: loan.status,
      payments: loan.payments.map((p) => ({ date: p.date, amount: p.amount, method: p.method })),
      customer: {
        name: loan.customer.name,
        phone: loan.customer.phone,
        email: loan.customer.email,
        address: loan.customer.address,
      },
    },
    balanceInfo: computeLoanBalance(loan),
  });
});

router.get("/invoices/:token", async (req, res) => {
  const { token } = req.params;
  const invoice = await prisma.invoice.findUnique({
    where: { shareToken: token },
    include: { customer: true, items: true },
  });
  if (!invoice) return res.status(404).json({ error: "Invoice not found" });

  const issuer = invoice.createdBy ? await prisma.user.findUnique({ where: { id: invoice.createdBy } }) : null;
  const total = Math.round(invoice.items.reduce((sum, i) => sum + i.amount, 0) * 100) / 100;

  res.json({
    company: {
      name: issuer?.invoiceCompanyName || "Invoice",
      logo: issuer?.invoiceLogo || null,
      bankAccountHolder: issuer?.invoiceBankAccountHolder || null,
      bankAccountNumber: issuer?.invoiceBankAccountNumber || null,
      bankName: issuer?.invoiceBankName || null,
      branchCode: issuer?.invoiceBranchCode || null,
    },
    invoice: {
      id: invoice.id,
      date: invoice.date,
      notes: invoice.notes,
      items: invoice.items.map((i) => ({ description: i.description, amount: i.amount })),
      customer: {
        name: invoice.customer.name,
        phone: invoice.customer.phone,
        email: invoice.customer.email,
        address: invoice.customer.address,
      },
    },
    total,
  });
});

module.exports = router;
