import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";

function money(n) {
  return `R${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", idNumber: "", notes: "" });
  const [error, setError] = useState("");

  function load(q) {
    api.listCustomers(q).then(setCustomers).catch((e) => setError(e.message));
  }

  useEffect(() => { load(); }, []);

  function onSearchSubmit(e) {
    e.preventDefault();
    load(search);
  }

  async function addCustomer(e) {
    e.preventDefault();
    setError("");
    try {
      const res = await api.createCustomer(form);
      setForm({ name: "", phone: "", email: "", address: "", idNumber: "", notes: "" });
      setShowForm(false);
      if (res.queued) {
        setError("You're offline — the new customer is queued and will be saved once you're back online.");
      }
      load(search);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Customers</h1>
        <button onClick={() => setShowForm((s) => !s)}>{showForm ? "Cancel" : "+ New customer"}</button>
      </div>

      {error && <div className="error-box">{error}</div>}

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
            <button type="submit">Save customer</button>
          </div>
        </form>
      )}

      <form className="search-bar" onSubmit={onSearchSubmit}>
        <input placeholder="Search by name, phone, email or ID..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <button type="submit">Search</button>
      </form>

      <table className="table">
        <thead>
          <tr><th>Name</th><th>Phone</th><th>Outstanding balance</th><th>Loans</th></tr>
        </thead>
        <tbody>
          {customers.map((c) => (
            <tr key={c.id}>
              <td><Link to={`/customers/${c.id}`}>{c.name}</Link></td>
              <td>{c.phone || "—"}</td>
              <td>{money(c.outstanding)}</td>
              <td>{c.loans.length}</td>
            </tr>
          ))}
          {customers.length === 0 && (
            <tr><td colSpan={4} className="muted">No customers yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
