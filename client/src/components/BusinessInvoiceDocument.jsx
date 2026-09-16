function money(n) {
  return `R${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Shared layout for the itemized business-invoice feature (separate from
// the loan interest statement) - used by both the logged-in invoice page
// and the public (no-login) shared link, and mirrored by
// generateBusinessInvoicePdf.js to build the same content as a real PDF.
export default function BusinessInvoiceDocument({ company, invoice, total }) {
  const hasBanking = company.bankAccountHolder || company.bankAccountNumber || company.bankName || company.branchCode;

  return (
    <div className="invoice">
      <div className="invoice-header">
        <div className="invoice-header-brand">
          {company.logo && <img src={company.logo} alt="" className="invoice-logo" />}
          <h1 className="invoice-company-name">{company.name}</h1>
        </div>
        <div className="invoice-meta">
          <p className="invoice-number">INVOICE #{invoice.id}</p>
          <p className="invoice-date">{new Date(invoice.date).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="invoice-block">
        <p className="invoice-section-label">Billed to</p>
        <p className="invoice-customer-name">{invoice.customer.name}</p>
        {invoice.customer.phone && <p className="invoice-customer-line">{invoice.customer.phone}</p>}
        {invoice.customer.email && <p className="invoice-customer-line">{invoice.customer.email}</p>}
        {invoice.customer.address && <p className="invoice-customer-line">{invoice.customer.address}</p>}
      </div>

      <table className="invoice-items">
        <thead>
          <tr><th>Description</th><th className="amount-col">Amount</th></tr>
        </thead>
        <tbody>
          {invoice.items.map((item, i) => (
            <tr key={i}>
              <td>{item.description}</td>
              <td className="amount-col">{money(item.amount)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr><td>Total</td><td className="amount-col">{money(total)}</td></tr>
        </tfoot>
      </table>

      {invoice.notes && <p className="invoice-notes">{invoice.notes}</p>}

      {hasBanking && (
        <div className="invoice-banking">
          <p className="invoice-section-label">Banking details</p>
          {company.bankAccountHolder && <p><strong>Account holder:</strong> {company.bankAccountHolder}</p>}
          {company.bankAccountNumber && <p><strong>Account number:</strong> {company.bankAccountNumber}</p>}
          {company.bankName && <p><strong>Bank name:</strong> {company.bankName}</p>}
          {company.branchCode && <p><strong>Branch code:</strong> {company.branchCode}</p>}
        </div>
      )}
    </div>
  );
}

export { money };
