import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../api";
import LoanStatusBadge from "../components/LoanStatusBadge";
import { useToast } from "../components/Toast";
import { useConfirm } from "../components/Confirm";
import PageLoader from "../components/PageLoader";
import PhoneActions from "../components/PhoneActions";

function money(n) {
  return `R${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Mirrors server/src/utils/dueDateRule.js: a loan started on the 5th-25th is
// automatically due on the 5th of next month; 26th-4th needs a manual date.
function isAutoWindow(startDate) {
  const day = startDate.getDate();
  return day >= 5 && day <= 25;
}
function autoDueDate(startDate) {
  return new Date(startDate.getFullYear(), startDate.getMonth() + 1, 5);
}
function toDateInputValue(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [showLoanForm, setShowLoanForm] = useState(false);
  const [loanForm, setLoanForm] = useState({ principal: "", interestRate: "", startDate: "", dueDate: "", notes: "" });
  const [error, setError] = useState("");
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [addingLoan, setAddingLoan] = useState(false);
  const toast = useToast();
  const confirmDialog = useConfirm();

  function load() {
    api.getCustomer(id).then((c) => { setCustomer(c); setForm(c); }).catch((e) => setError(e.message));
  }

  useEffect(() => { load(); }, [id]);

  // Pre-fill the suggested due date whenever the loan form opens or the
  // start date changes, for starts in the 5th-25th auto window. Still
  // editable afterward — this is only a starting suggestion.
  useEffect(() => {
    if (!showLoanForm) return;
    const start = loanForm.startDate ? new Date(loanForm.startDate) : new Date();
    if (isAutoWindow(start)) {
      setLoanForm((f) => ({ ...f, dueDate: toDateInputValue(autoDueDate(start)) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showLoanForm, loanForm.startDate]);

  async function saveCustomer(e) {
    e.preventDefault();
    if (savingCustomer) return;
    setError("");
    setSavingCustomer(true);
    try {
      await api.updateCustomer(id, form);
      setEditing(false);
      toast("Customer updated.");
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingCustomer(false);
    }
  }

  async function addLoan(e) {
    e.preventDefault();
    if (addingLoan) return;
    setError("");
    setAddingLoan(true);
    try {
      const payload = {
        customerId: Number(id),
        principal: Number(loanForm.principal),
        interestRate: loanForm.interestRate ? Number(loanForm.interestRate) / 100 : undefined,
        startDate: loanForm.startDate || undefined,
        dueDate: loanForm.dueDate || undefined,
        notes: loanForm.notes,
      };
      const res = await api.createLoan(payload);
      setLoanForm({ principal: "", interestRate: "", startDate: "", dueDate: "", notes: "" });
      setShowLoanForm(false);
      if (res.queued) {
        toast("Offline — loan queued, will sync once back online.", "info");
      } else {
        toast("Loan created.");
      }
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setAddingLoan(false);
    }
  }

  async function deleteCustomer() {
    if (deleting) return;
    if (!(await confirmDialog("Delete this customer? This only works if they have no loan history."))) return;
    setError("");
    setDeleting(true);
    try {
      await api.deleteCustomer(id);
      toast("Customer deleted.");
      navigate("/customers");
    } catch (err) {
      setError(err.message);
      setDeleting(false);
    }
  }

  if (error && !customer) return <div className="error-box">{error}</div>;
  if (!customer) return <PageLoader />;

  return (
    <div>
      <p><Link to="/customers">&larr; All customers</Link></p>
      <div className="page-header">
        <h1>{customer.name}</h1>
        <div className="btn-row">
          <button onClick={() => setEditing((s) => !s)} disabled={deleting}>{editing ? "Cancel" : "Edit"}</button>
          <button className="btn-danger" onClick={deleteCustomer} disabled={deleting}>
            {deleting && <span className="btn-spinner" />}{deleting ? "Deleting..." : "Delete"}
          </button>
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
          <div className="span-2">
            <button type="submit" disabled={savingCustomer}>{savingCustomer && <span className="btn-spinner" />}{savingCustomer ? "Saving..." : "Save"}</button>
          </div>
        </form>
      ) : (
        <div className="card">
          <p><strong>Phone:</strong> {customer.phone || "—"}<PhoneActions phone={customer.phone} /></p>
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

      {showLoanForm && (() => {
        const effectiveStart = loanForm.startDate ? new Date(loanForm.startDate) : new Date();
        const auto = isAutoWindow(effectiveStart);
        return (
          <form className="card form-grid" onSubmit={addLoan}>
            <div><label>Principal (R) *</label><input required type="number" min="1" step="0.01" value={loanForm.principal} onChange={(e) => setLoanForm({ ...loanForm, principal: e.target.value })} /></div>
            <div><label>Interest rate % (blank = default)</label><input type="number" step="0.1" value={loanForm.interestRate} onChange={(e) => setLoanForm({ ...loanForm, interestRate: e.target.value })} placeholder="30" /></div>
            <div><label>Start date (blank = today)</label><input type="date" value={loanForm.startDate} onChange={(e) => setLoanForm({ ...loanForm, startDate: e.target.value })} /></div>
            <div>
              <label>{auto ? "Due date * (suggested — edit if needed)" : "Due date * (manual — started 26th-4th)"}</label>
              <input
                required
                type="date"
                value={loanForm.dueDate}
                onChange={(e) => setLoanForm({ ...loanForm, dueDate: e.target.value })}
              />
            </div>
            <div className="span-2"><label>Notes</label><input value={loanForm.notes} onChange={(e) => setLoanForm({ ...loanForm, notes: e.target.value })} /></div>
            <div className="span-2">
              <button type="submit" disabled={addingLoan}>{addingLoan && <span className="btn-spinner" />}{addingLoan ? "Creating..." : "Create loan"}</button>
            </div>
          </form>
        );
      })()}

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
