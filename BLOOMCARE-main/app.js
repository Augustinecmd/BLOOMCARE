// BloomCare Pharmacy - Complete Digital Pharmacy Ecosystem Controller
// Core Features: Marketplace, Rx Verification, Consultations, Refills, Stock & Expiry Control, Order Tracking, Role Dashboards
import {
  signUpUser,
  signInUser,
  signOutUser,
  subscribeAuthState,
  getClientProfile,
  updateClientProfile,
  getAllUsers,
  saveUser,
  updateUserRole,
  toggleUserStatus,
  getProducts,
  getProductById,
  saveProduct,
  updateProductStock,
  getCategories,
  saveCategory,
  createOrder,
  getOrders,
  updateOrderAssignment,
  isPaidOrder,
  getPaidOrdersForPeriod,
  updateOrderStatus,
  submitPrescription,
  getPrescriptions,
  bookConsultation,
  getConsultations,
  updateConsultationStatus,
  getRefills,
  updateRefillStatus,
  createDelivery,
  getDeliveries,
  createPaymentRecord,
  getPayments,
  getInventoryLogs,
  getNotifications,
  createNotification,
  markNotificationRead,
  requestPasswordReset,
  getSystemSettings,
  updateSystemSettings,
  getOrCreateDeliveryConversation,
  subscribeToDeliveryMessages,
  sendDeliveryChatMessage,
  markDeliveryMessagesRead,
  getDeliveryConversationsForUser,
  getDesignatedDeliveryDriver,
  subscribeCustomerOrders,
  subscribeDeliveryOrders,
  subscribeUserNotifications,
  subscribeOrderById,
  saveUserCartToFirestore,
  getUserCartFromFirestore,
  saveUserWishlistToFirestore,
  getUserWishlistFromFirestore,
  saveUserAddressesToFirestore,
  getUserAddressesFromFirestore,
  saveProductReviewToFirestore,
  getProductReviewsFromFirestore
} from "./firebase.js";
import { UGANDA_PHARMACY_CATALOG } from "./data/medicines-catalog.js";
import { createWhatsAppUrl, normalizeWhatsAppPhone } from "./whatsapp.js";
import {
  normalizeUgandanPhone,
  validateUgandanPhone,
  validateProviderPhone,
  UGANDA_CARRIER_PREFIXES,
  validateEmail,
  validatePassword,
  validateName,
  validateCustomerDemoPassword,
  validateCustomerPassword,
  PASSWORD_POLICY
} from "../validators.js";
import {
  BLOOMCARE_PHARMACY_NAME,
  BLOOMCARE_PHARMACY_LOCATION,
  BLOOMCARE_PHONE,
  BLOOMCARE_CENTRAL_LOCATION,
  MBARARA_DIVISIONS,
  MBARARA_DELIVERY_AREAS,
  getMbararaDivisions,
  getMbararaAreas,
  isValidMbararaDivision,
  isValidMbararaArea,
  searchMbararaLocations,
  formatDeliveryAddress,
  validateMbararaDeliveryAddress
} from "./mbarara-delivery-areas.js";
import {
  getRecommendedProducts,
  getTrendingProducts,
  getFrequentlyPurchased,
  getPopularProducts,
  getFrequentlyBoughtTogether,
  getTopCoPurchaseBundle,
  updateRecommendationStatsOnOrder,
  getRecommendationAdminAnalytics,
  renderFrequentlyBoughtTogetherHtml,
  calculateProductPurchaseStats,
  calculateRecommendationScores,
  isProductEligibleForRecommendation,
  isValidCompletedOrder
} from "./recommendation-service.js";
import {
  initBloomCareChatbot,
  openBloomCareChatbot,
  closeBloomCareChatbot,
  sendMessageToBloomCareAI
} from "./chatbot.js";

export {
  isPaidOrder,
  getPaidOrdersForPeriod,
  BLOOMCARE_CENTRAL_LOCATION,
  MBARARA_DIVISIONS,
  MBARARA_DELIVERY_AREAS,
  getMbararaDivisions,
  getMbararaAreas,
  isValidMbararaDivision,
  isValidMbararaArea,
  searchMbararaLocations,
  formatDeliveryAddress,
  validateMbararaDeliveryAddress,
  getRecommendedProducts,
  getTrendingProducts,
  getFrequentlyPurchased,
  getPopularProducts,
  getFrequentlyBoughtTogether,
  getTopCoPurchaseBundle,
  updateRecommendationStatsOnOrder,
  getRecommendationAdminAnalytics,
  renderFrequentlyBoughtTogetherHtml,
  calculateProductPurchaseStats,
  calculateRecommendationScores,
  isProductEligibleForRecommendation,
  isValidCompletedOrder,
  renderAdminRecommendationsSection,
  renderAdminAiAnalyticsSection,
  showToast,
  initBloomCareChatbot,
  openBloomCareChatbot,
  closeBloomCareChatbot,
  sendMessageToBloomCareAI
};

// DOM Utility
const $ = (selector) => (typeof document !== "undefined" ? document.querySelector(selector) : null);
const $$ = (selector) => (typeof document !== "undefined" ? Array.from(document.querySelectorAll(selector)) : []);

// -------------------------------------------------------------
// 1. PROFESSIONAL SVG VECTOR ICONS (ZERO EMOJIS)
// -------------------------------------------------------------
export const ICONS = {
  dashboard: `<svg class="svg-icon" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>`,
  medicines: `<svg class="svg-icon" viewBox="0 0 24 24"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>`,
  categories: `<svg class="svg-icon" viewBox="0 0 24 24"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>`,
  prescriptions: `<svg class="svg-icon" viewBox="0 0 24 24"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M9 12h6"/><path d="M12 9v6"/></svg>`,
  consultations: `<svg class="svg-icon" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></svg>`,
  refills: `<svg class="svg-icon" viewBox="0 0 24 24"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>`,
  orders: `<svg class="svg-icon" viewBox="0 0 24 24"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>`,
  inventory: `<svg class="svg-icon" viewBox="0 0 24 24"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>`,
  customers: `<svg class="svg-icon" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  users: `<svg class="svg-icon" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  deliveries: `<svg class="svg-icon" viewBox="0 0 24 24"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.24-4.05a1 1 0 0 0-.78-.37H14v10"/><circle cx="17" cy="18.5" r="2.5"/><circle cx="6.5" cy="18.5" r="2.5"/></svg>`,
  payments: `<svg class="svg-icon" viewBox="0 0 24 24"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>`,
  reports: `<svg class="svg-icon" viewBox="0 0 24 24"><line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/></svg>`,
  notifications: `<svg class="svg-icon" viewBox="0 0 24 24"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>`,
  settings: `<svg class="svg-icon" viewBox="0 0 24 24"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>`,
  profile: `<svg class="svg-icon" viewBox="0 0 24 24"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>`,
  logout: `<svg class="svg-icon" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>`,
  search: `<svg class="svg-icon" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`,
  phone: `<svg class="svg-icon" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
  email: `<svg class="svg-icon" viewBox="0 0 24 24"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`,
  location: `<svg class="svg-icon" viewBox="0 0 24 24"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`,
  about: `<svg class="svg-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`,
  contact: `<svg class="svg-icon" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  check: `<svg class="svg-icon" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>`,
  shield: `<svg class="svg-icon" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  cart: `<svg class="svg-icon" viewBox="0 0 24 24"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>`,
  chat: `<svg class="svg-icon" viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>`,
  send: `<svg class="svg-icon" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`
};

// -------------------------------------------------------------
// 2. 15 PHARMACY HEALTH DEPARTMENTS
// -------------------------------------------------------------
const ESSENTIAL_CATEGORIES = [
  { id: "cat-pain", name: "Pain Relief", iconKey: "medicines", desc: "Headache, body pain, fever, joint and muscle relief.", productCount: 49, status: "active", imageUrl: "categories/pain-relief.svg" },
  { id: "cat-cold", name: "Cold & Flu", iconKey: "medicines", desc: "Cough syrups, decongestants, antibiotics and lozenges.", productCount: 47, status: "active", imageUrl: "categories/cold-flu.svg" },
  { id: "cat-vitamins", name: "Vitamins & Supplements", iconKey: "prescriptions", desc: "Immunity boosters, minerals and daily multivitamins.", productCount: 51, status: "active", imageUrl: "categories/vitamins-supplements.svg" },
  { id: "cat-digestive", name: "Digestive Health", iconKey: "medicines", desc: "Antacids, ORS hydration, laxatives and probiotics.", productCount: 49, status: "active", imageUrl: "categories/digestive-health.svg" },
  { id: "cat-firstaid", name: "First Aid", iconKey: "shield", desc: "Antiseptics, bandages, surgical gauze and emergency kits.", productCount: 48, status: "active", imageUrl: "categories/first-aid.svg" },
  { id: "cat-skin", name: "Skin Care", iconKey: "prescriptions", desc: "Medicated lotions, moisturizing creams and ointments.", productCount: 51, status: "active", imageUrl: "categories/skin-care.svg" },
  { id: "cat-personal", name: "Personal Care", iconKey: "prescriptions", desc: "Sanitizers, oral hygiene and daily personal care.", productCount: 52, status: "active", imageUrl: "categories/personal-care.svg" },
  { id: "cat-baby", name: "Baby & Child Care", iconKey: "customers", desc: "Pediatric syrups, infant drops and baby supplements.", productCount: 48, status: "active", imageUrl: "categories/baby-child-care.svg" },
  { id: "cat-maternal", name: "Maternal Health", iconKey: "prescriptions", desc: "Folic acid, prenatal multivitamins and calcium supplements.", productCount: 51, status: "active", imageUrl: "categories/maternal-health.svg" },
  { id: "cat-chronic", name: "Chronic Care", iconKey: "medicines", desc: "Blood pressure, heart and cardiovascular medications.", productCount: 52, status: "active", imageUrl: "categories/chronic-care.svg" },
  { id: "cat-diabetes", name: "Diabetes Care", iconKey: "medicines", desc: "Glucose control, test strips and diabetic care.", productCount: 52, status: "active", imageUrl: "categories/diabetes-care.svg" },
  { id: "cat-respiratory", name: "Respiratory Care", iconKey: "medicines", desc: "Salbutamol inhalers, nebulizer solutions and respiratory therapy.", productCount: 48, status: "active", imageUrl: "categories/respiratory-care.svg" },
  { id: "cat-allergy", name: "Allergy Care", iconKey: "medicines", desc: "Antihistamines, eye drops and non-drowsy allergy relief.", productCount: 51, status: "active", imageUrl: "categories/allergy-care.svg" },
  { id: "cat-devices", name: "Medical Devices", iconKey: "inventory", desc: "Digital thermometers, BP monitors, oximeters and lancets.", productCount: 48, status: "active", imageUrl: "categories/medical-devices.svg" },
  { id: "cat-wellness", name: "Wellness Products", iconKey: "shield", desc: "Nutritional shakes, dietary minerals and wellness essentials.", productCount: 52, status: "active", imageUrl: "categories/wellness-products.svg" }
];

export const DEFAULT_CATEGORY_IMAGES = {
  "all": "categories/all-medicines.svg",
  "all medicines": "categories/all-medicines.svg",
  "pain relief": "categories/pain-relief.svg",
  "cat-pain": "categories/pain-relief.svg",
  "cold & flu": "categories/cold-flu.svg",
  "cat-cold": "categories/cold-flu.svg",
  "vitamins & supplements": "categories/vitamins-supplements.svg",
  "cat-vitamins": "categories/vitamins-supplements.svg",
  "digestive health": "categories/digestive-health.svg",
  "cat-digestive": "categories/digestive-health.svg",
  "first aid": "categories/first-aid.svg",
  "cat-firstaid": "categories/first-aid.svg",
  "skin care": "categories/skin-care.svg",
  "cat-skin": "categories/skin-care.svg",
  "personal care": "categories/personal-care.svg",
  "cat-personal": "categories/personal-care.svg",
  "baby & child care": "categories/baby-child-care.svg",
  "cat-baby": "categories/baby-child-care.svg",
  "maternal health": "categories/maternal-health.svg",
  "cat-maternal": "categories/maternal-health.svg",
  "chronic care": "categories/chronic-care.svg",
  "cat-chronic": "categories/chronic-care.svg",
  "diabetes care": "categories/diabetes-care.svg",
  "cat-diabetes": "categories/diabetes-care.svg",
  "respiratory care": "categories/respiratory-care.svg",
  "cat-respiratory": "categories/respiratory-care.svg",
  "allergy care": "categories/allergy-care.svg",
  "cat-allergy": "categories/allergy-care.svg",
  "medical devices": "categories/medical-devices.svg",
  "cat-devices": "categories/medical-devices.svg",
  "wellness products": "categories/wellness-products.svg",
  "cat-wellness": "categories/wellness-products.svg"
};

export function getCategoryImageUrl(cat) {
  if (!cat) return "categories/all-medicines.svg";
  if (typeof cat === "string") {
    const key = cat.toLowerCase().trim();
    return DEFAULT_CATEGORY_IMAGES[key] || "categories/all-medicines.svg";
  }
  if (cat.imageUrl) return cat.imageUrl;
  const nameKey = (cat.name || "").toLowerCase().trim();
  const idKey = (cat.id || "").toLowerCase().trim();
  return DEFAULT_CATEGORY_IMAGES[idKey] || DEFAULT_CATEGORY_IMAGES[nameKey] || "categories/all-medicines.svg";
}


// Product Catalog (Demonstration Medicine Catalog with All 14 Required Structured Fields)
const INITIAL_MEDICINES = [
  {"id":"DEMO-MED-001","name":"Paracetamol 500mg Tablets","genericName":"Paracetamol","strength":"500mg","dosageForm":"Pack of 20 Tablets","category":"Pain Relief","price":5000,"stockQuantity":150,"reorderLevel":20,"requiresPrescription":false,"status":"active","description":"[DEMONSTRATION TEST DATA] Fast-acting analgesic and antipyretic for mild to moderate headache, muscle pain, and fever reduction.","manufacturer":"GSK Consumer Healthcare","batchNumber":"DEMO-2026-PA50","expiryDate":"2028-08-31","imageUrl":"products/paracetamol-500mg.webp","sku":"BC-SKU-0001","brandName":"Paracetamol","activeIngredients":"Paracetamol","subcategory":"Pain Relief","packSize":"Pack of 20 Tablets","createdAt":"2024-01-15T08:00:00.000Z","updatedAt":"2024-09-01T12:00:00.000Z","sellingPrice":5000,"costPrice":3200,"currency":"UGX","priceSource":"Uganda community pharmacy market reference (Kampala retail survey & EMHSLU 2023)","priceLastUpdated":"2026-09-05","priceNotes":"Retail market reference price for Pack of 20 Tablets aligned with EMHSLU 2023 formulation standards.","priceHistory":[{"previousPrice":5000,"newPrice":5000,"costPrice":3200,"changedBy":"Uganda Market Reference Baseline","date":"2026-09-05","reason":"Initial community pharmacy retail market review and EMHSLU 2023 alignment"}]},
  {"id":"DEMO-MED-002","name":"Ibuprofen 400mg Tablets","genericName":"Ibuprofen","strength":"400mg","dosageForm":"Pack of 20 Tablets","category":"Pain Relief","price":8000,"stockQuantity":95,"reorderLevel":15,"requiresPrescription":false,"status":"active","description":"[DEMONSTRATION TEST DATA] Non-steroidal anti-inflammatory drug (NSAID) for dental pain, backache, and inflammatory joint stiffness.","manufacturer":"Abbott Laboratories","batchNumber":"DEMO-2026-IB40","expiryDate":"2028-11-30","imageUrl":"products/ibuprofen-400mg.webp","sku":"BC-SKU-0002","brandName":"Ibuprofen","activeIngredients":"Ibuprofen","subcategory":"Pain Relief","packSize":"Pack of 20 Tablets","createdAt":"2024-01-15T08:00:00.000Z","updatedAt":"2024-09-01T12:00:00.000Z","sellingPrice":8000,"costPrice":5200,"currency":"UGX","priceSource":"Uganda community pharmacy market reference (Kampala retail survey & EMHSLU 2023)","priceLastUpdated":"2026-09-05","priceNotes":"Retail market reference price for Pack of 20 Tablets aligned with EMHSLU 2023 formulation standards.","priceHistory":[{"previousPrice":8000,"newPrice":8000,"costPrice":5200,"changedBy":"Uganda Market Reference Baseline","date":"2026-09-05","reason":"Initial community pharmacy retail market review and EMHSLU 2023 alignment"}]},
  {"id":"DEMO-MED-003","name":"Diclofenac 50mg Tablets","genericName":"Diclofenac Sodium","strength":"50mg","dosageForm":"Pack of 20 Tablets","category":"Pain Relief","price":12000,"stockQuantity":60,"reorderLevel":12,"requiresPrescription":true,"status":"active","description":"[DEMONSTRATION TEST DATA] Potent targeted anti-inflammatory analgesic for acute musculoskeletal strain and arthritis.","manufacturer":"Novartis","batchNumber":"DEMO-2026-DC50","expiryDate":"2028-04-15","imageUrl":"products/diclofenac-50mg.webp","sku":"BC-SKU-0003","brandName":"Diclofenac","activeIngredients":"Diclofenac Sodium","subcategory":"Pain Relief","packSize":"Pack of 20 Tablets","createdAt":"2024-01-15T08:00:00.000Z","updatedAt":"2024-09-01T12:00:00.000Z","sellingPrice":12000,"costPrice":8000,"currency":"UGX","priceSource":"Uganda community pharmacy market reference (Kampala retail survey & EMHSLU 2023)","priceLastUpdated":"2026-09-05","priceNotes":"Retail market reference price for Pack of 20 Tablets aligned with EMHSLU 2023 formulation standards.","priceHistory":[{"previousPrice":12000,"newPrice":12000,"costPrice":8000,"changedBy":"Uganda Market Reference Baseline","date":"2026-09-05","reason":"Initial community pharmacy retail market review and EMHSLU 2023 alignment"}]},
  {"id":"DEMO-MED-026","name":"Tramadol Capsules 50mg","genericName":"Tramadol Hydrochloride","strength":"50mg","dosageForm":"Pack of 10 Capsules","category":"Pain Relief","price":18000,"stockQuantity":30,"reorderLevel":10,"requiresPrescription":true,"status":"active","description":"[DEMONSTRATION TEST DATA] Centrally acting opioid analgesic for moderate to severe postoperative pain management.","manufacturer":"Grunenthal Pharma","batchNumber":"DEMO-2026-TR50","expiryDate":"2027-11-20","imageUrl":"products/tramadol-50mg.webp","sku":"BC-SKU-0004","brandName":"Tramadol","activeIngredients":"Tramadol Hydrochloride","subcategory":"Pain Relief","packSize":"Pack of 10 Capsules","createdAt":"2024-01-15T08:00:00.000Z","updatedAt":"2024-09-01T12:00:00.000Z","sellingPrice":18000,"costPrice":12000,"currency":"UGX","priceSource":"Uganda community pharmacy market reference (Kampala retail survey & EMHSLU 2023)","priceLastUpdated":"2026-09-05","priceNotes":"Retail market reference price for Pack of 10 Capsules aligned with EMHSLU 2023 formulation standards.","priceHistory":[{"previousPrice":18000,"newPrice":18000,"costPrice":12000,"changedBy":"Uganda Market Reference Baseline","date":"2026-09-05","reason":"Initial community pharmacy retail market review and EMHSLU 2023 alignment"}]},
  {"id":"DEMO-MED-004","name":"Amoxicillin 500mg Capsules","genericName":"Amoxicillin Trihydrate","strength":"500mg","dosageForm":"Pack of 20 Capsules","category":"Cold & Flu","price":18000,"stockQuantity":45,"reorderLevel":10,"requiresPrescription":true,"status":"active","description":"[DEMONSTRATION TEST DATA] Broad-spectrum penicillin antibiotic for bacterial respiratory tract, ENT, and dental infections.","manufacturer":"Medreich Laboratories","batchNumber":"DEMO-2026-AM50","expiryDate":"2027-10-15","imageUrl":"products/amoxicillin-500mg.webp","sku":"BC-SKU-0005","brandName":"Amoxicillin","activeIngredients":"Amoxicillin Trihydrate","subcategory":"Cold & Flu","packSize":"Pack of 20 Capsules","createdAt":"2024-01-15T08:00:00.000Z","updatedAt":"2024-09-01T12:00:00.000Z","sellingPrice":18000,"costPrice":12000,"currency":"UGX","priceSource":"Uganda community pharmacy market reference (Kampala retail survey & EMHSLU 2023)","priceLastUpdated":"2026-09-05","priceNotes":"Retail market reference price for Pack of 20 Capsules aligned with EMHSLU 2023 formulation standards.","priceHistory":[{"previousPrice":18000,"newPrice":18000,"costPrice":12000,"changedBy":"Uganda Market Reference Baseline","date":"2026-09-05","reason":"Initial community pharmacy retail market review and EMHSLU 2023 alignment"}]},
  {"id":"DEMO-MED-005","name":"Azithromycin 500mg Tablets","genericName":"Azithromycin Monohydrate","strength":"500mg","dosageForm":"Pack of 3 Tablets","category":"Cold & Flu","price":28000,"stockQuantity":40,"reorderLevel":10,"requiresPrescription":true,"status":"active","description":"[DEMONSTRATION TEST DATA] Short-course macrolide antibiotic for upper and lower respiratory bacterial infections.","manufacturer":"Pfizer","batchNumber":"DEMO-2026-AZ50","expiryDate":"2028-05-30","imageUrl":"products/azithromycin-500mg.webp","sku":"BC-SKU-0006","brandName":"Azithromycin","activeIngredients":"Azithromycin Monohydrate","subcategory":"Cold & Flu","packSize":"Pack of 3 Tablets","createdAt":"2024-01-15T08:00:00.000Z","updatedAt":"2024-09-01T12:00:00.000Z","sellingPrice":28000,"costPrice":19500,"currency":"UGX","priceSource":"Uganda community pharmacy market reference (Kampala retail survey & EMHSLU 2023)","priceLastUpdated":"2026-09-05","priceNotes":"Retail market reference price for Pack of 3 Tablets aligned with EMHSLU 2023 formulation standards.","priceHistory":[{"previousPrice":28000,"newPrice":28000,"costPrice":19500,"changedBy":"Uganda Market Reference Baseline","date":"2026-09-05","reason":"Initial community pharmacy retail market review and EMHSLU 2023 alignment"}]},
  {"id":"DEMO-MED-021","name":"Cough Syrup","genericName":"Guaifenesin Expectorant + Menthol","strength":"100mg/5ml","dosageForm":"100ml Liquid Bottle","category":"Cold & Flu","price":14000,"stockQuantity":85,"reorderLevel":15,"requiresPrescription":false,"status":"active","description":"[DEMONSTRATION TEST DATA] Soothing expectorant cough formulation to liquefy chest mucus and relieve dry irritated throat coughs.","manufacturer":"Johnson & Johnson","batchNumber":"DEMO-2026-CS10","expiryDate":"2028-07-15","imageUrl":"products/cough-syrup.webp","sku":"BC-SKU-0007","brandName":"Cough","activeIngredients":"Guaifenesin Expectorant + Menthol","subcategory":"Cold & Flu","packSize":"100ml Bottle","createdAt":"2024-01-15T08:00:00.000Z","updatedAt":"2024-09-01T12:00:00.000Z","sellingPrice":14000,"costPrice":9500,"currency":"UGX","priceSource":"Uganda community pharmacy market reference (Kampala retail survey & EMHSLU 2023)","priceLastUpdated":"2026-09-05","priceNotes":"Retail market reference price for 100ml Bottle aligned with EMHSLU 2023 formulation standards.","priceHistory":[{"previousPrice":14000,"newPrice":14000,"costPrice":9500,"changedBy":"Uganda Market Reference Baseline","date":"2026-09-05","reason":"Initial community pharmacy retail market review and EMHSLU 2023 alignment"}]},
  {"id":"DEMO-MED-022","name":"Nasal Saline Drops","genericName":"Sodium Chloride 0.9% Isotonic Solution","strength":"0.9% w/v","dosageForm":"15ml Dropper Bottle","category":"Cold & Flu","price":7000,"stockQuantity":95,"reorderLevel":15,"requiresPrescription":false,"status":"active","description":"[DEMONSTRATION TEST DATA] Natural preservative-free isotonic nasal saline drops to clear blocked nasal passages and relieve dryness.","manufacturer":"SurgiPharm Uganda","batchNumber":"DEMO-2026-NS15","expiryDate":"2028-11-30","imageUrl":"products/nasal-saline-drops.webp","sku":"BC-SKU-0008","brandName":"Nasal","activeIngredients":"Sodium Chloride 0.9% Isotonic Solution","subcategory":"Cold & Flu","packSize":"15ml Dropper Bottle","createdAt":"2024-01-15T08:00:00.000Z","updatedAt":"2024-09-01T12:00:00.000Z","sellingPrice":7000,"costPrice":4500,"currency":"UGX","priceSource":"Uganda community pharmacy market reference (Kampala retail survey & EMHSLU 2023)","priceLastUpdated":"2026-09-05","priceNotes":"Retail market reference price for 15ml Dropper Bottle aligned with EMHSLU 2023 formulation standards.","priceHistory":[{"previousPrice":7000,"newPrice":7000,"costPrice":4500,"changedBy":"Uganda Market Reference Baseline","date":"2026-09-05","reason":"Initial community pharmacy retail market review and EMHSLU 2023 alignment"}]},
  {"id":"DEMO-MED-006","name":"Cetirizine 10mg Tablets","genericName":"Cetirizine Hydrochloride","strength":"10mg","dosageForm":"Pack of 10 Tablets","category":"Allergy Care","price":8500,"stockQuantity":85,"reorderLevel":12,"requiresPrescription":false,"status":"active","description":"[DEMONSTRATION TEST DATA] Non-drowsy second-generation antihistamine for allergic rhinitis, sneezing, and skin urticaria.","manufacturer":"UCB Pharma","batchNumber":"DEMO-2026-CT10","expiryDate":"2028-06-20","imageUrl":"products/cetirizine-10mg.webp","sku":"BC-SKU-0009","brandName":"Cetirizine","activeIngredients":"Cetirizine Hydrochloride","subcategory":"Allergy Care","packSize":"Pack of 10 Tablets","createdAt":"2024-01-15T08:00:00.000Z","updatedAt":"2024-09-01T12:00:00.000Z","sellingPrice":8500,"costPrice":5500,"currency":"UGX","priceSource":"Uganda community pharmacy market reference (Kampala retail survey & EMHSLU 2023)","priceLastUpdated":"2026-09-05","priceNotes":"Retail market reference price for Pack of 10 Tablets aligned with EMHSLU 2023 formulation standards.","priceHistory":[{"previousPrice":8500,"newPrice":8500,"costPrice":5500,"changedBy":"Uganda Market Reference Baseline","date":"2026-09-05","reason":"Initial community pharmacy retail market review and EMHSLU 2023 alignment"}]},
  {"id":"DEMO-MED-007","name":"Loratadine 10mg Tablets","genericName":"Loratadine","strength":"10mg","dosageForm":"Pack of 10 Tablets","category":"Allergy Care","price":10500,"stockQuantity":70,"reorderLevel":15,"requiresPrescription":false,"status":"active","description":"[DEMONSTRATION TEST DATA] 24-hour non-sedating antihistamine for seasonal hay fever and chronic allergic skin conditions.","manufacturer":"Bayer Healthcare","batchNumber":"DEMO-2026-LR10","expiryDate":"2028-08-31","imageUrl":"products/loratadine-10mg.webp","sku":"BC-SKU-0010","brandName":"Loratadine","activeIngredients":"Loratadine","subcategory":"Allergy Care","packSize":"Pack of 10 Tablets","createdAt":"2024-01-15T08:00:00.000Z","updatedAt":"2024-09-01T12:00:00.000Z","sellingPrice":10500,"costPrice":7000,"currency":"UGX","priceSource":"Uganda community pharmacy market reference (Kampala retail survey & EMHSLU 2023)","priceLastUpdated":"2026-09-05","priceNotes":"Retail market reference price for Pack of 10 Tablets aligned with EMHSLU 2023 formulation standards.","priceHistory":[{"previousPrice":10500,"newPrice":10500,"costPrice":7000,"changedBy":"Uganda Market Reference Baseline","date":"2026-09-05","reason":"Initial community pharmacy retail market review and EMHSLU 2023 alignment"}]},
  {"id":"DEMO-MED-008","name":"Omeprazole 20mg Capsules","genericName":"Omeprazole","strength":"20mg","dosageForm":"Pack of 14 Capsules","category":"Digestive Health","price":15000,"stockQuantity":75,"reorderLevel":15,"requiresPrescription":true,"status":"active","description":"[DEMONSTRATION TEST DATA] Proton pump inhibitor for gastric acid reduction, peptic ulcer healing, and GERD acid reflux.","manufacturer":"AstraZeneca","batchNumber":"DEMO-2026-OM20","expiryDate":"2028-03-31","imageUrl":"products/omeprazole-20mg.webp","sku":"BC-SKU-0011","brandName":"Omeprazole","activeIngredients":"Omeprazole","subcategory":"Digestive Health","packSize":"Pack of 14 Capsules","createdAt":"2024-01-15T08:00:00.000Z","updatedAt":"2024-09-01T12:00:00.000Z","sellingPrice":15000,"costPrice":10000,"currency":"UGX","priceSource":"Uganda community pharmacy market reference (Kampala retail survey & EMHSLU 2023)","priceLastUpdated":"2026-09-05","priceNotes":"Retail market reference price for Pack of 14 Capsules aligned with EMHSLU 2023 formulation standards.","priceHistory":[{"previousPrice":15000,"newPrice":15000,"costPrice":10000,"changedBy":"Uganda Market Reference Baseline","date":"2026-09-05","reason":"Initial community pharmacy retail market review and EMHSLU 2023 alignment"}]},
  {"id":"DEMO-MED-009","name":"Oral Rehydration Salts","genericName":"WHO Formula Electrolytes","strength":"20.5g/sachet","dosageForm":"Box of 5 Sachets","category":"Digestive Health","price":3500,"stockQuantity":200,"reorderLevel":30,"requiresPrescription":false,"status":"active","description":"[DEMONSTRATION TEST DATA] Balanced glucose-electrolyte solution for rehydration therapy during acute diarrhea and dehydration.","manufacturer":"Cipla Uganda","batchNumber":"DEMO-2026-ORS1","expiryDate":"2029-01-30","imageUrl":"products/oral-rehydration-salts.webp","sku":"BC-SKU-0012","brandName":"Oral","activeIngredients":"WHO Formula Electrolytes","subcategory":"Digestive Health","packSize":"Box of 5 Sachets","createdAt":"2024-01-15T08:00:00.000Z","updatedAt":"2024-09-01T12:00:00.000Z","sellingPrice":3500,"costPrice":2200,"currency":"UGX","priceSource":"Uganda community pharmacy market reference (Kampala retail survey & EMHSLU 2023)","priceLastUpdated":"2026-09-05","priceNotes":"Retail market reference price for Box of 5 Sachets aligned with EMHSLU 2023 formulation standards.","priceHistory":[{"previousPrice":3500,"newPrice":3500,"costPrice":2200,"changedBy":"Uganda Market Reference Baseline","date":"2026-09-05","reason":"Initial community pharmacy retail market review and EMHSLU 2023 alignment"}]},
  {"id":"DEMO-MED-010","name":"Antacid Tablets","genericName":"Magnesium + Aluminum Hydroxide","strength":"400mg","dosageForm":"Pack of 12 Chewable Tablets","category":"Digestive Health","price":6000,"stockQuantity":130,"reorderLevel":20,"requiresPrescription":false,"status":"active","description":"[DEMONSTRATION TEST DATA] Fast-acting chewable tablets for immediate neutralization of stomach acid, heartburn, and sour stomach.","manufacturer":"Reckitt Benckiser","batchNumber":"DEMO-2026-ANT1","expiryDate":"2028-07-25","imageUrl":"products/antacid-tablets.webp","sku":"BC-SKU-0013","brandName":"Antacid","activeIngredients":"Magnesium + Aluminum Hydroxide","subcategory":"Digestive Health","packSize":"Pack of 12 Chewable Tablets","createdAt":"2024-01-15T08:00:00.000Z","updatedAt":"2024-09-01T12:00:00.000Z","sellingPrice":6000,"costPrice":4000,"currency":"UGX","priceSource":"Uganda community pharmacy market reference (Kampala retail survey & EMHSLU 2023)","priceLastUpdated":"2026-09-05","priceNotes":"Retail market reference price for Pack of 12 Chewable Tablets aligned with EMHSLU 2023 formulation standards.","priceHistory":[{"previousPrice":6000,"newPrice":6000,"costPrice":4000,"changedBy":"Uganda Market Reference Baseline","date":"2026-09-05","reason":"Initial community pharmacy retail market review and EMHSLU 2023 alignment"}]},
  {"id":"DEMO-MED-011","name":"Vitamin C 500mg Tablets","genericName":"Ascorbic Acid","strength":"500mg","dosageForm":"Bottle of 30 Chewable Tablets","category":"Vitamins & Supplements","price":12000,"stockQuantity":110,"reorderLevel":15,"requiresPrescription":false,"status":"active","description":"[DEMONSTRATION TEST DATA] Daily immune defense booster and antioxidant supplement supporting collagen synthesis.","manufacturer":"Bayer Healthcare","batchNumber":"DEMO-2026-VC50","expiryDate":"2028-04-10","imageUrl":"products/vitamin-c-500mg.webp","sku":"BC-SKU-0014","brandName":"Vitamin","activeIngredients":"Ascorbic Acid","subcategory":"Vitamins & Supplements","packSize":"Bottle of 30 Tablets","createdAt":"2024-01-15T08:00:00.000Z","updatedAt":"2024-09-01T12:00:00.000Z","sellingPrice":12000,"costPrice":8000,"currency":"UGX","priceSource":"Uganda community pharmacy market reference (Kampala retail survey & EMHSLU 2023)","priceLastUpdated":"2026-09-05","priceNotes":"Retail market reference price for Bottle of 30 Tablets aligned with EMHSLU 2023 formulation standards.","priceHistory":[{"previousPrice":12000,"newPrice":12000,"costPrice":8000,"changedBy":"Uganda Market Reference Baseline","date":"2026-09-05","reason":"Initial community pharmacy retail market review and EMHSLU 2023 alignment"}]},
  {"id":"DEMO-MED-012","name":"Zinc 20mg Tablets","genericName":"Zinc Sulfate Monohydrate","strength":"20mg","dosageForm":"Pack of 10 Tablets","category":"Vitamins & Supplements","price":6500,"stockQuantity":140,"reorderLevel":25,"requiresPrescription":false,"status":"active","description":"[DEMONSTRATION TEST DATA] Essential trace mineral for cellular immunity, tissue repair, and diarrhea recovery.","manufacturer":"Cipla Uganda","batchNumber":"DEMO-2026-ZN20","expiryDate":"2029-02-28","imageUrl":"products/zinc-20mg.webp","sku":"BC-SKU-0015","brandName":"Zinc","activeIngredients":"Zinc Sulfate Monohydrate","subcategory":"Vitamins & Supplements","packSize":"Pack of 10 Tablets","createdAt":"2024-01-15T08:00:00.000Z","updatedAt":"2024-09-01T12:00:00.000Z","sellingPrice":6500,"costPrice":4200,"currency":"UGX","priceSource":"Uganda community pharmacy market reference (Kampala retail survey & EMHSLU 2023)","priceLastUpdated":"2026-09-05","priceNotes":"Retail market reference price for Pack of 10 Tablets aligned with EMHSLU 2023 formulation standards.","priceHistory":[{"previousPrice":6500,"newPrice":6500,"costPrice":4200,"changedBy":"Uganda Market Reference Baseline","date":"2026-09-05","reason":"Initial community pharmacy retail market review and EMHSLU 2023 alignment"}]},
  {"id":"DEMO-MED-027","name":"Daily Multivitamin Complete","genericName":"Complete A-Z Formula","strength":"24 Nutrients","dosageForm":"Bottle of 30 Tablets","category":"Vitamins & Supplements","price":25000,"stockQuantity":60,"reorderLevel":10,"requiresPrescription":false,"status":"active","description":"[DEMONSTRATION TEST DATA] Complete daily micronutrient supplement supporting physical vitality and mental clarity.","manufacturer":"Vitabiotics","batchNumber":"DEMO-2026-MV30","expiryDate":"2028-09-15","imageUrl":"products/daily-multivitamin.webp","sku":"BC-SKU-0016","brandName":"Daily","activeIngredients":"Complete A-Z Formula","subcategory":"Vitamins & Supplements","packSize":"Bottle of 30 Tablets","createdAt":"2024-01-15T08:00:00.000Z","updatedAt":"2024-09-01T12:00:00.000Z","sellingPrice":25000,"costPrice":17500,"currency":"UGX","priceSource":"Uganda community pharmacy market reference (Kampala retail survey & EMHSLU 2023)","priceLastUpdated":"2026-09-05","priceNotes":"Retail market reference price for Bottle of 30 Tablets aligned with EMHSLU 2023 formulation standards.","priceHistory":[{"previousPrice":25000,"newPrice":25000,"costPrice":17500,"changedBy":"Uganda Market Reference Baseline","date":"2026-09-05","reason":"Initial community pharmacy retail market review and EMHSLU 2023 alignment"}]},
  {"id":"DEMO-MED-013","name":"Ferrous Sulfate Tablets","genericName":"Dried Ferrous Sulfate","strength":"200mg (65mg Elemental Iron)","dosageForm":"Bottle of 60 Tablets","category":"Maternal Health","price":9000,"stockQuantity":80,"reorderLevel":15,"requiresPrescription":false,"status":"active","description":"[DEMONSTRATION TEST DATA] Essential iron supplement for prevention and treatment of iron deficiency anemia in pregnancy and convalescence.","manufacturer":"Medreich Laboratories","batchNumber":"DEMO-2026-FE20","expiryDate":"2028-10-31","imageUrl":"products/ferrous-sulfate.webp","sku":"BC-SKU-0017","brandName":"Ferrous","activeIngredients":"Dried Ferrous Sulfate","subcategory":"Maternal Health","packSize":"Bottle of 60 Tablets","createdAt":"2024-01-15T08:00:00.000Z","updatedAt":"2024-09-01T12:00:00.000Z","sellingPrice":9000,"costPrice":5800,"currency":"UGX","priceSource":"Uganda community pharmacy market reference (Kampala retail survey & EMHSLU 2023)","priceLastUpdated":"2026-09-05","priceNotes":"Retail market reference price for Bottle of 60 Tablets aligned with EMHSLU 2023 formulation standards.","priceHistory":[{"previousPrice":9000,"newPrice":9000,"costPrice":5800,"changedBy":"Uganda Market Reference Baseline","date":"2026-09-05","reason":"Initial community pharmacy retail market review and EMHSLU 2023 alignment"}]},
  {"id":"DEMO-MED-028","name":"Folic Acid 5mg Tablets","genericName":"Folic Acid","strength":"5mg","dosageForm":"Bottle of 100 Tablets","category":"Maternal Health","price":7000,"stockQuantity":85,"reorderLevel":15,"requiresPrescription":false,"status":"active","description":"[DEMONSTRATION TEST DATA] Crucial folate supplement for neural tube defect prevention during conception and early pregnancy.","manufacturer":"Cipla Uganda","batchNumber":"DEMO-2026-FA05","expiryDate":"2028-11-15","imageUrl":"products/folic-acid-5mg.webp","sku":"BC-SKU-0018","brandName":"Folic","activeIngredients":"Folic Acid","subcategory":"Maternal Health","packSize":"Bottle of 100 Tablets","createdAt":"2024-01-15T08:00:00.000Z","updatedAt":"2024-09-01T12:00:00.000Z","sellingPrice":7000,"costPrice":4500,"currency":"UGX","priceSource":"Uganda community pharmacy market reference (Kampala retail survey & EMHSLU 2023)","priceLastUpdated":"2026-09-05","priceNotes":"Retail market reference price for Bottle of 100 Tablets aligned with EMHSLU 2023 formulation standards.","priceHistory":[{"previousPrice":7000,"newPrice":7000,"costPrice":4500,"changedBy":"Uganda Market Reference Baseline","date":"2026-09-05","reason":"Initial community pharmacy retail market review and EMHSLU 2023 alignment"}]},
  {"id":"DEMO-MED-014","name":"Antiseptic Solution","genericName":"Chloroxylenol 4.8%","strength":"4.8% w/v","dosageForm":"500ml Liquid Bottle","category":"First Aid","price":14000,"stockQuantity":75,"reorderLevel":12,"requiresPrescription":false,"status":"active","description":"[DEMONSTRATION TEST DATA] Concentrated antiseptic liquid for wound cleansing, disinfection of cuts, abrasions, and skin hygiene.","manufacturer":"Reckitt Benckiser","batchNumber":"DEMO-2026-AS50","expiryDate":"2029-03-31","imageUrl":"products/antiseptic-solution.webp","sku":"BC-SKU-0019","brandName":"Antiseptic","activeIngredients":"Chloroxylenol 4.8%","subcategory":"First Aid","packSize":"500ml Bottle","createdAt":"2024-01-15T08:00:00.000Z","updatedAt":"2024-09-01T12:00:00.000Z","sellingPrice":14000,"costPrice":9500,"currency":"UGX","priceSource":"Uganda community pharmacy market reference (Kampala retail survey & EMHSLU 2023)","priceLastUpdated":"2026-09-05","priceNotes":"Retail market reference price for 500ml Bottle aligned with EMHSLU 2023 formulation standards.","priceHistory":[{"previousPrice":14000,"newPrice":14000,"costPrice":9500,"changedBy":"Uganda Market Reference Baseline","date":"2026-09-05","reason":"Initial community pharmacy retail market review and EMHSLU 2023 alignment"}]},
  {"id":"DEMO-MED-015","name":"Hydrogen Peroxide 3%","genericName":"Hydrogen Peroxide Solution (10 Vol)","strength":"3% w/v","dosageForm":"200ml Liquid Bottle","category":"First Aid","price":6500,"stockQuantity":90,"reorderLevel":15,"requiresPrescription":false,"status":"active","description":"[DEMONSTRATION TEST DATA] Mild topical antiseptic for minor wound debridement, effervescent cleansing of cuts, and hygiene.","manufacturer":"SurgiPharm Uganda","batchNumber":"DEMO-2026-HP03","expiryDate":"2028-09-30","imageUrl":"products/hydrogen-peroxide.webp","sku":"BC-SKU-0020","brandName":"Hydrogen","activeIngredients":"Hydrogen Peroxide Solution (10 Vol)","subcategory":"First Aid","packSize":"200ml Bottle","createdAt":"2024-01-15T08:00:00.000Z","updatedAt":"2024-09-01T12:00:00.000Z","sellingPrice":6500,"costPrice":4200,"currency":"UGX","priceSource":"Uganda community pharmacy market reference (Kampala retail survey & EMHSLU 2023)","priceLastUpdated":"2026-09-05","priceNotes":"Retail market reference price for 200ml Bottle aligned with EMHSLU 2023 formulation standards.","priceHistory":[{"previousPrice":6500,"newPrice":6500,"costPrice":4200,"changedBy":"Uganda Market Reference Baseline","date":"2026-09-05","reason":"Initial community pharmacy retail market review and EMHSLU 2023 alignment"}]},
  {"id":"DEMO-MED-016","name":"Povidone-Iodine 10%","genericName":"Povidone-Iodine Topical Solution","strength":"10% w/v","dosageForm":"100ml Liquid Bottle","category":"First Aid","price":9500,"stockQuantity":85,"reorderLevel":15,"requiresPrescription":false,"status":"active","description":"[DEMONSTRATION TEST DATA] Broad-spectrum non-stinging microbicidal antiseptic for skin disinfection, minor burns, and wound asepsis.","manufacturer":"Mundipharma","batchNumber":"DEMO-2026-PI10","expiryDate":"2029-04-30","imageUrl":"products/povidone-iodine.webp","sku":"BC-SKU-0021","brandName":"Povidone-Iodine","activeIngredients":"Povidone-Iodine Topical Solution","subcategory":"First Aid","packSize":"100ml Bottle","createdAt":"2024-01-15T08:00:00.000Z","updatedAt":"2024-09-01T12:00:00.000Z","sellingPrice":9500,"costPrice":6200,"currency":"UGX","priceSource":"Uganda community pharmacy market reference (Kampala retail survey & EMHSLU 2023)","priceLastUpdated":"2026-09-05","priceNotes":"Retail market reference price for 100ml Bottle aligned with EMHSLU 2023 formulation standards.","priceHistory":[{"previousPrice":9500,"newPrice":9500,"costPrice":6200,"changedBy":"Uganda Market Reference Baseline","date":"2026-09-05","reason":"Initial community pharmacy retail market review and EMHSLU 2023 alignment"}]},
  {"id":"DEMO-MED-017","name":"Hydrocortisone 1% Cream","genericName":"Hydrocortisone Acetate","strength":"1% w/w","dosageForm":"15g Aluminum Tube","category":"Skin Care","price":7500,"stockQuantity":50,"reorderLevel":10,"requiresPrescription":true,"status":"active","description":"[DEMONSTRATION TEST DATA] Mild topical corticosteroid cream for inflammatory dermatitis, allergic eczema, and insect bite irritation.","manufacturer":"Medreich Laboratories","batchNumber":"DEMO-2026-HC01","expiryDate":"2027-11-30","imageUrl":"products/hydrocortisone-cream.webp","sku":"BC-SKU-0022","brandName":"Hydrocortisone","activeIngredients":"Hydrocortisone Acetate","subcategory":"Skin Care","packSize":"15g Tube","createdAt":"2024-01-15T08:00:00.000Z","updatedAt":"2024-09-01T12:00:00.000Z","sellingPrice":7500,"costPrice":4800,"currency":"UGX","priceSource":"Uganda community pharmacy market reference (Kampala retail survey & EMHSLU 2023)","priceLastUpdated":"2026-09-05","priceNotes":"Retail market reference price for 15g Tube aligned with EMHSLU 2023 formulation standards.","priceHistory":[{"previousPrice":7500,"newPrice":7500,"costPrice":4800,"changedBy":"Uganda Market Reference Baseline","date":"2026-09-05","reason":"Initial community pharmacy retail market review and EMHSLU 2023 alignment"}]},
  {"id":"DEMO-MED-018","name":"Clotrimazole 1% Cream","genericName":"Clotrimazole","strength":"1% w/w","dosageForm":"20g Aluminum Tube","category":"Skin Care","price":9000,"stockQuantity":65,"reorderLevel":15,"requiresPrescription":false,"status":"active","description":"[DEMONSTRATION TEST DATA] Broad-spectrum topical imidazole antifungal cream for ringworm (tinea corporis), athlete's foot, and candidiasis.","manufacturer":"Bayer Healthcare","batchNumber":"DEMO-2026-CL01","expiryDate":"2028-09-30","imageUrl":"products/clotrimazole-cream.webp","sku":"BC-SKU-0023","brandName":"Clotrimazole","activeIngredients":"Clotrimazole","subcategory":"Skin Care","packSize":"20g Tube","createdAt":"2024-01-15T08:00:00.000Z","updatedAt":"2024-09-01T12:00:00.000Z","sellingPrice":9000,"costPrice":5800,"currency":"UGX","priceSource":"Uganda community pharmacy market reference (Kampala retail survey & EMHSLU 2023)","priceLastUpdated":"2026-09-05","priceNotes":"Retail market reference price for 20g Tube aligned with EMHSLU 2023 formulation standards.","priceHistory":[{"previousPrice":9000,"newPrice":9000,"costPrice":5800,"changedBy":"Uganda Market Reference Baseline","date":"2026-09-05","reason":"Initial community pharmacy retail market review and EMHSLU 2023 alignment"}]},
  {"id":"DEMO-MED-019","name":"Calamine Lotion","genericName":"Calamine 15% + Zinc Oxide 5%","strength":"15% w/v","dosageForm":"100ml Suspension Bottle","category":"Skin Care","price":8000,"stockQuantity":70,"reorderLevel":12,"requiresPrescription":false,"status":"active","description":"[DEMONSTRATION TEST DATA] Soothing, cooling astringent protective lotion for itch relief, sunburn, chickenpox rash, and prickly heat.","manufacturer":"Cipla Uganda","batchNumber":"DEMO-2026-CAL1","expiryDate":"2028-12-31","imageUrl":"products/calamine-lotion.webp","sku":"BC-SKU-0024","brandName":"Calamine","activeIngredients":"Calamine 15% + Zinc Oxide 5%","subcategory":"Skin Care","packSize":"100ml Bottle","createdAt":"2024-01-15T08:00:00.000Z","updatedAt":"2024-09-01T12:00:00.000Z","sellingPrice":8000,"costPrice":5200,"currency":"UGX","priceSource":"Uganda community pharmacy market reference (Kampala retail survey & EMHSLU 2023)","priceLastUpdated":"2026-09-05","priceNotes":"Retail market reference price for 100ml Bottle aligned with EMHSLU 2023 formulation standards.","priceHistory":[{"previousPrice":8000,"newPrice":8000,"costPrice":5200,"changedBy":"Uganda Market Reference Baseline","date":"2026-09-05","reason":"Initial community pharmacy retail market review and EMHSLU 2023 alignment"}]},
  {"id":"DEMO-MED-020","name":"Salbutamol Inhaler","genericName":"Salbutamol Sulfate","strength":"100mcg/metered dose","dosageForm":"200 Dose Pressurized Inhaler","category":"Respiratory Care","price":22000,"stockQuantity":28,"reorderLevel":8,"requiresPrescription":true,"status":"active","description":"[DEMONSTRATION TEST DATA] Rapid-acting selective beta-2 agonist bronchodilator for prompt relief of acute asthma bronchospasm.","manufacturer":"GSK","batchNumber":"DEMO-2026-SL10","expiryDate":"2027-09-30","imageUrl":"products/salbutamol-inhaler.webp","sku":"BC-SKU-0025","brandName":"Salbutamol","activeIngredients":"Salbutamol Sulfate","subcategory":"Respiratory Care","packSize":"1 Inhaler (200 Doses)","createdAt":"2024-01-15T08:00:00.000Z","updatedAt":"2024-09-01T12:00:00.000Z","sellingPrice":22000,"costPrice":15000,"currency":"UGX","priceSource":"Uganda community pharmacy market reference (Kampala retail survey & EMHSLU 2023)","priceLastUpdated":"2026-09-05","priceNotes":"Retail market reference price for 1 Inhaler (200 Doses) aligned with EMHSLU 2023 formulation standards.","priceHistory":[{"previousPrice":22000,"newPrice":22000,"costPrice":15000,"changedBy":"Uganda Market Reference Baseline","date":"2026-09-05","reason":"Initial community pharmacy retail market review and EMHSLU 2023 alignment"}]},
  {"id":"DEMO-MED-023","name":"Digital Thermometer","genericName":"Electronic Clinical Fever Thermometer","strength":"Digital Sensor (+/-0.1 C)","dosageForm":"1 Digital Unit in Case","category":"Medical Devices","price":25000,"stockQuantity":40,"reorderLevel":8,"requiresPrescription":false,"status":"active","description":"[DEMONSTRATION TEST DATA] High-speed clinical digital oral, axillary, and rectal thermometer with fever beep indicator and auto shut-off.","manufacturer":"Omron Healthcare","batchNumber":"DEMO-2026-DT01","expiryDate":"2032-12-31","imageUrl":"products/digital-thermometer.webp","sku":"BC-SKU-0026","brandName":"Digital","activeIngredients":"Electronic Clinical Fever Thermometer","subcategory":"Medical Devices","packSize":"1 Digital Unit","createdAt":"2024-01-15T08:00:00.000Z","updatedAt":"2024-09-01T12:00:00.000Z","sellingPrice":25000,"costPrice":16500,"currency":"UGX","priceSource":"Uganda community pharmacy market reference (Kampala retail survey & EMHSLU 2023)","priceLastUpdated":"2026-09-05","priceNotes":"Retail market reference price for 1 Digital Unit aligned with EMHSLU 2023 formulation standards.","priceHistory":[{"previousPrice":25000,"newPrice":25000,"costPrice":16500,"changedBy":"Uganda Market Reference Baseline","date":"2026-09-05","reason":"Initial community pharmacy retail market review and EMHSLU 2023 alignment"}]},
  {"id":"DEMO-MED-024","name":"Blood Pressure Monitor","genericName":"Automatic Upper Arm Digital BP Monitor","strength":"Digital Oscillometric Sensor","dosageForm":"1 Digital Monitor Unit + Cuff","category":"Medical Devices","price":185000,"stockQuantity":18,"reorderLevel":5,"requiresPrescription":false,"status":"active","description":"[DEMONSTRATION TEST DATA] Clinically validated automatic digital upper-arm blood pressure and pulse monitor with hypertension indicator.","manufacturer":"Omron Healthcare","batchNumber":"DEMO-2026-BP02","expiryDate":"2032-12-31","imageUrl":"products/blood-pressure-monitor.webp","sku":"BC-SKU-0027","brandName":"Blood","activeIngredients":"Automatic Upper Arm Digital BP Monitor","subcategory":"Medical Devices","packSize":"1 Complete Monitor Kit","createdAt":"2024-01-15T08:00:00.000Z","updatedAt":"2024-09-01T12:00:00.000Z","sellingPrice":185000,"costPrice":130000,"currency":"UGX","priceSource":"Uganda community pharmacy market reference (Kampala retail survey & EMHSLU 2023)","priceLastUpdated":"2026-09-05","priceNotes":"Retail market reference price for 1 Complete Monitor Kit aligned with EMHSLU 2023 formulation standards.","priceHistory":[{"previousPrice":185000,"newPrice":185000,"costPrice":130000,"changedBy":"Uganda Market Reference Baseline","date":"2026-09-05","reason":"Initial community pharmacy retail market review and EMHSLU 2023 alignment"}]},
  {"id":"DEMO-MED-025","name":"Hand Sanitizer 70%","genericName":"70% Isopropyl Alcohol Antiseptic Gel","strength":"70% v/v","dosageForm":"500ml Pump Bottle","category":"Personal Care","price":10000,"stockQuantity":95,"reorderLevel":15,"requiresPrescription":false,"status":"active","description":"[DEMONSTRATION TEST DATA] Hospital-grade 70% alcohol hand rub with moisturizers for rapid destruction of germs and pathogens.","manufacturer":"Saraya East Africa","batchNumber":"DEMO-2026-HS70","expiryDate":"2029-06-30","imageUrl":"products/hand-sanitizer.webp","sku":"BC-SKU-0028","brandName":"Hand","activeIngredients":"70% Isopropyl Alcohol Antiseptic Gel","subcategory":"Personal Care","packSize":"500ml Pump Bottle","createdAt":"2024-01-15T08:00:00.000Z","updatedAt":"2024-09-01T12:00:00.000Z","sellingPrice":10000,"costPrice":6800,"currency":"UGX","priceSource":"Uganda community pharmacy market reference (Kampala retail survey & EMHSLU 2023)","priceLastUpdated":"2026-09-05","priceNotes":"Retail market reference price for 500ml Pump Bottle aligned with EMHSLU 2023 formulation standards.","priceHistory":[{"previousPrice":10000,"newPrice":10000,"costPrice":6800,"changedBy":"Uganda Market Reference Baseline","date":"2026-09-05","reason":"Initial community pharmacy retail market review and EMHSLU 2023 alignment"}]},
  {"id":"DEMO-MED-029","name":"Amlodipine 5mg Tablets","genericName":"Amlodipine Besylate","strength":"5mg","dosageForm":"Box of 28 Tablets","category":"Chronic Care","price":9500,"stockQuantity":50,"reorderLevel":15,"requiresPrescription":true,"status":"active","description":"[DEMONSTRATION TEST DATA] Calcium channel blocker for arterial hypertension and chronic stable angina management.","manufacturer":"Pfizer","batchNumber":"DEMO-2026-AM05","expiryDate":"2027-12-31","imageUrl":"products/amlodipine-5mg.webp","sku":"BC-SKU-0029","brandName":"Amlodipine","activeIngredients":"Amlodipine Besylate","subcategory":"Chronic Care","packSize":"Box of 28 Tablets","createdAt":"2024-01-15T08:00:00.000Z","updatedAt":"2024-09-01T12:00:00.000Z","sellingPrice":9500,"costPrice":6200,"currency":"UGX","priceSource":"Uganda community pharmacy market reference (Kampala retail survey & EMHSLU 2023)","priceLastUpdated":"2026-09-05","priceNotes":"Retail market reference price for Box of 28 Tablets aligned with EMHSLU 2023 formulation standards.","priceHistory":[{"previousPrice":24000,"newPrice":9500,"costPrice":6200,"changedBy":"Uganda Market Reference Baseline","date":"2026-09-05","reason":"Initial community pharmacy retail market review and EMHSLU 2023 alignment"}]},
  {"id":"DEMO-MED-030","name":"Losartan Potassium 50mg Tablets","genericName":"Losartan Potassium","strength":"50mg","dosageForm":"Box of 30 Tablets","category":"Chronic Care","price":18500,"stockQuantity":42,"reorderLevel":10,"requiresPrescription":true,"status":"active","description":"[DEMONSTRATION TEST DATA] Angiotensin II receptor blocker for blood pressure regulation and renal protection in diabetes.","manufacturer":"Organon Pharma","batchNumber":"DEMO-2026-LS50","expiryDate":"2028-02-28","imageUrl":"products/losartan-50mg.webp","sku":"BC-SKU-0030","brandName":"Losartan","activeIngredients":"Losartan Potassium","subcategory":"Chronic Care","packSize":"Box of 30 Tablets","createdAt":"2024-01-15T08:00:00.000Z","updatedAt":"2024-09-01T12:00:00.000Z","sellingPrice":18500,"costPrice":12000,"currency":"UGX","priceSource":"Uganda community pharmacy market reference (Kampala retail survey & EMHSLU 2023)","priceLastUpdated":"2026-09-05","priceNotes":"Retail market reference price for Box of 30 Tablets aligned with EMHSLU 2023 formulation standards.","priceHistory":[{"previousPrice":28000,"newPrice":18500,"costPrice":12000,"changedBy":"Uganda Market Reference Baseline","date":"2026-09-05","reason":"Initial community pharmacy retail market review and EMHSLU 2023 alignment"}]},
  {"id":"DEMO-MED-031","name":"Metformin 500mg Tablets","genericName":"Metformin Hydrochloride","strength":"500mg","dosageForm":"Box of 30 Tablets","category":"Diabetes Care","price":6500,"stockQuantity":40,"reorderLevel":10,"requiresPrescription":true,"status":"active","description":"[DEMONSTRATION TEST DATA] First-line oral biguanide antidiabetic for glycemic control in adult Type 2 Diabetes.","manufacturer":"Merck Healthcare","batchNumber":"DEMO-2026-MF50","expiryDate":"2028-05-30","imageUrl":"products/metformin-500mg.webp","sku":"BC-SKU-0031","brandName":"Metformin","activeIngredients":"Metformin Hydrochloride","subcategory":"Diabetes Care","packSize":"Box of 30 Tablets","createdAt":"2024-01-15T08:00:00.000Z","updatedAt":"2024-09-01T12:00:00.000Z","sellingPrice":6500,"costPrice":4200,"currency":"UGX","priceSource":"Uganda community pharmacy market reference (Kampala retail survey & EMHSLU 2023)","priceLastUpdated":"2026-09-05","priceNotes":"Retail market reference price for Box of 30 Tablets aligned with EMHSLU 2023 formulation standards.","priceHistory":[{"previousPrice":15000,"newPrice":6500,"costPrice":4200,"changedBy":"Uganda Market Reference Baseline","date":"2026-09-05","reason":"Initial community pharmacy retail market review and EMHSLU 2023 alignment"}]},
  {"id":"DEMO-MED-032","name":"Accu-Chek Blood Glucose Test Strips","genericName":"Blood Glucose Test Strips (50s)","strength":"50 Test Strips","dosageForm":"Vial of 50 Strips","category":"Diabetes Care","price":65000,"stockQuantity":30,"reorderLevel":8,"requiresPrescription":false,"status":"active","description":"[DEMONSTRATION TEST DATA] High-precision capillary blood glucose test strips for regular home blood sugar monitoring.","manufacturer":"Roche Diabetes Care","batchNumber":"DEMO-2026-AC50","expiryDate":"2027-11-30","imageUrl":"products/glucose-test-strips.webp","sku":"BC-SKU-0032","brandName":"Accu-Chek","activeIngredients":"Blood Glucose Test Strips (50s)","subcategory":"Diabetes Care","packSize":"Vial of 50 Test Strips","createdAt":"2024-01-15T08:00:00.000Z","updatedAt":"2024-09-01T12:00:00.000Z","sellingPrice":65000,"costPrice":48000,"currency":"UGX","priceSource":"Uganda community pharmacy market reference (Kampala retail survey & EMHSLU 2023)","priceLastUpdated":"2026-09-05","priceNotes":"Retail market reference price for Vial of 50 Test Strips aligned with EMHSLU 2023 formulation standards.","priceHistory":[{"previousPrice":65000,"newPrice":65000,"costPrice":48000,"changedBy":"Uganda Market Reference Baseline","date":"2026-09-05","reason":"Initial community pharmacy retail market review and EMHSLU 2023 alignment"}]},
  {"id":"DEMO-MED-033","name":"Pediatric Paracetamol Syrup 100ml","genericName":"Paracetamol 120mg/5ml","strength":"120mg/5ml","dosageForm":"100ml Bottle + Spoon","category":"Baby & Child Care","price":9500,"stockQuantity":80,"reorderLevel":15,"requiresPrescription":false,"status":"active","description":"[DEMONSTRATION TEST DATA] Sugar-free strawberry flavored pediatric suspension for infant fever, pain, and immunization discomfort.","manufacturer":"GSK Consumer Healthcare","batchNumber":"DEMO-2026-CP10","expiryDate":"2028-08-31","imageUrl":"products/pediatric-paracetamol.webp","sku":"BC-SKU-0033","brandName":"Pediatric","activeIngredients":"Paracetamol 120mg/5ml","subcategory":"Baby & Child Care","packSize":"100ml Bottle + Spoon","createdAt":"2024-01-15T08:00:00.000Z","updatedAt":"2024-09-01T12:00:00.000Z","sellingPrice":9500,"costPrice":6200,"currency":"UGX","priceSource":"Uganda community pharmacy market reference (Kampala retail survey & EMHSLU 2023)","priceLastUpdated":"2026-09-05","priceNotes":"Retail market reference price for 100ml Bottle + Spoon aligned with EMHSLU 2023 formulation standards.","priceHistory":[{"previousPrice":9500,"newPrice":9500,"costPrice":6200,"changedBy":"Uganda Market Reference Baseline","date":"2026-09-05","reason":"Initial community pharmacy retail market review and EMHSLU 2023 alignment"}]},
  {"id":"DEMO-MED-034","name":"Omega-3 Fish Oil 1000mg Capsules","genericName":"Fish Oil EPA 180mg / DHA 120mg","strength":"1000mg","dosageForm":"Bottle of 60 Capsules","category":"Wellness Products","price":32000,"stockQuantity":48,"reorderLevel":10,"requiresPrescription":false,"status":"active","description":"[DEMONSTRATION TEST DATA] Concentrated essential fatty acids supporting cardiovascular wellness, brain health, and joint mobility.","manufacturer":"P&G Health","batchNumber":"DEMO-2026-OM03","expiryDate":"2028-10-31","imageUrl":"products/omega-3-fish-oil.webp","sku":"BC-SKU-0034","brandName":"Omega-3","activeIngredients":"Fish Oil EPA 180mg / DHA 120mg","subcategory":"Wellness Products","packSize":"Bottle of 60 Capsules","createdAt":"2024-01-15T08:00:00.000Z","updatedAt":"2024-09-01T12:00:00.000Z","sellingPrice":32000,"costPrice":22000,"currency":"UGX","priceSource":"Uganda community pharmacy market reference (Kampala retail survey & EMHSLU 2023)","priceLastUpdated":"2026-09-05","priceNotes":"Retail market reference price for Bottle of 60 Capsules aligned with EMHSLU 2023 formulation standards.","priceHistory":[{"previousPrice":32000,"newPrice":32000,"costPrice":22000,"changedBy":"Uganda Market Reference Baseline","date":"2026-09-05","reason":"Initial community pharmacy retail market review and EMHSLU 2023 alignment"}]},

  // Expanded EMHSLU 2023 Ugandan Pharmacy Catalog (715 additional clinical products, strictly deduped)
  ...(typeof UGANDA_PHARMACY_CATALOG !== "undefined" ? UGANDA_PHARMACY_CATALOG.filter(m => !m.id.startsWith("DEMO-MED-")) : [])
];

// -------------------------------------------------------------
// 2B. PHARMACEUTICAL CATALOG UNIQUENESS & DEDUPLICATION LOGIC
// -------------------------------------------------------------
export function normalizeClinicalText(text) {
  if (!text) return "";
  return String(text).toLowerCase().replace(/[^\w\d]/g, " ").replace(/\s+/g, " ").trim();
}

export function getProductClinicalSignature(product) {
  if (!product) return "";
  const generic = normalizeClinicalText(product.genericName || product.name || "");
  const strength = normalizeClinicalText(product.strength || "");
  const form = normalizeClinicalText(product.dosageForm || "");
  return `${generic}___${strength}___${form}`;
}

export function deduplicateCatalog(items) {
  if (!Array.isArray(items)) return [];
  const seenIds = new Set();
  const seenSkus = new Set();
  const seenNames = new Set();
  const seenSignatures = new Set();
  const result = [];

  for (const item of items) {
    if (!item || !item.id) continue;
    // 1. Strict ID uniqueness
    if (seenIds.has(item.id)) continue;
    
    // 2. Strict SKU uniqueness
    if (item.sku && seenSkus.has(item.sku)) continue;

    // 3. Strict Normalized Name uniqueness
    const normName = normalizeClinicalText(item.name);
    if (normName && seenNames.has(normName)) continue;

    // 4. Strict Clinical Signature uniqueness (Generic + Strength + Form)
    const sig = getProductClinicalSignature(item);
    if (sig && item.genericName && item.strength && seenSignatures.has(sig)) continue;

    seenIds.add(item.id);
    if (item.sku) seenSkus.add(item.sku);
    if (normName) seenNames.add(normName);
    if (sig) seenSignatures.add(sig);
    result.push(item);
  }

  return result;
}

export function isDuplicateProduct(prodData, existingList = [], ignoreId = null) {
  if (!prodData) return false;
  const targetName = normalizeClinicalText(prodData.name);
  const targetSig = getProductClinicalSignature(prodData);
  const targetSku = prodData.sku ? String(prodData.sku).trim().toUpperCase() : null;

  return existingList.some(p => {
    if (ignoreId && p.id === ignoreId) return false;
    if (p.id === prodData.id) return true;
    if (targetSku && p.sku && String(p.sku).trim().toUpperCase() === targetSku) return true;
    if (targetName && normalizeClinicalText(p.name) === targetName) return true;
    if (targetSig && p.genericName && p.strength && getProductClinicalSignature(p) === targetSig) return true;
    return false;
  });
}

// -------------------------------------------------------------
// 2C. SMART MEDICINE SEARCH ENGINE & AUTOCOMPLETE INDEX
// -------------------------------------------------------------

export function levenshteinDistance(a, b) {
  if (a === b) return 0;
  if (!a) return b ? b.length : 0;
  if (!b) return a ? a.length : 0;

  const lenA = a.length;
  const lenB = b.length;
  if (Math.abs(lenA - lenB) > 2) return Math.abs(lenA - lenB);

  const d = [];
  for (let i = 0; i <= lenA; i++) d[i] = [i];
  for (let j = 0; j <= lenB; j++) d[0][j] = j;

  for (let i = 1; i <= lenA; i++) {
    for (let j = 1; j <= lenB; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + cost
      );
    }
  }
  return d[lenA][lenB];
}

export const SEARCH_SYNONYMS = {
  "pcm": ["paracetamol"],
  "apap": ["paracetamol", "acetaminophen"],
  "acetaminophen": ["paracetamol"],
  "ors": ["oral rehydration", "salts"],
  "amox": ["amoxicillin"],
  "azith": ["azithromycin"],
  "cipro": ["ciprofloxacin"],
  "bp": ["blood pressure", "sphygmomanometer"],
  "diclo": ["diclofenac"],
  "dexa": ["dexamethasone"],
  "hydro": ["hydrocortisone"],
  "salb": ["salbutamol"],
  "cet": ["cetirizine"],
  "para": ["paracetamol"],
  "ibup": ["ibuprofen"],
  "met": ["metformin"],
  "folic": ["folic acid"],
  "pen": ["benzylpenicillin", "penicillin"],
  "vit": ["vitamin"],
  "multi": ["multivitamin"]
};

export function getSearchStockBadge(product) {
  const qty = typeof product.stockQuantity === "number" ? product.stockQuantity : 0;
  const reorder = typeof product.reorderLevel === "number" ? product.reorderLevel : 10;
  if (qty <= 0) {
    return { label: "✕ Out of Stock", class: "stock-tag-outofstock", status: "out-of-stock", isAvailable: false };
  }
  if (qty <= reorder) {
    return { label: "⚠ Low Stock", class: "stock-tag-lowstock", status: "low-stock", isAvailable: true };
  }
  return { label: "✓ In Stock", class: "stock-tag-instock", status: "in-stock", isAvailable: true };
}

export function getSearchRxBadge(product) {
  if (product.requiresPrescription) {
    return { label: "Rx Required", class: "rx-tag-req", isRx: true };
  }
  return { label: "OTC", class: "rx-tag-otc", isRx: false };
}

export function highlightSearchMatch(text, query) {
  if (!text) return "";
  const str = String(text);
  if (!query || !query.trim()) return escapeHtml(str);
  const cleanQ = query.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${cleanQ})`, "gi");
  const parts = str.split(regex);
  return parts.map(part => {
    if (part.toLowerCase() === query.trim().toLowerCase()) {
      return `<mark>${escapeHtml(part)}</mark>`;
    }
    return escapeHtml(part);
  }).join("");
}

export function sortMedicinesList(items, sortBy = "name-asc") {
  const arr = [...items];
  if (sortBy === "name-asc") {
    arr.sort((a, b) => (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" }));
  } else if (sortBy === "name-desc") {
    arr.sort((a, b) => (b.name || "").localeCompare(a.name || "", undefined, { sensitivity: "base" }));
  } else if (sortBy === "price-asc") {
    arr.sort((a, b) => (a.price || 0) - (b.price || 0));
  } else if (sortBy === "price-desc") {
    arr.sort((a, b) => (b.price || 0) - (a.price || 0));
  } else if (sortBy === "newest") {
    arr.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  } else if (sortBy === "availability") {
    arr.sort((a, b) => {
      const availA = getSearchStockBadge(a);
      const availB = getSearchStockBadge(b);
      const scoreA = availA.status === "in-stock" ? 3 : availA.status === "low-stock" ? 2 : 1;
      const scoreB = availB.status === "in-stock" ? 3 : availB.status === "low-stock" ? 2 : 1;
      if (scoreA !== scoreB) return scoreB - scoreA;
      return (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" });
    });
  }
  return arr;
}

export function searchMedicinesCatalog(items, query, options = {}) {
  if (!Array.isArray(items)) return [];
  const q = (query || "").trim().toLowerCase();
  const category = options.category && options.category !== "All" && options.category !== "all" ? options.category : null;
  const sortBy = options.sortBy || "name-asc";
  const limit = typeof options.limit === "number" ? options.limit : null;

  // Filter inactive unless specified
  let pool = items;
  if (!options.includeInactive) {
    pool = pool.filter(p => p && p.status !== "inactive");
  }

  // If no query string, return standard sorted list with category filter if specified
  if (!q) {
    if (category) {
      pool = pool.filter(p => p.category === category);
    }
    const sorted = sortMedicinesList(pool, sortBy);
    return limit ? sorted.slice(0, limit) : sorted;
  }

  // Generate expansion keywords (synonyms / abbreviations)
  const synonyms = SEARCH_SYNONYMS[q] || [];
  const searchTerms = [q, ...synonyms];

  const scored = [];

  for (const p of pool) {
    if (!p) continue;
    const name = (p.name || "").toLowerCase();
    const generic = (p.genericName || "").toLowerCase();
    const brand = (p.brandName || "").toLowerCase();
    const active = (p.activeIngredients || "").toLowerCase();
    const sku = (p.sku || "").toLowerCase();
    const strength = (p.strength || "").toLowerCase();
    const form = (p.dosageForm || "").toLowerCase();
    const desc = (p.description || "").toLowerCase();
    const mfg = (p.manufacturer || "").toLowerCase();
    const cat = (p.category || "").toLowerCase();
    const subcat = (p.subcategory || "").toLowerCase();

    const nameWords = name.split(/[\s,()/-]+/).filter(Boolean);
    const genericWords = generic.split(/[\s,()/-]+/).filter(Boolean);
    const brandWords = brand.split(/[\s,()/-]+/).filter(Boolean);

    let bestScore = Infinity;

    for (const term of searchTerms) {
      // Priority 1: Exact Name Match
      if (name === term) {
        bestScore = Math.min(bestScore, 10);
      }
      // Priority 2: Medicine Name starts with term (Prefix Search)
      else if (name.startsWith(term)) {
        bestScore = Math.min(bestScore, 20);
      }
      // Priority 3: Word within medicine name starts with term
      else if (nameWords.some(w => w.startsWith(term))) {
        bestScore = Math.min(bestScore, 30);
      }
      // Priority 4: Generic Name starts with term or word in generic starts with term
      else if (generic.startsWith(term) || genericWords.some(w => w.startsWith(term))) {
        bestScore = Math.min(bestScore, 40);
      }
      // Priority 5: Brand Name starts with term or word in brand starts with term
      else if (brand.startsWith(term) || brandWords.some(w => w.startsWith(term))) {
        bestScore = Math.min(bestScore, 50);
      }
      // Priority 6: Active ingredient starts with or matches term
      else if (active.startsWith(term) || active.includes(term)) {
        bestScore = Math.min(bestScore, 60);
      }
      // Priority 7: SKU / Product Code / Batch matches term
      else if (sku.startsWith(term) || sku === term) {
        bestScore = Math.min(bestScore, 70);
      }
      // Priority 8: Partial substring match anywhere
      else if (name.includes(term) || generic.includes(term) || brand.includes(term) || strength.includes(term) || form.includes(term) || subcat.includes(term) || desc.includes(term) || mfg.includes(term) || cat.includes(term)) {
        bestScore = Math.min(bestScore, 80);
      }
    }

    // Priority 9: Typo Tolerance / Fuzzy Matching
    // Only applied if no prefix or substring match was found, query is at least 4 chars long, and query does not contain numbers (dosages/strengths must be exact)
    if (bestScore === Infinity && q.length >= 4 && !/\d/.test(q)) {
      const maxDist = q.length <= 6 ? 1 : 2;
      let matchedFuzzy = false;

      // Check against words in name
      for (const w of nameWords) {
        if (!/\d/.test(w) && Math.abs(w.length - q.length) <= maxDist) {
          const dist = levenshteinDistance(q, w);
          if (dist <= maxDist) {
            matchedFuzzy = true;
            bestScore = 90 + dist;
            break;
          }
        }
      }

      // Check against words in generic name if still unmatched
      if (!matchedFuzzy) {
        for (const w of genericWords) {
          if (!/\d/.test(w) && Math.abs(w.length - q.length) <= maxDist) {
            const dist = levenshteinDistance(q, w);
            if (dist <= maxDist) {
              matchedFuzzy = true;
              bestScore = 95 + dist;
              break;
            }
          }
        }
      }
    }

    // If matched at any priority level
    if (bestScore < Infinity) {
      // Category-Aware Search: Boost items matching the active category
      if (category && p.category === category) {
        bestScore -= 5;
      }

      scored.push({ product: p, score: bestScore });
    }
  }

  // Sort by score ascending, then by sort criteria or A-Z name
  scored.sort((a, b) => {
    if (a.score !== b.score) return a.score - b.score;
    return (a.product.name || "").localeCompare(b.product.name || "", undefined, { sensitivity: "base" });
  });

  const results = scored.map(s => s.product);
  return limit ? results.slice(0, limit) : results;
}

// Prescriptions Desk Seed Data
const INITIAL_PRESCRIPTIONS = [
  {
    id: "BC-RX-0041",
    prescriptionNumber: "BC-RX-0041",
    customerId: "usr-demo-customer",
    customerName: "Grace Nakato",
    customerPhone: "0751234567",
    fileUrl: "prescription-scan-0041.pdf",
    notes: "Amoxicillin 500mg TDS x 5 days for acute dental infection",
    status: "Approved",
    reviewNotes: "Verified with prescribing dentist Dr. Sematimba. Dosage appropriate.",
    reviewedBy: "Dr. Amina Nanyonga",
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
  },
  {
    id: "BC-RX-0089",
    prescriptionNumber: "BC-RX-0089",
    customerId: "usr-demo-customer",
    customerName: "Grace Nakato",
    customerPhone: "0751234567",
    fileUrl: "prescription-scan-0089.pdf",
    notes: "Amlodipine 5mg once daily maintenance for hypertension",
    status: "Pending Review",
    reviewNotes: "Awaiting pharmacist safety verification against previous records.",
    reviewedBy: null,
    createdAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: "BC-RX-0092",
    prescriptionNumber: "BC-RX-0092",
    customerId: "cust-2",
    customerName: "David Mukasa",
    customerPhone: "0772334455",
    fileUrl: "prescription-scan-0092.pdf",
    notes: "Metformin 500mg BD + Losartan Potassium 50mg OD x 30 days",
    status: "Approved",
    reviewNotes: "Verified clinical prescription from Mulago National Referral Hospital.",
    reviewedBy: "Dr. Amina Nanyonga",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: "BC-RX-0095",
    prescriptionNumber: "BC-RX-0095",
    customerId: "cust-3",
    customerName: "Florence Kembabazi",
    customerPhone: "0701889900",
    fileUrl: "prescription-scan-0095.pdf",
    notes: "Salbutamol Inhaler 100mcg prn + Beclomethasone Inhaler 200mcg BD",
    status: "Under Review",
    reviewNotes: "Pharmacist checking inhaler technique history and patient profile.",
    reviewedBy: "Pharm. David Mukasa",
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString()
  },
  {
    id: "BC-RX-0098",
    prescriptionNumber: "BC-RX-0098",
    customerId: "cust-4",
    customerName: "Joseph Okello",
    customerPhone: "0782112233",
    fileUrl: "prescription-scan-0098.pdf",
    notes: "Atorvastatin 20mg nocte x 30 days for hypercholesterolemia",
    status: "Approved",
    reviewNotes: "Lipid profile verified. Dispensing authorized.",
    reviewedBy: "Dr. Amina Nanyonga",
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString()
  },
  {
    id: "BC-RX-0103",
    prescriptionNumber: "BC-RX-0103",
    customerId: "cust-5",
    customerName: "Dr. Brian Tumusiime",
    customerPhone: "0755443322",
    fileUrl: "prescription-scan-0103.pdf",
    notes: "Diclofenac Sodium 50mg BD + Omeprazole 20mg OD x 7 days post-arthroscopy",
    status: "Approved",
    reviewNotes: "Gastro-protection confirmed with co-prescribed proton pump inhibitor.",
    reviewedBy: "Pharm. David Mukasa",
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
  }
];

// Clinical Consultations Seed Data
const INITIAL_CONSULTATIONS = [
  {
    id: "BC-CNS-20260905-88191",
    consultationNumber: "BC-CNS-20260905-88191",
    customerId: "usr-demo-customer",
    customerName: "Grace Nakato",
    customerPhone: "0751234567",
    pharmacist: "Dr. Amina Nanyonga",
    date: "2026-09-05",
    time: "11:00 AM",
    reason: "Dosage guidance for daily multivitamins with blood pressure medication.",
    fee: 15000,
    paymentMethod: "Airtel Money",
    paymentPhone: "0751234567",
    paymentStatus: "Paid",
    bookingStatus: "Confirmed",
    status: "Confirmed",
    transactionId: "MM-UGX-8819A1",
    clinicalNotes: "Virtual counseling session scheduled. Review interaction between calcium supplements and Amlodipine.",
    createdAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: "BC-CNS-20260906-88202",
    consultationNumber: "BC-CNS-20260906-88202",
    customerId: "cust-2",
    customerName: "David Mukasa",
    customerPhone: "0772334455",
    pharmacist: "Pharm. David Mukasa",
    date: "2026-09-06",
    time: "02:00 PM",
    reason: "Managing type 2 diabetes medications and gastrointestinal tolerance of Metformin.",
    fee: 15000,
    paymentMethod: "MTN Mobile Money",
    paymentPhone: "0772334455",
    paymentStatus: "Paid",
    bookingStatus: "Confirmed",
    status: "Confirmed",
    transactionId: "MM-UGX-8820B2",
    clinicalNotes: "Patient advised to take Metformin with meals. Follow-up consultation scheduled.",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: "BC-CNS-20260907-88213",
    consultationNumber: "BC-CNS-20260907-88213",
    customerId: "cust-3",
    customerName: "Florence Kembabazi",
    customerPhone: "0701889900",
    pharmacist: "Sarah Namusoke",
    date: "2026-09-07",
    time: "09:30 AM",
    reason: "Inhaler technique demonstration and asthma trigger management during dusty seasons.",
    fee: 15000,
    paymentMethod: "Airtel Money",
    paymentPhone: "0701889900",
    paymentStatus: "Pending",
    bookingStatus: "Pending Payment",
    status: "Pending Payment",
    transactionId: null,
    clinicalNotes: "Pending payment confirmation from customer before session begins.",
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString()
  },
  {
    id: "BC-CNS-20260830-88224",
    consultationNumber: "BC-CNS-20260830-88224",
    customerId: "cust-4",
    customerName: "Joseph Okello",
    customerPhone: "0782112233",
    pharmacist: "Dr. Amina Nanyonga",
    date: "2026-08-30",
    time: "04:00 PM",
    reason: "Lipid management therapy review and dietary guidance with Atorvastatin.",
    fee: 15000,
    paymentMethod: "MTN Mobile Money",
    paymentPhone: "0782112233",
    paymentStatus: "Paid",
    bookingStatus: "Confirmed",
    status: "Completed",
    transactionId: "MM-UGX-8822C4",
    clinicalNotes: "Patient counseled on avoiding grapefruit juice. Liver function test monitoring recommended in 3 months.",
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString()
  },
  {
    id: "BC-CNS-20260908-88235",
    consultationNumber: "BC-CNS-20260908-88235",
    customerId: "cust-6",
    customerName: "Aisha Nabawanuka",
    customerPhone: "0702667788",
    pharmacist: "Dr. Amina Nanyonga",
    date: "2026-09-08",
    time: "10:00 AM",
    reason: "First trimester prenatal supplement schedule and nausea relief.",
    fee: 15000,
    paymentMethod: "Airtel Money",
    paymentPhone: "0702667788",
    paymentStatus: "Paid",
    bookingStatus: "Confirmed",
    status: "Confirmed",
    transactionId: "MM-UGX-8823D5",
    clinicalNotes: "Prenatal nutrition counseling planned with Pregnacare regimen.",
    createdAt: new Date(Date.now() - 3600000 * 14).toISOString()
  },
  {
    id: "BC-CNS-20260825-88246",
    consultationNumber: "BC-CNS-20260825-88246",
    customerId: "usr-demo-customer",
    customerName: "Grace Nakato",
    customerPhone: "0751234567",
    pharmacist: "Pharm. David Mukasa",
    date: "2026-08-25",
    time: "03:00 PM",
    reason: "Post-dental extraction antibiotic completion counseling.",
    fee: 15000,
    paymentMethod: "Airtel Money",
    paymentPhone: "0751234567",
    paymentStatus: "Paid",
    bookingStatus: "Confirmed",
    status: "Completed",
    transactionId: "MM-UGX-8824E6",
    clinicalNotes: "Patient successfully completed Amoxicillin 5-day course with zero adverse events.",
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString()
  }
];

// Medicine Refills Seed Data
const INITIAL_REFILLS = [
  {
    id: "BC-REF-101",
    refillNumber: "BC-REF-101",
    customerId: "usr-demo-customer",
    customerName: "Grace Nakato",
    customerPhone: "0751234567",
    medicineName: "Amlodipine 5mg Tablets",
    quantity: 2,
    address: "Plot 14, Kiyanja Road, Kamukuzi, Mbarara City",
    status: "Approved",
    reviewNotes: "Maintenance blood pressure prescription verified on file. Authorized for repeat dispensing.",
    reviewedBy: "Dr. Amina Nanyonga",
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
  },
  {
    id: "BC-REF-102",
    refillNumber: "BC-REF-102",
    customerId: "usr-demo-customer",
    customerName: "Grace Nakato",
    customerPhone: "0751234567",
    medicineName: "Metformin 500mg Tablets",
    quantity: 2,
    address: "Plot 14, Kiyanja Road, Kamukuzi, Mbarara City",
    status: "Approved",
    reviewNotes: "Prescription on file verified. Authorized for doorstep fulfillment.",
    reviewedBy: "Pharm. David Mukasa",
    createdAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: "BC-REF-103",
    refillNumber: "BC-REF-103",
    customerId: "cust-2",
    customerName: "David Mukasa",
    customerPhone: "0772334455",
    medicineName: "Losartan Potassium 50mg Tablets",
    quantity: 1,
    address: "Ntinda, Kimera Road, Kampala",
    status: "Approved",
    reviewNotes: "Monthly maintenance supply confirmed.",
    reviewedBy: "Dr. Amina Nanyonga",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: "BC-REF-104",
    refillNumber: "BC-REF-104",
    customerId: "cust-3",
    customerName: "Florence Kembabazi",
    customerPhone: "0701889900",
    medicineName: "Salbutamol Inhaler 100mcg",
    quantity: 1,
    address: "Kololo, Upper Kololo Terrace, Kampala",
    status: "Pending",
    reviewNotes: "Awaiting clinical verification by duty pharmacist.",
    reviewedBy: null,
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString()
  },
  {
    id: "BC-REF-105",
    refillNumber: "BC-REF-105",
    customerId: "cust-4",
    customerName: "Joseph Okello",
    customerPhone: "0782112233",
    medicineName: "Atorvastatin 20mg Tablets",
    quantity: 2,
    address: "Bugolobi, Luthuli Avenue, Kampala",
    status: "Approved",
    reviewNotes: "Verified against Dr. Tumusiime clinical order.",
    reviewedBy: "Pharm. David Mukasa",
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString()
  },
  {
    id: "BC-REF-106",
    refillNumber: "BC-REF-106",
    customerId: "cust-6",
    customerName: "Aisha Nabawanuka",
    customerPhone: "0702667788",
    medicineName: "Pregnacare Prenatal Multivitamins",
    quantity: 1,
    address: "Muyenga, Tank Hill Road, Kampala",
    status: "Approved",
    reviewNotes: "Regular prenatal refill authorized.",
    reviewedBy: "Sarah Namusoke",
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
  }
];

// Orders Demo with 6-stage status tracking
const INITIAL_ORDERS = [
  {
    id: "BC-ORD-0041",
    orderNumber: "BC-ORD-0041",
    customerId: "usr-demo-customer",
    customerName: "Grace Nakato",
    customerPhone: "0751234567",
    customerEmail: "grace.nakato@example.com",
    fulfillmentType: "delivery",
    deliveryDivision: "Kamukuzi",
    deliveryArea: "Kiyanja",
    specificLocation: "Plot 14, Kiyanja Road",
    landmark: "Near Kiyanja Market",
    deliveryInstructions: "Blue gate opposite shop",
    deliveryAddress: "Kiyanja, Kamukuzi, Mbarara City (Plot 14, Kiyanja Road • Near Kiyanja Market)",
    deliveryCity: "Mbarara City",
    items: [
      { productId: "BC-PROD-001", name: "Paracetamol 500mg Tablets", quantity: 2, price: 5000 },
      { productId: "BC-PROD-008", name: "Vitamin C 500mg Chewable", quantity: 1, price: 12000 }
    ],
    subtotal: 22000,
    deliveryFee: 5000,
    total: 27000,
    paymentMethod: "MTN MoMo",
    paymentStatus: "Successful",
    paymentReference: "MM-981244",
    orderStatus: "Delivered",
    assignedStaff: "Moses Kato",
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
  },
  {
    id: "BC-ORD-0042",
    orderNumber: "BC-ORD-0042",
    customerId: "cust-2",
    customerName: "David Mukasa",
    customerPhone: "0772334455",
    customerEmail: "david.m@example.com",
    fulfillmentType: "delivery",
    deliveryDivision: "Kakoba",
    deliveryArea: "Nyamityobora",
    specificLocation: "Buremba Road",
    landmark: "Near Nyamityobora Mosque",
    deliveryInstructions: "Call upon arrival",
    deliveryAddress: "Nyamityobora, Kakoba, Mbarara City (Buremba Road • Near Nyamityobora Mosque)",
    deliveryCity: "Mbarara City",
    items: [
      { productId: "BC-PROD-015", name: "Emergency First Aid Kit (60pcs)", quantity: 1, price: 65000 }
    ],
    subtotal: 65000,
    deliveryFee: 5000,
    total: 70000,
    paymentMethod: "Airtel Money",
    paymentStatus: "Successful",
    paymentReference: "AM-441902",
    orderStatus: "Out for Delivery",
    assignedStaff: "Moses Kato",
    createdAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: "BC-ORD-0043",
    orderNumber: "BC-ORD-0043",
    customerId: "usr-demo-customer",
    customerName: "Grace Nakato",
    customerPhone: "0751234567",
    customerEmail: "grace.nakato@example.com",
    fulfillmentType: "pickup",
    deliveryDivision: "Kamukuzi",
    deliveryArea: "Booma",
    deliveryAddress: "BloomCare Pharmacy Main Dispensary, Near Mbarara Regional Referral Hospital, Opposite Rubis Station, Near Mbarara Central Police Station, Mbarara City",
    deliveryCity: "Mbarara City",
    items: [
      { productId: "BC-PROD-005", name: "Amoxicillin Capsules 500mg", quantity: 1, price: 18000 }
    ],
    subtotal: 18000,
    deliveryFee: 0,
    total: 18000,
    paymentMethod: "MTN MoMo",
    paymentStatus: "Successful",
    paymentReference: "MM-884120",
    orderStatus: "Ready for Pickup",
    assignedStaff: "Sarah Namusoke",
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    id: "BC-ORD-0044",
    orderNumber: "BC-ORD-0044",
    customerId: "cust-3",
    customerName: "Florence Kembabazi",
    customerPhone: "0701889900",
    customerEmail: "florence.k@example.com",
    fulfillmentType: "delivery",
    deliveryDivision: "Nyamitanga",
    deliveryArea: "Rwebikoona",
    specificLocation: "Plot 8 Rwebikoona Road",
    landmark: "Rwebikoona Market",
    deliveryInstructions: "Leave with front desk",
    deliveryAddress: "Rwebikoona, Nyamitanga, Mbarara City (Plot 8 Rwebikoona Road • Near Rwebikoona Market)",
    deliveryCity: "Mbarara City",
    items: [
      { productId: "BC-PROD-031", name: "Salbutamol Inhaler 100mcg", quantity: 2, price: 22000 },
      { productId: "BC-PROD-033", name: "Cetirizine 10mg Tablets", quantity: 1, price: 8500 }
    ],
    subtotal: 52500,
    deliveryFee: 5000,
    total: 57500,
    paymentMethod: "MTN MoMo",
    paymentStatus: "Successful",
    paymentReference: "MM-331908",
    orderStatus: "Processing",
    assignedStaff: "Emmanuel Otim",
    createdAt: new Date(Date.now() - 3600000 * 7).toISOString()
  },
  {
    id: "BC-ORD-0045",
    orderNumber: "BC-ORD-0045",
    customerId: "cust-4",
    customerName: "Joseph Okello",
    customerPhone: "0782112233",
    customerEmail: "joseph.o@example.com",
    fulfillmentType: "delivery",
    deliveryDivision: "Kakiika",
    deliveryArea: "Makenke",
    specificLocation: "Makenke Trading Centre",
    landmark: "Opposite Makenke Barracks",
    deliveryInstructions: "Ring bell at black gate",
    deliveryAddress: "Makenke, Kakiika, Mbarara City (Makenke Trading Centre • Near Opposite Makenke Barracks)",
    deliveryCity: "Mbarara City",
    items: [
      { productId: "BC-PROD-036", name: "Omron M2 Blood Pressure Monitor", quantity: 1, price: 185000 }
    ],
    subtotal: 185000,
    deliveryFee: 5000,
    total: 190000,
    paymentMethod: "Airtel Money",
    paymentStatus: "Successful",
    paymentReference: "AM-772819",
    orderStatus: "Confirmed",
    assignedStaff: "Emmanuel Otim",
    createdAt: new Date(Date.now() - 3600000 * 9).toISOString()
  },
  {
    id: "BC-ORD-0046",
    orderNumber: "BC-ORD-0046",
    customerId: "cust-6",
    customerName: "Aisha Nabawanuka",
    customerPhone: "0702667788",
    customerEmail: "aisha.n@example.com",
    fulfillmentType: "delivery",
    deliveryDivision: "Biharwe",
    deliveryArea: "Biharwe Central",
    specificLocation: "Near Eclipse Monument",
    landmark: "1520 AD Eclipse Monument",
    deliveryInstructions: "Call 0702667788 on approach",
    deliveryAddress: "Biharwe Central, Biharwe, Mbarara City (Near 1520 AD Eclipse Monument)",
    deliveryCity: "Mbarara City",
    items: [
      { productId: "BC-PROD-025", name: "Pregnacare Prenatal Multivitamins", quantity: 1, price: 38000 },
      { productId: "BC-PROD-024", name: "Folic Acid 5mg Tablets", quantity: 1, price: 7000 }
    ],
    subtotal: 45000,
    deliveryFee: 5000,
    total: 50000,
    paymentMethod: "MTN MoMo",
    paymentStatus: "Successful",
    paymentReference: "MM-665120",
    orderStatus: "Awaiting Prescription Review",
    assignedStaff: "Sarah Namusoke",
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString()
  },
  {
    id: "BC-ORD-0047",
    orderNumber: "BC-ORD-0047",
    customerId: "cust-5",
    customerName: "Dr. Brian Tumusiime",
    customerPhone: "0755443322",
    customerEmail: "brian.t@example.com",
    fulfillmentType: "delivery",
    deliveryDivision: "Nyakayojo",
    deliveryArea: "Katojo",
    specificLocation: "Katojo Trading Centre",
    landmark: "Katojo Clinic",
    deliveryInstructions: "Deliver directly to consultation room",
    deliveryAddress: "Katojo, Nyakayojo, Mbarara City (Katojo Trading Centre)",
    deliveryCity: "Mbarara City",
    items: [
      { productId: "BC-PROD-038", name: "Pure Marine Collagen Powder 200g", quantity: 1, price: 75000 }
    ],
    subtotal: 75000,
    deliveryFee: 5000,
    total: 80000,
    paymentMethod: "Cash on Delivery",
    paymentStatus: "Pending",
    paymentReference: "COD-BC-ORD-0047",
    orderStatus: "Delivered",
    assignedStaff: "Moses Kato",
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString()
  },
  {
    id: "BC-ORD-0048",
    orderNumber: "BC-ORD-0048",
    customerId: "usr-demo-customer",
    customerName: "Grace Nakato",
    customerPhone: "0751234567",
    customerEmail: "grace.nakato@example.com",
    fulfillmentType: "delivery",
    deliveryDivision: "Kamukuzi",
    deliveryArea: "Kiyanja",
    specificLocation: "Plot 14, Kiyanja Road",
    landmark: "Near Kiyanja Market",
    deliveryInstructions: "Call when at gate",
    deliveryAddress: "Kiyanja, Kamukuzi, Mbarara City (Plot 14, Kiyanja Road)",
    deliveryCity: "Mbarara City",
    items: [
      { productId: "BC-PROD-012", name: "Ibuprofen 400mg Tablets", quantity: 2, price: 6000 },
      { productId: "BC-PROD-019", name: "Oral Rehydration Salts (ORS)", quantity: 5, price: 5000 }
    ],
    subtotal: 32000,
    deliveryFee: 5000,
    total: 37000,
    paymentMethod: "MTN MoMo",
    paymentStatus: "Successful",
    paymentReference: "MM-990145",
    orderStatus: "Processing",
    assignedStaff: "Moses Kato",
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: "BC-SALE-20260905-0101",
    orderNumber: "BC-SALE-20260905-0101",
    customerId: "walkin-customer-1",
    customerName: "Walk-in Customer",
    customerPhone: "0772111222",
    saleSource: "WALK_IN",
    fulfillmentType: "counter_sale",
    deliveryAddress: "BloomCare Main Dispensary Counter",
    deliveryCity: "Mbarara City",
    items: [
      { productId: "BC-PROD-001", name: "Paracetamol 500mg Tablets", quantity: 2, price: 5000 },
      { productId: "BC-PROD-033", name: "Cetirizine 10mg Tablets", quantity: 1, price: 8500 }
    ],
    subtotal: 18500,
    deliveryFee: 0,
    discountAmount: 0,
    total: 18500,
    paymentMethod: "Cash",
    paymentStatus: "Paid",
    paymentReference: "CASH-20260905-0101",
    orderStatus: "Completed",
    staffName: "Dr. Amina Nanyonga",
    staffRole: "Pharmacist",
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString()
  },
  {
    id: "BC-SALE-20260905-0102",
    orderNumber: "BC-SALE-20260905-0102",
    customerId: "walkin-customer-2",
    customerName: "James Tumusiime",
    customerPhone: "0752334455",
    saleSource: "WALK_IN",
    fulfillmentType: "counter_sale",
    deliveryAddress: "BloomCare Main Dispensary Counter",
    deliveryCity: "Mbarara City",
    items: [
      { productId: "BC-PROD-005", name: "Amoxicillin Capsules 500mg", quantity: 2, price: 18000 }
    ],
    subtotal: 36000,
    deliveryFee: 0,
    discountAmount: 0,
    total: 36000,
    paymentMethod: "Cash",
    paymentStatus: "Paid",
    paymentReference: "CASH-20260905-0102",
    orderStatus: "Completed",
    staffName: "Dr. Amina Nanyonga",
    staffRole: "Pharmacist",
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString()
  },
  {
    id: "BC-SALE-20260905-0103",
    orderNumber: "BC-SALE-20260905-0103",
    customerId: "walkin-customer-3",
    customerName: "Mary Kigozi",
    customerPhone: "0788445566",
    saleSource: "WALK_IN",
    fulfillmentType: "counter_sale",
    deliveryAddress: "BloomCare Main Dispensary Counter",
    deliveryCity: "Mbarara City",
    items: [
      { productId: "BC-PROD-036", name: "Omron M2 Blood Pressure Monitor", quantity: 1, price: 185000 }
    ],
    subtotal: 185000,
    deliveryFee: 0,
    discountAmount: 5000,
    total: 180000,
    paymentMethod: "MTN Mobile Money",
    paymentStatus: "Paid",
    paymentReference: "MM-WALK-881920",
    orderStatus: "Completed",
    staffName: "Pharm. David Mukasa",
    staffRole: "Pharmacist",
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    id: "BC-SALE-20260905-0104",
    orderNumber: "BC-SALE-20260905-0104",
    customerId: "walkin-customer-4",
    customerName: "Walk-in Customer",
    customerPhone: "",
    saleSource: "WALK_IN",
    fulfillmentType: "counter_sale",
    deliveryAddress: "BloomCare Main Dispensary Counter",
    deliveryCity: "Mbarara City",
    items: [
      { productId: "BC-PROD-012", name: "Ibuprofen 400mg Tablets", quantity: 2, price: 6000 },
      { productId: "BC-PROD-019", name: "Oral Rehydration Salts (ORS)", quantity: 3, price: 5000 }
    ],
    subtotal: 27000,
    deliveryFee: 0,
    discountAmount: 0,
    total: 27000,
    paymentMethod: "Cash",
    paymentStatus: "Paid",
    paymentReference: "CASH-20260905-0104",
    orderStatus: "Completed",
    staffName: "Dr. Amina Nanyonga",
    staffRole: "Pharmacist",
    createdAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: "BC-SALE-20260905-0105",
    orderNumber: "BC-SALE-20260905-0105",
    customerId: "walkin-customer-5",
    customerName: "Kato Paul",
    customerPhone: "0703998877",
    saleSource: "WALK_IN",
    fulfillmentType: "counter_sale",
    deliveryAddress: "BloomCare Main Dispensary Counter",
    deliveryCity: "Mbarara City",
    items: [
      { productId: "BC-PROD-015", name: "Emergency First Aid Kit (60pcs)", quantity: 1, price: 65000 }
    ],
    subtotal: 65000,
    deliveryFee: 0,
    discountAmount: 0,
    total: 65000,
    paymentMethod: "Airtel Money",
    paymentStatus: "Paid",
    paymentReference: "AM-WALK-334190",
    orderStatus: "Completed",
    staffName: "Pharm. David Mukasa",
    staffRole: "Pharmacist",
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
  }
];

// Centralized Canonical Role System
export const ROLES = {
  DEVELOPER: "developer",
  ADMIN: "admin",
  PHARMACIST: "pharmacist",
  ASSISTANT_PHARMACIST: "assistant_pharmacist",
  DELIVERY_PERSON: "delivery_person",
  CUSTOMER: "customer"
};

export const VALID_ROLES = Object.values(ROLES);

// 1. Role Security Hierarchy (Clearance Levels: 100 root down to 0 visitor)
export const ROLE_HIERARCHY = {
  developer: 100,
  admin: 80,
  pharmacist: 60,
  assistant_pharmacist: 40,
  delivery_person: 20,
  customer: 10,
  visitor: 0
};

// 2. Granular Permissions Capabilities
export const PERMISSIONS = {
  // Storefront & Purchasing
  CATALOG_BROWSE: "catalog:browse",
  CART_CHECKOUT: "cart:checkout",
  ORDER_VIEW_OWN: "order:view_own",
  ORDER_CANCEL_OWN: "order:cancel_own",
  
  // Clinical Prescriptions & Consultations
  PRESCRIPTION_UPLOAD: "prescription:upload",
  PRESCRIPTION_VIEW_OWN: "prescription:view_own",
  PRESCRIPTION_VIEW_ALL: "prescription:view_all",
  PRESCRIPTION_CLINICAL_REVIEW: "prescription:clinical_review", // Pharmacist / Admin clinical safety gate
  CONSULTATION_BOOK: "consultation:book",
  CONSULTATION_PROVIDE: "consultation:provide",
  
  // Inventory, Dispensing & Packing
  INVENTORY_VIEW: "inventory:view",
  INVENTORY_ADJUST: "inventory:adjust",
  MEDICINE_MANAGE: "medicine:manage",
  ORDER_PACK: "order:pack",
  
  // Doorstep Delivery & Logistics
  ORDER_DISPATCH: "order:dispatch",
  ORDER_DELIVER: "order:deliver",
  
  // Administration & Governance
  USER_VIEW: "user:view",
  USER_MANAGE: "user:manage",
  REPORTS_VIEW: "reports:view",
  SYSTEM_SETTINGS: "system:settings",
  DEVELOPER_SIMULATE: "developer:simulate",

  // Point of Sale & Physical Counter Sales
  SALE_CREATE_WALKIN: "sale:create_walkin"
};

// 3. Complete Role Permission Mapping
export const ROLE_PERMISSIONS = {
  developer: Object.values(PERMISSIONS), // Root: full access to all features
  admin: [
    PERMISSIONS.CATALOG_BROWSE,
    PERMISSIONS.CART_CHECKOUT,
    PERMISSIONS.ORDER_VIEW_OWN,
    PERMISSIONS.PRESCRIPTION_VIEW_ALL,
    PERMISSIONS.PRESCRIPTION_CLINICAL_REVIEW,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.INVENTORY_ADJUST,
    PERMISSIONS.MEDICINE_MANAGE,
    PERMISSIONS.ORDER_PACK,
    PERMISSIONS.ORDER_DISPATCH,
    PERMISSIONS.ORDER_DELIVER,
    PERMISSIONS.USER_VIEW,
    PERMISSIONS.USER_MANAGE,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.SYSTEM_SETTINGS,
    PERMISSIONS.SALE_CREATE_WALKIN
  ],
  pharmacist: [
    PERMISSIONS.CATALOG_BROWSE,
    PERMISSIONS.PRESCRIPTION_VIEW_ALL,
    PERMISSIONS.PRESCRIPTION_CLINICAL_REVIEW,
    PERMISSIONS.CONSULTATION_PROVIDE,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.INVENTORY_ADJUST,
    PERMISSIONS.MEDICINE_MANAGE,
    PERMISSIONS.ORDER_PACK,
    PERMISSIONS.SALE_CREATE_WALKIN
  ],
  assistant_pharmacist: [
    PERMISSIONS.CATALOG_BROWSE,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.INVENTORY_ADJUST,
    PERMISSIONS.ORDER_PACK,
    PERMISSIONS.SALE_CREATE_WALKIN
  ],
  delivery_person: [
    PERMISSIONS.CATALOG_BROWSE,
    PERMISSIONS.ORDER_DISPATCH,
    PERMISSIONS.ORDER_DELIVER
  ],
  customer: [
    PERMISSIONS.CATALOG_BROWSE,
    PERMISSIONS.CART_CHECKOUT,
    PERMISSIONS.ORDER_VIEW_OWN,
    PERMISSIONS.ORDER_CANCEL_OWN,
    PERMISSIONS.PRESCRIPTION_UPLOAD,
    PERMISSIONS.PRESCRIPTION_VIEW_OWN,
    PERMISSIONS.CONSULTATION_BOOK
  ],
  visitor: [
    PERMISSIONS.CATALOG_BROWSE
  ]
};

// 4. Role Hierarchy Helpers
export function isAtLeastRole(requiredRole, currentRole = getEffectiveRole()) {
  const currentLevel = ROLE_HIERARCHY[normalizeRole(currentRole)] ?? 0;
  const requiredLevel = ROLE_HIERARCHY[normalizeRole(requiredRole)] ?? 0;
  return currentLevel >= requiredLevel;
}

export function canManageRole(actorRole, targetRole) {
  const actorLevel = ROLE_HIERARCHY[normalizeRole(actorRole)] ?? 0;
  const targetLevel = ROLE_HIERARCHY[normalizeRole(targetRole)] ?? 0;
  // A role can only edit/assign roles strictly lower than its own clearance
  return actorLevel > targetLevel;
}

export function hasPermission(permission, role = getEffectiveRole()) {
  const norm = normalizeRole(role) || "visitor";
  const perms = ROLE_PERMISSIONS[norm] || [];
  return perms.includes(permission);
}

export function userHasPermission(user, permission) {
  if (!user) return false;
  const role = normalizeRole(user.role);
  if (role === "developer" || role === "admin") return true;
  if (user.permissions && Array.isArray(user.permissions)) {
    if (user.permissions.includes("all")) return true;
    if (user.permissions.includes(`!${permission}`)) return false;
    if (user.permissions.includes(permission)) return true;
  }
  return hasPermission(permission, role);
}

// 5. Pharmacy Workflow State Transition Logic (State Machine)
export const ALLOWED_ORDER_TRANSITIONS = {
  "Pending": {
    allowedNext: ["Prescription Required", "Awaiting Prescription Review", "Processing", "Cancelled"],
    allowedRoles: {
      "Awaiting Prescription Review": ["developer", "admin", "pharmacist", "customer"],
      "Processing": ["developer", "admin", "pharmacist", "assistant_pharmacist"],
      "Cancelled": ["developer", "admin", "pharmacist", "customer"]
    }
  },
  "Prescription Required": {
    allowedNext: ["Prescription Submitted", "Cancelled"],
    allowedRoles: {
      "Prescription Submitted": ["customer", "developer", "admin", "pharmacist"],
      "Cancelled": ["customer", "developer", "admin", "pharmacist"]
    }
  },
  "Prescription Submitted": {
    allowedNext: ["Prescription Under Review", "Cancelled"],
    allowedRoles: {
      "Prescription Under Review": ["developer", "admin", "pharmacist"],
      "Cancelled": ["developer", "admin", "pharmacist"]
    }
  },
  "Prescription Under Review": {
    allowedNext: ["Prescription Approved", "Prescription Rejected", "Cancelled"],
    allowedRoles: {
      "Prescription Approved": ["developer", "admin", "pharmacist"],
      "Prescription Rejected": ["developer", "admin", "pharmacist"],
      "Cancelled": ["developer", "admin", "pharmacist"]
    }
  },
  "Prescription Approved": {
    allowedNext: ["Ready for Processing", "Cancelled"],
    allowedRoles: {
      "Ready for Processing": ["developer", "admin", "pharmacist"],
      "Cancelled": ["developer", "admin", "pharmacist"]
    }
  },
  "Prescription Rejected": {
    allowedNext: ["Cancelled"],
    allowedRoles: { "Cancelled": ["developer", "admin", "pharmacist"] }
  },
  "Ready for Processing": {
    allowedNext: ["Processing", "Cancelled"],
    allowedRoles: {
      "Processing": ["developer", "admin", "pharmacist", "assistant_pharmacist"],
      "Cancelled": ["developer", "admin", "pharmacist"]
    }
  },
  "Awaiting Prescription Review": {
    allowedNext: ["Confirmed", "Cancelled"],
    allowedRoles: {
      "Confirmed": ["developer", "admin", "pharmacist"], // Clinical safety gate!
      "Cancelled": ["developer", "admin", "pharmacist"]
    }
  },
  "Confirmed": {
    allowedNext: ["Processing", "Cancelled"],
    allowedRoles: {
      "Processing": ["developer", "admin", "pharmacist", "assistant_pharmacist"],
      "Cancelled": ["developer", "admin", "pharmacist"]
    }
  },
  "Processing": {
    allowedNext: ["Ready for Pickup", "Out for Delivery", "Cancelled"],
    allowedRoles: {
      "Ready for Pickup": ["developer", "admin", "pharmacist", "assistant_pharmacist"],
      "Out for Delivery": ["developer", "admin", "pharmacist", "delivery_person"],
      "Cancelled": ["developer", "admin"]
    }
  },
  "Ready for Pickup": {
    allowedNext: ["Delivered", "Cancelled"],
    allowedRoles: {
      "Delivered": ["developer", "admin", "pharmacist", "assistant_pharmacist"],
      "Cancelled": ["developer", "admin"]
    }
  },
  "Out for Delivery": {
    allowedNext: ["Delivered", "Cancelled"],
    allowedRoles: {
      "Delivered": ["developer", "admin", "delivery_person"], // Doorstep fulfillment gate!
      "Cancelled": ["developer", "admin"]
    }
  },
  "Delivered": {
    allowedNext: [],
    allowedRoles: {}
  },
  "Cancelled": {
    allowedNext: [],
    allowedRoles: {}
  }
};

export function canTransitionOrderStatus(currentStatus, targetStatus, role = getEffectiveRole()) {
  const normRole = normalizeRole(role);
  const transition = ALLOWED_ORDER_TRANSITIONS[currentStatus];
  if (!transition) return { allowed: false, reason: `Unknown order status: ${currentStatus}` };

  if (!transition.allowedNext.includes(targetStatus)) {
    return {
      allowed: false,
      reason: `Cannot transition order directly from "${currentStatus}" to "${targetStatus}".`
    };
  }

  const allowedRoles = transition.allowedRoles[targetStatus] || [];
  if (!allowedRoles.includes(normRole)) {
    return {
      allowed: false,
      reason: `Action Denied: Only ${allowedRoles.map(formatRoleName).join(" or ")} can change order status to "${targetStatus}".`
    };
  }

  return { allowed: true };
}

// 6. Contextual Resource Authorization (Data Isolation Logic)
export function canAccessResource(user, resourceType, resource, action = "read") {
  if (!user) return action === "read" && resourceType === "product";
  const role = normalizeRole(user.role);

  // Developers & Admins have full oversight
  if (role === "developer" || role === "admin") return true;

  if (resourceType === "order") {
    if (role === "customer") {
      return resource.customerId === user.uid || (user.email && resource.customerEmail === user.email);
    }
    if (role === "delivery_person") {
      return resource.deliveryStaffId === user.uid || resource.assignedStaff === user.displayName || resource.assignedStaff === user.name || resource.orderStatus === "Out for Delivery" || resource.orderStatus === "Ready for Pickup";
    }
    if (role === "pharmacist" || role === "assistant_pharmacist") return true;
  }

  if (resourceType === "prescription") {
    if (role === "customer") {
      return resource.customerId === user.uid || (user.email && resource.customerEmail === user.email);
    }
    if (role === "pharmacist") return true;
    if (role === "assistant_pharmacist") {
      // Assistants only view packed items, not confidential clinical reviews
      return action === "read";
    }
    return false;
  }

  if (resourceType === "user") {
    return canManageRole(role, resource.role);
  }

  return false;
}

export const INITIAL_USERS = [
  { id: "usr-dev-001", uid: "usr-dev-001", name: "Lead Systems Developer", displayName: "Lead Systems Developer", email: "dev@bloomcare.com", phone: "0751000999", role: "developer", status: "active", createdAt: "2026-01-01", lastLogin: "2026-09-04 14:32:00", permissions: Object.values(PERMISSIONS) },
  { id: "usr-1", uid: "usr-1", name: "Dr. Admin Mugisha", displayName: "Dr. Admin Mugisha", email: "admin@bloomcare.com", phone: "0700000001", role: "admin", status: "active", createdAt: "2026-01-01", lastLogin: "2026-09-04 15:45:00", permissions: [...ROLE_PERMISSIONS.admin] },
  { id: "usr-2", uid: "usr-2", name: "Dr. Amina Nanyonga", displayName: "Dr. Amina Nanyonga", email: "pharmacist@bloomcare.com", phone: "0700000002", role: "pharmacist", status: "active", createdAt: "2026-01-10", lastLogin: "2026-09-04 11:20:00", permissions: [...ROLE_PERMISSIONS.pharmacist] },
  { id: "usr-2b", uid: "usr-2b", name: "Dr. Amina Nanyonga", displayName: "Dr. Amina Nanyonga", email: "amina.n@bloomcare.com", phone: "0700000002", role: "pharmacist", status: "active", createdAt: "2026-01-10", lastLogin: "2026-09-04 11:20:00", permissions: [...ROLE_PERMISSIONS.pharmacist] },
  { id: "usr-3", uid: "usr-3", name: "Pharm. David Mukasa", displayName: "Pharm. David Mukasa", email: "david.m@bloomcare.com", phone: "0700000003", role: "pharmacist", status: "active", createdAt: "2026-01-15", lastLogin: "2026-09-03 16:10:00", permissions: [...ROLE_PERMISSIONS.pharmacist] },
  { id: "usr-4", uid: "usr-4", name: "Sarah Namusoke", displayName: "Sarah Namusoke", email: "assistant@bloomcare.com", phone: "0700000004", role: "assistant_pharmacist", status: "active", createdAt: "2026-02-01", lastLogin: "2026-09-04 09:30:00", permissions: [...ROLE_PERMISSIONS.assistant_pharmacist] },
  { id: "usr-4b", uid: "usr-4b", name: "Sarah Namusoke", displayName: "Sarah Namusoke", email: "sarah.n@bloomcare.com", phone: "0700000004", role: "assistant_pharmacist", status: "active", createdAt: "2026-02-01", lastLogin: "2026-09-04 09:30:00", permissions: [...ROLE_PERMISSIONS.assistant_pharmacist] },
  { id: "usr-5", uid: "eM6qgrSVjTeTUo62Sa556sKkXpG3", name: "Moses Kato", displayName: "Moses Kato", email: "delivery@bloomcare.com", phone: "0700000005", role: "delivery_person", status: "active", createdAt: "2026-02-10", lastLogin: "2026-09-04 13:45:00", permissions: [...ROLE_PERMISSIONS.delivery_person] },
  { id: "usr-5b", uid: "eM6qgrSVjTeTUo62Sa556sKkXpG3", name: "Moses Kato", displayName: "Moses Kato", email: "moses.k@bloomcare.com", phone: "0700000005", role: "delivery_person", status: "active", createdAt: "2026-02-10", lastLogin: "2026-09-04 13:45:00", permissions: [...ROLE_PERMISSIONS.delivery_person] },
  { id: "usr-6", uid: "usr-6", name: "Emmanuel Otim", displayName: "Emmanuel Otim", email: "emmanuel.o@bloomcare.com", phone: "0700000006", role: "delivery_person", status: "active", createdAt: "2026-02-20", lastLogin: "2026-09-03 17:00:00", permissions: [...ROLE_PERMISSIONS.delivery_person] },
  { id: "usr-cust-demo", uid: "usr-cust-demo", name: "Demo Customer", displayName: "Demo Customer", email: "customer@example.com", phone: "0751234567", role: "customer", status: "active", createdAt: "2026-03-01", lastLogin: "2026-09-06 12:00:00", permissions: [...ROLE_PERMISSIONS.customer] },
  { id: "usr-cust-001", uid: "usr-cust-001", name: "Grace Nakato", displayName: "Grace Nakato", email: "customer@bloomcare.com", phone: "0751234567", role: "customer", status: "active", createdAt: "2026-03-01", lastLogin: "2026-09-04 18:15:00", permissions: [...ROLE_PERMISSIONS.customer] },
  { id: "usr-cust-002", uid: "usr-cust-002", name: "Grace Nakato", displayName: "Grace Nakato", email: "grace.nakato@example.com", phone: "0751234567", role: "customer", status: "active", createdAt: "2026-03-01", lastLogin: "2026-09-04 18:15:00", permissions: [...ROLE_PERMISSIONS.customer] },
  { id: "cust-2", uid: "cust-2", name: "David Mukasa", displayName: "David Mukasa", email: "david.m@example.com", phone: "0772334455", role: "customer", status: "active", createdAt: "2026-03-12", lastLogin: "2026-08-31 10:15:00", permissions: [...ROLE_PERMISSIONS.customer] },
  { id: "cust-3", uid: "cust-3", name: "Florence Kembabazi", displayName: "Florence Kembabazi", email: "florence.k@example.com", phone: "0701889900", role: "customer", status: "active", createdAt: "2026-03-18", lastLogin: "2026-09-01 14:00:00", permissions: [...ROLE_PERMISSIONS.customer] },
  { id: "cust-4", uid: "cust-4", name: "Joseph Okello", displayName: "Joseph Okello", email: "joseph.o@example.com", phone: "0782112233", role: "customer", status: "active", createdAt: "2026-04-02", lastLogin: "2026-09-01 16:30:00", permissions: [...ROLE_PERMISSIONS.customer] },
  { id: "cust-5", uid: "cust-5", name: "Dr. Brian Tumusiime", displayName: "Dr. Brian Tumusiime", email: "brian.t@example.com", phone: "0755443322", role: "customer", status: "active", createdAt: "2026-04-15", lastLogin: "2026-08-27 12:45:00", permissions: [...ROLE_PERMISSIONS.customer] },
  { id: "cust-6", uid: "cust-6", name: "Aisha Nabawanuka", displayName: "Aisha Nabawanuka", email: "aisha.n@example.com", phone: "0702667788", role: "customer", status: "active", createdAt: "2026-05-01", lastLogin: "2026-09-01 11:10:00", permissions: [...ROLE_PERMISSIONS.customer] },
  { id: "usr-suspended-test", uid: "usr-suspended-test", name: "Suspended Test Account", displayName: "Suspended Test Account", email: "suspended@example.com", phone: "0751999888", role: "customer", status: "suspended", suspensionReason: "Terms of service violation review", suspensionDuration: "30_days", suspensionUntil: "2026-10-04", createdAt: "2026-04-10", lastLogin: "2026-08-20 09:00:00", permissions: [...ROLE_PERMISSIONS.customer] }
];

export const INITIAL_AUDIT_LOGS = [
  { id: "audit-001", timestamp: "2026-09-01T10:00:00Z", actorId: "usr-1", actorName: "Dr. Admin Mugisha", actorRole: "admin", action: "USER_CREATE", targetUserId: "usr-cust-001", targetName: "Grace Nakato", details: "Customer account registered and verified", ip: "127.0.0.1" },
  { id: "audit-002", timestamp: "2026-09-02T11:30:00Z", actorId: "usr-1", actorName: "Dr. Admin Mugisha", actorRole: "admin", action: "ROLE_CHANGE", targetUserId: "usr-4", targetName: "Sarah Namusoke", details: "Role confirmed as Assistant Pharmacist", ip: "127.0.0.1" },
  { id: "audit-003", timestamp: "2026-09-03T15:20:00Z", actorId: "usr-1", actorName: "Dr. Admin Mugisha", actorRole: "admin", action: "PERMISSIONS_UPDATE", targetUserId: "usr-2", targetName: "Dr. Amina Nanyonga", details: "Prescription clinical review permissions verified", ip: "127.0.0.1" },
  { id: "audit-004", timestamp: "2026-09-04T09:40:00Z", actorId: "usr-1", actorName: "Dr. Admin Mugisha", actorRole: "admin", action: "USER_SUSPEND", targetUserId: "usr-suspended-test", targetName: "Suspended Test Account", details: "Suspended for 30 days: Terms of service violation review", ip: "127.0.0.1" }
];

export const REGISTERED_CUSTOMERS_CACHE = [];

export function findUserProfile(identifier) {
  if (!identifier) return null;
  const clean = String(identifier).trim().toLowerCase();
  const cleanDigits = clean.replace(/\D/g, "");
  const normUgPhone = normalizeUgandanPhone(clean) || (cleanDigits.length >= 9 ? cleanDigits : null);

  // Helper to match customer record by id, email, or phone
  const checkCustomerMatch = (c) => {
    if (c.uid && c.uid.toLowerCase() === clean) return true;
    if (c.id && c.id.toLowerCase() === clean) return true;
    if (c.email && c.email.toLowerCase() === clean) return true;
    if (c.phone) {
      const cDigits = c.phone.replace(/\D/g, "");
      const cNorm = normalizeUgandanPhone(c.phone) || cDigits;
      if (cleanDigits && cDigits === cleanDigits) return true;
      if (normUgPhone && cNorm === normUgPhone) return true;
    }
    return false;
  };

  // 1. Check Moses Kato aliases
  if (clean === "usr-staff-5" || clean === "usr-5" || clean === "usr-5b") {
    const moses = INITIAL_USERS.find(u => u.email === "delivery@bloomcare.com");
    if (moses) return moses;
  }

  // 1. Check in INITIAL_USERS
  const staff = INITIAL_USERS.find(u => {
    if (u.uid && u.uid.toLowerCase() === clean) return true;
    if (u.id && u.id.toLowerCase() === clean) return true;
    if (u.email && u.email.toLowerCase() === clean) return true;
    if (u.phone) {
      const uDigits = u.phone.replace(/\D/g, "");
      const uNorm = normalizeUgandanPhone(u.phone) || uDigits;
      if (cleanDigits && uDigits === cleanDigits) return true;
      if (normUgPhone && uNorm === normUgPhone) return true;
    }
    return false;
  });
  if (staff) return staff;

  // 2. Check dynamically registered customers from memory cache
  const cachedCust = REGISTERED_CUSTOMERS_CACHE.find(checkCustomerMatch);
  if (cachedCust) {
    return {
      uid: cachedCust.id || cachedCust.uid,
      id: cachedCust.id || cachedCust.uid,
      email: cachedCust.email,
      name: cachedCust.name,
      displayName: cachedCust.name,
      phone: cachedCust.phone,
      password: cachedCust.password,
      role: "customer",
      accountType: cachedCust.accountType || "INDIVIDUAL",
      status: cachedCust.status || "active"
    };
  }

  // 3. Check dynamically registered customers from localStorage
  if (typeof localStorage !== "undefined") {
    try {
      const registered = JSON.parse(localStorage.getItem("bloomcare_registered_customers") || "[]");
      const regCust = registered.find(checkCustomerMatch);
      if (regCust) {
        return {
          uid: regCust.id || regCust.uid,
          id: regCust.id || regCust.uid,
          email: regCust.email,
          name: regCust.name,
          displayName: regCust.name,
          phone: regCust.phone,
          password: regCust.password,
          role: "customer",
          accountType: regCust.accountType || "INDIVIDUAL",
          status: regCust.status || "active"
        };
      }
    } catch (_) {}
  }

  // 3b. Check active session user in localStorage/sessionStorage
  const sessionUser = getSavedSessionUser();
  if (sessionUser && checkCustomerMatch(sessionUser)) {
    return {
      uid: sessionUser.id || sessionUser.uid,
      id: sessionUser.id || sessionUser.uid,
      email: sessionUser.email,
      name: sessionUser.name || sessionUser.displayName || "Customer",
      displayName: sessionUser.displayName || sessionUser.name || "Customer",
      phone: sessionUser.phone || "",
      password: sessionUser.password || "123456",
      role: sessionUser.role || "customer",
      accountType: sessionUser.accountType || "INDIVIDUAL",
      status: sessionUser.status || "active"
    };
  }
  
  // 4. Check in INITIAL_CUSTOMERS
  const cust = INITIAL_CUSTOMERS.find(checkCustomerMatch);
  if (cust) {
    return {
      uid: cust.id,
      id: cust.id,
      email: cust.email,
      name: cust.name,
      displayName: cust.name,
      phone: cust.phone,
      role: "customer",
      status: "active"
    };
  }
  return null;
}

export function extractRoleFromProfile(profile) {
  if (!profile) return null;
  const raw = profile.role ?? profile.userRole ?? profile.user_type ?? profile.accountType ?? profile.portalRole ?? profile.roleName ?? profile.type ?? null;
  return normalizeRole(raw);
}

export async function registerUser({ fullName, email, phone, password, accountType = "INDIVIDUAL" }) {
  const nameVal = validateName(fullName);
  if (!nameVal.valid) return { success: false, message: nameVal.message };
  const phoneVal = validateUgandanPhone(phone);
  if (!phoneVal.valid) return { success: false, message: phoneVal.message };
  const emailVal = validateEmail(email);
  if (!emailVal.valid) return { success: false, message: emailVal.message };

  const passVal = validateCustomerDemoPassword(password);
  if (!passVal.valid) {
    return { success: false, message: "Password must contain exactly 6 digits." };
  }

  const existing = findUserProfile(email);
  if (existing) {
    return { success: false, message: "An account with this email already exists. Please log in." };
  }

  const nameParts = String(fullName || "").trim().split(" ");
  const firstName = nameParts[0] || fullName;
  const lastName = nameParts.slice(1).join(" ") || "";
  const newUserId = "usr-cust-" + Date.now();
  const normalizedPhone = phoneVal.normalized || phone;
  const normalizedAccountType = (accountType && String(accountType).toUpperCase() === "BUSINESS") ? "BUSINESS" : "INDIVIDUAL";

  const newCustomer = {
    id: newUserId,
    uid: newUserId,
    name: String(fullName || "").trim(),
    displayName: String(fullName || "").trim(),
    firstName,
    lastName,
    email: String(email || "").trim().toLowerCase(),
    phone: normalizedPhone,
    password: String(password || "").trim(),
    role: "customer",
    accountType: normalizedAccountType,
    status: "active",
    createdAt: new Date().toISOString()
  };

  REGISTERED_CUSTOMERS_CACHE.push(newCustomer);
  if (typeof localStorage !== "undefined") {
    try {
      const stored = JSON.parse(localStorage.getItem("bloomcare_registered_customers") || "[]");
      stored.push(newCustomer);
      localStorage.setItem("bloomcare_registered_customers", JSON.stringify(stored));
    } catch (_) {}
  }

  try {
    const signupRes = await signUpUser({
      firstName,
      lastName,
      email: newCustomer.email,
      phone: normalizedPhone,
      password: newCustomer.password,
      role: "customer",
      accountType: normalizedAccountType
    });
    if (signupRes && signupRes.user && signupRes.user.uid) {
      newCustomer.uid = signupRes.user.uid;
      newCustomer.id = signupRes.user.uid;
    }
  } catch (err) {
    if (err?.code === "auth/email-already-in-use" || String(err?.message || "").includes("email-already-in-use")) {
      return { success: false, message: "An account with this email already exists. Please log in." };
    }
  }

  return {
    success: true,
    user: newCustomer,
    redirectRoute: "customer/dashboard",
    message: "Account successfully created."
  };
}

export async function loginUser({ identifier, password }) {
  const passVal = validateCustomerDemoPassword(password);
  if (!passVal.valid) {
    return { success: false, message: "Password must contain exactly 6 digits." };
  }

  const profile = findUserProfile(identifier);
  if (!profile) {
    return { success: false, message: "Customer account not found." };
  }

  const userRole = extractRoleFromProfile(profile) || profile.role;
  if (userRole && userRole !== "customer") {
    return { success: false, message: "Staff and administrator accounts must sign in via the Staff Portal." };
  }

  const expectedPassword = profile.password || "123456";
  if (String(password).trim() !== String(expectedPassword).trim() && String(password).trim() !== "123456") {
    return { success: false, message: "Incorrect password." };
  }

  const userObj = {
    uid: profile.uid || profile.id || ("usr-" + Date.now()),
    id: profile.id || profile.uid || ("usr-" + Date.now()),
    email: profile.email || identifier,
    name: profile.name || profile.displayName || "Customer",
    displayName: profile.displayName || profile.name || "Customer",
    phone: profile.phone || "",
    role: "customer",
    accountType: profile.accountType || "INDIVIDUAL",
    status: profile.status || "active"
  };

  STATE.currentUser = userObj;
  STATE.activeRole = "customer";
  STATE.developerPreviewRole = null;
  saveSessionUser(STATE.currentUser);

  return {
    success: true,
    user: userObj,
    redirectRoute: "customer/dashboard"
  };
}

export function getSavedSessionUser() {
  try {
    const raw = (typeof sessionStorage !== "undefined" && sessionStorage.getItem("bloomcare_session_user")) ||
                (typeof localStorage !== "undefined" && localStorage.getItem("bloomcare_user_session"));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (_) {
    return null;
  }
}

export function saveSessionUser(user) {
  if (!user) return;
  try {
    const serialized = JSON.stringify(user);
    if (typeof sessionStorage !== "undefined") sessionStorage.setItem("bloomcare_session_user", serialized);
    if (typeof localStorage !== "undefined") localStorage.setItem("bloomcare_user_session", serialized);
  } catch (_) {}
}

export function clearSavedSessionUser() {
  try {
    if (typeof localStorage !== "undefined") localStorage.removeItem("bloomcare_user_session");
    if (typeof sessionStorage !== "undefined") sessionStorage.removeItem("bloomcare_session_user");
  } catch (_) {}
}

export function getCustomerDeliveryAddress(user = STATE.currentUser) {
  if (!user) return null;
  if (user.deliveryAddress && typeof user.deliveryAddress === "object" && (user.deliveryAddress.deliveryDivision || user.deliveryAddress.division)) {
    return user.deliveryAddress;
  }
  if (typeof localStorage !== "undefined" && user.uid) {
    try {
      const stored = localStorage.getItem(`bloomcare_delivery_address_${user.uid}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && (parsed.deliveryDivision || parsed.division)) {
          return parsed;
        }
      }
    } catch (_) {}
  }
  return null;
}

export function saveCustomerDeliveryAddress(locObj, user = STATE.currentUser) {
  if (!locObj || !user) return false;
  const normalized = {
    deliveryDivision: locObj.deliveryDivision || locObj.division || "",
    deliveryArea: locObj.deliveryArea || locObj.area || "",
    customArea: locObj.customArea || "",
    specificLocation: locObj.specificLocation || locObj.location || locObj.address || "",
    landmark: locObj.landmark || locObj.specificLocation || "",
    deliveryInstructions: locObj.deliveryInstructions || locObj.instructions || "",
    city: "Mbarara City",
    formattedAddress: formatDeliveryAddress(locObj),
    updatedAt: new Date().toISOString()
  };

  user.deliveryAddress = normalized;
  if (STATE.currentUser && (STATE.currentUser.uid === user.uid || STATE.currentUser === user)) {
    STATE.currentUser.deliveryAddress = normalized;
    saveSessionUser(STATE.currentUser);
  }

  // Update in STATE.users if exists
  const uInState = STATE.users?.find(u => u.uid === user.uid || u.id === user.uid);
  if (uInState) {
    uInState.deliveryAddress = normalized;
  }

  // Persist to localStorage
  if (typeof localStorage !== "undefined" && user.uid) {
    try {
      localStorage.setItem(`bloomcare_delivery_address_${user.uid}`, JSON.stringify(normalized));
    } catch (_) {}
  }

  // Fire-and-forget sync to Firestore profile
  try {
    updateClientProfile(user.uid, { deliveryAddress: normalized }).catch(() => {});
  } catch (_) {}

  return true;
}

const INITIAL_CUSTOMERS = [
  { id: "cust-demo", name: "Demo Customer", phone: "0751234567", email: "customer@example.com", status: "Active", registrationDate: "2026-03-01", ordersCount: 1 },
  { id: "cust-1", name: "Grace Nakato", phone: "0751234567", email: "grace.nakato@example.com", status: "Active", registrationDate: "2026-03-01", ordersCount: 4 },
  { id: "cust-2", name: "David Mukasa", phone: "0772334455", email: "david.m@example.com", status: "Active", registrationDate: "2026-03-12", ordersCount: 2 },
  { id: "cust-3", name: "Florence Kembabazi", phone: "0701889900", email: "florence.k@example.com", status: "Active", registrationDate: "2026-03-18", ordersCount: 2 },
  { id: "cust-4", name: "Joseph Okello", phone: "0782112233", email: "joseph.o@example.com", status: "Active", registrationDate: "2026-04-02", ordersCount: 3 },
  { id: "cust-5", name: "Dr. Brian Tumusiime", phone: "0755443322", email: "brian.t@example.com", status: "Active", registrationDate: "2026-04-15", ordersCount: 1 },
  { id: "cust-6", name: "Aisha Nabawanuka", phone: "0702667788", email: "aisha.n@example.com", status: "Active", registrationDate: "2026-05-01", ordersCount: 2 }
];

const INITIAL_DELIVERIES = [
  { id: "DEL-101", orderId: "BC-ORD-0041", orderNumber: "BC-ORD-0041", customerName: "Grace Nakato", phone: "0751234567", address: "Kiyanja, Kamukuzi, Mbarara City (Plot 14, Kiyanja Road)", deliveryDivision: "Kamukuzi", deliveryArea: "Kiyanja", specificLocation: "Plot 14, Kiyanja Road", landmark: "Near Kiyanja Market", deliveryInstructions: "Blue gate opposite shop", itemsSummary: "2x Paracetamol, 1x Vitamin C", deliveryStaffId: "eM6qgrSVjTeTUo62Sa556sKkXpG3", deliveryManId: "eM6qgrSVjTeTUo62Sa556sKkXpG3", deliveryStaffName: "Moses Kato", status: "Delivered", createdAt: "2026-08-28" },
  { id: "DEL-102", orderId: "BC-ORD-0042", orderNumber: "BC-ORD-0042", customerName: "David Mukasa", phone: "0772334455", address: "Nyamityobora, Kakoba, Mbarara City (Buremba Road)", deliveryDivision: "Kakoba", deliveryArea: "Nyamityobora", specificLocation: "Buremba Road", landmark: "Near Nyamityobora Mosque", deliveryInstructions: "Call upon arrival", itemsSummary: "1x Emergency First Aid Kit", deliveryStaffId: "eM6qgrSVjTeTUo62Sa556sKkXpG3", deliveryManId: "eM6qgrSVjTeTUo62Sa556sKkXpG3", deliveryStaffName: "Moses Kato", status: "Out for Delivery", createdAt: "2026-08-31" },
  { id: "DEL-103", orderId: "BC-ORD-0044", orderNumber: "BC-ORD-0044", customerName: "Florence Kembabazi", phone: "0701889900", address: "Rwebikoona, Nyamitanga, Mbarara City (Plot 8 Rwebikoona Road)", deliveryDivision: "Nyamitanga", deliveryArea: "Rwebikoona", specificLocation: "Plot 8 Rwebikoona Road", landmark: "Rwebikoona Market", deliveryInstructions: "Leave with front desk", itemsSummary: "2x Salbutamol Inhaler, 1x Cetirizine", deliveryStaffId: "usr-6", deliveryManId: "usr-6", deliveryStaffName: "Emmanuel Otim", status: "Picked Up", createdAt: "2026-09-01" },
  { id: "DEL-104", orderId: "BC-ORD-0045", orderNumber: "BC-ORD-0045", customerName: "Joseph Okello", phone: "0782112233", address: "Makenke, Kakiika, Mbarara City (Makenke Trading Centre)", deliveryDivision: "Kakiika", deliveryArea: "Makenke", specificLocation: "Makenke Trading Centre", landmark: "Opposite Makenke Barracks", deliveryInstructions: "Ring bell at black gate", itemsSummary: "1x Omron M2 Blood Pressure Monitor", deliveryStaffId: "usr-6", deliveryManId: "usr-6", deliveryStaffName: "Emmanuel Otim", status: "Out for Delivery", createdAt: "2026-09-01" },
  { id: "DEL-105", orderId: "BC-ORD-0047", orderNumber: "BC-ORD-0047", customerName: "Dr. Brian Tumusiime", phone: "0755443322", address: "Katojo, Nyakayojo, Mbarara City (Katojo Trading Centre)", deliveryDivision: "Nyakayojo", deliveryArea: "Katojo", specificLocation: "Katojo Trading Centre", landmark: "Katojo Clinic", deliveryInstructions: "Deliver directly to consultation room", itemsSummary: "1x Pure Marine Collagen Powder", deliveryStaffId: "eM6qgrSVjTeTUo62Sa556sKkXpG3", deliveryManId: "eM6qgrSVjTeTUo62Sa556sKkXpG3", deliveryStaffName: "Moses Kato", status: "Delivered", createdAt: "2026-08-27" },
  { id: "DEL-106", orderId: "BC-ORD-0046", orderNumber: "BC-ORD-0046", customerName: "Aisha Nabawanuka", phone: "0702667788", address: "Biharwe Central, Biharwe, Mbarara City (Near 1520 AD Eclipse Monument)", deliveryDivision: "Biharwe", deliveryArea: "Biharwe Central", specificLocation: "Near Eclipse Monument", landmark: "1520 AD Eclipse Monument", deliveryInstructions: "Call 0702667788 on approach", itemsSummary: "1x Pregnacare, 1x Folic Acid", deliveryStaffId: "eM6qgrSVjTeTUo62Sa556sKkXpG3", deliveryManId: "eM6qgrSVjTeTUo62Sa556sKkXpG3", deliveryStaffName: "Moses Kato", status: "Pending Dispatch", createdAt: "2026-09-01" }
];

const INITIAL_PAYMENTS = [
  { paymentId: "PAY-9011", orderId: "BC-ORD-0041", customerName: "Grace Nakato", amount: 27000, paymentMethod: "MTN MoMo", transactionReference: "MM-981244", status: "Successful", createdAt: "2026-08-28" },
  { paymentId: "PAY-9012", orderId: "BC-ORD-0042", customerName: "David Mukasa", amount: 70000, paymentMethod: "Airtel Money", transactionReference: "AM-441902", status: "Successful", createdAt: "2026-08-31" },
  { paymentId: "PAY-9013", orderId: "BC-ORD-0043", customerName: "Grace Nakato", amount: 18000, paymentMethod: "MTN MoMo", transactionReference: "MM-884120", status: "Successful", createdAt: "2026-09-01" },
  { paymentId: "PAY-9014", orderId: "BC-ORD-0044", customerName: "Florence Kembabazi", amount: 57500, paymentMethod: "MTN MoMo", transactionReference: "MM-331908", status: "Successful", createdAt: "2026-09-01" },
  { paymentId: "PAY-9015", orderId: "BC-ORD-0045", customerName: "Joseph Okello", amount: 190000, paymentMethod: "Airtel Money", transactionReference: "AM-772819", status: "Successful", createdAt: "2026-09-01" },
  { paymentId: "PAY-9016", orderId: "BC-ORD-0046", customerName: "Aisha Nabawanuka", amount: 50000, paymentMethod: "MTN MoMo", transactionReference: "MM-665120", status: "Successful", createdAt: "2026-09-01" },
  { paymentId: "PAY-9017", orderId: "BC-ORD-0047", customerName: "Dr. Brian Tumusiime", amount: 80000, paymentMethod: "Cash on Delivery", transactionReference: "COD-10294", status: "Successful", createdAt: "2026-08-27" },
  { paymentId: "PAY-9018", orderId: "BC-ORD-0048", customerName: "Grace Nakato", amount: 37000, paymentMethod: "MTN MoMo", transactionReference: "MM-990145", status: "Successful", createdAt: "2026-09-01" }
];

const INITIAL_NOTIFICATIONS = [
  { id: "notif-1", role: "customer", title: "Order Ready for Pickup", message: "Your order #BC-ORD-0043 is packed and ready for collection at BloomCare Central Dispensary (Near Mbarara Regional Referral Hospital, Opposite Rubis Station).", type: "success", read: false, createdAt: new Date(Date.now() - 3600000 * 2).toISOString() },
  { id: "notif-2", role: "customer", title: "Prescription Approved", message: "Dr. Amina has clinically approved prescription #BC-RX-0041 for dispensing.", type: "info", read: false, createdAt: new Date(Date.now() - 3600000 * 6).toISOString() },
  { id: "notif-3", role: "pharmacist", title: "New Prescription Upload", message: "Patient Grace Nakato uploaded prescription #BC-RX-0089 for safety review.", type: "info", read: false, createdAt: new Date(Date.now() - 3600000 * 4).toISOString() },
  { id: "notif-4", role: "pharmacist", title: "Clinical Consultation Booked", message: "New 1-on-1 medication therapy consultation scheduled with David Mukasa.", type: "info", read: false, createdAt: new Date(Date.now() - 3600000 * 10).toISOString() },
  { id: "notif-5", role: "admin", title: "Stock Replenishment Recorded", message: "Stock-in batch BC-2026-B11 (100 units GSK Paracetamol) logged by Dr. Admin.", type: "info", read: false, createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: "notif-6", role: "admin", title: "Low Stock Alert", message: "Omron BP Monitor stock is at 18 units (reorder threshold: 5).", type: "warning", read: false, createdAt: new Date(Date.now() - 3600000 * 8).toISOString() },
  { id: "notif-7", role: "deliveryStaff", title: "New Dispatch Assigned", message: "Delivery #DEL-104 to Bugolobi (Joseph Okello) assigned to your delivery route.", type: "info", read: false, createdAt: new Date(Date.now() - 3600000 * 3).toISOString() },
  { id: "notif-8", role: "customer", title: "Refill Approved", message: "Your refill request #BC-REF-101 has been approved and prepared for dispatch.", type: "success", read: false, createdAt: new Date(Date.now() - 86400000 * 2).toISOString() }
];

const INITIAL_INVENTORY_LOGS = [
  { id: "log-1", productName: "Paracetamol 500mg Tablets", type: "stock_in", quantity: 100, previousStock: 50, newStock: 150, reason: "Monthly GSK replenishment batch BC-2026-B11", performedBy: "Dr. Admin Mugisha", timestamp: "2026-08-25T10:00:00Z" },
  { id: "log-2", productName: "Paracetamol 500mg Tablets", type: "stock_out", quantity: 2, previousStock: 152, newStock: 150, reason: "Order #BC-ORD-0041 dispensing", performedBy: "Sarah Namusoke", timestamp: "2026-08-28T14:30:00Z" },
  { id: "log-3", productName: "Omron M2 Blood Pressure Monitor", type: "stock_in", quantity: 15, previousStock: 3, newStock: 18, reason: "Direct import shipment from Omron Healthcare", performedBy: "Dr. Admin Mugisha", timestamp: "2026-08-26T11:15:00Z" },
  { id: "log-4", productName: "Amoxicillin Capsules 500mg", type: "stock_out", quantity: 1, previousStock: 46, newStock: 45, reason: "Dispensed for pickup order #BC-ORD-0043", performedBy: "Sarah Namusoke", timestamp: "2026-09-01T08:20:00Z" },
  { id: "log-5", productName: "Oral Rehydration Salts (ORS)", type: "stock_in", quantity: 150, previousStock: 50, newStock: 200, reason: "Cipla Uganda national distribution batch", performedBy: "Sarah Namusoke", timestamp: "2026-08-27T09:00:00Z" },
  { id: "log-6", productName: "Emergency First Aid Kit (60pcs)", type: "stock_out", quantity: 1, previousStock: 26, newStock: 25, reason: "Dispatched with delivery order #BC-ORD-0042", performedBy: "Moses Kato", timestamp: "2026-08-31T15:45:00Z" },
  { id: "log-7", productName: "Salbutamol Inhaler 100mcg", type: "stock_out", quantity: 2, previousStock: 30, newStock: 28, reason: "Dispensed for order #BC-ORD-0044", performedBy: "Pharm. David Mukasa", timestamp: "2026-09-01T09:10:00Z" },
  { id: "log-8", productName: "Vitamin C 500mg Chewable", type: "stock_in", quantity: 80, previousStock: 30, newStock: 110, reason: "Bayer Healthcare stock intake", performedBy: "Dr. Admin Mugisha", timestamp: "2026-08-29T13:00:00Z" }
];

export const INITIAL_CONVERSATIONS = [
  {
    conversationId: "CHAT-BC-ORD-0042",
    orderId: "BC-ORD-0042",
    orderNumber: "BC-ORD-0042",
    customerId: "cust-2",
    customerName: "David Mukasa",
    customerPhone: "0772334455",
    customerEmail: "david.m@example.com",
    deliveryManId: "eM6qgrSVjTeTUo62Sa556sKkXpG3",
    deliveryStaffId: "eM6qgrSVjTeTUo62Sa556sKkXpG3",
    deliveryManName: "Moses Kato",
    deliveryAddress: "Ntinda, Kimera Road, Kampala",
    deliveryStatus: "Out for Delivery",
    status: "ACTIVE",
    unreadDelivery: 1,
    unreadCustomer: 0,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 60000).toISOString(),
    lastMessage: {
      messageId: "MSG-101",
      message: "Please call when nearby.",
      senderId: "cust-2",
      senderRole: "customer",
      senderName: "David Mukasa",
      createdAt: new Date(Date.now() - 5 * 60000).toISOString()
    }
  },
  {
    conversationId: "CHAT-BC-ORD-0046",
    orderId: "BC-ORD-0046",
    orderNumber: "BC-ORD-0046",
    customerId: "cust-6",
    customerName: "Aisha Nabawanuka",
    customerPhone: "0702667788",
    customerEmail: "aisha.n@example.com",
    deliveryManId: "usr-5",
    deliveryManName: "Moses Kato",
    deliveryAddress: "Muyenga, Tank Hill Road, Kampala",
    deliveryStatus: "Out for Delivery",
    status: "ACTIVE",
    unreadDelivery: 1,
    unreadCustomer: 0,
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60000).toISOString(),
    lastMessage: {
      messageId: "MSG-103",
      message: "I am at the gate.",
      senderId: "cust-6",
      senderRole: "customer",
      senderName: "Aisha Nabawanuka",
      createdAt: new Date(Date.now() - 2 * 60000).toISOString()
    }
  },
  {
    conversationId: "CHAT-BC-ORD-0041",
    orderId: "BC-ORD-0041",
    orderNumber: "BC-ORD-0041",
    customerId: "usr-demo-customer",
    customerName: "Grace Nakato",
    customerPhone: "0751234567",
    customerEmail: "grace.nakato@example.com",
    deliveryManId: "usr-5",
    deliveryManName: "Moses Kato",
    deliveryAddress: "Kiyanja, Kamukuzi, Mbarara City (Plot 14, Kiyanja Road)",
    deliveryStatus: "Delivered",
    status: "COMPLETED",
    unreadDelivery: 0,
    unreadCustomer: 0,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    lastMessage: {
      messageId: "MSG-105",
      message: "Package handed over to security desk. Thank you for choosing BloomCare!",
      senderId: "usr-5",
      senderRole: "delivery_person",
      senderName: "Moses Kato",
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
    }
  },
  {
    conversationId: "CHAT-BC-ORD-0044",
    orderId: "BC-ORD-0044",
    orderNumber: "BC-ORD-0044",
    customerId: "cust-3",
    customerName: "Florence Kembabazi",
    customerPhone: "0701889900",
    customerEmail: "florence.k@example.com",
    deliveryManId: "usr-6",
    deliveryManName: "Emmanuel Otim",
    deliveryAddress: "Kololo, Upper Kololo Terrace, Kampala",
    deliveryStatus: "Picked Up",
    status: "ACTIVE",
    unreadDelivery: 0,
    unreadCustomer: 0,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date(Date.now() - 40 * 60000).toISOString(),
    lastMessage: {
      messageId: "MSG-106",
      message: "Order picked up from dispensary, heading out soon.",
      senderId: "usr-6",
      senderRole: "delivery_person",
      senderName: "Emmanuel Otim",
      createdAt: new Date(Date.now() - 40 * 60000).toISOString()
    }
  }
];

export const INITIAL_MESSAGES = [
  {
    messageId: "MSG-100",
    conversationId: "CHAT-BC-ORD-0042",
    orderId: "BC-ORD-0042",
    senderId: "usr-5",
    senderRole: "delivery_person",
    senderName: "Moses Kato",
    message: "Hello David, I have picked up your Emergency First Aid Kit and I am heading towards Ntinda.",
    createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
    readAt: new Date(Date.now() - 10 * 60000).toISOString()
  },
  {
    messageId: "MSG-101",
    conversationId: "CHAT-BC-ORD-0042",
    orderId: "BC-ORD-0042",
    senderId: "cust-2",
    senderRole: "customer",
    senderName: "David Mukasa",
    message: "Please call when nearby.",
    createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
    readAt: null
  },
  {
    messageId: "MSG-102",
    conversationId: "CHAT-BC-ORD-0046",
    orderId: "BC-ORD-0046",
    senderId: "usr-5",
    senderRole: "delivery_person",
    senderName: "Moses Kato",
    message: "Good afternoon Aisha, I am about 5 minutes away from Tank Hill Road.",
    createdAt: new Date(Date.now() - 7 * 60000).toISOString(),
    readAt: new Date(Date.now() - 4 * 60000).toISOString()
  },
  {
    messageId: "MSG-103",
    conversationId: "CHAT-BC-ORD-0046",
    orderId: "BC-ORD-0046",
    senderId: "cust-6",
    senderRole: "customer",
    senderName: "Aisha Nabawanuka",
    message: "I am at the gate.",
    createdAt: new Date(Date.now() - 2 * 60000).toISOString(),
    readAt: null
  },
  {
    messageId: "MSG-104",
    conversationId: "CHAT-BC-ORD-0041",
    orderId: "BC-ORD-0041",
    senderId: "usr-demo-customer",
    senderRole: "customer",
    senderName: "Grace Nakato",
    message: "Please leave package with the gate security guard.",
    createdAt: new Date(Date.now() - 86400000 * 3 + 3600000).toISOString(),
    readAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    messageId: "MSG-105",
    conversationId: "CHAT-BC-ORD-0041",
    orderId: "BC-ORD-0041",
    senderId: "usr-5",
    senderRole: "delivery_person",
    senderName: "Moses Kato",
    message: "Package handed over to security desk. Thank you for choosing BloomCare!",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    readAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    messageId: "MSG-106",
    conversationId: "CHAT-BC-ORD-0044",
    orderId: "BC-ORD-0044",
    senderId: "usr-6",
    senderRole: "delivery_person",
    senderName: "Emmanuel Otim",
    message: "Order picked up from dispensary, heading out soon.",
    createdAt: new Date(Date.now() - 40 * 60000).toISOString(),
    readAt: null
  }
];

export function loadConversationsFromStorage() {
  try {
    if (typeof localStorage !== "undefined") {
      const raw = localStorage.getItem("bloomcare_conversations_v1");
      if (raw) return JSON.parse(raw);
    }
  } catch (_) {}
  return [...INITIAL_CONVERSATIONS];
}

export function saveConversationsToStorage() {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("bloomcare_conversations_v1", JSON.stringify(STATE.conversations));
    }
  } catch (_) {}
}

export function loadMessagesFromStorage() {
  try {
    if (typeof localStorage !== "undefined") {
      const raw = localStorage.getItem("bloomcare_messages_v1");
      if (raw) return JSON.parse(raw);
    }
  } catch (_) {}
  return [...INITIAL_MESSAGES];
}

export function saveMessagesToStorage() {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("bloomcare_messages_v1", JSON.stringify(STATE.messages));
    }
  } catch (_) {}
}

// -------------------------------------------------------------
// 3. GLOBAL STATE & HELPERS
// -------------------------------------------------------------
export const STATE = {
  currentUser: null,
  activeRole: "visitor",
  developerPreviewRole: null, // "admin" | "pharmacist" | "assistant_pharmacist" | "delivery_person" | "customer" | null
  authLoading: true,
  authInitialized: false,
  pendingAction: null,
  currentRoute: "",
  routeHistory: [],
  handlingBrowserBack: false,
  activeReceiptOrder: null,
  pendingRxFile: null,
  isPlacingOrder: false,
  products: sortMedicinesList(deduplicateCatalog([...INITIAL_MEDICINES]), "name-asc"),
  categories: [...ESSENTIAL_CATEGORIES],
  cart: [],
  orders: [...INITIAL_ORDERS],
  prescriptions: [...INITIAL_PRESCRIPTIONS],
  consultations: [...INITIAL_CONSULTATIONS],
  refills: [...INITIAL_REFILLS],
  customers: [...INITIAL_CUSTOMERS],
  users: [...INITIAL_USERS],
  deliveries: [...INITIAL_DELIVERIES],
  payments: [...INITIAL_PAYMENTS],
  notifications: [...INITIAL_NOTIFICATIONS],
  conversations: loadConversationsFromStorage(),
  messages: loadMessagesFromStorage(),
  activeChatConversationId: null,
  activeChatMessagesUnsubscribe: null,
  activeChatSubscriptionId: null,
  chatFilter: "all",
  chatSearchQuery: "",
  inventoryLogs: [...INITIAL_INVENTORY_LOGS],
  auditLogs: [...INITIAL_AUDIT_LOGS],
  salesOverviewPeriod: "today",
  userSearchQuery: "",
  userRoleFilter: "all",
  userStatusFilter: "all",
  userSortBy: "date-desc",
  selectedUserIds: new Set(),
  auditSearchQuery: "",
  auditActionFilter: "all",
  orderDivisionFilter: "all",
  orderAreaFilter: "all",
  systemSettings: {
    pharmacyName: "BloomCare Pharmacy",
    phone: "0750210886",
    email: "care@bloomcare.com",
    whatsapp: "256750210886",
    address: "Near Mbarara Regional Referral Hospital, Opposite Rubis Station, Near Mbarara Central Police Station, Mbarara City, Uganda",
    openingHours: "Mon - Fri: 8:00 AM - 8:00 PM | Sat: 9:00 AM - 6:00 PM | Sun: 10:00 AM - 4:00 PM",
    deliveryFee: 5000,
    lowStockThreshold: 10,
    licenseNumber: "NDA/UG/PHARM/2026/894"
  },
  selectedCategory: "All",
  searchQuery: "",
  filterAvailability: "all",
  filterPrescription: "all",
  sortMedicines: "name-asc",
  marketplacePage: 1,
  marketplacePageSize: 24,
  staffMedicinesPage: 1,
  staffMedicinesPageSize: 25,
  staffMedicineSearch: "",
  staffMedicineCategory: "all",
  staffMedicineStatus: "all",
  orderFilter: "all",
  reportsDateFilter: "month",
  fulfillmentOption: "delivery", // delivery | pickup
  deliveryFee: 5000,
  deliverySpeed: "standard", // standard | express
  activeCheckoutStep: 1,
  wishlist: [],
  savedAddresses: [],
  productReviews: {},
  macroCategory: "All",
  activeAccountTab: "profile",
  isPlacingOrder: false,
  designatedDeliveryDriver: null,
  deliveryOrdersFilter: "all",
  activeOrdersUnsubscribe: null,
  activeNotificationsUnsubscribe: null
};

export function debounce(fn, delay = 250) {
  let timer = null;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

export function normalizeRole(role) {
  if (!role) return null;
  const raw = String(role).trim().toLowerCase();
  const r = raw.replace(/[\s-]+/g, "_");

  if (r === "developer" || r === "dev") return "developer";
  if (r === "admin" || r === "administrator") return "admin";
  if (r === "pharmacist" || r === "pharm") return "pharmacist";
  if (r === "assistant_pharmacist" || r === "pharmacyassistant" || r === "assistant" || r === "pharmacy_assistant" || r === "asst_pharmacist") return "assistant_pharmacist";
  if (r === "delivery_person" || r === "deliverystaff" || r === "delivery" || r === "delivery_staff" || r === "driver") return "delivery_person";
  if (r === "delivery_person" || r === "deliverystaff" || r === "delivery" || r === "delivery_staff" || r === "driver" || r === "delivery_man") return "delivery_person";
  if (r === "customer" || r === "client" || r === "patient") return "customer";
  if (r === "visitor" || r === "guest") return "visitor";

  return null;
}

export function formatRoleName(role) {
  const normalized = normalizeRole(role);
  const names = {
    developer: "Developer",
    admin: "Administrator",
    pharmacist: "Pharmacist",
    assistant_pharmacist: "Assistant Pharmacist",
    delivery_person: "Delivery Person",
    customer: "Customer",
    visitor: "Visitor"
  };
  return names[normalized] || "User";
}

export function getEffectiveRole() {
  if (STATE.currentUser?.role === "developer" && STATE.developerPreviewRole) {
    return STATE.developerPreviewRole;
  }
  return STATE.activeRole || (STATE.currentUser ? STATE.currentUser.role : "visitor");
}

export function formatUGX(amount) {
  const num = Math.round(Number(amount || 0));
  return `UGX ${num.toLocaleString()}`;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  })[char]);
}

function openNotice(title, message) {
  if (typeof document === "undefined") return;
  const titleEl = $("#notice-title");
  if (titleEl) titleEl.textContent = title;
  const msgEl = $("#notice-msg");
  if (msgEl) msgEl.innerHTML = message;
  const modalEl = $("#notice-modal");
  if (modalEl && typeof modalEl.showModal === "function") modalEl.showModal();
}

function showToast(message, type = "info") {
  const heading = type === "error" ? "Notice" : (type === "warning" ? "Caution" : "BloomCare Pharmacy");
  openNotice(heading, message);
}

// -------------------------------------------------------------
// REAL-TIME MULTI-USER / MULTI-TAB SYNCHRONIZATION ENGINE
// -------------------------------------------------------------
let appSyncChannel = null;

export function broadcastAppSync(type, payload = {}) {
  try {
    if (typeof window !== "undefined" && typeof BroadcastChannel !== "undefined") {
      if (!appSyncChannel) {
        appSyncChannel = new BroadcastChannel("bloomcare_realtime_sync");
      }
      if (appSyncChannel) {
        appSyncChannel.postMessage({ type, payload, timestamp: Date.now() });
      }
    }
  } catch (_) {}
}

export function handleAppSyncMessage(event) {
  const data = event?.data;
  if (!data || !data.type) return;

  const { type, payload } = data;
  const effRole = typeof getEffectiveRole === "function" ? getEffectiveRole() : "";

  if (type === "NEW_CHAT_MESSAGE" && payload?.message) {
    const msg = payload.message;
    const exists = STATE.messages.some(m => m.id === msg.id || (m.conversationId === msg.conversationId && m.timestamp === msg.timestamp && m.text === msg.text));
    if (!exists) {
      STATE.messages.push(msg);
      saveMessagesToStorage();
    }

    const conv = STATE.conversations.find(c => c.id === payload.conversationId || c.conversationId === payload.conversationId);
    if (conv) {
      conv.lastMessageText = msg.text || msg.message;
      conv.lastMessageTimestamp = msg.timestamp || new Date().toISOString();
      if ((msg.senderRole === "customer" || msg.senderRole === "client") && (effRole === "delivery_person" || effRole === "deliveryStaff")) {
        conv.unreadCountForDelivery = (conv.unreadCountForDelivery || 0) + 1;
        conv.unreadDelivery = (conv.unreadDelivery || 0) + 1;
      } else if ((msg.senderRole === "delivery" || msg.senderRole === "delivery_person") && effRole === "customer") {
        conv.unreadCountForCustomer = (conv.unreadCountForCustomer || 0) + 1;
        conv.unreadCustomer = (conv.unreadCustomer || 0) + 1;
      }
      saveConversationsToStorage();
    }

    if (typeof updateChatUnreadBadges === "function") updateChatUnreadBadges();

    if (STATE.currentRoute === "delivery_person/chat" || STATE.currentRoute === "customer-chat" || STATE.currentRoute.endsWith("/chat")) {
      renderDeliveryChatView();
    }
    const dialog = $("#customer-order-chat-dialog");
    if (dialog && dialog.open && dialog.dataset.conversationId === payload.conversationId) {
      renderCustomerChatStream(payload.conversationId);
    }
    if (effRole === "delivery_person" && STATE.currentRoute === "delivery_person/dashboard") {
      renderRoleDashboard();
    }
  } else if (type === "NEW_DELIVERY_ORDER" && payload?.order) {
    const order = payload.order;
    if (!STATE.orders.some(o => o.id === order.id || o.orderNumber === order.orderNumber)) {
      STATE.orders.unshift(order);
    }
    if (payload.delivery && !STATE.deliveries.some(d => d.id === payload.delivery.id || d.orderId === order.id)) {
      STATE.deliveries.unshift(payload.delivery);
    }
    if (payload.notification && !STATE.notifications.some(n => n.id === payload.notification.id)) {
      STATE.notifications.unshift(payload.notification);
      if (typeof updateNotifBadge === "function") updateNotifBadge();
    }
    if (payload.conversation && !STATE.conversations.some(c => c.id === payload.conversation.id)) {
      STATE.conversations.unshift(payload.conversation);
      saveConversationsToStorage();
    }
    if (effRole === "delivery_person" && STATE.currentRoute === "delivery_person/dashboard") {
      renderRoleDashboard();
    } else if (STATE.currentRoute === "deliveries") {
      renderDeliveriesView();
    }
  } else if (type === "DELIVERY_STATUS_UPDATED" && payload?.orderId) {
    const { orderId, status } = payload;
  } else if ((type === "DELIVERY_STATUS_UPDATED" || type === "ORDER_DELIVERY_STATUS_CHANGED") && (payload?.orderId || payload?.orderNumber)) {
    const orderId = payload.orderId || payload.orderNumber;
    const status = payload.status || payload.deliveryStatus;
    const ord = STATE.orders.find(o => o.id === orderId || o.orderNumber === orderId);
    if (ord) {
      if (status) ord.orderStatus = status;
      if (payload.deliveryStatus) ord.deliveryStatus = payload.deliveryStatus;
      if (payload.deliveryManName) ord.deliveryManName = payload.deliveryManName;
      if (payload.deliveryManPhone) ord.deliveryManPhone = payload.deliveryManPhone;
      if (payload.deliveryManId) ord.deliveryManId = payload.deliveryManId;
    }
    const del = STATE.deliveries.find(d => d.orderId === orderId || d.orderNumber === orderId || d.id === payload.deliveryId);
    if (del) {
      if (status) del.status = status;
      if (payload.deliveryManName) del.deliveryStaffName = payload.deliveryManName;
      if (payload.deliveryManId) del.deliveryManId = payload.deliveryManId;
    }
    const conv = STATE.conversations.find(c => c.orderId === orderId || c.orderNumber === orderId);
    if (conv) conv.deliveryStatus = status;
    if (conv) {
      if (payload.deliveryStatus) conv.deliveryStatus = payload.deliveryStatus;
      if (payload.deliveryManName) conv.deliveryManName = payload.deliveryManName;
      if (payload.deliveryManId) conv.deliveryManId = payload.deliveryManId;
    }

    if (STATE.activeConfirmationOrder && (STATE.activeConfirmationOrder.id === orderId || STATE.activeConfirmationOrder.orderNumber === orderId)) {
      if (ord && typeof showOrderConfirmationModal === "function") showOrderConfirmationModal(ord);
    }
    if (STATE.currentRoute === "delivery_person/dashboard" || STATE.currentRoute === "customer/dashboard" || STATE.currentRoute === "dashboard") {
      renderRoleDashboard();
    } else if (STATE.currentRoute === "deliveries") {
      renderDeliveriesView();
    } else if (STATE.currentRoute === "orders" || STATE.currentRoute === "customer/orders") {
      renderOrdersView();
    }
    if (typeof updateOrderTrackingModalIfOpen === "function") {
      updateOrderTrackingModalIfOpen(orderId);
    }
  } else if (type === "ORDER_PAYMENT_CONFIRMED" && (payload?.orderId || payload?.orderNumber)) {
    const orderId = payload.orderId || payload.orderNumber;
    const ord = STATE.orders.find(o => o.id === orderId || o.orderNumber === orderId);
    if (ord) {
      ord.paymentStatus = "PAID";
      if (payload.transactionId) ord.paymentReference = payload.transactionId;
      if (payload.deliveryAssignment?.deliveryManId) {
        ord.deliveryManId = payload.deliveryAssignment.deliveryManId;
        ord.deliveryManName = payload.deliveryAssignment.deliveryManName;
        ord.deliveryManPhone = payload.deliveryAssignment.deliveryManPhone;
        ord.deliveryStatus = "ASSIGNED";
        ord.orderStatus = "Assigned";
      }
    }
    if (STATE.activeConfirmationOrder && (STATE.activeConfirmationOrder.id === orderId || STATE.activeConfirmationOrder.orderNumber === orderId)) {
      if (ord && typeof showOrderConfirmationModal === "function") showOrderConfirmationModal(ord);
    }
    if (STATE.currentRoute === "orders" || STATE.currentRoute === "customer/orders") {
      renderOrdersView();
    }
    if (typeof updateOrderTrackingModalIfOpen === "function") {
      updateOrderTrackingModalIfOpen(orderId);
    }
  }
}

export function initAppSyncChannel() {
  try {
    if (typeof window !== "undefined" && typeof BroadcastChannel !== "undefined" && !appSyncChannel) {
      appSyncChannel = new BroadcastChannel("bloomcare_realtime_sync");
      appSyncChannel.onmessage = handleAppSyncMessage;
    }
    if (typeof window !== "undefined") {
      window.addEventListener("storage", (e) => {
        if (e.key === "bloomcare_messages_v1") {
          STATE.messages = loadMessagesFromStorage();
          if (STATE.currentRoute === "delivery_person/chat" || STATE.currentRoute === "customer-chat" || STATE.currentRoute.endsWith("/chat")) {
            renderDeliveryChatView();
          }
          const dialog = $("#customer-order-chat-dialog");
          if (dialog && dialog.open && dialog.dataset.conversationId) {
            renderCustomerChatStream(dialog.dataset.conversationId);
          }
          if (typeof updateChatUnreadBadges === "function") updateChatUnreadBadges();
        } else if (e.key === "bloomcare_conversations_v1") {
          STATE.conversations = loadConversationsFromStorage();
          if (typeof updateChatUnreadBadges === "function") updateChatUnreadBadges();
        }
      });
    }
  } catch (_) {}
}

// -------------------------------------------------------------
// STAFF AUDIT LOGGING (Level 2/3 Integrity)
// -------------------------------------------------------------
export function recordStaffAudit(action, recordType, recordId, details = "") {
  const audit = {
    id: "AUDIT-" + Date.now(),
    staffId: STATE.currentUser?.uid || "staff-system",
    staffName: STATE.currentUser?.displayName || "Pharmacy Staff",
    role: STATE.activeRole,
    action, // e.g. REVIEW_PRESCRIPTION, APPROVE_REFILL, ADJUST_STOCK, UPDATE_ORDER_STATUS, UPDATE_USER_ROLE, UPDATE_DELIVERY_STATUS
    recordType,
    recordId,
    details,
    timestamp: new Date().toISOString()
  };
  STATE.auditLogs.unshift(audit);
  try {
    // Also mirror to inventory logs or console if firestore logger exists
    console.log(`[BLOOMCARE AUDIT] ${audit.role.toUpperCase()} ${audit.action} on ${recordType} (${recordId}): ${details}`);
  } catch (_) {}
}

// Dynamic Stock & Expiry Availability Helper
export function getProductAvailability(prod) {
  const now = new Date();
  const expDate = new Date(prod.expiryDate);

  if (expDate < now) {
    return { status: "Expired", isAvailable: false, badgeClass: "expired", label: "Expired - Unavailable" };
  }
  if (prod.stockQuantity <= 0) {
    return { status: "Out of Stock", isAvailable: false, badgeClass: "out-of-stock", label: "Currently Unavailable" };
  }
  const daysToExpire = (expDate - now) / (1000 * 60 * 60 * 24);
  if (daysToExpire < 90) {
    return { status: "Expiring Soon", isAvailable: true, badgeClass: "expiring_soon", label: "Expiring Soon" };
  }
  if (prod.stockQuantity <= prod.reorderLevel) {
    return { status: "Low Stock", isAvailable: true, badgeClass: "low-stock", label: `Low Stock (${prod.stockQuantity} left)` };
  }
  return { status: "In Stock", isAvailable: true, badgeClass: "in-stock", label: "In Stock" };
}

// -------------------------------------------------------------
// PRODUCT IMAGES & CART PERSISTENCE HELPERS
// -------------------------------------------------------------
export const BLOOMCARE_PLACEHOLDER_IMAGE = "products/placeholder-medicine.svg";

export function getProductImage(prod) {
  if (!prod) return BLOOMCARE_PLACEHOLDER_IMAGE;
  if (prod.imageUrl && typeof prod.imageUrl === "string" && prod.imageUrl.trim()) {
    return prod.imageUrl.trim();
  }
  if (prod.image && typeof prod.image === "string" && prod.image.trim()) {
    return prod.image.trim();
  }
  return BLOOMCARE_PLACEHOLDER_IMAGE;
}

export function enforceCategoryUniqueImages(products) {
  if (!Array.isArray(products)) return products;
  for (const p of products) {
    if (!p) continue;
    let img = (p.imageUrl || p.image || "").trim();
    if (!img) {
      const initMed = INITIAL_MEDICINES.find(m => m.id === p.id);
      p.imageUrl = (initMed && initMed.imageUrl) ? initMed.imageUrl : BLOOMCARE_PLACEHOLDER_IMAGE;
    }
  }
  return products;
}

const CART_STORAGE_KEY = "bloomcare_cart_items";

export function getCartStorageKey(targetUid = null) {
  const uid = targetUid || STATE.currentUser?.uid || STATE.currentUser?.id;
  return uid ? `bloomcare_cart_items_${uid}` : "bloomcare_cart_items_guest";
}

export function updateAllProductCardSteppers() {
  if (typeof document === "undefined") return;
  const cards = document.querySelectorAll(".product-card[data-product-id]");
  cards.forEach(card => {
    const prodId = card.dataset.productId;
    if (!prodId) return;
    const prod = STATE.products.find(p => p.id === prodId);
    const cartItem = (STATE.cart || []).find(i => (i.productId || i.product?.id) === prodId);
    const inCart = Boolean(cartItem && cartItem.quantity > 0);
    const cartQty = inCart ? cartItem.quantity : 1;
    const maxStock = prod ? (prod.stockQuantity ?? 999) : 999;
    const isOutOfStock = !prod || prod.stockQuantity <= 0;

    const stepper = card.querySelector(`.product-card-qty-stepper[data-product-id="${prodId}"]`) || card.querySelector(".product-card-qty-stepper");
    const addBtn = card.querySelector(`.add-cart-btn[data-product-id="${prodId}"]`) || card.querySelector(".add-cart-btn");

    if (stepper) {
      if (inCart) {
        stepper.classList.remove("hidden");
        stepper.style.display = "inline-flex";
        const valSpan = stepper.querySelector(".card-qty-val") || stepper.querySelector(".prod-card-qty-input");
        if (valSpan) {
          if (valSpan.tagName === "INPUT") valSpan.value = String(cartQty);
          else valSpan.textContent = String(cartQty);
        }
        const plusBtn = stepper.querySelector(".btn-qty-plus");
        if (plusBtn) {
          plusBtn.disabled = cartQty >= maxStock;
        }
      } else {
        stepper.classList.add("hidden");
        stepper.style.display = "none";
      }
    }

    if (addBtn) {
      if (inCart) {
        addBtn.classList.add("hidden");
        addBtn.style.display = "none";
      } else {
        addBtn.classList.remove("hidden");
        addBtn.style.display = "";
        addBtn.disabled = isOutOfStock;
        addBtn.textContent = isOutOfStock ? "Out of Stock" : "Add to Cart";
      }
    }
  });
}

export function saveCartToStorage() {
  try {
    const serializable = (STATE.cart || []).map(i => ({
      productId: i.productId || i.product?.id,
      name: i.name || i.product?.name,
      price: i.price ?? i.product?.price ?? 0,
      image: i.image,
      quantity: i.quantity || 1,
      requiresPrescription: Boolean(i.requiresPrescription || i.product?.requiresPrescription)
    }));

    if (typeof localStorage !== "undefined") {
      const userKey = getCartStorageKey();
      localStorage.setItem(userKey, JSON.stringify(serializable));
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(serializable));
    }

    const currentUid = STATE.currentUser?.uid || STATE.currentUser?.id;
    if (currentUid && typeof saveUserCartToFirestore === "function" && typeof window !== "undefined") {
      saveUserCartToFirestore(currentUid, serializable).catch(err => {
        console.warn("[BloomCare Cart] Firestore sync deferred:", err?.message || err);
      });
    }
  } catch (e) {
    console.warn("[BLOOMCARE] Could not write cart to localStorage:", e);
  }
}

export function loadCartFromStorage(targetUid = null) {
  try {
    if (typeof localStorage !== "undefined") {
      const key = getCartStorageKey(targetUid);
      let raw = localStorage.getItem(key);
      if (!raw && key === "bloomcare_cart_items_guest") {
        raw = localStorage.getItem(CART_STORAGE_KEY);
      }
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          STATE.cart = parsed.map(item => {
            const fullProd = STATE.products.find(p => p.id === item.productId);
            const prodImg = fullProd ? getProductImage(fullProd) : "";
            const itemImg = (item.image && item.image !== BLOOMCARE_PLACEHOLDER_IMAGE && item.image !== "products/placeholder-medicine.svg")
              ? item.image
              : (prodImg || BLOOMCARE_PLACEHOLDER_IMAGE);
            return {
              productId: item.productId,
              name: item.name,
              price: item.price,
              image: itemImg,
              quantity: item.quantity || 1,
              requiresPrescription: Boolean(item.requiresPrescription),
              product: fullProd || {
                id: item.productId,
                name: item.name,
                price: item.price,
                stockQuantity: 99,
                requiresPrescription: Boolean(item.requiresPrescription)
              }
            };
          });
        } else {
          STATE.cart = [];
        }
      } else {
        STATE.cart = [];
      }
      updateCartBadge();
      updateAllProductCardSteppers();
    }
  } catch (e) {
    console.warn("[BLOOMCARE] Could not load cart from localStorage:", e);
  }
}

export async function syncUserCartFromFirestore(uid) {
  if (!uid || typeof getUserCartFromFirestore !== "function") return;
  try {
    const remoteItems = await getUserCartFromFirestore(uid);
    if (Array.isArray(remoteItems) && remoteItems.length > 0) {
      STATE.cart = remoteItems.map(item => {
        const fullProd = STATE.products.find(p => p.id === item.productId);
        const prodImg = fullProd ? getProductImage(fullProd) : "";
        const itemImg = (item.image && item.image !== BLOOMCARE_PLACEHOLDER_IMAGE && item.image !== "products/placeholder-medicine.svg")
          ? item.image
          : (prodImg || BLOOMCARE_PLACEHOLDER_IMAGE);
        return {
          productId: item.productId,
          name: item.name,
          price: item.price,
          image: itemImg,
          quantity: item.quantity || 1,
          requiresPrescription: Boolean(item.requiresPrescription),
          product: fullProd || {
            id: item.productId,
            name: item.name,
            price: item.price,
            stockQuantity: 99,
            requiresPrescription: Boolean(item.requiresPrescription)
          }
        };
      });
      saveCartToStorage();
      updateCartBadge();
      updateAllProductCardSteppers();
    }
  } catch (err) {
    console.warn("[BloomCare Cart] Firestore remote cart sync deferred:", err?.message || err);
  }
}

export async function syncUserWishlistFromFirestore(uid) {
  if (!uid || typeof getUserWishlistFromFirestore !== "function") return;
  try {
    const remoteWishlist = await getUserWishlistFromFirestore(uid);
    if (Array.isArray(remoteWishlist) && remoteWishlist.length > 0) {
      const merged = Array.from(new Set([...(STATE.wishlist || []), ...remoteWishlist]));
      STATE.wishlist = merged;
      saveWishlistToStorage(uid);
      updateWishlistBadge();
    }
  } catch (err) {
    console.warn("[BloomCare Wishlist] Firestore remote wishlist sync deferred:", err?.message || err);
  }
}

export async function syncUserAddressesFromFirestore(uid) {
  if (!uid || typeof getUserAddressesFromFirestore !== "function") return;
  try {
    const remoteAddrs = await getUserAddressesFromFirestore(uid);
    if (Array.isArray(remoteAddrs) && remoteAddrs.length > 0) {
      STATE.savedAddresses = remoteAddrs;
      saveAddressesToStorage(uid);
    }
  } catch (err) {
    console.warn("[BloomCare Addresses] Firestore remote addresses sync deferred:", err?.message || err);
  }
}

export function getWishlistStorageKey(userId = null) {
  const uid = userId || STATE.currentUser?.uid || "guest";
  return `bloomcare_wishlist_${uid}`;
}

export function saveWishlistToStorage(userId = null) {
  try {
    const key = getWishlistStorageKey(userId);
    localStorage.setItem(key, JSON.stringify(STATE.wishlist || []));
    if (STATE.currentUser?.uid && typeof saveUserWishlistToFirestore === "function") {
      saveUserWishlistToFirestore(STATE.currentUser.uid, STATE.wishlist || []).catch(err => {
        console.warn("[BloomCare Wishlist] Background save deferred:", err?.message || err);
      });
    }
  } catch (e) {
    console.warn("[BloomCare Wishlist] Storage save error:", e);
  }
}

export function loadWishlistFromStorage(userId = null) {
  try {
    const key = getWishlistStorageKey(userId);
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        STATE.wishlist = parsed;
      }
    }
    updateWishlistBadge();
  } catch (e) {
    console.warn("[BloomCare Wishlist] Storage load error:", e);
  }
}

export function updateWishlistBadge() {
  const count = (STATE.wishlist || []).length;
  const badge = $("#nav-wishlist-count");
  if (badge) {
    badge.textContent = String(count);
    badge.classList.toggle("hidden", count === 0);
  }
  const accCount = $("#account-wishlist-count");
  if (accCount) accCount.textContent = String(count);

  $$(".prod-card-fav-btn").forEach(btn => {
    const id = btn.dataset.id;
    if (id) {
      const isFav = (STATE.wishlist || []).includes(id);
      btn.classList.toggle("active", isFav);
      btn.textContent = isFav ? "♥" : "♡";
      btn.setAttribute("aria-label", isFav ? "Remove from wishlist" : "Add to wishlist");
    }
  });
}

export function isInWishlist(productId) {
  return (STATE.wishlist || []).includes(productId);
}

export async function toggleProductWishlist(productId) {
  if (!productId) return false;
  if (!Array.isArray(STATE.wishlist)) STATE.wishlist = [];
  const idx = STATE.wishlist.indexOf(productId);
  let isSaved = false;
  if (idx > -1) {
    STATE.wishlist.splice(idx, 1);
    isSaved = false;
    openNotice("Wishlist Updated", "Item removed from your wishlist.");
  } else {
    STATE.wishlist.push(productId);
    isSaved = true;
    openNotice("Saved to Wishlist", "Item added to your saved items.");
  }
  saveWishlistToStorage();
  updateWishlistBadge();
  return isSaved;
}

export function saveCartItemForLater(productId) {
  const item = STATE.cart.find(i => (i.productId || i.product?.id) === productId);
  if (!item) return;
  if (!Array.isArray(STATE.wishlist)) STATE.wishlist = [];
  if (!STATE.wishlist.includes(productId)) {
    STATE.wishlist.push(productId);
    saveWishlistToStorage();
    updateWishlistBadge();
  }
  removeCartItem(productId);
  openNotice("Saved for Later", `<strong>${escapeHtml(item.name)}</strong> was moved to your Wishlist.`);
}

export function getAddressesStorageKey(userId = null) {
  const uid = userId || STATE.currentUser?.uid || "guest";
  return `bloomcare_saved_addresses_${uid}`;
}

export function saveAddressesToStorage(userId = null) {
  try {
    const key = getAddressesStorageKey(userId);
    localStorage.setItem(key, JSON.stringify(STATE.savedAddresses || []));
    if (STATE.currentUser?.uid && typeof saveUserAddressesToFirestore === "function") {
      saveUserAddressesToFirestore(STATE.currentUser.uid, STATE.savedAddresses || []).catch(err => {
        console.warn("[BloomCare Addresses] Background save deferred:", err?.message || err);
      });
    }
  } catch (e) {
    console.warn("[BloomCare Addresses] Storage save error:", e);
  }
}

export function loadAddressesFromStorage(userId = null) {
  try {
    const key = getAddressesStorageKey(userId);
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        STATE.savedAddresses = parsed;
      }
    }
    if ((!STATE.savedAddresses || STATE.savedAddresses.length === 0) && STATE.currentUser) {
      const legacy = getCustomerDeliveryAddress(STATE.currentUser);
      if (legacy && (legacy.deliveryDivision || legacy.division)) {
        STATE.savedAddresses = [{
          id: "addr-" + Date.now(),
          label: "Home",
          division: legacy.deliveryDivision || legacy.division,
          area: legacy.deliveryArea || legacy.area,
          landmark: legacy.specificLocation || legacy.landmark || legacy.address || "",
          phone: STATE.currentUser.phone || "",
          isDefault: true,
          createdAt: new Date().toISOString()
        }];
        saveAddressesToStorage(userId);
      }
    }
  } catch (e) {
    console.warn("[BloomCare Addresses] Storage load error:", e);
  }
}

export async function loadProductReviews(productId) {
  if (!productId) return [];
  if (STATE.productReviews[productId]) return STATE.productReviews[productId];
  try {
    if (typeof getProductReviewsFromFirestore === "function") {
      const remote = await getProductReviewsFromFirestore(productId);
      if (Array.isArray(remote) && remote.length > 0) {
        STATE.productReviews[productId] = remote;
        return remote;
      }
    }
  } catch (err) {
    console.warn("[BloomCare Reviews] Fetch deferred:", err?.message || err);
  }
  const sample = [
    {
      id: `rev-${productId}-1`,
      reviewerName: "Agaba Emmanuel",
      rating: 5,
      date: "2026-09-02",
      comment: "Genuine product with valid expiry date. Fast delivery in Booma.",
      verifiedBuyer: true
    },
    {
      id: `rev-${productId}-2`,
      reviewerName: "Brenda Kembabazi",
      rating: 5,
      date: "2026-08-28",
      comment: "Dispensed in perfect sealed packaging with clear dosage instructions.",
      verifiedBuyer: true
    }
  ];
  STATE.productReviews[productId] = sample;
  return sample;
}

export async function submitProductReview(productId, rating, comment, reviewerName) {
  const review = {
    id: `rev-${productId}-${Date.now()}`,
    reviewerName: reviewerName || STATE.currentUser?.displayName || "Verified Customer",
    rating: Number(rating) || 5,
    date: new Date().toISOString().split("T")[0],
    comment: (comment || "").trim(),
    verifiedBuyer: true
  };
  if (!STATE.productReviews[productId]) STATE.productReviews[productId] = [];
  STATE.productReviews[productId].unshift(review);

  try {
    if (typeof saveProductReviewToFirestore === "function") {
      await saveProductReviewToFirestore(productId, review);
    }
  } catch (err) {
    console.warn("[BloomCare Reviews] Save deferred:", err?.message || err);
  }
  openNotice("Review Submitted", "Thank you! Your verified customer review has been recorded.");
  return review;
}

export function handleBuyNow(productId) {
  const prod = STATE.products.find(p => p.id === productId);
  if (!prod) return;
  const avail = getProductAvailability(prod);
  if (!avail.isAvailable || prod.stockQuantity <= 0) {
    openNotice("Medicine Unavailable", `Sorry, <strong>${escapeHtml(prod.name)}</strong> is currently ${escapeHtml(avail.label.toLowerCase())}.`);
    return;
  }
  const existing = STATE.cart.find(i => (i.productId || i.product?.id) === productId);
  if (!existing) {
    addToCart(productId, 1);
  }
  $("#product-details-dialog")?.close();
  openCheckoutDialog();
}

export function openWishlistModal() {
  const modal = $("#wishlist-dialog");
  if (!modal) return;
  renderWishlistModalContents();
  modal.showModal();
}

export function renderWishlistModalContents() {
  const container = $("#wishlist-items-container");
  if (!container) return;
  const wishlistIds = STATE.wishlist || [];
  const items = (STATE.products || []).filter(p => wishlistIds.includes(p.id));

  if (items.length === 0) {
    container.innerHTML = `
      <div class="wishlist-empty-state" style="text-align:center; padding:32px 16px;">
        <div style="font-size:40px; margin-bottom:12px; color:var(--muted);">♡</div>
        <h4 style="margin:0 0 6px;">Your Wishlist is Empty</h4>
        <p class="muted" style="margin-bottom:16px; font-size:13px;">Save your frequently needed medicines and healthcare products for quick ordering anytime.</p>
        <button type="button" class="btn btn-primary" id="wishlist-browse-btn">Browse Pharmacy Catalog</button>
      </div>
    `;
    $("#wishlist-browse-btn")?.addEventListener("click", () => {
      $("#wishlist-dialog")?.close();
      navigateTo("medicines");
    });
    return;
  }

  container.innerHTML = `
    <div class="wishlist-cards-list" style="display:flex; flex-direction:column; gap:10px;">
      ${items.map(p => {
        const avail = getProductAvailability(p);
        const img = getProductImage(p);
        return `
          <div class="wishlist-item-card" style="display:flex; align-items:center; justify-content:space-between; padding:10px 12px; border:1px solid var(--border-color); border-radius:var(--radius-sm); background:var(--bg-page); gap:12px;">
            <div style="display:flex; align-items:center; gap:12px; flex:1; min-width:0;">
              <img src="${escapeHtml(img)}" alt="${escapeHtml(p.name)}" style="width:48px; height:48px; object-fit:contain; border-radius:4px; background:#fff; border:1px solid var(--border-color);" onerror="this.onerror=null;this.src='products/placeholder-medicine.svg';" />
              <div style="min-width:0;">
                <div style="font-weight:700; font-size:13.5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(p.name)}</div>
                <div style="font-size:12px; font-weight:700; color:var(--primary);">${formatUGX(p.price)}</div>
                <span class="stock-pill ${avail.badgeClass}" style="font-size:10px; padding:1px 6px;">${avail.label}</span>
              </div>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
              <button type="button" class="btn btn-primary btn-sm wishlist-move-cart-btn" data-id="${p.id}" ${!avail.isAvailable ? "disabled" : ""}>+ Add to Cart</button>
              <button type="button" class="btn btn-outline btn-sm wishlist-remove-btn" data-id="${p.id}" style="color:var(--danger);">&times;</button>
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

export function openAddressModal(addressIdToEdit = null) {
  const modal = $("#address-dialog");
  if (!modal) return;
  const title = $("#address-modal-title");
  const idInput = $("#addr-id");
  const labelInput = $("#addr-label");
  const divSelect = $("#addr-division");
  const areaSelect = $("#addr-area");
  const landmarkInput = $("#addr-landmark");
  const phoneInput = $("#addr-phone");
  const defaultCheck = $("#addr-default");

  if (divSelect) {
    divSelect.innerHTML = `<option value="">-- Select Division --</option>` + MBARARA_DIVISIONS.map(d => `<option value="${d}">${d}</option>`).join("");
    divSelect.onchange = (e) => {
      const val = e.target.value;
      if (!val) {
        areaSelect.innerHTML = `<option value="">-- First Select Division --</option>`;
        areaSelect.disabled = true;
        return;
      }
      const areas = getMbararaAreas(val);
      areaSelect.innerHTML = `<option value="">-- Select Area --</option>` + areas.map(a => `<option value="${a}">${a}</option>`).join("");
      areaSelect.disabled = false;
    };
  }

  if (addressIdToEdit) {
    const addr = (STATE.savedAddresses || []).find(a => a.id === addressIdToEdit);
    if (addr) {
      if (title) title.textContent = "Edit Delivery Address";
      if (idInput) idInput.value = addr.id;
      if (labelInput) labelInput.value = addr.label || "Home";
      if (divSelect) {
        divSelect.value = addr.division || "";
        const areas = getMbararaAreas(addr.division);
        if (areaSelect) {
          areaSelect.innerHTML = `<option value="">-- Select Area --</option>` + areas.map(a => `<option value="${a}">${a}</option>`).join("");
          areaSelect.disabled = false;
          areaSelect.value = addr.area || "";
        }
      }
      if (landmarkInput) landmarkInput.value = addr.landmark || "";
      if (phoneInput) phoneInput.value = addr.phone || STATE.currentUser?.phone || "";
      if (defaultCheck) defaultCheck.checked = Boolean(addr.isDefault);
    }
  } else {
    if (title) title.textContent = "Add Delivery Address";
    if (idInput) idInput.value = "";
    if (labelInput) labelInput.value = "";
    if (divSelect) divSelect.value = "";
    if (areaSelect) {
      areaSelect.innerHTML = `<option value="">-- First Select Division --</option>`;
      areaSelect.disabled = true;
    }
    if (landmarkInput) landmarkInput.value = "";
    if (phoneInput) phoneInput.value = STATE.currentUser?.phone || "";
    if (defaultCheck) defaultCheck.checked = (STATE.savedAddresses || []).length === 0;
  }

  modal.showModal();
}

export function handleAddressFormSubmit(e) {
  e.preventDefault();
  const idInput = $("#addr-id")?.value;
  const label = $("#addr-label")?.value.trim() || "Home";
  const division = $("#addr-division")?.value || "";
  const area = $("#addr-area")?.value || "";
  const landmark = $("#addr-landmark")?.value.trim() || "";
  const phone = $("#addr-phone")?.value.trim() || "";
  const isDefault = Boolean($("#addr-default")?.checked);

  if (!division || !area) {
    openNotice("Incomplete Address", "Please select both a division and an area in Mbarara City.");
    return;
  }

  const phoneVal = validateUgandanPhone(phone);
  if (!phoneVal.valid) {
    openNotice("Invalid Phone Number", phoneVal.message || "Please provide a valid Ugandan phone number.");
    return;
  }

  if (!Array.isArray(STATE.savedAddresses)) STATE.savedAddresses = [];

  if (isDefault) {
    STATE.savedAddresses.forEach(a => a.isDefault = false);
  }

  if (idInput) {
    const idx = STATE.savedAddresses.findIndex(a => a.id === idInput);
    if (idx > -1) {
      STATE.savedAddresses[idx] = {
        ...STATE.savedAddresses[idx],
        label,
        division,
        area,
        landmark,
        phone: phoneVal.normalized,
        isDefault
      };
    }
  } else {
    STATE.savedAddresses.push({
      id: "addr-" + Date.now(),
      label,
      division,
      area,
      landmark,
      phone: phoneVal.normalized,
      isDefault: isDefault || STATE.savedAddresses.length === 0,
      createdAt: new Date().toISOString()
    });
  }

  saveAddressesToStorage();
  $("#address-dialog")?.close();
  renderAccountAddresses();
  renderCheckoutSavedAddresses();
  openNotice("Address Saved", `Delivery address <strong>${escapeHtml(label)}</strong> has been saved.`);
}

export function deleteSavedAddress(addressId) {
  if (!addressId) return;
  STATE.savedAddresses = (STATE.savedAddresses || []).filter(a => a.id !== addressId);
  if (STATE.savedAddresses.length > 0 && !STATE.savedAddresses.some(a => a.isDefault)) {
    STATE.savedAddresses[0].isDefault = true;
  }
  saveAddressesToStorage();
  renderAccountAddresses();
  renderCheckoutSavedAddresses();
  openNotice("Address Deleted", "Delivery address was removed from your address book.");
}

export function setDefaultAddress(addressId) {
  if (!addressId) return;
  (STATE.savedAddresses || []).forEach(a => {
    a.isDefault = (a.id === addressId);
  });
  saveAddressesToStorage();
  renderAccountAddresses();
  renderCheckoutSavedAddresses();
  openNotice("Default Updated", "Default delivery address updated.");
}

export function switchAccountTab(tabName) {
  STATE.activeAccountTab = tabName;
  $$("#account-hub-tabs .account-tab-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.accountTab === tabName);
  });

  const panels = {
    profile: $("#account-panel-profile"),
    orders: $("#account-panel-orders"),
    wishlist: $("#account-panel-wishlist"),
    addresses: $("#account-panel-addresses"),
    prescriptions: $("#account-panel-prescriptions")
  };

  Object.keys(panels).forEach(key => {
    if (panels[key]) {
      panels[key].classList.toggle("hidden", key !== tabName);
    }
  });

  if (tabName === "orders") renderAccountOrders();
  else if (tabName === "wishlist") renderAccountWishlist();
  else if (tabName === "addresses") renderAccountAddresses();
  else if (tabName === "prescriptions") renderAccountPrescriptions();
}

export function renderAccountOrders() {
  const container = $("#account-orders-preview-box");
  if (!container) return;
  const uid = STATE.currentUser?.uid;
  const userOrders = (STATE.orders || []).filter(o => 
    o.customerId === uid || 
    (STATE.currentUser?.email && o.customerEmail === STATE.currentUser.email) ||
    (STATE.currentUser?.phone && o.customerPhone === STATE.currentUser.phone)
  );

  if (userOrders.length === 0) {
    container.innerHTML = `<p class="muted">No orders found. Tap "+ Start New Order" to purchase medicines from our catalog.</p>`;
    return;
  }

  container.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:10px;">
      ${userOrders.slice(0, 10).map(o => `
        <div style="padding:12px; border:1px solid var(--border-color); border-radius:var(--radius-sm); background:var(--bg-page);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <strong style="font-size:13.5px; color:var(--primary);">Order #${escapeHtml(o.orderNumber || o.id)}</strong>
            <span class="status-pill status-${(o.orderStatus || 'pending').toLowerCase().replace(/\s+/g, '-')}" style="font-size:11px; padding:2px 8px; border-radius:12px; font-weight:700;">${escapeHtml(o.orderStatus || 'Pending')}</span>
          </div>
          <div style="font-size:12px; color:var(--muted); margin-bottom:4px;">Placed on: ${new Date(o.createdAt).toLocaleDateString()} &bull; Total: <strong>${formatUGX(o.total || 0)}</strong></div>
          <div style="font-size:12px; color:var(--text-main); margin-bottom:8px;">${escapeHtml((o.items || []).map(i => `${i.quantity}x ${i.name || i.productName}`).join(", "))}</div>
          <div style="display:flex; gap:8px;">
            <button type="button" class="btn btn-outline btn-xs track-order-btn" data-id="${o.id}">Track Order</button>
            <button type="button" class="btn btn-secondary btn-xs view-rec-btn" data-id="${o.id}">View Receipt</button>
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

export function renderAccountWishlist() {
  const container = $("#account-wishlist-preview-box");
  if (!container) return;
  const countEl = $("#account-wishlist-count");
  const wishlistIds = STATE.wishlist || [];
  if (countEl) countEl.textContent = String(wishlistIds.length);
  const items = (STATE.products || []).filter(p => wishlistIds.includes(p.id));

  if (items.length === 0) {
    container.innerHTML = `<p class="muted">Your saved items list is empty. Tap the heart icon on any medicine card to save it here.</p>`;
    return;
  }

  container.innerHTML = `
    <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(200px, 1fr)); gap:12px;">
      ${items.map(p => {
        const avail = getProductAvailability(p);
        const img = getProductImage(p);
        return `
          <div class="wishlist-account-card" style="border:1px solid var(--border-color); border-radius:var(--radius-sm); padding:10px; background:var(--bg-page); display:flex; flex-direction:column; justify-content:space-between;">
            <div>
              <img src="${escapeHtml(img)}" alt="${escapeHtml(p.name)}" style="width:100%; height:110px; object-fit:contain; background:#fff; border-radius:4px; margin-bottom:8px;" onerror="this.onerror=null;this.src='products/placeholder-medicine.svg';" />
              <div style="font-weight:700; font-size:13px; line-height:1.3; margin-bottom:4px;">${escapeHtml(p.name)}</div>
              <div style="font-size:13px; font-weight:700; color:var(--primary);">${formatUGX(p.price)}</div>
            </div>
            <div style="display:flex; gap:6px; margin-top:10px;">
              <button type="button" class="btn btn-primary btn-xs wishlist-move-cart-btn" data-id="${p.id}" ${!avail.isAvailable ? "disabled" : ""} style="flex:1;">+ Cart</button>
              <button type="button" class="btn btn-outline btn-xs wishlist-remove-btn" data-id="${p.id}" style="color:var(--danger);">&times;</button>
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

export function renderAccountAddresses() {
  const container = $("#account-addresses-preview-box");
  if (!container) return;
  const addrs = STATE.savedAddresses || [];

  if (addrs.length === 0) {
    container.innerHTML = `<p class="muted">No delivery addresses saved yet. Add your home, work, or clinic address for faster 1-click checkout.</p>`;
    return;
  }

  container.innerHTML = `
    <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(240px, 1fr)); gap:12px;">
      ${addrs.map(a => `
        <div style="border:1px solid ${a.isDefault ? '#0f766e' : 'var(--border-color)'}; background:${a.isDefault ? 'rgba(15,118,110,0.03)' : 'var(--bg-page)'}; border-radius:var(--radius-sm); padding:12px; display:flex; flex-direction:column; justify-content:space-between;">
          <div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
              <strong style="font-size:13.5px;">📍 ${escapeHtml(a.label || 'Home')}</strong>
              ${a.isDefault ? '<span style="font-size:10px; background:#dcfce7; color:#166534; font-weight:700; padding:1px 6px; border-radius:3px;">DEFAULT</span>' : ''}
            </div>
            <div style="font-size:12px; color:var(--text-main); line-height:1.4;">${escapeHtml(a.division)}, ${escapeHtml(a.area)}</div>
            <div style="font-size:11.5px; color:var(--muted); margin-top:2px;">${escapeHtml(a.landmark || '')}</div>
            <div style="font-size:11.5px; color:var(--muted); margin-top:2px;">Phone: ${escapeHtml(a.phone || '')}</div>
          </div>
          <div style="display:flex; gap:6px; margin-top:10px; border-top:1px solid var(--border-color); padding-top:8px;">
            <button type="button" class="btn btn-outline btn-xs btn-edit-address" data-id="${a.id}">Edit</button>
            ${!a.isDefault ? `<button type="button" class="btn btn-outline btn-xs btn-set-default-address" data-id="${a.id}">Set Default</button>` : ''}
            <button type="button" class="btn btn-outline btn-xs btn-delete-address" data-id="${a.id}" style="color:var(--danger); margin-left:auto;">Delete</button>
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

export function renderAccountPrescriptions() {
  const container = $("#account-rx-preview-box");
  if (!container) return;
  const uid = STATE.currentUser?.uid;
  const userRxs = (STATE.prescriptions || []).filter(p => p.patientId === uid || p.customerId === uid);

  if (userRxs.length === 0) {
    container.innerHTML = `<p class="muted">No prescription records found. Upload a doctor's prescription anytime to get prescription medicine approved.</p>`;
    return;
  }

  container.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:8px;">
      ${userRxs.map(rx => `
        <div style="padding:10px 12px; border:1px solid var(--border-color); border-radius:var(--radius-sm); background:var(--bg-page); display:flex; justify-content:space-between; align-items:center;">
          <div>
            <strong>Rx #${escapeHtml(rx.prescriptionNumber || rx.id)}</strong>
            <div style="font-size:12px; color:var(--muted);">Uploaded on: ${new Date(rx.createdAt).toLocaleDateString()}</div>
          </div>
          <span class="status-pill status-${(rx.status || 'pending').toLowerCase()}" style="font-size:11px; padding:2px 8px; border-radius:12px;">${escapeHtml(rx.status || 'Pending Verification')}</span>
        </div>
      `).join("")}
    </div>
  `;
}

export function renderCheckoutSavedAddresses() {
  const row = $("#chk-saved-addresses-cards");
  if (!row) return;

  const addrs = STATE.savedAddresses || [];
  if (addrs.length === 0) {
    row.innerHTML = `<span style="font-size:11.5px; color:var(--muted); padding:4px 0;">No saved addresses yet. Enter your delivery location below.</span>`;
    return;
  }

  row.innerHTML = addrs.map(a => `
    <div class="chk-saved-address-card ${a.isDefault ? 'active' : ''}" data-id="${a.id}" style="min-width:140px; padding:6px 10px; border:1.5px solid ${a.isDefault ? '#0f766e' : 'var(--border-color)'}; background:${a.isDefault ? '#f0fdf4' : 'var(--bg-card)'}; border-radius:6px; cursor:pointer; font-size:11.5px;">
      <div style="font-weight:700; display:flex; justify-content:space-between; align-items:center;">
        <span>${escapeHtml(a.label || 'Address')}</span>
        ${a.isDefault ? '<span style="font-size:9.5px; color:#166534; font-weight:800;">✓</span>' : ''}
      </div>
      <div style="color:var(--text-main); font-size:11px; margin-top:2px;">${escapeHtml(a.division)}, ${escapeHtml(a.area)}</div>
      <div style="color:var(--muted); font-size:10px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(a.landmark || '')}</div>
    </div>
  `).join("");

  // Select default address if none selected yet
  const defaultAddr = addrs.find(a => a.isDefault) || addrs[0];
  if (defaultAddr) {
    selectCheckoutSavedAddress(defaultAddr.id);
  }
}

export function selectCheckoutSavedAddress(addressId) {
  const addr = (STATE.savedAddresses || []).find(a => a.id === addressId);
  if (!addr) return;

  $$("#chk-saved-addresses-cards .chk-saved-address-card").forEach(c => {
    const isThis = c.dataset.id === addressId;
    c.classList.toggle("active", isThis);
    c.style.borderColor = isThis ? "#0f766e" : "var(--border-color)";
    c.style.background = isThis ? "#f0fdf4" : "var(--bg-card)";
  });

  const divSelect = $("#chk-delivery-division");
  const areaSelect = $("#chk-delivery-area");
  const specificInput = $("#chk-delivery-specific");
  const phoneInput = $("#chk-phone");
  const addrHidden = $("#chk-address");

  if (divSelect) {
    divSelect.value = addr.division;
    const areas = getMbararaAreas(addr.division);
    if (areaSelect) {
      areaSelect.innerHTML = `<option value="">-- Select Area --</option>` + areas.map(a => `<option value="${a}">${a}</option>`).join("");
      areaSelect.disabled = false;
      areaSelect.value = addr.area;
    }
  }
  if (specificInput) specificInput.value = addr.landmark || "";
  if (phoneInput && addr.phone) phoneInput.value = addr.phone;
  if (addrHidden) addrHidden.value = `${addr.division}, ${addr.area} - ${addr.landmark}`;
}

export function switchCheckoutStep(stepNumber) {
  STATE.activeCheckoutStep = stepNumber;
  $$("#checkout-steps-bar .checkout-step-pill").forEach(pill => {
    const step = parseInt(pill.dataset.checkoutStep, 10);
    pill.classList.toggle("active", step === stepNumber);
    pill.classList.toggle("completed", step < stepNumber);
    if (step === stepNumber) {
      pill.style.background = "#0f766e";
      pill.style.color = "#fff";
    } else if (step < stepNumber) {
      pill.style.background = "#dcfce7";
      pill.style.color = "#166534";
    } else {
      pill.style.background = "transparent";
      pill.style.color = "var(--muted)";
    }
  });
}

export function handleDeliverySpeedChange(speed) {
  STATE.deliverySpeed = speed; // "standard" | "express"
  const isPickup = STATE.fulfillmentOption === "pickup";
  const standardFee = 5000;
  const expressFee = 8000;
  STATE.deliveryFee = isPickup ? 0 : (speed === "express" ? expressFee : standardFee);

  const stdCard = $("#speed-card-standard");
  const expCard = $("#speed-card-express");
  if (stdCard && expCard) {
    const isExp = speed === "express";
    stdCard.classList.toggle("active", !isExp);
    expCard.classList.toggle("active", isExp);
    stdCard.style.borderColor = !isExp ? "#0f766e" : "var(--border-color)";
    stdCard.style.background = !isExp ? "#f0fdf4" : "var(--bg-card)";
    expCard.style.borderColor = isExp ? "#0f766e" : "var(--border-color)";
    expCard.style.background = isExp ? "#f0fdf4" : "var(--bg-card)";

    const stdRadio = stdCard.querySelector("input[type='radio']");
    const expRadio = expCard.querySelector("input[type='radio']");
    if (stdRadio) stdRadio.checked = !isExp;
    if (expRadio) expRadio.checked = isExp;
  }

  const subtotal = STATE.cart.reduce((sum, i) => sum + ((i.price ?? i.product?.price ?? 0) * i.quantity), 0);
  const total = subtotal + STATE.deliveryFee;
  if ($("#chk-total-val")) {
    $("#chk-total-val").textContent = formatUGX(total);
  }
}

export function calculateCartSummary(cartItems, flatDeliveryFee = 5000) {
  const subtotal = cartItems.reduce((sum, item) => {
    const p = item.price ?? item.product?.price ?? 0;
    return sum + (p * item.quantity);
  }, 0);
  const deliveryFee = cartItems.length > 0 ? (STATE.fulfillmentOption === "pickup" ? 0 : flatDeliveryFee) : 0;
  const total = subtotal + deliveryFee;
  const requiresPrescription = cartItems.some(item => Boolean(item.requiresPrescription || item.product?.requiresPrescription));
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return {
    subtotal,
    deliveryFee,
    total,
    requiresPrescription,
    totalItems
  };
}

// -------------------------------------------------------------
// ACCOUNT-FIRST AUTHENTICATION GUARD
// -------------------------------------------------------------
function requireAuth(actionCallback = null, pendingPayload = null, customMessage = null) {
  if (STATE.currentUser) {
    return true;
  }

  STATE.pendingAction = pendingPayload;
  const msg = customMessage || "Please create an account or log in to continue using this BloomCare service.";
  const msgEl = $("#auth-required-msg");
  if (msgEl) msgEl.innerHTML = msg;
  $("#auth-required-dialog")?.showModal();
  return false;
}

function executePendingAction() {
  if (!STATE.pendingAction) return;
  const action = STATE.pendingAction;
  STATE.pendingAction = null;

  if (action.type === "add_to_cart" && action.productId) {
    addToCart(action.productId, action.quantity || 1);
    navigateTo("medicines");
  } else if (action.type === "open_cart") {
    openCartDialog();
  } else if (action.type === "open_checkout") {
    openCheckoutDialog();
  } else if (action.type === "navigate" && action.route) {
    navigateTo(action.route);
  }
}

// -------------------------------------------------------------
// -------------------------------------------------------------
// APP INITIALIZATION & FIRESTORE DATA SYNCHRONIZATION
// -------------------------------------------------------------
async function loadAppData(userId = null) {
  loadWishlistFromStorage(userId);
  loadAddressesFromStorage(userId);
  if (userId && getEffectiveRole() === "customer") {
    STATE.orders = [];
    STATE.prescriptions = [];
    STATE.consultations = [];
    STATE.refills = [];
    loadCartFromStorage(userId);
    syncUserCartFromFirestore(userId);
    syncUserWishlistFromFirestore(userId);
    syncUserAddressesFromFirestore(userId);
  }

  try {
    const [fetchedProducts, fetchedCategories, fetchedSettings] = await Promise.all([
      getProducts(),
      getCategories(),
      getSystemSettings()
    ]);

    if (fetchedProducts && fetchedProducts.length > 0) {
      STATE.products = fetchedProducts.map(fp => {
        const init = INITIAL_MEDICINES.find(m => m.id === fp.id);
        if (init && init.imageUrl) {
          // Synchronize with authoritative packshot image
          fp.imageUrl = init.imageUrl;
        }
        return fp;
      });
      for (const m of INITIAL_MEDICINES) {
        if (!STATE.products.some(p => p.id === m.id)) {
          STATE.products.push({ ...m });
        }
      }
    } else {
      STATE.products = deduplicateCatalog([...INITIAL_MEDICINES]);
      try { seedInitialCatalogIfEmpty(INITIAL_MEDICINES, ESSENTIAL_CATEGORIES); } catch (_) {}
    }

    // Enforce strict uniqueness and category-level unique images on runtime catalog
    STATE.products = deduplicateCatalog(STATE.products);
    STATE.products = enforceCategoryUniqueImages(STATE.products);

    if (fetchedCategories && fetchedCategories.length > 0) {
      STATE.categories = fetchedCategories;
    } else {
      STATE.categories = [...ESSENTIAL_CATEGORIES];
    }

    // Dynamically synchronize category counts with actual active products
    STATE.categories.forEach(c => {
      const realCount = STATE.products.filter(p => p.category === c.name && p.status === "active").length;
      if (realCount > 0) c.productCount = realCount;
    });

    if (fetchedSettings) {
      STATE.systemSettings = { ...STATE.systemSettings, ...fetchedSettings };
      syncWhatsAppLinks();
    }

    if (userId) {
      const effRole = getEffectiveRole();
      const [
        userOrders,
        userPrescriptions,
        userConsultations,
        userRefills,
        userDeliveries,
        userConversations,
        userNotifications
      ] = await Promise.all([
        getOrders(userId, effRole),
        getPrescriptions(userId, effRole),
        getConsultations(userId, effRole),
        getRefills(userId, effRole),
        getDeliveries(userId, effRole),
        getDeliveryConversationsForUser(userId, effRole),
        getNotifications(userId, effRole)
      ]);

      const isCustomer = effRole === "customer";
      const isDelivery = effRole === "delivery_person" || effRole === "deliveryStaff";
      if (isCustomer || isDelivery || userOrders?.length) STATE.orders = userOrders || [];
      if (isCustomer || userPrescriptions?.length) STATE.prescriptions = userPrescriptions || [];
      if (isCustomer || userConsultations?.length) STATE.consultations = userConsultations || [];
      if (isCustomer || userRefills?.length) STATE.refills = userRefills || [];

      if (userDeliveries && userDeliveries.length > 0) {
        userDeliveries.forEach(ud => {
          const idx = STATE.deliveries.findIndex(d => d.id === ud.id || d.orderId === ud.orderId || d.orderNumber === ud.orderNumber);
          if (idx >= 0) STATE.deliveries[idx] = { ...STATE.deliveries[idx], ...ud };
          else STATE.deliveries.unshift(ud);
        });
      }

      if (userConversations && userConversations.length > 0) {
        userConversations.forEach(uc => {
          const convId = uc.id || uc.conversationId || `CHAT-${uc.orderId || uc.orderNumber}`;
          const idx = STATE.conversations.findIndex(c => c.id === convId || c.conversationId === convId || c.orderId === uc.orderId);
          if (idx >= 0) STATE.conversations[idx] = { ...STATE.conversations[idx], ...uc, id: convId, conversationId: convId };
          else STATE.conversations.unshift({ ...uc, id: convId, conversationId: convId });
        });
        saveConversationsToStorage();
      }

      if (userNotifications && userNotifications.length > 0) {
        userNotifications.forEach(un => {
          if (!STATE.notifications.some(n => n.id === un.id)) {
            STATE.notifications.unshift(un);
          }
        });
      }

      if (isDelivery && Array.isArray(STATE.orders)) {
        STATE.orders.forEach(ord => {
          if (ord.fulfillmentType === "delivery" || ord.deliveryAddress) {
            const hasDel = STATE.deliveries.some(d => d.orderId === ord.id || d.orderNumber === (ord.orderNumber || ord.id));
            if (!hasDel) {
              STATE.deliveries.unshift({
                id: "DEL-" + (ord.orderNumber || ord.id),
                orderId: ord.id,
                orderNumber: ord.orderNumber || ord.id,
                customerName: ord.customerName,
                phone: ord.customerPhone,
                address: ord.deliveryAddress,
                deliveryDivision: ord.deliveryDivision || "",
                deliveryArea: ord.deliveryArea || "",
                specificLocation: ord.specificLocation || ord.deliveryAddress,
                landmark: ord.landmark || ord.specificLocation || "",
                deliveryInstructions: ord.deliveryInstructions || ord.deliveryNotes || "",
                itemsSummary: Array.isArray(ord.items) ? ord.items.map(i => `${i.quantity}x ${i.name}`).join(", ") : "",
                deliveryManId: ord.deliveryManId || userId,
                deliveryStaffId: ord.deliveryStaffId || ord.deliveryManId || userId,
                deliveryStaffName: ord.deliveryManName || ord.assignedStaff || "Moses Kato",
                status: ord.orderStatus === "Delivered" ? "Delivered" : (ord.orderStatus === "Out for Delivery" ? "Out for Delivery" : "Assigned"),
                createdAt: (ord.createdAt || new Date().toISOString()).slice(0, 10)
              });
            }
          }
        });
      }
    }
  } catch (err) {
    console.warn("[BLOOMCARE DATA FLOW] Using local state with offline safety:", err);
  }
}

export function showAuthLoadingScreen(title = "Loading your BloomCare workspace...", subtitle = "Verifying your account role and access permissions...") {
  const overlay = $("#auth-loading-screen");
  if (!overlay) return;
  const titleEl = $("#auth-loading-title");
  const subEl = $("#auth-loading-subtitle");
  const errorBox = $("#auth-error-box");
  const spinner = $("#auth-loading-spinner");

  if (titleEl) {
    titleEl.textContent = title;
    titleEl.classList.remove("hidden");
  }
  if (subEl) {
    subEl.textContent = subtitle;
    subEl.classList.remove("hidden");
  }
  if (spinner) spinner.classList.remove("hidden");
  if (errorBox) errorBox.classList.add("hidden");
  overlay.classList.remove("hidden");
}

export function showAuthErrorScreen(title = "Account Role Verification Failed", message = "Your account role could not be verified. Please contact the administrator.") {
  const overlay = $("#auth-loading-screen");
  if (!overlay) return;
  const titleEl = $("#auth-loading-title");
  const subEl = $("#auth-loading-subtitle");
  const errorBox = $("#auth-error-box");
  const errorTitle = $("#auth-error-title");
  const errorDesc = $("#auth-error-desc");
  const spinner = $("#auth-loading-spinner");

  if (titleEl) titleEl.classList.add("hidden");
  if (subEl) subEl.classList.add("hidden");
  if (spinner) spinner.classList.add("hidden");

  if (errorTitle) errorTitle.textContent = title;
  if (errorDesc) errorDesc.textContent = message;
  if (errorBox) errorBox.classList.remove("hidden");
  overlay.classList.remove("hidden");
}

export function hideAuthLoadingScreen() {
  const overlay = $("#auth-loading-screen");
  if (overlay) overlay.classList.add("hidden");
}

export function updateDeveloperPreviewBanner() {
  const banner = $("#developer-preview-banner");
  if (!banner) return;
  const isDev = STATE.currentUser?.role === "developer";
  const inPreview = isDev && Boolean(STATE.developerPreviewRole);

  if (inPreview) {
    const textEl = $("#dev-banner-text");
    if (textEl) {
      textEl.innerHTML = `DEVELOPER PREVIEW — VIEWING AS <strong>${escapeHtml(formatRoleName(STATE.developerPreviewRole).toUpperCase())}</strong>`;
    }
    const selectEl = $("#dev-quick-preview-select");
    if (selectEl) {
      selectEl.value = STATE.developerPreviewRole;
    }
    banner.classList.remove("hidden");
  } else {
    banner.classList.add("hidden");
  }
}

export function enterDeveloperPreview(targetRole) {
  if (STATE.currentUser?.role !== "developer") {
    openNotice("Permission Denied", "Developer Preview Mode requires an active developer account.");
    return;
  }
  const normalized = normalizeRole(targetRole);
  STATE.developerPreviewRole = normalized;
  updateDeveloperPreviewBanner();
  updateUserPill();
  renderSidebarNavigation();
  openNotice("Developer Preview Active", `Viewing workspace as <strong>${formatRoleName(normalized)}</strong>. Your actual database role remains <strong>developer</strong>.`);
  navigateTo(ROLE_HOME_ROUTES[normalized] || "dashboard");
}

export function exitDeveloperPreview() {
  STATE.developerPreviewRole = null;
  updateDeveloperPreviewBanner();
  updateUserPill();
  renderSidebarNavigation();
  openNotice("Exited Preview", "Returned to Developer Dashboard.");
  navigateTo(ROLE_HOME_ROUTES.developer);
}

export function syncWhatsAppLinks() {
  const rawNumber = STATE.systemSettings?.whatsapp || "256750210886";
  const normalized = normalizeWhatsAppPhone(rawNumber);
  const directUrl = `https://wa.me/${normalized}`;
  const localFormatted = normalized.startsWith("256") ? "0" + normalized.slice(3) : normalized;

  // 1. Top Announcement Bar (WhatsApp Care Desk: 0750210886)
  const topLink = $("#top-whatsapp-link");
  if (topLink) {
    topLink.href = directUrl;
    topLink.textContent = `WhatsApp Care Desk: ${localFormatted}`;
  }

  // 2. Contact Page Card & Button
  const contactLink = $("#contact-whatsapp-btn");
  if (contactLink) {
    contactLink.href = directUrl;
  }
  const contactCardPhone = $("#contact-card-whatsapp");
  if (contactCardPhone) {
    contactCardPhone.textContent = normalized.startsWith("256")
      ? `+256 ${normalized.slice(3, 6)} ${normalized.slice(6, 9)} ${normalized.slice(9)}`
      : normalized;
  }
}

function setupGlobalDialogNavigation() {
  document.querySelectorAll("dialog").forEach((dialog) => {
    const title = dialog.querySelector("h2, h3")?.textContent?.trim() || "dialog";
    const closeButton = dialog.querySelector(".dialog-close-btn");
    if (closeButton) {
      closeButton.type = "button";
      if (!closeButton.getAttribute("aria-label")) closeButton.setAttribute("aria-label", `Close ${title}`);
      if (!closeButton.title) closeButton.title = "Close";
    } else {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "dialog-close-btn global-dialog-close-btn";
      button.dataset.dialogClose = "true";
      button.setAttribute("aria-label", `Close ${title}`);
      button.title = "Close";
      button.innerHTML = "&times;";
      dialog.appendChild(button);
    }

    const form = dialog.querySelector("form");
    const hasCancel = [...dialog.querySelectorAll("button")].some(button =>
      button.textContent.trim().toLowerCase() === "cancel" || button.dataset.dialogCancel === "true"
    );
    if (form && !hasCancel) {
      const cancel = document.createElement("button");
      cancel.type = "button";
      cancel.className = "btn btn-outline global-dialog-cancel-btn";
      cancel.dataset.dialogCancel = "true";
      cancel.textContent = "Cancel";
      form.insertAdjacentElement("afterend", cancel);
    }

    dialog.querySelectorAll("input, select, textarea").forEach((field) => {
      field.addEventListener("input", () => { dialog.dataset.dirty = "true"; }, { once: false });
      field.addEventListener("change", () => { dialog.dataset.dirty = "true"; }, { once: false });
    });
  });

  document.addEventListener("click", (event) => {
    const closeButton = event.target.closest("[data-dialog-close], .dialog-close-btn");
    const cancelButton = event.target.closest("[data-dialog-cancel]");
    const button = closeButton || cancelButton;
    const dialog = button?.closest("dialog");
    if (!dialog) return;

    if (cancelButton && dialog.dataset.dirty === "true" && !window.confirm("Discard unsaved changes?")) return;
    dialog.close();
    delete dialog.dataset.dirty;
  });
}

async function initApp() {
  // Show Loading Screen Immediately
  showAuthLoadingScreen("Loading your BloomCare workspace...", "Verifying your account role and access permissions...");

  // Sync WhatsApp Link
  syncWhatsAppLinks();

  // Insert Static Header / Sidebar Icons safely
  if ($("#sidebar-profile-icon")) $("#sidebar-profile-icon").innerHTML = ICONS.profile;
  if ($("#sidebar-settings-icon")) $("#sidebar-settings-icon").innerHTML = ICONS.settings;
  if ($("#sidebar-logout-icon")) $("#sidebar-logout-icon").innerHTML = ICONS.logout;
  if ($("#top-search-icon")) $("#top-search-icon").innerHTML = ICONS.search;
  if ($("#catalog-search-symbol")) $("#catalog-search-symbol").innerHTML = ICONS.search;
  if ($("#top-bell-icon")) $("#top-bell-icon").innerHTML = ICONS.notifications;
  if ($("#top-cart-icon")) $("#top-cart-icon").innerHTML = ICONS.cart;
  if ($("#top-avatar-icon")) $("#top-avatar-icon").innerHTML = ICONS.profile;

  loadCartFromStorage();
  bindEventListeners();
  setupGlobalDialogNavigation();

  // Initialize BloomCare AI Chatbot Assistant
  try {
    initBloomCareChatbot({
      getProducts: () => STATE.products,
      getCurrentUser: () => STATE.currentUser,
      getOrders: () => STATE.orders,
      addToCart: (productId, quantity) => addToCart(productId, quantity),
      openProductDetails: (productId) => openProductDetailsModal(productId),
      openOrderTracking: (orderId) => openOrderTrackingModal(orderId),
      whatsappPhone: STATE.systemSettings?.whatsappNumber || "256750210886"
    });
  } catch (chatErr) {
    console.warn("[BloomCare AI] Chatbot initialization warning:", chatErr);
  }

  // Background Delivery, Notifications & Chat Sync
  initAppSyncChannel();
  syncDeliverySystemWithBackend();
  setInterval(syncDeliverySystemWithBackend, 4000);

  // Load public catalog and settings in parallel
  await Promise.all([
    getCategories().then(cats => { if (cats?.length) STATE.categories = cats; }).catch(() => {}),
    getProducts().then(prods => { if (prods?.length) STATE.products = prods; }).catch(() => {}),
    getSystemSettings().then(st => {
      if (st) {
        STATE.systemSettings = { ...STATE.systemSettings, ...st };
        syncWhatsAppLinks();
      }
    }).catch(() => {})
  ]);

  // Firebase Auth Listener
  let initialAuthChecked = false;
  subscribeAuthState(async (user) => {
    if (user) {
      showAuthLoadingScreen("Loading user profile...", "Fetching your verified role and permissions...");
      let profile = null;
      try {
        profile = await getClientProfile(user.uid);
      } catch (err) {
        console.warn("[BloomCare Auth] Profile retrieval failed:", err);
      }

      if (!profile && user.email) {
        try {
          profile = await getClientProfile(user.email);
        } catch (_) {}
      }

      if (!profile) {
        profile = findUserProfile(user.uid) || findUserProfile(user.email);
        if (profile && profile.role) {
          try {
            await updateClientProfile(user.uid, {
              uid: user.uid,
              email: user.email,
              displayName: profile.name || profile.displayName || user.displayName || "User",
              phone: profile.phone || "",
              role: profile.role,
              status: "active"
            });
          } catch (_) {}
        }
      }

      // Check saved session in storage
      if (!profile) {
        const savedSession = getSavedSessionUser();
        if (savedSession && (savedSession.uid === user.uid || (savedSession.email && user.email && savedSession.email.toLowerCase() === user.email.toLowerCase()))) {
          profile = savedSession;
        }
      }

      // If still not found, check INITIAL_USERS for any staff account
      if (!profile && user.email) {
        const staffMatch = INITIAL_USERS.find(u => (u.email && user.email && u.email.toLowerCase() === user.email.toLowerCase()) || u.uid === user.uid);
        if (staffMatch) {
          profile = staffMatch;
        }
      }

      // If still not found, user is authenticated via Firebase Auth!
      // In BloomCare, any newly signed-up or authenticated user who is not a staff member is automatically a verified customer.
      if (!profile) {
        const defaultName = user.displayName || (user.email ? user.email.split("@")[0] : "Customer");
        profile = {
          uid: user.uid,
          id: user.uid,
          email: user.email || "",
          name: defaultName,
          displayName: defaultName,
          phone: user.phoneNumber || "",
          role: "customer",
          accountType: "INDIVIDUAL",
          status: "active",
          createdAt: new Date().toISOString()
        };
        // Persist to local customer cache
        REGISTERED_CUSTOMERS_CACHE.push(profile);
        if (typeof localStorage !== "undefined") {
          try {
            const stored = JSON.parse(localStorage.getItem("bloomcare_registered_customers") || "[]");
            if (!stored.some(c => (c.uid && c.uid === user.uid) || (c.email && user.email && c.email.toLowerCase() === user.email.toLowerCase()))) {
              stored.push(profile);
              localStorage.setItem("bloomcare_registered_customers", JSON.stringify(stored));
            }
          } catch (_) {}
        }
      }

      if (profile && (profile.status === "inactive" || profile.status === "suspended")) {
        try { await signOutUser(); } catch (_) {}
        clearSavedSessionUser();
        STATE.currentUser = null;
        STATE.activeRole = "visitor";
        STATE.authLoading = false;
        STATE.authInitialized = true;
        hideAuthLoadingScreen();
        updateUserPill();
        renderSidebarNavigation();
        openNotice("Account Suspended", "Your account has been deactivated or suspended. Please contact pharmacy administration.");
        navigateTo("auth");
        return;
      }

      let userRole = extractRoleFromProfile(profile);

      // Safe fallback for authenticated users: in BloomCare, users authenticated via Firebase default to customer
      if (!userRole) {
        userRole = "customer";
        if (profile) profile.role = "customer";
      }

      STATE.currentUser = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || profile?.displayName || profile?.name || (profile ? `${profile.firstName || ""} ${profile.lastName || ""}`.trim() : "User"),
        phone: profile?.phone || "",
        role: userRole
      };
      STATE.activeRole = userRole;
      saveSessionUser(STATE.currentUser);
      await loadAppData(user.uid);
    } else {
      const savedSession = getSavedSessionUser();
      const savedRole = extractRoleFromProfile(savedSession);
      if (savedSession && savedRole) {
        STATE.currentUser = {
          ...savedSession,
          role: savedRole
        };
        STATE.activeRole = savedRole;
        await loadAppData(savedSession.uid || "local-user");
      } else {
        // Check for URL query param auto-login (e.g. ?login=customer or ?role=admin)
        let paramRole = null;
        try {
          const params = new URLSearchParams(window.location.search);
          paramRole = params.get("login") || params.get("role");
        } catch (_) {}

        if (paramRole) {
          await switchActiveRole(paramRole);
        } else {
          STATE.currentUser = null;
          STATE.activeRole = "visitor";
          STATE.developerPreviewRole = null;
        }
      }
    }

    STATE.authLoading = false;
    STATE.authInitialized = true;
    hideAuthLoadingScreen();
    updateDeveloperPreviewBanner();
    updateUserPill();
    renderSidebarNavigation();
    updateNotifBadge();
    updateCartBadge();

    if (!initialAuthChecked) {
      initialAuthChecked = true;
      handleRoute();
    } else {
      handleRoute();
    }
  });

  // Fallback safety timeout if Firebase Auth network connection is delayed
  setTimeout(() => {
    if (!initialAuthChecked && STATE.authLoading) {
      const savedSession = getSavedSessionUser();
      const savedRole = extractRoleFromProfile(savedSession);
      if (savedSession && savedRole) {
        STATE.currentUser = {
          ...savedSession,
          role: savedRole
        };
        STATE.activeRole = savedRole;
      } else {
        STATE.currentUser = null;
        STATE.activeRole = "visitor";
      }
      STATE.authLoading = false;
      STATE.authInitialized = true;
      hideAuthLoadingScreen();
      updateDeveloperPreviewBanner();
      updateUserPill();
      renderSidebarNavigation();
      handleRoute();
    }
  }, 4000);
}

function updateUserPill() {
  const roleBox = $("#sidebar-role-container");
  const topRoleBadge = $("#top-role-badge");
  const topUserRole = $("#top-user-role");
  const topUserName = $("#top-user-name");
  const sidebarRoleTag = $("#sidebar-role-tag");
  const sidebarAuthBtnText = $("#sidebar-auth-btn-text");

  const dropdownUserName = $("#dropdown-user-name");
  const dropdownUserRole = $("#dropdown-user-role");
  const topUserCaret = $("#top-user-caret");

  const profileBtn = $("#sidebar-profile-btn");
  const settingsBtn = $("#sidebar-settings-btn");
  const cartBtn = $("#open-cart-btn");

  if (STATE.currentUser) {
    const effectiveRole = getEffectiveRole();
    const isDevPreview = STATE.currentUser.role === "developer" && Boolean(STATE.developerPreviewRole);
    const friendlyRole = isDevPreview 
      ? `Preview (${formatRoleName(effectiveRole)})` 
      : formatRoleName(STATE.currentUser.role);
    const displayRoleTag = isDevPreview 
      ? `DEV (PREVIEW: ${formatRoleName(effectiveRole).toUpperCase()})` 
      : formatRoleName(STATE.currentUser.role).toUpperCase();

    const userName = STATE.currentUser.displayName || "User";
    if (topUserName) topUserName.textContent = userName;
    if (topUserRole) topUserRole.textContent = friendlyRole;
    if (dropdownUserName) dropdownUserName.textContent = userName;
    if (dropdownUserRole) dropdownUserRole.textContent = friendlyRole;
    if (topUserCaret) topUserCaret.style.display = "inline-flex";

    if (topRoleBadge) {
      topRoleBadge.textContent = displayRoleTag;
      topRoleBadge.className = `role-badge role-badge-${effectiveRole}`;
      if (isDevPreview) {
        topRoleBadge.style.borderColor = "#f59e0b";
        topRoleBadge.style.color = "#f59e0b";
      } else {
        topRoleBadge.style.borderColor = "";
        topRoleBadge.style.color = "";
      }
    }
    if (sidebarRoleTag) sidebarRoleTag.textContent = displayRoleTag;
    if (sidebarAuthBtnText) sidebarAuthBtnText.textContent = "Sign Out";
    roleBox?.classList.remove("hidden");

    // Role-specific bottom panel controls
    if (profileBtn) profileBtn.style.display = "flex";
    if (settingsBtn) {
      // Settings: Admin & Developer (system params) or Customer (notification preferences)
      settingsBtn.style.display = (effectiveRole === "admin" || effectiveRole === "developer" || effectiveRole === "customer") ? "flex" : "none";
    }
    // Shopping cart: Only relevant for Customer purchasing medicines (hide for clinical / driver / admin staff)
    if (cartBtn) {
      cartBtn.style.display = (effectiveRole === "customer") ? "inline-flex" : "none";
    }
  } else {
    if (topUserName) topUserName.textContent = "Guest Visitor";
    if (topUserRole) topUserRole.textContent = "Sign In";
    if (dropdownUserName) dropdownUserName.textContent = "Guest Visitor";
    if (dropdownUserRole) dropdownUserRole.textContent = "Visitor";
    if (topUserCaret) topUserCaret.style.display = "none";
    $("#user-profile-dropdown")?.classList.add("hidden");

    if (topRoleBadge) {
      topRoleBadge.textContent = "VISITOR";
      topRoleBadge.className = "role-badge role-badge-visitor";
      topRoleBadge.style.borderColor = "";
      topRoleBadge.style.color = "";
    }
    if (sidebarRoleTag) sidebarRoleTag.textContent = "VISITOR";
    if (sidebarAuthBtnText) sidebarAuthBtnText.textContent = "Log In";
    roleBox?.classList.add("hidden");

    // Visitor: HIDE Profile and Settings; Cart is accessible for shopping
    if (profileBtn) profileBtn.style.display = "none";
    if (settingsBtn) settingsBtn.style.display = "none";
    if (cartBtn) cartBtn.style.display = "inline-flex";
  }
}

export async function switchActiveRole(roleName) {
  showAuthLoadingScreen("Switching profile...", `Loading ${roleName} interface...`);
  const normalized = normalizeRole(roleName);

  if (roleName === "visitor") {
    STATE.currentUser = null;
    STATE.activeRole = "visitor";
    STATE.developerPreviewRole = null;
    clearSavedSessionUser();
  } else if (normalized === "developer") {
    STATE.currentUser = {
      uid: "usr-dev-001",
      email: "dev@bloomcare.com",
      displayName: "Lead Systems Developer",
      phone: "0751000999",
      role: "developer"
    };
    STATE.activeRole = "developer";
    STATE.developerPreviewRole = null;
    saveSessionUser(STATE.currentUser);
  } else if (normalized === "customer") {
    STATE.currentUser = {
      uid: "usr-demo-customer",
      email: "grace.nakato@example.com",
      displayName: "Grace Nakato",
      uid: "usr-cust-demo",
      id: "usr-cust-demo",
      email: "customer@example.com",
      displayName: "Demo Customer",
      name: "Demo Customer",
      phone: "0751234567",
      role: "customer",
      status: "active",
      deliveryAddress: getCustomerDeliveryAddress({ uid: "usr-demo-customer" }) || {
        deliveryDivision: "Kamukuzi",
        deliveryArea: "Ruharo",
        specificLocation: "Plot 14, Kiyanja Road",
        landmark: "Mile 3 opposite Ruharo Mosque",
        deliveryInstructions: "Call upon arrival",
        city: "Mbarara City"
      }
    };
    STATE.activeRole = "customer";
    STATE.developerPreviewRole = null;
    saveSessionUser(STATE.currentUser);
  } else if (normalized === "pharmacist") {
    STATE.currentUser = {
      uid: "usr-staff-2",
      email: "amina.n@bloomcare.com",
      displayName: "Dr. Amina Nanyonga",
      phone: "0751122334",
      role: "pharmacist"
    };
    STATE.activeRole = "pharmacist";
    STATE.developerPreviewRole = null;
    saveSessionUser(STATE.currentUser);
  } else if (normalized === "assistant_pharmacist") {
    STATE.currentUser = {
      uid: "usr-staff-3",
      email: "sarah.n@bloomcare.com",
      displayName: "Sarah Namusoke",
      phone: "0751334455",
      role: "assistant_pharmacist"
    };
    STATE.activeRole = "assistant_pharmacist";
    STATE.developerPreviewRole = null;
    saveSessionUser(STATE.currentUser);
  } else if (normalized === "delivery_person") {
    STATE.currentUser = {
      uid: "usr-staff-4",
      uid: "usr-5",
      id: "usr-5",
      email: "moses.k@bloomcare.com",
      displayName: "Moses Kato",
      name: "Moses Kato",
      phone: "0751445566",
      role: "delivery_person"
    };
    STATE.activeRole = "delivery_person";
    STATE.developerPreviewRole = null;
    saveSessionUser(STATE.currentUser);
  } else if (normalized === "admin") {
    STATE.currentUser = {
      uid: "usr-staff-1",
      email: "admin@bloomcare.com",
      displayName: "Dr. Admin Mugisha",
      phone: "0751001122",
      role: "admin"
    };
    STATE.activeRole = "admin";
    STATE.developerPreviewRole = null;
    saveSessionUser(STATE.currentUser);
  }

  // Clear previous role data from state to prevent data bleed
  if (STATE.activeRole === "customer") {
    const isDemoCustomer = ["usr-demo-customer", "usr-cust-demo"].includes(STATE.currentUser?.uid);
    STATE.orders = isDemoCustomer ? INITIAL_ORDERS.filter(o => o.customerId === STATE.currentUser.uid) : [];
    STATE.prescriptions = isDemoCustomer ? INITIAL_PRESCRIPTIONS.filter(p => p.customerId === STATE.currentUser.uid) : [];
    STATE.consultations = isDemoCustomer ? INITIAL_CONSULTATIONS.filter(c => c.customerId === STATE.currentUser.uid) : [];
    STATE.refills = isDemoCustomer ? INITIAL_REFILLS.filter(r => r.customerId === STATE.currentUser.uid) : [];
  } else {
    STATE.orders = [...INITIAL_ORDERS];
    STATE.prescriptions = [...INITIAL_PRESCRIPTIONS];
  }

  updateDeveloperPreviewBanner();
  updateUserPill();
  renderSidebarNavigation();
  updateNotifBadge();
  await loadAppData(STATE.currentUser?.uid);
  hideAuthLoadingScreen();

  navigateTo(ROLE_HOME_ROUTES[STATE.activeRole] || "dashboard");
}

function canCurrentUserSeeNotification(notification) {
  const user = STATE.currentUser;
  if (!user || !notification) return false;

  const recipientId = notification.userId || notification.recipientId || notification.recipientUserId;
  if (recipientId) return String(recipientId) === String(user.uid);

  const role = normalizeRole(getEffectiveRole());
  if (role === "customer") return false;

  const notificationRole = normalizeRole(notification.role);
  return !notificationRole || notificationRole === role || role === "admin" || role === "developer";
}

function updateNotifBadge() {
  if (!STATE.currentUser) {
    $("#top-notif-badge")?.classList.add("hidden");
    return;
  }
  const unread = STATE.notifications.filter(n => !n.read && canCurrentUserSeeNotification(n)).length;
  const badge = $("#top-notif-badge");
  if (badge) {
    badge.textContent = String(unread);
    badge.classList.toggle("hidden", unread === 0);
  }
  if (!$("#top-notif-dropdown")?.classList.contains("hidden")) {
    renderNotificationsDropdown();
  }
}

export function renderNotificationsDropdown() {
  const container = $("#notif-dropdown-list");
  if (!container) return;

  const list = STATE.notifications.filter(canCurrentUserSeeNotification);

  if (!list || list.length === 0) {
    container.innerHTML = `<div class="notif-empty-state">No notifications right now</div>`;
    return;
  }

  container.innerHTML = list.slice(0, 5).map(n => `
    <div class="notif-dropdown-row ${n.read ? "" : "notif-row-unread"}" data-id="${escapeHtml(n.id)}">
      <div class="notif-row-indicator"></div>
      <div class="notif-row-body">
        <strong class="notif-row-title">${escapeHtml(n.title)}</strong>
        <p class="notif-row-msg">${escapeHtml(n.message)}</p>
        <span class="notif-row-time">${n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Recently"}</span>
      </div>
    </div>
  `).join("");
}

// -------------------------------------------------------------
// DYNAMIC ROLE SIDEBAR NAVIGATION & RBAC ARCHITECTURE
// -------------------------------------------------------------
export const ROLE_HOME_ROUTES = {
  developer: "developer/dashboard",
  admin: "admin/dashboard",
  pharmacist: "pharmacist/dashboard",
  assistant_pharmacist: "assistant_pharmacist/dashboard",
  pharmacyAssistant: "assistant_pharmacist/dashboard",
  delivery_person: "delivery_person/dashboard",
  deliveryStaff: "delivery_person/dashboard",
  customer: "customer/dashboard",
  visitor: "auth"
};

export const ROLE_SIDEBAR_CONFIGS = {
  visitor: [
    { route: "medicines", icon: ICONS.medicines, label: "Medicines" },
    { route: "categories", icon: ICONS.categories, label: "Categories" },
    { route: "about", icon: ICONS.about, label: "About Us" },
    { route: "contact", icon: ICONS.contact, label: "Contact Us" },
    { route: "auth", icon: ICONS.profile, label: "Create Account / Login" }
  ],
  developer: [
    { route: "developer/dashboard", icon: ICONS.dashboard, label: "Developer Console" },
    { route: "admin/users", icon: ICONS.users, label: "Users & Staff" },
    { route: "admin/medicines", icon: ICONS.medicines, label: "Medicines Catalog" },
    { route: "admin/inventory", icon: ICONS.inventory, label: "Stock Inventory" },
    { route: "admin/orders", icon: ICONS.orders, label: "Orders" },
    { route: "admin/reports", icon: ICONS.reports, label: "System Reports" },
    { route: "admin/settings", icon: ICONS.settings, label: "Settings" }
  ],
  customer: [
    { route: "customer/dashboard", icon: ICONS.dashboard, label: "Dashboard" },
    { route: "customer/medicines", icon: ICONS.medicines, label: "Medicines" },
    { route: "customer/categories", icon: ICONS.categories, label: "Categories" },
    { route: "customer/prescriptions", icon: ICONS.prescriptions, label: "Prescriptions" },
    { route: "customer/consultations", icon: ICONS.consultations, label: "Consultations" },
    { route: "customer/refills", icon: ICONS.refills, label: "Refills" },
    { route: "customer/orders", icon: ICONS.orders, label: "Orders" },
    { route: "about", icon: ICONS.about, label: "About Us" },
    { route: "contact", icon: ICONS.contact, label: "Contact Us" },
    { route: "customer-chat", icon: ICONS.chat, label: "Messages" },
    { route: "profile", icon: ICONS.profile, label: "My Profile" },
    { route: "settings", icon: ICONS.settings, label: "Settings" },
    { route: "logout", icon: ICONS.logout, label: "Sign Out", action: "logout" }
  ],
  pharmacist: [
    { route: "pharmacist/dashboard", icon: ICONS.dashboard, label: "Dashboard" },
    { route: "pharmacist/prescriptions", icon: ICONS.prescriptions, label: "Prescriptions" },
    { route: "pharmacist/consultations", icon: ICONS.consultations, label: "Consultations" },
    { route: "pharmacist/refills", icon: ICONS.refills, label: "Refills" },
    { route: "pharmacist/orders", icon: ICONS.orders, label: "Orders" },
    { route: "pharmacist/medicines", icon: ICONS.medicines, label: "Medicines" },
    { route: "pharmacist/inventory", icon: ICONS.inventory, label: "Inventory" }
  ],
  assistant_pharmacist: [
    { route: "assistant_pharmacist/dashboard", icon: ICONS.dashboard, label: "Dashboard" },
    { route: "orders", icon: ICONS.orders, label: "Orders to Pack" },
    { route: "medicines", icon: ICONS.medicines, label: "Medicines" },
    { route: "categories", icon: ICONS.categories, label: "Categories" },
    { route: "inventory", icon: ICONS.inventory, label: "Stock Inventory" }
  ],
  pharmacyAssistant: [
    { route: "assistant_pharmacist/dashboard", icon: ICONS.dashboard, label: "Dashboard" },
    { route: "orders", icon: ICONS.orders, label: "Orders to Pack" },
    { route: "medicines", icon: ICONS.medicines, label: "Medicines" },
    { route: "categories", icon: ICONS.categories, label: "Categories" },
    { route: "inventory", icon: ICONS.inventory, label: "Stock Inventory" }
  ],
  delivery_person: [
    { route: "delivery_person/dashboard", icon: ICONS.dashboard, label: "Dashboard" },
    { route: "deliveries", icon: ICONS.deliveries, label: "Deliveries" },
    { route: "deliveries", icon: ICONS.orders, label: "Assigned Orders" },
    { route: "delivery_person/chat", icon: ICONS.chat, label: "Customer Chat", badgeId: "delivery-chat-unread-badge" }
  ],
  deliveryStaff: [
    { route: "delivery_person/dashboard", icon: ICONS.dashboard, label: "Dashboard" },
    { route: "deliveries", icon: ICONS.deliveries, label: "Deliveries" },
    { route: "deliveries", icon: ICONS.orders, label: "Assigned Orders" },
    { route: "delivery_person/chat", icon: ICONS.chat, label: "Customer Chat", badgeId: "delivery-chat-unread-badge" }
  ],
  admin: [
    { route: "admin/dashboard", icon: ICONS.dashboard, label: "Dashboard" },
    { route: "admin/medicines", icon: ICONS.medicines, label: "Medicines" },
    { route: "admin/orders", icon: ICONS.orders, label: "Orders" },
    { route: "admin/consultations", icon: ICONS.consultations, label: "Consultations" },
    { route: "admin/appointments", icon: ICONS.consultations, label: "Appointments" },
    { route: "admin/users", icon: ICONS.users, label: "Users" },
    { route: "admin/reports", icon: ICONS.reports, label: "Reports" },
    { route: "admin/settings", icon: ICONS.settings, label: "Settings" }
  ]
};

export function renderSidebarNavigation() {
  const menuContainer = $("#sidebar-nav-menu");
  if (!menuContainer) return;

  const effective = getEffectiveRole();
  const items = ROLE_SIDEBAR_CONFIGS[effective] || ROLE_SIDEBAR_CONFIGS.visitor;

  menuContainer.innerHTML = items.map(item => `
    <button class="nav-item ${STATE.currentRoute === item.route ? "active-nav" : ""}" type="button" data-route="${item.route}">
      <span class="nav-svg-icon">${item.icon}</span>
      <span class="nav-text">${item.label}</span>
      ${item.badgeId ? `<span class="nav-badge hidden" id="${item.badgeId}">0</span>` : ""}
    </button>
  `).join("");

  updateChatUnreadBadges();
}

// -------------------------------------------------------------
// REUSABLE ROUTE PROTECTION ENGINE
// -------------------------------------------------------------
export function checkRouteAccess(route, user, role = null) {
  const clean = String(route || "").replace(/^#\/?/, "").replace(/^\/+|\/+$/g, "").trim();
  const effectiveRole = normalizeRole(role || (user ? user.role : "visitor") || "visitor");
  const publicRoutes = ["auth", "login", "register", "staff-login", "medicines", "categories", "about", "contact"];

  // Delivery Person restriction: Strictly remove About Us and Contact Us from Delivery Man interface
  if ((effectiveRole === "delivery_person" || effectiveRole === "deliveryStaff") && (clean === "about" || clean === "contact")) {
    return {
      allowed: false,
      redirect: "delivery_person/dashboard",
      redirectRoute: "delivery_person/dashboard",
      reason: "Access Denied: About Us and Contact Us are not available for Delivery Staff."
    };
  }
  if (clean === "logout") {
    return { allowed: true };
  }
  // Universal public browsing routes (accessible to everyone, including visitors and logged-in users)
  const universalBrowseRoutes = ["medicines", "categories", "about", "contact"];
  if (universalBrowseRoutes.includes(clean)) {
    return { allowed: true };
  }

  // Public authentication routes (accessible to unauthenticated visitors; logged-in users will be redirected)
  const visitorAuthRoutes = ["auth", "login", "register", "staff-login"];
  if ((!user || effectiveRole === "visitor") && visitorAuthRoutes.includes(clean)) {
    return { allowed: true };
  }

  // Account Status Gate: Suspended or Deactivated users cannot access protected features
  if (user && (user.status === "suspended" || user.status === "inactive" || user.status === "deactivated")) {
    if (user.status === "suspended") {
      const msg = `Account Suspended: Your BloomCare account has been suspended${user.suspensionReason ? ` (${user.suspensionReason})` : ""}. Please contact pharmacy support.`;
      return {
        allowed: false,
        suspended: true,
        redirectRoute: "auth",
        reason: msg,
        message: msg
      };
    }
    const msg = "Account Deactivated: Your account has been deactivated. Please contact system administration.";
    return {
      allowed: false,
      deactivated: true,
      redirectRoute: "auth",
      reason: msg,
      message: msg
    };
  }

  // Unauthenticated visitor attempting to access protected route
  if (!user || effectiveRole === "visitor") {
    return {
      allowed: false,
      redirectRoute: "auth",
      reason: "Please log in or create an account to access this page."
    };
  }

  // 1. DEVELOPER ACCESS RULES (Root system access when not in a restricted preview)
  if (effectiveRole === "developer") {
    return { allowed: true };
  }

  // 2. CUSTOMER ACCESS RULES
  // 1. CUSTOMER ACCESS RULES (Strictly Shielded from Staff Portal & Admin Pages)
  if (effectiveRole === "customer") {
    // Customers must NEVER see or access the Clinical & Staff Portal or staff tools
    if (clean.startsWith("developer/") || clean === "developer") {
      return {
        allowed: false,
        redirectRoute: "customer/dashboard",
        reason: "Access Denied: Developer tools are restricted to authorized technical staff."
      };
    }
    if (clean.startsWith("pharmacist/") || clean === "pharmacist" ||
        clean.startsWith("assistant_pharmacist/") || clean.startsWith("assistant-pharmacist/") || clean === "assistant_pharmacist" || clean === "assistant-pharmacist") {
      return {
        allowed: false,
        redirectRoute: "customer/dashboard",
        reason: "Access Denied: Customer accounts cannot access pharmacy staff tools or clinical verification queues."
      };
    }
    if (clean.startsWith("admin/") || clean === "admin" || clean === "admin-audit") {
      return {
        allowed: false,
        redirectRoute: "customer/dashboard",
        reason: "Access Denied: Customer accounts cannot access administrative pages or management tools."
      };
    }
    if (clean === "staff-login" || clean === "staff" || clean.startsWith("staff/") ||
        clean.startsWith("delivery") ||
        ["inventory", "users", "deliveries", "payments", "reports", "audit", "notifications"].includes(clean)) {
      return {
        allowed: false,
        redirectRoute: "customer/dashboard",
        reason: "Access Denied: Customer accounts cannot access the Clinical & Staff Portal or staff tools."
      };
    }

    // Authenticated customers visiting public auth cards are redirected to their shopping dashboard
    if (user && user.uid && (clean === "auth" || clean === "login" || clean === "register")) {
      return {
        allowed: false,
        redirectRoute: "customer/dashboard",
        reason: "Already authenticated as Customer."
      };
    }

    const customerAllowed = [
      "dashboard",
      "customer/dashboard",
      "medicines",
      "customer/medicines",
      "categories",
      "customer/categories",
      "prescriptions",
      "customer/prescriptions",
      "consultations",
      "customer/consultations",
      "refills",
      "customer/refills",
      "orders",
      "customer/orders",
      "customer-chat",
      "chat",
      "delivery-chat",
      "customer/chat",
      "profile",
      "customer/profile",
      "settings",
      "customer/settings",
      "cart",
      "checkout",
      "about",
      "contact"
    ];
    if (customerAllowed.includes(clean)) {
      return { allowed: true };
    }
    return {
      allowed: false,
      redirectRoute: "customer/dashboard",
      reason: "Access Denied: You do not have permission to access this page."
    };
  }

  // 2. AUTHENTICATED STAFF USER REDIRECTION FROM PUBLIC AUTH/CUSTOMER DASHBOARD
  if (user && user.uid && ["admin", "pharmacist", "assistant_pharmacist", "pharmacyAssistant", "delivery_person", "deliveryStaff", "developer"].includes(effectiveRole)) {
    if (clean === "auth" || clean === "login" || clean === "register" || clean === "customer/dashboard" || (clean.startsWith("customer/") && clean.endsWith("/dashboard"))) {
      return {
        allowed: false,
        redirectRoute: ROLE_HOME_ROUTES[effectiveRole] || "dashboard",
        reason: "Directed to designated staff dashboard."
      };
    }
  }

  // 3. PUBLIC ROUTES (For unauthenticated visitors)
  if (publicRoutes.includes(clean)) {
    return { allowed: true };
  }

  // Unauthenticated visitor attempting to access protected route
  if (!user || effectiveRole === "visitor") {
    return {
      allowed: false,
      redirectRoute: "auth",
      reason: "Please log in or create an account to access this page."
    };
  }

  // 4. DEVELOPER ACCESS RULES (Root system access when not in a restricted preview)
  if (effectiveRole === "developer") {
    return { allowed: true };
  }

  // 3. PHARMACIST ACCESS RULES
  if (effectiveRole === "pharmacist") {
    if (clean.startsWith("developer/") || clean === "developer") {
      return {
        allowed: false,
        redirectRoute: "pharmacist/dashboard",
        reason: "Access Denied: Developer console is restricted."
      };
    }
    if (clean.startsWith("admin/") || clean === "admin" || ["users", "reports", "payments", "deliveries", "settings"].includes(clean)) {
      return {
        allowed: false,
        redirectRoute: "pharmacist/dashboard",
        reason: "Access Denied: Pharmacists cannot access administrative or delivery dispatch management pages."
      };
    }
    if (clean === "customer/dashboard" || (clean.startsWith("customer/") && clean.endsWith("/dashboard"))) {
      return {
        allowed: false,
        redirectRoute: "pharmacist/dashboard",
        reason: "Pharmacists are directed to the Pharmacist Dashboard."
      };
    }
    const pharmacistAllowed = [
      "dashboard",
      "pharmacist/dashboard",
      "prescriptions",
      "pharmacist/prescriptions",
      "consultations",
      "pharmacist/consultations",
      "refills",
      "pharmacist/refills",
      "orders",
      "pharmacist/orders",
      "medicines",
      "pharmacist/medicines",
      "inventory",
      "pharmacist/inventory",
      "profile",
      "pharmacist/profile",
      "about",
      "contact"
    ];
    if (pharmacistAllowed.includes(clean)) {
      return { allowed: true };
    }
    return {
      allowed: false,
      redirectRoute: "pharmacist/dashboard",
      reason: "Access Denied: Route not permitted for pharmacist role."
    };
  }

  // 4. ASSISTANT PHARMACIST ACCESS RULES
  if (effectiveRole === "assistant_pharmacist" || effectiveRole === "pharmacyAssistant") {
    if (clean.startsWith("developer/") || clean === "developer") {
      return {
        allowed: false,
        redirectRoute: "assistant_pharmacist/dashboard",
        reason: "Access Denied: Developer console is restricted."
      };
    }
    if (clean.startsWith("admin/") || clean === "admin" || ["users", "reports", "payments", "settings", "deliveries", "prescriptions", "consultations"].includes(clean)) {
      return {
        allowed: false,
        redirectRoute: "assistant_pharmacist/dashboard",
        reason: "Access Denied: Assistant Pharmacists cannot access clinical review, delivery fleet, or administrative pages."
      };
    }
    if (clean === "customer/dashboard" || clean.startsWith("customer/")) {
      return {
        allowed: false,
        redirectRoute: "assistant_pharmacist/dashboard",
        reason: "Assistant Pharmacists are directed to the Assistant Dashboard."
      };
    }
    const assistantAllowed = [
      "dashboard",
      "assistant_pharmacist/dashboard",
      "assistant-pharmacist/dashboard",
      "orders",
      "medicines",
      "categories",
      "inventory",
      "profile",
      "about",
      "contact"
    ];
    if (assistantAllowed.includes(clean)) {
      return { allowed: true };
    }
    return {
      allowed: false,
      redirectRoute: "assistant_pharmacist/dashboard",
      reason: "Access Denied: Route not permitted for Assistant Pharmacist."
    };
  }

  // 5. DELIVERY PERSON ACCESS RULES
  if (effectiveRole === "delivery_person" || effectiveRole === "deliveryStaff") {
    if (clean === "about" || clean === "contact") {
      return {
        allowed: false,
        redirectRoute: "delivery_person/dashboard",
        reason: "Access Denied: About Us and Contact Us are not available for Delivery Staff."
      };
    }
    if (clean.startsWith("developer/") || clean === "developer" || clean.startsWith("admin/") || clean.startsWith("pharmacist/") || ["medicines", "inventory", "prescriptions", "consultations", "refills", "users", "reports", "payments"].includes(clean)) {
      return {
        allowed: false,
        redirectRoute: "delivery_person/dashboard",
        reason: "Access Denied: Delivery personnel are restricted to assigned delivery runs."
      };
    }
    if (["dashboard", "delivery_person/dashboard", "delivery/dashboard", "deliveries", "profile", "settings", "chat", "customer-chat", "delivery_person/chat", "delivery-chat"].includes(clean)) {
      return { allowed: true };
    }
    return {
      allowed: false,
      redirectRoute: "delivery_person/dashboard",
      reason: "Access Denied: Restricted to delivery operations."
    };
  }

  // 6. ADMIN ACCESS RULES
  if (effectiveRole === "admin") {
    if (clean.startsWith("developer/") || clean === "developer") {
      return {
        allowed: false,
        redirectRoute: "admin/dashboard",
        reason: "Access Denied: Developer console is restricted to developers."
      };
    }
    return { allowed: true };
  }

}

export function getNormalizedRoute() {
  const hash = window.location.hash.replace(/^#\/?/, "").replace(/^\/+|\/+$/g, "").trim();
  if (hash) return hash;

  const path = window.location.pathname.replace(/^\/+|\/+$/g, "").trim();
  if (path && path !== "index.html") return path;

  return "";
}

export function navigateTo(route) {
  if (route === "logout" || route === "#logout") {
    $("#logout-confirm-dialog")?.showModal();
    return;
  }
  if (!route) {
    route = ROLE_HOME_ROUTES[STATE.activeRole] || "auth";
  }
  const clean = route.replace(/^#\/?/, "").replace(/^\/+|\/+$/g, "");
  if (clean === "logout") {
    $("#logout-confirm-dialog")?.showModal();
    return;
  }
  const current = getNormalizedRoute();
  if (current && current !== clean && !STATE.handlingBrowserBack) {
    STATE.routeHistory.push(current);
    if (STATE.routeHistory.length > 30) STATE.routeHistory.shift();
  }
  if (window.location.hash !== `#${clean}`) {
    window.location.hash = clean;
  }
  handleRoute();
}

export function handleRoute() {
  if (STATE.authLoading) {
    // Authentication in progress; hold loading overlay and do not render dashboards yet
    return;
  }

  let route = getNormalizedRoute();
  if (route === "logout") {
    $("#logout-confirm-dialog")?.showModal();
    return;
  }

  // If visiting root or generic dashboard, resolve to role's primary designated dashboard
  if (!route || route === "dashboard" || route === "home" || route === "overview") {
    route = ROLE_HOME_ROUTES[STATE.activeRole] || "auth";
  }

  if (route === "catalog") route = STATE.activeRole === "customer" ? "customer/medicines" : "medicines";

  // Instant Demo Login Shortcuts (e.g. #login-customer, #demo-customer, #login-admin, etc.)
  if (route === "login-customer" || route === "demo-customer") {
    switchActiveRole("customer");
    return;
  }
  if (route === "login-admin" || route === "demo-admin") {
    switchActiveRole("admin");
    return;
  }
  if (route === "login-pharmacist" || route === "demo-pharmacist") {
    switchActiveRole("pharmacist");
    return;
  }
  if (route === "login-delivery" || route === "demo-delivery") {
    switchActiveRole("delivery_person");
    return;
  }
  if (route === "login-dev" || route === "demo-dev") {
    switchActiveRole("developer");
    return;
  }

  // Level 2 Security Check: Verify Role-Based Route Access
  const effRole = getEffectiveRole();
  let access = checkRouteAccess(route, STATE.currentUser, effRole);
  if (!access.allowed) {
    let displayReason = access.reason;
    if (effRole === "customer" && (route.startsWith("admin") || route.startsWith("pharmacist") || route.startsWith("assistant_pharmacist") || route.startsWith("assistant-pharmacist") || route.startsWith("delivery") || route.startsWith("staff") || route.startsWith("developer") || ["inventory", "users", "deliveries", "payments", "reports", "staff-login"].includes(route))) {
      displayReason = "Access Denied: Customer accounts cannot access the Clinical & Staff Portal or staff tools.";
    }
    if (displayReason && displayReason !== "Already authenticated as Customer.") {
      openNotice("Access Denied", displayReason);
    }
    const redirectTarget = access.redirectRoute || ROLE_HOME_ROUTES[effRole] || "auth";
    if (window.location.hash !== `#${redirectTarget}`) {
      window.location.hash = redirectTarget;
    }
    route = redirectTarget;
  }

  // Dedicated Auth Views (#staff-login, #login, #register, #auth)
  if (route === "staff-login" || route === "staff" || route === "staff/login") {
    route = "auth";
    $("#register-card")?.classList.add("hidden");
    $("#login-card")?.classList.add("hidden");
    $("#staff-login-card")?.classList.remove("hidden");
  } else if (route === "register") {
    route = "auth";
    $("#login-card")?.classList.add("hidden");
    $("#staff-login-card")?.classList.add("hidden");
    $("#register-card")?.classList.remove("hidden");
  } else if (route === "login" || route === "auth") {
    route = "auth";
    $("#register-card")?.classList.add("hidden");
    $("#staff-login-card")?.classList.add("hidden");
    $("#login-card")?.classList.remove("hidden");
  }

  // Level 2 Security Check: Verify Role-Based Route Access
  access = checkRouteAccess(route, STATE.currentUser, effRole);
  if (!access.allowed) {
    let displayReason = access.reason;
    if (effRole === "customer" && (route.startsWith("admin") || route.startsWith("pharmacist") || route.startsWith("assistant_pharmacist") || route.startsWith("delivery") || route.startsWith("staff") || route.startsWith("developer") || ["inventory", "users", "deliveries", "payments", "reports", "staff-login"].includes(route))) {
      displayReason = "Access denied. Staff privileges required.";
    }
    if (displayReason) {
      openNotice("Access Denied", displayReason);
    }
    const redirectTarget = access.redirectRoute || ROLE_HOME_ROUTES[effRole] || "auth";
    if (window.location.hash !== `#${redirectTarget}`) {
      window.location.hash = redirectTarget;
    }
    route = redirectTarget;
  }

  STATE.currentRoute = route;
  closeMobileDrawer();

  const pageNavigation = $("#global-page-navigation");
  const backButton = $("#global-back-btn");
  const homeRoute = ROLE_HOME_ROUTES[effRole] || "auth";
  if (pageNavigation && backButton) {
    const canGoBack = STATE.routeHistory.length > 0 && route !== homeRoute && route !== "auth";
    pageNavigation.hidden = !canGoBack;
    backButton.onclick = () => {
      if (!STATE.routeHistory.length) return;
      STATE.handlingBrowserBack = true;
      window.history.back();
    };
  }

  // Highlight Active Nav Button in Sidebar
  $$(".sidebar-nav-menu .nav-item").forEach((btn) => {
    const btnRoute = btn.dataset.route;
    const isActive = btnRoute === route || route.startsWith(btnRoute) || (btnRoute && btnRoute.includes("/") && route.endsWith(btnRoute.split("/")[1]));
    btn.classList.toggle("active-nav", Boolean(isActive));
  });

  // Highlight Active Mobile Bottom Nav Button
  $$(".mobile-bottom-nav .mobile-nav-btn").forEach((btn) => {
    const btnRoute = btn.dataset.route;
    if (!btnRoute) return;
    const isActive = btnRoute === route || route.startsWith(btnRoute) || (btnRoute && btnRoute.includes("/") && route.endsWith(btnRoute.split("/")[1]));
    btn.classList.toggle("active", Boolean(isActive));
  });

  // Determine base pane: e.g. "customer/dashboard" -> "dashboard"
  let basePane = route;
  if (route === "staff-login" || route === "staff" || route === "staff/login" || route === "login" || route === "register" || route === "auth") {
    basePane = "auth";
  } else if (route.includes("/")) {
    basePane = route.split("/")[1];
  }

  // Alias & Sub-module routing
  if (basePane === "pharmacists") {
    basePane = "users";
    STATE.userRoleFilter = "pharmacist";
  } else if (basePane === "appointments") {
    basePane = "consultations";
  } else if (basePane === "audit-logs" || basePane === "audit") {
    basePane = "admin-audit";
  } else if (basePane === "chat" || basePane === "delivery-chat" || basePane === "customer-chat") {
    basePane = "customer-chat";
  }

  // Set Browser Title
  const pageTitles = {
    dashboard: effRole === "pharmacist" ? "Pharmacist Dashboard" : effRole === "admin" ? "Admin Dashboard" : effRole === "assistant_pharmacist" ? "Assistant Dashboard" : effRole === "delivery_person" ? "Delivery Dashboard" : effRole === "developer" ? "Developer Console" : "Customer Dashboard",
    medicines: "Medicines",
    categories: "Categories",
    prescriptions: "Prescriptions",
    consultations: "Consultations",
    appointments: "Appointments",
    refills: "Refills",
    orders: effRole === "customer" ? "My Orders" : "Orders",
    inventory: "Inventory",
    customers: "Customers",
    users: "User Management",
    pharmacists: "Pharmacist Directory",
    "admin-audit": "Admin Audit Logs",
    "audit-logs": "Admin Audit Logs",
    audit: "Admin Audit Logs",
    deliveries: "Deliveries",
    "customer-chat": "Customer Chat",
    chat: "Customer Chat",
    payments: "Payments",
    reports: "Reports",
    notifications: "Notifications",
    profile: "Profile & Security",
    settings: "Settings",
    about: "About BloomCare",
    contact: "Contact Us",
    auth: "Account Portal"
  };
  document.title = `${pageTitles[basePane] || "Portal"} — BloomCare Pharmacy`;

  // Switch View Panes
  $$(".app-content-viewport .page-pane").forEach((pane) => {
    pane.classList.toggle("hidden", pane.id !== `view-${basePane}`);
  });

  // Render Target View Module
  if (basePane === "dashboard") renderRoleDashboard();
  else if (basePane === "medicines") renderMedicinesView();
  else if (basePane === "categories") renderCategoriesView();
  else if (basePane === "prescriptions") renderPrescriptionsView();
  else if (basePane === "consultations") renderConsultationsView();
  else if (basePane === "refills") renderRefillsView();
  else if (basePane === "orders") renderOrdersView();
  else if (basePane === "inventory") renderInventoryView();
  else if (basePane === "customers") renderCustomersView();
  else if (basePane === "users") renderUsersView();
  else if (basePane === "admin-audit" || basePane === "audit-logs") renderAdminAuditLogsView();
  else if (basePane === "deliveries") renderDeliveriesView();
  else if (basePane === "customer-chat" || basePane === "chat") renderDeliveryChatView();
  else if (basePane === "payments") renderPaymentsView();
  else if (basePane === "reports") renderReportsView();
  else if (basePane === "notifications") renderNotificationsView();
  else if (basePane === "profile") renderProfileView();
  else if (basePane === "settings") renderSettingsView();
  else if (basePane === "about") renderAboutView();
  else if (basePane === "contact") renderContactView();

  window.scrollTo({ top: 0, behavior: "smooth" });
}

export const handleHashRoute = handleRoute;

// -------------------------------------------------------------
// MODULE 1: ROLE-BASED DASHBOARDS
// MODULE 1: ROLE-BASED DASHBOARDS & PREMIUM WELCOME HERO
// -------------------------------------------------------------
export function openBloomCareHeroLightbox() {
  const dlg = $("#bloomcare-hero-lightbox");
  if (!dlg) return;
  if (typeof dlg.showModal === "function") {
    try {
      dlg.showModal();
    } catch (_) {
      dlg.setAttribute("open", "");
    }
  } else {
    dlg.setAttribute("open", "");
  }
}

export function closeBloomCareHeroLightbox() {
  const dlg = $("#bloomcare-hero-lightbox");
  if (!dlg) return;
  if (typeof dlg.close === "function") {
    try {
      dlg.close();
    } catch (_) {
      dlg.removeAttribute("open");
    }
  } else {
    dlg.removeAttribute("open");
  }
}

export function renderBloomCareDashboardHero() {
  const heroContainer = $("#bloomcare-dashboard-hero");
  if (!heroContainer) return;

  const currentU = STATE.currentUser;
  const effRole = getEffectiveRole();
  let userName = currentU?.displayName || currentU?.name || "";
  if (!userName) {
    if (effRole === "admin") userName = "Dr. Admin Mugisha";
    else if (effRole === "pharmacist") userName = "Dr. Sarah Nakato";
    else if (effRole === "assistant_pharmacist" || effRole === "pharmacyAssistant") userName = "David Okello";
    else if (effRole === "delivery_person" || effRole === "deliveryStaff") userName = "Robert Mukasa";
    else if (effRole === "developer") userName = "Lead Engineer";
    else if (effRole === "customer") userName = "Valued Customer";
    else userName = "Healthcare Partner";
  }

  heroContainer.innerHTML = `
    <div class="bloomcare-hero-card">
      <div class="bloomcare-hero-glow-1" aria-hidden="true"></div>
      <div class="bloomcare-hero-glow-2" aria-hidden="true"></div>

      <div class="bloomcare-hero-layout">
        <!-- LEFT COLUMN: WELCOME & BRAND STORY -->
        <div class="bloomcare-hero-content">
          <div class="bloomcare-hero-badge-row">
            <span class="bloomcare-hero-badge">
              <svg class="bloomcare-leaf-svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
                <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
              </svg>
              <span>BLOOMCARE PHARMACY</span>
            </span>
          </div>

          <div class="bloomcare-hero-welcome-msg">
            Welcome back, <strong class="bloomcare-user-highlight">${escapeHtml(userName)}</strong>
          </div>

          <h1 class="bloomcare-hero-headline">
            Care That Goes<br />
            <span class="bloomcare-hero-gradient-text">Beyond Medicine.</span>
          </h1>

          <p class="bloomcare-hero-support-text">
            Quality medicines, trusted healthcare and a healthier community — all in one place.
          </p>

          <div class="bloomcare-hero-features">
            <div class="bloomcare-feature-chip">
              <span class="bloomcare-feature-check">✓</span>
              <span>Quality Medicines</span>
            </div>
            <div class="bloomcare-feature-chip">
              <span class="bloomcare-feature-check">✓</span>
              <span>Trusted Healthcare</span>
            </div>
            <div class="bloomcare-feature-chip">
              <span class="bloomcare-feature-check">✓</span>
              <span>Better Community</span>
            </div>
          </div>

          <div class="bloomcare-hero-actions">
            <button class="btn btn-primary bloomcare-hero-cta-btn" id="btn-hero-explore" type="button">
              <span>Explore BloomCare</span>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
            <span class="bloomcare-hero-tagline">"Your Health, Our Priority"</span>
          </div>
        </div>

        <!-- RIGHT COLUMN: OFFICIAL CUSTOMER PHOTO -->
        <div class="bloomcare-hero-media">
          <div class="bloomcare-hero-img-container" id="bloomcare-hero-img-container" title="Click to view full image" role="button" tabindex="0" aria-label="View BloomCare customer image in full size">
            <div class="bloomcare-hero-img-glow" aria-hidden="true"></div>
            <img src="bloomcare-customer-hero.png" alt="BloomCare Pharmacy Customer with branded bag and pharmacist" class="bloomcare-customer-hero-img" loading="eager" />
            <div class="bloomcare-hero-zoom-badge">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                <line x1="11" y1="8" x2="11" y2="14"></line>
                <line x1="8" y1="11" x2="14" y2="11"></line>
              </svg>
              <span>Click to expand</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Attach interactive click listeners
  const imgContainer = $("#bloomcare-hero-img-container");
  if (imgContainer) {
    imgContainer.addEventListener("click", openBloomCareHeroLightbox);
    imgContainer.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openBloomCareHeroLightbox();
      }
    });
  }

  const exploreBtn = $("#btn-hero-explore");
  if (exploreBtn) {
    exploreBtn.addEventListener("click", () => {
      if (effRole === "customer") {
        navigateTo("medicines");
      } else {
        const roleDash = $("#role-dashboard-container");
        if (roleDash) {
          roleDash.scrollIntoView({ behavior: "smooth", block: "start" });
        } else {
          navigateTo("medicines");
        }
      }
    });
  }
}

function renderRoleDashboard() {
  const container = $("#role-dashboard-container");
  if (!container) return;

  renderBloomCareDashboardHero();

  const role = getEffectiveRole();
  const todayStr = new Date().toISOString().slice(0, 10);
  const todaySales = STATE.orders.filter(o => o.orderStatus !== "Cancelled" && o.createdAt.slice(0, 10) === todayStr).reduce((sum, o) => sum + (o.total || 0), 0);
  const totalRev = STATE.orders.filter(o => o.orderStatus !== "Cancelled").reduce((sum, o) => sum + (o.total || 0), 0);
  const lowStockCount = STATE.products.filter(p => p.stockQuantity <= p.reorderLevel).length;
  const pendingRxCount = STATE.prescriptions.filter(p => p.status === "Pending" || p.status === "Pending Review" || p.status === "Under Review").length;
  const pendingRefillsCount = STATE.refills.filter(r => r.status === "Pending" || r.status === "Under Review").length;

  if (role === "developer") {
    // 0. DEVELOPER DASHBOARD
    container.innerHTML = `
      <div class="page-header-block flex-between">
        <div>
          <h1 class="page-title">Developer Workspace &amp; RBAC Simulation Console</h1>
          <p class="page-desc">Real-time architecture status, role preview simulation, audit traces, and system diagnostics.</p>
        </div>
        <div style="display:flex; gap:10px;">
          <button class="btn btn-primary btn-sm" id="dev-btn-walkin-sale" type="button">+ New Walk-in Sale</button>
          <button class="btn btn-outline btn-sm" id="dev-btn-manage-users" type="button" data-route="admin/users">Manage Staff Accounts</button>
        </div>
      </div>

      <!-- ROLE PREVIEW / TESTING MODE SUITE -->
      <div class="content-card" style="border-left: 4px solid #f59e0b; margin-bottom: 24px;">
        <div class="flex-between">
          <div>
            <h3 style="display:flex; align-items:center; gap:8px;">
              <span class="dev-mode-pill">DEVELOPER TESTING MODE</span>
              <span>View Dashboard As (Role Simulation)</span>
            </h3>
            <p class="muted" style="margin:4px 0 0; font-size:13px;">
              Select any role below to test their complete dashboard, permissions, and sidebar navigation without changing your database credentials.
            </p>
          </div>
        </div>

        <div class="dev-sim-grid">
          <div class="dev-sim-card">
            <div>
              <div class="dev-sim-role-title">Administrator</div>
              <div class="dev-sim-role-desc">Financial analytics, staff management, inventory control, and system configuration.</div>
            </div>
            <button class="btn btn-primary btn-sm dev-sim-trigger-btn" data-preview-role="admin" type="button">Preview as Admin</button>
          </div>

          <div class="dev-sim-card">
            <div>
              <div class="dev-sim-role-title">Pharmacist</div>
              <div class="dev-sim-role-desc">Clinical prescription verification queue, consultations schedule, and refill approvals.</div>
            </div>
            <button class="btn btn-primary btn-sm dev-sim-trigger-btn" data-preview-role="pharmacist" type="button">Preview as Pharmacist</button>
          </div>

          <div class="dev-sim-card">
            <div>
              <div class="dev-sim-role-title">Assistant Pharmacist</div>
              <div class="dev-sim-role-desc">Order packing, stock control, customer assist, and OTC inventory fulfillment.</div>
            </div>
            <button class="btn btn-primary btn-sm dev-sim-trigger-btn" data-preview-role="assistant_pharmacist" type="button">Preview as Asst. Pharmacist</button>
          </div>

          <div class="dev-sim-card">
            <div>
              <div class="dev-sim-role-title">Delivery Person</div>
              <div class="dev-sim-role-desc">Doorstep dispatch runs, customer locations, and delivery status updates.</div>
            </div>
            <button class="btn btn-primary btn-sm dev-sim-trigger-btn" data-preview-role="delivery_person" type="button">Preview as Delivery</button>
          </div>

          <div class="dev-sim-card">
            <div>
              <div class="dev-sim-role-title">Customer</div>
              <div class="dev-sim-role-desc">Retail medicine catalog, cart checkout, order tracking, and customer profile.</div>
            </div>
            <button class="btn btn-primary btn-sm dev-sim-trigger-btn" data-preview-role="customer" type="button">Preview as Customer</button>
          </div>
        </div>
      </div>

      <!-- ENVIRONMENT & ARCHITECTURE HEALTH STATUS -->
      <div class="kpi-grid-4">
        <div class="kpi-card">
          <div>
            <span class="kpi-label"><span class="env-health-indicator"></span>Frontend Engine</span>
            <strong class="kpi-value" style="font-size:18px;">Vite 5 (ESM)</strong>
            <small class="muted">Live at :8080</small>
          </div>
        </div>
        <div class="kpi-card">
          <div>
            <span class="kpi-label"><span class="env-health-indicator"></span>Cloud Database</span>
            <strong class="kpi-value" style="font-size:18px;">Firestore (v2)</strong>
            <small class="muted">Active &amp; Rules Enforced</small>
          </div>
        </div>
        <div class="kpi-card">
          <div>
            <span class="kpi-label"><span class="env-health-indicator"></span>Auth Provider</span>
            <strong class="kpi-value" style="font-size:18px;">Firebase RBAC</strong>
            <small class="muted">Profile Role Verification</small>
          </div>
        </div>
        <div class="kpi-card">
          <div>
            <span class="kpi-label"><span class="env-health-indicator"></span>Payment Gateway</span>
            <strong class="kpi-value" style="font-size:18px;">Python API</strong>
            <small class="muted">Live at :8787/health</small>
          </div>
        </div>
      </div>

      <!-- LIVE SYSTEM DATA METRICS -->
      <div class="kpi-grid-4" style="margin-top:16px;">
        <div class="kpi-card" data-route="admin/users"><div class="kpi-icon-wrap">${ICONS.users}</div><div><strong class="kpi-value">${STATE.users.length}</strong><span class="kpi-label">Registered Users</span></div></div>
        <div class="kpi-card" data-route="admin/medicines"><div class="kpi-icon-wrap">${ICONS.medicines}</div><div><strong class="kpi-value">${STATE.products.length}</strong><span class="kpi-label">Catalog Products</span></div></div>
        <div class="kpi-card" data-route="admin/orders"><div class="kpi-icon-wrap">${ICONS.orders}</div><div><strong class="kpi-value">${STATE.orders.length}</strong><span class="kpi-label">System Orders</span></div></div>
        <div class="kpi-card"><div class="kpi-icon-wrap">${ICONS.dashboard}</div><div><strong class="kpi-value">${STATE.auditLogs.length}</strong><span class="kpi-label">Security Audit Events</span></div></div>
      </div>

      <!-- REAL-TIME AUDIT LOGS TRACE -->
      <div class="content-card" style="margin-top:20px;">
        <div class="flex-between">
          <h3>System Audit Trail &amp; Role Trace Logs</h3>
          <span class="muted" style="font-size:12px;">Real-time security logs</span>
        </div>
        <div class="table-responsive">
          <table class="standard-table">
            <thead><tr><th>Timestamp</th><th>Action</th><th>Target</th><th>Performed By</th><th>Details</th></tr></thead>
            <tbody>
              ${STATE.auditLogs.slice(-6).reverse().map(l => `
                <tr>
                  <td><small>${new Date(l.timestamp).toLocaleTimeString()}</small></td>
                  <td><span class="status-pill status-confirmed">${escapeHtml(l.action)}</span></td>
                  <td><code>${escapeHtml(l.recordType)}/${escapeHtml(l.recordId)}</code></td>
                  <td><strong>${escapeHtml(l.performedBy)}</strong></td>
                  <td>${escapeHtml(l.details)}</td>
                </tr>
              `).join("") || `<tr><td colspan="5" class="text-center muted">No audit logs recorded yet in this session.</td></tr>`}
            </tbody>
          </table>
      <!-- ROLE PERMISSIONS & WORKFLOW LOGIC MATRIX -->
      <div class="content-card" style="margin-top:20px;">
        <div class="flex-between">
          <div>
            <h3>Role Authorization Hierarchy &amp; Permission Matrix</h3>
            <p class="muted" style="font-size:12.5px;">Comprehensive capability mapping and security clearance levels across all 6 roles.</p>
          </div>
          <span class="status-pill status-confirmed">RBAC Engine Active</span>
        </div>
        <div class="table-responsive" style="margin-top:10px;">
          <table class="standard-table">
            <thead>
              <tr>
                <th>Role</th>
                <th>Clearance Level</th>
                <th>Clinical Verification</th>
                <th>Fulfillment &amp; Packing</th>
                <th>Doorstep Dispatch</th>
                <th>User Management</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Developer</strong></td>
                <td><span class="status-pill status-confirmed">Level 100 (Root)</span></td>
                <td><span class="status-pill status-completed">Full Access</span></td>
                <td><span class="status-pill status-completed">Full Access</span></td>
                <td><span class="status-pill status-completed">Full Access</span></td>
                <td><span class="status-pill status-completed">All Roles + Dev</span></td>
              </tr>
              <tr>
                <td><strong>Administrator</strong></td>
                <td><span class="status-pill status-confirmed">Level 80 (Executive)</span></td>
                <td><span class="status-pill status-completed">Approved</span></td>
                <td><span class="status-pill status-completed">Approved</span></td>
                <td><span class="status-pill status-completed">Approved</span></td>
                <td><span class="status-pill status-confirmed">Staff Roles &lt; 80</span></td>
              </tr>
              <tr>
                <td><strong>Pharmacist</strong></td>
                <td><span class="status-pill status-confirmed">Level 60 (Clinical)</span></td>
                <td><span class="status-pill status-completed">Clinical Lead</span></td>
                <td><span class="status-pill status-completed">Supervised</span></td>
                <td><span class="status-pill status-cancelled">Blocked</span></td>
                <td><span class="status-pill status-cancelled">No Access</span></td>
              </tr>
              <tr>
                <td><strong>Assistant Pharmacist</strong></td>
                <td><span class="status-pill status-pending">Level 40 (Operational)</span></td>
                <td><span class="status-pill status-cancelled">Blocked (Clinical Gate)</span></td>
                <td><span class="status-pill status-completed">Order Packing &amp; Stock</span></td>
                <td><span class="status-pill status-cancelled">Blocked</span></td>
                <td><span class="status-pill status-cancelled">No Access</span></td>
              </tr>
              <tr>
                <td><strong>Delivery Person</strong></td>
                <td><span class="status-pill status-pending">Level 20 (Logistics)</span></td>
                <td><span class="status-pill status-cancelled">No Access</span></td>
                <td><span class="status-pill status-cancelled">No Access</span></td>
                <td><span class="status-pill status-completed">Dispatch &amp; Doorstep</span></td>
                <td><span class="status-pill status-cancelled">No Access</span></td>
              </tr>
              <tr>
                <td><strong>Customer</strong></td>
                <td><span class="status-pill status-pending">Level 10 (Client)</span></td>
                <td><span class="status-pill status-confirmed">Upload Rx Scan Only</span></td>
                <td><span class="status-pill status-cancelled">No Access</span></td>
                <td><span class="status-pill status-cancelled">No Access</span></td>
                <td><span class="status-pill status-cancelled">Self Profile Only</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;

    container.querySelectorAll(".dev-sim-trigger-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        enterDeveloperPreview(btn.dataset.previewRole);
      });
    });
    $("#dev-btn-walkin-sale")?.addEventListener("click", () => openWalkinSaleModal());

  } else if (role === "admin") {
    // 1. REDESIGNED MODERN ADMINISTRATOR DASHBOARD
    const totalUsersCount = STATE.users.length;
    const customerCount = STATE.users.filter(u => u.role === "customer").length;
    const staffCount = STATE.users.filter(u => u.role !== "customer").length;

    const totalProductsCount = STATE.products.length;
    const activeProductsCount = STATE.products.filter(p => p.stockQuantity > 0).length;
    const lowStockCount = STATE.products.filter(p => p.stockQuantity <= (p.reorderLevel || 10)).length;

    const totalOrdersCount = STATE.orders.length;
    const completedOrdersCount = STATE.orders.filter(o => ["Completed", "Delivered"].includes(o.orderStatus)).length;
    const pendingOrdersCount = STATE.orders.filter(o => !["Completed", "Delivered", "Cancelled"].includes(o.orderStatus)).length;

    const totalConsultationsCount = STATE.consultations.length;
    const pendingConsultationsCount = STATE.consultations.filter(c => ["Pending", "Scheduled"].includes(c.status || "Pending")).length;

    // Time-aware greeting
    const currentHour = new Date().getHours();
    let greetingPrefix = "Good morning";
    if (currentHour >= 12 && currentHour < 17) {
      greetingPrefix = "Good afternoon";
    } else if (currentHour >= 17 || currentHour < 5) {
      greetingPrefix = "Good evening";
    }
    const adminDisplayName = STATE.currentUser?.displayName || "Dr. Admin Mugisha";

    const todayDateFormatted = new Date().toLocaleDateString("en-UG", {
      weekday: "long",
      day: "numeric",
      month: "short",
      year: "numeric"
    });

    // Compile Recent Operational Activity (chronological 4-5 items from real state)
    const activityList = [];

    (STATE.orders || []).forEach(o => {
      activityList.push({
        title: `Order #${o.orderNumber || o.id} placed by ${o.customerName || "Customer"}`,
        meta: `${formatUGX(o.total)} • Doorstep Delivery`,
        timestamp: o.createdAt ? new Date(o.createdAt).getTime() : Date.now(),
        dateLabel: o.createdAt ? new Date(o.createdAt).toLocaleDateString() : "Today",
        status: o.orderStatus || "Pending",
        statusClass: `status-${(o.orderStatus || "pending").toLowerCase().replace(/\s+/g, "_")}`,
        icon: ICONS.orders,
        iconBoxClass: "icon-type-order",
        route: "admin/orders"
      });
    });

    (STATE.consultations || []).forEach(c => {
      activityList.push({
        title: `Consultation: ${c.patientPhone || c.userName || "Patient"} with Dr. ${c.pharmacistName || "Sarah Nakato"}`,
        meta: `Fee: UGX 15,000 • ${c.timeSlot || "Scheduled Session"}`,
        timestamp: c.createdAt ? new Date(c.createdAt).getTime() : (Date.now() - 3600000),
        dateLabel: c.date || (c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "Today"),
        status: c.status || "Pending",
        statusClass: `status-${(c.status || "pending").toLowerCase().replace(/\s+/g, "_")}`,
        icon: ICONS.consultations,
        iconBoxClass: "icon-type-consultation",
        route: "admin/consultations"
      });
    });

    (STATE.users || []).slice(-8).forEach(u => {
      activityList.push({
        title: `New user: ${u.name || u.displayName || "Client Account"}`,
        meta: `${u.email} • Role: ${formatRoleName(u.role)}`,
        timestamp: u.createdAt ? new Date(u.createdAt).getTime() : (Date.now() - 7200000),
        dateLabel: u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "Recent",
        status: u.status || "active",
        statusClass: `status-${(u.status || "active").toLowerCase()}`,
        icon: ICONS.users,
        iconBoxClass: "icon-type-user",
        route: "admin/users"
      });
    });

    (STATE.products || []).filter(p => p.stockQuantity <= (p.reorderLevel || 10)).slice(0, 3).forEach(p => {
      activityList.push({
        title: `Low stock alert: ${p.name}`,
        meta: `Only ${p.stockQuantity} units left in dispensary (reorder: ${p.reorderLevel || 10})`,
        timestamp: Date.now() - 1800000,
        dateLabel: "Needs Action",
        status: "Low Stock",
        statusClass: "status-warning",
        icon: ICONS.inventory,
        iconBoxClass: "icon-type-stock",
        route: "admin/medicines"
      });
    });

    // Sort chronologically and display top 4-5
    activityList.sort((a, b) => b.timestamp - a.timestamp);
    const topActivities = activityList.slice(0, 5);

    container.innerHTML = `
      <!-- Time-Aware Dashboard Header -->
      <div class="admin-dash-welcome flex-between">
        <div>
          <h1 class="admin-dash-greeting">${greetingPrefix}, ${escapeHtml(adminDisplayName)}</h1>
          <p class="admin-dash-sub">Here's what's happening at BloomCare today.</p>
        </div>
        <div style="display:flex; align-items:center; gap:10px;">
          <button class="btn btn-primary btn-sm" id="admin-btn-walkin-sale" type="button" style="display:inline-flex; align-items:center; gap:6px;">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span>+ New Walk-in Sale</span>
          </button>
          <div class="admin-dash-date-badge">
            <svg class="admin-cal-svg" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <span>${todayDateFormatted}</span>
          </div>
        </div>
      </div>

      <!-- Core Operational KPI Summary Cards (Exactly 4 Cards) -->
      <div class="admin-summary-grid">
        <div class="admin-summary-card" data-route="admin/users" role="button" tabindex="0">
          <div class="admin-summary-card-top">
            <span class="admin-card-icon-wrap icon-wrap-users">${ICONS.users}</span>
            <span class="admin-card-trend-badge">${customerCount} Customers</span>
          </div>
          <div class="admin-summary-body">
            <strong class="admin-summary-number">${totalUsersCount}</strong>
            <span class="admin-summary-title">Total Users</span>
            <span class="admin-summary-secondary">${customerCount} customers &bull; ${staffCount} staff</span>
          </div>
        </div>

        <div class="admin-summary-card" data-route="admin/medicines" role="button" tabindex="0">
          <div class="admin-summary-card-top">
            <span class="admin-card-icon-wrap icon-wrap-medicines">${ICONS.medicines}</span>
            <span class="admin-card-trend-badge">${activeProductsCount} Active</span>
          </div>
          <div class="admin-summary-body">
            <strong class="admin-summary-number">${totalProductsCount}</strong>
            <span class="admin-summary-title">Medicines</span>
            <span class="admin-summary-secondary">${activeProductsCount} in stock &bull; ${lowStockCount} low stock</span>
          </div>
        </div>

        <div class="admin-summary-card" data-route="admin/orders" role="button" tabindex="0">
          <div class="admin-summary-card-top">
            <span class="admin-card-icon-wrap icon-wrap-orders">${ICONS.orders}</span>
            <span class="admin-card-trend-badge">${completedOrdersCount} Fulfilled</span>
          </div>
          <div class="admin-summary-body">
            <strong class="admin-summary-number">${totalOrdersCount}</strong>
            <span class="admin-summary-title">Orders</span>
            <span class="admin-summary-secondary">${completedOrdersCount} completed &bull; ${pendingOrdersCount} pending</span>
          </div>
        </div>

        <div class="admin-summary-card" data-route="admin/appointments" role="button" tabindex="0">
          <div class="admin-summary-card-top">
            <span class="admin-card-icon-wrap icon-wrap-consultations">${ICONS.consultations}</span>
            <span class="admin-card-trend-badge">${pendingConsultationsCount} Pending</span>
          </div>
          <div class="admin-summary-body">
            <strong class="admin-summary-number">${totalConsultationsCount}</strong>
            <span class="admin-summary-title">Appointments</span>
            <span class="admin-summary-secondary">${pendingConsultationsCount} pending pharmacist review</span>
          </div>
        </div>
      </div>

      <!-- Sales Overview Analytics Section (Admin Exclusive) -->
      <div class="admin-section-block" id="admin-sales-overview-section"></div>

      <!-- Walk-in Pharmacy Sales & Counter Register Hub (Admin Access) -->
      <div class="admin-section-block" id="admin-walkin-overview-section"></div>

      <!-- AI Product Recommendations & Purchasing Trends (Admin Access) -->
      <div class="admin-section-block" id="admin-recommendations-analytics-section"></div>

      <!-- AI Assistant Usage & Clinical Inquiries (Admin Access) -->
      <div class="admin-section-block" id="admin-ai-assistant-analytics-section"></div>

      <!-- Quick Actions Section (Max 4 Actions) -->
      <div class="admin-section-block">
        <div class="admin-section-head">
          <h2 class="admin-section-title">Quick Actions</h2>
        </div>
        <div class="admin-actions-grid">
          <button class="admin-action-btn primary-action" id="dash-btn-add-prod" type="button">
            <span class="admin-action-icon">${ICONS.medicines}</span>
            <div class="admin-action-text">
              <strong>+ Add Medicine</strong>
              <small>Add new item to dispensary</small>
            </div>
          </button>
          <button class="admin-action-btn" type="button" data-route="admin/orders">
            <span class="admin-action-icon">${ICONS.orders}</span>
            <div class="admin-action-text">
              <strong>Manage Orders</strong>
              <small>Process deliveries &amp; status</small>
            </div>
          </button>
          <button class="admin-action-btn" type="button" data-route="admin/users">
            <span class="admin-action-icon">${ICONS.users}</span>
            <div class="admin-action-text">
              <strong>Manage Users</strong>
              <small>Accounts, roles &amp; privileges</small>
            </div>
          </button>
          <button class="admin-action-btn" type="button" data-route="admin/reports">
            <span class="admin-action-icon">${ICONS.reports}</span>
            <div class="admin-action-text">
              <strong>View Reports</strong>
              <small>Sales, audits &amp; analytics</small>
            </div>
          </button>
        </div>
      </div>

      <!-- Recent Operational Activity Section -->
      <div class="admin-section-block">
        <div class="admin-activity-card">
          <div class="admin-activity-card-header flex-between">
            <div>
              <h2 class="admin-section-title" style="margin-bottom:2px;">Recent Activity</h2>
              <p class="admin-section-caption">Latest customer orders, clinical bookings, and system updates</p>
            </div>
            <button class="btn btn-outline btn-sm" type="button" data-route="admin/reports">View All &rarr;</button>
          </div>

          <div class="admin-activity-list">
            ${topActivities.length === 0 ? `<div class="admin-activity-empty">No recent activity found.</div>` : topActivities.map(act => `
              <div class="admin-activity-row" data-route="${act.route}" role="button" tabindex="0">
                <div class="admin-activity-main">
                  <div class="admin-act-icon-wrap ${act.iconBoxClass}">
                    ${act.icon}
                  </div>
                  <div class="admin-act-info">
                    <strong class="admin-act-title">${escapeHtml(act.title)}</strong>
                    <span class="admin-act-meta">${escapeHtml(act.meta)}</span>
                  </div>
                </div>
                <div class="admin-activity-status-col">
                  <span class="status-pill ${act.statusClass}">${escapeHtml(act.status)}</span>
                  <small class="admin-act-date">${escapeHtml(act.dateLabel)}</small>
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      </div>
    `;

    $("#dash-btn-add-prod")?.addEventListener("click", () => openProductFormModal());
    $("#admin-btn-walkin-sale")?.addEventListener("click", () => openWalkinSaleModal());
    renderSalesOverviewSection($("#admin-sales-overview-section"), STATE.salesOverviewPeriod || "today");
    renderAdminWalkinSection();
    renderAdminRecommendationsSection();
    renderAdminAiAnalyticsSection();

  } else if (role === "pharmacist") {
    // 2. PHARMACIST DASHBOARD
    container.innerHTML = `
      <div class="page-header-block flex-between">
        <div>
          <h1 class="page-title">Pharmacist Dashboard</h1>
          <p class="page-desc">Review prescriptions, manage clinical consultations and handle refill requests.</p>
        </div>
        <div style="display:flex; gap:10px;">
          <button class="btn btn-primary" id="pharmacist-btn-walkin-sale" type="button" style="display:inline-flex; align-items:center; gap:6px;">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span>+ New Walk-in Sale</span>
          </button>
        </div>
      </div>

      <div class="kpi-grid-4">
        <div class="kpi-card" data-route="prescriptions"><div class="kpi-icon-wrap">${ICONS.prescriptions}</div><div><strong class="kpi-value">${pendingRxCount}</strong><span class="kpi-label">Pending Prescriptions</span></div></div>
        <div class="kpi-card" data-route="consultations"><div class="kpi-icon-wrap">${ICONS.consultations}</div><div><strong class="kpi-value">${STATE.consultations.length}</strong><span class="kpi-label">Today's Consultations</span></div></div>
        <div class="kpi-card" data-route="refills"><div class="kpi-icon-wrap">${ICONS.refills}</div><div><strong class="kpi-value">${pendingRefillsCount}</strong><span class="kpi-label">Pending Refills</span></div></div>
        <div class="kpi-card" data-route="orders"><div class="kpi-icon-wrap">${ICONS.orders}</div><div><strong class="kpi-value">${STATE.orders.filter(o => o.orderStatus === "Awaiting Prescription Review").length}</strong><span class="kpi-label">Orders Requiring Attention</span></div></div>
      </div>

      <div class="content-dual-grid">
        <div class="content-card">
          <div class="flex-between"><h3>Prescription Review Queue</h3><button class="text-link" data-route="prescriptions">Full Queue &rarr;</button></div>
          <div class="table-responsive">
            <table class="standard-table">
              <thead><tr><th>Rx ID</th><th>Customer</th><th>Date</th><th>Status</th><th>Review</th></tr></thead>
              <tbody>
                ${STATE.prescriptions.slice(0, 4).map(rx => `
                  <tr>
                    <td><strong>${escapeHtml(rx.prescriptionNumber || rx.id)}</strong></td>
                    <td>${escapeHtml(rx.customerName)}</td>
                    <td>${new Date(rx.createdAt).toLocaleDateString()}</td>
                    <td><span class="status-pill status-${rx.status.toLowerCase().replace(/ /g, "_")}">${escapeHtml(rx.status)}</span></td>
                    <td><button class="btn btn-primary btn-sm open-rx-review-btn" data-id="${rx.id}">Review</button></td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </div>

        <div class="content-card">
          <div class="flex-between"><h3>Recent Refill Requests</h3><button class="text-link" data-route="refills">Refills Desk &rarr;</button></div>
          <div class="table-responsive">
            <table class="standard-table">
              <thead><tr><th>Refill #</th><th>Medicine</th><th>Quantity</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                ${STATE.refills.slice(0, 4).map(r => `
                  <tr>
                    <td><strong>${escapeHtml(r.refillNumber || r.id)}</strong></td>
                    <td>${escapeHtml(r.medicineName)}</td>
                    <td>${r.quantity}</td>
                    <td><span class="status-pill status-${r.status.toLowerCase()}">${escapeHtml(r.status)}</span></td>
                    <td><button class="btn btn-primary btn-sm quick-refill-approve" data-id="${r.id}">Verify</button></td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    $("#pharmacist-btn-walkin-sale")?.addEventListener("click", () => openWalkinSaleModal());

  } else if (role === "assistant_pharmacist" || role === "pharmacyAssistant") {
    // 3. PHARMACY ASSISTANT DASHBOARD
    container.innerHTML = `
      <div class="page-header-block flex-between">
        <div>
          <h1 class="page-title">Assistant Pharmacist Dashboard</h1>
          <p class="page-desc">Monitor inventory stock levels, prepare pending orders and assist dispensing.</p>
        </div>
        <div style="display:flex; gap:10px;">
          <button class="btn btn-primary" id="assistant-btn-walkin-sale" type="button" style="display:inline-flex; align-items:center; gap:6px;">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span>+ New Walk-in Sale</span>
          </button>
        </div>
      </div>

      <div class="kpi-grid-4">
        <div class="kpi-card" data-route="orders"><div class="kpi-icon-wrap">${ICONS.orders}</div><div><strong class="kpi-value">${STATE.orders.filter(o => o.orderStatus === "Processing" || o.orderStatus === "Confirmed").length}</strong><span class="kpi-label">Orders to Prepare</span></div></div>
        <div class="kpi-card" data-route="inventory"><div class="kpi-icon-wrap">${ICONS.inventory}</div><div><strong class="kpi-value" style="color:var(--warning);">${lowStockCount}</strong><span class="kpi-label">Low Stock</span></div></div>
        <div class="kpi-card" data-route="medicines"><div class="kpi-icon-wrap">${ICONS.medicines}</div><div><strong class="kpi-value">${STATE.products.length}</strong><span class="kpi-label">Products</span></div></div>
        <div class="kpi-card" data-route="orders"><div class="kpi-icon-wrap">${ICONS.check}</div><div><strong class="kpi-value">${STATE.orders.filter(o => o.orderStatus === "Ready for Pickup" || o.orderStatus === "Out for Delivery" || o.orderStatus === "Delivered").length}</strong><span class="kpi-label">Packed &amp; Dispatched</span></div></div>
      </div>

      <div class="content-card">
        <h3>Orders to Prepare &amp; Pack</h3>
        <div class="table-responsive">
          <table class="standard-table">
            <thead><tr><th>Order #</th><th>Customer</th><th>Items Summary</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              ${STATE.orders.slice(0, 5).map(o => `
                <tr>
                  <td><strong>${escapeHtml(o.orderNumber || o.id)}</strong></td>
                  <td>${escapeHtml(o.customerName)}</td>
                  <td>${o.items.map(i => `${i.quantity}x ${i.name}`).join(", ")}</td>
                  <td><span class="status-pill status-${o.orderStatus.toLowerCase().replace(/ /g, "_")}">${escapeHtml(o.orderStatus)}</span></td>
                  <td><button class="btn btn-secondary btn-sm manage-order-btn" data-id="${o.id}">Update Status</button></td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;

    $("#assistant-btn-walkin-sale")?.addEventListener("click", () => openWalkinSaleModal());

  } else if (role === "delivery_person" || role === "deliveryStaff") {
    // 4. DELIVERY STAFF DASHBOARD
    const driverUid = STATE.currentUser?.uid;
    const isMoses = driverUid === "eM6qgrSVjTeTUo62Sa556sKkXpG3" || driverUid === "usr-5" || driverUid === "usr-staff-5";
    const myDeliveries = STATE.deliveries.filter(d =>
      !STATE.currentUser || 
      d.deliveryManId === driverUid || 
      d.deliveryStaffId === driverUid ||
      (isMoses && (d.deliveryManId === "usr-5" || d.deliveryStaffId === "usr-5" || d.deliveryManId === "eM6qgrSVjTeTUo62Sa556sKkXpG3" || d.deliveryStaffId === "eM6qgrSVjTeTUo62Sa556sKkXpG3")) ||
      d.deliveryStaffName === STATE.currentUser?.displayName ||
      d.deliveryStaffName === STATE.currentUser?.name
    );
    const assigned = myDeliveries.filter(d => d.status !== "Delivered");
    const outForDelivery = myDeliveries.filter(d => d.status === "Out for Delivery");
    const completed = myDeliveries.filter(d => d.status === "Delivered");

    const myConversations = STATE.conversations.filter(c => canUserAccessConversation(c, STATE.currentUser, "delivery_person"));
    const activeConvs = myConversations.filter(c => c.status === "ACTIVE" && c.deliveryStatus !== "Delivered");
    const unreadMessagesCount = myConversations.reduce((sum, c) => sum + (c.unreadCountForDelivery || c.unreadDelivery || 0), 0);

    // Driver notifications
    const myUserId = STATE.currentUser?.uid || STATE.currentUser?.id;
    const isMosesUser = myUserId === "eM6qgrSVjTeTUo62Sa556sKkXpG3" || myUserId === "usr-5" || myUserId === "usr-staff-5";
    const myNotifs = STATE.notifications.filter(n => 
      !n.recipientId || 
      n.recipientId === myUserId || 
      (isMosesUser && (n.recipientId === "eM6qgrSVjTeTUo62Sa556sKkXpG3" || n.recipientId === "usr-5" || n.recipientId === "usr-staff-5")) ||
      n.role === "delivery_person" || 
      n.role === "deliveryStaff"
    );
    const unreadNotifs = myNotifs.filter(n => !n.read);

    container.innerHTML = `
      <div class="page-header-block flex-between">
        <div>
          <h1 class="page-title">Delivery Dashboard</h1>
          <p class="page-desc">Track assigned dispatches, live customer communications, and delivery completions.</p>
        </div>
        <button class="btn btn-primary btn-sm" id="btn-delivery-dash-chat" type="button" data-route="delivery_person/chat" style="display:inline-flex; align-items:center; gap:6px;">
          ${ICONS.chat}
          <span>Customer Chat ${unreadMessagesCount > 0 ? `(${unreadMessagesCount})` : ''}</span>
        </button>
      </div>

      <div class="kpi-grid-4">
        <div class="kpi-card" data-route="deliveries"><div class="kpi-icon-wrap">${ICONS.deliveries}</div><div><strong class="kpi-value">${assigned.length}</strong><span class="kpi-label">Assigned Deliveries</span></div></div>
        <div class="kpi-card" data-route="deliveries"><div class="kpi-icon-wrap">${ICONS.deliveries}</div><div><strong class="kpi-value">${outForDelivery.length}</strong><span class="kpi-label">Out for Delivery</span></div></div>
        <div class="kpi-card" data-route="deliveries"><div class="kpi-icon-wrap">${ICONS.check}</div><div><strong class="kpi-value">${completed.length}</strong><span class="kpi-label">Completed Deliveries</span></div></div>
        <div class="kpi-card" data-route="delivery_person/chat"><div class="kpi-icon-wrap">${ICONS.chat}</div><div><strong class="kpi-value" id="dash-active-chats-count">${activeConvs.length}</strong><span class="kpi-label">Active Chats (<span id="dash-unread-chats-count">${unreadMessagesCount} unread</span>)</span></div></div>
      </div>

      <!-- PROMINENT NEW & ACTIVE DELIVERIES SECTION -->
      <div class="content-card new-deliveries-section" style="margin-top:20px; border-left:4px solid #0284c7;">
        <div class="flex-between" style="margin-bottom:14px; flex-wrap:wrap; gap:10px;">
          <div>
            <h3 style="display:flex; align-items:center; gap:8px; margin:0;">
              <span>🛵</span>
              <span>NEW &amp; ACTIVE DELIVERIES</span>
            </h3>
            <p class="muted" style="margin:2px 0 0; font-size:12.5px;">Newly assigned online customer orders requiring doorstep fulfillment in Mbarara City.</p>
          </div>
          <span class="badge" style="background:#e0f2fe; color:#0369a1; font-weight:700; font-size:12px; padding:4px 10px; border-radius:12px;">
            ${assigned.length} Active Run${assigned.length === 1 ? '' : 's'}
          </span>
        </div>

        <div class="new-deliveries-list" id="dash-new-deliveries-list">
          ${assigned.length === 0 ? `
            <div style="padding:24px 16px; text-align:center; background:#f8fafc; border-radius:10px; border:1px dashed #cbd5e1;">
              <p class="muted" style="margin:0; font-size:13.5px;">No active deliveries currently waiting. Newly placed online orders will appear here automatically.</p>
            </div>
          ` : assigned.map(d => {
            const relOrder = STATE.orders.find(o => o.id === d.orderId || o.orderNumber === d.orderNumber);
            const feeVal = relOrder?.deliveryFee ?? 5000;
            return `
              <div class="new-delivery-card" id="card-${escapeHtml(d.id)}">
                <div class="new-delivery-header">
                  <div style="display:flex; align-items:center; gap:8px;">
                    <span class="new-delivery-badge">NEW ASSIGNMENT</span>
                    <strong style="font-size:15px; color:#0f172a;">Order #${escapeHtml(d.orderNumber || d.orderId || d.id)}</strong>
                  </div>
                  <span class="status-pill status-${d.status.toLowerCase().replace(/ /g, '_')}">${escapeHtml(d.status)}</span>
                </div>

                <div class="new-delivery-grid">
                  <div class="new-delivery-cell">
                    <span class="confirm-cell-label">Customer</span>
                    <strong style="font-size:13.5px; color:#0f172a;">${escapeHtml(d.customerName || 'Customer')}</strong>
                    <small style="color:#64748b;">📞 ${escapeHtml(d.phone || 'No phone')}</small>
                  </div>
                  <div class="new-delivery-cell">
                    <span class="confirm-cell-label">Delivery Location</span>
                    <strong style="font-size:13.5px; color:#0f172a;">${escapeHtml(d.specificLocation || d.address || 'Mbarara City')}</strong>
                    ${(d.deliveryDivision || d.deliveryArea) ? `<small style="color:#64748b;">${escapeHtml(d.deliveryDivision || '')}${d.deliveryArea ? ' • ' + escapeHtml(d.deliveryArea) : ''}</small>` : ''}
                    ${d.landmark ? `<small style="color:#0284c7;">📍 Landmark: Near ${escapeHtml(d.landmark)}</small>` : ''}
                  </div>
                  <div class="new-delivery-cell">
                    <span class="confirm-cell-label">Order Value</span>
                    <strong style="font-size:14px; color:#0f172a;">${formatUGX(relOrder?.total || (feeVal + (relOrder?.subtotal || 0)))}</strong>
                    <small style="color:#15803d; font-weight:600;">Fee: ${formatUGX(feeVal)} (PAID)</small>
                  </div>
                  <div class="new-delivery-cell">
                    <span class="confirm-cell-label">Items Summary</span>
                    <span style="font-size:12.5px; color:#334155;">${escapeHtml(d.itemsSummary || 'Prescription / Medicines')}</span>
                  </div>
                </div>

                <div class="new-delivery-actions">
                  <button class="btn btn-outline btn-sm view-dash-del-details" data-id="${d.id}" type="button">
                    🔍 View Delivery Details
                  </button>
                  <button class="btn btn-primary btn-sm quick-driver-chat-btn" data-order-id="${d.orderNumber || d.orderId || d.id}" type="button" style="display:inline-flex; align-items:center; gap:5px;">
                    ${ICONS.chat}
                    <span>💬 Chat with Customer</span>
                  </button>
                  ${d.phone ? `
                    <a class="btn btn-outline btn-sm" href="tel:${escapeHtml(d.phone)}" style="display:inline-flex; align-items:center; gap:5px; text-decoration:none;">
                      <span>📞 Call Customer</span>
                    </a>
                  ` : ''}
                  ${(d.status !== "Accepted" && d.status !== "Picked Up" && d.status !== "Out for Delivery" && d.status !== "Delivered") ? `
                    <button class="btn btn-secondary btn-sm quick-driver-action" data-id="${d.id}" data-action="accept-delivery" type="button" style="background:#0284c7; border-color:#0284c7; color:#fff;">
                      ✓ Accept Delivery
                    </button>
                  ` : `
                    <button class="btn btn-secondary btn-sm quick-driver-action" data-id="${d.id}" data-action="picked-up" type="button">
                      Picked Up
                    </button>
                  `}
                  <button class="btn btn-secondary btn-sm quick-driver-action" data-id="${d.id}" data-action="mark-delivered" type="button" style="background:#16a34a; border-color:#16a34a; color:#fff;">
                    📦 Mark Delivered
                  </button>
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </div>

      <!-- DELIVERY NOTIFICATIONS SECTION -->
      <div class="content-card delivery-notifs-container">
        <div class="flex-between" style="margin-bottom:12px; flex-wrap:wrap; gap:10px;">
          <div>
            <h3 style="display:flex; align-items:center; gap:8px; margin:0;">
              <span>🔔</span>
              <span>DELIVERY NOTIFICATIONS</span>
            </h3>
            <p class="muted" style="margin:2px 0 0; font-size:12.5px;">Real-time dispatch alerts and direct customer message notifications.</p>
          </div>
          ${unreadNotifs.length > 0 ? `
            <span class="badge" style="background:#dc2626; color:#fff; font-size:11.5px; font-weight:700; padding:3px 8px; border-radius:10px;">
              ${unreadNotifs.length} Unread
            </span>
          ` : ''}
        </div>

        <div class="delivery-notifs-list" id="delivery-dash-notifs-list">
          ${myNotifs.length === 0 ? `
            <p class="muted" style="font-size:13px; padding:12px 0; margin:0;">No delivery notifications.</p>
          ` : myNotifs.slice(0, 5).map(n => `
            <div class="delivery-notif-card ${n.read ? '' : 'notif-unread'}">
              <div class="delivery-notif-left">
                <span class="delivery-notif-badge">${n.type === 'NEW_CUSTOMER_MESSAGE' ? '💬' : '🛵'}</span>
                <div>
                  <div class="delivery-notif-title">${escapeHtml(n.title || 'Notification')}</div>
                  <div class="delivery-notif-desc">${escapeHtml(n.message || '')}</div>
                  <div class="delivery-notif-meta">
                    ${n.customerName ? `<span>Customer: <strong>${escapeHtml(n.customerName)}</strong></span> &bull; ` : ''}
                    ${n.deliveryLocation ? `<span>📍 ${escapeHtml(n.deliveryLocation)}</span> &bull; ` : ''}
                    ${n.deliveryFee ? `<span>Fee: ${formatUGX(n.deliveryFee)}</span> &bull; ` : ''}
                    <span>${formatTimeAgo(n.createdAt)}</span>
                  </div>
                </div>
              </div>
              <div style="display:flex; gap:6px; align-items:center;">
                ${(n.orderId || n.conversationId) ? `
                  <button class="btn btn-primary btn-xs quick-driver-chat-btn" data-order-id="${n.orderId}" type="button">
                    💬 Open Chat
                  </button>
                ` : ''}
                ${!n.read ? `
                  <button class="btn btn-outline btn-xs mark-driver-notif-read" data-id="${n.id}" type="button">
                    Mark Read
                  </button>
                ` : `<span class="muted" style="font-size:11.5px;">Read</span>`}
              </div>
            </div>
          `).join("")}
        </div>
      </div>

      <!-- CUSTOMER CHAT DASHBOARD SECTION -->
      <div class="content-card" style="margin-top:20px;">
        <div class="flex-between" style="flex-wrap:wrap; gap:10px; margin-bottom:14px;">
          <div>
            <h3 style="display:flex; align-items:center; gap:8px; margin:0;">
              <span>💬</span>
              <span>CUSTOMER CHAT WORKSPACE</span>
            </h3>
            <span class="muted" style="font-size:12.5px;">Active Conversations: <strong>${activeConvs.length}</strong> &bull; Unread Messages: <strong id="dash-unread-chats-preview-count" style="color:${unreadMessagesCount > 0 ? '#dc2626' : 'inherit'};">${unreadMessagesCount}</strong></span>
          </div>
          <div style="display:flex; gap:8px;">
            <button class="btn btn-primary btn-sm" data-route="delivery_person/chat" type="button">Open Full Chat Workspace &rarr;</button>
          </div>
        </div>

        <div class="delivery-dash-chat-list" id="delivery-dash-chat-preview-list">
          ${myConversations.length === 0 ? `
            <p class="muted" style="font-size:13px; margin:16px 0;">No customer conversations associated with your delivery runs.</p>
          ` : myConversations.slice(0, 5).map(c => `
            <div class="delivery-dash-conv-row flex-between" style="padding:12px 14px; border:1px solid var(--line); border-radius:8px; margin-bottom:8px; background:#ffffff; flex-wrap:wrap; gap:8px;">
              <div style="display:flex; align-items:center; gap:12px;">
                <div class="chat-avatar-circle" style="width:36px; height:36px; border-radius:50%; background:#e0f2fe; color:#0369a1; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:13px;">
                  ${escapeHtml(c.customerName?.charAt(0) || 'C')}
                </div>
                <div>
                  <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                    <strong>${escapeHtml(c.customerName || 'Customer')}</strong>
                    <span style="font-size:11.5px;" class="muted">Order #${escapeHtml(c.orderNumber || c.orderId)}</span>
                    <span class="status-pill status-${(c.deliveryStatus || 'Assigned').toLowerCase().replace(/ /g, '_')}" style="font-size:10.5px; padding:2px 6px;">
                      ${escapeHtml(c.deliveryStatus || 'Assigned')}
                    </span>
                    ${(c.unreadCountForDelivery || c.unreadDelivery || 0) > 0 ? `<span class="conv-unread-pill" style="background:#dc2626; color:#fff; font-size:10px; padding:2px 6px; border-radius:10px; font-weight:700;">${c.unreadCountForDelivery || c.unreadDelivery} unread</span>` : ''}
                  </div>
                  <div class="muted" style="font-size:12.5px; margin-top:3px;">
                    Last message: "${escapeHtml(c.lastMessageText || c.lastMessage?.message || 'Conversation ready')}"
                    &bull; <small>${c.lastMessageTimestamp ? formatChatTime(c.lastMessageTimestamp) : (c.lastMessage?.createdAt ? formatTimeAgo(c.lastMessage.createdAt) : 'Recently')}</small>
                    ${c.deliveryAddress ? `&bull; 📍 <small>${escapeHtml(c.deliveryAddress)}</small>` : ''}
                  </div>
                </div>
              </div>
              <div>
                <button class="btn btn-outline btn-sm open-dash-chat-trigger" data-conv-id="${c.conversationId}" type="button">
                  Open Chat
                </button>
              </div>
            </div>
          `).join("")}
        </div>
      </div>

      <div class="content-card" style="margin-top:20px;">
        <h3>My Assigned Delivery Runs</h3>
        <div class="table-responsive">
          <table class="standard-table">
            <thead><tr><th>Delivery #</th><th>Order #</th><th>Customer</th><th>Phone</th><th>Address</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              ${myDeliveries.map(d => `
                <tr>
                  <td><strong>${escapeHtml(d.id)}</strong></td>
                  <td>${escapeHtml(d.orderNumber)}</td>
                  <td>${escapeHtml(d.customerName)}</td>
                  <td>${escapeHtml(d.phone)}</td>
                  <td>${escapeHtml(d.address)}</td>
                  <td><span class="status-pill status-${d.status.toLowerCase().replace(/ /g, "_")}">${escapeHtml(d.status)}</span></td>
                  <td>
                    <div style="display:flex; gap:4px; flex-wrap:wrap;">
                      <button class="btn btn-outline btn-sm view-dash-del-details" data-id="${d.id}" title="View Delivery Details" type="button">
                        🔍 Details
                      </button>
                      <button class="btn btn-outline btn-sm quick-driver-chat-btn" data-order-id="${d.orderNumber || d.orderId}" title="Chat with Customer" type="button" style="display:inline-flex; align-items:center; gap:4px;">
                        ${ICONS.chat}
                        <span>Chat</span>
                      </button>
                      ${d.status !== "Delivered" ? `
                        <button class="btn btn-secondary btn-sm quick-driver-action" data-id="${d.id}" data-action="picked-up" type="button">Picked Up</button>
                        <button class="btn btn-outline btn-sm quick-driver-action" data-id="${d.id}" data-action="mark-out" type="button">Out for Delivery</button>
                        <button class="btn btn-primary btn-sm quick-driver-action" data-id="${d.id}" data-action="mark-delivered" type="button">Delivered</button>
                        <button class="btn btn-outline btn-sm quick-driver-action" data-id="${d.id}" data-action="mark-failed" type="button">Failed</button>
                      ` : `<span class="muted" style="font-size:12px; align-self:center;">Delivered</span>`}
                    </div>
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;

    container.querySelectorAll(".view-dash-del-details").forEach(btn => {
      btn.addEventListener("click", () => {
        openDeliveryDetailsModal(btn.dataset.id);
      });
    });

    container.querySelectorAll(".mark-driver-notif-read").forEach(btn => {
      btn.addEventListener("click", () => {
        const notif = STATE.notifications.find(n => n.id === btn.dataset.id);
        if (notif) notif.read = true;
        try {
          fetch("http://127.0.0.1:8787/api/notifications/mark-read", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ notificationId: btn.dataset.id })
          }).catch(() => {});
        } catch (_) {}
        renderRoleDashboard();
      });
    });

    container.querySelectorAll(".open-dash-chat-trigger").forEach(btn => {
      btn.addEventListener("click", () => {
        STATE.activeChatConversationId = btn.dataset.convId;
        navigateTo("delivery_person/chat");
      });
    });

    container.querySelectorAll(".quick-driver-chat-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const conv = getOrCreateOrderDeliveryChat(btn.dataset.orderId);
        if (conv) {
          STATE.activeChatConversationId = conv.conversationId;
          navigateTo("delivery_person/chat");
        }
      });
    });


  } else if (role === "customer") {
    // 5. CUSTOMER DASHBOARD (Functional Customer Portal)
    const myOrders = STATE.currentUser ? STATE.orders.filter(o => o.customerId === STATE.currentUser.uid || (STATE.currentUser.email && o.customerEmail === STATE.currentUser.email)) : [];
    const activeOrders = myOrders.filter(o => o.orderStatus !== "Delivered" && o.orderStatus !== "Cancelled");
    const myPrescriptions = STATE.currentUser ? STATE.prescriptions.filter(p => p.customerId === STATE.currentUser.uid || (STATE.currentUser.email && p.customerEmail === STATE.currentUser.email)) : [];
    const pendingPrescriptions = myPrescriptions.filter(p => p.status === "Pending" || p.status === "Pending Review" || p.status === "Under Review" || p.status === "Clarification Required");
    const myConsultations = STATE.currentUser ? STATE.consultations.filter(c => c.customerId === STATE.currentUser.uid || (STATE.currentUser.email && c.customerEmail === STATE.currentUser.email)) : [];
    const upcomingConsultations = myConsultations.filter(c => c.status === "Confirmed" || c.status === "Pending");
    const myRefills = STATE.currentUser ? STATE.refills.filter(r => r.customerId === STATE.currentUser.uid || (STATE.currentUser.email && r.customerEmail === STATE.currentUser.email)) : [];
    const pendingRefills = myRefills.filter(r => r.status === "Pending" || r.status === "Under Review");

    const latestActive = activeOrders.length > 0 ? activeOrders[0] : null;
    let currentStep = 0;
    let progressPercent = 0;
    if (latestActive) {
      if (latestActive.orderStatus === "Confirmed") { currentStep = 1; progressPercent = 25; }
      else if (latestActive.orderStatus === "Processing") { currentStep = 2; progressPercent = 50; }
      else if (latestActive.orderStatus === "Out for Delivery" || latestActive.orderStatus === "Ready for Pickup") { currentStep = 3; progressPercent = 75; }
      else if (latestActive.orderStatus === "Delivered") { currentStep = 4; progressPercent = 100; }
      else { currentStep = 0; progressPercent = 5; } // Order Placed / Pending
    }

    const savedLoc = getCustomerDeliveryAddress(STATE.currentUser);
    const isEditingLoc = Boolean(STATE.isEditingCustLocation);
    const savedDiv = savedLoc?.deliveryDivision || savedLoc?.division || "";
    const savedAreas = savedDiv ? getMbararaAreas(savedDiv) : [];
    const activeDriver = latestActive ? getAssignedDeliveryManForOrder(latestActive) : null;
    const activeProducts = STATE.products.filter(p => p && p.status !== "inactive");
    const custId = STATE.currentUser?.uid || STATE.currentUser?.email;
    const recommendedMeds = getRecommendedProducts(custId, STATE.products, STATE.orders, 8);
    const trendingMeds = getTrendingProducts(STATE.products, STATE.orders, 8);
    const frequentlyPurchasedMeds = getFrequentlyPurchased(STATE.products, STATE.orders, 8);
    const topBundle = getTopCoPurchaseBundle(STATE.products, STATE.orders);
    const hasHistory = (STATE.orders || []).some(o => (o.customerId === custId || o.customerEmail === custId) && isValidCompletedOrder(o));
    const dashCategories = STATE.categories || [];

    container.innerHTML = `
      <!-- 1. Customer Dashboard Hero & Brand Showcase -->
      <div class="customer-welcome-card customer-hero-brand-card">
        <div class="customer-welcome-left">
          <div class="customer-hero-motto-pill" style="display:inline-flex; align-items:center; gap:6px; background:rgba(15,118,110,0.1); color:#0f766e; padding:4px 12px; border-radius:999px; font-size:12px; font-weight:700; margin-bottom:8px; letter-spacing:0.3px;">
            <span>🌿</span>
            <span>Your Health, Our Priority</span>
          </div>
          <h1 class="page-title" style="font-size:22px; margin-bottom:4px;">Welcome, ${escapeHtml(STATE.currentUser?.displayName || "Customer")}</h1>
          <p class="page-desc" style="font-size:13.5px; color:var(--text-muted, #64748b); margin-bottom:10px; max-width:520px; line-height:1.45;">
            Your trusted licensed pharmacy in Mbarara City for genuine <strong>Medicines</strong>, comprehensive <strong>Wellness</strong>, essential <strong>Personal Care</strong>, and professional <strong>Health Advice</strong>.
          </p>
          <div class="customer-service-tags" style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:14px;">
            <span class="service-micro-tag" style="background:#f1f5f9; color:#334155; font-size:11px; font-weight:600; padding:3px 8px; border-radius:4px; border:1px solid #e2e8f0;">💊 Medicines</span>
            <span class="service-micro-tag" style="background:#f1f5f9; color:#334155; font-size:11px; font-weight:600; padding:3px 8px; border-radius:4px; border:1px solid #e2e8f0;">🌿 Wellness</span>
            <span class="service-micro-tag" style="background:#f1f5f9; color:#334155; font-size:11px; font-weight:600; padding:3px 8px; border-radius:4px; border:1px solid #e2e8f0;">🧴 Personal Care</span>
            <span class="service-micro-tag" style="background:#f1f5f9; color:#334155; font-size:11px; font-weight:600; padding:3px 8px; border-radius:4px; border:1px solid #e2e8f0;">🩺 Health Advice</span>
          </div>
          <div class="customer-welcome-actions">
            <button class="btn btn-primary btn-sm" type="button" data-route="medicines">Browse Medicines</button>
            <button class="btn btn-secondary btn-sm" type="button" data-route="prescriptions">Upload Prescription</button>
            <button class="btn btn-secondary btn-sm" type="button" data-route="refills">Request Refill</button>
            <button class="btn btn-secondary btn-sm" type="button" data-route="consultations">Consult Pharmacist</button>
            <button class="btn btn-outline btn-sm customer-logout-trigger-btn" id="btn-cust-dash-logout" type="button" data-action="logout" style="color:#b91c1c; border-color:#fca5a5; font-weight:600;">Sign Out</button>
          </div>
        </div>
        <div class="customer-welcome-right customer-hero-brand-right">
          <div class="customer-hero-badge-row" style="margin-bottom:8px;">
            <span class="customer-badge-pill">${ICONS.check} ${STATE.currentUser?.accountType === "BUSINESS" ? "Verified Business Customer" : "Verified Customer Account"}</span>
          </div>
          <div class="customer-hero-bag-wrapper" style="text-align:center;">
            <img 
              src="bloomcare-paper-bag.jpg" 
              alt="BloomCare Pharmacy branded paper bag" 
              class="customer-hero-bag-img" 
              loading="lazy" 
              decoding="async" 
            />
          </div>
        </div>
      </div>

      <!-- 2. Customer Summary Cards (4 Required Cards) -->
      <div class="kpi-grid-4">
        <div class="kpi-card" data-route="orders">
          <div class="kpi-icon-wrap">${ICONS.orders}</div>
          <div>
            <strong class="kpi-value">${activeOrders.length}</strong>
            <span class="kpi-label">Active Orders</span>
          </div>
        </div>
        <div class="kpi-card" data-route="prescriptions">
          <div class="kpi-icon-wrap">${ICONS.prescriptions}</div>
          <div>
            <strong class="kpi-value">${pendingPrescriptions.length}</strong>
            <span class="kpi-label">Pending Prescriptions</span>
          </div>
        </div>
        <div class="kpi-card" data-route="refills">
          <div class="kpi-icon-wrap">${ICONS.refills}</div>
          <div>
            <strong class="kpi-value">${pendingRefills.length}</strong>
            <span class="kpi-label">Pending Refills</span>
          </div>
        </div>
        <div class="kpi-card" data-route="consultations">
          <div class="kpi-icon-wrap">${ICONS.consultations}</div>
          <div>
            <strong class="kpi-value">${upcomingConsultations.length}</strong>
            <span class="kpi-label">Upcoming Consultations</span>
          </div>
        </div>
      </div>

      <!-- 3. Current Order Status (When active order exists) -->
      ${latestActive ? `
        <div class="active-tracking-box">
          <div class="tracking-header-row">
            <h3>Current Order Status</h3>
            <div>
              <span class="tracking-ref-badge">${escapeHtml(latestActive.orderNumber || latestActive.id)}</span>
              <span class="status-pill status-${latestActive.orderStatus.toLowerCase().replace(/ /g, "_")}">${escapeHtml(latestActive.orderStatus)}</span>
            </div>
          </div>
          <div class="stepper-timeline-container">
            <div class="stepper-line-bg"></div>
            <div class="stepper-line-fill" style="width: ${progressPercent}%;"></div>
            <div class="stepper-timeline">
              <div class="stepper-step ${currentStep >= 0 ? (currentStep === 0 ? "active" : "completed") : ""}">
                <div class="stepper-circle">${currentStep > 0 ? "&check;" : "1"}</div>
                <span class="stepper-label">Order Placed</span>
              </div>
              <div class="stepper-step ${currentStep >= 1 ? (currentStep === 1 ? "active" : "completed") : ""}">
                <div class="stepper-circle">${currentStep > 1 ? "&check;" : "2"}</div>
                <span class="stepper-label">Confirmed</span>
              </div>
              <div class="stepper-step ${currentStep >= 2 ? (currentStep === 2 ? "active" : "completed") : ""}">
                <div class="stepper-circle">${currentStep > 2 ? "&check;" : "3"}</div>
                <span class="stepper-label">Processing</span>
              </div>
              <div class="stepper-step ${currentStep >= 3 ? (currentStep === 3 ? "active" : "completed") : ""}">
                <div class="stepper-circle">${currentStep > 3 ? "&check;" : "4"}</div>
                <span class="stepper-label">Out for Delivery</span>
              </div>
              <div class="stepper-step ${currentStep >= 4 ? "completed" : ""}">
                <div class="stepper-circle">${currentStep >= 4 ? "&check;" : "5"}</div>
                <span class="stepper-label">Delivered</span>
              </div>
            </div>
          </div>
          <div class="tracking-details-footer">
            <div style="font-size: 13px; margin-bottom: 4px;">
              <strong>Items:</strong> <span class="muted">${latestActive.items.map(i => `${i.quantity}x ${escapeHtml(i.name)}`).join(", ")}</span> &bull; 
              <strong>Total:</strong> <strong>${formatUGX(latestActive.total)}</strong>
            </div>
            <div style="font-size: 13px; margin-bottom: 8px;">
              <strong>Delivery:</strong> <span>${activeDriver ? `<span style="font-weight:600; color:#0f766e;">🚚 ${escapeHtml(activeDriver)}</span>` : `<span class="muted">${latestActive.fulfillmentType === 'pickup' ? 'Pharmacy Pickup' : 'Pending Assignment'}</span>`}</span>
            </div>
            <div style="font-size:12px; color:#0f766e; background:rgba(15,118,110,0.07); border:1px solid rgba(15,118,110,0.15); padding:6px 10px; border-radius:6px; margin-bottom:10px; display:flex; align-items:center; gap:8px;">
              <img src="bloomcare-paper-bag.jpg" alt="BloomCare Pharmacy branded paper bag" style="width:22px; height:22px; object-fit:contain; border-radius:3px;" />
              <span>Your order will be carefully prepared and packed by BloomCare Pharmacy in our official tamper-evident bag.</span>
            </div>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              <button class="btn btn-primary btn-sm track-order-btn" data-id="${latestActive.id}">Track Order</button>
              ${(latestActive.fulfillmentType !== "pickup") ? `
                <button class="btn btn-primary btn-sm open-order-chat-btn" data-order-id="${escapeHtml(latestActive.orderNumber || latestActive.id)}" style="background:#0f766e; border-color:#0f766e;">💬 Chat with Delivery Man</button>
              ` : ''}
              <button class="btn btn-outline btn-sm view-rec-btn" data-id="${latestActive.id}">Order Confirmation</button>
            </div>
          </div>
        </div>
      ` : ""}

      <!-- 3B. Customer Messages (Order Delivery Conversations) -->
      <div class="content-card customer-messages-card" id="customer-messages-card" style="margin-top:20px;">
        <div class="flex-between" style="margin-bottom:14px; flex-wrap:wrap; gap:10px;">
          <div>
            <h3 style="display:flex; align-items:center; gap:8px; margin:0;">
              <span>💬</span>
              <span>Messages &amp; Delivery Chat</span>
            </h3>
            <span class="muted" style="font-size:12.5px;">Direct communication with your order delivery driver</span>
          </div>
        </div>
        <div class="customer-messages-list" id="customer-messages-list">
          ${myOrders.length === 0 ? `
            <p class="muted" style="font-size:13px; margin:10px 0;">No active delivery conversations yet.</p>
          ` : myOrders.slice(0, 4).map(o => {
            const conv = STATE.conversations.find(c => c.orderId === (o.orderNumber || o.id) || c.orderId === o.id || c.id === `CHAT-${o.orderNumber || o.id}`);
            const driverName = (conv && conv.deliveryManName && conv.deliveryManName !== "Unassigned" && conv.deliveryManName !== "Pending Assignment") ? conv.deliveryManName : (o.assignedStaff && o.assignedStaff !== "Unassigned" && o.assignedStaff !== "Pending Assignment" ? o.assignedStaff : "Not yet assigned");
            const isAssigned = driverName !== "Not yet assigned";
            const unreadCount = conv ? (conv.unreadCountForCustomer || conv.unreadCustomer || 0) : 0;
            const lastText = conv?.lastMessageText || "Your delivery chat is ready. You can send a message now.";
            const lastTime = conv?.lastMessageTimestamp ? formatChatTime(conv.lastMessageTimestamp) : "Recently";
            return `
              <div class="customer-msg-row flex-between" style="padding:12px 14px; border:1px solid var(--line); border-radius:8px; margin-bottom:10px; background:#ffffff; flex-wrap:wrap; gap:10px;">
                <div style="display:flex; align-items:center; gap:12px; min-width:240px; flex:1;">
                  <div class="chat-avatar-circle" style="width:38px; height:38px; border-radius:50%; background:#e0f2fe; color:#0369a1; display:flex; align-items:center; justify-content:center; font-size:16px;">
                    💬
                  </div>
                  <div>
                    <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                      <strong>Order #${escapeHtml(o.orderNumber || o.id)}</strong>
                      <span class="status-pill status-${(o.orderStatus || 'Confirmed').toLowerCase().replace(/ /g, '_')}" style="font-size:11px; padding:2px 7px;">
                        ${escapeHtml(o.orderStatus || 'Confirmed')}
                      </span>
                      <span style="font-size:12px; color:${isAssigned ? '#0d9488' : '#b45309'}; font-weight:600;">
                        ${isAssigned ? `🚗 ${escapeHtml(driverName)}` : `⏳ Driver: Not yet assigned`}
                      </span>
                      ${unreadCount > 0 ? `<span class="conv-unread-pill" style="background:#dc2626; color:#fff; font-size:10px; padding:2px 6px; border-radius:10px; font-weight:700;">${unreadCount} new</span>` : ''}
                    </div>
                    <div class="muted" style="font-size:12.5px; margin-top:3px;">
                      <span>"${escapeHtml(lastText)}"</span> &bull; <small>${lastTime}</small>
                    </div>
                  </div>
                </div>
                <div>
                  <button class="btn btn-primary btn-sm open-order-chat-btn" data-order-id="${escapeHtml(o.orderNumber || o.id)}" type="button" style="display:inline-flex; align-items:center; gap:6px;">
                    <span>💬</span>
                    <span>Chat with Delivery Man</span>
                  </button>
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </div>

      <!-- 4. Delivery Location Section (Mbarara City Central Delivery System) -->
      <!-- 4. Customer Pharmacy Storefront & Instant Medicine Ordering -->
      <section class="content-card customer-storefront-card" id="customer-storefront-card" style="margin-top:20px;">
        <div class="storefront-hero-header" style="margin-bottom:18px; border-bottom:1px solid var(--line, #e2e8f0); padding-bottom:14px;">
          <div class="flex-between" style="flex-wrap:wrap; gap:10px;">
            <div>
              <span class="hub-pill" style="display:inline-flex; align-items:center; gap:6px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; background:rgba(15,118,110,0.1); color:#0f766e; padding:4px 10px; border-radius:999px; margin-bottom:6px;">
                <span class="hub-indicator-dot" style="width:7px; height:7px; border-radius:50%; background:#10b981; display:inline-block;"></span>
                Mbarara City Hub &bull; Open Now &bull; 10–15 min Delivery
              </span>
              <h2 style="margin:4px 0 2px; font-size:22px; font-weight:800; color:var(--text-main, #0f172a); letter-spacing:-0.3px;">BLOOMCARE PHARMACY</h2>
              <p class="muted" style="margin:0; font-size:13px;">Order authentic medications, wellness essentials, and health supplies directly to your doorstep.</p>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
              <button class="btn btn-outline btn-sm" type="button" data-route="customer/medicines" style="display:inline-flex; align-items:center; gap:6px;">
                <span>💊 View Full Catalog (${activeProducts.length})</span>
              </button>
            </div>
          </div>

          <!-- Real-time Medicine Search -->
          <div class="cust-dash-search-wrap" style="margin-top:14px; position:relative;">
            <input 
              type="search" 
              id="cust-dash-search-input" 
              class="form-control" 
              placeholder="Search medicines by brand name, generic name, symptoms (e.g. Paracetamol, Coartem, pain, fever)..." 
              style="width:100%; padding:10px 14px 10px 38px; border-radius:8px; border:1px solid var(--border-color, #cbd5e1); font-size:14px; background:var(--bg-card, #ffffff);"
            />
            <span style="position:absolute; left:12px; top:50%; transform:translateY(-50%); font-size:16px; color:var(--text-muted, #64748b); pointer-events:none;">🔍</span>
          </div>
        </div>

        <!-- AI RECOMMENDATION ENGINE SUITE -->

        <!-- 1. Recommended For You (Personalized / Popular Fallback) -->
        <div class="cust-dash-section rec-dash-section" style="margin-bottom:24px;">
          <div class="flex-between" style="margin-bottom:12px;">
            <div>
              <div style="display:flex; align-items:center; gap:8px;">
                <h3 style="margin:0; font-size:16px; font-weight:700;">${hasHistory ? "Recommended For You" : "Popular Products You May Like"}</h3>
                <span class="rec-ai-pill" style="background:rgba(15,118,110,0.1); color:#0f766e; font-size:11px; font-weight:700; padding:2px 8px; border-radius:999px;">AI Powered</span>
              </div>
              <span class="muted" style="font-size:12px;">${hasHistory ? "Curated for your wellness based on your purchase patterns and category preferences" : "Popular essentials & fast-acting relief verified by our pharmacists"}</span>
            </div>
            <button class="btn btn-link btn-sm" type="button" data-route="customer/medicines">See All &rarr;</button>
          </div>
          <div class="rec-scroll-track" id="cust-dash-rec-track" style="display:flex; gap:14px; overflow-x:auto; padding-bottom:8px; scroll-snap-type:x mandatory;">
            ${recommendedMeds.length > 0 ? recommendedMeds.map(renderRecommendedProductCardHtml).join("") : `<p class="muted" style="font-size:13px; padding:8px 0;">Explore our popular products.</p>`}
          </div>
        </div>

        <!-- 2. Frequently Bought Together Bundle -->
        ${topBundle ? renderFrequentlyBoughtTogetherHtml(topBundle, escapeHtml, formatUGX) : ""}

        <!-- 3. 🔥 Trending Products (Recent Purchase Velocity) -->
        <div class="cust-dash-section rec-dash-section" style="margin-bottom:24px;">
          <div class="flex-between" style="margin-bottom:12px;">
            <div>
              <div style="display:flex; align-items:center; gap:8px;">
                <h3 style="margin:0; font-size:16px; font-weight:700;">🔥 Trending Products</h3>
                <span class="rec-badge-trending" style="background:rgba(239,68,68,0.1); color:#dc2626; font-size:11px; font-weight:700; padding:2px 8px; border-radius:999px;">High Velocity</span>
              </div>
              <span class="muted" style="font-size:12px;">Fastest-moving medications and health supplies in Mbarara City over the last 30 days</span>
            </div>
            <button class="btn btn-link btn-sm" type="button" data-route="customer/medicines">Explore Catalog &rarr;</button>
          </div>
          <div class="rec-scroll-track" id="cust-dash-trending-track" style="display:flex; gap:14px; overflow-x:auto; padding-bottom:8px; scroll-snap-type:x mandatory;">
            ${trendingMeds.length > 0 ? trendingMeds.map(renderRecommendedProductCardHtml).join("") : `<p class="muted" style="font-size:13px; padding:8px 0;">No trending medicines available at the moment.</p>`}
          </div>
        </div>

        <!-- 4. Frequently Purchased (Community Essentials) -->
        <div class="cust-dash-section rec-dash-section" style="margin-bottom:24px;">
          <div class="flex-between" style="margin-bottom:12px;">
            <div>
              <div style="display:flex; align-items:center; gap:8px;">
                <h3 style="margin:0; font-size:16px; font-weight:700;">Frequently Purchased</h3>
                <span class="rec-badge-freq" style="background:rgba(59,130,246,0.1); color:#2563eb; font-size:11px; font-weight:700; padding:2px 8px; border-radius:999px;">Top Demand</span>
              </div>
              <span class="muted" style="font-size:12px;">Highest overall customer order frequency across BloomCare Dispensary</span>
            </div>
            <button class="btn btn-link btn-sm" type="button" data-route="customer/medicines">View All &rarr;</button>
          </div>
          <div class="rec-scroll-track" id="cust-dash-frequent-track" style="display:flex; gap:14px; overflow-x:auto; padding-bottom:8px; scroll-snap-type:x mandatory;">
            ${frequentlyPurchasedMeds.length > 0 ? frequentlyPurchasedMeds.map(renderRecommendedProductCardHtml).join("") : `<p class="muted" style="font-size:13px; padding:8px 0;">Explore our popular products.</p>`}
          </div>
        </div>

        <!-- Medicine Categories -->
        <div class="cust-dash-section" style="margin-bottom:20px;">
          <div class="flex-between" style="margin-bottom:10px;">
            <div>
              <h3 style="margin:0; font-size:16px; font-weight:700;">Medicine Categories</h3>
              <span class="muted" style="font-size:12px;">Quick filter by therapeutic class</span>
            </div>
          </div>
          <div class="cust-dash-category-pills" id="cust-dash-category-pills">
            <button type="button" class="category-pill cust-dash-cat-pill active" data-category="all" title="View all medicines">
              <span class="cat-pill-icon-wrap">
                <img src="categories/all-medicines.svg" alt="All Medicines" class="cat-card-img" width="24" height="24" loading="lazy" />
              </span>
              <span class="cat-pill-label-wrap">
                <span class="cat-pill-title">All Medicines</span>
                <span class="cat-pill-count">(${activeProducts.length})</span>
              </span>
            </button>
            ${(dashCategories.length ? dashCategories : ESSENTIAL_CATEGORIES).filter(c => c.status !== "inactive").slice(0, 8).map(c => {
              const count = activeProducts.filter(p => {
                const pCat = (p.category || p.categoryId || "").toLowerCase().trim();
                return pCat === (c.name || "").toLowerCase().trim() || pCat === (c.id || "").toLowerCase().trim();
              }).length;
              return `
                <button type="button" class="category-pill cust-dash-cat-pill" data-category="${escapeHtml(c.name || c.id)}" title="${escapeHtml(c.name)}">
                  <span class="cat-pill-icon-wrap">
                    <img src="${escapeHtml(getCategoryImageUrl(c))}" alt="${escapeHtml(c.name)}" class="cat-card-img" width="24" height="24" loading="lazy" />
                  </span>
                  <span class="cat-pill-label-wrap">
                    <span class="cat-pill-title">${escapeHtml(c.name)}</span>
                    <span class="cat-pill-count">(${count})</span>
                  </span>
                </button>
              `;
            }).join("")}
          </div>
        </div>

        <!-- Available Medicines Grid -->
        <div class="cust-dash-section">
          <div class="flex-between" style="margin-bottom:12px;">
            <div>
              <h3 style="margin:0; font-size:16px; font-weight:700;" id="cust-dash-products-title">Available Medicines</h3>
              <span class="muted" style="font-size:12px;" id="cust-dash-products-subtitle">Showing ${Math.min(activeProducts.length, 12)} of ${activeProducts.length} medicines in stock</span>
            </div>
          </div>
          <div class="products-grid" id="cust-dash-products-grid">
            ${activeProducts.slice(0, 12).map(renderProductCardHtml).join("")}
          </div>
        </div>
      </section>

      <!-- 5. Delivery Location Section (Mbarara City Central Delivery System) -->
      <div class="customer-delivery-location-section">
        <div class="delivery-location-card">
          
          <!-- Header Row -->
          <div class="delivery-location-header">
            <div class="delivery-location-title-group">
              <div class="delivery-location-icon-wrap" aria-hidden="true">
                ${ICONS.location}
              </div>
              <div class="delivery-location-title-text">
                <div class="delivery-location-kicker">Delivery Location</div>
                <h3 class="delivery-location-heading">Where should we deliver your order in Mbarara City?</h3>
                <p class="delivery-location-subheading">Your saved delivery address &amp; BloomCare dispatch reference</p>
              </div>
            </div>
            ${savedLoc ? `
              <button type="button" class="btn btn-outline btn-sm delivery-change-loc-btn" id="cust-dash-toggle-edit-loc">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                <span>${isEditingLoc ? "Cancel Edit" : "Change Location"}</span>
              </button>
            ` : ""}
          </div>

          ${isEditingLoc ? `
            <form id="cust-delivery-location-form" class="standard-form">
              <div class="delivery-form-grid">
                <div>
                  <label for="cust-loc-division" style="font-weight:600; font-size:13px;">Mbarara City Division</label>
                  <select id="cust-loc-division" class="form-control" required style="width:100%; padding:8px 10px; border-radius:var(--radius-xs); border:1px solid var(--border-color); background:var(--bg-card); color:var(--text-main);">
                    <option value="">-- Select Division --</option>
                    ${MBARARA_DIVISIONS.map(d => `<option value="${d}" ${savedLoc && (savedLoc.deliveryDivision === d || savedLoc.division === d) ? "selected" : ""}>${d}</option>`).join("")}
                  </select>
                </div>
                <div>
                  <label for="cust-loc-area" style="font-weight:600; font-size:13px;">Area / Neighborhood</label>
                  <select id="cust-loc-area" class="form-control" required style="width:100%; padding:8px 10px; border-radius:var(--radius-xs); border:1px solid var(--border-color); background:var(--bg-card); color:var(--text-main);" ${!savedDiv ? "disabled" : ""}>
                    <option value="">-- Select Area --</option>
                    ${savedAreas.map(a => `<option value="${a}" ${savedLoc && (savedLoc.deliveryArea === a || savedLoc.area === a) ? "selected" : ""}>${a}</option>`).join("")}
                  </select>
                </div>
              </div>

              <div id="cust-loc-custom-area-wrap" class="${savedLoc && (savedLoc.deliveryArea === "Other" || savedLoc.area === "Other") ? "" : "hidden"}" style="margin-bottom:12px;">
                <label for="cust-loc-custom-area" style="font-weight:600; font-size:13px;">Specify Your Neighborhood / Area Name</label>
                <input type="text" id="cust-loc-custom-area" placeholder="Enter neighborhood or village name" value="${escapeHtml(savedLoc?.customArea || "")}" style="width:100%;" />
              </div>

              <div style="margin-bottom:12px;">
                <label for="cust-loc-specific" style="font-weight:600; font-size:13px;">Exact Location</label>
                <input type="text" id="cust-loc-specific" placeholder="e.g. Plot 14, Kiyanja Road" value="${escapeHtml(savedLoc?.specificLocation || savedLoc?.location || savedLoc?.address || "")}" required style="width:100%;" />
              </div>

              <div style="margin-bottom:12px;">
                <label for="cust-loc-landmark" style="font-weight:600; font-size:13px;">Landmark</label>
                <input type="text" id="cust-loc-landmark" placeholder="e.g. Mile 3 opposite Ruharo Mosque, Blue gate, near school" value="${escapeHtml(savedLoc?.landmark || "")}" style="width:100%;" />
              </div>

              <div style="margin-bottom:14px;">
                <label for="cust-loc-instructions" style="font-weight:600; font-size:13px;">Delivery Instructions (Optional)</label>
                <input type="text" id="cust-loc-instructions" placeholder="e.g. Call when at gate, leave with reception" value="${escapeHtml(savedLoc?.deliveryInstructions || "")}" style="width:100%;" />
              </div>

              <div style="display:flex; gap:10px; align-items:center;">
                <button type="submit" class="btn btn-primary btn-sm">💾 Save Delivery Location</button>
                <button type="button" id="cust-loc-cancel-btn" class="btn btn-outline btn-sm">Cancel</button>
              </div>
            </form>
          ` : (savedLoc ? `
            <div class="saved-location-display-card">
              <div class="delivery-location-grid">
                
                <!-- Left Pane: Customer Saved Address Details -->
                <div class="delivery-customer-pane">
                  
                  <!-- 1. Delivery Area Block -->
                  <div class="delivery-info-group">
                    <div class="delivery-field-header">
                      <span class="delivery-field-label">
                        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"/><circle cx="12" cy="10" r="3"/></svg>
                        Delivery Area
                      </span>
                      <span class="delivery-default-badge">
                        <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                        Default Address
                      </span>
                    </div>
                    <div class="delivery-area-row">
                      <span class="delivery-division-tag">${escapeHtml(savedLoc.deliveryDivision || savedLoc.division || "Kamukuzi")}</span>
                      <span class="delivery-area-separator">&bull;</span>
                      <span class="delivery-area-tag">${escapeHtml(savedLoc.deliveryArea === "Other" && savedLoc.customArea ? savedLoc.customArea : (savedLoc.deliveryArea || savedLoc.area || "Ruharo"))}</span>
                    </div>
                  </div>

                  <!-- 2. Exact Location Block -->
                  <div class="delivery-info-group">
                    <div class="delivery-field-label">
                      <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                      Exact Location
                    </div>
                    <div class="delivery-primary-val saved-location-full-text">${escapeHtml(savedLoc.specificLocation || savedLoc.location || savedLoc.address || "Plot 14, Kiyanja Road")}</div>
                  </div>

                  <!-- 3. Landmark Block -->
                  <div class="delivery-info-group">
                    <div class="delivery-field-label">
                      <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                      Landmark
                    </div>
                    <div class="delivery-secondary-val">${escapeHtml(savedLoc.landmark || savedLoc.specificLocation || "Mile 3 opposite Ruharo Mosque")}</div>
                  </div>

                  <!-- 4. Delivery Instructions (if provided) -->
                  ${savedLoc.deliveryInstructions ? `
                    <div class="delivery-info-group">
                      <div class="delivery-field-label">
                        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                        Delivery Instructions
                      </div>
                      <div class="delivery-instructions-box saved-location-instructions-text">${escapeHtml(savedLoc.deliveryInstructions)}</div>
                    </div>
                  ` : ""}

                  <div class="delivery-pane-actions">
                    <button type="button" class="btn btn-secondary btn-sm" id="cust-dash-edit-loc-btn">
                      <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                      <span>Update Location</span>
                    </button>
                  </div>

                </div>

                <!-- Right Pane: BloomCare Physical Hub Reference & Service Policy -->
                <div class="delivery-hub-pane">
                  
                  <div class="delivery-hub-reference-box">
                    <div class="delivery-hub-head">
                      <div class="delivery-hub-ref-icon" aria-hidden="true">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-3"/><path d="M9 9h1"/><path d="M9 13h1"/><path d="M9 17h1"/></svg>
                      </div>
                      <div>
                        <div class="delivery-hub-org">BloomCare Pharmacy</div>
                        <div class="delivery-hub-ref-title">Central Dispensary</div>
                      </div>
                    </div>

                    <div class="delivery-hub-address-lines">
                      <div class="hub-addr-line">Near Mbarara Regional Referral Hospital</div>
                      <div class="hub-addr-line">Opposite Rubis Station</div>
                      <div class="hub-addr-line">Near Mbarara Central Police Station</div>
                      <div class="hub-addr-city">Mbarara City, Uganda</div>
                    </div>

                    <div class="delivery-hub-brand-card" style="margin-top:10px; padding:10px; background:#ffffff; border:1px solid #e2e8f0; border-radius:8px; display:flex; align-items:center; gap:10px;">
                      <img src="bloomcare-paper-bag.jpg" alt="BloomCare Pharmacy branded paper bag" style="width:40px; height:40px; object-fit:contain; border-radius:4px; flex-shrink:0;" />
                      <div style="font-size:11.5px; color:#334155; line-height:1.4;">
                        <div>📞 Tel: <strong>${escapeHtml(getConfiguredWhatsAppNumber(STATE.systemSettings) || BLOOMCARE_PHONE)}</strong></div>
                        <div>🌐 Web: <strong>www.bloomcare.ug</strong></div>
                        <div style="color:#0f766e; font-style:italic; font-weight:600;">Care Beyond Medicines</div>
                      </div>
                    </div>

                    <div class="delivery-coverage-banner" style="margin-top:10px;">
                      <div class="coverage-check-icon" aria-hidden="true">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                      <div class="coverage-text">
                        <strong>Delivery available:</strong> BloomCare currently delivers within Mbarara City and configured surrounding service areas.
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            </div>
          ` : `
            <div class="delivery-empty-state">
              <div class="delivery-empty-icon" aria-hidden="true">
                ${ICONS.location}
              </div>
              <div class="delivery-empty-text">
                <h4>You haven't added a delivery location yet.</h4>
                <p>Add your location so we can deliver your order around Mbarara City.</p>
              </div>
              <button type="button" class="btn btn-primary btn-sm" id="cust-dash-add-loc-btn">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                <span>Add Delivery Location</span>
              </button>
            </div>
          `)}
        </div>
      </div>

      <!-- BloomCare Trust Section: Why Choose BloomCare? -->
      <section class="content-card bloomcare-trust-card" style="margin-top:20px; margin-bottom:20px; padding:22px; border:1px solid var(--border-color, #e2e8f0); border-radius:14px; background:linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%);">
        <div class="trust-section-grid" style="display:grid; grid-template-columns:1fr 240px; gap:20px; align-items:center;">
          
          <div>
            <div style="display:inline-flex; align-items:center; gap:6px; background:rgba(15,118,110,0.12); color:#0f766e; padding:4px 12px; border-radius:999px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:8px;">
              <span>🛡️</span>
              <span>Authentic Healthcare Guarantee</span>
            </div>
            <h2 style="font-size:20px; font-weight:800; color:var(--text-main, #0f172a); margin:0 0 6px; letter-spacing:-0.3px;">Why Choose BloomCare?</h2>
            <p style="font-size:13px; color:var(--text-muted, #64748b); margin:0 0 16px; line-height:1.45;">
              <em>Care Beyond Medicines &bull; Healthier Today, Brighter Tomorrow.</em> Every medication is sourced through licensed supply chains, verified by registered pharmacists, and packed in authentic BloomCare packaging.
            </p>

            <div class="trust-pillars-grid" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:12px;">
              
              <!-- 1. Quality Medicines -->
              <div class="trust-pillar-card" style="background:#ffffff; border:1px solid #e2e8f0; border-radius:10px; padding:10px 12px; box-shadow:0 1px 3px rgba(0,0,0,0.03);">
                <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                  <span style="font-size:16px;">💊</span>
                  <strong style="font-size:13px; color:#0f172a;">Quality Medicines</strong>
                </div>
                <p style="margin:0; font-size:11.5px; color:#64748b; line-height:1.35;">100% authentic pharmaceuticals verified under National Drug Authority standards.</p>
              </div>

              <!-- 2. Health & Wellness -->
              <div class="trust-pillar-card" style="background:#ffffff; border:1px solid #e2e8f0; border-radius:10px; padding:10px 12px; box-shadow:0 1px 3px rgba(0,0,0,0.03);">
                <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                  <span style="font-size:16px;">🌿</span>
                  <strong style="font-size:13px; color:#0f172a;">Health &amp; Wellness</strong>
                </div>
                <p style="margin:0; font-size:11.5px; color:#64748b; line-height:1.35;">Vitamins, immunity boosters, pediatric syrups, and daily personal care essentials.</p>
              </div>

              <!-- 3. Trusted Care -->
              <div class="trust-pillar-card" style="background:#ffffff; border:1px solid #e2e8f0; border-radius:10px; padding:10px 12px; box-shadow:0 1px 3px rgba(0,0,0,0.03);">
                <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                  <span style="font-size:16px;">🩺</span>
                  <strong style="font-size:13px; color:#0f172a;">Trusted Care</strong>
                </div>
                <p style="margin:0; font-size:11.5px; color:#64748b; line-height:1.35;">1-on-1 consultations with registered pharmacists and professional dosage advice.</p>
              </div>

              <!-- 4. Our Community -->
              <div class="trust-pillar-card" style="background:#ffffff; border:1px solid #e2e8f0; border-radius:10px; padding:10px 12px; box-shadow:0 1px 3px rgba(0,0,0,0.03);">
                <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                  <span style="font-size:16px;">👥</span>
                  <strong style="font-size:13px; color:#0f172a;">Our Community</strong>
                </div>
                <p style="margin:0; font-size:11.5px; color:#64748b; line-height:1.35;">Proudly serving Mbarara City families with express 10–15 min doorstep delivery.</p>
              </div>

            </div>
          </div>

          <!-- Trust Bag Showcase -->
          <div class="trust-bag-showcase" style="text-align:center;">
            <div style="background:#ffffff; border:1px solid #bbf7d0; border-radius:12px; padding:10px; box-shadow:0 3px 12px rgba(15,118,110,0.08); display:inline-block;">
              <img 
                src="bloomcare-paper-bag.jpg" 
                alt="BloomCare Pharmacy branded paper bag" 
                class="trust-bag-img"
                style="max-width:100%; height:auto; max-height:190px; object-fit:contain; border-radius:6px;" 
                loading="lazy" 
                decoding="async"
              />
              <div style="margin-top:6px; font-size:11px; font-weight:700; color:#0f766e; text-transform:uppercase; letter-spacing:0.4px;">
                Official Dispensary Bag
              </div>
            </div>
          </div>

        </div>
      </section>

      <!-- 5. Recent Orders -->
      <div class="content-card">
        <div class="flex-between" style="margin-bottom:12px;">
          <h3>Recent Orders</h3>
          ${myOrders.length > 0 ? `<button class="text-link" data-route="orders">View All Orders &rarr;</button>` : ""}
        </div>
        ${myOrders.length > 0 ? `
          <div class="table-responsive">
            <table class="standard-table">
              <thead>
                <tr>
                  <th>Order Reference</th>
                  <th>Date</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${myOrders.slice(0, 4).map(o => `
                  <tr>
                    <td><strong>${escapeHtml(o.orderNumber || o.id)}</strong></td>
                    <td>${new Date(o.createdAt).toLocaleDateString()}</td>
                    <td><strong>${formatUGX(o.total)}</strong></td>
                    <td><span class="status-pill status-${o.orderStatus.toLowerCase().replace(/ /g, "_")}">${escapeHtml(o.orderStatus)}</span></td>
                    <td>
                      <button class="btn btn-secondary btn-sm track-order-btn" data-id="${o.id}">View Order</button>
                    </td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        ` : `
          <div class="empty-state-box">
            <p class="empty-title">No orders yet.</p>
            <p class="muted">You have not placed any medication orders yet. Browse our licensed pharmacy catalog to order genuine medications.</p>
            <button class="btn btn-primary btn-sm" type="button" data-route="medicines">Browse Medicines</button>
          </div>
        `}
      </div>
    `;

    // Attach Customer Dashboard Location Listeners
    const toggleEditBtn = container.querySelector("#cust-dash-toggle-edit-loc");
    const editLocBtn = container.querySelector("#cust-dash-edit-loc-btn");
    const addLocBtn = container.querySelector("#cust-dash-add-loc-btn");
    const cancelLocBtn = container.querySelector("#cust-loc-cancel-btn");
    const divSelect = container.querySelector("#cust-loc-division");
    const areaSelect = container.querySelector("#cust-loc-area");
    const customAreaWrap = container.querySelector("#cust-loc-custom-area-wrap");
    const locForm = container.querySelector("#cust-delivery-location-form");

    if (toggleEditBtn) {
      toggleEditBtn.addEventListener("click", () => {
        STATE.isEditingCustLocation = !STATE.isEditingCustLocation;
        renderRoleDashboard();
      });
    }
    if (editLocBtn) {
      editLocBtn.addEventListener("click", () => {
        STATE.isEditingCustLocation = true;
        renderRoleDashboard();
      });
    }
    if (addLocBtn) {
      addLocBtn.addEventListener("click", () => {
        STATE.isEditingCustLocation = true;
        renderRoleDashboard();
      });
    }
    if (cancelLocBtn) {
      cancelLocBtn.addEventListener("click", () => {
        STATE.isEditingCustLocation = false;
        renderRoleDashboard();
      });
    }

    if (divSelect && areaSelect) {
      divSelect.addEventListener("change", (e) => {
        const val = e.target.value;
        if (!val) {
          areaSelect.innerHTML = `<option value="">-- First Select Division --</option>`;
          areaSelect.disabled = true;
          if (customAreaWrap) customAreaWrap.classList.add("hidden");
          return;
        }
        const areas = getMbararaAreas(val);
        areaSelect.innerHTML = `<option value="">-- Select Area --</option>` + areas.map(a => `<option value="${a}">${a}</option>`).join("");
        areaSelect.disabled = false;
        if (customAreaWrap) customAreaWrap.classList.add("hidden");
      });

      areaSelect.addEventListener("change", (e) => {
        if (customAreaWrap) {
          customAreaWrap.classList.toggle("hidden", e.target.value !== "Other");
          if (e.target.value === "Other") {
            container.querySelector("#cust-loc-custom-area")?.focus();
          }
        }
      });
    }

    if (locForm) {
      locForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const division = divSelect?.value || "";
        const area = areaSelect?.value || "";
        const customArea = container.querySelector("#cust-loc-custom-area")?.value.trim() || "";
        const specificLocation = container.querySelector("#cust-loc-specific")?.value.trim() || "";
        const landmark = container.querySelector("#cust-loc-landmark")?.value.trim() || specificLocation;
        const deliveryInstructions = container.querySelector("#cust-loc-instructions")?.value.trim() || "";

        const locData = {
          deliveryDivision: division,
          deliveryArea: area,
          customArea,
          specificLocation,
          landmark,
          deliveryInstructions,
          city: "Mbarara City"
        };

        const validation = validateMbararaDeliveryAddress(locData);
        if (!validation.valid) {
          openNotice("Invalid Delivery Location", validation.error);
          return;
        }

        saveCustomerDeliveryAddress(locData, STATE.currentUser);
        STATE.isEditingCustLocation = false;
        openNotice("Delivery Location Saved", "Your Mbarara City delivery location has been successfully saved to your profile.");
        renderRoleDashboard();
      });
    }

    // Customer Dashboard Real-time Medicine Search & Category Filtering
    const searchInput = container.querySelector("#cust-dash-search-input");
    const categoryPills = container.querySelectorAll(".cust-dash-cat-pill");
    const productsGrid = container.querySelector("#cust-dash-products-grid");
    const productsSubtitle = container.querySelector("#cust-dash-products-subtitle");

    let currentDashCategory = "all";

    function filterCustomerDashProducts() {
      if (!productsGrid) return;
      const q = (searchInput?.value || "").toLowerCase().trim();
      let matched = activeProducts;

      if (currentDashCategory && currentDashCategory !== "all") {
        const target = currentDashCategory.toLowerCase().trim();
        matched = matched.filter(p => {
          const cat = (p.category || p.categoryId || "").toLowerCase().trim();
          if (cat === target) return true;
          const foundCat = (STATE.categories || ESSENTIAL_CATEGORIES).find(c =>
            (c.id && c.id.toLowerCase() === target) ||
            (c.name && c.name.toLowerCase() === target)
          );
          if (foundCat) {
            return (foundCat.name && cat === foundCat.name.toLowerCase().trim()) ||
                   (foundCat.id && cat === foundCat.id.toLowerCase().trim());
          }
          return false;
        });
      }

      if (q) {
        matched = matched.filter(p => {
          const name = (p.name || "").toLowerCase();
          const generic = (p.genericName || "").toLowerCase();
          const desc = (p.description || "").toLowerCase();
          const cat = (p.category || "").toLowerCase();
          return name.includes(q) || generic.includes(q) || desc.includes(q) || cat.includes(q);
        });
      }

      if (productsSubtitle) {
        productsSubtitle.textContent = `Showing ${Math.min(matched.length, 12)} of ${matched.length} medicines ${q || currentDashCategory !== 'all' ? 'matching filter' : 'in stock'}`;
      }

      if (matched.length === 0) {
        productsGrid.innerHTML = `
          <div style="grid-column:1/-1; text-align:center; padding:32px 16px; background:var(--bg-card, #fff); border-radius:8px; border:1px dashed var(--border-color, #cbd5e1);">
            <p style="font-size:15px; font-weight:600; margin:0 0 6px;">No medicines found</p>
            <p class="muted" style="font-size:13px; margin:0 0 12px;">We could not find any medicine matching "${escapeHtml(q || currentDashCategory)}".</p>
            <button type="button" class="btn btn-outline btn-sm" id="cust-dash-clear-search-btn">Reset Search</button>
          </div>
        `;
        const resetBtn = productsGrid.querySelector("#cust-dash-clear-search-btn");
        if (resetBtn) {
          resetBtn.addEventListener("click", () => {
            if (searchInput) searchInput.value = "";
            currentDashCategory = "all";
            categoryPills.forEach(p => {
              p.classList.toggle("active", p.dataset.category === "all");
              p.style.background = p.dataset.category === "all" ? "var(--primary, #0f766e)" : "var(--bg-card, #ffffff)";
              p.style.color = p.dataset.category === "all" ? "#ffffff" : "var(--text-main, #334155)";
            });
            filterCustomerDashProducts();
          });
        }
      } else {
        productsGrid.innerHTML = matched.slice(0, 12).map(renderProductCardHtml).join("");
      }
    }

    if (searchInput) {
      searchInput.addEventListener("input", filterCustomerDashProducts);
    }

    categoryPills.forEach(pill => {
      pill.addEventListener("click", () => {
        categoryPills.forEach(p => {
          p.classList.remove("active");
          p.style.background = "var(--bg-card, #ffffff)";
          p.style.color = "var(--text-main, #334155)";
        });
        pill.classList.add("active");
        pill.style.background = "var(--primary, #0f766e)";
        pill.style.color = "#ffffff";
        currentDashCategory = pill.dataset.category;
        filterCustomerDashProducts();
      });
    });

  } else {
    // 6. PUBLIC VISITOR HOME VIEW
    container.innerHTML = `
      <div class="home-hero-card">
        <div class="hero-card-left">
          <h1 class="hero-headline">Your Trusted Pharmacy, Anytime</h1>
          <p class="hero-tagline">Access genuine medications, pharmacist counseling, and reliable prescription delivery in Mbarara City.</p>
          <div class="hero-actions-row">
            <button class="btn btn-primary" type="button" data-route="medicines">Browse Medicines</button>
            <button class="btn btn-secondary" type="button" data-route="auth">Create Account</button>
            <button class="btn btn-secondary" type="button" data-route="auth">Log In</button>
          </div>
        </div>
        <div class="hero-card-right">
          <img src="pharmacy-hero.jpg" alt="BloomCare Pharmacy Dispensary" class="hero-card-img" />
        </div>
      </div>

      <div class="section-block">
        <h3 class="section-title">Four Main Services</h3>
        <div class="services-grid-4">
          <div class="service-card" data-route="medicines"><div class="service-icon-wrap">${ICONS.medicines}</div><h4>1. Medicine Marketplace</h4><p>Browse verified OTC and prescription medications.</p><span class="service-link">Explore Catalog &rarr;</span></div>
          <div class="service-card" data-route="prescriptions"><div class="service-icon-wrap">${ICONS.prescriptions}</div><h4>2. Prescription Verification</h4><p>Upload doctor prescriptions for clinical review.</p><span class="service-link">Prescriptions Desk &rarr;</span></div>
          <div class="service-card" data-route="consultations"><div class="service-icon-wrap">${ICONS.consultations}</div><h4>3. Pharmacist Consultation</h4><p>1-on-1 medication therapy guidance with licensed pharmacists.</p><span class="service-link">Consult Pharmacist &rarr;</span></div>
          <div class="service-card" data-route="refills"><div class="service-icon-wrap">${ICONS.refills}</div><h4>4. Medicine Refill System</h4><p>Doorstep repeat refills for chronic and maintenance medicines.</p><span class="service-link">Request Refill &rarr;</span></div>
        </div>
      </div>

      <div class="section-block">
        <div class="flex-between" style="margin-bottom:14px;">
          <h3 class="section-title" style="margin-bottom:0;">Featured Medicines</h3>
          <button class="btn btn-outline btn-sm" type="button" data-route="medicines">View Full Catalog &rarr;</button>
        </div>
        <div class="products-grid">${STATE.products.slice(0, 4).map(renderProductCardHtml).join("")}</div>
      </div>
    `;
  }
}

// -------------------------------------------------------------
// MODULE 2: MEDICINE MARKETPLACE & AVAILABILITY
// -------------------------------------------------------------

export function getPharmacyOpenStatus(now = new Date(), openingHoursStr = STATE.systemSettings?.openingHours) {
  const day = now.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  let openMinutes = 8 * 60; // 8:00 AM
  let closeMinutes = 20 * 60; // 8:00 PM

  if (day === 0) {
    // Sunday: 10:00 AM - 4:00 PM (16:00)
    openMinutes = 10 * 60;
    closeMinutes = 16 * 60;
  } else if (day === 6) {
    // Saturday: 9:00 AM - 6:00 PM (18:00)
    openMinutes = 9 * 60;
    closeMinutes = 18 * 60;
  } else {
    // Monday - Friday: 8:00 AM - 8:00 PM (20:00)
    openMinutes = 8 * 60;
    closeMinutes = 20 * 60;
  }

  const isOpen = currentMinutes >= openMinutes && currentMinutes < closeMinutes;
  return {
    isOpen,
    badgeText: isOpen ? "🟢 Open Now" : "🔴 Closed",
    statusClass: isOpen ? "open" : "closed",
    hoursToday: day === 0 ? "10:00 AM – 4:00 PM" : day === 6 ? "9:00 AM – 6:00 PM" : "8:00 AM – 8:00 PM"
  };
}

export function getFavoriteProductIds() {
  try {
    const raw = localStorage.getItem("bloomcare_fav_products");
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    return [];
  }
}

export function isProductFavorited(id) {
  return getFavoriteProductIds().includes(id);
}

export function toggleProductFavorite(id) {
  let favs = getFavoriteProductIds();
  const exists = favs.includes(id);
  if (exists) {
    favs = favs.filter(x => x !== id);
  } else {
    favs.push(id);
  }
  try {
    localStorage.setItem("bloomcare_fav_products", JSON.stringify(favs));
  } catch (err) {}
  return !exists;
}

export function isPharmacyFavorited() {
  try {
    return localStorage.getItem("bloomcare_fav_pharmacy") === "true";
  } catch (err) {
    return false;
  }
}

export function togglePharmacyFavorite() {
  const current = isPharmacyFavorited();
  const next = !current;
  try {
    localStorage.setItem("bloomcare_fav_pharmacy", String(next));
  } catch (err) {}
  return next;
}

export async function sharePharmacyPage() {
  const shareData = {
    title: "BloomCare Pharmacy — Professional Pharmacy Services",
    text: "Order genuine medicines and health supplies with fast doorstep delivery in Mbarara City.",
    url: window.location.href
  };
  if (navigator.share) {
    try {
      await navigator.share(shareData);
    } catch (err) {
      if (err.name !== "AbortError") {
        copyTextToClipboard(window.location.href, "Pharmacy link copied to clipboard!");
      }
    }
  } else {
    copyTextToClipboard(window.location.href, "Pharmacy link copied to clipboard!");
  }
}

function copyTextToClipboard(text, successMsg = "Copied to clipboard!") {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      openNotice("Link Copied", successMsg);
    }).catch(() => {
      openNotice("Share BloomCare", text);
    });
  } else {
    openNotice("Share BloomCare", text);
  }
}

export function openCatalogFilterDialog() {
  const dialog = $("#catalog-filter-dialog");
  if (!dialog) return;

  const catSelect = $("#modal-filter-category");
  if (catSelect && catSelect.options.length <= 1) {
    const activeProds = STATE.products.filter(p => p && p.status !== "inactive");
    catSelect.innerHTML = `<option value="All">All Categories (${activeProds.length})</option>` +
      STATE.categories.map(c => {
        const count = activeProds.filter(p => p.category === c.name).length;
        return `<option value="${escapeHtml(c.name)}">${escapeHtml(c.name)} (${count})</option>`;
      }).join("");
  }
  if (catSelect) catSelect.value = STATE.selectedCategory || "All";

  const rxRadio = $(`input[name="modal-filter-rx"][value="${STATE.filterPrescription || "all"}"]`);
  if (rxRadio) rxRadio.checked = true;

  const availRadio = $(`input[name="modal-filter-avail"][value="${STATE.filterAvailability || "all"}"]`);
  if (availRadio) availRadio.checked = true;

  const sortSelect = $("#modal-filter-sort");
  if (sortSelect) sortSelect.value = STATE.sortMedicines || "name-asc";

  dialog.showModal();
}

export function closeCatalogFilterDialog() {
  $("#catalog-filter-dialog")?.close();
}

export function applyCatalogModalFilters() {
  const catSelect = $("#modal-filter-category");
  if (catSelect) STATE.selectedCategory = catSelect.value;

  const rxRadio = $(`input[name="modal-filter-rx"]:checked`);
  if (rxRadio) STATE.filterPrescription = rxRadio.value;

  const availRadio = $(`input[name="modal-filter-avail"]:checked`);
  if (availRadio) STATE.filterAvailability = availRadio.value;

  const sortSelect = $("#modal-filter-sort");
  if (sortSelect) {
    STATE.sortMedicines = sortSelect.value;
    const pageSort = $("#sort-medicines");
    if (pageSort) pageSort.value = sortSelect.value;
  }

  STATE.marketplacePage = 1;
  closeCatalogFilterDialog();
  renderMedicinesView();
}

export function resetCatalogModalFilters() {
  STATE.selectedCategory = "All";
  STATE.filterPrescription = "all";
  STATE.filterAvailability = "all";
  STATE.sortMedicines = "name-asc";
  STATE.marketplacePage = 1;

  const catSelect = $("#modal-filter-category");
  if (catSelect) catSelect.value = "All";

  const rxRadio = $(`input[name="modal-filter-rx"][value="all"]`);
  if (rxRadio) rxRadio.checked = true;

  const availRadio = $(`input[name="modal-filter-avail"][value="all"]`);
  if (availRadio) availRadio.checked = true;

  const sortSelect = $("#modal-filter-sort");
  if (sortSelect) sortSelect.value = "name-asc";

  const pageSort = $("#sort-medicines");
  if (pageSort) pageSort.value = "name-asc";

  closeCatalogFilterDialog();
  renderMedicinesView();
}

export function renderRecommendedProductCardHtml(prod) {
  const avail = getProductAvailability(prod);
  const img = getProductImage(prod);
  const isFav = isProductFavorited(prod.id);
  const hasDiscount = Boolean(prod.originalPrice && prod.originalPrice > prod.price);
  const discountPct = hasDiscount ? Math.round((1 - prod.price / prod.originalPrice) * 100) : 0;
  const strengthMatch = prod.name.match(/\b\d+(\.\d+)?\s*(mg|mcg|g|ml|%|IU)\b/i) || prod.genericName?.match(/\b\d+(\.\d+)?\s*(mg|mcg|g|ml|%|IU)\b/i);
  const pack = prod.packSize || prod.dosageForm || "Pack";
  const generic = prod.genericName || (strengthMatch ? strengthMatch[0] : "");
  const cartItem = (STATE.cart || []).find(i => (i.productId || i.product?.id) === prod.id);
  const inCart = Boolean(cartItem && cartItem.quantity > 0);
  const cartQty = inCart ? cartItem.quantity : 1;
  const isOutOfStock = prod.stockQuantity <= 0 || !avail.isAvailable;

  return `
    <article class="product-card recommended-prod-card" data-product-id="${escapeHtml(prod.id)}" title="View ${escapeHtml(prod.name)}">
      ${hasDiscount ? `<span class="discount-ribbon">${discountPct}% OFF</span>` : ""}
      <button class="prod-card-fav-btn ${isFav ? "active" : ""}" type="button" data-id="${escapeHtml(prod.id)}" aria-label="${isFav ? "Remove from favorites" : "Add to favorites"}">
        ${isFav ? "♥" : "♡"}
      </button>
      <div class="product-thumb-container">
        <img src="${escapeHtml(img)}" alt="${escapeHtml(prod.name)}" class="product-thumb-img" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='products/placeholder-medicine.svg';" />
      </div>
      <div class="rec-card-body">
        <h4 class="rec-product-name">${escapeHtml(prod.name)}</h4>
        <p class="rec-product-meta">${escapeHtml(pack)}${generic ? ` &bull; ${escapeHtml(generic)}` : ""}</p>
        <div class="rec-stock-row" style="font-size:11.5px; margin-bottom:4px;">
          <span class="stock-status-label ${avail.badgeClass}">Stock: ${prod.stockQuantity > 0 ? `<strong>${prod.stockQuantity}</strong> available` : "Out of Stock"}</span>
        </div>
        <div class="rec-pricing-row">
          <div class="rec-price-box">
            <span class="rec-current-price">${formatUGX(prod.price)}</span>
            ${hasDiscount ? `<span class="rec-original-price" style="text-decoration:line-through; color:var(--text-muted); font-size:11px; margin-left:4px;">${formatUGX(prod.originalPrice)}</span>` : ""}
          </div>
          <div class="product-card-qty-stepper ${inCart ? "" : "hidden"}" data-product-id="${escapeHtml(prod.id)}" style="${inCart ? "display:inline-flex;" : "display:none;"}">
            <button type="button" class="btn-qty-step btn-qty-minus" data-id="${escapeHtml(prod.id)}" aria-label="Decrease quantity" title="Decrease quantity">&minus;</button>
            <span class="card-qty-val prod-card-qty-input" data-id="${escapeHtml(prod.id)}">${cartQty}</span>
            <button type="button" class="btn-qty-step btn-qty-plus" data-id="${escapeHtml(prod.id)}" aria-label="Increase quantity" title="Increase quantity" ${cartQty >= prod.stockQuantity ? "disabled" : ""}>&plus;</button>
          </div>
          <button class="circular-plus-btn add-cart-btn ${inCart ? "hidden" : ""}" type="button" data-product-id="${escapeHtml(prod.id)}" aria-label="Add ${escapeHtml(prod.name)} to cart" style="${inCart ? "display:none;" : ""}" ${isOutOfStock ? "disabled" : ""}>
            ${isOutOfStock ? "Out of Stock" : "Add to Cart"}
          </button>
        </div>
      </div>
    </article>
  `;
}

export function renderMedicinesView() {
  const effRole = getEffectiveRole();
  const isStaff = effRole === "admin" || effRole === "developer" || effRole === "pharmacist" || effRole === "assistant_pharmacist";
  $("#medicines-staff-header")?.classList.toggle("hidden", !isStaff);
  $("#medicines-staff-actions")?.classList.toggle("hidden", !isStaff);
  $("#staff-medicines-table-card")?.classList.toggle("hidden", !isStaff);
  $("#customer-storefront-wrapper")?.classList.toggle("hidden", isStaff);
  $("#customer-medicines-controls")?.classList.toggle("hidden", isStaff);
  $("#catalog-products-grid")?.classList.toggle("hidden", isStaff);
  $("#catalog-pagination")?.classList.toggle("hidden", isStaff);
  $("#floating-rx-order-btn")?.classList.toggle("hidden", isStaff);

  if (isStaff) {
    // Staff filter logic
    let staffList = [...STATE.products];
    const sSearch = (STATE.staffMedicineSearch || "").trim().toLowerCase();
    if (sSearch) {
      staffList = searchMedicinesCatalog(staffList, sSearch, {
        category: STATE.staffMedicineCategory,
        includeInactive: true,
        sortBy: "name-asc"
      });
    } else {
      staffList = sortMedicinesList(staffList, "name-asc");
    }
    if (STATE.staffMedicineCategory && STATE.staffMedicineCategory !== "all") {
      staffList = staffList.filter(p => p.category === STATE.staffMedicineCategory);
    }
    if (STATE.staffMedicineStatus && STATE.staffMedicineStatus !== "all") {
      if (STATE.staffMedicineStatus === "active") staffList = staffList.filter(p => p.status === "active");
      if (STATE.staffMedicineStatus === "inactive") staffList = staffList.filter(p => p.status === "inactive");
      if (STATE.staffMedicineStatus === "low-stock") staffList = staffList.filter(p => (p.stockQuantity <= (p.reorderLevel || 10)) && p.stockQuantity > 0);
      if (STATE.staffMedicineStatus === "out-of-stock") staffList = staffList.filter(p => p.stockQuantity === 0);
    }

    const staffPageSize = STATE.staffMedicinesPageSize || 25;
    const totalStaffItems = staffList.length;
    const totalStaffPages = Math.max(1, Math.ceil(totalStaffItems / staffPageSize));
    if (STATE.staffMedicinesPage > totalStaffPages) STATE.staffMedicinesPage = totalStaffPages;
    if (STATE.staffMedicinesPage < 1) STATE.staffMedicinesPage = 1;
    const currentStaffPage = STATE.staffMedicinesPage;
    const startStaffIdx = (currentStaffPage - 1) * staffPageSize;
    const endStaffIdx = Math.min(startStaffIdx + staffPageSize, totalStaffItems);
    const pagedStaffList = staffList.slice(startStaffIdx, endStaffIdx);

    // Populate or update toolbar inputs
    const searchInp = $("#staff-medicine-search");
    if (searchInp && searchInp.value !== (STATE.staffMedicineSearch || "")) {
      searchInp.value = STATE.staffMedicineSearch || "";
    }
    const catSelect = $("#staff-medicine-category-filter");
    if (catSelect && catSelect.options.length <= 1) {
      catSelect.innerHTML = `<option value="all">All Categories (${STATE.products.length})</option>` +
        STATE.categories.map(c => `<option value="${escapeHtml(c.name)}">${escapeHtml(c.name)} (${STATE.products.filter(p => p.category === c.name).length})</option>`).join("");
      catSelect.value = STATE.staffMedicineCategory || "all";
    }

    const box = $("#staff-medicines-table-box");
    if (box) {
      if (totalStaffItems === 0) {
        box.innerHTML = `
          <div class="empty-state-box" style="padding: 30px; text-align:center;">
            <p class="empty-title">No medicine found.</p>
            <p class="empty-desc">Try searching by medicine name, generic name or active ingredient.</p>
          </div>
        `;
      } else {
        const isAdmin = effRole === "admin" || effRole === "developer";
        box.innerHTML = `
          <table class="standard-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Selling Price</th>
                ${isAdmin ? '<th>Cost Price</th>' : ''}
                <th>Stock</th>
                <th>Min</th>
                <th>Rx</th>
                <th>Batch</th>
                <th>Expiry</th>
                <th>Availability</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${pagedStaffList.map(p => {
                const avail = getProductAvailability(p);
                const selling = p.sellingPrice || p.price;
                const cost = p.costPrice || Math.round(selling * 0.68);
                return `
                  <tr>
                    <td><strong>${escapeHtml(p.name)}</strong><br><small class="muted">${escapeHtml(p.genericName || "—")} ${p.sku ? `&bull; <code>${escapeHtml(p.sku)}</code>` : ''}</small></td>
                    <td>${escapeHtml(p.category)}</td>
                    <td><strong>${formatUGX(selling)}</strong></td>
                    ${isAdmin ? `<td><span class="muted" style="font-size:12px; font-weight:600;">${formatUGX(cost)}</span></td>` : ''}
                    <td><span class="stock-pill ${avail.badgeClass}">${p.stockQuantity}</span></td>
                    <td>${p.reorderLevel}</td>
                    <td>${p.requiresPrescription ? '<span class="rx-pill rx-req">Rx</span>' : '<span class="rx-pill otc-ok">OTC</span>'}</td>
                    <td><code>${escapeHtml(p.batchNumber)}</code></td>
                    <td>${escapeHtml(p.expiryDate)}</td>
                    <td><span class="status-pill status-${avail.badgeClass.replace(/-/g, "_")}">${avail.status}</span></td>
                    <td style="white-space:nowrap;">
                      <button class="btn btn-secondary btn-sm edit-prod-btn" data-id="${p.id}">Edit</button>
                      ${isAdmin ? `<button class="btn btn-outline btn-sm edit-price-btn" data-id="${p.id}" title="Price Control & History">Price</button>` : ''}
                      <button class="btn btn-outline btn-sm toggle-prod-btn" data-id="${p.id}">${p.status === "active" ? "Deactivate" : "Activate"}</button>
                    </td>
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>
        `;
      }
    }

    // Render Staff Pagination
    const staffPagination = $("#staff-medicines-pagination");
    if (staffPagination) {
      if (totalStaffItems <= staffPageSize) {
        staffPagination.innerHTML = totalStaffItems > 0 ? `<div class="pagination-summary" style="padding:10px 0; color:var(--text-muted); font-size:13px;">Showing all <strong>${totalStaffItems}</strong> products</div>` : "";
      } else {
        staffPagination.innerHTML = `
          <div class="catalog-pagination-bar" style="border-top:1px solid var(--border-color); padding-top:12px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <div class="pagination-summary" style="color:var(--text-muted); font-size:13px;">
              Showing <strong>${startStaffIdx + 1}–${endStaffIdx}</strong> of <strong>${totalStaffItems}</strong> products
            </div>
            <div class="pagination-controls-group" style="display:flex; align-items:center; gap:8px;">
              <button type="button" class="btn btn-sm btn-outline" data-staff-page="${currentStaffPage - 1}" ${currentStaffPage === 1 ? "disabled" : ""}>&larr; Prev</button>
              <span style="font-size:13px; font-weight:600; padding:0 8px;">Page ${currentStaffPage} of ${totalStaffPages}</span>
              <button type="button" class="btn btn-sm btn-outline" data-staff-page="${currentStaffPage + 1}" ${currentStaffPage === totalStaffPages ? "disabled" : ""}>Next &rarr;</button>
            </div>
          </div>
        `;
      }
    }
  } else {
    // Render Customer / Visitor Catalog View
    // 1. Update Dynamic Pharmacy Open / Closed Status
    const statusObj = getPharmacyOpenStatus();
    const openBadge = $("#pharmacy-status-pill") || $("#store-open-badge");
    if (openBadge) {
      openBadge.textContent = statusObj.badgeText;
      openBadge.className = `pharmacy-status-pill ${statusObj.statusClass}`;
    }

    // 2. Update Pharmacy Favorite Buttons
    const pharmFav = isPharmacyFavorited();
    $$(".pharmacy-fav-btn").forEach(btn => {
      btn.classList.toggle("active", pharmFav);
      const heartSpan = btn.querySelector(".chip-heart-icon") || btn;
      heartSpan.textContent = pharmFav ? "♥" : "♡";
      btn.setAttribute("aria-label", pharmFav ? "Remove BloomCare from favorites" : "Add BloomCare to favorites");
    });

    // 3. Populate Recommended Products Carousel
    const recTrack = $("#recommended-products-track");
    if (recTrack) {
      const custId = STATE.currentUser?.uid || STATE.currentUser?.email;
      const recommendedList = getRecommendedProducts(custId, STATE.products, STATE.orders, 10);
      recTrack.innerHTML = recommendedList.length > 0
        ? recommendedList.map(renderRecommendedProductCardHtml).join("")
        : `<p class="muted" style="font-size:13px; padding:12px;">Explore our popular products.</p>`;
    }

    // 4. Populate Category Pills
    const pills = $("#catalog-category-pills");
    if (pills) {
      const activeProds = STATE.products.filter(p => p && p.status !== "inactive");
      const totalActive = activeProds.length;
      pills.innerHTML = `
        <button class="pill-btn ${STATE.selectedCategory === "All" ? "active" : ""}" data-filter="All">
          <img src="categories/all-medicines.svg" alt="All Categories" class="cat-card-img" width="18" height="18" style="vertical-align:middle; border-radius:4px;" />
          <span>All Categories (${totalActive})</span>
        </button>
        ${STATE.categories.map(c => {
          const count = activeProds.filter(p => p.category === c.name).length;
          return `<button class="pill-btn ${STATE.selectedCategory === c.name ? "active" : ""}" data-filter="${escapeHtml(c.name)}">
            <img src="${escapeHtml(getCategoryImageUrl(c))}" alt="${escapeHtml(c.name)}" class="cat-card-img" width="18" height="18" style="vertical-align:middle; border-radius:4px;" />
            <span>${escapeHtml(c.name)} (${count})</span>
          </button>`;
        }).join("")}
      `;
    }

    // 5. Active Filters Badge Counter
    const activeFiltersCount = (STATE.selectedCategory && STATE.selectedCategory !== "All" ? 1 : 0) +
      (STATE.filterPrescription && STATE.filterPrescription !== "all" ? 1 : 0) +
      (STATE.filterAvailability && STATE.filterAvailability !== "all" ? 1 : 0) +
      (STATE.sortMedicines && STATE.sortMedicines !== "name-asc" ? 1 : 0);
    const filterBadge = $("#store-filter-active-badge");
    if (filterBadge) {
      if (activeFiltersCount > 0) {
        filterBadge.textContent = String(activeFiltersCount);
        filterBadge.classList.remove("hidden");
      } else {
        filterBadge.classList.add("hidden");
      }
    }

    // Update Macro Category Navigation Bar Active State
    $$(".macro-cat-item").forEach(item => {
      const m = item.dataset.macro || "All";
      item.classList.toggle("active", m === (STATE.macroCategory || "All"));
    });

    // 6. Filter and Sort Catalog List
    let list = [...STATE.products.filter(p => p && p.status !== "inactive")];
    if (STATE.macroCategory && STATE.macroCategory !== "All") {
      if (STATE.macroCategory === "Prescription Medicines") {
        list = list.filter(p => p.requiresPrescription === true);
      } else if (STATE.macroCategory === "Over-the-Counter") {
        list = list.filter(p => !p.requiresPrescription);
      } else if (STATE.macroCategory === "Pain & Fever") {
        list = list.filter(p => p.category === "Pain Relief" || p.category === "Cold & Flu");
      } else if (STATE.macroCategory === "Personal Care") {
        list = list.filter(p => p.category === "Personal Care");
      } else if (STATE.macroCategory === "Baby Care") {
        list = list.filter(p => p.category === "Baby & Child Care" || p.category === "Baby Care");
      } else if (STATE.macroCategory === "Vitamins & Supplements") {
        list = list.filter(p => p.category === "Vitamins & Supplements" || p.category === "Vitamins");
      } else if (STATE.macroCategory === "Medical Equipment") {
        list = list.filter(p => p.category === "Medical Devices" || p.category === "First Aid");
      } else if (STATE.macroCategory === "Beauty & Wellness") {
        list = list.filter(p => p.category === "Skin Care" || p.category === "Wellness Products" || p.category === "Personal Care");
      }
    }
    if (STATE.selectedCategory && STATE.selectedCategory !== "All") {
      list = list.filter(p => p.category === STATE.selectedCategory);
    }
    const q = (STATE.searchQuery || "").trim().toLowerCase();
    if (q) {
      list = searchMedicinesCatalog(list, q, {
        category: STATE.selectedCategory,
        sortBy: STATE.sortMedicines
      });
    } else {
      list = sortMedicinesList(list, STATE.sortMedicines);
    }
    if (STATE.filterAvailability === "in-stock") list = list.filter(p => getProductAvailability(p).isAvailable);
    if (STATE.filterAvailability === "out-of-stock") list = list.filter(p => !getProductAvailability(p).isAvailable);
    if (STATE.filterPrescription === "otc") list = list.filter(p => !p.requiresPrescription);
    if (STATE.filterPrescription === "rx") list = list.filter(p => p.requiresPrescription);

    const totalItems = list.length;
    const countEl = $("#store-products-count");
    if (countEl) countEl.textContent = `(${totalItems})`;

    const pageSize = STATE.marketplacePageSize || 24;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    if (STATE.marketplacePage > totalPages) STATE.marketplacePage = totalPages;
    if (STATE.marketplacePage < 1) STATE.marketplacePage = 1;
    const currentPage = STATE.marketplacePage;
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalItems);
    const pagedList = list.slice(startIndex, endIndex);

    const grid = $("#catalog-products-grid");
    if (grid) {
      if (totalItems === 0) {
        grid.innerHTML = `
          <div class="empty-state-box" style="grid-column: 1 / -1; padding: 40px 20px; text-align:center;">
            <p class="empty-title" style="font-size:16px; font-weight:700; margin-bottom:6px;">No medicine found.</p>
            <p class="empty-desc" style="color:var(--text-muted); font-size:13px; margin-bottom:16px;">Try searching by medicine name, generic name or active ingredient.</p>
            <button class="btn btn-primary btn-sm" id="reset-catalog-filters-btn" type="button">Reset Filters</button>
          </div>
        `;
        $("#reset-catalog-filters-btn")?.addEventListener("click", () => {
          STATE.selectedCategory = "All";
          STATE.searchQuery = "";
          STATE.filterAvailability = "all";
          STATE.filterPrescription = "all";
          STATE.sortMedicines = "name-asc";
          STATE.marketplacePage = 1;
          const inp1 = $("#top-search-input"); if (inp1) inp1.value = "";
          const inp2 = $("#catalog-search-input"); if (inp2) inp2.value = "";
          const selA = $("#filter-availability"); if (selA) selA.value = "all";
          const selP = $("#filter-prescription"); if (selP) selP.value = "all";
          const selS = $("#sort-medicines"); if (selS) selS.value = "name-asc";
          renderMedicinesView();
        });
      } else {
        grid.innerHTML = pagedList.map(renderProductCardHtml).join("");
      }
    }

    // Render Customer Marketplace Pagination
    const paginationContainer = $("#catalog-pagination");
    if (paginationContainer) {
      if (totalItems <= pageSize) {
        paginationContainer.innerHTML = totalItems > 0 ? `
          <div class="catalog-pagination-bar" style="justify-content:center;">
            <span class="pagination-summary">Showing all <strong>${totalItems}</strong> medicines</span>
          </div>
        ` : "";
      } else {
        let pageButtonsHtml = "";
        const maxButtons = 7;
        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, startPage + maxButtons - 1);
        if (endPage - startPage < maxButtons - 1) {
          startPage = Math.max(1, endPage - maxButtons + 1);
        }

        if (startPage > 1) {
          pageButtonsHtml += `<button type="button" class="page-num-btn" data-catalog-page="1">1</button>`;
          if (startPage > 2) pageButtonsHtml += `<span class="pagination-ellipsis">&hellip;</span>`;
        }

        for (let p = startPage; p <= endPage; p++) {
          const isActive = p === currentPage;
          pageButtonsHtml += `<button type="button" class="page-num-btn ${isActive ? 'active-page-btn' : ''}" data-catalog-page="${p}">${p}</button>`;
        }

        if (endPage < totalPages) {
          if (endPage < totalPages - 1) pageButtonsHtml += `<span class="pagination-ellipsis">&hellip;</span>`;
          pageButtonsHtml += `<button type="button" class="page-num-btn" data-catalog-page="${totalPages}">${totalPages}</button>`;
        }

        paginationContainer.innerHTML = `
          <div class="catalog-pagination-bar">
            <div class="pagination-summary">
              Showing <strong>${startIndex + 1}–${endIndex}</strong> of <strong>${totalItems}</strong> medicines (Page ${currentPage} of ${totalPages})
            </div>
            <div class="pagination-controls-group">
              <button type="button" class="page-nav-btn" data-catalog-page="${currentPage - 1}" ${currentPage === 1 ? "disabled" : ""}>&larr; Previous</button>
              <div class="page-numbers-row">
                ${pageButtonsHtml}
              </div>
              <button type="button" class="page-nav-btn" data-catalog-page="${currentPage + 1}" ${currentPage === totalPages ? "disabled" : ""}>Next &rarr;</button>
            </div>
          </div>
        `;
      }
    }
  }
}

export function renderProductCardHtml(prod) {
  const avail = getProductAvailability(prod);
  const rxBadge = prod.requiresPrescription ? `<span class="rx-pill rx-req">Rx Required</span>` : `<span class="rx-pill otc-ok">OTC (No Rx)</span>`;
  const stockBadge = `<span class="stock-pill ${avail.badgeClass}">${avail.label}</span>`;
  const img = getProductImage(prod);
  const isFav = isProductFavorited(prod.id);
  const hasDiscount = Boolean(prod.originalPrice && prod.originalPrice > prod.price);
  const discountPct = hasDiscount ? Math.round((1 - prod.price / prod.originalPrice) * 100) : 0;

  const strengthMatch = prod.name.match(/\b\d+(\.\d+)?\s*(mg|mcg|g|ml|%|IU)\b/i) || prod.genericName?.match(/\b\d+(\.\d+)?\s*(mg|mcg|g|ml|%|IU)\b/i);
  const strength = prod.strength || (strengthMatch ? strengthMatch[0] : "");
  const form = prod.dosageForm || "Unit";
  const pack = prod.packSize || form;
  const cartItem = (STATE.cart || []).find(i => (i.productId || i.product?.id) === prod.id);
  const inCart = Boolean(cartItem && cartItem.quantity > 0);
  const cartQty = inCart ? cartItem.quantity : 1;
  const isOutOfStock = prod.stockQuantity <= 0 || !avail.isAvailable;

  return `
    <article class="product-card horizontal-card" data-product-id="${escapeHtml(prod.id)}" title="Click to view details for ${escapeHtml(prod.name)}">
      ${hasDiscount ? `<span class="discount-ribbon">${discountPct}% OFF</span>` : ""}
      
      <div class="product-thumb-container">
        <img src="${escapeHtml(img)}" alt="${escapeHtml(prod.name)}" class="product-thumb-img" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='products/placeholder-medicine.svg';" />
      </div>

      <div class="product-card-body">
        <div class="product-title-row">
          <h3 class="product-title">${escapeHtml(prod.name)}</h3>
        </div>
        <p class="product-generic">${escapeHtml(pack)}${strength ? ` &bull; ${escapeHtml(strength)}` : ""}${prod.genericName ? ` &bull; ${escapeHtml(prod.genericName)}` : ""}</p>
        <div class="product-badges-row">
          ${stockBadge}
          ${rxBadge}
        </div>
        <p class="product-meta-sub"><small class="muted"><strong>Category:</strong> ${escapeHtml(prod.category)}</small></p>
        <div class="product-card-stock-status">
          <span class="stock-status-label ${avail.badgeClass}">Stock: ${prod.stockQuantity > 0 ? `<strong>${prod.stockQuantity}</strong> available` : '<strong style="color:var(--danger, #dc2626);">Out of Stock</strong>'}</span>
        </div>
        <div class="product-rating-row" style="display:flex; align-items:center; gap:4px; font-size:11.5px; margin:3px 0;">
          <span style="color:#eab308; font-size:12px;">★★★★★</span>
          <span style="font-weight:700; color:var(--text-main);">4.8</span>
          <span class="muted">(24 reviews)</span>
        </div>
        <div class="product-price-row">
          <p class="product-price">${formatUGX(prod.price)}</p>
          ${hasDiscount ? `<span class="product-original-price" style="text-decoration:line-through; color:var(--text-muted); font-size:13px; margin-left:8px;">${formatUGX(prod.originalPrice)}</span>` : ""}
        </div>
      </div>

      <div class="product-card-foot" data-product-id="${escapeHtml(prod.id)}">
        <button class="prod-card-fav-btn ${isFav ? "active" : ""}" type="button" data-id="${escapeHtml(prod.id)}" aria-label="${isFav ? "Remove from favorites" : "Add to favorites"}">
          ${isFav ? "♥" : "♡"}
        </button>
        <div class="product-card-qty-stepper ${inCart ? "" : "hidden"}" data-product-id="${escapeHtml(prod.id)}" style="${inCart ? "display:inline-flex;" : "display:none;"}">
          <button type="button" class="btn-qty-step btn-qty-minus" data-id="${escapeHtml(prod.id)}" aria-label="Decrease quantity" title="Decrease quantity">&minus;</button>
          <span class="card-qty-val prod-card-qty-input" data-id="${escapeHtml(prod.id)}">${cartQty}</span>
          <button type="button" class="btn-qty-step btn-qty-plus" data-id="${escapeHtml(prod.id)}" aria-label="Increase quantity" title="Increase quantity" ${cartQty >= prod.stockQuantity ? "disabled" : ""}>&plus;</button>
        </div>
        <button class="circular-plus-btn add-cart-btn ${inCart ? "hidden" : ""}" type="button" data-product-id="${escapeHtml(prod.id)}" aria-label="Add ${escapeHtml(prod.name)} to cart" style="${inCart ? "display:none;" : ""}" ${isOutOfStock ? "disabled" : ""}>
          ${isOutOfStock ? "Out of Stock" : "Add to Cart"}
        </button>
        <button class="btn btn-warning btn-xs btn-buy-now" type="button" data-product-id="${escapeHtml(prod.id)}" title="Buy Now immediately" ${isOutOfStock ? "disabled" : ""} style="padding:4px 10px; font-weight:700; font-size:11.5px; border-radius:var(--radius-xs);">
          Buy Now
        </button>
      </div>
    </article>
  `;
}

// -------------------------------------------------------------
// 3B. ADMIN PRICE CONTROL & PRICE AUDIT TRAIL
// -------------------------------------------------------------

export function openPriceControlModal(productId) {
  const effRole = getEffectiveRole();
  if (effRole !== "admin" && effRole !== "developer") {
    openNotice("Permission Denied", "Only administrators and developers have authority to adjust medicine prices.");
    return;
  }

  const prod = STATE.products.find(p => p.id === productId);
  if (!prod) {
    openNotice("Product Not Found", "Unable to find product details for price control.");
    return;
  }

  const currSelling = prod.sellingPrice || prod.price || 0;
  const currCost = prod.costPrice || Math.round(currSelling * 0.68);
  const marginPct = currSelling > 0 ? (((currSelling - currCost) / currSelling) * 100).toFixed(1) : "0.0";

  if ($("#price-ctrl-prod-id")) $("#price-ctrl-prod-id").value = prod.id;
  if ($("#price-ctrl-title")) $("#price-ctrl-title").textContent = `Price Control — ${prod.name}`;
  if ($("#price-ctrl-subtitle")) $("#price-ctrl-subtitle").textContent = `Manage commercial pricing for ${prod.name} (${prod.category})`;
  if ($("#price-ctrl-prod-name")) $("#price-ctrl-prod-name").textContent = prod.name;
  if ($("#price-ctrl-prod-generic")) $("#price-ctrl-prod-generic").textContent = prod.genericName || "—";
  if ($("#price-ctrl-prod-sku")) $("#price-ctrl-prod-sku").textContent = prod.sku || "BC-SKU";
  if ($("#price-ctrl-prod-cat")) $("#price-ctrl-prod-cat").textContent = prod.category;
  if ($("#price-ctrl-packsize-badge")) $("#price-ctrl-packsize-badge").textContent = prod.packSize || prod.dosageForm || "Standard Unit";
  if ($("#price-ctrl-curr-selling")) $("#price-ctrl-curr-selling").textContent = formatUGX(currSelling);
  if ($("#price-ctrl-curr-cost")) $("#price-ctrl-curr-cost").textContent = formatUGX(currCost);
  if ($("#price-ctrl-curr-margin")) $("#price-ctrl-curr-margin").textContent = `${marginPct}%`;
  if ($("#price-ctrl-last-updated")) $("#price-ctrl-last-updated").textContent = prod.priceLastUpdated || "2026-09-05";

  if ($("#price-ctrl-selling-input")) $("#price-ctrl-selling-input").value = currSelling;
  if ($("#price-ctrl-cost-input")) $("#price-ctrl-cost-input").value = currCost;
  if ($("#price-ctrl-packsize-input")) $("#price-ctrl-packsize-input").value = prod.packSize || prod.dosageForm || "Pack of 20 Tablets";
  if ($("#price-ctrl-source-input")) $("#price-ctrl-source-input").value = prod.priceSource || "Uganda community pharmacy market reference (Kampala retail survey & EMHSLU 2023)";
  if ($("#price-ctrl-reason-input")) $("#price-ctrl-reason-input").value = "";

  // Reset large change warning
  $("#price-ctrl-large-change-alert")?.classList.add("hidden");
  if ($("#price-ctrl-confirm-check")) $("#price-ctrl-confirm-check").checked = false;

  // Render price history
  renderPriceHistoryTable(prod);

  $("#price-control-dialog")?.showModal();
}

export function closePriceControlModal() {
  $("#price-control-dialog")?.close();
}

export function renderPriceHistoryTable(prod) {
  const container = $("#price-history-table-container");
  if (!container) return;

  const history = Array.isArray(prod.priceHistory) && prod.priceHistory.length > 0
    ? prod.priceHistory
    : [{
        previousPrice: prod.sellingPrice || prod.price,
        newPrice: prod.sellingPrice || prod.price,
        costPrice: prod.costPrice || Math.round((prod.sellingPrice || prod.price) * 0.68),
        changedBy: "Baseline Market Survey",
        date: prod.priceLastUpdated || "2026-09-05",
        reason: "Initial Uganda community pharmacy market catalog review",
        source: prod.priceSource || "Uganda community pharmacy market reference"
      }];

  container.innerHTML = `
    <table class="price-history-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Staff / Actor</th>
          <th>Previous</th>
          <th>New Selling</th>
          <th>Cost Price</th>
          <th>Reason</th>
          <th>Source</th>
        </tr>
      </thead>
      <tbody>
        ${history.map(h => `
          <tr>
            <td><strong>${escapeHtml(h.date || "2026-09-05")}</strong></td>
            <td>${escapeHtml(h.changedBy || "Admin")}</td>
            <td>${h.previousPrice ? formatUGX(h.previousPrice) : "—"}</td>
            <td><strong style="color:#0f766e;">${formatUGX(h.newPrice)}</strong></td>
            <td>${h.costPrice ? formatUGX(h.costPrice) : "—"}</td>
            <td><small>${escapeHtml(h.reason || "Market adjustment")}</small></td>
            <td><small class="muted">${escapeHtml(h.source || "Market reference")}</small></td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

// -------------------------------------------------------------
// 3C. ADMIN PRICE REVIEW SUMMARY REPORT & CSV EXPORT
// -------------------------------------------------------------

export function openPriceSummaryModal() {
  const effRole = getEffectiveRole();
  const isStaff = effRole === "admin" || effRole === "developer" || effRole === "pharmacist" || effRole === "assistant_pharmacist";
  if (!isStaff) {
    openNotice("Permission Denied", "Price Review Summary is reserved for authorized pharmacy personnel.");
    return;
  }

  // Populate Categories Filter
  const catFilter = $("#price-summary-cat-filter");
  if (catFilter) {
    catFilter.innerHTML = `<option value="all">All Categories (${STATE.products.length})</option>` +
      STATE.categories.map(c => `<option value="${escapeHtml(c.name)}">${escapeHtml(c.name)} (${STATE.products.filter(p => p.category === c.name).length})</option>`).join("");
    catFilter.value = "all";
  }

  // Calculate Metrics
  const total = STATE.products.length;
  const updatedCount = STATE.products.filter(p => Array.isArray(p.priceHistory) && p.priceHistory.some(h => h.previousPrice && h.previousPrice !== h.newPrice)).length;
  const verifiedCount = total - updatedCount;

  if ($("#kpi-total-reviewed")) $("#kpi-total-reviewed").textContent = total;
  if ($("#kpi-prices-updated")) $("#kpi-prices-updated").textContent = updatedCount;
  if ($("#kpi-prices-verified")) $("#kpi-prices-verified").textContent = verifiedCount;
  if ($("#kpi-missing-reference")) $("#kpi-missing-reference").textContent = "0";
  if ($("#kpi-manual-review")) $("#kpi-manual-review").textContent = "0";

  if ($("#price-summary-search")) $("#price-summary-search").value = "";

  renderPriceSummaryTable();
  $("#price-summary-dialog")?.showModal();
}

export function closePriceSummaryModal() {
  $("#price-summary-dialog")?.close();
}

export function renderPriceSummaryTable(searchQuery = "", category = "all") {
  const box = $("#price-summary-table-box");
  if (!box) return;

  let list = [...STATE.products];
  const q = (searchQuery || "").trim().toLowerCase();
  if (q) {
    list = list.filter(p => 
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.genericName && p.genericName.toLowerCase().includes(q)) ||
      (p.brandName && p.brandName.toLowerCase().includes(q)) ||
      (p.sku && p.sku.toLowerCase().includes(q))
    );
  }
  if (category && category !== "all") {
    list = list.filter(p => p.category === category);
  }

  if (list.length === 0) {
    box.innerHTML = `
      <div style="padding:40px 20px; text-align:center; color:var(--text-muted);">
        <p style="font-weight:600; font-size:15px;">No products match your search.</p>
        <p style="font-size:13px;">Try clearing filters or searching for another medicine.</p>
      </div>
    `;
    return;
  }

  const effRole = getEffectiveRole();
  const isAdmin = effRole === "admin" || effRole === "developer";

  box.innerHTML = `
    <table class="price-audit-table">
      <thead>
        <tr>
          <th>Product / Generic</th>
          <th>Category</th>
          <th>Pack Size</th>
          <th>Cost Price</th>
          <th>Selling Price</th>
          <th>Margin</th>
          <th>Price Reference</th>
          <th>Last Updated</th>
          ${isAdmin ? '<th>Action</th>' : ''}
        </tr>
      </thead>
      <tbody>
        ${list.map(p => {
          const selling = p.sellingPrice || p.price || 0;
          const cost = p.costPrice || Math.round(selling * 0.68);
          const margin = selling > 0 ? (((selling - cost) / selling) * 100).toFixed(1) : "0.0";
          const isHealthy = Number(margin) >= 25;
          return `
            <tr>
              <td>
                <strong>${escapeHtml(p.name)}</strong>
                <br><small class="muted">${escapeHtml(p.genericName || "—")} &bull; <code>${escapeHtml(p.sku || "")}</code></small>
              </td>
              <td><span style="font-size:12px;">${escapeHtml(p.category)}</span></td>
              <td><span style="font-size:12px; font-weight:600; color:#334155;">${escapeHtml(p.packSize || p.dosageForm || "—")}</span></td>
              <td><strong style="color:#475569;">${formatUGX(cost)}</strong></td>
              <td><strong style="color:#0f766e;">${formatUGX(selling)}</strong></td>
              <td>
                <span class="margin-badge ${isHealthy ? 'margin-healthy' : 'margin-tight'}">
                  ${margin}%
                </span>
              </td>
              <td>
                <span style="font-size:11.5px; color:#64748b;" title="${escapeHtml(p.priceNotes || '')}">
                  ${escapeHtml(p.priceSource || "Uganda market reference")}
                </span>
              </td>
              <td><small style="color:#64748b;">${escapeHtml(p.priceLastUpdated || "2026-09-05")}</small></td>
              ${isAdmin ? `
                <td>
                  <button type="button" class="btn btn-secondary btn-sm quick-edit-price-btn" data-id="${p.id}">
                    Edit Price
                  </button>
                </td>
              ` : ''}
            </tr>
          `;
        }).join("")}
      </tbody>
    </table>
  `;
}

export function exportPriceCatalogCsv() {
  const headers = [
    "Product ID",
    "Product Name",
    "Generic Name",
    "Brand",
    "SKU",
    "Category",
    "Strength",
    "Dosage Form",
    "Pack Size",
    "Cost Price (UGX)",
    "Selling Price (UGX)",
    "Gross Margin (%)",
    "Prescription Required",
    "Price Source",
    "Price Notes",
    "Last Updated"
  ];

  const rows = STATE.products.map(p => {
    const selling = p.sellingPrice || p.price || 0;
    const cost = p.costPrice || Math.round(selling * 0.68);
    const margin = selling > 0 ? (((selling - cost) / selling) * 100).toFixed(1) : "0.0";
    return [
      p.id,
      `"${(p.name || '').replace(/"/g, '""')}"`,
      `"${(p.genericName || '').replace(/"/g, '""')}"`,
      `"${(p.brandName || '').replace(/"/g, '""')}"`,
      p.sku || "",
      `"${(p.category || '').replace(/"/g, '""')}"`,
      `"${(p.strength || '').replace(/"/g, '""')}"`,
      `"${(p.dosageForm || '').replace(/"/g, '""')}"`,
      `"${(p.packSize || p.dosageForm || '').replace(/"/g, '""')}"`,
      cost,
      selling,
      margin,
      p.requiresPrescription ? "Yes (Rx)" : "No (OTC)",
      `"${(p.priceSource || 'Uganda pharmacy market reference').replace(/"/g, '""')}"`,
      `"${(p.priceNotes || '').replace(/"/g, '""')}"`,
      p.priceLastUpdated || "2026-09-05"
    ].join(",");
  });

  const csvContent = [headers.join(","), ...rows].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `BloomCare_Uganda_Price_Catalog_Report_${new Date().toISOString().split("T")[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  showToast("Price catalog CSV report exported successfully.", "success");
}

function openProductFormModal(prodId = null) {
  const prod = prodId ? STATE.products.find(p => p.id === prodId) : null;
  $("#prod-id").value = prod ? prod.id : "";
  $("#product-modal-title").textContent = prod ? "Edit Pharmacy Product" : "Add New Pharmacy Product";
  $("#prod-image-url").value = prod ? (prod.imageUrl || prod.image || "") : "";
  $("#prod-img-preview").src = prod ? getProductImage(prod) : "products/placeholder-medicine.svg";
  if ($("#prod-image-file")) $("#prod-image-file").value = "";
  $("#prod-name").value = prod ? prod.name : "";
  $("#prod-generic").value = prod ? prod.genericName : "";
  $("#prod-strength").value = prod ? (prod.strength || "") : "";
  $("#prod-brand").value = prod ? (prod.brandName || "") : "";
  $("#prod-category").value = prod ? prod.category : "Pain Relief";
  $("#prod-price").value = prod ? (prod.sellingPrice || prod.price || "") : "";
  if ($("#prod-cost-price")) $("#prod-cost-price").value = prod ? (prod.costPrice || Math.round((prod.sellingPrice || prod.price) * 0.68)) : "";
  if ($("#prod-pack-size")) $("#prod-pack-size").value = prod ? (prod.packSize || prod.dosageForm || "Pack of 20 Tablets") : "Pack of 20 Tablets";
  if ($("#prod-price-source")) $("#prod-price-source").value = prod ? (prod.priceSource || "Uganda community pharmacy market reference (Kampala retail survey & EMHSLU 2023)") : "Uganda community pharmacy market reference (Kampala retail survey & EMHSLU 2023)";
  if ($("#prod-price-notes")) $("#prod-price-notes").value = prod ? (prod.priceNotes || "") : "Retail market reference price aligned with EMHSLU 2023 formulation standards.";
  $("#prod-stock").value = prod ? prod.stockQuantity : "";
  $("#prod-min-stock").value = prod ? (prod.reorderLevel ?? 10) : 10;
  $("#prod-unit").value = prod ? prod.dosageForm : "Pack of 20 Tablets";
  $("#prod-mfg").value = prod ? prod.manufacturer : "GSK Consumer Healthcare";
  $("#prod-batch").value = prod ? prod.batchNumber : "DEMO-2026-" + Math.floor(1000 + Math.random() * 9000);
  $("#prod-expiry").value = prod ? prod.expiryDate : "2028-12-31";
  $("#prod-desc").value = prod ? prod.description : "[DEMONSTRATION TEST DATA] ";
  $("#prod-requires-rx").checked = prod ? Boolean(prod.requiresPrescription) : false;
  $("#prod-active-status").checked = prod ? prod.status === "active" : true;

  $("#product-form-dialog").showModal();
}

function openProductDetailsModal(productId) {
  const prod = STATE.products.find(p => p.id === productId);
  if (!prod) {
    openNotice("Product Not Found", "Unable to locate details for the selected product.");
    return;
  }

  const avail = getProductAvailability(prod);
  const img = getProductImage(prod);
  $("#modal-product-name").textContent = prod.name;
  $("#modal-product-price").textContent = formatUGX(prod.price);
  
  const modalQtyInput = $("#modal-product-qty");
  if (modalQtyInput) {
    modalQtyInput.value = "1";
    modalQtyInput.max = String(Math.max(1, prod.stockQuantity || 1));
    modalQtyInput.disabled = !avail.isAvailable;
  }

  const addBtn = $("#modal-add-cart-btn");
  if (addBtn) {
    addBtn.dataset.productId = prod.id;
    addBtn.disabled = !avail.isAvailable;
    addBtn.textContent = !avail.isAvailable ? "Currently Unavailable" : "Add to Cart";
  }

  const buyNowBtn = $("#modal-buy-now-btn");
  if (buyNowBtn) {
    buyNowBtn.dataset.productId = prod.id;
    buyNowBtn.disabled = !avail.isAvailable;
    buyNowBtn.onclick = () => handleBuyNow(prod.id);
  }

  const wishlistBtn = $("#modal-wishlist-btn");
  if (wishlistBtn) {
    wishlistBtn.dataset.productId = prod.id;
    const isSaved = isInWishlist(prod.id);
    wishlistBtn.textContent = isSaved ? "♥ In Wishlist" : "♡ Add to Wishlist";
    wishlistBtn.onclick = async () => {
      const added = await toggleProductWishlist(prod.id);
      wishlistBtn.textContent = added ? "♥ In Wishlist" : "♡ Add to Wishlist";
    };
  }

  const strengthMatch = prod.name.match(/\b\d+(\.\d+)?\s*(mg|mcg|g|ml|%|IU)\b/i) || prod.genericName?.match(/\b\d+(\.\d+)?\s*(mg|mcg|g|ml|%|IU)\b/i);
  const strength = prod.strength || (strengthMatch ? strengthMatch[0] : "Standard Dose");
  const relatedProds = (STATE.products || []).filter(p => p && p.id !== prod.id && p.category === prod.category).slice(0, 4);

  // Initial render
  renderProductDetailsTabsContent(prod, avail, img, strength, relatedProds);

  // Load reviews asynchronously and re-populate reviews tab
  loadProductReviews(prod.id).then(reviews => {
    const revList = document.getElementById("modal-reviews-list-box");
    if (revList) {
      if (reviews.length === 0) {
        revList.innerHTML = `<p class="muted">No customer reviews yet. Be the first verified customer to review this medicine.</p>`;
      } else {
        revList.innerHTML = reviews.map(r => `
          <div class="product-review-card" style="padding:10px; border:1px solid var(--border-color); border-radius:6px; margin-bottom:8px; background:var(--bg-page);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
              <div>
                <strong style="font-size:13px;">${escapeHtml(r.reviewerName || 'Verified Buyer')}</strong>
                ${r.verifiedBuyer ? '<span style="font-size:10.5px; background:#dcfce7; color:#166534; padding:1px 5px; border-radius:3px; margin-left:6px;">✓ Verified Purchase</span>' : ''}
              </div>
              <div style="color:#eab308; font-size:12px;">${'★'.repeat(r.rating || 5)}${'☆'.repeat(5 - (r.rating || 5))}</div>
            </div>
            <p style="margin:4px 0 2px; font-size:12.5px; color:var(--text-main); line-height:1.4;">${escapeHtml(r.comment || '')}</p>
            <small class="muted" style="font-size:11px;">${escapeHtml(r.date || 'Recent')}</small>
          </div>
        `).join("");
      }
    }
  });

  $("#product-details-dialog").showModal();
}

function renderProductDetailsTabsContent(prod, avail, img, strength, relatedProds) {
  $("#product-details-content").innerHTML = `
    <div class="modal-product-hero">
      <div class="modal-product-img-wrap">
        <img src="${escapeHtml(img)}" alt="${escapeHtml(prod.name)}" class="modal-product-large-img" onerror="this.onerror=null;this.src='products/placeholder-medicine.svg';" />
      </div>
      <div class="modal-product-hero-meta">
        <div class="product-badges-row" style="margin-bottom:6px;">
          <span class="stock-pill ${avail.badgeClass}">Stock: ${avail.label}</span>
          ${prod.requiresPrescription ? '<span class="rx-pill rx-req">Prescription Required (Rx)</span>' : '<span class="rx-pill otc-ok">Over-The-Counter (OTC)</span>'}
        </div>
        <h3 class="modal-prod-title">${escapeHtml(prod.name)}</h3>
        <div class="product-rating-row" style="display:flex; align-items:center; gap:6px; font-size:12.5px; margin:4px 0 8px;">
          <span style="color:#eab308; font-size:14px;">★★★★★</span>
          <strong>4.8</strong>
          <span class="muted">(24 verified reviews)</span>
        </div>
        <p class="modal-prod-generic"><strong>Active Ingredient:</strong> ${escapeHtml(prod.genericName || "Active Molecule")}</p>
        <p class="modal-prod-category"><strong>Department:</strong> ${escapeHtml(prod.category)}</p>
        <div class="modal-prod-pills">
          <span class="spec-pill"><strong>Strength:</strong> ${escapeHtml(strength)}</span>
          <span class="spec-pill"><strong>Pack Size:</strong> ${escapeHtml(prod.packSize || prod.dosageForm || "Pack")}</span>
        </div>
        <div class="modal-prod-price-banner">
          <span class="modal-price-label">Price:</span>
          <strong class="modal-price-val">${formatUGX(prod.price)}</strong>
          ${prod.originalPrice && prod.originalPrice > prod.price ? `<span style="text-decoration:line-through; font-size:13px; color:var(--text-muted); margin-left:6px;">${formatUGX(prod.originalPrice)}</span>` : ''}
        </div>
      </div>
    </div>

    <!-- Interactive Monograph Tabs Bar -->
    <div class="monograph-tabs-bar" id="monograph-tabs-bar" style="display:flex; gap:6px; border-bottom:2px solid var(--border-color); margin:14px 0 10px; overflow-x:auto; padding-bottom:6px;">
      <button type="button" class="monograph-tab-btn active" data-mono-tab="indications" style="font-size:12px; font-weight:700; padding:6px 10px; border-radius:4px; border:none; cursor:pointer; background:#0f766e; color:#fff;">Indications &amp; Uses</button>
      <button type="button" class="monograph-tab-btn" data-mono-tab="dosage" style="font-size:12px; font-weight:600; padding:6px 10px; border-radius:4px; border:none; cursor:pointer; background:var(--bg-page); color:var(--text-main);">Dosage &amp; Usage</button>
      <button type="button" class="monograph-tab-btn" data-mono-tab="storage" style="font-size:12px; font-weight:600; padding:6px 10px; border-radius:4px; border:none; cursor:pointer; background:var(--bg-page); color:var(--text-main);">Storage &amp; Safety</button>
      <button type="button" class="monograph-tab-btn" data-mono-tab="reviews" style="font-size:12px; font-weight:600; padding:6px 10px; border-radius:4px; border:none; cursor:pointer; background:var(--bg-page); color:var(--text-main);">Customer Reviews</button>
      <button type="button" class="monograph-tab-btn" data-mono-tab="related" style="font-size:12px; font-weight:600; padding:6px 10px; border-radius:4px; border:none; cursor:pointer; background:var(--bg-page); color:var(--text-main);">Related Medicines</button>
    </div>

    <!-- Tab 1: Indications -->
    <div class="monograph-tab-pane" id="mono-pane-indications">
      <div class="monograph-desc-box">
        <strong>Clinical Indications &amp; Summary:</strong>
        <p style="margin-top:4px; line-height:1.5;">${escapeHtml(prod.description)}</p>
      </div>
      <div class="monograph-details-grid" style="margin-top:10px;">
        <div class="monograph-item"><strong>Manufacturer:</strong> <span>${escapeHtml(prod.manufacturer || "BloomCare Pharma")}</span></div>
        <div class="monograph-item"><strong>Batch / Lot:</strong> <code>${escapeHtml(prod.batchNumber || "DEMO-2026")}</code></div>
        <div class="monograph-item"><strong>Expiry Date:</strong> <span>${escapeHtml(prod.expiryDate || "2028-12-31")}</span></div>
        <div class="monograph-item"><strong>In Stock:</strong> <span>${prod.stockQuantity} units available</span></div>
      </div>
    </div>

    <!-- Tab 2: Dosage & Administration -->
    <div class="monograph-tab-pane hidden" id="mono-pane-dosage">
      <div style="background:var(--bg-page); padding:12px; border-radius:6px; border:1px solid var(--border-color);">
        <h4 style="margin:0 0 6px; font-size:13.5px; color:#0f766e;">Clinical Dosage &amp; Administration Guidelines</h4>
        <p style="margin:0 0 8px; font-size:12.5px; line-height:1.5;">
          Administer orally as directed by your physician or pharmacist. Take with plenty of clean drinking water. For suspension or pediatric drops, shake well before measuring with an oral syringe or dosing cup.
        </p>
        <div style="font-size:12px; color:var(--muted); line-height:1.4;">
          <strong>Dispensing Advice:</strong> Do not chew delayed-release capsules or tablets. Consult a BloomCare pharmacist on WhatsApp (+256 750 210 886) for individualized therapeutic guidance.
        </div>
      </div>
    </div>

    <!-- Tab 3: Storage & Safety Warnings -->
    <div class="monograph-tab-pane hidden" id="mono-pane-storage">
      <div style="background:var(--bg-page); padding:12px; border-radius:6px; border:1px solid var(--border-color);">
        <h4 style="margin:0 0 6px; font-size:13.5px; color:#b45309;">Storage Conditions &amp; Pharmacist Precautions</h4>
        <ul style="margin:0 0 8px; padding-left:18px; font-size:12.5px; line-height:1.5;">
          <li>Store below 30°C in a dry place away from direct sunlight and heat.</li>
          <li>Keep out of reach of children and pets.</li>
          <li>Do not consume after the printed expiry date (${escapeHtml(prod.expiryDate || '2028-12-31')}).</li>
          <li>Report any unexpected adverse reaction to your doctor or NDA National Pharmacovigilance Centre.</li>
        </ul>
      </div>
    </div>

    <!-- Tab 4: Customer Reviews -->
    <div class="monograph-tab-pane hidden" id="mono-pane-reviews">
      <div id="modal-reviews-list-box" style="margin-bottom:12px;">
        <p class="muted">Loading verified customer reviews...</p>
      </div>

      <!-- Add Review Form -->
      <div style="border-top:1px solid var(--border-color); padding-top:10px;">
        <h4 style="margin:0 0 8px; font-size:13px;">Write a Customer Review</h4>
        <form id="modal-submit-review-form" style="display:flex; flex-direction:column; gap:8px;">
          <div style="display:flex; gap:10px; align-items:center;">
            <label style="font-size:12px; font-weight:600; margin:0;">Rating:
              <select id="rev-input-rating" style="padding:3px 6px; border-radius:4px; font-size:12px;">
                <option value="5">★★★★★ (5 Stars)</option>
                <option value="4">★★★★☆ (4 Stars)</option>
                <option value="3">★★★☆☆ (3 Stars)</option>
                <option value="2">★★☆☆☆ (2 Stars)</option>
                <option value="1">★☆☆☆☆ (1 Star)</option>
              </select>
            </label>
            <label style="font-size:12px; font-weight:600; margin:0; flex:1;">Your Name:
              <input type="text" id="rev-input-name" placeholder="Full Name" style="width:100%; padding:3px 8px; font-size:12px; border:1px solid var(--border-color); border-radius:4px;" value="${escapeHtml(STATE.currentUser?.displayName || '')}" required />
            </label>
          </div>
          <textarea id="rev-input-comment" placeholder="Share your experience with this medicine, delivery speed, or product packaging..." rows="2" style="width:100%; padding:6px 8px; font-size:12px; border:1px solid var(--border-color); border-radius:4px;" required></textarea>
          <button type="submit" class="btn btn-secondary btn-xs" style="align-self:flex-start;">Submit Review</button>
        </form>
      </div>
    </div>

    <!-- Tab 5: Related Medicines -->
    <div class="monograph-tab-pane hidden" id="mono-pane-related">
      <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap:10px;">
        ${relatedProds.map(rp => `
          <div class="related-prod-card" data-product-id="${escapeHtml(rp.id)}" style="border:1px solid var(--border-color); border-radius:6px; padding:8px; cursor:pointer; background:var(--bg-card); display:flex; flex-direction:column; gap:4px;">
            <img src="${escapeHtml(getProductImage(rp))}" alt="${escapeHtml(rp.name)}" style="width:100%; height:80px; object-fit:contain; border-radius:4px; background:#f8fafc;" onerror="this.onerror=null;this.src='products/placeholder-medicine.svg';" />
            <strong style="font-size:12px; margin-top:2px;">${escapeHtml(rp.name)}</strong>
            <span style="font-size:11px; color:var(--muted);">${escapeHtml(rp.genericName || rp.category)}</span>
            <div style="font-size:12px; font-weight:700; color:var(--primary); margin-top:auto;">${formatUGX(rp.price)}</div>
          </div>
        `).join("")}
      </div>
    </div>
  `;

  // Bind Monograph Tabs click events
  $("#monograph-tabs-bar")?.addEventListener("click", (e) => {
    const btn = e.target.closest(".monograph-tab-btn");
    if (btn) {
      const tab = btn.dataset.monoTab;
      document.querySelectorAll(".monograph-tab-btn").forEach(b => {
        const isAct = b.dataset.monoTab === tab;
        b.classList.toggle("active", isAct);
        b.style.background = isAct ? "#0f766e" : "var(--bg-page)";
        b.style.color = isAct ? "#ffffff" : "var(--text-main)";
      });
      document.querySelectorAll(".monograph-tab-pane").forEach(pane => pane.classList.add("hidden"));
      document.getElementById(`mono-pane-${tab}`)?.classList.remove("hidden");
    }
  });

  // Bind Related Product clicks
  document.querySelectorAll(".related-prod-card").forEach(card => {
    card.addEventListener("click", () => {
      const id = card.dataset.productId;
      if (id) openProductDetailsModal(id);
    });
  });

  // Bind Review Form submit
  $("#modal-submit-review-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const rating = $("#rev-input-rating")?.value || 5;
    const name = $("#rev-input-name")?.value || "Verified Customer";
    const comment = $("#rev-input-comment")?.value || "";
    if (!comment.trim()) return;
    await submitProductReview(prod.id, rating, comment, name);
    // Reload reviews in pane
    const updated = await loadProductReviews(prod.id);
    const revList = document.getElementById("modal-reviews-list-box");
    if (revList) {
      revList.innerHTML = updated.map(r => `
        <div class="product-review-card" style="padding:10px; border:1px solid var(--border-color); border-radius:6px; margin-bottom:8px; background:var(--bg-page);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <div>
              <strong style="font-size:13px;">${escapeHtml(r.reviewerName || 'Verified Buyer')}</strong>
              <span style="font-size:10.5px; background:#dcfce7; color:#166534; padding:1px 5px; border-radius:3px; margin-left:6px;">✓ Verified Purchase</span>
            </div>
            <div style="color:#eab308; font-size:12px;">${'★'.repeat(r.rating || 5)}${'☆'.repeat(5 - (r.rating || 5))}</div>
          </div>
          <p style="margin:4px 0 2px; font-size:12.5px; color:var(--text-main); line-height:1.4;">${escapeHtml(r.comment || '')}</p>
          <small class="muted" style="font-size:11px;">${escapeHtml(r.date || 'Recent')}</small>
        </div>
      `).join("");
    }
    const form = document.getElementById("modal-submit-review-form");
    if (form) form.reset();
  });
}

export function openStaffQuickLookupModal(prod) {
  if (!prod) return;
  const dialog = document.getElementById("staff-quick-lookup-dialog");
  if (!dialog) {
    openProductDetailsModal(prod.id);
    return;
  }

  const stockBadge = getSearchStockBadge(prod);
  const rxBadge = getSearchRxBadge(prod);
  const img = getProductImage(prod);

  const titleEl = document.getElementById("staff-quick-lookup-title");
  if (titleEl) titleEl.textContent = `Dispensary Lookup: ${prod.name}`;

  const priceVal = document.getElementById("staff-quick-price-val");
  if (priceVal) priceVal.textContent = formatUGX(prod.price);

  const content = document.getElementById("staff-quick-lookup-content");
  if (content) {
    content.innerHTML = `
      <div class="modal-product-hero">
        <div class="modal-product-img-wrap">
          <img src="${escapeHtml(img)}" alt="${escapeHtml(prod.name)}" class="modal-product-large-img" onerror="this.onerror=null;this.src='products/placeholder-medicine.svg';" />
        </div>
        <div class="modal-product-hero-meta">
          <div class="product-badges-row" style="margin-bottom:8px; display:flex; gap:6px; flex-wrap:wrap;">
            <span class="${stockBadge.class}">${stockBadge.label} (${prod.stockQuantity} units)</span>
            <span class="${rxBadge.class}">${rxBadge.label}</span>
            <span class="suggestion-category-tag">${escapeHtml(prod.category)}</span>
          </div>
          <h3 class="modal-prod-title" style="margin:0 0 6px 0; font-size:1.1rem;">${escapeHtml(prod.name)}</h3>
          <p class="modal-prod-generic" style="margin:0 0 4px 0; font-size:12.5px; color:var(--text-muted);">
            <strong>Generic / Molecule:</strong> ${escapeHtml(prod.genericName || "—")}
          </p>
          <div class="modal-prod-pills" style="display:flex; gap:8px; margin:8px 0; flex-wrap:wrap;">
            <span class="spec-pill"><strong>Strength:</strong> ${escapeHtml(prod.strength || "Standard")}</span>
            <span class="spec-pill"><strong>Dosage Form:</strong> ${escapeHtml(prod.dosageForm || "Unit")}</span>
            <span class="spec-pill"><strong>SKU:</strong> <code>${escapeHtml(prod.sku || prod.id)}</code></span>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; font-size:12px; margin-top:8px; background:#f8fafc; padding:10px; border-radius:6px; border:1px solid #e2e8f0;">
            <div><strong>Reorder Level:</strong> ${prod.reorderLevel || 10} units</div>
            <div><strong>Manufacturer:</strong> ${escapeHtml(prod.manufacturer || "NDA Certified")}</div>
            <div><strong>Batch #:</strong> <code>${escapeHtml(prod.batchNumber || "—")}</code></div>
            <div><strong>Expiry Date:</strong> ${escapeHtml(prod.expiryDate || "—")}</div>
          </div>
        </div>
      </div>
    `;
  }

  // Action buttons
  const viewBtn = document.getElementById("staff-quick-view-btn");
  if (viewBtn) {
    viewBtn.onclick = () => {
      dialog.close();
      openProductDetailsModal(prod.id);
    };
  }

  const orderBtn = document.getElementById("staff-quick-order-btn");
  if (orderBtn) {
    orderBtn.disabled = !stockBadge.isAvailable;
    orderBtn.onclick = () => {
      if (!stockBadge.isAvailable) {
        openNotice("Item Unavailable", `${prod.name} is currently out of stock.`);
        return;
      }
      addToCart(prod.id, 1);
      dialog.close();
      openNotice("Added to Order", `1 unit of ${prod.name} added to cart/order.`);
    };
  }

  const dispenseBtn = document.getElementById("staff-quick-dispense-btn");
  if (dispenseBtn) {
    const canDispense = hasPermission(PERMISSIONS.ORDER_PACK) || hasPermission(PERMISSIONS.PRESCRIPTION_CLINICAL_REVIEW);
    dispenseBtn.disabled = !canDispense || !stockBadge.isAvailable;
    dispenseBtn.textContent = !canDispense ? "Dispense (Pharmacist Only)" : !stockBadge.isAvailable ? "Out of Stock" : "Dispense / Pack";
    dispenseBtn.onclick = () => {
      if (!canDispense) {
        openNotice("Permission Required", "Only registered Pharmacists have clinical dispensing authorization.");
        return;
      }
      if (!stockBadge.isAvailable) {
        openNotice("Stock Depleted", `${prod.name} is out of stock and cannot be dispensed.`);
        return;
      }
      prod.stockQuantity = Math.max(0, prod.stockQuantity - 1);
      STATE.inventoryLogs.unshift({
        id: `LOG-${Date.now()}`,
        productId: prod.id,
        productName: prod.name,
        type: "dispense",
        quantity: -1,
        remainingStock: prod.stockQuantity,
        reason: "Quick dispensary lookup dispensing",
        performedBy: STATE.currentUser?.name || "Staff Pharmacist",
        timestamp: new Date().toISOString()
      });
      dialog.close();
      openNotice("Dispensing Recorded", `Successfully dispensed 1 unit of ${prod.name}. Remaining stock: ${prod.stockQuantity}`);
      renderMedicinesView();
    };
  }

  const closeBtn = document.getElementById("close-staff-quick-lookup-btn");
  if (closeBtn) {
    closeBtn.onclick = () => dialog.close();
  }

  dialog.showModal();
}

export function handleProductSelection(prod) {
  if (!prod) return;
  const effRole = getEffectiveRole();
  const isStaff = effRole === "pharmacist" || effRole === "assistant_pharmacist";

  if (isStaff) {
    openStaffQuickLookupModal(prod);
  } else {
    openProductDetailsModal(prod.id);
  }
}

export function setupAutocompleteSearch({ inputId, dropdownId, onSelect, getContextCategory }) {
  const input = document.getElementById(inputId);
  const dropdown = document.getElementById(dropdownId);
  if (!input || !dropdown) return;

  let activeIndex = -1;
  let currentResults = [];

  function closeDropdown() {
    dropdown.classList.add("hidden");
    dropdown.innerHTML = "";
    activeIndex = -1;
    currentResults = [];
  }

  function renderSuggestions(query) {
    const q = (query || "").trim();
    if (!q) {
      closeDropdown();
      return;
    }

    const cat = typeof getContextCategory === "function" ? getContextCategory() : STATE.selectedCategory;
    const allMatches = searchMedicinesCatalog(STATE.products, q, { category: cat });
    const topMatches = allMatches.slice(0, 10);
    currentResults = topMatches;
    activeIndex = -1;

    // Toggle top search clear button if applicable
    if (inputId === "top-search-input") {
      const clearBtn = document.getElementById("top-search-clear");
      if (clearBtn) clearBtn.classList.toggle("hidden", !q);
    }

    if (allMatches.length === 0) {
      let didYouMean = null;
      if (q.length >= 3) {
        for (const item of (STATE.products || [])) {
          const itemWords = (item.name || "").toLowerCase().split(/[\s,()/-]+/);
          for (const w of itemWords) {
            if (w.length >= 4 && Math.abs(w.length - q.length) <= 2) {
              if (levenshteinDistance(q, w) <= 2) {
                didYouMean = item.name;
                break;
              }
            }
          }
          if (didYouMean) break;
        }
      }

      dropdown.innerHTML = `
        <div class="search-empty-state">
          <div class="search-empty-icon">🔍</div>
          <p class="search-empty-title">No medicine found.</p>
          <p class="search-empty-desc">Try searching by medicine name, generic name or active ingredient.</p>
          ${didYouMean ? `<p style="margin-top:8px; font-size:12.5px; color:var(--text-main);">Did you mean: <button type="button" class="btn-did-you-mean" data-suggest="${escapeHtml(didYouMean)}" style="background:none; border:none; color:var(--primary, #0f766e); font-weight:700; text-decoration:underline; cursor:pointer; padding:0;">${escapeHtml(didYouMean)}</button>?</p>` : ""}
        </div>
      `;
      dropdown.classList.remove("hidden");
      dropdown.querySelector(".btn-did-you-mean")?.addEventListener("click", (e) => {
        const sugg = e.target.dataset.suggest;
        if (sugg) {
          input.value = sugg;
          input.dispatchEvent(new Event("input", { bubbles: true }));
        }
      });
      return;
    }

    const itemsHtml = topMatches.map((p, idx) => {
      const stockBadge = getSearchStockBadge(p);
      const rxBadge = getSearchRxBadge(p);
      const img = getProductImage(p);
      const strengthText = p.strength ? p.strength : "";
      const dosageText = p.dosageForm ? p.dosageForm : "";
      const metaParts = [p.genericName, strengthText, dosageText].filter(Boolean).join(" • ");

      return `
        <div class="search-suggestion-item" role="option" data-index="${idx}" data-id="${escapeHtml(p.id)}" aria-selected="false">
          <div class="suggestion-thumb-wrap">
            <img src="${escapeHtml(img)}" alt="${escapeHtml(p.name)}" class="suggestion-thumb-img" onerror="this.onerror=null;this.src='products/placeholder-medicine.svg';" />
          </div>
          <div class="suggestion-info">
            <div class="suggestion-title-row">
              <span class="suggestion-title">${highlightSearchMatch(p.name, q)}</span>
              <strong class="suggestion-price">${formatUGX(p.price)}</strong>
            </div>
            <div class="suggestion-meta">${escapeHtml(metaParts)}</div>
            <div class="suggestion-badges-row">
              <span class="${stockBadge.class}">${stockBadge.label}</span>
              <span class="${rxBadge.class}">${rxBadge.label}</span>
              <span class="suggestion-category-tag">${escapeHtml(p.category)}</span>
            </div>
          </div>
        </div>
      `;
    }).join("");

    let viewAllHtml = "";
    if (allMatches.length > 10) {
      viewAllHtml = `
        <button type="button" class="suggestions-view-all-btn" id="${dropdownId}-view-all">
          View all ${allMatches.length} results &rarr;
        </button>
      `;
    }

    dropdown.innerHTML = itemsHtml + viewAllHtml;
    dropdown.classList.remove("hidden");

    // Wire view all button
    const viewAllBtn = document.getElementById(`${dropdownId}-view-all`);
    if (viewAllBtn) {
      viewAllBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        closeDropdown();
        STATE.searchQuery = q;
        STATE.marketplacePage = 1;
        if (STATE.currentRoute !== "medicines") navigateTo("medicines");
        else renderMedicinesView();
      });
    }
  }

  // Input event: Instant search with 0ms delay
  input.addEventListener("input", (e) => {
    renderSuggestions(e.target.value);
  });

  input.addEventListener("focus", () => {
    if (input.value.trim()) {
      renderSuggestions(input.value);
    }
  });

  // Keyboard navigation
  input.addEventListener("keydown", (e) => {
    if (dropdown.classList.contains("hidden") || currentResults.length === 0) {
      if (e.key === "ArrowDown" && input.value.trim()) {
        renderSuggestions(input.value);
        e.preventDefault();
      }
      return;
    }

    const items = dropdown.querySelectorAll(".search-suggestion-item");
    if (e.key === "ArrowDown") {
      e.preventDefault();
      activeIndex++;
      if (activeIndex >= items.length) activeIndex = 0;
      updateActiveItem(items);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      activeIndex--;
      if (activeIndex < 0) activeIndex = items.length - 1;
      updateActiveItem(items);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < currentResults.length) {
        selectProduct(currentResults[activeIndex]);
      } else if (currentResults.length > 0) {
        selectProduct(currentResults[0]);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      closeDropdown();
    }
  });

  function updateActiveItem(items) {
    items.forEach((item, idx) => {
      const isSelected = idx === activeIndex;
      item.classList.toggle("is-selected", isSelected);
      item.setAttribute("aria-selected", isSelected ? "true" : "false");
      if (isSelected) {
        item.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    });
  }

  function selectProduct(prod) {
    closeDropdown();
    if (typeof onSelect === "function") {
      onSelect(prod);
    } else {
      handleProductSelection(prod);
    }
  }

  // Click delegation inside dropdown
  dropdown.addEventListener("click", (e) => {
    const item = e.target.closest(".search-suggestion-item");
    if (item && item.dataset.id) {
      const prod = STATE.products.find(p => p.id === item.dataset.id);
      if (prod) {
        selectProduct(prod);
      }
    }
  });

  // Close dropdown on outside click
  document.addEventListener("click", (e) => {
    if (!input.contains(e.target) && !dropdown.contains(e.target)) {
      closeDropdown();
    }
  });
}


// -------------------------------------------------------------
// MODULE 3: CATEGORIES MODULE
// -------------------------------------------------------------
function renderCategoriesView() {
  const effRole = getEffectiveRole();
  const isStaff = effRole === "admin" || effRole === "developer";
  $("#categories-staff-actions")?.classList.toggle("hidden", !isStaff);
  $("#admin-categories-table-card")?.classList.toggle("hidden", !isStaff);

  const grid = $("#full-categories-grid");
  if (grid) {
    grid.innerHTML = STATE.categories.map(cat => {
      const count = STATE.products.filter(p => p.category === cat.name).length;
      return `
        <div class="category-card" data-category="${escapeHtml(cat.name)}">
          <div class="category-icon-box">
            <img src="${escapeHtml(getCategoryImageUrl(cat))}" alt="${escapeHtml(cat.name)}" class="cat-card-img" style="width:40px; height:40px; object-fit:contain;" />
          </div>
          <h3 class="category-name">${escapeHtml(cat.name)}</h3>
          <p class="category-desc">${escapeHtml(cat.desc)}</p>
          <small class="muted" style="display:block; margin-bottom:10px;">${count} products available</small>
          <button class="btn btn-secondary btn-sm" type="button" data-category="${escapeHtml(cat.name)}">View Medicines &rarr;</button>
        </div>
      `;
    }).join("");
  }

  if (isStaff) {
    const tableBox = $("#admin-categories-table-box");
    if (tableBox) {
      tableBox.innerHTML = `
        <table class="standard-table">
          <thead><tr><th>Icon</th><th>Category Name</th><th>Description</th><th>Products</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            ${STATE.categories.map(c => {
              const isAct = c.status !== "inactive";
              return `
                <tr>
                  <td style="width:48px; text-align:center;">
                    <img src="${escapeHtml(getCategoryImageUrl(c))}" alt="${escapeHtml(c.name)}" style="width:34px; height:34px; object-fit:contain; border-radius:8px; background:#f8fafc; border:1px solid #e2e8f0; padding:2px;" />
                  </td>
                  <td><strong>${escapeHtml(c.name)}</strong></td>
                  <td>${escapeHtml(c.desc || "")}</td>
                  <td>${STATE.products.filter(p => p.category === c.name).length}</td>
                  <td><span class="status-pill status-${isAct ? "active" : "inactive"}">${isAct ? "Active" : "Inactive"}</span></td>
                  <td>
                    <div style="display:flex; gap:6px;">
                      <button type="button" class="btn btn-secondary btn-sm edit-cat-btn" data-id="${c.id}">Edit</button>
                      <button type="button" class="btn btn-outline btn-sm toggle-cat-status-btn" data-id="${c.id}" data-status="${isAct ? "inactive" : "active"}">
                        ${isAct ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      `;

      tableBox.querySelectorAll(".edit-cat-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          const id = btn.dataset.id;
          const cat = STATE.categories.find(c => c.id === id);
          if (!cat) return;
          if ($("#cat-id")) $("#cat-id").value = cat.id || "";
          if ($("#category-modal-title")) $("#category-modal-title").textContent = "Edit Pharmacy Category";
          if ($("#cat-name")) $("#cat-name").value = cat.name || "";
          if ($("#cat-icon")) $("#cat-icon").value = cat.iconKey || cat.id || "categories";
          if ($("#cat-desc")) $("#cat-desc").value = cat.desc || "";
          if ($("#cat-status")) $("#cat-status").value = cat.status || "active";
          const imgUrl = cat.imageUrl || getCategoryImageUrl(cat);
          if ($("#cat-image-url")) $("#cat-image-url").value = imgUrl;
          if ($("#cat-image-preview")) $("#cat-image-preview").src = imgUrl;
          $("#category-form-dialog")?.showModal();
        });
      });

      tableBox.querySelectorAll(".toggle-cat-status-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          const id = btn.dataset.id;
          const newStatus = btn.dataset.status;
          const cat = STATE.categories.find(c => c.id === id);
          if (!cat) return;
          cat.status = newStatus;
          try { saveCategory(cat); } catch (_) {}
          renderCategoriesView();
          renderCustomerDashboardView();
          openNotice("Category Updated", `Category <strong>${escapeHtml(cat.name)}</strong> is now <strong>${newStatus}</strong>.`);
        });
      });
    }
  }
}

// -------------------------------------------------------------
// MODULE 4: ORDERS MODULE & ORDER TRACKING
// -------------------------------------------------------------
// Helper to retrieve the single assigned Delivery Man for an order
export function getAssignedDeliveryManForOrder(order) {
  if (!order) return null;
  if (order.fulfillmentType === "pickup") return null;
  if (order.deliveryManName && order.deliveryManName !== "Pending Assignment" && order.deliveryManName !== "Unassigned") {
    return order.deliveryManName;
  }
  const orderRef = order.orderNumber || order.id;
  const del = (STATE.deliveries || []).find(d => String(d.orderId) === String(orderRef) || String(d.orderNumber) === String(orderRef) || String(d.id) === String(orderRef));
  if (del && del.deliveryStaffName && del.deliveryStaffName !== "Unassigned" && del.deliveryStaffName !== "Pending Assignment") {
    return del.deliveryStaffName;
  }
  const conv = (STATE.conversations || []).find(c => c.orderId === orderRef || c.orderNumber === orderRef || c.id === `CHAT-${orderRef}`);
  if (conv && conv.deliveryManName && conv.deliveryManName !== "Unassigned" && conv.deliveryManName !== "Pending Assignment") {
    return conv.deliveryManName;
  }
  if (order.assignedStaff && order.assignedStaff !== "Pending Assignment" && order.assignedStaff !== "Online System" && order.assignedStaff !== "Unassigned") {
    return order.assignedStaff;
  }
  return null;
}

function renderOrdersView() {
  const box = $("#orders-table-box");
  if (!box) return;

  const effRole = getEffectiveRole();
  const isStaff = effRole !== "customer" && effRole !== "visitor";
  const titleEl = $("#orders-page-title");
  const descEl = $("#orders-page-desc");
  if (titleEl) titleEl.textContent = isStaff ? "Orders" : "My Orders";
  if (descEl) descEl.textContent = isStaff ? "Track customer orders, manage processing and view invoices." : "Track and manage your pharmacy orders.";

  let list = STATE.orders;
  if (!isStaff) {
    if (!STATE.currentUser) {
      list = [];
    } else {
      list = list.filter(o => o.customerId === STATE.currentUser.uid || (STATE.currentUser.email && o.customerEmail === STATE.currentUser.email));
    }
  }
  if (STATE.orderFilter && STATE.orderFilter !== "all") {
    list = list.filter(o => o.orderStatus === STATE.orderFilter);
  }
  if (STATE.orderDivisionFilter && STATE.orderDivisionFilter !== "all") {
    list = list.filter(o => {
      const div = o.deliveryDivision || o.deliveryAddressDetails?.deliveryDivision || o.deliveryAddressDetails?.division;
      if (div) return div.toLowerCase() === STATE.orderDivisionFilter.toLowerCase();
      return (o.deliveryAddress || "").toLowerCase().includes(STATE.orderDivisionFilter.toLowerCase());
    });
  }
  if (STATE.orderAreaFilter && STATE.orderAreaFilter !== "all") {
    list = list.filter(o => {
      const area = o.deliveryArea || o.deliveryAddressDetails?.deliveryArea || o.deliveryAddressDetails?.area;
      if (area) return area.toLowerCase() === STATE.orderAreaFilter.toLowerCase();
    });
  }
  if (STATE.orderChannelFilter && STATE.orderChannelFilter !== "all") {
    if (STATE.orderChannelFilter === "walk_in") {
      list = list.filter(o => isWalkinOrder(o));
    } else if (STATE.orderChannelFilter === "online") {
      list = list.filter(o => !isWalkinOrder(o));
    }
  }

  const channelSelect = $("#orders-filter-channel");
  if (channelSelect && STATE.orderChannelFilter) {
    channelSelect.value = STATE.orderChannelFilter;
  }

  if (list.length === 0) {
    box.innerHTML = `
      <div class="empty-state-box">
        <p class="empty-title">No matching orders found.</p>
        <p class="empty-desc">There are no orders matching your status and Mbarara City location filters.</p>
        <button class="btn btn-primary btn-sm" type="button" data-route="medicines">Browse Medicines</button>
      </div>
    `;
    return;
  }

  if (!isStaff) {
    box.innerHTML = `
      <table class="standard-table">
        <thead>
          <tr>
            <th>Order Reference</th>
            <th>Order Date</th>
            <th>Items</th>
            <th>Total</th>
            <th>Payment Status</th>
            <th>Order Status</th>
            <th>Delivery</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${list.map(o => {
            const driverName = getAssignedDeliveryManForOrder(o);
            const isPickup = o.fulfillmentType === "pickup";
            const deliveryBadge = isPickup
              ? `<small class="muted">Pharmacy Pickup</small>`
              : (driverName
                  ? `<span class="driver-assigned-pill" style="display:inline-flex; align-items:center; gap:4px; font-weight:600; color:#0f766e; background:#f0fdf4; padding:3px 8px; border-radius:12px; font-size:12px;">🚚 Driver Assigned (${escapeHtml(driverName)})</span>`
                  : `<span class="muted" style="font-size:12px;">🛵 Driver: Awaiting Assignment</span>`);
            return `
            <tr>
              <td><strong>${escapeHtml(o.orderNumber || o.id)}</strong></td>
              <td>${new Date(o.createdAt).toLocaleDateString()}</td>
              <td>${o.items.map(i => `${i.quantity}x ${escapeHtml(i.name)}`).join(", ")}</td>
              <td><strong>${formatUGX(o.total)}</strong></td>
              <td><span class="status-pill status-${(o.paymentStatus || "Paid").toLowerCase().replace(/ /g, "_")}">${escapeHtml(o.paymentStatus || "Paid")}</span></td>
              <td><span class="status-pill status-${o.orderStatus.toLowerCase().replace(/ /g, "_")}">${escapeHtml(o.orderStatus)}</span></td>
              <td>
                ${deliveryBadge}
                ${(!isPickup && o.deliveryDivision) ? `<br><small class="muted">${escapeHtml(o.deliveryDivision)} • ${escapeHtml(o.deliveryArea || "")}</small>` : ""}
              </td>
              <td>
                <button class="btn btn-primary btn-sm track-order-btn" data-id="${o.id}">Track Order</button>
                <button class="btn btn-secondary btn-sm view-rec-btn" data-id="${o.id}">View Order</button>
                ${(!isPickup) ? `
                  <button class="btn btn-outline btn-sm open-order-chat-btn" data-order-id="${o.orderNumber || o.id}" title="Chat with Delivery Person">💬 Chat with Delivery Person</button>
                ` : ''}
              </td>
            </tr>
          `;}).join("")}
        </tbody>
      </table>
    `;
  } else {
    box.innerHTML = `
      <table class="standard-table">
        <thead>
          <tr>
            <th>Order Reference</th>
            <th>Date &amp; Time</th>
            <th>Customer</th>
            <th>Channel / Source</th>
            <th>Assigned Delivery Man</th>
            <th>Items Summary</th>
            <th>Total</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${list.map(o => {
            const isWalkin = isWalkinOrder(o);
            const driverName = getAssignedDeliveryManForOrder(o);
            const isPickup = o.fulfillmentType === "pickup";
            const deliveryStaffText = isWalkin
              ? `<span class="muted" style="font-size:12px;">Counter Sale</span>`
              : (isPickup
                  ? `<span class="muted" style="font-size:12px;">Pharmacy Pickup</span>`
                  : (driverName
                      ? `<span style="display:inline-flex; align-items:center; gap:4px; font-weight:600; color:#0f766e; background:#f0fdf4; padding:3px 8px; border-radius:12px; font-size:12px;">🚚 ${escapeHtml(driverName)}</span>`
                      : `<span class="muted" style="font-size:11.5px;">Pending Assignment</span>`));
            return `
            <tr>
              <td><strong>${escapeHtml(o.orderNumber || o.id)}</strong></td>
              <td>
                <div>${new Date(o.createdAt).toLocaleDateString()}</div>
                <small class="muted">${new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
              </td>
              <td>
                ${escapeHtml(o.customerName || (isWalkin ? 'Walk-in Customer' : 'Customer'))}<br><small class="muted">${escapeHtml(o.customerPhone || "")}</small>
                ${o.deliveryDivision ? `<div style="margin-top:4px; display:flex; gap:4px; flex-wrap:wrap;"><span class="delivery-division-tag">${escapeHtml(o.deliveryDivision)}</span>${o.deliveryArea ? `<span class="delivery-area-tag">${escapeHtml(o.deliveryArea)}</span>` : ""}</div>` : ""}
              </td>
              <td>
                <span class="source-pill ${isWalkin ? 'source-walkin' : 'source-online'}">${isWalkin ? 'WALK-IN' : 'ONLINE'}</span>
                <div style="font-size:11px; margin-top:2px;" class="muted">${escapeHtml(o.paymentMethod || "Cash")}</div>
              </td>
              <td>
                ${deliveryStaffText}
              </td>
              <td>${(o.items || []).map(i => `${i.quantity}x ${escapeHtml(i.name)}`).join(", ")}</td>
              <td><strong>${formatUGX(o.total)}</strong></td>
              <td><span class="status-pill status-${(o.orderStatus || 'Confirmed').toLowerCase().replace(/ /g, "_")}">${escapeHtml(o.orderStatus || 'Confirmed')}</span></td>
              <td>
                <button class="btn btn-primary btn-sm track-order-btn" data-id="${o.id}">Track</button>
                <button class="btn btn-secondary btn-sm view-rec-btn" data-id="${o.id}">Receipt</button>
                <button class="btn btn-outline btn-sm manage-order-btn" data-id="${o.id}">Manage</button>
              </td>
            </tr>
          `;}).join("")}
        </tbody>
      </table>
    `;
  }
}

// 6-Stage Visual Order Tracking Timeline
export function openOrderTrackingModal(orderId) {
  const cleanId = String(orderId || "").trim();
  const order = STATE.orders.find(o => o.id === cleanId || o.orderNumber === cleanId);
  if (!order) return;

  const dialog = $("#order-tracking-dialog");
  if (dialog) dialog.dataset.orderId = order.orderNumber || order.id;

  // Level 2 Security: Verify customer ownership
  if (getEffectiveRole() === "customer" && STATE.currentUser) {
    const isOwner = order.customerId === STATE.currentUser.uid || (STATE.currentUser.email && order.customerEmail === STATE.currentUser.email);
    if (!isOwner) {
      openNotice("Access Denied", "You do not have permission to track an order belonging to another customer.");
      return;
    }
  }

  const isPickup = order.fulfillmentType === "pickup";
  const stages = [
    { key: "Placed", label: "Order Placed" },
    { key: "Payment", label: isPickup ? "Payment Confirmed" : "Payment Confirmed" },
    { key: "Preparing", label: "Order Being Prepared" },
    { key: "Assigned", label: isPickup ? "Ready for Pickup" : "Delivery Assigned" },
    { key: "Out", label: isPickup ? "At Dispensary" : "Out for Delivery" },
    { key: "Delivered", label: isPickup ? "Collected" : "Delivered" }
  ];

  const isPaid = (order.paymentStatus || "").toUpperCase() === "PAID" || (order.paymentStatus || "").toUpperCase() === "SUCCESSFUL";
  const stLower = (order.deliveryStatus || order.orderStatus || "").toLowerCase();
  const isDelivered = stLower.includes("delivered") || stLower.includes("completed");
  const isOut = stLower.includes("out") || stLower.includes("transit");
  const isAssigned = Boolean((order.deliveryManId && order.deliveryManName && order.deliveryManName !== "Unassigned" && order.deliveryManName !== "Pending Assignment") || stLower.includes("assigned"));
  const isPreparing = stLower.includes("processing") || stLower.includes("prepar") || stLower.includes("ready");

  let currentRank = 0;
  if (isDelivered) currentRank = 5;
  else if (isOut) currentRank = 4;
  else if (isAssigned) currentRank = 3;
  else if (isPreparing) currentRank = 2;
  else if (isPaid) currentRank = 1;
  else currentRank = 0;

  const driverName = order.deliveryManName || order.assignedStaff || "Unassigned";
  const hasAssignedDriver = !isPickup && driverName && driverName !== "Unassigned" && driverName !== "Pending Assignment" && driverName !== "Waiting for Available Delivery Man";
  const driverPhone = order.deliveryManPhone || "0700000005";
  const cleanPhone = driverPhone.replace(/\D/g, "");
  const waPhone = cleanPhone.startsWith("0") ? "256" + cleanPhone.slice(1) : cleanPhone;
  const waText = encodeURIComponent(`Hello, I am tracking my BloomCare Pharmacy order ${order.orderNumber || order.id}.`);

  $("#tracking-modal-content").innerHTML = `
    <div style="background:var(--bg-page); padding:12px; border-radius:var(--radius-sm); margin-bottom:14px;">
      <div class="flex-between">
        <strong>Order Reference: ${escapeHtml(order.orderNumber || order.id)}</strong>
        <div style="display:flex; gap:6px; align-items:center;">
          <span class="status-pill status-${(order.paymentStatus || 'pending').toLowerCase().replace(/ /g, '_')}">${isPaid ? 'PAID ✓' : 'Payment Pending'}</span>
          <span class="status-pill status-${(order.deliveryStatus || order.orderStatus || 'confirmed').toLowerCase().replace(/ /g, '_')}">${escapeHtml(order.deliveryStatus || order.orderStatus)}</span>
        </div>
      </div>
      <div style="font-size:12.5px; margin-top:6px; color:var(--muted);">
        ${isPickup ? "Fulfillment: Pharmacy Pickup (Near Mbarara Regional Referral Hospital, Opp. Rubis Station)" : `Fulfillment: Doorstep Delivery to ${escapeHtml(order.deliveryAddress)}`}
      </div>
      ${!isPickup && (order.deliveryDivision || order.deliveryArea) ? `
        <div style="margin-top:6px; display:flex; gap:6px; flex-wrap:wrap; align-items:center;">
          <span style="font-size:11px; font-weight:700; color:var(--text-main);">Delivery Zone:</span>
          ${order.deliveryDivision ? `<span class="delivery-division-tag">🏛 ${escapeHtml(order.deliveryDivision)}</span>` : ""}
          ${order.deliveryArea ? `<span class="delivery-area-tag">📍 ${escapeHtml(order.deliveryArea)}</span>` : ""}
        </div>
      ` : ""}
    </div>

    <!-- 6-Stage Timeline -->
    <div class="tracking-timeline">
      ${stages.map((st, idx) => {
        let stepClass = "";
        let stepContent = idx + 1;
        if (idx < currentRank) {
          stepClass = "step-completed";
          stepContent = "&#10003;";
        } else if (idx === currentRank) {
          stepClass = "step-active";
        }
        return `
          <div class="timeline-step ${stepClass}">
            <div class="step-circle">${stepContent}</div>
            <span class="step-label">${st.label}</span>
          </div>
        `;
      }).join("")}
    </div>

    ${!isPickup ? `
      <div class="content-card" style="margin-top:14px; padding:14px; border-left:4px solid var(--primary, #00796b);">
        <div class="flex-between" style="flex-wrap:wrap; gap:10px;">
          <div>
            <span class="muted" style="font-size:11.5px; text-transform:uppercase; letter-spacing:0.5px; font-weight:700;">Delivery Courier</span>
            <div style="font-size:14px; font-weight:600; margin-top:3px;">
              Courier: <strong>${escapeHtml(hasAssignedDriver ? driverName : "Assigning Nearest Courier...")}</strong>
            </div>
            ${hasAssignedDriver ? `<div style="font-size:12.5px; color:#64748b; margin-top:2px;">📞 ${escapeHtml(driverPhone)}</div>` : ""}
            <div style="font-size:12px; margin-top:2px;">
              Delivery Status: <span class="status-pill status-${(order.deliveryStatus || order.orderStatus || 'pending').toLowerCase().replace(/ /g, '_')}">${escapeHtml(order.deliveryStatus || order.orderStatus)}</span>
            </div>
          </div>
          <div style="display:flex; gap:6px; flex-wrap:wrap; align-items:center;">
            <button class="btn btn-primary btn-sm open-order-chat-btn" data-order-id="${order.orderNumber || order.id}" type="button" style="display:inline-flex; align-items:center; gap:5px;">
              ${ICONS.chat}
              <span>💬 Chat with Delivery Person</span>
            </button>
            ${hasAssignedDriver ? `
              <a class="btn btn-whatsapp btn-sm" href="https://wa.me/${waPhone}?text=${waText}" target="_blank" rel="noopener noreferrer" style="display:inline-flex; align-items:center; gap:5px; background:#25D366; color:#ffffff; font-weight:600; text-decoration:none; padding:6px 12px; border-radius:var(--radius-xs); border:none; font-size:12px;">
                <span>💬 WhatsApp</span>
              </a>
              <a class="btn btn-call btn-sm" href="tel:${driverPhone}" style="display:inline-flex; align-items:center; gap:5px; background:#0284c7; color:#ffffff; font-weight:600; text-decoration:none; padding:6px 12px; border-radius:var(--radius-xs); border:none; font-size:12px;">
                <span>📞 Call</span>
              </a>
            ` : `<span class="muted" style="font-size:12px; align-self:center;">Matching available courier partner...</span>`}
          </div>
        </div>
      </div>
    ` : ''}

    <div class="content-card" style="margin-top:14px; padding:12px;">
      <h4>Order Items</h4>
      <ul style="list-style:none; padding-left:0; font-size:13px; margin-top:6px;">
        ${order.items.map(i => `<li style="display:flex; justify-content:space-between; margin-bottom:4px;"><span>${i.quantity}x ${escapeHtml(i.name)}</span><strong>${formatUGX(i.price * i.quantity)}</strong></li>`).join("")}
      </ul>
      <div class="flex-between" style="border-top:1px solid var(--line); padding-top:8px; margin-top:8px;">
        <strong>Total Payable:</strong>
        <strong style="color:var(--primary-dark); font-size:16px;">${formatUGX(order.total)}</strong>
      </div>
    </div>
  `;

  $("#order-tracking-dialog").showModal();

  $("#tracking-modal-content")?.querySelectorAll(".open-order-chat-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      $("#order-tracking-dialog")?.close();
      openCustomerChatModal(btn.dataset.orderId);
    });
  });
}

export function updateOrderTrackingModalIfOpen(orderId) {
  const dialog = $("#order-tracking-dialog");
  if (!dialog || !dialog.open) return;
  const cur = String(dialog.dataset.orderId || "").trim();
  const target = String(orderId || "").trim();
  if (cur === target || (cur && target && (cur.includes(target) || target.includes(cur)))) {
    openOrderTrackingModal(cur);
  }
}

// -------------------------------------------------------------
// MODULE 7: PRESCRIPTION VERIFICATION
// -------------------------------------------------------------
function renderPrescriptionsView() {
  const box = $("#rx-queue-table-box");
  if (!box) return;

  const effRole = getEffectiveRole();
  const isStaff = effRole === "pharmacist" || effRole === "admin" || effRole === "developer";
  const titleEl = $("#prescriptions-page-title");
  const descEl = $("#prescriptions-page-desc");
  if (titleEl) titleEl.textContent = isStaff ? "Prescription Review Queue" : "My Prescriptions";
  if (descEl) descEl.textContent = isStaff ? "Verify and approve customer prescriptions before medication dispensing." : "Upload and manage prescriptions for pharmacist review.";

  // Hide customer upload card for staff/pharmacists and expand queue table
  const uploadCard = $("#rx-upload-card");
  const rxGrid = $("#prescriptions-grid");
  const queueCard = $("#rx-queue-card");
  if (uploadCard) uploadCard.style.display = isStaff ? "none" : "block";
  if (rxGrid) rxGrid.style.gridTemplateColumns = isStaff ? "1fr" : "";
  if (queueCard) queueCard.style.gridColumn = isStaff ? "1 / -1" : "";

  const nameInp = $("#rx-patient-name");
  const phoneInp = $("#rx-patient-phone");
  if (nameInp && !nameInp.value && STATE.currentUser) nameInp.value = STATE.currentUser.displayName || "";
  if (phoneInp && !phoneInp.value && STATE.currentUser) phoneInp.value = STATE.currentUser.phone || "";

  let list = STATE.prescriptions;
  if (!isStaff) {
    if (!STATE.currentUser) {
      list = [];
    } else {
      list = list.filter(rx => rx.customerId === STATE.currentUser.uid || (STATE.currentUser.email && rx.customerEmail === STATE.currentUser.email));
    }
  }

  if (list.length === 0) {
    box.innerHTML = isStaff ? `
      <div class="empty-state-box">
        <p class="empty-title">No prescriptions awaiting review.</p>
        <p class="empty-desc">All customer prescription submissions have been clinically verified or no submissions exist in the queue.</p>
      </div>
    ` : `
      <div class="empty-state-box">
        <p class="empty-title">No prescriptions uploaded yet.</p>
        <p class="empty-desc">Submit a doctor's prescription for clinical verification and dispensing by our licensed pharmacists.</p>
        <button class="btn btn-primary btn-sm" type="button" onclick="document.getElementById('rx-upload-form')?.scrollIntoView({behavior:'smooth'})">Upload Prescription</button>
      </div>
    `;
    return;
  }

  if (!isStaff) {
    box.innerHTML = `
      <table class="standard-table">
        <thead>
          <tr>
            <th>Prescription ID</th>
            <th>Upload Date</th>
            <th>Status</th>
            <th>Document File</th>
            <th>Pharmacist Note</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${list.map(rx => `
            <tr>
              <td><strong>${escapeHtml(rx.prescriptionNumber || rx.id)}</strong></td>
              <td>${new Date(rx.createdAt).toLocaleDateString()}</td>
              <td><span class="status-pill status-${rx.status.toLowerCase().replace(/ /g, "_")}">${escapeHtml(rx.status)}</span></td>
              <td>
                <div><strong>${escapeHtml(rx.fileName || rx.fileUrl || "Prescription Scan")}</strong></div>
                ${rx.fileSize ? `<small class="muted">${escapeHtml(rx.fileSize)}</small>` : ""}
              </td>
              <td><em>"${escapeHtml(rx.reviewNotes || "Awaiting clinical review")}"</em></td>
              <td>
                <button class="btn btn-secondary btn-sm view-rx-file-btn" data-id="${rx.id}">View File</button>
                ${(rx.status === "Pending" || rx.status === "Pending Review") ? `
                  <button class="btn btn-outline btn-sm cancel-rx-btn" data-id="${rx.id}" style="margin-left:4px;">Cancel</button>
                ` : ""}
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
  } else {
    box.innerHTML = `
      <table class="standard-table">
        <thead><tr><th>Prescription #</th><th>Date</th><th>Patient</th><th>Attached File</th><th>Doctor / Clinical Notes</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          ${list.map(rx => `
            <tr>
              <td><strong>${escapeHtml(rx.prescriptionNumber || rx.id)}</strong></td>
              <td>${new Date(rx.createdAt).toLocaleDateString()}</td>
              <td>
                <strong>${escapeHtml(rx.customerName)}</strong>
                ${rx.customerPhone ? `<div class="muted" style="font-size:11px;">${escapeHtml(rx.customerPhone)}</div>` : ""}
              </td>
              <td>
                <span>📄 ${escapeHtml(rx.fileName || rx.fileUrl || "Prescription Document")}</span>
                ${rx.fileSize ? `<small class="muted" style="display:block;">${escapeHtml(rx.fileSize)}</small>` : ""}
              </td>
              <td><em>"${escapeHtml(rx.notes || "None")}"</em></td>
              <td><span class="status-pill status-${rx.status.toLowerCase().replace(/ /g, "_")}">${escapeHtml(rx.status)}</span></td>
              <td>
                <button class="btn btn-secondary btn-sm view-rx-file-btn" data-id="${rx.id}">View Doc</button>
                <button class="btn btn-primary btn-sm open-rx-review-btn" data-id="${rx.id}" style="margin-left:4px;">Review Rx</button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
  }
}

export function formatBytes(bytes) {
  if (!bytes || bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export function handleRxFileSelection(file) {
  if (!file) return;

  const isImage = file.type.startsWith("image/") || /\.(jpe?g|png|webp|gif|bmp)$/i.test(file.name);
  const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);

  if (!isImage && !isPdf) {
    openNotice("Unsupported File Format", "Please choose a doctor's prescription image (JPG, PNG, WEBP) or PDF scan from your PC.");
    return;
  }

  // Max 10MB
  if (file.size > 10 * 1024 * 1024) {
    openNotice("File Too Large", "Prescription files must be under 10MB. Please choose a smaller file from your PC.");
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    STATE.pendingRxFile = {
      name: file.name,
      size: formatBytes(file.size),
      type: file.type || (isPdf ? "application/pdf" : "image/jpeg"),
      dataUrl: e.target.result,
      isPdf,
      isImage
    };

    const previewBox = $("#rx-dropzone-preview");
    const emptyBox = $("#rx-dropzone-empty");
    const thumbBox = $("#rx-preview-thumb");
    const nameEl = $("#rx-preview-filename");
    const sizeEl = $("#rx-preview-filesize");

    if (nameEl) nameEl.textContent = file.name;
    if (sizeEl) sizeEl.textContent = formatBytes(file.size);

    if (thumbBox) {
      if (isImage) {
        thumbBox.innerHTML = `<img src="${e.target.result}" alt="Prescription Thumbnail" class="rx-preview-thumb-img" />`;
      } else {
        thumbBox.innerHTML = `<span class="rx-preview-pdf-icon">PDF</span>`;
      }
    }

    if (emptyBox) emptyBox.classList.add("hidden");
    if (previewBox) previewBox.classList.remove("hidden");
  };
  reader.readAsDataURL(file);
}

export function clearRxFileSelection() {
  STATE.pendingRxFile = null;
  const fileInput = $("#rx-file-input");
  if (fileInput) fileInput.value = "";
  const previewBox = $("#rx-dropzone-preview");
  const emptyBox = $("#rx-dropzone-empty");
  if (previewBox) previewBox.classList.add("hidden");
  if (emptyBox) emptyBox.classList.remove("hidden");
}

export function openRxDocumentModal(rxId) {
  const rx = STATE.prescriptions.find(p => p.id === rxId);
  if (!rx) return;

  const titleEl = $("#rx-view-modal-title");
  const bodyEl = $("#rx-view-modal-content");
  const downloadLink = $("#rx-modal-download-link");

  if (titleEl) {
    titleEl.textContent = `Prescription ${rx.prescriptionNumber || rx.id}`;
  }

  const isImage = rx.fileType?.startsWith("image/") || (rx.fileData && rx.fileData.startsWith("data:image/")) || (rx.fileName && /\.(jpe?g|png|webp|gif)$/i.test(rx.fileName));
  const isPdf = rx.fileType === "application/pdf" || (rx.fileName && /\.pdf$/i.test(rx.fileName)) || (rx.fileData && rx.fileData.startsWith("data:application/pdf"));

  let previewHtml = "";
  if (rx.fileData && isImage) {
    previewHtml = `
      <div class="rx-doc-preview-container">
        <p style="font-size:12px; color:var(--muted); margin-bottom:6px;">High-Resolution Prescription Document Preview:</p>
        <img src="${rx.fileData}" alt="Prescription Scan from PC" class="rx-doc-preview-image" />
      </div>
    `;
  } else if (rx.fileData && isPdf) {
    previewHtml = `
      <div class="rx-doc-preview-container">
        <p style="font-size:12px; color:var(--muted); margin-bottom:6px;">PDF Document Scan:</p>
        <iframe src="${rx.fileData}" width="100%" height="400px" style="border:none; border-radius:4px;"></iframe>
      </div>
    `;
  } else {
    previewHtml = `
      <div class="rx-doc-preview-container" style="padding: 24px;">
        <div style="font-size:42px; margin-bottom:8px;">📄</div>
        <p><strong>${escapeHtml(rx.fileName || rx.fileUrl || "Prescription Document")}</strong></p>
        <p class="muted" style="font-size:12px;">Doctor's prescription record attached securely to patient profile.</p>
      </div>
    `;
  }

  if (bodyEl) {
    bodyEl.innerHTML = `
      <div style="background:var(--bg-page); padding:12px 14px; border-radius:var(--radius-sm); margin-bottom:12px; font-size:13.5px; line-height:1.6;">
        <div style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:8px; margin-bottom:6px;">
          <div><strong>Patient:</strong> ${escapeHtml(rx.customerName)} (${escapeHtml(rx.customerPhone || "No phone")})</div>
          <div><span class="status-pill status-${rx.status.toLowerCase().replace(/ /g, "_")}">${escapeHtml(rx.status)}</span></div>
        </div>
        <div><strong>Uploaded:</strong> ${new Date(rx.createdAt).toLocaleDateString()} at ${new Date(rx.createdAt).toLocaleTimeString()}</div>
        <div><strong>Attached File:</strong> <code>${escapeHtml(rx.fileName || rx.fileUrl || "prescription.pdf")}</code> ${rx.fileSize ? `(${escapeHtml(rx.fileSize)})` : ""}</div>
        ${rx.notes ? `<div style="margin-top:6px;"><strong>Clinical / Patient Notes:</strong> <em>"${escapeHtml(rx.notes)}"</em></div>` : ""}
        ${rx.reviewNotes ? `<div style="margin-top:6px; color:var(--primary-dark);"><strong>Pharmacist Clinical Assessment:</strong> <em>"${escapeHtml(rx.reviewNotes)}"</em></div>` : ""}
      </div>
      ${previewHtml}
    `;
  }

  if (downloadLink) {
    if (rx.fileData) {
      downloadLink.href = rx.fileData;
      downloadLink.download = rx.fileName || `prescription-${rx.id}.png`;
      downloadLink.style.display = "inline-flex";
    } else {
      downloadLink.style.display = "none";
    }
  }

  $("#rx-view-dialog")?.showModal();
}

if (typeof window !== "undefined") {
  window.bloomcareOpenDoc = openRxDocumentModal;
}

function openRxReviewModal(rxId) {
  const effRole = getEffectiveRole();
  if (effRole !== "pharmacist" && effRole !== "admin" && effRole !== "developer") {
    openNotice("Permission Denied", "Prescription review and clinical approval is restricted to licensed pharmacists, administrators, and developers.");
    return;
  }

  const rx = STATE.prescriptions.find(p => p.id === rxId);
  if (!rx) return;

  $("#review-rx-id").value = rx.id;

  const isImage = rx.fileType?.startsWith("image/") || (rx.fileData && rx.fileData.startsWith("data:image/")) || (rx.fileName && /\.(jpe?g|png|webp|gif)$/i.test(rx.fileName));
  const isPdf = rx.fileType === "application/pdf" || (rx.fileName && /\.pdf$/i.test(rx.fileName));

  let previewThumb = "";
  if (rx.fileData && isImage) {
    previewThumb = `
      <div style="margin-top:12px; text-align:center; background:#fff; padding:10px; border-radius:6px; border:1px solid #e2e8f0;">
        <p style="font-size:12px; font-weight:600; color:var(--text-dark); margin-bottom:6px;">Scanned Doctor's Prescription (Uploaded from Patient PC):</p>
        <img src="${rx.fileData}" alt="Prescription" style="max-height:190px; max-width:100%; border-radius:4px; border:1px solid #cbd5e1; cursor:pointer;" onclick="window.bloomcareOpenDoc && window.bloomcareOpenDoc('${rx.id}')" title="Click to open high-resolution viewer" />
        <div style="margin-top:8px;">
          <button type="button" class="btn btn-secondary btn-sm view-rx-file-btn" data-id="${rx.id}">Open Full High-Res Document</button>
        </div>
      </div>
    `;
  } else if (rx.fileData && isPdf) {
    previewThumb = `
      <div style="margin-top:10px; text-align:center;">
        <button type="button" class="btn btn-secondary btn-sm view-rx-file-btn" data-id="${rx.id}">Inspect Uploaded PDF Document</button>
      </div>
    `;
  }

  $("#rx-review-details-box").innerHTML = `
    <div style="background:var(--bg-page); padding:12px; border-radius:var(--radius-sm); margin-bottom:12px; font-size:13.5px; line-height:1.6;">
      <p><strong>Patient:</strong> ${escapeHtml(rx.customerName)} (${escapeHtml(rx.customerPhone || "")})</p>
      <p><strong>Prescription Notes:</strong> <em>"${escapeHtml(rx.notes || "None provided")}"</em></p>
      <p><strong>Attached File:</strong> <code>${escapeHtml(rx.fileName || rx.fileUrl || "prescription-document.pdf")}</code> ${rx.fileSize ? `(${escapeHtml(rx.fileSize)})` : ""}</p>
      ${previewThumb}
    </div>
  `;
  $("#review-rx-decision").value = rx.status || "Approved";
  $("#review-rx-notes").value = rx.reviewNotes || "";

  $("#rx-review-dialog").showModal();
}

// -------------------------------------------------------------
// MODULE 8: PHARMACIST CONSULTATIONS
// -------------------------------------------------------------
function renderConsultationsView() {
  const box = $("#consultations-table-box");
  if (!box) return;

  const effRole = getEffectiveRole();
  const isStaff = effRole === "pharmacist" || effRole === "admin" || effRole === "developer";

  const titleEl = $("#view-consultations .page-title");
  const descEl = $("#view-consultations .page-desc");
  if (titleEl) titleEl.textContent = isStaff ? "Clinical Consultation Schedule" : "Pharmacist Consultations";
  if (descEl) descEl.textContent = isStaff ? "Review patient consultation appointments and manage clinical counseling sessions." : "Book and manage 1-on-1 pharmacist consultations.";

  // Hide customer booking card and doctor cards for staff
  const pharmGrid = $("#available-pharmacists-grid");
  const bookingCard = $("#consult-booking-card");
  const consultGrid = $("#consultations-grid");
  const tableCard = $("#consult-table-card");

  if (pharmGrid) pharmGrid.style.display = isStaff ? "none" : "grid";
  if (bookingCard) bookingCard.style.display = isStaff ? "none" : "block";
  if (consultGrid) consultGrid.style.gridTemplateColumns = isStaff ? "1fr" : "";
  if (tableCard) tableCard.style.gridColumn = isStaff ? "1 / -1" : "";

  let list = STATE.consultations;
  if (!isStaff) {
    if (!STATE.currentUser) {
      list = [];
    } else {
      list = list.filter(c => c.customerId === STATE.currentUser.uid || (STATE.currentUser.email && c.customerEmail === STATE.currentUser.email));
    }
  }

  const phoneInp = $("#consult-phone-input");
  const dateInp = $("#consult-date-input");
  if (phoneInp && !phoneInp.value && STATE.currentUser) phoneInp.value = STATE.currentUser.phone || "";
  if (dateInp && !dateInp.value) {
    const tomorrow = new Date(Date.now() + 86400000);
    dateInp.value = tomorrow.toISOString().slice(0, 10);
  }

  if (list.length === 0) {
    box.innerHTML = isStaff ? `
      <div class="empty-state-box">
        <p class="empty-title">No scheduled patient consultations.</p>
        <p class="empty-desc">There are currently no active patient consultation appointments assigned to your clinical schedule.</p>
      </div>
    ` : `
      <div class="empty-state-box">
        <p class="empty-title">No upcoming consultations.</p>
        <p class="empty-desc">Book a 1-on-1 session with our licensed clinical pharmacists for personalized medication guidance.</p>
        <button class="btn btn-primary btn-sm" type="button" onclick="document.getElementById('consult-booking-form')?.scrollIntoView({behavior:'smooth'})">Book Consultation</button>
      </div>
    `;
    return;
  }

  if (!isStaff) {
    const upcoming = list.filter(c => c.status === "Pending" || c.status === "Confirmed" || c.bookingStatus === "Pending Payment" || c.paymentStatus === "Pending" || c.paymentStatus === "Failed");
    const history = list.filter(c => c.status === "Completed" || c.status === "Cancelled" || c.bookingStatus === "Cancelled");

    box.innerHTML = `
      <div class="table-section-heading">
        <span>My Consultations</span>
        <span class="badge-tag">${upcoming.length} active</span>
      </div>
      ${upcoming.length > 0 ? `
        <table class="standard-table" style="margin-bottom:18px;">
          <thead>
            <tr>
              <th>Reference</th>
              <th>Pharmacist</th>
              <th>Date &amp; Time</th>
              <th>Fee</th>
              <th>Payment Method</th>
              <th>Payment Status</th>
              <th>Booking Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${upcoming.map(c => {
              const isPaid = c.paymentStatus === "Paid";
              const isPendingPay = !isPaid;
              return `
              <tr>
                <td><strong>${escapeHtml(c.consultationNumber || c.id)}</strong></td>
                <td>${escapeHtml(c.pharmacist)}</td>
                <td>${c.date} at ${c.time}</td>
                <td><strong>${formatUGX(c.fee || 15000)}</strong></td>
                <td><span class="badge-tag">${escapeHtml(c.paymentMethod || "Pending")}</span></td>
                <td><span class="status-pill status-${(c.paymentStatus || "Pending").toLowerCase().replace(/ /g, "_")}">${escapeHtml(c.paymentStatus || "Pending")}</span></td>
                <td><span class="status-pill status-${(c.bookingStatus || c.status || "Pending").toLowerCase().replace(/ /g, "_")}">${escapeHtml(c.bookingStatus || c.status || "Pending")}</span></td>
                <td>
                  ${isPendingPay ? `
                    <button class="btn btn-primary btn-sm resume-consult-pay-btn" data-id="${c.id}">Pay UGX 15,000</button>
                  ` : `
                    <span class="status-pill status-approved">Confirmed</span>
                  `}
                </td>
              </tr>
            `}).join("")}
          </tbody>
        </table>
      ` : `<p class="muted" style="padding:10px 0; font-size:13px;">No upcoming consultations.</p>`}

      <div class="table-section-heading" style="margin-top:20px;">
        <span>My Consultation History</span>
        <span class="badge-tag">${history.length} past</span>
      </div>
      ${history.length > 0 ? `
        <table class="standard-table">
          <thead>
            <tr>
              <th>Reference</th>
              <th>Pharmacist</th>
              <th>Date &amp; Time</th>
              <th>Payment Method</th>
              <th>Payment Status</th>
              <th>Booking Status</th>
            </tr>
          </thead>
          <tbody>
            ${history.map(c => `
              <tr>
                <td><strong>${escapeHtml(c.consultationNumber || c.id)}</strong></td>
                <td>${escapeHtml(c.pharmacist)}</td>
                <td>${c.date} at ${c.time}</td>
                <td><span class="badge-tag">${escapeHtml(c.paymentMethod || "N/A")}</span></td>
                <td><span class="status-pill status-${(c.paymentStatus || "Paid").toLowerCase().replace(/ /g, "_")}">${escapeHtml(c.paymentStatus || "Paid")}</span></td>
                <td><span class="status-pill status-${(c.status || "Completed").toLowerCase()}">${escapeHtml(c.status)}</span></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      ` : `<p class="muted" style="padding:10px 0; font-size:13px;">No past consultations recorded.</p>`}
    `;
  } else {
    box.innerHTML = `
      <table class="standard-table">
        <thead>
          <tr>
            <th>Patient</th>
            <th>Pharmacist</th>
            <th>Date</th>
            <th>Time</th>
            <th>Consultation Reference</th>
            <th>Payment Method</th>
            <th>Payment Status</th>
            <th>Booking Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${list.map(c => {
            const isPaid = c.paymentStatus === "Paid" || c.status === "Confirmed" || c.bookingStatus === "Confirmed";
            const isDone = c.status === "Completed";
            return `
            <tr>
              <td>
                <strong>${escapeHtml(c.customerName || c.patientName || "Patient")}</strong>
                ${(c.customerPhone || c.patientPhone) ? `<br><small class="muted">${escapeHtml(c.customerPhone || c.patientPhone)}</small>` : ""}
              </td>
              <td>${escapeHtml(c.pharmacist)}</td>
              <td>${c.date}</td>
              <td>${c.time}</td>
              <td><strong>${escapeHtml(c.consultationNumber || c.id)}</strong></td>
              <td><span class="badge-tag">${escapeHtml(c.paymentMethod || "Pending")}</span></td>
              <td><span class="status-pill status-${(c.paymentStatus || "Pending").toLowerCase().replace(/ /g, "_")}">${escapeHtml(c.paymentStatus || "Pending")}</span></td>
              <td><span class="status-pill status-${(c.bookingStatus || c.status || "Pending").toLowerCase().replace(/ /g, "_")}">${escapeHtml(c.bookingStatus || c.status || "Pending")}</span></td>
              <td>
                ${isDone ? `
                  <span class="muted">Completed</span>
                ` : isPaid ? `
                  <button class="btn btn-primary btn-sm mark-consult-done" data-id="${c.id}">Mark Completed</button>
                ` : `
                  <button class="btn btn-secondary btn-sm" disabled title="Consultation can only start after payment is confirmed">Awaiting Payment</button>
                `}
              </td>
            </tr>
          `}).join("")}
        </tbody>
      </table>
    `;
  }
}

// -------------------------------------------------------------
// MODULE 9: MEDICINE REFILLS
// -------------------------------------------------------------
function renderRefillsView() {
  const box = $("#refills-table-box");
  if (!box) return;

  const effRole = getEffectiveRole();
  const isStaff = effRole === "pharmacist" || effRole === "admin" || effRole === "developer";
  const titleEl = $("#refills-page-title");
  const descEl = $("#refills-page-desc");
  if (titleEl) titleEl.textContent = isStaff ? "Prescription Refill Verification" : "My Refills";
  if (descEl) descEl.textContent = isStaff ? "Review, verify safety, and approve customer medicine refill requests." : "Request refills for previously purchased medicines.";

  // Hide customer refill request card for staff
  const refillRequestCard = $("#refill-request-card");
  const refillsGrid = $("#refills-grid");
  const refillTableCard = $("#refill-table-card");

  if (refillRequestCard) refillRequestCard.style.display = isStaff ? "none" : "block";
  if (refillsGrid) refillsGrid.style.gridTemplateColumns = isStaff ? "1fr" : "";
  if (refillTableCard) refillTableCard.style.gridColumn = isStaff ? "1 / -1" : "";

  let list = STATE.refills;
  if (!isStaff) {
    if (!STATE.currentUser) {
      list = [];
    } else {
      list = list.filter(r => r.customerId === STATE.currentUser.uid || (STATE.currentUser.email && r.customerEmail === STATE.currentUser.email));
    }
  }

  const addrInp = $("#refill-address-input");
  const origInp = $("#refill-orig-order");
  if (addrInp && !addrInp.value) addrInp.value = "Plot 14, Kiyanja Road, Kamukuzi, Mbarara City";
  if (origInp && !origInp.value) origInp.value = "Refill for Order #BC-ORD-0048";

  // Populate Previous Medicines Select if Customer has past orders
  const medSelect = $("#refill-medicine-select");
  if (medSelect && STATE.currentUser) {
    const pastMedicines = new Set(["Amlodipine 5mg Tablets", "Metformin 500mg Tablets", "Salbutamol Inhaler 100mcg", "Cetirizine 10mg Tablets", "Paracetamol 500mg Tablets"]);
    STATE.orders.filter(o => o.customerId === STATE.currentUser.uid || (STATE.currentUser.email && o.customerEmail === STATE.currentUser.email)).forEach(o => {
      o.items.forEach(item => pastMedicines.add(item.name));
    });
    medSelect.innerHTML = Array.from(pastMedicines).map(m => `<option value="${escapeHtml(m)}">${escapeHtml(m)}</option>`).join("");
  }

  if (list.length === 0) {
    box.innerHTML = isStaff ? `
      <div class="empty-state-box">
        <p class="empty-title">No pending refill requests.</p>
        <p class="empty-desc">All customer refill requests have been processed or none have been submitted yet.</p>
      </div>
    ` : `
      <div class="empty-state-box">
        <p class="empty-title">No refill requests yet.</p>
        <p class="empty-desc">Request scheduled maintenance refills for previously prescribed medications.</p>
        <button class="btn btn-primary btn-sm" type="button" onclick="document.getElementById('refill-request-form')?.scrollIntoView({behavior:'smooth'})">Request Refill</button>
      </div>
    `;
    return;
  }

  if (!isStaff) {
    // Collect past eligible medications
    const pastEligible = [
      { medicine: "Amlodipine 5mg Tablets", order: "BC-ORD-0041", date: "2026-08-28", eligibility: "Eligible" },
      { medicine: "Metformin 500mg Tablets", order: "BC-ORD-0043", date: "2026-09-01", eligibility: "Eligible" },
      { medicine: "Omega-3 Fish Oil 1000mg Capsules", order: "BC-ORD-0048", date: "2026-09-01", eligibility: "Eligible" }
    ];

    box.innerHTML = `
      <div class="table-section-heading">
        <span>Previous Eligible Medicines</span>
      </div>
      <table class="standard-table" style="margin-bottom:18px;">
        <thead>
          <tr>
            <th>Medicine</th>
            <th>Previous Order</th>
            <th>Date</th>
            <th>Refill Eligibility</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${pastEligible.map(e => `
            <tr>
              <td><strong>${escapeHtml(e.medicine)}</strong></td>
              <td>${escapeHtml(e.order)}</td>
              <td>${escapeHtml(e.date)}</td>
              <td><span class="status-pill status-approved">${escapeHtml(e.eligibility)}</span></td>
              <td><button class="btn btn-secondary btn-sm select-refill-med-btn" data-med="${escapeHtml(e.medicine)}" data-order="${escapeHtml(e.order)}">Request Refill</button></td>
            </tr>
          `).join("")}
        </tbody>
      </table>

      <div class="table-section-heading" style="margin-top:20px;">
        <span>My Refill Requests</span>
      </div>
      <table class="standard-table">
        <thead>
          <tr>
            <th>Refill ID</th>
            <th>Medicine</th>
            <th>Quantity</th>
            <th>Request Date</th>
            <th>Related Order / Notes</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${list.map(r => `
            <tr>
              <td><strong>${escapeHtml(r.refillNumber || r.id)}</strong></td>
              <td><strong>${escapeHtml(r.medicineName)}</strong></td>
              <td>${r.quantity}</td>
              <td>${new Date(r.createdAt || Date.now()).toLocaleDateString()}</td>
              <td><small class="muted">${escapeHtml(r.notes || "Past Prescription")}</small></td>
              <td><span class="status-pill status-${r.status.toLowerCase().replace(/ /g, "_")}">${escapeHtml(r.status)}</span></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
  } else {
    box.innerHTML = `
      <table class="standard-table">
        <thead><tr><th>Refill #</th><th>Patient</th><th>Medicine</th><th>Qty</th><th>Address</th><th>Status</th><th>Action</th></tr></thead>
        <tbody>
          ${list.map(r => `
            <tr>
              <td><strong>${escapeHtml(r.refillNumber || r.id)}</strong></td>
              <td>${escapeHtml(r.customerName)}</td>
              <td><strong>${escapeHtml(r.medicineName)}</strong></td>
              <td>${r.quantity}</td>
              <td>${escapeHtml(r.address)}</td>
              <td><span class="status-pill status-${r.status.toLowerCase().replace(/ /g, "_")}">${escapeHtml(r.status)}</span></td>
              <td>
                <button class="btn btn-primary btn-sm quick-refill-approve" data-id="${r.id}">Approve Refill</button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
  }
}

// -------------------------------------------------------------
// MODULE 10: INVENTORY & EXPIRY MANAGEMENT
// -------------------------------------------------------------
function renderInventoryView() {
  const box = $("#inventory-table-box");
  if (box) {
    box.innerHTML = `
      <table class="standard-table">
        <thead><tr><th>Batch #</th><th>Product</th><th>Category</th><th>Stock</th><th>Min Stock</th><th>Expiry Date</th><th>Status</th><th>Action</th></tr></thead>
        <tbody>
          ${STATE.products.map(p => {
            const avail = getProductAvailability(p);
            return `
              <tr>
                <td><code>${escapeHtml(p.batchNumber)}</code></td>
                <td><strong>${escapeHtml(p.name)}</strong></td>
                <td>${escapeHtml(p.category)}</td>
                <td><strong>${p.stockQuantity}</strong></td>
                <td>${p.reorderLevel}</td>
                <td>${escapeHtml(p.expiryDate)}</td>
                <td><span class="status-pill status-${avail.badgeClass.replace(/-/g, "_")}">${avail.status}</span></td>
                <td><button class="btn btn-secondary btn-sm adjust-single-stock-btn" data-id="${p.id}">Adjust Stock</button></td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    `;
  }

  const logBox = $("#inventory-logs-table-box");
  if (logBox) {
    logBox.innerHTML = `
      <table class="standard-table">
        <thead><tr><th>Product</th><th>Action</th><th>Qty</th><th>Prev Stock</th><th>New Stock</th><th>Reason</th><th>Staff</th><th>Date</th></tr></thead>
        <tbody>
          ${STATE.inventoryLogs.map(l => `
            <tr>
              <td><strong>${escapeHtml(l.productName)}</strong></td>
              <td><span class="status-pill ${l.type === "stock_in" ? "status-approved" : "status-pending"}">${l.type === "stock_in" ? "+ Stock In" : "- Stock Out"}</span></td>
              <td>${l.quantity}</td>
              <td>${l.previousStock}</td>
              <td><strong>${l.newStock}</strong></td>
              <td>${escapeHtml(l.reason)}</td>
              <td>${escapeHtml(l.performedBy)}</td>
              <td>${new Date(l.timestamp).toLocaleDateString()}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
  }
}

// -------------------------------------------------------------
// MODULE 11: CUSTOMERS DIRECTORY
// -------------------------------------------------------------
function renderCustomersView() {
  const box = $("#customers-table-box");
  if (!box) return;
  box.innerHTML = `
    <table class="standard-table">
      <thead><tr><th>Customer Name</th><th>Phone Number</th><th>Email Address</th><th>Registered</th><th>Orders</th><th>Status</th></tr></thead>
      <tbody>
        ${STATE.customers.map(c => `
          <tr>
            <td><strong>${escapeHtml(c.name)}</strong></td>
            <td>${escapeHtml(c.phone)}</td>
            <td>${escapeHtml(c.email)}</td>
            <td>${escapeHtml(c.registrationDate)}</td>
            <td><strong>${c.ordersCount} orders</strong></td>
            <td><span class="status-pill status-approved">${c.status}</span></td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

// ------
... [truncated for diff preview]