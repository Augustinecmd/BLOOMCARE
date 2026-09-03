// BloomCare Pharmacy Management System - Validators

export function normalizeUgandanPhone(value) {
  const phone = String(value || "").trim().replace(/[\s-]/g, "");
  if (/^\+2567\d{8}$/.test(phone)) return `0${phone.slice(4)}`;
  if (/^2567\d{8}$/.test(phone)) return `0${phone.slice(3)}`;
  return /^07\d{8}$/.test(phone) ? phone : null;
}

export function validateUgandanPhone(value) {
  const normalized = normalizeUgandanPhone(value);
  if (!normalized) {
    return {
      valid: false,
      message: "Enter a valid 10-digit Ugandan phone number (e.g. 0772 123 456, 0751 234 567, or +2567...)."
    };
  }
  return { valid: true, normalized };
}

export function validateEmail(email) {
  const raw = String(email || "").trim().toLowerCase();
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw);
  return {
    valid,
    message: valid ? "" : "Enter a valid email address (e.g. name@example.com)."
  };
}

export function validatePassword(password) {
  const raw = String(password || "");
  const hasMinLength = raw.length >= 8;
  const hasUpper = /[A-Z]/.test(raw);
  const hasLower = /[a-z]/.test(raw);
  const hasNumber = /[0-9]/.test(raw);
  const hasSpecial = /[^A-Za-z0-9]/.test(raw);

  const valid = hasMinLength && hasUpper && hasLower && hasNumber && hasSpecial;
  return {
    valid,
    message: valid
      ? ""
      : "Password must have at least 8 characters including uppercase, lowercase, a number, and a special character."
  };
}

export function validateName(name) {
  const raw = String(name || "").trim();
  const valid = /^[A-Za-zÀ-ÿ' -]{2,60}$/.test(raw);
  return {
    valid,
    message: valid ? "" : "Name must be between 2 and 60 characters and contain letters only."
  };
}

export function validateDateOfBirth(dateStr) {
  if (!dateStr) return { valid: false, message: "Date of birth is required." };
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return { valid: false, message: "Invalid date format." };
  const now = new Date();
  if (d > now) return { valid: false, message: "Date of birth cannot be in the future." };
  const age = (now - d) / (365.25 * 24 * 60 * 60 * 1000);
  if (age > 120) return { valid: false, message: "Please enter a valid birth year." };
  return { valid: true };
}

export function validateProduct(product) {
  if (!product || typeof product !== "object") return { valid: false, message: "Product data required." };
  if (!product.name || String(product.name).trim().length < 2) return { valid: false, message: "Product name must be at least 2 characters." };
  if (!product.category) return { valid: false, message: "Category is required." };
  const price = Number(product.price);
  if (isNaN(price) || price <= 0) return { valid: false, message: "Price must be greater than 0 UGX." };
  const stock = Number(product.stockQuantity ?? product.stock ?? 0);
  if (isNaN(stock) || stock < 0) return { valid: false, message: "Stock quantity cannot be negative." };
  return { valid: true };
}

export function validateOrder(order) {
  if (!order || typeof order !== "object") return { valid: false, message: "Order data required." };
  if (!order.customerName) return { valid: false, message: "Customer name is required." };
  const phoneRes = validateUgandanPhone(order.customerPhone || order.phone);
  if (!phoneRes.valid) return phoneRes;
  if (!order.deliveryAddress || String(order.deliveryAddress).trim().length < 3) {
    return { valid: false, message: "A delivery address or pickup location is required." };
  }
  if (!Array.isArray(order.items) || order.items.length === 0) {
    return { valid: false, message: "Cart cannot be empty when placing an order." };
  }
  return { valid: true };
}

export function validatePrescriptionFile(file) {
  if (!file) return { valid: false, message: "Please select a prescription document." };
  const fileName = file.name || "";
  const fileType = file.type || "";
  const isImage = fileType.startsWith("image/") || /\.(jpe?g|png|webp|gif|bmp)$/i.test(fileName);
  const isPdf = fileType === "application/pdf" || /\.pdf$/i.test(fileName);

  if (!isImage && !isPdf) {
    return { valid: false, message: "Unsupported file format. Please upload a JPG, PNG, WEBP image or PDF scan." };
  }
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size && file.size > maxSize) {
    return { valid: false, message: "File exceeds 10MB limit. Please choose a smaller file." };
  }
  return { valid: true, isImage, isPdf };
}

export function validatePrescription(prescription) {
  if (!prescription || typeof prescription !== "object") return { valid: false, message: "Prescription details required." };
  if (!prescription.customerId) return { valid: false, message: "Customer identification required." };
  if (!prescription.fileUrl && !prescription.notes && !prescription.medications && !prescription.fileName) {
    return { valid: false, message: "Provide a prescription file or doctor notes." };
  }
  return { valid: true };
}

export function validateConsultation(consultation) {
  if (!consultation || typeof consultation !== "object") return { valid: false, message: "Consultation details required." };
  if (!consultation.consultationType) return { valid: false, message: "Select a consultation type." };
  if (!consultation.pharmacist) return { valid: false, message: "Select a pharmacist." };
  if (!consultation.date) return { valid: false, message: "Consultation date is required." };
  if (!consultation.time) return { valid: false, message: "Consultation time is required." };
  const dateObj = new Date(consultation.date + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (isNaN(dateObj.getTime()) || dateObj < today) {
    return { valid: false, message: "Consultation date must be today or in the future." };
  }
  return { valid: true };
}

export function validateRefill(refill) {
  if (!refill || typeof refill !== "object") return { valid: false, message: "Refill details required." };
  if (!refill.medicineName) return { valid: false, message: "Medicine name is required for refill." };
  const qty = Number(refill.quantity || 1);
  if (isNaN(qty) || qty <= 0) return { valid: false, message: "Refill quantity must be at least 1." };
  return { valid: true };
}

export function validateStockAdjustment(adjustment) {
  if (!adjustment || typeof adjustment !== "object") return { valid: false, message: "Adjustment details required." };
  if (!adjustment.productId) return { valid: false, message: "Product ID required." };
  if (!["stock_in", "stock_out", "adjustment", "sale"].includes(adjustment.type)) {
    return { valid: false, message: "Invalid adjustment type." };
  }
  const qty = Number(adjustment.quantity);
  if (isNaN(qty) || qty <= 0) return { valid: false, message: "Quantity must be greater than 0." };
  return { valid: true };
}
