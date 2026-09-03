import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import LoanStatusBadge from "../components/LoanStatusBadge";

function money(n) {
  return `R${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.dashboard().then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="error-box">{error}. If you're offline, this page needs to have loaded at least once before to show cached data.</div>;
  if (!data) return <p>Loading...</p>;

  const { stats, overdue, dueSoon } = data;

  return (
    <div>
      <h1>Dashboard</h1>
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.activeLoans}</div>
          <div className="stat-label">Active loans</div>
        </div>
        <div className="stat-card stat-danger">
          <div className="stat-value">{stats.overdueLoans}</div>
          <div className="stat-label">Overdue loans</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{money(stats.totalOutstanding)}</div>
          <div className="stat-label">Total outstanding (incl. interest)</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.customerCount}</div>
          <div className="stat-label">Customers</div>
        </div>
      </div>

      <section>
        <h2>Overdue — no payment received after the due period</h2>
        {overdue.length === 0 ? (
          <p className="muted">Nothing overdue right now.</p>
        ) : (
          <table className="table">
            <thead>
              <tr><th>Customer</th><th>Principal</th><th>Balance due</th><th>Due date</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {overdue.map((loan) => (
                <tr key={loan.id}>
                  <td><Link to={`/customers/${loan.customerId}`}>{loan.customer.name}</Link></td>
                  <td>{money(loan.principal)}</td>
                  <td>{money(loan.balanceInfo.balance)}</td>
                  <td>{new Date(loan.balanceInfo.dueDate).toLocaleDateString()}</td>
                  <td><LoanStatusBadge loan={loan} /></td>
                  <td>
                    <Link to={`/loans/${loan.id}/invoice`}>View invoice</Link>
                    {" · "}
                    <Link to={`/loans/${loan.id}`}>Open</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section>
        <h2>Due within 5 days</h2>
        {dueSoon.length === 0 ? (
          <p className="muted">Nothing due soon.</p>
        ) : (
          <table className="table">
            <thead>
              <tr><th>Customer</th><th>Balance due</th><th>Due date</th><th></th></tr>
            </thead>
            <tbody>
              {dueSoon.map((loan) => (
                <tr key={loan.id}>
                  <td><Link to={`/customers/${loan.customerId}`}>{loan.customer.name}</Link></td>
                  <td>{money(loan.balanceInfo.balance)}</td>
                  <td>{new Date(loan.balanceInfo.dueDate).toLocaleDateString()}</td>
                  <td><Link to={`/loans/${loan.id}`}>Open</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
