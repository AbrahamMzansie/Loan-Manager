const express = require("express");
const prisma = require("../db");
const { requireAuth } = require("../middleware/auth");
const { computeLoanBalance } = require("../utils/interest");

const router = express.Router();
router.use(requireAuth);

async function getDefaults() {
  const settings = await prisma.settings.findUnique({ where: { id: 1 } });
  return {
    interestRate: settings?.defaultRate ?? 0.3,
    periodDays: settings?.defaultPeriodDays ?? 30,
  };
}

router.get("/", async (req, res) => {
  const { status } = req.query; // "active" | "paid" | "written_off" | "overdue"
  const loans = await prisma.loan.findMany({
    where: status && status !== "overdue" ? { status } : undefined,
    include: { customer: true, payments: true },
    orderBy: { startDate: "desc" },
  });

  let result = loans.map((l) => ({ ...l, balanceInfo: computeLoanBalance(l) }));
  if (status === "overdue") {
    result = result.filter((l) => l.balanceInfo.isOverdue);
  }
  res.json(result);
});

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const loan = await prisma.loan.findUnique({
    where: { id },
    include: { customer: true, payments: { orderBy: { date: "asc" } } },
  });
  if (!loan) return res.status(404).json({ error: "Loan not found" });
  res.json({ ...loan, balanceInfo: computeLoanBalance(loan) });
});

router.post("/", async (req, res) => {
  const { customerId, principal, interestRate, periodDays, startDate, notes } = req.body;
  if (!customerId || !principal || principal <= 0) {
    return res.status(400).json({ error: "customerId and a positive principal are required" });
  }

  const customer = await prisma.customer.findUnique({ where: { id: Number(customerId) } });
  if (!customer) return res.status(404).json({ error: "Customer not found" });

  const defaults = await getDefaults();
  const loan = await prisma.loan.create({
    data: {
      customerId: Number(customerId),
      principal: Number(principal),
      interestRate: interestRate != null ? Number(interestRate) : defaults.interestRate,
      periodDays: periodDays != null ? Number(periodDays) : defaults.periodDays,
      startDate: startDate ? new Date(startDate) : new Date(),
      notes,
      createdBy: req.user.id,
    },
    include: { customer: true, payments: true },
  });
  res.status(201).json({ ...loan, balanceInfo: computeLoanBalance(loan) });
});

router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { principal, interestRate, periodDays, startDate, notes, status } = req.body;
  try {
    const loan = await prisma.loan.update({
      where: { id },
      data: {
        principal: principal != null ? Number(principal) : undefined,
        interestRate: interestRate != null ? Number(interestRate) : undefined,
        periodDays: periodDays != null ? Number(periodDays) : undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        notes,
        status,
      },
      include: { customer: true, payments: true },
    });
    res.json({ ...loan, balanceInfo: computeLoanBalance(loan) });
  } catch (err) {
    res.status(404).json({ error: "Loan not found" });
  }
});

// Record a payment against a loan. If it fully covers the outstanding
// balance, the loan is automatically marked "paid".
router.post("/:id/payments", async (req, res) => {
  const id = Number(req.params.id);
  const { amount, date, method, note } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ error: "A positive amount is required" });

  const loan = await prisma.loan.findUnique({ where: { id }, include: { payments: true } });
  if (!loan) return res.status(404).json({ error: "Loan not found" });

  const payment = await prisma.payment.create({
    data: {
      loanId: id,
      amount: Number(amount),
      date: date ? new Date(date) : new Date(),
      method,
      note,
      recordedBy: req.user.id,
    },
  });

  const updatedLoan = await prisma.loan.findUnique({ where: { id }, include: { payments: true, customer: true } });
  const balanceInfo = computeLoanBalance(updatedLoan, new Date(payment.date));

  let status = updatedLoan.status;
  if (balanceInfo.isPaid && status !== "paid") {
    status = "paid";
    await prisma.loan.update({ where: { id }, data: { status: "paid" } });
  }

  res.status(201).json({ payment, loan: { ...updatedLoan, status, balanceInfo } });
});

// Manually mark a loan as fully paid (e.g. wrote off remaining cents, or a
// cash payment was already recorded outside the system).
router.post("/:id/mark-paid", async (req, res) => {
  const id = Number(req.params.id);
  try {
    const loan = await prisma.loan.update({ where: { id }, data: { status: "paid" } });
    res.json(loan);
  } catch (err) {
    res.status(404).json({ error: "Loan not found" });
  }
});

router.delete("/:id/payments/:paymentId", async (req, res) => {
  const paymentId = Number(req.params.paymentId);
  try {
    await prisma.payment.delete({ where: { id: paymentId } });
    res.status(204).end();
  } catch (err) {
    res.status(404).json({ error: "Payment not found" });
  }
});

module.exports = router;
