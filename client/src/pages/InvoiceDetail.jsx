import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../api";
import PageLoader from "../components/PageLoader";
import BusinessInvoiceDocument from "../components/BusinessInvoiceDocument";
import { useToast } from "../components/Toast";
import { useConfirm } from "../components/Confirm";
import { generateBusinessInvoicePdf } from "../utils/generateBusinessInvoicePdf";
import { toWhatsAppNumber } from "../utils/phone";

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const toast = useToast();
  const confirmDialog = useConfirm();

  useEffect(() => {
    api.getInvoice(id).then(setInvoice).catch((e) => setError(e.message));
  }, [id]);

  if (error && !invoice) return <div className="error-box">{error}</div>;
  if (!invoice) return <PageLoader />;

  async function downloadPdf() {
    await generateBusinessInvoicePdf({ company: invoice.company, invoice, total: invoice.total });
  }

  async function sendViaWhatsApp() {
    if (sending) return;
    const waNumber = toWhatsAppNumber(invoice.customer.phone);
    if (!waNumber) {
      setError("This customer has no phone number on file.");
      return;
    }
    setError("");
    setSending(true);
    try {
      const { shareToken } = await api.shareInvoice(invoice.id);
      const link = `${window.location.origin}/#/invoice/public/${shareToken}`;
      const message = `Hi ${invoice.customer.name}, here's your invoice from ${invoice.company.name}: ${link}`;
      window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
      toast("WhatsApp opened with the invoice link.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  async function deleteInvoice() {
    if (deleting) return;
    if (!(await confirmDialog("Delete this invoice? This cannot be undone."))) return;
    setError("");
    setDeleting(true);
    try {
      await api.deleteInvoice(invoice.id);
      toast("Invoice deleted.");
      navigate(`/customers/${invoice.customerId}`);
    } catch (err) {
      setError(err.message);
      setDeleting(false);
    }
  }

  return (
    <div className="invoice">
      <div className="no-print page-header">
        <Link to={`/customers/${invoice.customerId}`}>&larr; Back to customer</Link>
        <div className="btn-row">
          <button onClick={downloadPdf}>Download PDF</button>
          <button onClick={sendViaWhatsApp} disabled={sending}>
            {sending && <span className="btn-spinner" />}{sending ? "Preparing..." : "Send via WhatsApp"}
          </button>
          <button className="btn-secondary" onClick={() => window.print()}>Print</button>
          <button className="btn-danger" onClick={deleteInvoice} disabled={deleting}>
            {deleting && <span className="btn-spinner" />}{deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>

      {error && <div className="error-box no-print">{error}</div>}

      <BusinessInvoiceDocument company={invoice.company} invoice={invoice} total={invoice.total} />
    </div>
  );
}
