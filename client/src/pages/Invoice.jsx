import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api";

function money(n) {
  return `R${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function Invoice() {
  const { id } = useParams();
  const [loan, setLoan] = useState(null);
  const [settings, setSettings] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.getLoan(id), api.getSettings()])
      .then(([l, s]) => { setLoan(l); setSettings(s); })
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) return <div className="error-box">{error}</div>;
  if (!loan || !settings) return <p>Loading...</p>;

  const { balanceInfo } = loan;

  return (
    <div className="invoice">
      <div className="no-print page-header">
        <Link to={`/loans/${loan.id}`}>&larr; Back to loan</Link>
        <button onClick={() => window.print()}>Print / Save as PDF</button>
      </div>

      <h1>{settings.businessName}</h1>
      <h2>Overdue statement</h2>
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
          <tr><td>Original due date</td><td>{new Date(balanceInfo.dueDate).toLocaleDateString()}</td></tr>
          <tr><td>Interest periods elapsed</td><td>{balanceInfo.periodsElapsed}</td></tr>
          <tr><td>Total amount due (incl. interest)</td><td>{money(balanceInfo.grossDue)}</td></tr>
          <tr><td>Total paid to date</td><td>{money(balanceInfo.totalPaid)}</td></tr>
          <tr className="total-row"><td><strong>Balance outstanding</strong></td><td><strong>{money(balanceInfo.balance)}</strong></td></tr>
        </tbody>
      </table>

      <p className="muted">
        This loan is overdue: no full payment was received by the due date shown above.
        Interest continues to be added for each additional {loan.periodDays}-day period the balance remains unpaid.
      </p>
    </div>
  );
}
