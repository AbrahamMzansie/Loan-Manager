// Unauthenticated routes reachable via an unguessable share token, e.g. a
// customer opening an invoice link from WhatsApp. No login required -
// access control is entirely "do you have the token", so only expose the
// minimal fields a customer's own invoice needs.
const express = require("express");
const prisma = require("../db");
const { computeLoanBalance } = require("../utils/interest");

const router = express.Router();

router.get("/invoices/:token", async (req, res) => {
  const { token } = req.params;
  const loan = await prisma.loan.findUnique({
    where: { shareToken: token },
    include: { customer: true, payments: { orderBy: { date: "asc" } } },
  });
  if (!loan) return res.status(404).json({ error: "Invoice not found" });

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

module.exports = router;
