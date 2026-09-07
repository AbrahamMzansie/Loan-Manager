import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useToast } from "../components/Toast";
import PageLoader from "../components/PageLoader";

function money(n) {
  return `R${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", idNumber: "", notes: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [duplicates, setDuplicates] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  function load(q) {
    setLoading(true);
    api.listCustomers(q).then(setCustomers).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function onSearchSubmit(e) {
    e.preventDefault();
    load(search);
  }

  async function addCustomer(e) {
    e.preventDefault();
    if (submitting) return;
    setError("");
    setDuplicates(null);
    setSubmitting(true);
    try {
      const res = await api.createCustomer(form);
      finishAdd(res);
    } catch (err) {
      if (err.status === 409 && err.data?.duplicates?.length) {
        setDuplicates(err.data.duplicates);
      } else {
        setError(err.message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function saveAnyway() {
    if (submitting) return;
    setError("");
    setSubmitting(true);
    try {
      const res = await api.createCustomer({ ...form, force: true });
      setDuplicates(null);
      finishAdd(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function finishAdd(res) {
    setForm({ name: "", phone: "", email: "", address: "", idNumber: "", notes: "" });
    setShowForm(false);
    if (res.queued) {
      toast("Offline — customer queued, will sync once back online.", "info");
    } else {
      toast("Customer added.");
    }
    load(search);
  }

  return (
    <div>
      <div className="page-header">
        <h1>Customers</h1>
        <button onClick={() => setShowForm((s) => !s)}>{showForm ? "Cancel" : "+ New customer"}</button>
      </div>

      {error && <div className="error-box">{error}</div>}

      {duplicates && (
        <div className="card" style={{ borderColor: "var(--amber)" }}>
          <p><strong>This looks like it might already be an existing customer:</strong></p>
          <ul>
            {duplicates.map((d) => (
              <li key={d.customer.id}>
                <Link to={`/customers/${d.customer.id}`}>{d.customer.name}</Link>
                {d.customer.phone && ` — ${d.customer.phone}`}
                {d.customer.idNumber && ` — ID ${d.customer.idNumber}`}
                {" "}<span className="muted small">({d.reasons.join(", ")})</span>
              </li>
            ))}
          </ul>
          <button onClick={saveAnyway} disabled={submitting}>
            {submitting && <span className="btn-spinner" />}{submitting ? "Saving..." : "Save anyway, it's a different person"}
          </button>{" "}
          <button type="button" className="btn-secondary" onClick={() => setDuplicates(null)} disabled={submitting}>Cancel</button>
        </div>
      )}

      {showForm && (
        <form className="card form-grid" onSubmit={addCustomer}>
          <div>
            <label>Full name *</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label>Phone</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label>Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label>ID number</label>
            <input value={form.idNumber} onChange={(e) => setForm({ ...form, idNumber: e.target.value })} />
          </div>
          <div className="span-2">
            <label>Address</label>
            <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div className="span-2">
            <label>Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="span-2">
            <button type="submit" disabled={submitting}>{submitting && <span className="btn-spinner" />}{submitting ? "Saving..." : "Save customer"}</button>
          </div>
        </form>
      )}

      <form className="search-bar" onSubmit={onSearchSubmit}>
        <input placeholder="Search by name, phone, email or ID..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <button type="submit">Search</button>
      </form>

      {loading ? (
        <PageLoader />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Name</th><th className="col-tight">Loans</th><th>Outstanding balance</th><th>Phone</th></tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id}>
                  <td><Link to={`/customers/${c.id}`}>{c.name}</Link></td>
                  <td className="col-tight">{c.loans.length}</td>
                  <td>{money(c.outstanding)}</td>
                  <td>{c.phone || "—"}</td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr><td colSpan={4} className="muted">No customers yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
