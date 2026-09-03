import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../api";
import LoanStatusBadge from "../components/LoanStatusBadge";

function money(n) {
  return `R${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [showLoanForm, setShowLoanForm] = useState(false);
  const [loanForm, setLoanForm] = useState({ principal: "", interestRate: "", periodDays: "", startDate: "", notes: "" });
  const [error, setError] = useState("");

  function load() {
    api.getCustomer(id).then((c) => { setCustomer(c); setForm(c); }).catch((e) => setError(e.message));
  }

  useEffect(() => { load(); }, [id]);

  async function saveCustomer(e) {
    e.preventDefault();
    setError("");
    try {
      await api.updateCustomer(id, form);
      setEditing(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function addLoan(e) {
    e.preventDefault();
    setError("");
    try {
      const payload = {
        customerId: Number(id),
        principal: Number(loanForm.principal),
        interestRate: loanForm.interestRate ? Number(loanForm.interestRate) / 100 : undefined,
        periodDays: loanForm.periodDays ? Number(loanForm.periodDays) : undefined,
        startDate: loanForm.startDate || undefined,
        notes: loanForm.notes,
      };
      const res = await api.createLoan(payload);
      setLoanForm({ principal: "", interestRate: "", periodDays: "", startDate: "", notes: "" });
      setShowLoanForm(false);
      if (res.queued) setError("Offline — the new loan is queued and will sync once you're back online.");
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteCustomer() {
    if (!confirm("Delete this customer? This only works if they have no loan history.")) return;
    try {
      await api.deleteCustomer(id);
      navigate("/customers");
    } catch (err) {
      setError(err.message);
    }
  }

  if (error && !customer) return <div className="error-box">{error}</div>;
  if (!customer) return <p>Loading...</p>;

  return (
    <div>
      <p><Link to="/customers">&larr; All customers</Link></p>
      <div className="page-header">
        <h1>{customer.name}</h1>
        <div>
          <button onClick={() => setEditing((s) => !s)}>{editing ? "Cancel" : "Edit"}</button>{" "}
          <button className="btn-danger" onClick={deleteCustomer}>Delete</button>
        </div>
      </div>

      {error && <div className="error-box">{error}</div>}

      {editing ? (
        <form className="card form-grid" onSubmit={saveCustomer}>
          <div><label>Name *</label><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label>Phone</label><input value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div><label>Email</label><input value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><label>ID number</label><input value={form.idNumber || ""} onChange={(e) => setForm({ ...form, idNumber: e.target.value })} /></div>
          <div className="span-2"><label>Address</label><input value={form.address || ""} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          <div className="span-2"><label>Notes</label><textarea value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          <div className="span-2"><button type="submit">Save</button></div>
        </form>
      ) : (
        <div className="card">
          <p><strong>Phone:</strong> {customer.phone || "—"}</p>
          <p><strong>Email:</strong> {customer.email || "—"}</p>
          <p><strong>ID number:</strong> {customer.idNumber || "—"}</p>
          <p><strong>Address:</strong> {customer.address || "—"}</p>
          {customer.notes && <p><strong>Notes:</strong> {customer.notes}</p>}
        </div>
      )}

      <div className="page-header">
        <h2>Loans</h2>
        <button onClick={() => setShowLoanForm((s) => !s)}>{showLoanForm ? "Cancel" : "+ New loan"}</button>
      </div>

      {showLoanForm && (
        <form className="card form-grid" onSubmit={addLoan}>
          <div><label>Principal (R) *</label><input required type="number" min="1" step="0.01" value={loanForm.principal} onChange={(e) => setLoanForm({ ...loanForm, principal: e.target.value })} /></div>
          <div><label>Interest rate % (blank = default)</label><input type="number" step="0.1" value={loanForm.interestRate} onChange={(e) => setLoanForm({ ...loanForm, interestRate: e.target.value })} placeholder="30" /></div>
          <div><label>Period days (blank = default)</label><input type="number" value={loanForm.periodDays} onChange={(e) => setLoanForm({ ...loanForm, periodDays: e.target.value })} placeholder="30" /></div>
          <div><label>Start date (blank = today)</label><input type="date" value={loanForm.startDate} onChange={(e) => setLoanForm({ ...loanForm, startDate: e.target.value })} /></div>
          <div className="span-2"><label>Notes</label><input value={loanForm.notes} onChange={(e) => setLoanForm({ ...loanForm, notes: e.target.value })} /></div>
          <div className="span-2"><button type="submit">Create loan</button></div>
        </form>
      )}

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr><th>Started</th><th>Principal</th><th>Balance due</th><th>Due date</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {customer.loans.map((loan) => (
              <tr key={loan.id}>
                <td>{new Date(loan.startDate).toLocaleDateString()}</td>
                <td>{money(loan.principal)}</td>
                <td>{money(loan.balanceInfo.balance)}</td>
                <td>{new Date(loan.balanceInfo.dueDate).toLocaleDateString()}</td>
                <td><LoanStatusBadge loan={loan} /></td>
                <td><Link to={`/loans/${loan.id}`}>Open</Link></td>
              </tr>
            ))}
            {customer.loans.length === 0 && <tr><td colSpan={6} className="muted">No loans yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
