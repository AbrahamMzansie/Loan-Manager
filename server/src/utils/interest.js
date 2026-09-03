// Core interest/balance calculation for a loan.
//
// Business rule (as specified): borrow 1000, pay back 1300 within the first
// period (default 30 days) -> 30% interest. If it is NOT paid off within a
// period, another 30% is added on top of the *outstanding* amount for every
// additional period that passes (compounding), not a flat re-charge of the
// original principal. This is intentional: it makes it progressively more
// expensive the longer a loan is overdue, which is how the business already
// operates informally.
//
// periodsElapsed starts at 1 the moment a loan is issued (interest is due
// even if paid same-day, matching "you take 1000, you pay back 1300").

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * @param {Object} loan
 * @param {number} loan.principal
 * @param {number} loan.interestRate   e.g. 0.30 for 30%
 * @param {number} loan.periodDays     e.g. 30
 * @param {Date|string} loan.startDate
 * @param {Array<{amount:number, date:Date|string}>} loan.payments
 * @param {Date} [asOfDate] defaults to now
 */
function computeLoanBalance(loan, asOfDate = new Date()) {
  const start = new Date(loan.startDate);
  const rate = loan.interestRate;
  const periodDays = loan.periodDays;

  const daysElapsed = Math.max(0, (asOfDate.getTime() - start.getTime()) / DAY_MS);
  const periodsElapsed = Math.floor(daysElapsed / periodDays) + 1;

  const grossDue = loan.principal * Math.pow(1 + rate, periodsElapsed);

  const payments = (loan.payments || []).slice().sort((a, b) => new Date(a.date) - new Date(b.date));
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

  const rawBalance = grossDue - totalPaid;
  const balance = Math.round(Math.max(0, rawBalance) * 100) / 100;

  const dueDate = new Date(start.getTime() + periodDays * DAY_MS);
  const isPaid = loan.status === "paid" || balance <= 0.01;
  const isOverdue = !isPaid && asOfDate.getTime() > dueDate.getTime();

  return {
    periodsElapsed,
    grossDue: Math.round(grossDue * 100) / 100,
    totalPaid: Math.round(totalPaid * 100) / 100,
    balance,
    dueDate,
    isPaid,
    isOverdue,
    monthsOverdue: isOverdue ? periodsElapsed - 1 : 0,
  };
}

module.exports = { computeLoanBalance, DAY_MS };
