import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api";
import PageLoader from "../components/PageLoader";
import InvoiceDocument from "../components/InvoiceDocument";
import { generateInvoicePdf } from "../utils/generateInvoicePdf";

export default function PublicLoanStatement() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getPublicLoanStatement(token).then(setData).catch((e) => setError(e.message));
  }, [token]);

  if (error) return <div className="auth-screen"><div className="error-box">{error}</div></div>;
  if (!data) return <PageLoader />;

  function downloadPdf() {
    generateInvoicePdf({ businessName: data.businessName, loan: data.loan, balanceInfo: data.balanceInfo });
  }

  return (
    <div className="auth-screen">
      <div className="invoice">
        <div className="no-print page-header">
          <span />
          <button onClick={downloadPdf}>Download PDF</button>
        </div>
        <InvoiceDocument businessName={data.businessName} loan={data.loan} balanceInfo={data.balanceInfo} />
      </div>
    </div>
  );
}
