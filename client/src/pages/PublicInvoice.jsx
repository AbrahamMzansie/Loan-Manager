import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api";
import PageLoader from "../components/PageLoader";
import BusinessInvoiceDocument from "../components/BusinessInvoiceDocument";
import { generateBusinessInvoicePdf } from "../utils/generateBusinessInvoicePdf";

export default function PublicInvoice() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getPublicInvoice(token).then(setData).catch((e) => setError(e.message));
  }, [token]);

  if (error) return <div className="auth-screen"><div className="error-box">{error}</div></div>;
  if (!data) return <PageLoader />;

  async function downloadPdf() {
    await generateBusinessInvoicePdf({ company: data.company, invoice: data.invoice, total: data.total });
  }

  return (
    <div className="auth-screen">
      <div className="invoice">
        <div className="no-print page-header">
          <span />
          <button onClick={downloadPdf}>Download PDF</button>
        </div>
        <BusinessInvoiceDocument company={data.company} invoice={data.invoice} total={data.total} />
      </div>
    </div>
  );
}
