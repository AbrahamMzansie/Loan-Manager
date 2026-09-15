import { toWhatsAppNumber } from "../utils/phone";

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
