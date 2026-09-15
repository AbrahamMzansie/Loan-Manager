import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api";
import PageLoader from "../components/PageLoader";
import InvoiceDocument from "../components/InvoiceDocument";
import { useToast } from "../components/Toast";
import { generateInvoicePdf } from "../utils/generateInvoicePdf";
import { toWhatsAppNumber } from "../utils/phone";

export default function Invoice() {
  const { id } = useParams();
  const [loan, setLoan] = useState(null);
  const [settings, setSettings] = useState(null);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const toast = useToast();

  useEffect(() => {
    Promise.all([api.getLoan(id), api.getSettings()])
      .then(([l, s]) => { setLoan(l); setSettings(s); })
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) return <div className="error-box">{error}</div>;
  if (!loan || !settings) return <PageLoader />;

  function downloadPdf() {
    generateInvoicePdf({ businessName: settings.businessName, loan, balanceInfo: loan.balanceInfo });
  }

  async function sendViaWhatsApp() {
    if (sending) return;
    const waNumber = toWhatsAppNumber(loan.customer.phone);
    if (!waNumber) {
      setError("This customer has no phone number on file.");
      return;
    }
    setError("");
    setSending(true);
    try {
      const { shareToken } = await api.shareLoanInvoice(loan.id);
      const link = `${window.location.origin}/#/invoice/public/${shareToken}`;
      const message = `Hi ${loan.customer.name}, here's your loan statement from ${settings.businessName}: ${link}`;
      window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
      toast("WhatsApp opened with the invoice link.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="invoice">
      <div className="no-print page-header">
        <Link to={`/loans/${loan.id}`}>&larr; Back to loan</Link>
        <div className="btn-row">
          <button onClick={downloadPdf}>Download PDF</button>
          <button onClick={sendViaWhatsApp} disabled={sending}>
            {sending && <span className="btn-spinner" />}{sending ? "Preparing..." : "Send via WhatsApp"}
          </button>
          <button className="btn-secondary" onClick={() => window.print()}>Print</button>
        </div>
      </div>

      {error && <div className="error-box no-print">{error}</div>}

      <InvoiceDocument businessName={settings.businessName} loan={loan} balanceInfo={loan.balanceInfo} />
    </div>
  );
}
