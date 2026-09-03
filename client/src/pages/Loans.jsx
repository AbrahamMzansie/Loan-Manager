import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import LoanStatusBadge from "../components/LoanStatusBadge";

function money(n) {
  return `R${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const FILTERS = [
  { key: "", label: "All" },
  { key: "active", label: "Active" },
  { key: "overdue", label: "Overdue" },
  { key: "paid", label: "Paid" },
];

export default function Loans() {
  const [loans, setLoans] = useState([]);
  const [filter, setFilter] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api.listLoans(filter || undefined).then(setLoans).catch((e) => setError(e.message));
  }, [filter]);

  return (
    <div>
      <h1>Loans</h1>
      <div className="filter-bar">
        {FILTERS.map((f) => (
          <button key={f.key} className={filter === f.key ? "chip chip-active" : "chip"} onClick={() => setFilter(f.key)}>
            {f.label}
          </button>
        ))}
      </div>

      {error && <div className="error-box">{error}</div>}

      <table className="table">
        <thead>
          <tr><th>Customer</th><th>Started</th><th>Principal</th><th>Balance due</th><th>Due date</th><th>Status</th><th></th></tr>
        </thead>
        <tbody>
          {loans.map((loan) => (
            <tr key={loan.id}>
              <td><Link to={`/customers/${loan.customerId}`}>{loan.customer.name}</Link></td>
              <td>{new Date(loan.startDate).toLocaleDateString()}</td>
              <td>{money(loan.principal)}</td>
              <td>{money(loan.balanceInfo.balance)}</td>
              <td>{new Date(loan.balanceInfo.dueDate).toLocaleDateString()}</td>
              <td><LoanStatusBadge loan={loan} /></td>
              <td><Link to={`/loans/${loan.id}`}>Open</Link></td>
            </tr>
          ))}
          {loans.length === 0 && <tr><td colSpan={7} className="muted">No loans found.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
