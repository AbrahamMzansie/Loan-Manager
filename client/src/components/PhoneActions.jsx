// South African numbers are normally stored in local format (leading 0).
// WhatsApp's wa.me links need the full international number instead.
function toWhatsAppNumber(phone) {
  const digits = (phone || "").replace(/\D/g, "");
  if (!digits) return null;
  return digits.startsWith("0") ? "27" + digits.slice(1) : digits;
}

export default function PhoneActions({ phone }) {
  if (!phone) return null;
  const waNumber = toWhatsAppNumber(phone);

  return (
    <span className="phone-actions" onClick={(e) => e.stopPropagation()}>
      <a href={`tel:${phone.replace(/\s+/g, "")}`} className="icon-btn" title="Call">📞</a>
      {waNumber && (
        <a
          href={`https://wa.me/${waNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          className="icon-btn"
          title="WhatsApp"
        >
          💬
        </a>
      )}
    </span>
  );
}
