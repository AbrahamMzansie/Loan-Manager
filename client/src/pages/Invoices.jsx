import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import PageLoader from "../components/PageLoader";

function money(n) {
  return `R${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.listInvoices().then(setInvoices).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1>Invoices</h1>
      <p className="muted">Itemized invoices for a side business, e.g. billing a customer for trips or services — separate from loan interest.</p>

      {error && <div className="error-box">{error}</div>}

      {loading ? (
        <PageLoader />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Customer</th><th>Date</th><th>Items</th><th>Total</th><th></th></tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td><Link to={`/customers/${inv.customerId}`}>{inv.customer.name}</Link></td>
                  <td>{new Date(inv.date).toLocaleDateString()}</td>
                  <td className="col-tight">{inv.items.length}</td>
                  <td>{money(inv.total)}</td>
                  <td><Link to={`/invoices/${inv.id}`}>Open</Link></td>
                </tr>
              ))}
              {invoices.length === 0 && <tr><td colSpan={5} className="muted">No invoices yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
