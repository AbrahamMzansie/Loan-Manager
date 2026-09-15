// South African numbers are normally stored in local format (leading 0).
// WhatsApp's wa.me links need the full international number instead.
export function toWhatsAppNumber(phone) {
  const digits = (phone || "").replace(/\D/g, "");
  if (!digits) return null;
  return digits.startsWith("0") ? "27" + digits.slice(1) : digits;
}
