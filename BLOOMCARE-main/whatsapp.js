const DEFAULT_WHATSAPP_NUMBER = "256741592069";
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

export function createWhatsAppUrl(phone, message = WHATSAPP_MESSAGE) {
  const validation = validateWhatsAppPhone(phone);
  return validation.valid ? `https://wa.me/${validation.value}?text=${encodeURIComponent(message)}` : "";
}

export function getConfiguredWhatsAppNumber(settings = {}) {
  const validation = validateWhatsAppPhone(settings.whatsappBusinessNumber || DEFAULT_WHATSAPP_NUMBER);
  return validation.valid ? validation.value : DEFAULT_WHATSAPP_NUMBER;
}