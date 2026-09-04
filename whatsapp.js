const DEFAULT_WHATSAPP_NUMBER = "256750210886";
export const WHATSAPP_MESSAGE = "Hello BloomCare Pharmacy, I would like to make an inquiry.";

export function normalizeWhatsAppPhone(value, countryCode = "256") {
  const digits = String(value ?? "").trim().replace(/[^0-9]/g, "");
  if (!digits) return "";
  if (digits.startsWith(countryCode)) return digits;
  if (digits.startsWith("0")) return countryCode + digits.slice(1);
  return digits;
}

export function validateWhatsAppPhone(value, countryCode = "256") {
  const phone = normalizeWhatsAppPhone(value, countryCode);
  return { valid: new RegExp(`^${countryCode}7[0-9]{8}$`).test(phone), value: phone, message: "Enter a valid phone number with a country code." };
}

export function createWhatsAppUrl(phone, message = null) {
  const validation = validateWhatsAppPhone(phone);
  if (!validation.valid) return "";
  const msg = message !== null ? message : WHATSAPP_MESSAGE;
  return msg ? `https://wa.me/${validation.value}?text=${encodeURIComponent(msg)}` : `https://wa.me/${validation.value}`;
}

export function getConfiguredWhatsAppNumber(settings = {}) {
  const validation = validateWhatsAppPhone(settings.whatsapp || settings.whatsappBusinessNumber || DEFAULT_WHATSAPP_NUMBER);
  return validation.valid ? validation.value : DEFAULT_WHATSAPP_NUMBER;
}

