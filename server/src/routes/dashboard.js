const express = require("express");
const prisma = require("../db");
const { requireAuth } = require("../middleware/auth");
const { computeLoanBalance } = require("../utils/interest");
const { ownerScope } = require("../utils/scope");

const router = express.Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  const loans = await prisma.loan.findMany({
    where: { status: { not: "written_off" }, customer: ownerScope(req) },
    include: { customer: true, payments: true },
  });

  const withBalance = loans.map((l) => ({ ...l, balanceInfo: computeLoanBalance(l) }));

  const active = withBalance.filter((l) => l.status !== "paid");
  const overdue = active.filter((l) => l.balanceInfo.isOverdue);
  const dueSoon = active.filter((l) => {
    if (l.balanceInfo.isOverdue) return false;
    const daysToDue = (l.balanceInfo.dueDate.getTime() - Date.now()) / 86400000;
    return daysToDue <= 5;
  });

  const totalOutstanding = active.reduce((sum, l) => sum + l.balanceInfo.balance, 0);
  const totalPrincipalOut = active.reduce((sum, l) => sum + l.principal, 0);
  const customerCount = await prisma.customer.count({ where: ownerScope(req) });

  res.json({
    stats: {
      activeLoans: active.length,
      overdueLoans: overdue.length,
      totalOutstanding: Math.round(totalOutstanding * 100) / 100,
      totalPrincipalOut: Math.round(totalPrincipalOut * 100) / 100,
      customerCount,
    },
    overdue: overdue.sort((a, b) => b.balanceInfo.monthsOverdue - a.balanceInfo.monthsOverdue),
    dueSoon: dueSoon.sort((a, b) => a.balanceInfo.dueDate - b.balanceInfo.dueDate),
  });
});

module.exports = router;
