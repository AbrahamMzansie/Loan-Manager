function money(n) {
  return `R${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Shared visual layout for a loan invoice/statement — used by both the
// logged-in Invoice page and the public (no-login) shared link, and read
// by generateInvoicePdf.js to build the same content as a real PDF.
export default function InvoiceDocument({ businessName, loan, balanceInfo }) {
  return (
    <div className="invoice">
      <h1>{businessName}</h1>
      <h2>Loan statement</h2>
      <p>Date issued: {new Date().toLocaleDateString()}</p>

      <div className="invoice-block">
        <strong>Customer</strong>
        <p>{loan.customer.name}</p>
        {loan.customer.phone && <p>{loan.customer.phone}</p>}
        {loan.customer.email && <p>{loan.customer.email}</p>}
        {loan.customer.address && <p>{loan.customer.address}</p>}
      </div>

      <table className="table">
        <tbody>
          <tr><td>Loan reference</td><td>#{loan.id}</td></tr>
          <tr><td>Principal borrowed</td><td>{money(loan.principal)}</td></tr>
          <tr><td>Interest rate</td><td>{(loan.interestRate * 100).toFixed(0)}% per {loan.periodDays} days</td></tr>
          <tr><td>Loan start date</td><td>{new Date(loan.startDate).toLocaleDateString()}</td></tr>
          <tr><td>Due date</td><td>{new Date(balanceInfo.dueDate).toLocaleDateString()}</td></tr>
          <tr><td>Interest periods elapsed</td><td>{balanceInfo.periodsElapsed}</td></tr>
          <tr><td>Total amount due (incl. interest)</td><td>{money(balanceInfo.grossDue)}</td></tr>
          <tr><td>Total paid to date</td><td>{money(balanceInfo.totalPaid)}</td></tr>
          <tr className="total-row"><td><strong>Balance outstanding</strong></td><td><strong>{money(balanceInfo.balance)}</strong></td></tr>
        </tbody>
      </table>

      <p className="muted">
        {balanceInfo.isPaid
          ? "This loan has been paid in full."
          : balanceInfo.isOverdue
          ? `This loan is overdue: no full payment was received by the due date shown above. Interest continues to be added for each additional ${loan.periodDays}-day period the balance remains unpaid.`
          : `Payment is due in full by the date shown above.`}
      </p>
    </div>
  );
}

export { money };
