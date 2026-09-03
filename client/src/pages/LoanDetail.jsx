import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api";
import LoanStatusBadge from "../components/LoanStatusBadge";

function money(n) {
  return `R${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function LoanDetail() {
  const { id } = useParams();
  const [loan, setLoan] = useState(null);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("cash");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  function load() {
    api.getLoan(id).then(setLoan).catch((e) => setError(e.message));
  }

  useEffect(() => { load(); }, [id]);

  async function recordPayment(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    try {
      const res = await api.recordPayment(id, { amount: Number(amount), method });
      setAmount("");
      if (res.queued) {
        setInfo("Offline — payment queued and will sync once you're back online.");
      } else {
        setInfo(res.loan.status === "paid" ? "Payment recorded — loan is now fully paid." : "Payment recorded.");
      }
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function markPaid() {
    if (!confirm("Mark this loan as fully paid without recording an exact payment amount?")) return;
    try {
      await api.markPaid(id);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  if (error && !loan) return <div className="error-box">{error}</div>;
  if (!loan) return <p>Loading...</p>;

  const { balanceInfo } = loan;

  return (
    <div>
      <p><Link to={`/customers/${loan.customerId}`}>&larr; {loan.customer.name}</Link></p>
      <div className="page-header">
        <h1>Loan #{loan.id}</h1>
        <LoanStatusBadge loan={loan} />
      </div>

      {error && <div className="error-box">{error}</div>}
      {info && <div className="info-box">{info}</div>}

      <div className="stat-grid">
        <div className="stat-card"><div className="stat-value">{money(loan.principal)}</div><div className="stat-label">Principal</div></div>
        <div className="stat-card"><div className="stat-value">{(loan.interestRate * 100).toFixed(0)}%</div><div className="stat-label">Interest per {loan.periodDays}-day period</div></div>
        <div className="stat-card"><div className="stat-value">{money(balanceInfo.grossDue)}</div><div className="stat-label">Total due (with interest so far)</div></div>
        <div className="stat-card stat-danger"><div className="stat-value">{money(balanceInfo.balance)}</div><div className="stat-label">Outstanding balance</div></div>
      </div>

      <div className="card">
        <p><strong>Start date:</strong> {new Date(loan.startDate).toLocaleDateString()}</p>
        <p><strong>Due date:</strong> {new Date(balanceInfo.dueDate).toLocaleDateString()}</p>
        <p><strong>Interest periods elapsed:</strong> {balanceInfo.periodsElapsed}</p>
        {loan.notes && <p><strong>Notes:</strong> {loan.notes}</p>}
        {balanceInfo.isOverdue && (
          <p><Link to={`/loans/${loan.id}/invoice`}>View / print overdue invoice</Link></p>
        )}
      </div>

      {!balanceInfo.isPaid && (
        <>
          <h2>Record a payment</h2>
          <form className="card form-inline" onSubmit={recordPayment}>
            <div>
              <label>Amount (R)</label>
              <input type="number" min="0.01" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div>
              <label>Method</label>
              <select value={method} onChange={(e) => setMethod(e.target.value)}>
                <option value="cash">Cash</option>
                <option value="eft">EFT</option>
                <option value="other">Other</option>
              </select>
            </div>
            <button type="submit">Record payment</button>
            <button type="button" className="btn-secondary" onClick={markPaid}>Mark fully paid</button>
          </form>
        </>
      )}

      <h2>Payment history</h2>
      <table className="table">
        <thead><tr><th>Date</th><th>Amount</th><th>Method</th></tr></thead>
        <tbody>
          {loan.payments.map((p) => (
            <tr key={p.id}>
              <td>{new Date(p.date).toLocaleDateString()}</td>
              <td>{money(p.amount)}</td>
              <td>{p.method || "—"}</td>
            </tr>
          ))}
          {loan.payments.length === 0 && <tr><td colSpan={3} className="muted">No payments recorded yet.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
