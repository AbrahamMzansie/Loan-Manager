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
      {company.logo && <img src={company.logo} alt="" style={{ maxHeight: 80, maxWidth: "100%", marginBottom: 12 }} />}
      <h1>{company.name}</h1>
      <p>Date: {new Date(invoice.date).toLocaleDateString()}</p>

      <div className="invoice-block">
        <strong>Billed to</strong>
        <p>{invoice.customer.name}</p>
        {invoice.customer.phone && <p>{invoice.customer.phone}</p>}
        {invoice.customer.email && <p>{invoice.customer.email}</p>}
        {invoice.customer.address && <p>{invoice.customer.address}</p>}
      </div>

      <table className="table">
        <tbody>
          {invoice.items.map((item, i) => (
            <tr key={i}>
              <td>[{i + 1}] {item.description}</td>
              <td>{money(item.amount)}</td>
            </tr>
          ))}
          <tr className="total-row"><td><strong>Total</strong></td><td><strong>{money(total)}</strong></td></tr>
        </tbody>
      </table>

      {invoice.notes && <p className="muted">{invoice.notes}</p>}

      {hasBanking && (
        <div className="invoice-block">
          <strong>Banking details</strong>
          {company.bankAccountHolder && <p>Account holder: {company.bankAccountHolder}</p>}
          {company.bankAccountNumber && <p>Account number: {company.bankAccountNumber}</p>}
          {company.bankName && <p>Bank name: {company.bankName}</p>}
          {company.branchCode && <p>Branch code: {company.branchCode}</p>}
        </div>
      )}
    </div>
  );
}

export { money };
