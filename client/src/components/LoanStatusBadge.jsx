export default function LoanStatusBadge({ loan }) {
  const info = loan.balanceInfo;
  if (!info) return null;

  if (info.isPaid) return <span className="badge badge-paid">Paid</span>;
  if (info.isOverdue) {
    const label = info.monthsOverdue === 1 ? "Overdue · 1 period" : `Overdue · ${info.monthsOverdue} periods`;
    return <span className="badge badge-overdue">{label}</span>;
  }
  return <span className="badge badge-active">Active</span>;
}
