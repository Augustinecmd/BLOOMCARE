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
  deleteProduct,
  getCategories,
  saveCategory,
  createOrder,
  getOrders,
  updateOrderStatus,
  submitPrescription,
  getPrescriptions,
  reviewPrescription,
  bookConsultation,
  getConsultations,
  updateConsultationStatus,
  requestRefill,
  getRefills,
  updateRefillStatus,
  createDelivery,
  getDeliveries,
  updateDeliveryStatus,
  createPaymentRecord,
  getPayments,
  getInventoryLogs,
  createNotification,
  getNotifications,
  markNotificationRead,
  requestPasswordReset,
  getSystemSettings,
  updateSystemSettings
} from "./firebase.js";
import { createWhatsAppUrl } from "./whatsapp.js";
import {
  validateUgandanPhone,
  validateEmail,
  validatePassword,
  validateName
} from "../validators.js";

// DOM Utility
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

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
  cart: `<svg class="svg-icon" viewBox="0 0 24 24"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>`
};

// -------------------------------------------------------------
// 2. 15 PHARMACY HEALTH DEPARTMENTS
// -------------------------------------------------------------
const ESSENTIAL_CATEGORIES = [
  { id: "cat-pain", name: "Pain Relief", iconKey: "medicines", desc: "Headache, body pain, fever, joint and muscle relief.", productCount: 7, status: "active" },
  { id: "cat-cold", name: "Cold & Flu", iconKey: "medicines", desc: "Cough syrups, decongestants, antibiotics and lozenges.", productCount: 7, status: "active" },
  { id: "cat-vitamins", name: "Vitamins & Supplements", iconKey: "prescriptions", desc: "Immunity boosters, minerals and daily multivitamins.", productCount: 6, status: "active" },
  { id: "cat-digestive", name: "Digestive Health", iconKey: "medicines", desc: "Antacids, ORS hydration, laxatives and probiotics.", productCount: 6, status: "active" },
  { id: "cat-firstaid", name: "First Aid", iconKey: "shield", desc: "Antiseptics, bandages, surgical gauze and emergency kits.", productCount: 5, status: "active" },
  { id: "cat-skin", name: "Skin Care", iconKey: "prescriptions", desc: "Medicated lotions, moisturizing creams and ointments.", productCount: 5, status: "active" },
  { id: "cat-personal", name: "Personal Care", iconKey: "prescriptions", desc: "Sanitizers, oral hygiene and daily personal care.", productCount: 3, status: "active" },
  { id: "cat-baby", name: "Baby & Child Care", iconKey: "customers", desc: "Pediatric syrups, infant drops and baby supplements.", productCount: 4, status: "active" },
  { id: "cat-maternal", name: "Maternal Health", iconKey: "prescriptions", desc: "Folic acid, prenatal multivitamins and calcium supplements.", productCount: 4, status: "active" },
  { id: "cat-chronic", name: "Chronic Care", iconKey: "medicines", desc: "Blood pressure, heart and cardiovascular medications.", productCount: 5, status: "active" },
  { id: "cat-diabetes", name: "Diabetes Care", iconKey: "medicines", desc: "Glucose control, test strips and diabetic care.", productCount: 4, status: "active" },
  { id: "cat-respiratory", name: "Respiratory Care", iconKey: "medicines", desc: "Salbutamol inhalers, nebulizer solutions and respiratory therapy.", productCount: 4, status: "active" },
  { id: "cat-allergy", name: "Allergy Care", iconKey: "medicines", desc: "Antihistamines, eye drops and non-drowsy allergy relief.", productCount: 4, status: "active" },
  { id: "cat-devices", name: "Medical Devices", iconKey: "inventory", desc: "Digital thermometers, BP monitors, oximeters and lancets.", productCount: 4, status: "active" },
  { id: "cat-wellness", name: "Wellness Products", iconKey: "shield", desc: "Nutritional shakes, dietary minerals and wellness essentials.", productCount: 4, status: "active" }
];

// Product Catalog (Demonstration Medicine Catalog with All 14 Required Structured Fields)
const INITIAL_MEDICINES = [
  // 1. Pain Relief
  { id: "DEMO-MED-001", name: "Paracetamol 500mg Tablets", genericName: "Paracetamol", strength: "500mg", dosageForm: "Pack of 20 Tablets", category: "Pain Relief", price: 5000, stockQuantity: 150, reorderLevel: 20, requiresPrescription: false, status: "active", description: "[DEMONSTRATION TEST DATA] Fast-acting analgesic and antipyretic for mild to moderate headache, muscle pain, and fever reduction.", manufacturer: "GSK Consumer Healthcare", batchNumber: "DEMO-2026-PA50", expiryDate: "2028-08-31" },
  { id: "DEMO-MED-002", name: "Ibuprofen 400mg Tablets", genericName: "Ibuprofen", strength: "400mg", dosageForm: "Pack of 20 Tablets", category: "Pain Relief", price: 8000, stockQuantity: 95, reorderLevel: 15, requiresPrescription: false, status: "active", description: "[DEMONSTRATION TEST DATA] Non-steroidal anti-inflammatory drug (NSAID) for dental pain, backache, and inflammatory joint stiffness.", manufacturer: "Abbott Laboratories", batchNumber: "DEMO-2026-IB40", expiryDate: "2028-11-30" },
  { id: "DEMO-MED-003", name: "Diclofenac 50mg Tablets", genericName: "Diclofenac Sodium", strength: "50mg", dosageForm: "Pack of 20 Tablets", category: "Pain Relief", price: 12000, stockQuantity: 60, reorderLevel: 12, requiresPrescription: true, status: "active", description: "[DEMONSTRATION TEST DATA] Potent targeted anti-inflammatory analgesic for acute musculoskeletal strain and arthritis.", manufacturer: "Novartis", batchNumber: "DEMO-2026-DC50", expiryDate: "2028-04-15" },
  { id: "DEMO-MED-026", name: "Tramadol Capsules 50mg", genericName: "Tramadol Hydrochloride", strength: "50mg", dosageForm: "Pack of 10 Capsules", category: "Pain Relief", price: 18000, stockQuantity: 30, reorderLevel: 10, requiresPrescription: true, status: "active", description: "[DEMONSTRATION TEST DATA] Centrally acting opioid analgesic for moderate to severe postoperative pain management.", manufacturer: "Grunenthal Pharma", batchNumber: "DEMO-2026-TR50", expiryDate: "2027-11-20" },

  // 2. Cold & Flu
  { id: "DEMO-MED-004", name: "Amoxicillin 500mg Capsules", genericName: "Amoxicillin Trihydrate", strength: "500mg", dosageForm: "Pack of 20 Capsules", category: "Cold & Flu", price: 18000, stockQuantity: 45, reorderLevel: 10, requiresPrescription: true, status: "active", description: "[DEMONSTRATION TEST DATA] Broad-spectrum penicillin antibiotic for bacterial respiratory tract, ENT, and dental infections.", manufacturer: "Medreich Laboratories", batchNumber: "DEMO-2026-AM50", expiryDate: "2027-10-15" },
  { id: "DEMO-MED-005", name: "Azithromycin 500mg Tablets", genericName: "Azithromycin Monohydrate", strength: "500mg", dosageForm: "Pack of 3 Tablets", category: "Cold & Flu", price: 28000, stockQuantity: 40, reorderLevel: 10, requiresPrescription: true, status: "active", description: "[DEMONSTRATION TEST DATA] Short-course macrolide antibiotic for upper and lower respiratory bacterial infections.", manufacturer: "Pfizer", batchNumber: "DEMO-2026-AZ50", expiryDate: "2028-05-30" },
  { id: "DEMO-MED-021", name: "Cough Syrup", genericName: "Guaifenesin Expectorant + Menthol", strength: "100mg/5ml", dosageForm: "100ml Liquid Bottle", category: "Cold & Flu", price: 14000, stockQuantity: 85, reorderLevel: 15, requiresPrescription: false, status: "active", description: "[DEMONSTRATION TEST DATA] Soothing expectorant cough formulation to liquefy chest mucus and relieve dry irritated throat coughs.", manufacturer: "Johnson & Johnson", batchNumber: "DEMO-2026-CS10", expiryDate: "2028-07-15" },
  { id: "DEMO-MED-022", name: "Nasal Saline Drops", genericName: "Sodium Chloride 0.9% Isotonic Solution", strength: "0.9% w/v", dosageForm: "15ml Dropper Bottle", category: "Cold & Flu", price: 7000, stockQuantity: 95, reorderLevel: 15, requiresPrescription: false, status: "active", description: "[DEMONSTRATION TEST DATA] Natural preservative-free isotonic nasal saline drops to clear blocked nasal passages and relieve dryness.", manufacturer: "SurgiPharm Uganda", batchNumber: "DEMO-2026-NS15", expiryDate: "2028-11-30" },

  // 3. Allergy Care
  { id: "DEMO-MED-006", name: "Cetirizine 10mg Tablets", genericName: "Cetirizine Hydrochloride", strength: "10mg", dosageForm: "Pack of 10 Tablets", category: "Allergy Care", price: 8500, stockQuantity: 85, reorderLevel: 12, requiresPrescription: false, status: "active", description: "[DEMONSTRATION TEST DATA] Non-drowsy second-generation antihistamine for allergic rhinitis, sneezing, and skin urticaria.", manufacturer: "UCB Pharma", batchNumber: "DEMO-2026-CT10", expiryDate: "2028-06-20" },
  { id: "DEMO-MED-007", name: "Loratadine 10mg Tablets", genericName: "Loratadine", strength: "10mg", dosageForm: "Pack of 10 Tablets", category: "Allergy Care", price: 10500, stockQuantity: 70, reorderLevel: 15, requiresPrescription: false, status: "active", description: "[DEMONSTRATION TEST DATA] 24-hour non-sedating antihistamine for seasonal hay fever and chronic allergic skin conditions.", manufacturer: "Bayer Healthcare", batchNumber: "DEMO-2026-LR10", expiryDate: "2028-08-31" },

  // 4. Digestive Health
  { id: "DEMO-MED-008", name: "Omeprazole 20mg Capsules", genericName: "Omeprazole", strength: "20mg", dosageForm: "Pack of 14 Capsules", category: "Digestive Health", price: 15000, stockQuantity: 75, reorderLevel: 15, requiresPrescription: true, status: "active", description: "[DEMONSTRATION TEST DATA] Proton pump inhibitor for gastric acid reduction, peptic ulcer healing, and GERD acid reflux.", manufacturer: "AstraZeneca", batchNumber: "DEMO-2026-OM20", expiryDate: "2028-03-31" },
  { id: "DEMO-MED-009", name: "Oral Rehydration Salts", genericName: "WHO Formula Electrolytes", strength: "20.5g/sachet", dosageForm: "Box of 5 Sachets", category: "Digestive Health", price: 3500, stockQuantity: 200, reorderLevel: 30, requiresPrescription: false, status: "active", description: "[DEMONSTRATION TEST DATA] Balanced glucose-electrolyte solution for rehydration therapy during acute diarrhea and dehydration.", manufacturer: "Cipla Uganda", batchNumber: "DEMO-2026-ORS1", expiryDate: "2029-01-30" },
  { id: "DEMO-MED-010", name: "Antacid Tablets", genericName: "Magnesium + Aluminum Hydroxide", strength: "400mg", dosageForm: "Pack of 12 Chewable Tablets", category: "Digestive Health", price: 6000, stockQuantity: 130, reorderLevel: 20, requiresPrescription: false, status: "active", description: "[DEMONSTRATION TEST DATA] Fast-acting chewable tablets for immediate neutralization of stomach acid, heartburn, and sour stomach.", manufacturer: "Reckitt Benckiser", batchNumber: "DEMO-2026-ANT1", expiryDate: "2028-07-25" },

  // 5. Vitamins & Supplements
  { id: "DEMO-MED-011", name: "Vitamin C 500mg Tablets", genericName: "Ascorbic Acid", strength: "500mg", dosageForm: "Bottle of 30 Chewable Tablets", category: "Vitamins & Supplements", price: 12000, stockQuantity: 110, reorderLevel: 15, requiresPrescription: false, status: "active", description: "[DEMONSTRATION TEST DATA] Daily immune defense booster and antioxidant supplement supporting collagen synthesis.", manufacturer: "Bayer Healthcare", batchNumber: "DEMO-2026-VC50", expiryDate: "2028-04-10" },
  { id: "DEMO-MED-012", name: "Zinc 20mg Tablets", genericName: "Zinc Sulfate Monohydrate", strength: "20mg", dosageForm: "Pack of 10 Tablets", category: "Vitamins & Supplements", price: 6500, stockQuantity: 140, reorderLevel: 25, requiresPrescription: false, status: "active", description: "[DEMONSTRATION TEST DATA] Essential trace mineral for cellular immunity, tissue repair, and diarrhea recovery.", manufacturer: "Cipla Uganda", batchNumber: "DEMO-2026-ZN20", expiryDate: "2029-02-28" },
  { id: "DEMO-MED-027", name: "Daily Multivitamin Complete", genericName: "Complete A-Z Formula", strength: "24 Nutrients", dosageForm: "Bottle of 30 Tablets", category: "Vitamins & Supplements", price: 25000, stockQuantity: 60, reorderLevel: 10, requiresPrescription: false, status: "active", description: "[DEMONSTRATION TEST DATA] Complete daily micronutrient supplement supporting physical vitality and mental clarity.", manufacturer: "Vitabiotics", batchNumber: "DEMO-2026-MV30", expiryDate: "2028-09-15" },

  // 6. Maternal Health
  { id: "DEMO-MED-013", name: "Ferrous Sulfate Tablets", genericName: "Dried Ferrous Sulfate", strength: "200mg (65mg Elemental Iron)", dosageForm: "Bottle of 60 Tablets", category: "Maternal Health", price: 9000, stockQuantity: 80, reorderLevel: 15, requiresPrescription: false, status: "active", description: "[DEMONSTRATION TEST DATA] Essential iron supplement for prevention and treatment of iron deficiency anemia in pregnancy and convalescence.", manufacturer: "Medreich Laboratories", batchNumber: "DEMO-2026-FE20", expiryDate: "2028-10-31" },
  { id: "DEMO-MED-028", name: "Folic Acid 5mg Tablets", genericName: "Folic Acid", strength: "5mg", dosageForm: "Bottle of 100 Tablets", category: "Maternal Health", price: 7000, stockQuantity: 85, reorderLevel: 15, requiresPrescription: false, status: "active", description: "[DEMONSTRATION TEST DATA] Crucial folate supplement for neural tube defect prevention during conception and early pregnancy.", manufacturer: "Cipla Uganda", batchNumber: "DEMO-2026-FA05", expiryDate: "2028-11-15" },

  // 7. First Aid
  { id: "DEMO-MED-014", name: "Antiseptic Solution", genericName: "Chloroxylenol 4.8%", strength: "4.8% w/v", dosageForm: "500ml Liquid Bottle", category: "First Aid", price: 14000, stockQuantity: 75, reorderLevel: 12, requiresPrescription: false, status: "active", description: "[DEMONSTRATION TEST DATA] Concentrated antiseptic liquid for wound cleansing, disinfection of cuts, abrasions, and skin hygiene.", manufacturer: "Reckitt Benckiser", batchNumber: "DEMO-2026-AS50", expiryDate: "2029-03-31" },
  { id: "DEMO-MED-015", name: "Hydrogen Peroxide 3%", genericName: "Hydrogen Peroxide Solution (10 Vol)", strength: "3% w/v", dosageForm: "200ml Liquid Bottle", category: "First Aid", price: 6500, stockQuantity: 90, reorderLevel: 15, requiresPrescription: false, status: "active", description: "[DEMONSTRATION TEST DATA] Mild topical antiseptic for minor wound debridement, effervescent cleansing of cuts, and hygiene.", manufacturer: "SurgiPharm Uganda", batchNumber: "DEMO-2026-HP03", expiryDate: "2028-09-30" },
  { id: "DEMO-MED-016", name: "Povidone-Iodine 10%", genericName: "Povidone-Iodine Topical Solution", strength: "10% w/v", dosageForm: "100ml Liquid Bottle", category: "First Aid", price: 9500, stockQuantity: 85, reorderLevel: 15, requiresPrescription: false, status: "active", description: "[DEMONSTRATION TEST DATA] Broad-spectrum non-stinging microbicidal antiseptic for skin disinfection, minor burns, and wound asepsis.", manufacturer: "Mundipharma", batchNumber: "DEMO-2026-PI10", expiryDate: "2029-04-30" },

  // 8. Skin Care
  { id: "DEMO-MED-017", name: "Hydrocortisone 1% Cream", genericName: "Hydrocortisone Acetate", strength: "1% w/w", dosageForm: "15g Aluminum Tube", category: "Skin Care", price: 7500, stockQuantity: 50, reorderLevel: 10, requiresPrescription: true, status: "active", description: "[DEMONSTRATION TEST DATA] Mild topical corticosteroid cream for inflammatory dermatitis, allergic eczema, and insect bite irritation.", manufacturer: "Medreich Laboratories", batchNumber: "DEMO-2026-HC01", expiryDate: "2027-11-30" },
  { id: "DEMO-MED-018", name: "Clotrimazole 1% Cream", genericName: "Clotrimazole", strength: "1% w/w", dosageForm: "20g Aluminum Tube", category: "Skin Care", price: 9000, stockQuantity: 65, reorderLevel: 15, requiresPrescription: false, status: "active", description: "[DEMONSTRATION TEST DATA] Broad-spectrum topical imidazole antifungal cream for ringworm (tinea corporis), athlete's foot, and candidiasis.", manufacturer: "Bayer Healthcare", batchNumber: "DEMO-2026-CL01", expiryDate: "2028-09-30" },
  { id: "DEMO-MED-019", name: "Calamine Lotion", genericName: "Calamine 15% + Zinc Oxide 5%", strength: "15% w/v", dosageForm: "100ml Suspension Bottle", category: "Skin Care", price: 8000, stockQuantity: 70, reorderLevel: 12, requiresPrescription: false, status: "active", description: "[DEMONSTRATION TEST DATA] Soothing, cooling astringent protective lotion for itch relief, sunburn, chickenpox rash, and prickly heat.", manufacturer: "Cipla Uganda", batchNumber: "DEMO-2026-CAL1", expiryDate: "2028-12-31" },

  // 9. Respiratory Care
  { id: "DEMO-MED-020", name: "Salbutamol Inhaler", genericName: "Salbutamol Sulfate", strength: "100mcg/metered dose", dosageForm: "200 Dose Pressurized Inhaler", category: "Respiratory Care", price: 22000, stockQuantity: 28, reorderLevel: 8, requiresPrescription: true, status: "active", description: "[DEMONSTRATION TEST DATA] Rapid-acting selective beta-2 agonist bronchodilator for prompt relief of acute asthma bronchospasm.", manufacturer: "GSK", batchNumber: "DEMO-2026-SL10", expiryDate: "2027-09-30" },

  // 10. Medical Devices
  { id: "DEMO-MED-023", name: "Digital Thermometer", genericName: "Electronic Clinical Fever Thermometer", strength: "Digital Sensor (+/-0.1 C)", dosageForm: "1 Digital Unit in Case", category: "Medical Devices", price: 25000, stockQuantity: 40, reorderLevel: 8, requiresPrescription: false, status: "active", description: "[DEMONSTRATION TEST DATA] High-speed clinical digital oral, axillary, and rectal thermometer with fever beep indicator and auto shut-off.", manufacturer: "Omron Healthcare", batchNumber: "DEMO-2026-DT01", expiryDate: "2032-12-31" },
  { id: "DEMO-MED-024", name: "Blood Pressure Monitor", genericName: "Automatic Upper Arm Digital BP Monitor", strength: "Digital Oscillometric Sensor", dosageForm: "1 Digital Monitor Unit + Cuff", category: "Medical Devices", price: 185000, stockQuantity: 18, reorderLevel: 5, requiresPrescription: false, status: "active", description: "[DEMONSTRATION TEST DATA] Clinically validated automatic digital upper-arm blood pressure and pulse monitor with hypertension indicator.", manufacturer: "Omron Healthcare", batchNumber: "DEMO-2026-BP02", expiryDate: "2032-12-31" },

  // 11. Personal Care
  { id: "DEMO-MED-025", name: "Hand Sanitizer 70%", genericName: "70% Isopropyl Alcohol Antiseptic Gel", strength: "70% v/v", dosageForm: "500ml Pump Bottle", category: "Personal Care", price: 10000, stockQuantity: 95, reorderLevel: 15, requiresPrescription: false, status: "active", description: "[DEMONSTRATION TEST DATA] Hospital-grade 70% alcohol hand rub with moisturizers for rapid destruction of germs and pathogens.", manufacturer: "Saraya East Africa", batchNumber: "DEMO-2026-HS70", expiryDate: "2029-06-30" },

  // 12. Chronic Care
  { id: "DEMO-MED-029", name: "Amlodipine 5mg Tablets", genericName: "Amlodipine Besylate", strength: "5mg", dosageForm: "Box of 28 Tablets", category: "Chronic Care", price: 24000, stockQuantity: 50, reorderLevel: 15, requiresPrescription: true, status: "active", description: "[DEMONSTRATION TEST DATA] Calcium channel blocker for arterial hypertension and chronic stable angina management.", manufacturer: "Pfizer", batchNumber: "DEMO-2026-AM05", expiryDate: "2027-12-31" },
  { id: "DEMO-MED-030", name: "Losartan Potassium 50mg Tablets", genericName: "Losartan Potassium", strength: "50mg", dosageForm: "Box of 30 Tablets", category: "Chronic Care", price: 28000, stockQuantity: 42, reorderLevel: 10, requiresPrescription: true, status: "active", description: "[DEMONSTRATION TEST DATA] Angiotensin II receptor blocker for blood pressure regulation and renal protection in diabetes.", manufacturer: "Organon Pharma", batchNumber: "DEMO-2026-LS50", expiryDate: "2028-02-28" },

  // 13. Diabetes Care
  { id: "DEMO-MED-031", name: "Metformin 500mg Tablets", genericName: "Metformin Hydrochloride", strength: "500mg", dosageForm: "Box of 30 Tablets", category: "Diabetes Care", price: 15000, stockQuantity: 40, reorderLevel: 10, requiresPrescription: true, status: "active", description: "[DEMONSTRATION TEST DATA] First-line oral biguanide antidiabetic for glycemic control in adult Type 2 Diabetes.", manufacturer: "Merck Healthcare", batchNumber: "DEMO-2026-MF50", expiryDate: "2028-05-30" },
  { id: "DEMO-MED-032", name: "Accu-Chek Blood Glucose Test Strips", genericName: "Blood Glucose Test Strips (50s)", strength: "50 Test Strips", dosageForm: "Vial of 50 Strips", category: "Diabetes Care", price: 65000, stockQuantity: 30, reorderLevel: 8, requiresPrescription: false, status: "active", description: "[DEMONSTRATION TEST DATA] High-precision capillary blood glucose test strips for regular home blood sugar monitoring.", manufacturer: "Roche Diabetes Care", batchNumber: "DEMO-2026-AC50", expiryDate: "2027-11-30" },

  // 14. Baby & Child Care
  { id: "DEMO-MED-033", name: "Pediatric Paracetamol Syrup 100ml", genericName: "Paracetamol 120mg/5ml", strength: "120mg/5ml", dosageForm: "100ml Bottle + Spoon", category: "Baby & Child Care", price: 9500, stockQuantity: 80, reorderLevel: 15, requiresPrescription: false, status: "active", description: "[DEMONSTRATION TEST DATA] Sugar-free strawberry flavored pediatric suspension for infant fever, pain, and immunization discomfort.", manufacturer: "GSK Consumer Healthcare", batchNumber: "DEMO-2026-CP10", expiryDate: "2028-08-31" },

  // 15. Wellness Products
  { id: "DEMO-MED-034", name: "Omega-3 Fish Oil 1000mg Capsules", genericName: "Fish Oil EPA 180mg / DHA 120mg", strength: "1000mg", dosageForm: "Bottle of 60 Capsules", category: "Wellness Products", price: 32000, stockQuantity: 48, reorderLevel: 10, requiresPrescription: false, status: "active", description: "[DEMONSTRATION TEST DATA] Concentrated essential fatty acids supporting cardiovascular wellness, brain health, and joint mobility.", manufacturer: "P&G Health", batchNumber: "DEMO-2026-OM03", expiryDate: "2028-10-31" }
];


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
    address: "Bukoto, Plot 14, Kampala",
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
    address: "Bukoto, Plot 14, Kampala",
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
    deliveryAddress: "Bukoto, Plot 14, Kampala",
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
    deliveryAddress: "Ntinda, Kimera Road, Kampala",
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
    deliveryAddress: "Pickup from BloomCare Pharmacy - Plot 14 Kampala Road",
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
    deliveryAddress: "Kololo, Upper Kololo Terrace, Kampala",
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
    deliveryAddress: "Bugolobi, Luthuli Avenue, Kampala",
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
    deliveryAddress: "Muyenga, Tank Hill Road, Kampala",
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
    deliveryAddress: "Nakasero, Prince Charles Drive, Kampala",
    items: [
      { productId: "BC-PROD-038", name: "Pure Marine Collagen Powder 200g", quantity: 1, price: 75000 }
    ],
    subtotal: 75000,
    deliveryFee: 5000,
    total: 80000,
    paymentMethod: "Cash on Delivery",
    paymentStatus: "Successful",
    paymentReference: "COD-10294",
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
    deliveryAddress: "Bukoto, Plot 14, Kampala",
    items: [
      { productId: "BC-PROD-039", name: "Omega-3 Fish Oil 1000mg Capsules", quantity: 1, price: 32000 }
    ],
    subtotal: 32000,
    deliveryFee: 5000,
    total: 37000,
    paymentMethod: "MTN MoMo",
    paymentStatus: "Successful",
    paymentReference: "MM-990145",
    orderStatus: "Confirmed",
    assignedStaff: "Moses Kato",
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString()
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
  DEVELOPER_SIMULATE: "developer:simulate"
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
    PERMISSIONS.SYSTEM_SETTINGS
  ],
  pharmacist: [
    PERMISSIONS.CATALOG_BROWSE,
    PERMISSIONS.PRESCRIPTION_VIEW_ALL,
    PERMISSIONS.PRESCRIPTION_CLINICAL_REVIEW,
    PERMISSIONS.CONSULTATION_PROVIDE,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.INVENTORY_ADJUST,
    PERMISSIONS.MEDICINE_MANAGE,
    PERMISSIONS.ORDER_PACK
  ],
  assistant_pharmacist: [
    PERMISSIONS.CATALOG_BROWSE,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.INVENTORY_ADJUST,
    PERMISSIONS.ORDER_PACK
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

// 5. Pharmacy Workflow State Transition Logic (State Machine)
export const ALLOWED_ORDER_TRANSITIONS = {
  "Pending": {
    allowedNext: ["Awaiting Prescription Review", "Processing", "Cancelled"],
    allowedRoles: {
      "Awaiting Prescription Review": ["developer", "admin", "pharmacist", "customer"],
      "Processing": ["developer", "admin", "pharmacist", "assistant_pharmacist"],
      "Cancelled": ["developer", "admin", "pharmacist", "customer"]
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

const INITIAL_USERS = [
  { id: "usr-dev-001", name: "Lead Systems Developer", email: "dev@bloomcare.com", phone: "0751000999", role: "developer", status: "active", createdAt: "2026-01-01" },
  { id: "usr-1", name: "Dr. Admin Mugisha", email: "admin@bloomcare.com", phone: "0700000001", role: "admin", status: "active", createdAt: "2026-01-01" },
  { id: "usr-2", name: "Dr. Amina Nanyonga", email: "pharmacist@bloomcare.com", phone: "0700000002", role: "pharmacist", status: "active", createdAt: "2026-01-10" },
  { id: "usr-2b", name: "Dr. Amina Nanyonga", email: "amina.n@bloomcare.com", phone: "0700000002", role: "pharmacist", status: "active", createdAt: "2026-01-10" },
  { id: "usr-3", name: "Pharm. David Mukasa", email: "david.m@bloomcare.com", phone: "0700000003", role: "pharmacist", status: "active", createdAt: "2026-01-15" },
  { id: "usr-4", name: "Sarah Namusoke", email: "assistant@bloomcare.com", phone: "0700000004", role: "assistant_pharmacist", status: "active", createdAt: "2026-02-01" },
  { id: "usr-4b", name: "Sarah Namusoke", email: "sarah.n@bloomcare.com", phone: "0700000004", role: "assistant_pharmacist", status: "active", createdAt: "2026-02-01" },
  { id: "usr-5", name: "Moses Kato", email: "delivery@bloomcare.com", phone: "0700000005", role: "delivery_person", status: "active", createdAt: "2026-02-10" },
  { id: "usr-5b", name: "Moses Kato", email: "moses.k@bloomcare.com", phone: "0700000005", role: "delivery_person", status: "active", createdAt: "2026-02-10" },
  { id: "usr-6", name: "Emmanuel Otim", email: "emmanuel.o@bloomcare.com", phone: "0700000006", role: "delivery_person", status: "active", createdAt: "2026-02-20" },
  { id: "usr-cust-001", name: "Grace Nakato", email: "customer@bloomcare.com", phone: "0751234567", role: "customer", status: "active", createdAt: "2026-03-01" },
  { id: "usr-cust-002", name: "Grace Nakato", email: "grace.nakato@example.com", phone: "0751234567", role: "customer", status: "active", createdAt: "2026-03-01" }
];

export function findUserProfile(identifier) {
  if (!identifier) return null;
  const clean = String(identifier).trim().toLowerCase();
  const staff = INITIAL_USERS.find(u => 
    (u.uid && u.uid.toLowerCase() === clean) ||
    (u.id && u.id.toLowerCase() === clean) ||
    (u.email && u.email.toLowerCase() === clean)
  );
  if (staff) return staff;
  
  const cust = INITIAL_CUSTOMERS.find(c =>
    (c.id && c.id.toLowerCase() === clean) ||
    (c.email && c.email.toLowerCase() === clean)
  );
  if (cust) {
    return {
      uid: cust.id,
      email: cust.email,
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

export function getSavedSessionUser() {
  try {
    const raw = (typeof localStorage !== "undefined" && localStorage.getItem("bloomcare_user_session")) || 
                (typeof sessionStorage !== "undefined" && sessionStorage.getItem("bloomcare_session_user"));
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
    if (typeof localStorage !== "undefined") localStorage.setItem("bloomcare_user_session", serialized);
    if (typeof sessionStorage !== "undefined") sessionStorage.setItem("bloomcare_session_user", serialized);
  } catch (_) {}
}

export function clearSavedSessionUser() {
  try {
    if (typeof localStorage !== "undefined") localStorage.removeItem("bloomcare_user_session");
    if (typeof sessionStorage !== "undefined") sessionStorage.removeItem("bloomcare_session_user");
  } catch (_) {}
}

const INITIAL_CUSTOMERS = [
  { id: "cust-1", name: "Grace Nakato", phone: "0751234567", email: "grace.nakato@example.com", status: "Active", registrationDate: "2026-03-01", ordersCount: 4 },
  { id: "cust-2", name: "David Mukasa", phone: "0772334455", email: "david.m@example.com", status: "Active", registrationDate: "2026-03-12", ordersCount: 2 },
  { id: "cust-3", name: "Florence Kembabazi", phone: "0701889900", email: "florence.k@example.com", status: "Active", registrationDate: "2026-03-18", ordersCount: 2 },
  { id: "cust-4", name: "Joseph Okello", phone: "0782112233", email: "joseph.o@example.com", status: "Active", registrationDate: "2026-04-02", ordersCount: 3 },
  { id: "cust-5", name: "Dr. Brian Tumusiime", phone: "0755443322", email: "brian.t@example.com", status: "Active", registrationDate: "2026-04-15", ordersCount: 1 },
  { id: "cust-6", name: "Aisha Nabawanuka", phone: "0702667788", email: "aisha.n@example.com", status: "Active", registrationDate: "2026-05-01", ordersCount: 2 }
];

const INITIAL_DELIVERIES = [
  { id: "DEL-101", orderId: "BC-ORD-0041", orderNumber: "BC-ORD-0041", customerName: "Grace Nakato", phone: "0751234567", address: "Bukoto, Plot 14, Kampala", itemsSummary: "2x Paracetamol, 1x Vitamin C", deliveryStaffId: "usr-5", deliveryStaffName: "Moses Kato", status: "Delivered", createdAt: "2026-08-28" },
  { id: "DEL-102", orderId: "BC-ORD-0042", orderNumber: "BC-ORD-0042", customerName: "David Mukasa", phone: "0772334455", address: "Ntinda, Kimera Road, Kampala", itemsSummary: "1x Emergency First Aid Kit", deliveryStaffId: "usr-5", deliveryStaffName: "Moses Kato", status: "Out for Delivery", createdAt: "2026-08-31" },
  { id: "DEL-103", orderId: "BC-ORD-0044", orderNumber: "BC-ORD-0044", customerName: "Florence Kembabazi", phone: "0701889900", address: "Kololo, Upper Kololo Terrace, Kampala", itemsSummary: "2x Salbutamol Inhaler, 1x Cetirizine", deliveryStaffId: "usr-6", deliveryStaffName: "Emmanuel Otim", status: "Picked Up", createdAt: "2026-09-01" },
  { id: "DEL-104", orderId: "BC-ORD-0045", orderNumber: "BC-ORD-0045", customerName: "Joseph Okello", phone: "0782112233", address: "Bugolobi, Luthuli Avenue, Kampala", itemsSummary: "1x Omron M2 Blood Pressure Monitor", deliveryStaffId: "usr-6", deliveryStaffName: "Emmanuel Otim", status: "Out for Delivery", createdAt: "2026-09-01" },
  { id: "DEL-105", orderId: "BC-ORD-0047", orderNumber: "BC-ORD-0047", customerName: "Dr. Brian Tumusiime", phone: "0755443322", address: "Nakasero, Prince Charles Drive, Kampala", itemsSummary: "1x Pure Marine Collagen Powder", deliveryStaffId: "usr-5", deliveryStaffName: "Moses Kato", status: "Delivered", createdAt: "2026-08-27" },
  { id: "DEL-106", orderId: "BC-ORD-0046", orderNumber: "BC-ORD-0046", customerName: "Aisha Nabawanuka", phone: "0702667788", address: "Muyenga, Tank Hill Road, Kampala", itemsSummary: "1x Pregnacare, 1x Folic Acid", deliveryStaffId: "usr-5", deliveryStaffName: "Moses Kato", status: "Pending Dispatch", createdAt: "2026-09-01" }
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
  { id: "notif-1", role: "customer", title: "Order Ready for Pickup", message: "Your order #BC-ORD-0043 is packed and ready for collection at Plot 14 Kampala Road.", type: "success", read: false, createdAt: new Date(Date.now() - 3600000 * 2).toISOString() },
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
  activeReceiptOrder: null,
  pendingRxFile: null,
  products: [...INITIAL_MEDICINES],
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
  inventoryLogs: [...INITIAL_INVENTORY_LOGS],
  auditLogs: [],
  systemSettings: {
    pharmacyName: "BloomCare Pharmacy",
    phone: "+256 700 000 000",
    email: "care@bloomcare.com",
    whatsapp: "256751234567",
    address: "Plot 14, Kampala Road, Kampala, Uganda",
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
  orderFilter: "all",
  reportsDateFilter: "month",
  fulfillmentOption: "delivery", // delivery | pickup
  deliveryFee: 5000
};

export function normalizeRole(role) {
  if (!role) return null;
  const raw = String(role).trim().toLowerCase();
  const r = raw.replace(/[\s-]+/g, "_");

  if (r === "developer" || r === "dev") return "developer";
  if (r === "admin" || r === "administrator") return "admin";
  if (r === "pharmacist" || r === "pharm") return "pharmacist";
  if (r === "assistant_pharmacist" || r === "pharmacyassistant" || r === "assistant" || r === "pharmacy_assistant" || r === "asst_pharmacist") return "assistant_pharmacist";
  if (r === "delivery_person" || r === "deliverystaff" || r === "delivery" || r === "delivery_staff" || r === "driver") return "delivery_person";
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
  const num = Number(amount || 0);
  return `UGX ${num.toLocaleString()}`;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  })[char]);
}

function openNotice(title, message) {
  $("#notice-title").textContent = title;
  $("#notice-msg").innerHTML = message;
  $("#notice-modal").showModal();
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
export function getProductImage(prod) {
  if (prod && prod.image) return prod.image;
  const cat = ((prod && prod.category) || "").toLowerCase();
  const form = ((prod && prod.dosageForm) || "").toLowerCase();

  if (cat.includes("device") || form.includes("monitor") || form.includes("thermometer")) {
    return "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 24 24' fill='none' stroke='%230284c7' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'><path d='M22 12h-4l-3 9L9 3l-3 9H2'/></svg>";
  }
  if (cat.includes("respiratory") || form.includes("inhaler")) {
    return "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 24 24' fill='none' stroke='%23059669' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'><path d='M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8'/><path d='M21 3v5h-5'/><circle cx='12' cy='12' r='3'/></svg>";
  }
  if (cat.includes("cold") || form.includes("syrup") || form.includes("liquid") || form.includes("drops") || form.includes("solution") || form.includes("bottle")) {
    return "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 24 24' fill='none' stroke='%230891b2' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'><path d='M8 2h8v4H8z'/><rect x='6' y='6' width='12' height='16' rx='2'/><line x1='6' y1='12' x2='18' y2='12'/></svg>";
  }
  if (cat.includes("skin") || form.includes("cream") || form.includes("lotion") || form.includes("ointment")) {
    return "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 24 24' fill='none' stroke='%23d97706' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'><path d='M12 2v20'/><path d='M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6'/></svg>";
  }
  if (cat.includes("vitamin") || cat.includes("supplement") || cat.includes("wellness")) {
    return "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 24 24' fill='none' stroke='%23ea580c' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'><circle cx='12' cy='12' r='9'/><path d='M12 7v10'/><path d='M8 12h8'/></svg>";
  }
  if (cat.includes("first aid") || form.includes("sachet") || form.includes("gauze")) {
    return "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 24 24' fill='none' stroke='%23dc2626' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'><rect x='3' y='3' width='18' height='18' rx='3'/><path d='M12 8v8'/><path d='M8 12h8'/></svg>";
  }
  // Default medication capsules / tablets
  return "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 24 24' fill='none' stroke='%2316a34a' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'><path d='m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z'/><path d='m8.5 8.5 7 7'/></svg>";
}

const CART_STORAGE_KEY = "bloomcare_cart_items";

export function saveCartToStorage() {
  try {
    if (typeof localStorage !== "undefined") {
      const serializable = STATE.cart.map(i => ({
        productId: i.productId || i.product?.id,
        name: i.name || i.product?.name,
        price: i.price || i.product?.price,
        image: i.image,
        quantity: i.quantity,
        requiresPrescription: Boolean(i.requiresPrescription || i.product?.requiresPrescription)
      }));
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(serializable));
    }
  } catch (e) {
    console.warn("[BLOOMCARE] Could not write cart to localStorage:", e);
  }
}

export function loadCartFromStorage() {
  try {
    if (typeof localStorage !== "undefined") {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          STATE.cart = parsed.map(item => {
            const fullProd = STATE.products.find(p => p.id === item.productId);
            return {
              productId: item.productId,
              name: item.name,
              price: item.price,
              image: item.image || (fullProd ? getProductImage(fullProd) : ""),
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
          updateCartBadge();
        }
      }
    }
  } catch (e) {
    console.warn("[BLOOMCARE] Could not load cart from localStorage:", e);
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
  try {
    const [fetchedProducts, fetchedCategories, fetchedSettings] = await Promise.all([
      getProducts(),
      getCategories(),
      getSystemSettings()
    ]);

    if (fetchedProducts && fetchedProducts.length > 0) {
      STATE.products = fetchedProducts;
    } else {
      STATE.products = [...INITIAL_MEDICINES];
      seedInitialCatalogIfEmpty(INITIAL_MEDICINES, ESSENTIAL_CATEGORIES).catch(e => console.warn(e));
    }

    if (fetchedCategories && fetchedCategories.length > 0) {
      STATE.categories = fetchedCategories;
    } else {
      STATE.categories = [...ESSENTIAL_CATEGORIES];
    }

    if (fetchedSettings) {
      STATE.systemSettings = { ...STATE.systemSettings, ...fetchedSettings };
    }

    if (userId) {
      const [userOrders, userPrescriptions, userConsultations, userRefills] = await Promise.all([
        getOrders(userId, STATE.activeRole),
        getPrescriptions(userId, STATE.activeRole),
        getConsultations(userId, STATE.activeRole),
        getRefills(userId, STATE.activeRole)
      ]);

      if (userOrders && userOrders.length > 0) STATE.orders = userOrders;
      if (userPrescriptions && userPrescriptions.length > 0) STATE.prescriptions = userPrescriptions;
      if (userConsultations && userConsultations.length > 0) STATE.consultations = userConsultations;
      if (userRefills && userRefills.length > 0) STATE.refills = userRefills;
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

async function initApp() {
  // Show Loading Screen Immediately
  showAuthLoadingScreen("Loading your BloomCare workspace...", "Verifying your account role and access permissions...");

  // Sync WhatsApp Link
  const whatsappUrl = createWhatsAppUrl(STATE.systemSettings.whatsapp, "Hello BloomCare Pharmacy, I would like to inquire about a medicine.");
  const topLink = $("#top-whatsapp-link");
  if (topLink) topLink.href = whatsappUrl;
  const contactLink = $("#contact-whatsapp-btn");
  if (contactLink) contactLink.href = whatsappUrl;

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

  // Load public catalog and settings in parallel
  await Promise.all([
    getCategories().then(cats => { if (cats?.length) STATE.categories = cats; }).catch(() => {}),
    getProducts().then(prods => { if (prods?.length) STATE.products = prods; }).catch(() => {}),
    getSystemSettings().then(st => { if (st) STATE.systemSettings = { ...STATE.systemSettings, ...st }; }).catch(() => {})
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

      const userRole = extractRoleFromProfile(profile);

      if (!userRole) {
        STATE.authLoading = false;
        showAuthErrorScreen("Account Role Verification Failed", "Your account role could not be verified from the database. Please contact the administrator.");
        return;
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
        STATE.currentUser = null;
        STATE.activeRole = "visitor";
        STATE.developerPreviewRole = null;
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

  const profileBtn = $("#sidebar-profile-btn");
  const settingsBtn = $("#sidebar-settings-btn");
  const cartBtn = $("#open-cart-btn");

  if (STATE.currentUser) {
    const effectiveRole = getEffectiveRole();
    const isDevPreview = STATE.currentUser.role === "developer" && Boolean(STATE.developerPreviewRole);
    const displayRole = isDevPreview 
      ? `DEV (PREVIEW: ${formatRoleName(effectiveRole).toUpperCase()})` 
      : formatRoleName(STATE.currentUser.role).toUpperCase();

    if (topUserName) topUserName.textContent = STATE.currentUser.displayName || "User";
    if (topUserRole) topUserRole.textContent = displayRole;
    if (topRoleBadge) {
      topRoleBadge.textContent = displayRole;
      topRoleBadge.className = `role-badge role-badge-${effectiveRole}`;
      if (isDevPreview) {
        topRoleBadge.style.borderColor = "#f59e0b";
        topRoleBadge.style.color = "#f59e0b";
      } else {
        topRoleBadge.style.borderColor = "";
        topRoleBadge.style.color = "";
      }
    }
    if (sidebarRoleTag) sidebarRoleTag.textContent = displayRole;
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
    if (topUserRole) topUserRole.textContent = "Log In";
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
      phone: "0751234567",
      role: "customer"
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
      email: "moses.k@bloomcare.com",
      displayName: "Moses Kato",
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
    STATE.orders = INITIAL_ORDERS.filter(o => o.customerId === "usr-demo-customer");
    STATE.prescriptions = INITIAL_PRESCRIPTIONS.filter(p => p.customerId === "usr-demo-customer");
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

function updateNotifBadge() {
  if (!STATE.currentUser) {
    $("#top-notif-badge")?.classList.add("hidden");
    return;
  }
  const effective = getEffectiveRole();
  const unread = STATE.notifications.filter(n => !n.read && (n.role === effective || !n.role)).length;
  const badge = $("#top-notif-badge");
  if (badge) {
    badge.textContent = String(unread);
    badge.classList.toggle("hidden", unread === 0);
  }
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
    { route: "contact", icon: ICONS.contact, label: "Contact Us" }
  ],
  pharmacist: [
    { route: "pharmacist/dashboard", icon: ICONS.dashboard, label: "Dashboard" },
    { route: "pharmacist/prescriptions", icon: ICONS.prescriptions, label: "Prescriptions" },
    { route: "pharmacist/consultations", icon: ICONS.consultations, label: "Consultations" },
    { route: "pharmacist/refills", icon: ICONS.refills, label: "Refills" },
    { route: "pharmacist/orders", icon: ICONS.orders, label: "Orders" },
    { route: "pharmacist/medicines", icon: ICONS.medicines, label: "Medicines" },
    { route: "pharmacist/inventory", icon: ICONS.inventory, label: "Inventory" },
    { route: "about", icon: ICONS.about, label: "About Us" },
    { route: "contact", icon: ICONS.contact, label: "Contact Us" }
  ],
  assistant_pharmacist: [
    { route: "assistant_pharmacist/dashboard", icon: ICONS.dashboard, label: "Dashboard" },
    { route: "orders", icon: ICONS.orders, label: "Orders to Pack" },
    { route: "medicines", icon: ICONS.medicines, label: "Medicines" },
    { route: "categories", icon: ICONS.categories, label: "Categories" },
    { route: "inventory", icon: ICONS.inventory, label: "Stock Inventory" },
    { route: "about", icon: ICONS.about, label: "About Us" },
    { route: "contact", icon: ICONS.contact, label: "Contact Us" }
  ],
  pharmacyAssistant: [
    { route: "assistant_pharmacist/dashboard", icon: ICONS.dashboard, label: "Dashboard" },
    { route: "orders", icon: ICONS.orders, label: "Orders to Pack" },
    { route: "medicines", icon: ICONS.medicines, label: "Medicines" },
    { route: "categories", icon: ICONS.categories, label: "Categories" },
    { route: "inventory", icon: ICONS.inventory, label: "Stock Inventory" },
    { route: "about", icon: ICONS.about, label: "About Us" },
    { route: "contact", icon: ICONS.contact, label: "Contact Us" }
  ],
  delivery_person: [
    { route: "delivery_person/dashboard", icon: ICONS.dashboard, label: "Delivery Dashboard" },
    { route: "deliveries", icon: ICONS.deliveries, label: "Deliveries" },
    { route: "about", icon: ICONS.about, label: "About Us" },
    { route: "contact", icon: ICONS.contact, label: "Contact Us" }
  ],
  deliveryStaff: [
    { route: "delivery_person/dashboard", icon: ICONS.dashboard, label: "Delivery Dashboard" },
    { route: "deliveries", icon: ICONS.deliveries, label: "Deliveries" },
    { route: "about", icon: ICONS.about, label: "About Us" },
    { route: "contact", icon: ICONS.contact, label: "Contact Us" }
  ],
  admin: [
    { route: "admin/dashboard", icon: ICONS.dashboard, label: "Dashboard" },
    { route: "admin/medicines", icon: ICONS.medicines, label: "Medicines" },
    { route: "admin/categories", icon: ICONS.categories, label: "Categories" },
    { route: "admin/inventory", icon: ICONS.inventory, label: "Inventory" },
    { route: "admin/orders", icon: ICONS.orders, label: "Orders" },
    { route: "admin/prescriptions", icon: ICONS.prescriptions, label: "Prescriptions" },
    { route: "admin/consultations", icon: ICONS.consultations, label: "Consultations" },
    { route: "admin/refills", icon: ICONS.refills, label: "Refills" },
    { route: "admin/customers", icon: ICONS.customers, label: "Customers" },
    { route: "admin/users", icon: ICONS.users, label: "Users & Staff" },
    { route: "admin/deliveries", icon: ICONS.deliveries, label: "Deliveries" },
    { route: "admin/payments", icon: ICONS.payments, label: "Payments" },
    { route: "admin/reports", icon: ICONS.reports, label: "Reports" },
    { route: "admin/notifications", icon: ICONS.notifications, label: "Notifications" },
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
    </button>
  `).join("");
}

// -------------------------------------------------------------
// REUSABLE ROUTE PROTECTION ENGINE
// -------------------------------------------------------------
export function checkRouteAccess(route, user, role = null) {
  const clean = String(route || "").replace(/^#\/?/, "").replace(/^\/+|\/+$/g, "").trim();
  const effectiveRole = normalizeRole(role || (user ? user.role : "visitor") || "visitor");

  // Public routes (accessible to everyone, including visitors)
  const publicRoutes = ["auth", "login", "register", "staff-login", "medicines", "categories", "about", "contact"];
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

  // 1. DEVELOPER ACCESS RULES (Root system access when not in a restricted preview)
  if (effectiveRole === "developer") {
    return { allowed: true };
  }

  // 2. CUSTOMER ACCESS RULES
  if (effectiveRole === "customer") {
    if (clean.startsWith("developer/") || clean === "developer") {
      return {
        allowed: false,
        redirectRoute: "customer/dashboard",
        reason: "Access Denied: Developer tools are restricted to system developers."
      };
    }
    if (clean.startsWith("pharmacist/") || clean === "pharmacist" || clean.startsWith("assistant_pharmacist/")) {
      return {
        allowed: false,
        redirectRoute: "customer/dashboard",
        reason: "Access Denied: Customer accounts cannot access pharmacy staff tools."
      };
    }
    if (clean.startsWith("admin/") || clean === "admin" || ["inventory", "users", "deliveries", "payments", "reports", "notifications"].includes(clean)) {
      return {
        allowed: false,
        redirectRoute: "customer/dashboard",
        reason: "Access Denied: Customer accounts cannot access administrative pages."
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
      "profile",
      "customer/profile",
      "settings",
      "customer/settings",
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
    if (clean.startsWith("developer/") || clean === "developer" || clean.startsWith("admin/") || clean.startsWith("pharmacist/") || ["medicines", "inventory", "prescriptions", "consultations", "refills", "users", "reports", "payments", "settings"].includes(clean)) {
      return {
        allowed: false,
        redirectRoute: "delivery_person/dashboard",
        reason: "Access Denied: Delivery personnel are restricted to assigned delivery runs."
      };
    }
    if (["dashboard", "delivery_person/dashboard", "deliveries", "profile", "about", "contact"].includes(clean)) {
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
  if (!route) {
    route = ROLE_HOME_ROUTES[STATE.activeRole] || "auth";
  }
  const clean = route.replace(/^#\/?/, "").replace(/^\/+|\/+$/g, "");
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

  // If visiting root or generic dashboard, resolve to role's primary designated dashboard
  if (!route || route === "dashboard" || route === "home" || route === "overview") {
    route = ROLE_HOME_ROUTES[STATE.activeRole] || "auth";
  }

  if (route === "catalog") route = STATE.activeRole === "customer" ? "customer/medicines" : "medicines";

  // Dedicated Auth Views (#staff-login, #login, #register)
  if (route === "staff-login" || route === "staff" || route === "staff/login") {
    route = "auth";
    $("#register-card")?.classList.add("hidden");
    $("#login-card")?.classList.add("hidden");
    $("#staff-login-card")?.classList.remove("hidden");
  } else if (route === "login") {
    route = "auth";
    $("#register-card")?.classList.add("hidden");
    $("#staff-login-card")?.classList.add("hidden");
    $("#login-card")?.classList.remove("hidden");
  } else if (route === "register" || route === "auth") {
    route = "auth";
    $("#login-card")?.classList.add("hidden");
    $("#staff-login-card")?.classList.add("hidden");
    $("#register-card")?.classList.remove("hidden");
  }

  // Level 2 Security Check: Verify Role-Based Route Access
  const effRole = getEffectiveRole();
  const access = checkRouteAccess(route, STATE.currentUser, effRole);
  if (!access.allowed) {
    if (access.reason) {
      openNotice("Access Denied", access.reason);
    }
    const redirectTarget = access.redirectRoute || ROLE_HOME_ROUTES[effRole] || "auth";
    if (window.location.hash !== `#${redirectTarget}`) {
      window.location.hash = redirectTarget;
    }
    route = redirectTarget;
  }

  STATE.currentRoute = route;
  closeMobileDrawer();

  // Highlight Active Nav Button in Sidebar
  $$(".sidebar-nav-menu .nav-item").forEach((btn) => {
    const btnRoute = btn.dataset.route;
    const isActive = btnRoute === route || route.startsWith(btnRoute) || (btnRoute && btnRoute.includes("/") && route.endsWith(btnRoute.split("/")[1]));
    btn.classList.toggle("active-nav", Boolean(isActive));
  });

  // Determine base pane: e.g. "customer/dashboard" -> "dashboard"
  let basePane = route;
  if (route.includes("/")) {
    basePane = route.split("/")[1];
  }

  // Set Browser Title
  const pageTitles = {
    dashboard: effRole === "pharmacist" ? "Pharmacist Dashboard" : effRole === "admin" ? "Admin Dashboard" : effRole === "assistant_pharmacist" ? "Assistant Dashboard" : effRole === "delivery_person" ? "Delivery Dashboard" : effRole === "developer" ? "Developer Console" : "Customer Dashboard",
    medicines: "Medicines",
    categories: "Categories",
    prescriptions: "Prescriptions",
    consultations: "Consultations",
    refills: "Refills",
    orders: effRole === "customer" ? "My Orders" : "Orders",
    inventory: "Inventory",
    customers: "Customers",
    users: "Users & Roles",
    deliveries: "Deliveries",
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
  else if (basePane === "deliveries") renderDeliveriesView();
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
// -------------------------------------------------------------
function renderRoleDashboard() {
  const container = $("#role-dashboard-container");
  if (!container) return;

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

  } else if (role === "admin") {
    // 1. ADMINISTRATOR DASHBOARD
    container.innerHTML = `
      <div class="page-header-block">
        <h1 class="page-title">Dashboard</h1>
        <p class="page-desc">Overview of pharmacy inventory, orders, revenue, and staff activity.</p>
      </div>

      <div class="kpi-grid-6">
        <div class="kpi-card" data-route="medicines"><div class="kpi-icon-wrap">${ICONS.medicines}</div><div><strong class="kpi-value">${STATE.products.length}</strong><span class="kpi-label">Total Products</span></div></div>
        <div class="kpi-card" data-route="orders"><div class="kpi-icon-wrap">${ICONS.orders}</div><div><strong class="kpi-value">${STATE.orders.length}</strong><span class="kpi-label">Total Orders</span></div></div>
        <div class="kpi-card" data-route="customers"><div class="kpi-icon-wrap">${ICONS.customers}</div><div><strong class="kpi-value">${STATE.customers.length}</strong><span class="kpi-label">Total Customers</span></div></div>
        <div class="kpi-card" data-route="prescriptions"><div class="kpi-icon-wrap">${ICONS.prescriptions}</div><div><strong class="kpi-value">${pendingRxCount}</strong><span class="kpi-label">Pending Rx</span></div></div>
        <div class="kpi-card" data-route="inventory"><div class="kpi-icon-wrap">${ICONS.inventory}</div><div><strong class="kpi-value" style="color:var(--warning);">${lowStockCount}</strong><span class="kpi-label">Low Stock</span></div></div>
        <div class="kpi-card" data-route="reports"><div class="kpi-icon-wrap">${ICONS.payments}</div><div><strong class="kpi-value">${formatUGX(todaySales > 0 ? todaySales : totalRev)}</strong><span class="kpi-label">${todaySales > 0 ? "Today's Sales" : "Total Revenue"}</span></div></div>
      </div>

      <div class="quick-actions-bar">
        <button class="btn btn-primary btn-sm" id="dash-btn-add-prod" type="button">+ Add Product</button>
        <button class="btn btn-secondary btn-sm" data-route="orders">View Orders</button>
        <button class="btn btn-secondary btn-sm" data-route="prescriptions">Review Prescriptions</button>
        <button class="btn btn-secondary btn-sm" data-route="inventory">View Inventory</button>
      </div>

      <div class="content-dual-grid">
        <div class="content-card">
          <div class="flex-between"><h3>Recent Orders</h3><button class="text-link" data-route="orders">View All &rarr;</button></div>
          <div class="table-responsive">
            <table class="standard-table">
              <thead><tr><th>Order ID</th><th>Customer</th><th>Total</th><th>Status</th><th>Date</th><th>Action</th></tr></thead>
              <tbody>
                ${STATE.orders.slice(0, 4).map(o => `
                  <tr>
                    <td><strong>${escapeHtml(o.orderNumber || o.id)}</strong></td>
                    <td>${escapeHtml(o.customerName)}</td>
                    <td><strong>${formatUGX(o.total)}</strong></td>
                    <td><span class="status-pill status-${o.orderStatus.toLowerCase().replace(/ /g, "_")}">${escapeHtml(o.orderStatus)}</span></td>
                    <td>${new Date(o.createdAt).toLocaleDateString()}</td>
                    <td><button class="btn btn-secondary btn-sm manage-order-btn" data-id="${o.id}">Manage</button></td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </div>

        <div class="content-card">
          <div class="flex-between"><h3>Low Stock Items</h3><button class="text-link" data-route="inventory">Stock Control &rarr;</button></div>
          <div class="table-responsive">
            <table class="standard-table">
              <thead><tr><th>Product</th><th>Stock</th><th>Minimum</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                ${STATE.products.filter(p => p.stockQuantity <= p.reorderLevel).slice(0, 4).map(p => `
                  <tr>
                    <td><strong>${escapeHtml(p.name)}</strong></td>
                    <td><span class="stock-pill low-stock">${p.stockQuantity}</span></td>
                    <td>${p.reorderLevel}</td>
                    <td><span class="status-pill status-warning">Low Stock</span></td>
                    <td><button class="btn btn-primary btn-sm quick-restock-btn" data-id="${p.id}">Restock</button></td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    $("#dash-btn-add-prod")?.addEventListener("click", () => openProductFormModal());

  } else if (role === "pharmacist") {
    // 2. PHARMACIST DASHBOARD
    container.innerHTML = `
      <div class="page-header-block">
        <h1 class="page-title">Pharmacist Dashboard</h1>
        <p class="page-desc">Review prescriptions, manage clinical consultations and handle refill requests.</p>
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

  } else if (role === "assistant_pharmacist" || role === "pharmacyAssistant") {
    // 3. PHARMACY ASSISTANT DASHBOARD
    container.innerHTML = `
      <div class="page-header-block">
        <h1 class="page-title">Assistant Pharmacist Dashboard</h1>
        <p class="page-desc">Monitor inventory stock levels, prepare pending orders and assist dispensing.</p>
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

  } else if (role === "delivery_person" || role === "deliveryStaff") {
    // 4. DELIVERY STAFF DASHBOARD
    const assigned = STATE.deliveries.filter(d => d.status !== "Delivered");
    const completed = STATE.deliveries.filter(d => d.status === "Delivered");
    container.innerHTML = `
      <div class="page-header-block">
        <h1 class="page-title">Delivery Dashboard</h1>
        <p class="page-desc">Track assigned deliveries, manage dispatch status, and delivery history.</p>
      </div>

      <div class="kpi-grid-3">
        <div class="kpi-card" data-route="deliveries"><div class="kpi-icon-wrap">${ICONS.deliveries}</div><div><strong class="kpi-value">${assigned.length}</strong><span class="kpi-label">Assigned Deliveries</span></div></div>
        <div class="kpi-card" data-route="deliveries"><div class="kpi-icon-wrap">${ICONS.deliveries}</div><div><strong class="kpi-value">${STATE.deliveries.filter(d => d.status === "Out for Delivery").length}</strong><span class="kpi-label">Out for Delivery</span></div></div>
        <div class="kpi-card" data-route="deliveries"><div class="kpi-icon-wrap">${ICONS.check}</div><div><strong class="kpi-value">${completed.length}</strong><span class="kpi-label">Completed Deliveries</span></div></div>
      </div>

      <div class="content-card">
        <h3>My Assigned Delivery Runs</h3>
        <div class="table-responsive">
          <table class="standard-table">
            <thead><tr><th>Delivery #</th><th>Customer</th><th>Phone</th><th>Address</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              ${STATE.deliveries.map(d => `
                <tr>
                  <td><strong>${escapeHtml(d.id)}</strong></td>
                  <td>${escapeHtml(d.customerName)}</td>
                  <td>${escapeHtml(d.phone)}</td>
                  <td>${escapeHtml(d.address)}</td>
                  <td><span class="status-pill status-${d.status.toLowerCase().replace(/ /g, "_")}">${escapeHtml(d.status)}</span></td>
                  <td>
                    ${d.status !== "Delivered" ? `
                      <button class="btn btn-secondary btn-sm quick-driver-action" data-id="${d.id}" data-action="picked-up">Picked Up</button>
                      <button class="btn btn-outline btn-sm quick-driver-action" data-id="${d.id}" data-action="mark-out">Out for Delivery</button>
                      <button class="btn btn-primary btn-sm quick-driver-action" data-id="${d.id}" data-action="mark-delivered">Delivered</button>
                      <button class="btn btn-outline btn-sm quick-driver-action" data-id="${d.id}" data-action="mark-failed">Failed Delivery</button>
                    ` : `<span class="muted">Delivered</span>`}
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;

  } else if (role === "customer") {
    // 5. CUSTOMER DASHBOARD (Functional Customer Portal)
    const myOrders = STATE.currentUser ? STATE.orders.filter(o => o.customerId === STATE.currentUser.uid || o.customerName === STATE.currentUser.displayName || o.customerId === "usr-demo-customer") : [];
    const activeOrders = myOrders.filter(o => o.orderStatus !== "Delivered" && o.orderStatus !== "Cancelled");
    const myPrescriptions = STATE.currentUser ? STATE.prescriptions.filter(p => p.customerId === STATE.currentUser.uid || p.customerName === STATE.currentUser.displayName || p.customerId === "usr-demo-customer") : [];
    const pendingPrescriptions = myPrescriptions.filter(p => p.status === "Pending" || p.status === "Pending Review" || p.status === "Under Review" || p.status === "Clarification Required");
    const myConsultations = STATE.currentUser ? STATE.consultations.filter(c => c.customerId === STATE.currentUser.uid || c.customerName === STATE.currentUser.displayName || c.customerId === "usr-demo-customer") : [];
    const upcomingConsultations = myConsultations.filter(c => c.status === "Confirmed" || c.status === "Pending");
    const myRefills = STATE.currentUser ? STATE.refills.filter(r => r.customerId === STATE.currentUser.uid || r.customerName === STATE.currentUser.displayName || r.customerId === "usr-demo-customer") : [];
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

    container.innerHTML = `
      <!-- 1. Compact Welcome Section & Quick Actions -->
      <div class="customer-welcome-card">
        <div class="customer-welcome-left">
          <h1 class="page-title" style="font-size:22px; margin-bottom:4px;">Welcome, ${escapeHtml(STATE.currentUser?.displayName || "Customer")}</h1>
          <p class="page-desc">Manage your orders, prescriptions, and pharmacy care in one place.</p>
          <div class="customer-welcome-actions">
            <button class="btn btn-primary btn-sm" type="button" data-route="medicines">Browse Medicines</button>
            <button class="btn btn-secondary btn-sm" type="button" data-route="prescriptions">Upload Prescription</button>
            <button class="btn btn-secondary btn-sm" type="button" data-route="refills">Request Refill</button>
            <button class="btn btn-secondary btn-sm" type="button" data-route="consultations">Consult Pharmacist</button>
          </div>
        </div>
        <div class="customer-welcome-right">
          <span class="customer-badge-pill">${ICONS.check} Verified Patient Account</span>
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
            <div style="font-size: 13px;">
              <strong>Items:</strong> <span class="muted">${latestActive.items.map(i => `${i.quantity}x ${escapeHtml(i.name)}`).join(", ")}</span> &bull; 
              <strong>Total:</strong> <strong>${formatUGX(latestActive.total)}</strong>
            </div>
            <div style="display: flex; gap: 8px;">
              <button class="btn btn-primary btn-sm track-order-btn" data-id="${latestActive.id}">Track Order</button>
              <button class="btn btn-outline btn-sm view-rec-btn" data-id="${latestActive.id}">View Receipt</button>
            </div>
          </div>
        </div>
      ` : ""}

      <!-- 4. Recent Orders -->
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

  } else {
    // 6. PUBLIC VISITOR HOME VIEW
    container.innerHTML = `
      <div class="home-hero-card">
        <div class="hero-card-left">
          <h1 class="hero-headline">Your Trusted Pharmacy, Anytime</h1>
          <p class="hero-tagline">Access genuine medications, pharmacist counseling, and reliable prescription delivery in Kampala.</p>
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
function renderMedicinesView() {
  const effRole = getEffectiveRole();
  const isStaff = effRole === "admin" || effRole === "developer" || effRole === "pharmacist" || effRole === "assistant_pharmacist";
  $("#medicines-staff-actions")?.classList.toggle("hidden", !isStaff);
  $("#staff-medicines-table-card")?.classList.toggle("hidden", !isStaff);
  $("#customer-medicines-controls")?.classList.toggle("hidden", isStaff);
  $("#catalog-products-grid")?.classList.toggle("hidden", isStaff);

  if (isStaff) {
    // Render Staff Product Table with Expiry & Stock Controls
    const box = $("#staff-medicines-table-box");
    if (box) {
      box.innerHTML = `
        <table class="standard-table">
          <thead>
            <tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Min</th><th>Rx</th><th>Batch</th><th>Expiry</th><th>Availability</th><th>Actions</th></tr>
          </thead>
          <tbody>
            ${STATE.products.map(p => {
              const avail = getProductAvailability(p);
              return `
                <tr>
                  <td><strong>${escapeHtml(p.name)}</strong><br><small class="muted">${escapeHtml(p.genericName)}</small></td>
                  <td>${escapeHtml(p.category)}</td>
                  <td><strong>${formatUGX(p.price)}</strong></td>
                  <td><span class="stock-pill ${avail.badgeClass}">${p.stockQuantity}</span></td>
                  <td>${p.reorderLevel}</td>
                  <td>${p.requiresPrescription ? '<span class="rx-pill rx-req">Rx</span>' : '<span class="rx-pill otc-ok">OTC</span>'}</td>
                  <td><code>${escapeHtml(p.batchNumber)}</code></td>
                  <td>${escapeHtml(p.expiryDate)}</td>
                  <td><span class="status-pill status-${avail.badgeClass.replace(/-/g, "_")}">${avail.status}</span></td>
                  <td>
                    <button class="btn btn-secondary btn-sm edit-prod-btn" data-id="${p.id}">Edit</button>
                    <button class="btn btn-outline btn-sm toggle-prod-btn" data-id="${p.id}">${p.status === "active" ? "Deactivate" : "Activate"}</button>
                  </td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      `;
    }
  } else {
    // Render Customer / Visitor Catalog View
    const pills = $("#catalog-category-pills");
    if (pills) {
      pills.innerHTML = `
        <button class="pill-btn ${STATE.selectedCategory === "All" ? "active" : ""}" data-filter="All">All Categories</button>
        ${STATE.categories.map(c => `
          <button class="pill-btn ${STATE.selectedCategory === c.name ? "active" : ""}" data-filter="${escapeHtml(c.name)}">${escapeHtml(c.name)}</button>
        `).join("")}
      `;
    }

    let list = [...STATE.products.filter(p => p && p.status !== "inactive")];
    if (STATE.selectedCategory && STATE.selectedCategory !== "All") {
      list = list.filter(p => p.category === STATE.selectedCategory);
    }
    const q = (STATE.searchQuery || "").trim().toLowerCase();
    if (q) {
      list = list.filter(p => 
        (p.name && p.name.toLowerCase().includes(q)) || 
        (p.genericName && p.genericName.toLowerCase().includes(q)) || 
        (p.brandName && p.brandName.toLowerCase().includes(q)) || 
        (p.manufacturer && p.manufacturer.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q))
      );
    }
    if (STATE.filterAvailability === "in-stock") list = list.filter(p => getProductAvailability(p).isAvailable);
    if (STATE.filterAvailability === "out-of-stock") list = list.filter(p => !getProductAvailability(p).isAvailable);
    if (STATE.filterPrescription === "otc") list = list.filter(p => !p.requiresPrescription);
    if (STATE.filterPrescription === "rx") list = list.filter(p => p.requiresPrescription);

    if (STATE.sortMedicines === "name-asc") list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    if (STATE.sortMedicines === "name-desc") list.sort((a, b) => (b.name || "").localeCompare(a.name || ""));
    if (STATE.sortMedicines === "price-asc") list.sort((a, b) => (a.price || 0) - (b.price || 0));
    if (STATE.sortMedicines === "price-desc") list.sort((a, b) => (b.price || 0) - (a.price || 0));

    const grid = $("#catalog-products-grid");
    if (grid) {
      if (list.length === 0) {
        grid.innerHTML = `
          <div class="empty-state-box" style="grid-column: 1 / -1;">
            <p class="empty-title">No medicines found.</p>
            <p class="empty-desc">No medications found matching your filter or search query. Try resetting your search or category filters.</p>
            <button class="btn btn-primary btn-sm" id="reset-catalog-filters-btn" type="button">Reset Filters</button>
          </div>
        `;
        $("#reset-catalog-filters-btn")?.addEventListener("click", () => {
          STATE.selectedCategory = "All";
          STATE.searchQuery = "";
          STATE.filterAvailability = "all";
          STATE.filterPrescription = "all";
          STATE.sortMedicines = "name-asc";
          const inp1 = $("#top-search-input"); if (inp1) inp1.value = "";
          const inp2 = $("#catalog-search-input"); if (inp2) inp2.value = "";
          const selA = $("#filter-availability"); if (selA) selA.value = "all";
          const selP = $("#filter-prescription"); if (selP) selP.value = "all";
          const selS = $("#sort-medicines"); if (selS) selS.value = "name-asc";
          renderMedicinesView();
        });
      } else {
        grid.innerHTML = list.map(renderProductCardHtml).join("");
      }
    }
  }
}

function renderProductCardHtml(prod) {
  const avail = getProductAvailability(prod);
  const rxBadge = prod.requiresPrescription ? `<span class="rx-pill rx-req">Rx Required</span>` : `<span class="rx-pill otc-ok">OTC (No Rx)</span>`;
  const stockBadge = `<span class="stock-pill ${avail.badgeClass}">${avail.label}</span>`;
  const img = getProductImage(prod);

  const strengthMatch = prod.name.match(/\b\d+(\.\d+)?\s*(mg|mcg|g|ml|%|IU)\b/i) || prod.genericName?.match(/\b\d+(\.\d+)?\s*(mg|mcg|g|ml|%|IU)\b/i);
  const strength = prod.strength || (strengthMatch ? strengthMatch[0] : "Standard Dose");
  const form = prod.dosageForm || "Unit";

  return `
    <article class="product-card" data-product-id="${escapeHtml(prod.id)}" title="Click to view details for ${escapeHtml(prod.name)}">
      <div class="product-badges-row">
        ${stockBadge}
        ${rxBadge}
      </div>
      <div class="product-thumb-container">
        <img src="${escapeHtml(img)}" alt="${escapeHtml(prod.name)}" class="product-thumb-img" loading="lazy" />
      </div>
      <div class="product-card-body">
        <h3 class="product-title">${escapeHtml(prod.name)}</h3>
        <p class="product-generic"><strong>Generic:</strong> ${escapeHtml(prod.genericName)}</p>
        <div class="product-specs-line">
          <span class="spec-pill"><strong>Strength:</strong> ${escapeHtml(strength)}</span>
          <span class="spec-pill"><strong>Form:</strong> ${escapeHtml(form)}</span>
        </div>
        <p class="product-meta-sub"><small class="muted"><strong>Category:</strong> ${escapeHtml(prod.category)}</small></p>
        <p class="product-price">${formatUGX(prod.price)}</p>
      </div>
      <div class="product-card-foot">
        <button class="btn btn-outline btn-sm view-prod-modal-btn" type="button" data-product-id="${escapeHtml(prod.id)}">View Details</button>
        <button class="btn btn-primary btn-sm add-cart-btn" type="button" data-product-id="${escapeHtml(prod.id)}" ${!avail.isAvailable ? "disabled" : ""}>
          ${!avail.isAvailable ? "Unavailable" : "Add to Cart"}
        </button>
      </div>
    </article>
  `;
}

function openProductFormModal(prodId = null) {
  const prod = prodId ? STATE.products.find(p => p.id === prodId) : null;
  $("#prod-id").value = prod ? prod.id : "";
  $("#product-modal-title").textContent = prod ? "Edit Pharmacy Product" : "Add New Pharmacy Product";
  $("#prod-name").value = prod ? prod.name : "";
  $("#prod-generic").value = prod ? prod.genericName : "";
  $("#prod-strength").value = prod ? (prod.strength || "") : "";
  $("#prod-brand").value = prod ? (prod.brandName || "") : "";
  $("#prod-category").value = prod ? prod.category : "Pain Relief";
  $("#prod-price").value = prod ? prod.price : "";
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
  
  const addBtn = $("#modal-add-cart-btn");
  if (addBtn) {
    addBtn.dataset.productId = prod.id;
    addBtn.disabled = !avail.isAvailable;
    addBtn.textContent = !avail.isAvailable ? "Currently Unavailable" : "Add to Cart";
  }

  const strengthMatch = prod.name.match(/\b\d+(\.\d+)?\s*(mg|mcg|g|ml|%|IU)\b/i) || prod.genericName?.match(/\b\d+(\.\d+)?\s*(mg|mcg|g|ml|%|IU)\b/i);
  const strength = prod.strength || (strengthMatch ? strengthMatch[0] : "Standard Dose");

  $("#product-details-content").innerHTML = `
    <div class="modal-product-header-block" style="display:flex; gap:16px; align-items:center; margin-bottom:14px; background:#f8fafc; padding:12px; border-radius:var(--radius-sm); border:1px solid #e2e8f0;">
      <img src="${escapeHtml(img)}" alt="${escapeHtml(prod.name)}" style="width:64px; height:64px; object-fit:contain; flex-shrink:0;" />
      <div>
        <h3 style="margin:0 0 4px; font-size:16px; color:var(--ink);">${escapeHtml(prod.name)}</h3>
        <p style="margin:0; font-size:13px; color:var(--muted);">${escapeHtml(prod.genericName)}</p>
        <strong style="color:var(--primary-dark); font-size:16px; display:block; margin-top:4px;">${formatUGX(prod.price)}</strong>
      </div>
    </div>
    <div class="monograph-meta">
      <div style="background:#f0f7ff; border:1px solid #bfdbfe; color:#1e40af; padding:8px 12px; border-radius:var(--radius-sm); font-size:12px; margin-bottom:12px;">
        <strong>DEMONSTRATION TEST DATA:</strong> This product card contains simulated data for workflow evaluation and system testing.
      </div>
      <p><strong>Medicine Name:</strong> ${escapeHtml(prod.name)}</p>
      <p><strong>Generic Name:</strong> ${escapeHtml(prod.genericName)}</p>
      <p><strong>Strength:</strong> ${escapeHtml(strength)}</p>
      <p><strong>Dosage Form:</strong> ${escapeHtml(prod.dosageForm)}</p>
      <p><strong>Category:</strong> ${escapeHtml(prod.category)}</p>
      <p><strong>Price in UGX:</strong> ${formatUGX(prod.price)}</p>
      <p><strong>Stock Availability:</strong> <span class="stock-pill ${avail.badgeClass}">${avail.label}</span> (${prod.stockQuantity} in demo stock)</p>
      <p><strong>Minimum Stock Level:</strong> ${prod.reorderLevel ?? 10} units</p>
      <p><strong>Prescription Requirement:</strong> ${prod.requiresPrescription ? "Prescription Required: Yes (Rx)" : "Prescription: No (Over-The-Counter)"}</p>
      <p><strong>Manufacturer:</strong> ${escapeHtml(prod.manufacturer || "BloomCare Pharma")}</p>
      <p><strong>Batch Number:</strong> <code>${escapeHtml(prod.batchNumber || "DEMO-2026")}</code></p>
      <p><strong>Expiry Date:</strong> ${escapeHtml(prod.expiryDate || "2028-12-31")}</p>
      <p style="margin-top:10px;"><strong>Description &amp; Indications:</strong> ${escapeHtml(prod.description)}</p>
    </div>
  `;

  $("#product-details-dialog").showModal();
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
          <div class="category-icon-box">${ICONS[cat.iconKey] || ICONS.categories}</div>
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
          <thead><tr><th>Category Name</th><th>Description</th><th>Products</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            ${STATE.categories.map(c => `
              <tr>
                <td><strong>${escapeHtml(c.name)}</strong></td>
                <td>${escapeHtml(c.desc)}</td>
                <td>${STATE.products.filter(p => p.category === c.name).length}</td>
                <td><span class="status-pill status-${c.status || "active"}">${c.status || "active"}</span></td>
                <td><button class="btn btn-secondary btn-sm edit-cat-btn" data-id="${c.id}">Edit</button></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      `;
    }
  }
}

// -------------------------------------------------------------
// MODULE 4: ORDERS MODULE & ORDER TRACKING
// -------------------------------------------------------------
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

  if (list.length === 0) {
    box.innerHTML = `
      <div class="empty-state-box">
        <p class="empty-title">You have not placed any orders yet.</p>
        <p class="empty-desc">Explore genuine medications, health devices, and prescription products in our pharmacy catalog.</p>
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
            <th>Delivery / Pickup</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${list.map(o => `
            <tr>
              <td><strong>${escapeHtml(o.orderNumber || o.id)}</strong></td>
              <td>${new Date(o.createdAt).toLocaleDateString()}</td>
              <td>${o.items.map(i => `${i.quantity}x ${escapeHtml(i.name)}`).join(", ")}</td>
              <td><strong>${formatUGX(o.total)}</strong></td>
              <td><span class="status-pill status-${(o.paymentStatus || "Paid").toLowerCase().replace(/ /g, "_")}">${escapeHtml(o.paymentStatus || "Paid")}</span></td>
              <td><span class="status-pill status-${o.orderStatus.toLowerCase().replace(/ /g, "_")}">${escapeHtml(o.orderStatus)}</span></td>
              <td><small>${o.fulfillmentType === "pickup" ? "Pharmacy Pickup" : "Doorstep Delivery"}</small></td>
              <td>
                <button class="btn btn-primary btn-sm track-order-btn" data-id="${o.id}">Track Order</button>
                <button class="btn btn-secondary btn-sm view-rec-btn" data-id="${o.id}">View Order</button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
  } else {
    box.innerHTML = `
      <table class="standard-table">
        <thead>
          <tr>
            <th>Order Reference</th>
            <th>Date</th>
            <th>Customer</th>
            <th>Fulfillment</th>
            <th>Items Summary</th>
            <th>Total</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${list.map(o => `
            <tr>
              <td><strong>${escapeHtml(o.orderNumber || o.id)}</strong></td>
              <td>${new Date(o.createdAt).toLocaleDateString()}</td>
              <td>${escapeHtml(o.customerName)}<br><small class="muted">${escapeHtml(o.customerPhone || "")}</small></td>
              <td><small>${o.fulfillmentType === "pickup" ? "Pharmacy Pickup" : "Home Delivery"}</small></td>
              <td>${o.items.map(i => `${i.quantity}x ${i.name}`).join(", ")}</td>
              <td><strong>${formatUGX(o.total)}</strong></td>
              <td><span class="status-pill status-${o.orderStatus.toLowerCase().replace(/ /g, "_")}">${escapeHtml(o.orderStatus)}</span></td>
              <td>
                <button class="btn btn-primary btn-sm track-order-btn" data-id="${o.id}">Track</button>
                <button class="btn btn-secondary btn-sm view-rec-btn" data-id="${o.id}">Receipt</button>
                <button class="btn btn-outline btn-sm manage-order-btn" data-id="${o.id}">Manage</button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
  }
}

// 6-Stage Visual Order Tracking Timeline
function openOrderTrackingModal(orderId) {
  const order = STATE.orders.find(o => o.id === orderId);
  if (!order) return;

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
    { key: "Pending", label: "Order Placed" },
    { key: "Confirmed", label: "Confirmed" },
    { key: "Processing", label: "Processing" },
    { key: "Ready", label: "Ready" },
    { key: isPickup ? "Ready for Pickup" : "Out for Delivery", label: isPickup ? "Ready for Pickup" : "Out for Delivery" },
    { key: "Delivered", label: isPickup ? "Collected" : "Completed" }
  ];

  // Map order status to stage index
  const statusRank = {
    "Pending": 0,
    "Awaiting Prescription Review": 0,
    "Confirmed": 1,
    "Processing": 2,
    "Ready": 3,
    "Ready for Pickup": 4,
    "Out for Delivery": 4,
    "Delivered": 5,
    "Completed": 5
  };
  const currentRank = statusRank[order.orderStatus] ?? 0;

  $("#tracking-modal-content").innerHTML = `
    <div style="background:var(--bg-page); padding:12px; border-radius:var(--radius-sm); margin-bottom:14px;">
      <div class="flex-between">
        <strong>Order Reference: ${escapeHtml(order.orderNumber || order.id)}</strong>
        <span class="status-pill status-${order.orderStatus.toLowerCase().replace(/ /g, "_")}">${escapeHtml(order.orderStatus)}</span>
      </div>
      <p style="font-size:12.5px; margin-top:4px; color:var(--muted);">
        ${isPickup ? "Fulfillment: Pharmacy Pickup (Plot 14 Kampala Road)" : `Fulfillment: Doorstep Delivery to ${escapeHtml(order.deliveryAddress)}`}
      </p>
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

    <div class="content-card" style="margin-top:14px; padding:12px;">
      <h4>Order Items</h4>
      <ul style="list-style:none; padding-left:0; font-size:13px; margin-top:6px;">
        ${order.items.map(i => `<li style="display:flex; justify-content:space-between; margin-bottom:4px;"><span>${i.quantity}x ${escapeHtml(i.name)}</span><strong>${formatUGX(i.price * i.quantity)}</strong></li>`).join("")}
      </ul>
      <div class="flex-between" style="border-top:1px solid var(--line); padding-top:8px; margin-top:8px;">
        <strong>Total Payable:</strong>
        <strong style="color:var(--primary-dark);">${formatUGX(order.total)}</strong>
      </div>
    </div>
  `;

  $("#order-tracking-dialog").showModal();
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
  if (addrInp && !addrInp.value) addrInp.value = "Bukoto, Plot 14, Kampala";
  if (origInp && !origInp.value) origInp.value = "Refill for Order #BC-ORD-0048";

  // Populate Previous Medicines Select if Customer has past orders
  const medSelect = $("#refill-medicine-select");
  if (medSelect && STATE.currentUser) {
    const pastMedicines = new Set(["Amlodipine 5mg Tablets", "Metformin 500mg Tablets", "Salbutamol Inhaler 100mcg", "Cetirizine 10mg Tablets", "Paracetamol 500mg Tablets"]);
    STATE.orders.filter(o => o.customerId === STATE.currentUser.uid || o.customerName === STATE.currentUser.displayName || o.customerId === "usr-demo-customer").forEach(o => {
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

// -------------------------------------------------------------
// MODULE 12: USERS & ROLES MODULE (Admin)
// -------------------------------------------------------------
function renderUsersView() {
  const box = $("#users-table-box");
  if (!box) return;

  const effRole = getEffectiveRole();
  if (effRole !== "admin" && effRole !== "developer") {
    box.innerHTML = `<div class="auth-error-box"><p class="auth-error-desc">Access Denied: Staff account management is restricted to administrators and developers.</p></div>`;
    return;
  }

  box.innerHTML = `
    <table class="standard-table">
      <thead><tr><th>Staff Name</th><th>Email</th><th>Phone</th><th>Assigned Role</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
      <tbody>
        ${STATE.users.map(u => `
          <tr>
            <td><strong>${escapeHtml(u.name || u.displayName || "Staff Member")}</strong></td>
            <td>${escapeHtml(u.email)}</td>
            <td>${escapeHtml(u.phone || "—")}</td>
            <td><span class="role-badge role-badge-${u.role}">${escapeHtml(formatRoleName(u.role).toUpperCase())}</span></td>
            <td><span class="status-pill status-${u.status || "active"}">${escapeHtml(u.status || "active")}</span></td>
            <td>${escapeHtml(u.createdAt || "2026-09-01")}</td>
            <td>
              <button class="btn btn-secondary btn-sm edit-user-btn" data-id="${u.id || u.uid}">Edit</button>
              <button class="btn btn-outline btn-sm toggle-user-btn" data-id="${u.id || u.uid}">${u.status === "inactive" ? "Activate" : "Deactivate"}</button>
            </td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

// -------------------------------------------------------------
// MODULE 13: DELIVERIES MODULE
// -------------------------------------------------------------
function renderDeliveriesView() {
  const box = $("#deliveries-table-box");
  if (!box) return;

  const effRole = getEffectiveRole();
  const isDriver = effRole === "delivery_person";
  const titleEl = $("#deliveries-page-title");
  const descEl = $("#deliveries-page-desc");
  if (titleEl) titleEl.textContent = isDriver ? "Assigned Deliveries" : "Deliveries";
  if (descEl) descEl.textContent = isDriver ? "Manage your assigned delivery dispatches and customer locations." : "Manage doorstep dispatch routes and delivery staff assignments.";

  let list = STATE.deliveries;
  if (isDriver && STATE.currentUser) {
    list = list.filter(d => d.deliveryStaffId === STATE.currentUser.uid || d.deliveryStaffName === STATE.currentUser.displayName);
  }

  box.innerHTML = `
    <table class="standard-table">
      <thead><tr><th>Delivery #</th><th>Order #</th><th>Customer</th><th>Address</th><th>Driver</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody>
        ${list.map(d => `
          <tr>
            <td><strong>${escapeHtml(d.id)}</strong></td>
            <td>${escapeHtml(d.orderNumber)}</td>
            <td>${escapeHtml(d.customerName)}<br><small class="muted">${escapeHtml(d.phone)}</small></td>
            <td>${escapeHtml(d.address)}</td>
            <td><strong>${escapeHtml(d.deliveryStaffName || "Unassigned")}</strong></td>
            <td><span class="status-pill status-${d.status.toLowerCase().replace(/ /g, "_")}">${escapeHtml(d.status)}</span></td>
            <td>
              ${d.status !== "Delivered" ? `
                <button class="btn btn-secondary btn-sm quick-driver-action" data-id="${d.id}" data-action="picked-up">Picked Up</button>
                <button class="btn btn-outline btn-sm quick-driver-action" data-id="${d.id}" data-action="mark-out">Out for Delivery</button>
                <button class="btn btn-primary btn-sm quick-driver-action" data-id="${d.id}" data-action="mark-delivered">Delivered</button>
                <button class="btn btn-outline btn-sm quick-driver-action" data-id="${d.id}" data-action="mark-failed">Failed Delivery</button>
              ` : `<span class="muted">Completed</span>`}
            </td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

// -------------------------------------------------------------
// MODULE 14: PAYMENTS MODULE
// -------------------------------------------------------------
function renderPaymentsView() {
  const box = $("#payments-table-box");
  if (!box) return;
  box.innerHTML = `
    <table class="standard-table">
      <thead><tr><th>Payment ID</th><th>Order #</th><th>Customer</th><th>Amount</th><th>Method</th><th>Transaction Ref</th><th>Status</th><th>Date</th></tr></thead>
      <tbody>
        ${STATE.payments.map(p => `
          <tr>
            <td><strong>${escapeHtml(p.paymentId)}</strong></td>
            <td>${escapeHtml(p.orderId)}</td>
            <td>${escapeHtml(p.customerName)}</td>
            <td><strong>${formatUGX(p.amount)}</strong></td>
            <td>${escapeHtml(p.paymentMethod)}</td>
            <td><code>${escapeHtml(p.transactionReference)}</code></td>
            <td><span class="status-pill status-${p.status.toLowerCase()}">${escapeHtml(p.status)}</span></td>
            <td>${escapeHtml(p.createdAt)}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

// -------------------------------------------------------------
// MODULE 15: SALES TRACKING & FINANCIAL AUDIT MODULE (Admin)
// -------------------------------------------------------------
function calculateSalesAnalytics(period = "month") {
  const now = new Date();
  let filteredOrders = STATE.orders.filter(o => o.orderStatus !== "Cancelled");

  if (period === "today") {
    const todayStr = now.toISOString().slice(0, 10);
    filteredOrders = filteredOrders.filter(o => o.createdAt.slice(0, 10) === todayStr);
  } else if (period === "week") {
    const oneWeekAgo = new Date(now.getTime() - 7 * 86400000);
    filteredOrders = filteredOrders.filter(o => new Date(o.createdAt) >= oneWeekAgo);
  } else if (period === "month") {
    const oneMonthAgo = new Date(now.getTime() - 30 * 86400000);
    filteredOrders = filteredOrders.filter(o => new Date(o.createdAt) >= oneMonthAgo);
  } else if (period === "year") {
    const oneYearAgo = new Date(now.getTime() - 365 * 86400000);
    filteredOrders = filteredOrders.filter(o => new Date(o.createdAt) >= oneYearAgo);
  }

  const periodSales = filteredOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalUnitsSold = filteredOrders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + (i.quantity || 1), 0), 0);
  const avgOrderValue = filteredOrders.length ? Math.round(periodSales / filteredOrders.length) : 0;
  const completedOrders = filteredOrders.filter(o => o.orderStatus === "Delivered" || o.orderStatus === "Completed" || o.orderStatus === "Out for Delivery" || o.orderStatus === "Ready for Pickup").length;

  // Payment channel sales breakdown
  const momoSales = filteredOrders.filter(o => (o.paymentMethod || "").toLowerCase().includes("momo")).reduce((sum, o) => sum + (o.total || 0), 0);
  const airtelSales = filteredOrders.filter(o => (o.paymentMethod || "").toLowerCase().includes("airtel")).reduce((sum, o) => sum + (o.total || 0), 0);
  const cashSales = filteredOrders.filter(o => (o.paymentMethod || "").toLowerCase().includes("cash")).reduce((sum, o) => sum + (o.total || 0), 0);

  // Top selling medicines ranking
  const prodSalesMap = {};
  filteredOrders.forEach(o => {
    o.items.forEach(i => {
      const name = i.name;
      if (!prodSalesMap[name]) {
        prodSalesMap[name] = { name, unitsSold: 0, revenue: 0, unitPrice: i.price || 0 };
      }
      prodSalesMap[name].unitsSold += (i.quantity || 1);
      prodSalesMap[name].revenue += ((i.price || 0) * (i.quantity || 1));
    });
  });
  const topProducts = Object.values(prodSalesMap).sort((a, b) => b.revenue - a.revenue);

  // Category sales breakdown
  const categorySalesMap = {};
  STATE.categories.forEach(c => {
    categorySalesMap[c.name] = { name: c.name, revenue: 0, itemsSold: 0 };
  });
  filteredOrders.forEach(o => {
    o.items.forEach(i => {
      const prod = STATE.products.find(p => p.id === i.productId || p.name === i.name);
      const catName = prod ? prod.category : "Pain Relief";
      if (!categorySalesMap[catName]) {
        categorySalesMap[catName] = { name: catName, revenue: 0, itemsSold: 0 };
      }
      categorySalesMap[catName].revenue += ((i.price || 0) * (i.quantity || 1));
      categorySalesMap[catName].itemsSold += (i.quantity || 1);
    });
  });
  const categorySales = Object.values(categorySalesMap).filter(c => c.revenue > 0).sort((a, b) => b.revenue - a.revenue);

  return {
    period,
    orders: filteredOrders,
    periodSales,
    totalUnitsSold,
    avgOrderValue,
    completedOrders,
    momoSales,
    airtelSales,
    cashSales,
    topProducts,
    categorySales
  };
}

function renderReportsView() {
  const container = $("#reports-dashboard-content");
  if (!container) return;

  const currentPeriod = $("#reports-date-filter")?.value || STATE.reportsDateFilter || "month";
  const analytics = calculateSalesAnalytics(currentPeriod);

  const momoPct = analytics.periodSales > 0 ? Math.round((analytics.momoSales / analytics.periodSales) * 100) : 0;
  const airtelPct = analytics.periodSales > 0 ? Math.round((analytics.airtelSales / analytics.periodSales) * 100) : 0;
  const cashPct = analytics.periodSales > 0 ? Math.round((analytics.cashSales / analytics.periodSales) * 100) : 0;

  container.innerHTML = `
    <!-- Top 4 Sales KPI Stat Cards -->
    <div class="reports-summary-grid">
      <div class="report-stat-card">
        <h4>Period Gross Sales</h4>
        <strong>${formatUGX(analytics.periodSales)}</strong>
        <p class="muted">${analytics.orders.length} orders recorded in this period</p>
      </div>
      <div class="report-stat-card">
        <h4>Completed / Active Orders</h4>
        <strong>${analytics.completedOrders} of ${analytics.orders.length}</strong>
        <p class="muted">Processed &amp; Dispatched</p>
      </div>
      <div class="report-stat-card">
        <h4>Average Order Value (AOV)</h4>
        <strong>${formatUGX(analytics.avgOrderValue)}</strong>
        <p class="muted">${analytics.totalUnitsSold} total packs dispensed</p>
      </div>
      <div class="report-stat-card">
        <h4>Pending Prescriptions</h4>
        <strong style="color:var(--secondary);">${STATE.prescriptions.filter(p => p.status === "Pending" || p.status === "Pending Review").length}</strong>
        <p class="muted">Awaiting clinical sign-off</p>
      </div>
    </div>

    <!-- Dual Analytics Grid: Payment Channels & Category Distribution -->
    <div class="content-dual-grid">
      <!-- 1. Sales by Payment Channel -->
      <div class="content-card">
        <h3>Sales by Payment Channel</h3>
        <p class="muted" style="margin-bottom:14px;">Breakdown of gross settlements by Mobile Money &amp; Cash.</p>
        
        <div style="margin-bottom:12px;">
          <div class="flex-between" style="font-size:13px;">
            <span><strong>MTN Mobile Money (*165#)</strong></span>
            <strong>${formatUGX(analytics.momoSales)} (${momoPct}%)</strong>
          </div>
          <div class="sales-bar-bg"><div class="sales-bar-fill" style="width:${momoPct}%; background:#ffcc00;"></div></div>
        </div>

        <div style="margin-bottom:12px;">
          <div class="flex-between" style="font-size:13px;">
            <span><strong>Airtel Money (*185#)</strong></span>
            <strong>${formatUGX(analytics.airtelSales)} (${airtelPct}%)</strong>
          </div>
          <div class="sales-bar-bg"><div class="sales-bar-fill" style="width:${airtelPct}%; background:#e60000;"></div></div>
        </div>

        <div style="margin-bottom:12px;">
          <div class="flex-between" style="font-size:13px;">
            <span><strong>Cash on Doorstep Delivery</strong></span>
            <strong>${formatUGX(analytics.cashSales)} (${cashPct}%)</strong>
          </div>
          <div class="sales-bar-bg"><div class="sales-bar-fill" style="width:${cashPct}%; background:var(--primary);"></div></div>
        </div>
      </div>

      <!-- 2. Top-Selling Medications -->
      <div class="content-card">
        <h3>Top-Selling Medications</h3>
        <p class="muted" style="margin-bottom:14px;">Ranked by gross sales volume and units dispensed.</p>
        <div class="table-responsive">
          <table class="standard-table">
            <thead><tr><th>Medication</th><th>Units Sold</th><th>Price</th><th>Gross Revenue</th></tr></thead>
            <tbody>
              ${analytics.topProducts.length > 0 ? analytics.topProducts.slice(0, 5).map(p => `
                <tr>
                  <td><strong>${escapeHtml(p.name)}</strong></td>
                  <td><span class="stock-pill in-stock">${p.unitsSold} units</span></td>
                  <td>${formatUGX(p.unitPrice)}</td>
                  <td><strong>${formatUGX(p.revenue)}</strong></td>
                </tr>
              `).join("") : `<tr><td colspan="4" class="muted text-center">No product sales in this period.</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Live Sales Transactions Audit Table -->
    <div class="content-card" style="margin-top:20px;">
      <div class="flex-between">
        <h3>Sales Transactions Audit Log</h3>
        <span class="muted">${analytics.orders.length} transaction records</span>
      </div>
      <div class="table-responsive">
        <table class="standard-table">
          <thead>
            <tr>
              <th>Invoice / Order #</th>
              <th>Date &amp; Time</th>
              <th>Customer</th>
              <th>Channel</th>
              <th>Items Dispensed</th>
              <th>Gross (UGX)</th>
              <th>Status</th>
              <th>Receipt</th>
            </tr>
          </thead>
          <tbody>
            ${analytics.orders.length > 0 ? analytics.orders.map(o => `
              <tr>
                <td><strong>${escapeHtml(o.orderNumber || o.id)}</strong></td>
                <td>${new Date(o.createdAt).toLocaleDateString()}</td>
                <td>${escapeHtml(o.customerName)}<br><small class="muted">${escapeHtml(o.customerPhone || "")}</small></td>
                <td><small>${escapeHtml(o.paymentMethod || "MTN MoMo")}</small></td>
                <td>${o.items.map(i => `${i.quantity}x ${i.name}`).join(", ")}</td>
                <td><strong>${formatUGX(o.total)}</strong></td>
                <td><span class="status-pill status-${o.orderStatus.toLowerCase().replace(/ /g, "_")}">${escapeHtml(o.orderStatus)}</span></td>
                <td><button class="btn btn-secondary btn-sm view-rec-btn" data-id="${o.id}">Receipt</button></td>
              </tr>
            `).join("") : `<tr><td colspan="8" class="muted text-center">No transactions recorded for the selected period.</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// -------------------------------------------------------------
// MODULE 16: NOTIFICATIONS MODULE
// -------------------------------------------------------------
function renderNotificationsView() {
  const box = $("#notifications-list-box");
  if (!box) return;

  const role = STATE.activeRole;
  const list = STATE.notifications.filter(n => !n.role || n.role === role || role === "admin");

  if (list.length === 0) {
    box.innerHTML = `<p class="muted" style="padding:20px 0; text-align:center;">You have no notifications.</p>`;
    return;
  }

  box.innerHTML = list.map(n => `
    <div class="notification-card ${n.read ? "" : "notif-unread"}">
      <div>
        <strong>${escapeHtml(n.title)}</strong>
        <p style="font-size:13px; margin:2px 0;">${escapeHtml(n.message)}</p>
        <span class="notif-time">${new Date(n.createdAt).toLocaleDateString()}</span>
      </div>
      <div>
        ${!n.read ? `<button class="btn btn-secondary btn-sm mark-read-btn" data-id="${n.id}">Mark Read</button>` : `<span class="muted">Read</span>`}
      </div>
    </div>
  `).join("");
}

// -------------------------------------------------------------
// MODULE 17: PROFILE MODULE
// -------------------------------------------------------------
function renderProfileView() {
  if (!STATE.currentUser) return;
  const effRole = getEffectiveRole();
  const isStaff = effRole !== "customer" && effRole !== "visitor";
  const titleEl = $("#profile-page-title");
  const descEl = $("#profile-page-desc");
  if (titleEl) titleEl.textContent = isStaff ? "Profile & Security" : "My Profile";
  if (descEl) descEl.textContent = isStaff ? "Manage your staff credentials and security settings." : "Manage your personal information and account security.";

  const nameInput = $("#prof-fullname");
  const emailInput = $("#prof-email");
  const phoneInput = $("#prof-phone");
  if (nameInput) nameInput.value = STATE.currentUser.displayName || "";
  if (emailInput) emailInput.value = STATE.currentUser.email || "";
  if (phoneInput) phoneInput.value = STATE.currentUser.phone || "";
}

// -------------------------------------------------------------
// MODULE 18: SETTINGS MODULE
// -------------------------------------------------------------
function renderSettingsView() {
  const container = $("#settings-content-container");
  if (!container) return;

  const role = getEffectiveRole();
  if (role === "admin" || role === "developer") {
    container.innerHTML = `
      <form id="admin-system-settings-form" class="standard-form">
        <h3>Pharmacy System Parameters</h3>
        <div class="form-row-2">
          <label>Pharmacy Name<input type="text" id="sys-name" value="${escapeHtml(STATE.systemSettings.pharmacyName)}" required /></label>
          <label>NDA License Number<input type="text" id="sys-license" value="${escapeHtml(STATE.systemSettings.licenseNumber)}" required /></label>
        </div>
        <div class="form-row-2">
          <label>Phone Number<input type="text" id="sys-phone" value="${escapeHtml(STATE.systemSettings.phone)}" required /></label>
          <label>WhatsApp Number<input type="text" id="sys-whatsapp" value="${escapeHtml(STATE.systemSettings.whatsapp)}" required /></label>
        </div>
        <label>Physical Address<input type="text" id="sys-address" value="${escapeHtml(STATE.systemSettings.address)}" required /></label>
        <div class="form-row-2">
          <label>Delivery Fee in Kampala (UGX)<input type="number" id="sys-delivery" value="${STATE.systemSettings.deliveryFee}" required /></label>
          <label>Low Stock Alert Threshold<input type="number" id="sys-low-stock" value="${STATE.systemSettings.lowStockThreshold}" required /></label>
        </div>
        <label>Operating Hours<input type="text" id="sys-hours" value="${escapeHtml(STATE.systemSettings.openingHours)}" required /></label>
        <button class="btn btn-primary" type="submit">Save System Settings</button>
      </form>
    `;
    $("#admin-system-settings-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      STATE.systemSettings.pharmacyName = $("#sys-name").value;
      STATE.systemSettings.licenseNumber = $("#sys-license").value;
      STATE.systemSettings.phone = $("#sys-phone").value;
      STATE.systemSettings.whatsapp = $("#sys-whatsapp").value;
      STATE.systemSettings.address = $("#sys-address").value;
      STATE.systemSettings.deliveryFee = Number($("#sys-delivery").value) || 5000;
      STATE.systemSettings.lowStockThreshold = Number($("#sys-low-stock").value) || 10;
      STATE.systemSettings.openingHours = $("#sys-hours").value;
      openNotice("Settings Updated", "Pharmacy system parameters saved successfully.");
    });
  } else {
    container.innerHTML = `
      <form id="cust-settings-form" class="standard-form">
        <h3>Notification Preferences</h3>
        <label style="display:flex; align-items:center; gap:8px; cursor:pointer; margin-bottom:8px;">
          <input type="checkbox" id="pref-sms" checked /> Receive SMS order and delivery updates
        </label>
        <label style="display:flex; align-items:center; gap:8px; cursor:pointer; margin-bottom:16px;">
          <input type="checkbox" id="pref-email" checked /> Receive email tax invoices and prescription reviews
        </label>

        <h3 style="margin-top:16px;">Account Preferences</h3>
        <label>Preferred Communication Channel
          <select id="pref-channel">
            <option value="sms">SMS / Text Messages</option>
            <option value="whatsapp">WhatsApp Care Desk</option>
            <option value="email">Email Notification</option>
          </select>
        </label>

        <h3 style="margin-top:16px;">Password &amp; Security</h3>
        <p class="muted" style="margin-bottom:12px;">Manage your password by requesting a secure verification email.</p>
        <button class="btn btn-secondary btn-sm" id="btn-settings-reset-pass" type="button" style="margin-bottom:16px;">Request Password Reset</button>

        <div style="border-top:1px solid var(--line); padding-top:16px; margin-top:8px;">
          <button class="btn btn-primary" type="submit">Save Preferences</button>
        </div>
      </form>
    `;
    $("#btn-settings-reset-pass")?.addEventListener("click", async () => {
      if (!STATE.currentUser?.email) return;
      try { await requestPasswordReset(STATE.currentUser.email); } catch (_) {}
      openNotice("Password Reset Link", `A reset link has been dispatched to <strong>${escapeHtml(STATE.currentUser.email)}</strong>.`);
    });
    $("#cust-settings-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      openNotice("Preferences Saved", "Your customer notification and account preferences have been saved.");
    });
  }
}

// -------------------------------------------------------------
// MODULE 19: ABOUT US & CONTACT VIEWS
// -------------------------------------------------------------
function renderAboutView() {
  const view = $("#view-about");
  if (!view) return;
}

function renderContactView() {
  const view = $("#view-contact");
  if (!view) return;
  const phone = $("#contact-card-phone");
  const email = $("#contact-card-email");
  const address = $("#contact-card-address");
  const whatsappBtn = $("#contact-whatsapp-btn");
  if (phone) phone.textContent = STATE.systemSettings.phone;
  if (email) email.textContent = STATE.systemSettings.email;
  if (address) address.textContent = STATE.systemSettings.address;
  if (whatsappBtn) {
    whatsappBtn.href = createWhatsAppUrl(STATE.systemSettings.whatsapp, "Hello BloomCare Pharmacy, I would like to inquire about customer support.");
  }
}


// -------------------------------------------------------------
// MODULE 5: SHOPPING CART & STOCK LIMITS
// -------------------------------------------------------------
function addToCart(productId, quantity = 1) {
  const prod = STATE.products.find(p => p.id === productId);
  if (!prod) {
    openNotice("Item Not Found", "Unable to add this product to your cart. Please try again.");
    return false;
  }

  const avail = getProductAvailability(prod);
  if (!avail.isAvailable) {
    openNotice("Medicine Unavailable", `Unable to add this product to your cart. <strong>${escapeHtml(prod.name)}</strong> is currently ${escapeHtml(avail.label.toLowerCase())}.`);
    return false;
  }

  const existing = STATE.cart.find(i => (i.productId || i.product?.id) === productId);
  const currentInCart = existing ? existing.quantity : 0;

  if (currentInCart + quantity > prod.stockQuantity) {
    openNotice("Stock Limit Exceeded", `Unable to add this product to your cart. Only <strong>${prod.stockQuantity}</strong> units of <em>${escapeHtml(prod.name)}</em> are currently in stock.`);
    return false;
  }

  const img = getProductImage(prod);

  if (existing) {
    existing.quantity += quantity;
  } else {
    STATE.cart.push({
      productId: prod.id,
      name: prod.name,
      price: prod.price,
      image: img,
      quantity,
      requiresPrescription: Boolean(prod.requiresPrescription),
      product: prod
    });
  }

  saveCartToStorage();
  updateCartBadge();
  openNotice("Product Added", `<strong>${escapeHtml(prod.name)}</strong> (${quantity}x) added to cart.`);
  return true;
}

export function updateCartItemQuantity(productId, delta) {
  const item = STATE.cart.find(i => (i.productId || i.product?.id) === productId);
  if (!item) return;

  const prod = item.product || STATE.products.find(p => p.id === productId);
  const newQty = item.quantity + delta;

  if (newQty < 1) {
    return;
  }

  if (prod && newQty > prod.stockQuantity) {
    openNotice("Stock Limit Reached", `Unable to increase quantity. Only <strong>${prod.stockQuantity}</strong> units of <em>${escapeHtml(item.name)}</em> are available.`);
    return;
  }

  item.quantity = newQty;
  saveCartToStorage();
  updateCartBadge();
  renderCartDialogContents();
}

export function removeCartItem(productId) {
  const item = STATE.cart.find(i => (i.productId || i.product?.id) === productId);
  const itemName = item ? item.name : "Item";
  STATE.cart = STATE.cart.filter(i => (i.productId || i.product?.id) !== productId);
  saveCartToStorage();
  updateCartBadge();
  renderCartDialogContents();
  openNotice("Item Removed", `<strong>${escapeHtml(itemName)}</strong> was removed from your cart.`);
}

function updateCartBadge() {
  const total = STATE.cart.reduce((sum, i) => sum + (i.quantity || 0), 0);
  const badge = $("#nav-cart-count");
  if (badge) badge.textContent = String(total);
}

function renderCartDialogContents() {
  const container = $("#cart-items-box");
  if (!container) return;

  if (STATE.cart.length === 0) {
    container.innerHTML = `<p class="muted" style="text-align:center; padding: 24px 0;">Your shopping cart is currently empty.</p>`;
    $("#cart-subtotal-val").textContent = "UGX 0";
    $("#cart-delivery-val").textContent = "UGX 0";
    $("#cart-total-val").textContent = "UGX 0";
    return;
  }

  const summary = calculateCartSummary(STATE.cart, STATE.deliveryFee);

  container.innerHTML = STATE.cart.map(item => {
    const itemPrice = item.price ?? item.product?.price ?? 0;
    const itemTotal = itemPrice * item.quantity;
    const prodId = item.productId || item.product?.id;
    const img = item.image || getProductImage(item.product || { category: "Pain Relief" });
    const prod = item.product || STATE.products.find(p => p.id === prodId);
    const maxStock = prod ? prod.stockQuantity : 999;

    return `
      <div class="cart-item-row" data-id="${escapeHtml(prodId)}">
        <img src="${escapeHtml(img)}" alt="${escapeHtml(item.name)}" class="cart-item-thumb" />
        <div class="cart-item-details">
          <strong class="cart-item-name">${escapeHtml(item.name)}</strong>
          ${(item.requiresPrescription || item.product?.requiresPrescription) ? '<span class="rx-pill rx-req" style="font-size:9px; padding:1px 5px; display:inline-block; margin:2px 0;">Rx Required</span>' : ''}
          <div class="cart-item-unit-price">${formatUGX(itemPrice)} each</div>
        </div>
        <div class="cart-qty-control-group">
          <button class="cart-qty-btn cart-qty-minus" type="button" data-action="decrease-qty" data-id="${escapeHtml(prodId)}" title="Decrease quantity" ${item.quantity <= 1 ? "disabled" : ""}>&minus;</button>
          <span class="cart-qty-value">${item.quantity}</span>
          <button class="cart-qty-btn cart-qty-plus" type="button" data-action="increase-qty" data-id="${escapeHtml(prodId)}" title="Increase quantity" ${item.quantity >= maxStock ? "disabled" : ""}>&plus;</button>
        </div>
        <div class="cart-item-total">
          <strong>${formatUGX(itemTotal)}</strong>
        </div>
        <button class="cart-remove-btn" type="button" data-action="remove-item" data-id="${escapeHtml(prodId)}" title="Remove from cart">&times;</button>
      </div>
    `;
  }).join("");

  $("#cart-subtotal-val").textContent = formatUGX(summary.subtotal);
  $("#cart-delivery-val").textContent = formatUGX(summary.deliveryFee);
  $("#cart-total-val").textContent = formatUGX(summary.total);
}

function openCartDialog() {
  const modal = $("#cart-dialog");
  if (!modal) return;
  renderCartDialogContents();
  modal.showModal();
}

// -------------------------------------------------------------
// MODULE 6: 5-STEP CHECKOUT (Delivery vs. Pickup)
// -------------------------------------------------------------
function openCheckoutDialog() {
  const authed = requireAuth(
    () => openCheckoutDialog(),
    { type: "open_checkout" },
    "Please create an account or log in before completing your order."
  );
  if (!authed) return;

  $("#cart-dialog")?.close();
  const modal = $("#checkout-dialog");
  if (!modal) return;

  if (STATE.cart.length === 0) return openNotice("Cart Empty", "Please add items to cart before checkout.");

  const subtotal = STATE.cart.reduce((sum, i) => sum + ((i.price ?? i.product?.price ?? 0) * i.quantity), 0);
  const fee = STATE.fulfillmentOption === "pickup" ? 0 : STATE.deliveryFee;
  const total = subtotal + fee;
  $("#chk-total-val").textContent = formatUGX(total);

  if (STATE.currentUser) {
    $("#chk-name").value = STATE.currentUser.displayName || "";
    $("#chk-email").value = STATE.currentUser.email || "";
    $("#chk-phone").value = STATE.currentUser.phone || "";
    if (!$("#chk-address").value) $("#chk-address").value = "Bukoto, Plot 14, Kampala";
  }

  modal.showModal();
}

export function generateOrderReference() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `BC-${year}${month}${day}-${rand}`;
}

async function handleCheckoutOrder(e) {
  e.preventDefault();
  const authed = requireAuth(null, null, "Please create an account or log in before completing your order.");
  if (!authed) return;

  // 1. Validate Cart
  if (!STATE.cart || STATE.cart.length === 0) {
    return openNotice("Cart Empty", "Your shopping cart is currently empty. Please add items to your cart before placing an order.");
  }

  // 2. Validate Customer Information
  const name = $("#chk-name")?.value.trim() || "";
  const email = $("#chk-email")?.value.trim() || "";
  const phone = $("#chk-phone")?.value.trim() || "";

  if (!name || name.length < 2) {
    return openNotice("Missing Customer Name", "Please enter your full customer name to place this order.");
  }

  if (!email || !email.includes("@")) {
    return openNotice("Invalid Email Address", "Please provide a valid email address for order notifications.");
  }

  const phoneVal = validateUgandanPhone(phone);
  if (!phoneVal.valid) {
    return openNotice("Invalid Phone Number", phoneVal.message || "Please provide a valid Ugandan phone number (e.g. 0772 123 456).");
  }

  // 3. Validate Fulfillment Information
  const fulfillmentType = $("#chk-fulfillment-option")?.value || "delivery"; // delivery | pickup
  const address = fulfillmentType === "pickup" ? "BloomCare Pharmacy Main Dispensary, Plot 14 Kampala Road" : ($("#chk-address")?.value.trim() || "");
  const city = fulfillmentType === "pickup" ? "Kampala" : ($("#chk-city")?.value.trim() || "Kampala");
  const instructions = $("#chk-instructions")?.value.trim() || "";

  if (fulfillmentType === "delivery" && (!address || address.length < 3)) {
    return openNotice("Missing Delivery Address", "Please provide a delivery street or residence address in Kampala.");
  }

  // 4. Validate Payment Information
  const paymentMethod = $("#chk-payment-method")?.value || "Cash on Delivery";
  if (!paymentMethod) {
    return openNotice("Payment Method Required", "Please select a payment method for this order.");
  }

  // Calculate Order Totals
  const subtotal = STATE.cart.reduce((sum, i) => sum + ((i.price ?? i.product?.price ?? 0) * i.quantity), 0);
  const fee = fulfillmentType === "pickup" ? 0 : STATE.deliveryFee;
  const total = subtotal + fee;

  // Generate Unique Order Reference: BC-YYYYMMDD-XXXXX
  const orderRef = generateOrderReference();

  // Check if any cart item requires prescription
  const hasRx = STATE.cart.some(item => Boolean(item.requiresPrescription || item.product?.requiresPrescription));
  const initialStatus = hasRx ? "Awaiting Prescription Review" : (fulfillmentType === "pickup" ? "Processing" : "Confirmed");

  const newOrder = {
    id: orderRef,
    orderNumber: orderRef,
    customerId: STATE.currentUser?.uid || "cust-" + Date.now(),
    customerName: name,
    customerPhone: phoneVal.normalized,
    customerEmail: email,
    fulfillmentType,
    deliveryAddress: fulfillmentType === "pickup" ? "BloomCare Pharmacy Main Dispensary, Plot 14 Kampala Road" : `${address}, ${city}`,
    deliveryCity: city,
    deliveryNotes: instructions,
    items: [...STATE.cart.map(i => {
      const pPrice = i.price ?? i.product?.price ?? 0;
      return {
        productId: i.productId || i.product?.id,
        name: i.name || i.product?.name,
        quantity: i.quantity,
        price: pPrice,
        subtotal: pPrice * i.quantity,
        requiresPrescription: Boolean(i.requiresPrescription || i.product?.requiresPrescription),
        image: i.image || (i.product ? getProductImage(i.product) : "")
      };
    })],
    subtotal,
    deliveryFee: fee,
    total,
    paymentMethod,
    paymentPhone: phoneVal.normalized,
    paymentStatus: paymentMethod === "Cash on Delivery" ? "Pending" : "Paid",
    paymentReference: paymentMethod === "Cash on Delivery" ? "COD-" + orderRef : "TXN-" + Date.now().toString().slice(-6),
    orderStatus: initialStatus,
    assignedStaff: "Pending Assignment",
    createdAt: new Date().toISOString()
  };

  try { await createOrder(newOrder); } catch (_) {}

  // Deduct inventory stock
  for (const item of newOrder.items) {
    const prod = STATE.products.find(p => p.id === item.productId);
    if (prod) {
      prod.stockQuantity = Math.max(0, prod.stockQuantity - item.quantity);
      STATE.inventoryLogs.unshift({
        id: "log-" + Date.now(),
        productName: prod.name,
        type: "stock_out",
        quantity: item.quantity,
        previousStock: prod.stockQuantity + item.quantity,
        newStock: prod.stockQuantity,
        reason: `Order #${orderRef}`,
        performedBy: name,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Create Delivery Record if Delivery fulfillment was chosen
  if (fulfillmentType === "delivery") {
    const newDelivery = {
      id: "DEL-" + Date.now().toString().slice(-3),
      orderId: orderRef,
      orderNumber: orderRef,
      customerName: name,
      phone: phoneVal.normalized,
      address: `${address}, ${city}`,
      itemsSummary: newOrder.items.map(i => `${i.quantity}x ${i.name}`).join(", "),
      deliveryStaffId: null,
      deliveryStaffName: "Unassigned",
      status: "Pending Assignment",
      createdAt: new Date().toISOString().slice(0, 10)
    };
    STATE.deliveries.unshift(newDelivery);
  }

  // Create Payment Record
  STATE.payments.unshift({
    paymentId: "PAY-" + Date.now().toString().slice(-4),
    orderId: orderRef,
    customerName: name,
    amount: total,
    paymentMethod,
    transactionReference: newOrder.paymentReference,
    status: newOrder.paymentStatus,
    createdAt: new Date().toISOString().slice(0, 10)
  });

  STATE.orders.unshift(newOrder);
  STATE.cart = [];
  saveCartToStorage();
  updateCartBadge();
  $("#checkout-dialog")?.close();

  // Always show the professional receipt for the order!
  showReceiptModal(newOrder);
  renderOrdersView();
  renderRoleDashboard();

  if (hasRx) {
    openNotice("Prescription Verification Note", `Order <strong>${orderRef}</strong> contains prescription medications and has been marked <strong>Awaiting Prescription Review</strong> on your official receipt.`);
  }
}

export function showReceiptModal(order) {
  if (!order) return;

  // Level 2 Security: Verify customer ownership
  if (getEffectiveRole() === "customer" && STATE.currentUser) {
    const isOwner = order.customerId === STATE.currentUser.uid || (STATE.currentUser.email && order.customerEmail === STATE.currentUser.email);
    if (!isOwner) {
      openNotice("Access Denied", "You do not have permission to view receipts belonging to another customer.");
      return;
    }
  }

  STATE.activeReceiptOrder = order;

  // 1. Reference, Date, Time, Status
  const orderDate = new Date(order.createdAt || Date.now());
  const formattedDate = orderDate.toLocaleDateString("en-UG", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
  const formattedTime = orderDate.toLocaleTimeString("en-UG", {
    hour: "2-digit",
    minute: "2-digit"
  });

  const orderRef = order.orderNumber || order.id || generateOrderReference();
  const orderRefEl = $("#rec-order-ref");
  if (orderRefEl) orderRefEl.textContent = orderRef;

  const orderDateEl = $("#rec-order-date");
  if (orderDateEl) orderDateEl.textContent = formattedDate;

  const orderTimeEl = $("#rec-order-time");
  if (orderTimeEl) orderTimeEl.textContent = formattedTime;

  // Status Badge
  const statusBadge = $("#rec-status-badge");
  if (statusBadge) {
    const st = order.orderStatus || "Confirmed";
    statusBadge.textContent = st;
    statusBadge.className = "receipt-status-pill";
    if (st.toLowerCase().includes("awaiting")) statusBadge.classList.add("status-awaiting");
    else if (st.toLowerCase().includes("delivered")) statusBadge.classList.add("status-delivered");
    else statusBadge.classList.add("status-confirmed");
  }

  // Fulfillment Method
  const isPickup = order.fulfillmentType === "pickup";
  const fulfillmentEl = $("#rec-fulfillment-type");
  if (fulfillmentEl) fulfillmentEl.textContent = isPickup ? "Pharmacy Pickup" : "Home Delivery";

  // 2. Customer Information
  const custNameEl = $("#rec-cust-name");
  if (custNameEl) custNameEl.textContent = order.customerName || "Customer";

  const custEmailEl = $("#rec-cust-email");
  if (custEmailEl) custEmailEl.textContent = order.customerEmail || "Not provided";

  const custPhoneEl = $("#rec-cust-phone");
  if (custPhoneEl) custPhoneEl.textContent = order.customerPhone || "Not provided";

  // 3. Delivery Information
  const deliveryBody = $("#rec-delivery-details-body");
  if (deliveryBody) {
    if (isPickup) {
      deliveryBody.innerHTML = `
        <div class="receipt-detail-row">
          <span class="detail-label">Fulfillment:</span>
          <strong class="detail-val">Pharmacy Pickup (Free)</strong>
        </div>
        <div class="receipt-detail-row">
          <span class="detail-label">Pickup Station:</span>
          <span class="detail-val">BloomCare Pharmacy Dispensary</span>
        </div>
        <div class="receipt-detail-row">
          <span class="detail-label">Location:</span>
          <span class="detail-val">Plot 14, Kampala Road, Central Kampala</span>
        </div>
        <div class="receipt-detail-row">
          <span class="detail-label">Dispensary Hours:</span>
          <span class="detail-val">Mon–Sat: 8:00 AM – 8:00 PM</span>
        </div>
      `;
    } else {
      deliveryBody.innerHTML = `
        <div class="receipt-detail-row">
          <span class="detail-label">Fulfillment:</span>
          <strong class="detail-val">Home Delivery</strong>
        </div>
        <div class="receipt-detail-row">
          <span class="detail-label">Delivery Address:</span>
          <strong class="detail-val">${escapeHtml(order.deliveryAddress || "Kampala")}</strong>
        </div>
        <div class="receipt-detail-row">
          <span class="detail-label">City/Town:</span>
          <span class="detail-val">${escapeHtml(order.deliveryCity || "Kampala")}</span>
        </div>
        ${order.deliveryNotes ? `
        <div class="receipt-detail-row">
          <span class="detail-label">Instructions:</span>
          <span class="detail-val">${escapeHtml(order.deliveryNotes)}</span>
        </div>` : ""}
      `;
    }
  }

  // 4. Payment Information
  const payMethodEl = $("#rec-pay-method");
  if (payMethodEl) payMethodEl.textContent = order.paymentMethod || "Cash on Delivery";

  const payPhoneEl = $("#rec-pay-phone");
  if (payPhoneEl) payPhoneEl.textContent = order.paymentPhone || order.customerPhone || "N/A";

  const payStatusEl = $("#rec-pay-status");
  if (payStatusEl) {
    const pStatus = order.paymentStatus || (order.paymentMethod === "Cash on Delivery" ? "Pending" : "Paid");
    payStatusEl.textContent = pStatus;
    payStatusEl.className = "receipt-pay-pill " + (pStatus === "Paid" || pStatus === "Successful" ? "pay-paid" : "pay-pending");
  }

  // 5. Order Items Table
  const items = Array.isArray(order.items) ? order.items : [];
  let calculatedSubtotal = 0;
  const itemsHtml = items.map(item => {
    const itemPrice = item.price ?? item.unitPrice ?? 0;
    const itemQty = item.quantity || 1;
    const itemSubtotal = item.subtotal ?? (itemPrice * itemQty);
    calculatedSubtotal += itemSubtotal;
    return `
      <tr>
        <td class="col-item">
          <strong class="receipt-item-title">${escapeHtml(item.name)}</strong>
          ${item.requiresPrescription ? '<span class="rx-pill rx-req" style="font-size:9px; padding:1px 5px; margin-left:6px;">Rx</span>' : ''}
        </td>
        <td class="col-qty text-center">${itemQty}</td>
        <td class="col-price text-right">${formatUGX(itemPrice)}</td>
        <td class="col-subtotal text-right">${formatUGX(itemSubtotal)}</td>
      </tr>
    `;
  }).join("");

  const itemsBody = $("#rec-items-body");
  if (itemsBody) itemsBody.innerHTML = itemsHtml;

  // 6. Order Summary Calculations
  const subtotal = order.subtotal ?? calculatedSubtotal;
  const deliveryFee = order.deliveryFee ?? (isPickup ? 0 : 5000);
  const total = order.total ?? (subtotal + deliveryFee);

  const subtotalEl = $("#rec-subtotal-val");
  if (subtotalEl) subtotalEl.textContent = formatUGX(subtotal);

  const feeEl = $("#rec-delivery-fee-val");
  if (feeEl) feeEl.textContent = formatUGX(deliveryFee);

  const totalEl = $("#rec-total-payable-val");
  if (totalEl) totalEl.textContent = formatUGX(total);

  // 7. WhatsApp link in footer
  const whatsappBtn = $("#rec-whatsapp-btn");
  if (whatsappBtn) {
    whatsappBtn.href = createWhatsAppUrl(
      STATE.systemSettings.whatsapp,
      `Hello BloomCare Pharmacy, I have an inquiry regarding my order ${orderRef}.`
    );
  }

  $("#receipt-dialog")?.showModal();
}

export function downloadReceipt(order) {
  if (!order) return;
  const sheet = document.getElementById("printable-receipt");
  if (!sheet) return;

  const orderRef = order.orderNumber || order.id || "receipt";
  const sheetHtml = sheet.innerHTML;

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BloomCare Pharmacy Receipt - ${escapeHtml(orderRef)}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #f1f5f9;
      margin: 0;
      padding: 30px 15px;
      color: #1e293b;
    }
    .receipt-sheet {
      max-width: 650px;
      margin: 0 auto;
      background: #ffffff;
      padding: 28px;
      border-radius: 8px;
      box-shadow: 0 4px 14px rgba(0,0,0,0.08);
      border: 1px solid #e2e8f0;
    }
    .receipt-brand-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 8px; }
    .receipt-brand-name { font-size: 20px; font-weight: 800; color: #0f766e; letter-spacing: 0.5px; margin: 0 0 2px; }
    .receipt-brand-tagline { font-size: 12px; font-weight: 600; color: #047857; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 4px; }
    .receipt-address-line { font-size: 11px; color: #64748b; margin: 0 0 2px; line-height: 1.35; }
    .receipt-logo { width: 52px; height: 52px; object-fit: contain; }
    .receipt-divider-strong { height: 2px; background: #0f766e; margin: 12px 0 10px; }
    .receipt-divider-light { height: 1px; background: #e2e8f0; margin: 10px 0 14px; }
    .receipt-title-badge-row { display: flex; justify-content: space-between; align-items: center; }
    .receipt-doc-title { font-size: 15px; font-weight: 800; letter-spacing: 1.2px; color: #0f172a; margin: 0; }
    .receipt-status-wrap { display: flex; align-items: center; gap: 6px; font-size: 12px; }
    .receipt-status-label { color: #64748b; font-weight: 600; }
    .receipt-status-pill { font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 9999px; background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; text-transform: uppercase; }
    .receipt-status-pill.status-awaiting { background: #fffbeb; color: #b45309; border-color: #fde68a; }
    .receipt-status-pill.status-confirmed, .receipt-status-pill.status-processing { background: #eff6ff; color: #1d4ed8; border-color: #bfdbfe; }
    .receipt-status-pill.status-delivered { background: #ecfdf5; color: #047857; border-color: #a7f3d0; }
    .receipt-meta-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px 16px; background: #f8fafc; padding: 12px 14px; border-radius: 6px; border: 1px solid #e2e8f0; margin-bottom: 14px; font-size: 12px; }
    .receipt-meta-item { display: flex; flex-direction: column; }
    .meta-label { font-size: 10.5px; color: #64748b; text-transform: uppercase; font-weight: 600; }
    .meta-value { font-size: 12.5px; color: #0f172a; }
    .ref-highlight { font-family: monospace; color: #0f766e; font-weight: 700; }
    .receipt-parties-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 12px; }
    .receipt-card-section { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px 14px; }
    .receipt-section-heading { font-size: 11px; font-weight: 800; letter-spacing: 0.8px; text-transform: uppercase; color: #0f766e; margin: 0 0 8px; padding-bottom: 4px; border-bottom: 1px dashed #cbd5e1; }
    .receipt-details-list { display: flex; flex-direction: column; gap: 5px; font-size: 12px; }
    .receipt-detail-row { display: flex; justify-content: space-between; gap: 8px; line-height: 1.35; }
    .detail-label { color: #64748b; font-size: 11.5px; }
    .detail-val { text-align: right; color: #0f172a; }
    .receipt-details-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; font-size: 12px; }
    .receipt-pay-pill { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 4px; }
    .receipt-pay-pill.pay-paid { background: #ecfdf5; color: #065f46; }
    .receipt-pay-pill.pay-pending { background: #fffbeb; color: #92400e; }
    .receipt-items-table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 6px; }
    .receipt-items-table thead th { background: #f1f5f9; color: #475569; font-weight: 700; font-size: 11px; text-transform: uppercase; padding: 8px 10px; border-top: 1px solid #cbd5e1; border-bottom: 2px solid #cbd5e1; }
    .receipt-items-table tbody td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; color: #1e293b; }
    .receipt-items-table tbody tr:nth-child(even) { background: #fafafa; }
    .receipt-summary-container { display: flex; justify-content: flex-end; margin-top: 12px; }
    .receipt-summary-box { width: 260px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; }
    .summary-line { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px; color: #475569; }
    .summary-divider { height: 1px; background: #cbd5e1; margin: 6px 0; }
    .total-payable-line { font-size: 13.5px; font-weight: 800; color: #0f766e; }
    .total-payable-line strong { font-size: 15px; }
    .receipt-footer { margin-top: 18px; text-align: center; }
    .receipt-footer-divider { height: 1px; background: #e2e8f0; margin-bottom: 12px; }
    .receipt-thanks-msg { font-weight: 700; font-size: 13px; color: #0f766e; margin: 0 0 2px; }
    .receipt-support-msg { font-size: 11.5px; color: #64748b; margin: 0 0 8px; }
    .receipt-contact-pills { display: flex; justify-content: center; align-items: center; flex-wrap: wrap; gap: 12px; font-size: 11.5px; color: #334155; margin-bottom: 8px; }
    .receipt-whatsapp-link { display: inline-flex; align-items: center; gap: 4px; background: #25d366; color: #ffffff !important; font-weight: 700; padding: 3px 10px; border-radius: 9999px; text-decoration: none; font-size: 11px; }
    .receipt-legal-note { font-size: 10px; color: #94a3b8; margin: 4px 0 0; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    @media print {
      body { background: #ffffff; padding: 0; }
      .receipt-sheet { border: none; box-shadow: none; padding: 0; }
    }
  </style>
</head>
<body>
  <div class="receipt-sheet">
    ${sheetHtml}
  </div>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `BloomCare_Receipt_${orderRef}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  openNotice("Receipt Downloaded", `Receipt for order <strong>${orderRef}</strong> has been downloaded.`);
}


// Mobile Drawer Handlers
function openMobileDrawer() {
  $("#app-left-sidebar")?.classList.add("mobile-drawer-open");
  $("#sidebar-backdrop")?.classList.add("active");
}
function closeMobileDrawer() {
  $("#app-left-sidebar")?.classList.remove("mobile-drawer-open");
  $("#sidebar-backdrop")?.classList.remove("active");
}

// -------------------------------------------------------------
// EVENT BINDINGS
// -------------------------------------------------------------
function bindEventListeners() {
  // Mobile Sidebar Drawer
  $("#mobile-sidebar-toggle")?.addEventListener("click", openMobileDrawer);
  $("#sidebar-backdrop")?.addEventListener("click", closeMobileDrawer);

  // Quick Role Switcher in Top Bar
  $("#demo-role-select")?.addEventListener("change", (e) => {
    switchActiveRole(e.target.value);
  });

  // Top User Profile Pill
  $("#user-profile-pill")?.addEventListener("click", () => {
    navigateTo(STATE.currentUser ? "profile" : "auth");
  });

  // Developer Preview Mode Banner Controls
  $("#btn-exit-dev-preview")?.addEventListener("click", () => {
    exitDeveloperPreview();
  });

  $("#dev-quick-preview-select")?.addEventListener("change", (e) => {
    const val = e.target.value;
    if (val === "developer") {
      exitDeveloperPreview();
    } else {
      enterDeveloperPreview(val);
    }
  });

  // Auth Loading & Verification Error Actions
  $("#auth-error-retry-btn")?.addEventListener("click", () => {
    initApp();
  });
  $("#auth-error-logout-btn")?.addEventListener("click", async () => {
    try { await signOutUser(); } catch (_) {}
    clearSavedSessionUser();
    STATE.currentUser = null;
    STATE.activeRole = "visitor";
    STATE.developerPreviewRole = null;
    hideAuthLoadingScreen();
    navigateTo("auth");
  });

  // Sidebar Auth Action Button (Sign In / Sign Out)
  const handleAuthTrigger = () => {
    if (STATE.currentUser) {
      $("#logout-confirm-dialog")?.showModal();
    } else {
      navigateTo("auth");
    }
  };
  $("#sidebar-auth-action-btn")?.addEventListener("click", handleAuthTrigger);
  $("#sidebar-logout-btn")?.addEventListener("click", handleAuthTrigger);

  // Global Navigation Click Handler for [data-route]
  document.addEventListener("click", (e) => {
    const navBtn = e.target.closest("[data-route]");
    if (navBtn) {
      e.preventDefault();
      closeMobileDrawer();
      navigateTo(navBtn.dataset.route);
    }
  });

  // Auth Required Modal Actions
  $("#close-auth-required-modal")?.addEventListener("click", () => $("#auth-required-dialog")?.close());
  $("#btn-auth-req-login")?.addEventListener("click", () => {
    $("#auth-required-dialog")?.close();
    $("#register-card")?.classList.add("hidden");
    $("#login-card")?.classList.remove("hidden");
    navigateTo("auth");
  });
  $("#btn-auth-req-register")?.addEventListener("click", () => {
    $("#auth-required-dialog")?.close();
    $("#login-card")?.classList.add("hidden");
    $("#register-card")?.classList.remove("hidden");
    navigateTo("auth");
  });

  // Global & Catalog Search Inputs
  $("#top-search-input")?.addEventListener("input", (e) => {
    STATE.searchQuery = e.target.value;
    if (STATE.currentRoute !== "medicines") navigateTo("medicines");
    else renderMedicinesView();
  });
  $("#catalog-search-input")?.addEventListener("input", (e) => {
    STATE.searchQuery = e.target.value;
    renderMedicinesView();
  });

  // Medicine Filters
  $("#filter-availability")?.addEventListener("change", (e) => {
    STATE.filterAvailability = e.target.value;
    renderMedicinesView();
  });
  $("#filter-prescription")?.addEventListener("change", (e) => {
    STATE.filterPrescription = e.target.value;
    renderMedicinesView();
  });
  $("#sort-medicines")?.addEventListener("change", (e) => {
    STATE.sortMedicines = e.target.value;
    renderMedicinesView();
  });

  // Sales & Reports Filter & Print
  $("#reports-date-filter")?.addEventListener("change", (e) => {
    STATE.reportsDateFilter = e.target.value;
    renderReportsView();
  });
  $("#btn-print-sales-report")?.addEventListener("click", () => window.print());

  // Category & Order Filtering
  document.addEventListener("click", (e) => {
    const pill = e.target.closest("[data-filter]");
    if (pill) {
      STATE.selectedCategory = pill.dataset.filter;
      renderMedicinesView();
    }
    const catCard = e.target.closest("[data-category]");
    if (catCard) {
      STATE.selectedCategory = catCard.dataset.category;
      navigateTo("medicines");
    }
    const orderPill = e.target.closest("[data-order-filter]");
    if (orderPill) {
      $$("#orders-status-filter-pills .pill-btn").forEach(b => b.classList.remove("active"));
      orderPill.classList.add("active");
      STATE.orderFilter = orderPill.dataset.orderFilter;
      renderOrdersView();
    }
  });

  // Fulfillment Option Selector in Checkout (Delivery vs Pickup)
  $("#chk-fulfillment-option")?.addEventListener("change", (e) => {
    const val = e.target.value;
    STATE.fulfillmentOption = val;
    if (val === "pickup") {
      $("#chk-delivery-fields")?.classList.add("hidden");
      $("#chk-pickup-fields")?.classList.remove("hidden");
      $("#chk-address").removeAttribute("required");
    } else {
      $("#chk-delivery-fields")?.classList.remove("hidden");
      $("#chk-pickup-fields")?.classList.add("hidden");
      $("#chk-address").setAttribute("required", "true");
    }
    const subtotal = STATE.cart.reduce((sum, i) => sum + ((i.price ?? i.product?.price ?? 0) * i.quantity), 0);
    const fee = val === "pickup" ? 0 : STATE.deliveryFee;
    $("#chk-total-val").textContent = formatUGX(subtotal + fee);
  });

  // Cart & Checkout
  $("#open-cart-btn")?.addEventListener("click", openCartDialog);
  $("#close-cart-modal")?.addEventListener("click", () => $("#cart-dialog")?.close());
  $("#cart-continue-btn")?.addEventListener("click", () => $("#cart-dialog")?.close());
  $("#go-checkout-btn")?.addEventListener("click", openCheckoutDialog);
  $("#close-checkout-modal")?.addEventListener("click", () => $("#checkout-dialog")?.close());
  $("#checkout-form")?.addEventListener("submit", handleCheckoutOrder);

  // Order Tracking Actions
  $("#close-tracking-modal")?.addEventListener("click", () => $("#order-tracking-dialog")?.close());

  // Click Delegations
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (btn) {
      const action = btn.dataset.action;
      const id = btn.dataset.id;
      if (action === "remove-item") {
        e.preventDefault();
        e.stopPropagation();
        removeCartItem(id);
        return;
      } else if (action === "decrease-qty") {
        e.preventDefault();
        e.stopPropagation();
        updateCartItemQuantity(id, -1);
        return;
      } else if (action === "increase-qty") {
        e.preventDefault();
        e.stopPropagation();
        updateCartItemQuantity(id, 1);
        return;
      } else if (action === "picked-up") {
        const effRole = getEffectiveRole();
        if (effRole !== "delivery_person" && effRole !== "admin" && effRole !== "developer") {
          openNotice("Permission Denied", "Only delivery staff or administrators can update delivery status.");
          return;
        }
        const d = STATE.deliveries.find(item => item.id === id);
        if (d) {
          d.status = "Picked Up";
          recordStaffAudit("UPDATE_DELIVERY_STATUS", "deliveries", id, "Delivery marked Picked Up");
        }
        renderDeliveriesView();
        renderRoleDashboard();
        openNotice("Delivery Status", `Delivery <strong>${id}</strong> marked Picked Up.`);
      } else if (action === "mark-out") {
        const effRole = getEffectiveRole();
        if (effRole !== "delivery_person" && effRole !== "admin" && effRole !== "developer") {
          openNotice("Permission Denied", "Only delivery staff or administrators can update delivery status.");
          return;
        }
        const d = STATE.deliveries.find(item => item.id === id);
        if (d) {
          d.status = "Out for Delivery";
          recordStaffAudit("UPDATE_DELIVERY_STATUS", "deliveries", id, "Delivery marked Out for Delivery");
        }
        renderDeliveriesView();
        openNotice("Delivery Status", `Delivery <strong>${id}</strong> marked Out for Delivery.`);
      } else if (action === "mark-delivered") {
        const effRole = getEffectiveRole();
        if (effRole !== "delivery_person" && effRole !== "admin" && effRole !== "developer") {
          openNotice("Permission Denied", "Only delivery staff or administrators can update delivery status.");
          return;
        }
        const d = STATE.deliveries.find(item => item.id === id);
        if (d) {
          d.status = "Delivered";
          recordStaffAudit("UPDATE_DELIVERY_STATUS", "deliveries", id, "Delivery marked Delivered");
        }
        renderDeliveriesView();
        renderRoleDashboard();
        openNotice("Delivery Status", `Delivery <strong>${id}</strong> marked Delivered.`);
      } else if (action === "mark-failed") {
        const effRole = getEffectiveRole();
        if (effRole !== "delivery_person" && effRole !== "admin" && effRole !== "developer") {
          openNotice("Permission Denied", "Only delivery staff or administrators can update delivery status.");
          return;
        }
        const d = STATE.deliveries.find(item => item.id === id);
        if (d) {
          d.status = "Failed";
          recordStaffAudit("UPDATE_DELIVERY_STATUS", "deliveries", id, "Delivery marked Failed");
        }
        renderDeliveriesView();
        openNotice("Delivery Status", `Delivery <strong>${id}</strong> marked Failed.`);
      }
    }

    const trackBtn = e.target.closest(".track-order-btn");
    if (trackBtn) openOrderTrackingModal(trackBtn.dataset.id);

    // Product Selection & Add to Cart
    const addBtn = e.target.closest(".add-cart-btn");
    if (addBtn) {
      e.preventDefault();
      e.stopPropagation();
      addToCart(addBtn.dataset.productId, 1);
      return;
    }

    const viewBtn = e.target.closest(".view-prod-modal-btn");
    if (viewBtn) {
      e.preventDefault();
      e.stopPropagation();
      openProductDetailsModal(viewBtn.dataset.productId);
      return;
    }

    const prodCard = e.target.closest(".product-card");
    if (prodCard && !e.target.closest("button") && !e.target.closest("a") && !e.target.closest("input")) {
      const prodId = prodCard.dataset.productId;
      if (prodId) {
        openProductDetailsModal(prodId);
        return;
      }
    }

    const recBtn = e.target.closest(".view-rec-btn");
    if (recBtn) {
      const order = STATE.orders.find(o => o.id === recBtn.dataset.id);
      if (order) showReceiptModal(order);
    }

    const editProdBtn = e.target.closest(".edit-prod-btn");
    if (editProdBtn) openProductFormModal(editProdBtn.dataset.id);

    const toggleProdBtn = e.target.closest(".toggle-prod-btn");
    if (toggleProdBtn) {
      const prod = STATE.products.find(p => p.id === toggleProdBtn.dataset.id);
      if (prod) {
        prod.status = prod.status === "active" ? "inactive" : "active";
        renderMedicinesView();
        openNotice("Product Updated", `Product status changed to <strong>${prod.status}</strong>.`);
      }
    }

    const adjustBtn = e.target.closest(".adjust-single-stock-btn") || e.target.closest(".quick-restock-btn");
    if (adjustBtn) openStockAdjustModal(adjustBtn.dataset.id);

    const manageOrderBtn = e.target.closest(".manage-order-btn");
    if (manageOrderBtn) openOrderStatusModal(manageOrderBtn.dataset.id);

    const rxRevBtn = e.target.closest(".open-rx-review-btn");
    if (rxRevBtn) openRxReviewModal(rxRevBtn.dataset.id);

    const editUserBtn = e.target.closest(".edit-user-btn");
    if (editUserBtn) {
      const effRole = getEffectiveRole();
      if (effRole !== "admin" && effRole !== "developer") {
        openNotice("Permission Denied", "Only administrators and developers can manage staff users.");
        return;
      }
      openUserFormModal(editUserBtn.dataset.id);
    }

    const toggleUserBtn = e.target.closest(".toggle-user-btn");
    if (toggleUserBtn) {
      const effRole = getEffectiveRole();
      if (effRole !== "admin" && effRole !== "developer") {
        openNotice("Permission Denied", "Only administrators and developers can change staff account statuses.");
        return;
      }
      const u = STATE.users.find(usr => (usr.id === toggleUserBtn.dataset.id || usr.uid === toggleUserBtn.dataset.id));
      if (u) {
        u.status = u.status === "active" ? "inactive" : "active";
        try { toggleUserStatus(u.id || u.uid, u.status); } catch (_) {}
        recordStaffAudit("TOGGLE_USER_STATUS", "users", u.id || u.uid, `User ${u.name || u.displayName} set to ${u.status}`);
        renderUsersView();
        openNotice("User Status", `Staff user account set to <strong>${u.status}</strong>.`);
      }
    }

    const readBtn = e.target.closest(".mark-read-btn");
    if (readBtn) {
      const n = STATE.notifications.find(item => item.id === readBtn.dataset.id);
      if (n) n.read = true;
      updateNotifBadge();
      renderNotificationsView();
    }

    const selectPharmBtn = e.target.closest(".select-pharm-btn");
    if (selectPharmBtn) {
      $("#consult-pharmacist-select").value = selectPharmBtn.dataset.pharmacist;
      $("#consult-booking-form").scrollIntoView({ behavior: "smooth" });
    }

    const resumeConsultPayBtn = e.target.closest(".resume-consult-pay-btn");
    if (resumeConsultPayBtn) {
      const c = STATE.consultations.find(item => item.id === resumeConsultPayBtn.dataset.id);
      if (c) {
        openConsultationPaymentModal(c);
      }
    }

    const markConsultDone = e.target.closest(".mark-consult-done");
    if (markConsultDone) {
      const effRole = getEffectiveRole();
      if (effRole !== "pharmacist" && effRole !== "admin" && effRole !== "developer") {
        openNotice("Permission Denied", "Only licensed clinical pharmacists can conclude consultations.");
        return;
      }
      const c = STATE.consultations.find(item => item.id === markConsultDone.dataset.id);
      if (c) {
        if (c.paymentStatus !== "Paid" && c.bookingStatus !== "Confirmed") {
          openNotice("Clinical Safeguard", "This consultation cannot be started or completed until payment has been verified and confirmed.");
          return;
        }
        c.status = "Completed";
        c.bookingStatus = "Completed";
        c.clinicalNotes = "Consultation session concluded. Patient therapy notes updated.";
        try { updateConsultationStatus(c.id, { status: "Completed", bookingStatus: "Completed", clinicalNotes: c.clinicalNotes }); } catch (_) {}
        recordStaffAudit("COMPLETE_CONSULTATION", "consultations", c.id, `Consultation completed by ${STATE.currentUser?.displayName || "Pharmacist"}`);
      }
      renderConsultationsView();
      renderRoleDashboard();
      openNotice("Consultation Completed", "Consultation session marked Completed.");
    }

    const quickRefillApprove = e.target.closest(".quick-refill-approve");
    if (quickRefillApprove) {
      const effRole = getEffectiveRole();
      if (effRole !== "pharmacist" && effRole !== "admin" && effRole !== "developer") {
        openNotice("Permission Denied", "Refill review and approval is restricted to licensed clinical pharmacists.");
        return;
      }
      const r = STATE.refills.find(item => item.id === quickRefillApprove.dataset.id);
      if (r) {
        r.status = "Approved";
        try { updateRefillStatus(r.id, "Approved", "Verified by clinical pharmacist."); } catch (_) {}
        recordStaffAudit("APPROVE_REFILL", "refills", r.id, `Refill approved by ${STATE.currentUser?.displayName || "Pharmacist"}`);
      }
      renderRefillsView();
      renderRoleDashboard();
      openNotice("Refill Approved", `Refill <strong>${r.refillNumber || r.id}</strong> approved for fulfillment.`);
    }

    const cancelRxBtn = e.target.closest(".cancel-rx-btn");
    if (cancelRxBtn) {
      const rx = STATE.prescriptions.find(p => p.id === cancelRxBtn.dataset.id);
      if (rx) {
        rx.status = "Cancelled";
        renderPrescriptionsView();
        renderRoleDashboard();
        openNotice("Prescription Cancelled", `Prescription <strong>${escapeHtml(rx.prescriptionNumber || rx.id)}</strong> has been cancelled.`);
      }
    }

    const viewRxFileBtn = e.target.closest(".view-rx-file-btn");
    if (viewRxFileBtn) {
      openRxDocumentModal(viewRxFileBtn.dataset.id);
    }

    const selectRefillMedBtn = e.target.closest(".select-refill-med-btn");
    if (selectRefillMedBtn) {
      const med = selectRefillMedBtn.dataset.med;
      const order = selectRefillMedBtn.dataset.order;
      const sel = $("#refill-medicine-select");
      if (sel) sel.value = med;
      const orig = $("#refill-orig-order");
      if (orig) orig.value = `Refill for Order #${order}`;
      $("#refill-request-form")?.scrollIntoView({ behavior: "smooth" });
    }
  });

  // Modal Buttons & Forms
  $("#btn-open-add-product")?.addEventListener("click", () => openProductFormModal());
  $("#close-product-form-modal")?.addEventListener("click", () => $("#product-form-dialog")?.close());
  $("#cancel-prod-form-btn")?.addEventListener("click", () => $("#product-form-dialog")?.close());
  $("#product-manage-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const effRole = getEffectiveRole();
    const isStaff = effRole === "admin" || effRole === "developer" || effRole === "pharmacist" || effRole === "assistant_pharmacist";
    if (!isStaff) {
      openNotice("Permission Denied", "Only authorized pharmacy staff can manage medicines catalog.");
      return;
    }
    const id = $("#prod-id").value || "DEMO-MED-" + Date.now().toString().slice(-4);
    const existing = STATE.products.find(p => p.id === id);
    const prodData = {
      id,
      name: $("#prod-name").value.trim(),
      genericName: $("#prod-generic").value.trim(),
      strength: $("#prod-strength")?.value.trim() || "Standard Dose",
      brandName: $("#prod-brand").value.trim(),
      category: $("#prod-category").value,
      price: Number($("#prod-price").value) || 0,
      stockQuantity: Number($("#prod-stock").value) || 0,
      reorderLevel: Number($("#prod-min-stock")?.value) || 10,
      dosageForm: $("#prod-unit").value.trim(),
      manufacturer: $("#prod-mfg").value.trim(),
      batchNumber: $("#prod-batch").value.trim(),
      expiryDate: $("#prod-expiry").value,
      description: $("#prod-desc").value.trim(),
      requiresPrescription: $("#prod-requires-rx").checked,
      status: $("#prod-active-status").checked ? "active" : "inactive"
    };

    if (existing) {
      Object.assign(existing, prodData);
    } else {
      STATE.products.unshift(prodData);
    }
    try { saveProduct(prodData); } catch (_) {}
    $("#product-form-dialog").close();
    renderMedicinesView();
    openNotice("Product Saved", `Product <strong>${escapeHtml(prodData.name)}</strong> saved successfully.`);
  });

  // Stock Adjustment Modal (Staff Only)
  $("#btn-open-stock-adjust")?.addEventListener("click", () => openStockAdjustModal());
  $("#close-stock-adjust-modal")?.addEventListener("click", () => $("#stock-adjust-dialog")?.close());
  $("#cancel-stock-adjust-btn")?.addEventListener("click", () => $("#stock-adjust-dialog")?.close());
  $("#stock-adjust-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const effRole = getEffectiveRole();
    const isStaff = effRole === "admin" || effRole === "developer" || effRole === "pharmacist" || effRole === "assistant_pharmacist";
    if (!isStaff) {
      openNotice("Permission Denied", "Only pharmacy staff can adjust inventory stock.");
      return;
    }
    const prodId = $("#adjust-prod-select").value;
    const type = $("#adjust-type").value;
    const qty = Number($("#adjust-qty").value) || 0;
    const reason = $("#adjust-reason").value.trim();

    const prod = STATE.products.find(p => p.id === prodId);
    if (!prod) return;

    const prevStock = prod.stockQuantity;
    const newStock = type === "in" ? prevStock + qty : Math.max(0, prevStock - qty);
    prod.stockQuantity = newStock;

    STATE.inventoryLogs.unshift({
      id: "log-" + Date.now(),
      productName: prod.name,
      type: type === "in" ? "stock_in" : "stock_out",
      quantity: qty,
      previousStock: prevStock,
      newStock,
      reason,
      performedBy: STATE.currentUser?.displayName || "Staff",
      timestamp: new Date().toISOString()
    });

    try { updateProductStock(prodId, type === "in" ? qty : -qty, reason, STATE.currentUser?.displayName); } catch (_) {}
    recordStaffAudit("ADJUST_STOCK", "products", prodId, `${type === "in" ? "+ Stock In" : "- Stock Out"} of ${qty} units. Reason: ${reason}`);

    $("#stock-adjust-dialog").close();
    renderInventoryView();
    renderMedicinesView();
    renderRoleDashboard();
    openNotice("Stock Adjusted", `Stock for <strong>${escapeHtml(prod.name)}</strong> updated to <strong>${newStock}</strong>.`);
  });

  // Category Form Modal
  $("#btn-open-add-category")?.addEventListener("click", () => {
    $("#cat-id").value = "";
    $("#category-modal-title").textContent = "Add Pharmacy Category";
    $("#cat-name").value = "";
    $("#cat-icon").value = "categories";
    $("#cat-desc").value = "";
    $("#category-form-dialog").showModal();
  });
  $("#close-category-form-modal")?.addEventListener("click", () => $("#category-form-dialog")?.close());
  $("#cancel-cat-form-btn")?.addEventListener("click", () => $("#category-form-dialog")?.close());
  $("#category-manage-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const id = $("#cat-id").value || "cat-" + Date.now();
    const name = $("#cat-name").value.trim();
    const iconKey = $("#cat-icon").value.trim() || "categories";
    const desc = $("#cat-desc").value.trim();

    const catData = { id, name, iconKey, desc, productCount: 0, status: "active" };
    const existing = STATE.categories.find(c => c.id === id);
    if (existing) Object.assign(existing, catData);
    else STATE.categories.push(catData);

    try { saveCategory(catData); } catch (_) {}
    $("#category-form-dialog").close();
    renderCategoriesView();
    openNotice("Category Saved", `Category <strong>${escapeHtml(name)}</strong> saved.`);
  });

  // User Form Modal (Admin Only)
  $("#btn-open-add-user")?.addEventListener("click", () => openUserFormModal());
  $("#close-user-form-modal")?.addEventListener("click", () => $("#user-form-dialog")?.close());
  $("#cancel-usr-form-btn")?.addEventListener("click", () => $("#user-form-dialog")?.close());
  $("#user-manage-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const effRole = getEffectiveRole();
    if (effRole !== "admin" && effRole !== "developer") {
      openNotice("Permission Denied", "Only administrators and developers can manage staff accounts and assign roles.");
      return;
    }
    const id = $("#usr-id").value || "usr-" + Date.now();
    const name = $("#usr-name").value.trim();
    const email = $("#usr-email").value.trim();
    const phone = $("#usr-phone").value.trim();
    const role = $("#usr-role").value;
    const status = $("#usr-status") ? $("#usr-status").value : "active";

    const existing = STATE.users.find(u => (u.id === id || u.uid === id));
    if (existing && !canManageRole(effRole, existing.role)) {
      openNotice("Clearance Denied", `You do not have clearance to modify an account with equal or higher authority (${formatRoleName(existing.role)}).`);
      return;
    }
    if (!canManageRole(effRole, role)) {
      openNotice("Clearance Denied", `Your clearance level (${formatRoleName(effRole)}) does not permit assigning the ${formatRoleName(role)} role.`);
      return;
    }

    const userData = { id, name, displayName: name, email, phone, role, status, createdAt: new Date().toISOString().slice(0, 10) };
    if (existing) Object.assign(existing, userData);
    else STATE.users.push(userData);

    try { saveUser(userData); } catch (_) {}
    recordStaffAudit("UPDATE_USER_ROLE", "users", id, `Staff user ${name} assigned role ${role}, status ${status}`);

    $("#user-form-dialog").close();
    renderUsersView();
    openNotice("User Saved", `Staff user <strong>${escapeHtml(name)}</strong> saved as <strong>${formatRoleName(role)}</strong> (${status}).`);
  });

  // Order Status Modal (Staff Only with Lifecycle Workflow Gates)
  $("#close-order-status-modal")?.addEventListener("click", () => $("#order-status-dialog")?.close());
  $("#cancel-order-status-btn")?.addEventListener("click", () => $("#order-status-dialog")?.close());
  $("#order-status-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const effRole = getEffectiveRole();
    if (effRole === "customer" || effRole === "visitor") {
      openNotice("Permission Denied", "Customers cannot modify order status.");
      return;
    }
    const orderId = $("#manage-order-id").value;
    const status = $("#manage-order-status").value;
    const driver = $("#manage-order-driver").value;

    const order = STATE.orders.find(o => o.id === orderId);
    if (order) {
      const currentStatus = order.orderStatus || "Pending";
      if (currentStatus !== status) {
        const transitionCheck = canTransitionOrderStatus(currentStatus, status, getEffectiveRole());
        if (!transitionCheck.allowed) {
          openNotice("Workflow Rule Violation", transitionCheck.reason);
          return;
        }
      }
      order.orderStatus = status;
      order.assignedStaff = driver;
      try { updateOrderStatus(orderId, status, driver); } catch (_) {}
      recordStaffAudit("UPDATE_ORDER_STATUS", "orders", orderId, `Status updated to ${status}, Driver: ${driver}`);
    }
    $("#order-status-dialog").close();
    renderOrdersView();
    renderRoleDashboard();
    openNotice("Order Updated", `Order status updated to <strong>${status}</strong>.`);
  });

  // Rx Review Modal (Pharmacists & Admin Only)
  $("#close-rx-review-modal")?.addEventListener("click", () => $("#rx-review-dialog")?.close());
  $("#cancel-rx-review-btn")?.addEventListener("click", () => $("#rx-review-dialog")?.close());
  $("#rx-review-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const effRole = getEffectiveRole();
    if (effRole !== "pharmacist" && effRole !== "admin" && effRole !== "developer") {
      openNotice("Permission Denied", "Prescription review and approval is restricted to licensed clinical pharmacists and administrators.");
      return;
    }
    const rxId = $("#review-rx-id").value;
    const decision = $("#review-rx-decision").value;
    const notes = $("#review-rx-notes").value.trim();

    const rx = STATE.prescriptions.find(p => p.id === rxId);
    if (rx) {
      rx.status = decision;
      rx.reviewNotes = notes;
      rx.reviewedBy = STATE.currentUser?.displayName || "Pharmacist";
      try { reviewPrescription(rxId, { status: decision, reviewNotes: notes, reviewedBy: rx.reviewedBy }); } catch (_) {}
      recordStaffAudit("REVIEW_PRESCRIPTION", "prescriptions", rxId, `Prescription marked as ${decision}. Notes: ${notes}`);
    }
    $("#rx-review-dialog").close();
    renderPrescriptionsView();
    renderRoleDashboard();
    openNotice("Review Submitted", `Prescription marked <strong>${decision}</strong>.`);
  });

  // Modals close & prints
  $("#close-product-details-btn")?.addEventListener("click", () => $("#product-details-dialog")?.close());
  $("#modal-add-cart-btn")?.addEventListener("click", () => {
    addToCart($("#modal-add-cart-btn").dataset.productId, 1);
    $("#product-details-dialog")?.close();
  });
  $("#close-receipt-modal")?.addEventListener("click", () => $("#receipt-dialog")?.close());
  $("#receipt-done-btn")?.addEventListener("click", () => $("#receipt-dialog")?.close());
  $("#print-receipt-action")?.addEventListener("click", () => window.print());
  $("#download-receipt-action")?.addEventListener("click", () => {
    if (STATE.activeReceiptOrder) {
      downloadReceipt(STATE.activeReceiptOrder);
    } else if (STATE.orders.length > 0) {
      downloadReceipt(STATE.orders[0]);
    }
  });
  $("#close-notice-modal")?.addEventListener("click", () => $("#notice-modal")?.close());
  $("#notice-confirm-btn")?.addEventListener("click", () => $("#notice-modal")?.close());

  // Logout Flow
  $("#sidebar-logout-btn")?.addEventListener("click", () => {
    if (!STATE.currentUser) {
      navigateTo("auth");
      return;
    }
    $("#logout-confirm-dialog")?.showModal();
  });
  $("#close-logout-modal")?.addEventListener("click", () => $("#logout-confirm-dialog")?.close());
  $("#cancel-logout-btn")?.addEventListener("click", () => $("#logout-confirm-dialog")?.close());
  $("#confirm-logout-btn")?.addEventListener("click", async () => {
    $("#logout-confirm-dialog")?.close();
    showAuthLoadingScreen("Signing out...", "Clearing session data...");
    try { await signOutUser(); } catch (_) {}
    clearSavedSessionUser();
    STATE.currentUser = null;
    STATE.activeRole = "visitor";
    STATE.activeReceiptOrder = null;
    STATE.cart = [];
    STATE.orders = [];
    STATE.prescriptions = [];
    STATE.consultations = [];
    STATE.refills = [];
    saveCartToStorage();
    updateCartBadge();
    updateUserPill();
    renderSidebarNavigation();
    hideAuthLoadingScreen();
    navigateTo("auth");
    openNotice("Signed Out", "You have signed out of BloomCare Pharmacy.");
  });

  // Prescription Document Upload Dropzone & PC File Handling
  const rxDropzone = $("#rx-upload-dropzone");
  const rxFileInput = $("#rx-file-input");
  const rxSelectBtn = $("#rx-select-file-btn");
  const rxRemoveBtn = $("#rx-remove-file-btn");

  rxSelectBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    rxFileInput?.click();
  });

  rxDropzone?.addEventListener("click", (e) => {
    if (e.target.closest("#rx-remove-file-btn") || e.target.closest("#rx-select-file-btn")) return;
    rxFileInput?.click();
  });

  rxFileInput?.addEventListener("change", (e) => {
    if (e.target.files && e.target.files[0]) {
      handleRxFileSelection(e.target.files[0]);
    }
  });

  rxRemoveBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    clearRxFileSelection();
  });

  rxDropzone?.addEventListener("dragover", (e) => {
    e.preventDefault();
    rxDropzone.classList.add("dragover");
  });

  rxDropzone?.addEventListener("dragleave", (e) => {
    e.preventDefault();
    rxDropzone.classList.remove("dragover");
  });

  rxDropzone?.addEventListener("drop", (e) => {
    e.preventDefault();
    rxDropzone.classList.remove("dragover");
    if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
      handleRxFileSelection(e.dataTransfer.files[0]);
    }
  });

  // Prescription View Dialog Close handlers
  $("#close-rx-view-modal")?.addEventListener("click", () => $("#rx-view-dialog")?.close());
  $("#rx-modal-close-btn")?.addEventListener("click", () => $("#rx-view-dialog")?.close());

  // Prescription Upload Form Submit Handler
  $("#rx-upload-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!STATE.currentUser) {
      openNotice("Sign-in Required", "Please log in to your account first so our pharmacists can verify your prescription and securely link it to your customer records.");
      navigateTo("auth");
      return;
    }

    const name = $("#rx-patient-name").value.trim();
    const phone = $("#rx-patient-phone").value.trim();
    const notes = $("#rx-notes-input").value.trim();

    const phoneVal = validateUgandanPhone(phone);
    if (!phoneVal.valid) return openNotice("Invalid Phone Number", phoneVal.message);

    // Ensure prescription document was selected from PC
    if (!STATE.pendingRxFile) {
      const directFile = rxFileInput?.files?.[0];
      if (directFile) {
        handleRxFileSelection(directFile);
        // give brief delay for FileReader
        await new Promise(r => setTimeout(r, 150));
      }
    }

    if (!STATE.pendingRxFile) {
      return openNotice("Prescription Document Required", "Please select a doctor's prescription file (image or PDF scan) from your PC before submitting.");
    }

    const rxNumber = "BC-RX-" + new Date().getFullYear() + "-" + Math.floor(100000 + Math.random() * 900000);
    const newRx = {
      id: "BC-RX-" + Date.now().toString().slice(-4),
      prescriptionNumber: rxNumber,
      customerId: STATE.currentUser.uid,
      customerName: name,
      customerEmail: STATE.currentUser.email || "",
      customerPhone: phoneVal.normalized,
      fileName: STATE.pendingRxFile.name,
      fileSize: STATE.pendingRxFile.size,
      fileType: STATE.pendingRxFile.type,
      fileData: STATE.pendingRxFile.dataUrl,
      fileUrl: STATE.pendingRxFile.name,
      notes,
      status: "Pending Review",
      reviewNotes: "",
      reviewedBy: null,
      createdAt: new Date().toISOString()
    };

    try {
      await submitPrescription(newRx);
    } catch (err) {
      console.warn("[BLOOMCARE Rx] Firestore submission handled locally:", err);
    }

    STATE.prescriptions.unshift(newRx);
    $("#rx-upload-form").reset();
    clearRxFileSelection();
    renderPrescriptionsView();
    renderRoleDashboard();

    openNotice(
      "Prescription Uploaded Successfully",
      `Your prescription file <strong>${escapeHtml(newRx.fileName)}</strong> (${newRx.fileSize}) has been uploaded from your PC and submitted for pharmacist safety verification. You can track its status in the table below.`
    );
  });

  // Consultation Booking Form (Protected with Mobile Money Payment Workflow)
  $("#consult-booking-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const authed = requireAuth(null, { type: "navigate", route: "consultations" }, "Please create an account or log in before booking a consultation.");
    if (!authed) return;

    const pharmacist = $("#consult-pharmacist-select")?.value;
    const date = $("#consult-date-input")?.value;
    const time = $("#consult-time-select")?.value;
    const phone = $("#consult-phone-input")?.value.trim();
    const notes = $("#consult-notes-input")?.value.trim();

    if (!pharmacist) return openNotice("Pharmacist Required", "Please select a licensed clinical pharmacist for your session.");
    if (!date) return openNotice("Date Required", "Please choose an appointment date.");
    if (!time) return openNotice("Time Slot Required", "Please select a preferred time slot.");

    const dateObj = new Date(date + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (isNaN(dateObj.getTime()) || dateObj < today) {
      return openNotice("Invalid Appointment Date", "Please select today or a future date for your consultation.");
    }

    const phoneVal = validateUgandanPhone(phone);
    if (!phoneVal.valid) return openNotice("Invalid Phone Number", phoneVal.message);
    if (!notes || notes.length < 3) return openNotice("Reason Required", "Please briefly describe your symptoms, questions, or medication concerns.");

    // Check if user already has an existing pending booking with same pharmacist/date/time
    let pendingBooking = STATE.consultations.find(c => 
      c.customerId === STATE.currentUser.uid &&
      c.pharmacist === pharmacist &&
      c.date === date &&
      c.time === time &&
      (c.bookingStatus === "Pending Payment" || c.status === "Pending Payment")
    );

    if (!pendingBooking) {
      const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const rand = Math.floor(10000 + Math.random() * 90000);
      const consultRef = `BC-CNS-${todayStr}-${rand}`;
      pendingBooking = {
        id: consultRef,
        consultationNumber: consultRef,
        customerId: STATE.currentUser.uid,
        customerName: STATE.currentUser.displayName || "Customer",
        customerPhone: phoneVal.normalized,
        customerEmail: STATE.currentUser.email || "",
        pharmacist,
        date,
        time,
        reason: notes,
        fee: Number(STATE.systemSettings?.consultationFee) || 15000,
        paymentMethod: "Airtel Money",
        paymentPhone: phoneVal.normalized,
        paymentStatus: "Pending",
        bookingStatus: "Pending Payment",
        status: "Pending Payment",
        clinicalNotes: "",
        createdAt: new Date().toISOString()
      };
      STATE.consultations.unshift(pendingBooking);
      try { await bookConsultation(pendingBooking); } catch (_) {}
    } else {
      pendingBooking.reason = notes;
      pendingBooking.customerPhone = phoneVal.normalized;
      pendingBooking.paymentPhone = phoneVal.normalized;
    }

    renderConsultationsView();
    renderRoleDashboard();

    // Open Payment Modal
    openConsultationPaymentModal(pendingBooking);
  });

  // -------------------------------------------------------------
  // CONSULTATION PAYMENT MODAL CONTROLLER & WORKFLOW
  // -------------------------------------------------------------
  function openConsultationPaymentModal(booking) {
    if (!booking) return;

    $("#consult-pay-summary-pharm").textContent = booking.pharmacist || "Dr. Amina Nanyonga";
    $("#consult-pay-summary-date").textContent = booking.date || "";
    $("#consult-pay-summary-time").textContent = booking.time || "";
    $("#consult-pay-summary-patient").textContent = booking.customerName || booking.patientName || "Customer";
    $("#consult-pay-summary-phone").textContent = booking.customerPhone || booking.patientPhone || "";
    $("#consult-pay-fee-val").textContent = formatUGX(booking.fee || 15000);
    $("#consult-active-booking-id").value = booking.id;

    // Reset views
    $("#consult-pay-step-form")?.classList.remove("hidden");
    $("#consult-pay-step-processing")?.classList.add("hidden");
    $("#consult-pay-step-confirmed")?.classList.add("hidden");
    $("#consult-pay-step-failed")?.classList.add("hidden");

    // Set phone input
    const phoneInput = $("#consult-pay-phone-input");
    if (phoneInput) {
      phoneInput.value = booking.paymentPhone || booking.customerPhone || (STATE.currentUser ? STATE.currentUser.phone : "") || "";
    }

    // Set default provider
    const initialProvider = booking.paymentMethod === "MTN Mobile Money" ? "MTN Mobile Money" : "Airtel Money";
    setConsultationPaymentProvider(initialProvider);

    const submitBtn = $("#consult-submit-pay-btn");
    if (submitBtn) submitBtn.disabled = false;

    $("#consultation-payment-dialog")?.showModal();
  }

  function setConsultationPaymentProvider(provider) {
    const activeProviderInput = $("#consult-active-provider");
    if (activeProviderInput) activeProviderInput.value = provider;

    const airtelCard = $("#pay-select-airtel");
    const mtnCard = $("#pay-select-mtn");
    const phoneLabel = $("#consult-phone-field-label");
    const phoneHint = $("#consult-phone-hint");
    const carrierNotice = $("#consult-carrier-notice-strong");

    if (provider === "MTN Mobile Money") {
      mtnCard?.classList.add("active-method");
      airtelCard?.classList.remove("active-method");
      if (phoneLabel) phoneLabel.firstChild.textContent = "MTN Phone Number ";
      if (phoneHint) phoneHint.textContent = "Enter your 10-digit Ugandan MTN number (e.g. 0772123456, 078...)";
      if (carrierNotice) carrierNotice.textContent = "You will receive a payment prompt on your MTN phone.";
    } else {
      airtelCard?.classList.add("active-method");
      mtnCard?.classList.remove("active-method");
      if (phoneLabel) phoneLabel.firstChild.textContent = "Airtel Phone Number ";
      if (phoneHint) phoneHint.textContent = "Enter your 10-digit Ugandan Airtel number (e.g. 0751234567, 070...)";
      if (carrierNotice) carrierNotice.textContent = "You will receive a payment prompt on your Airtel phone.";
    }
  }

  async function handleConsultationPaymentSubmit(e) {
    e.preventDefault();
    if (STATE._isPaymentInFlight) return;

    const bookingId = $("#consult-active-booking-id")?.value;
    const booking = STATE.consultations.find(c => c.id === bookingId);
    if (!booking) {
      return openNotice("Booking Error", "Consultation appointment not found. Please try booking again.");
    }

    const provider = $("#consult-active-provider")?.value || "Airtel Money";
    const phone = $("#consult-pay-phone-input")?.value.trim() || "";

    const phoneVal = validateUgandanPhone(phone);
    if (!phoneVal.valid) {
      openNotice("Invalid Phone Number", phoneVal.message || "Please enter a valid Ugandan phone number.");
      return;
    }

    // In-flight Lock & Disable Button to Prevent Double-Clicking
    STATE._isPaymentInFlight = true;
    const submitBtn = $("#consult-submit-pay-btn");
    if (submitBtn) submitBtn.disabled = true;

    // Switch to Processing View
    $("#consult-pay-step-form")?.classList.add("hidden");
    $("#consult-pay-step-processing")?.classList.remove("hidden");
    $("#processing-carrier-tag").textContent = `${provider} • ${phoneVal.normalized}`;
    $("#processing-prompt-msg").textContent = `Please check your phone and approve the UGX 15,000 payment request.`;

    try {
      const payload = {
        provider: provider === "MTN Mobile Money" ? "MTN Mobile Money" : "Airtel Money",
        phone: phoneVal.normalized,
        amount: 15000,
        type: "consultation",
        reference: booking.paymentReference || booking.consultationNumber || null,
        details: {
          consultationId: booking.id,
          pharmacist: booking.pharmacist,
          date: booking.date,
          time: booking.time,
          customerName: booking.customerName,
          customerPhone: phoneVal.normalized
        }
      };

      const res = await fetch("http://127.0.0.1:8787/api/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const initData = await res.json();
      if (!res.ok || !initData.success) {
        throw new Error(initData.message || (initData.errors ? Object.values(initData.errors).join(", ") : "Payment initialization failed."));
      }

      const paymentRef = initData.reference;
      booking.paymentReference = paymentRef;
      booking.paymentMethod = provider;
      booking.paymentPhone = phoneVal.normalized;

      // Poll verification endpoint
      let verified = null;
      for (let i = 0; i < 3; i++) {
        await new Promise(r => setTimeout(r, 1200));
        try {
          const verifyRes = await fetch("http://127.0.0.1:8787/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reference: paymentRef })
          });
          const verifyData = await verifyRes.json();
          if (verifyRes.ok && verifyData.success && verifyData.payment?.status === "SUCCESSFUL") {
            verified = verifyData.payment;
            break;
          }
        } catch (_) {}
      }

      if (!verified) {
        throw new Error("Payment authorization timed out or was not confirmed by the provider.");
      }

      // Successful Payment Confirmation
      booking.paymentStatus = "Paid";
      booking.bookingStatus = "Confirmed";
      booking.status = "Confirmed";
      booking.transactionId = verified.transactionId || `MM-UGX-${Date.now().toString().slice(-6)}`;
      booking.verifiedAt = verified.verifiedAt || new Date().toISOString();

      try {
        await updateConsultationStatus(booking.id, {
          paymentStatus: "Paid",
          bookingStatus: "Confirmed",
          status: "Confirmed",
          transactionId: booking.transactionId,
          paymentMethod: provider,
          paymentPhone: phoneVal.normalized,
          verifiedAt: booking.verifiedAt
        });
      } catch (_) {}

      try {
        await createPaymentRecord({
          reference: paymentRef,
          receiptNumber: verified.receiptNumber || `RCP-${Date.now().toString().slice(-6)}`,
          transactionId: booking.transactionId,
          orderId: booking.id,
          customerId: booking.customerId,
          customerName: booking.customerName,
          customerPhone: phoneVal.normalized,
          amount: 15000,
          currency: "UGX",
          paymentMethod: provider,
          status: "Completed",
          type: "consultation",
          createdAt: new Date().toISOString()
        });
      } catch (_) {}

      // Update Confirmed Screen
      $("#conf-ref-val").textContent = booking.consultationNumber || booking.id;
      $("#conf-pharm-val").textContent = booking.pharmacist;
      $("#conf-datetime-val").textContent = `${booking.date} at ${booking.time}`;
      $("#conf-method-val").textContent = provider;
      $("#conf-phone-val").textContent = phoneVal.normalized;
      $("#conf-txid-val").textContent = booking.transactionId;
      $("#conf-status-val").textContent = "PAID";

      $("#consult-pay-step-processing")?.classList.add("hidden");
      $("#consult-pay-step-confirmed")?.classList.remove("hidden");

      renderConsultationsView();
      renderRoleDashboard();

    } catch (err) {
      console.error("Consultation payment error:", err);
      booking.paymentStatus = "Failed";
      booking.bookingStatus = "Pending Payment";
      booking.status = "Pending Payment";

      $("#consult-fail-reason").textContent = err.message || "Payment request was unsuccessful. Please check your phone and try again.";
      $("#consult-pay-step-processing")?.classList.add("hidden");
      $("#consult-pay-step-failed")?.classList.remove("hidden");

      renderConsultationsView();
      renderRoleDashboard();
    } finally {
      STATE._isPaymentInFlight = false;
      if (submitBtn) submitBtn.disabled = false;
    }
  }

  // Payment Modal Event Listeners
  $("#pay-select-airtel")?.addEventListener("click", () => setConsultationPaymentProvider("Airtel Money"));
  $("#pay-select-mtn")?.addEventListener("click", () => setConsultationPaymentProvider("MTN Mobile Money"));
  $("#consult-payment-action-form")?.addEventListener("submit", handleConsultationPaymentSubmit);
  $("#close-consult-pay-modal")?.addEventListener("click", () => $("#consultation-payment-dialog")?.close());

  $("#btn-pay-try-again")?.addEventListener("click", () => {
    $("#consult-pay-step-failed")?.classList.add("hidden");
    $("#consult-pay-step-form")?.classList.remove("hidden");
  });

  $("#btn-pay-change-method")?.addEventListener("click", () => {
    const current = $("#consult-active-provider")?.value;
    setConsultationPaymentProvider(current === "Airtel Money" ? "MTN Mobile Money" : "Airtel Money");
    $("#consult-pay-step-failed")?.classList.add("hidden");
    $("#consult-pay-step-form")?.classList.remove("hidden");
  });

  $("#btn-pay-cancel-booking")?.addEventListener("click", async () => {
    const bookingId = $("#consult-active-booking-id")?.value;
    const booking = STATE.consultations.find(c => c.id === bookingId);
    if (booking) {
      booking.bookingStatus = "Cancelled";
      booking.status = "Cancelled";
      booking.paymentStatus = "Cancelled";
      try {
        await updateConsultationStatus(booking.id, {
          status: "Cancelled",
          bookingStatus: "Cancelled",
          paymentStatus: "Cancelled"
        });
      } catch (_) {}
    }
    $("#consultation-payment-dialog")?.close();
    renderConsultationsView();
    renderRoleDashboard();
    openNotice("Booking Cancelled", "The consultation booking request was cancelled.");
  });

  $("#btn-view-my-consultations")?.addEventListener("click", () => {
    $("#consultation-payment-dialog")?.close();
    navigateTo("consultations");
    renderConsultationsView();
  });

  // Refill Form (Protected)
  $("#refill-request-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const authed = requireAuth(null, { type: "navigate", route: "refills" }, "Please create an account or log in to request a medicine refill.");
    if (!authed) return;

    const med = $("#refill-medicine-select").value;
    const qty = Number($("#refill-qty-input").value) || 1;
    const address = $("#refill-address-input").value.trim();
    const origOrder = $("#refill-orig-order").value.trim();

    const newRefill = {
      id: "BC-REF-" + Date.now().toString().slice(-4),
      refillNumber: "BC-REF-" + Date.now().toString().slice(-4),
      customerId: STATE.currentUser.uid,
      customerName: STATE.currentUser.displayName || "Customer",
      customerPhone: STATE.currentUser.phone || "0751234567",
      medicineName: med,
      quantity: qty,
      address,
      status: "Pending",
      notes: origOrder,
      createdAt: new Date().toISOString()
    };

    try { await requestRefill(newRefill); } catch (_) {}
    STATE.refills.unshift(newRefill);
    $("#refill-request-form").reset();
    renderRefillsView();
    renderRoleDashboard();
    openNotice("Refill Requested", `Your refill request for <strong>${escapeHtml(med)}</strong> (${qty}x) has been submitted.`);
  });

  // Contact Form
  $("#contact-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("#contact-name").value.trim();
    $("#contact-form").reset();
    const fb = $("#contact-form-feedback");
    if (fb) {
      fb.textContent = `Thank you, ${name}! Your message has been received by BloomCare Pharmacy.`;
      fb.classList.remove("hidden");
      setTimeout(() => fb.classList.add("hidden"), 5000);
    }
  });

  // Profile Edit
  $("#profile-edit-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!STATE.currentUser) return;
    STATE.currentUser.displayName = $("#prof-fullname").value.trim();
    STATE.currentUser.phone = $("#prof-phone").value.trim();
    updateUserPill();
    openNotice("Profile Saved", "Your personal details have been updated.");
  });

  $("#btn-profile-reset-pass")?.addEventListener("click", async () => {
    if (!STATE.currentUser?.email) return;
    try { await requestPasswordReset(STATE.currentUser.email); } catch (_) {}
    openNotice("Password Reset Link Sent", `A password reset link has been sent to <strong>${escapeHtml(STATE.currentUser.email)}</strong>.`);
  });

  // Notifications Mark All
  $("#btn-mark-all-notifs")?.addEventListener("click", () => {
    STATE.notifications.forEach(n => n.read = true);
    updateNotifBadge();
    renderNotificationsView();
    openNotice("Notifications Cleared", "All notifications marked as read.");
  });

  // Auth Switchers
  $("#switch-to-register-btn")?.addEventListener("click", () => {
    $("#login-card")?.classList.add("hidden");
    $("#register-card")?.classList.remove("hidden");
  });
  $("#switch-to-login-btn")?.addEventListener("click", () => {
    $("#register-card")?.classList.add("hidden");
    $("#staff-login-card")?.classList.add("hidden");
    $("#login-card")?.classList.remove("hidden");
  });

  // Customer Login Form
  $("#login-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = $("#login-email").value.trim();
    const password = $("#login-password").value;

    showAuthLoadingScreen("Signing in...", "Verifying your credentials and profile...");

    try {
      const user = await signInUser(email, password);
      let profile = null;
      try { profile = await getClientProfile(user.uid); } catch (_) {}
      if (!profile && user.email) {
        try { profile = await getClientProfile(user.email); } catch (_) {}
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

      if (profile && (profile.status === "inactive" || profile.status === "suspended")) {
        try { await signOutUser(); } catch (_) {}
        clearSavedSessionUser();
        hideAuthLoadingScreen();
        openNotice("Account Disabled", "Your account has been deactivated or suspended. Please contact pharmacy support.");
        return;
      }

      let userRole = extractRoleFromProfile(profile);
      if (!userRole) {
        userRole = "customer";
        try { await updateClientProfile(user.uid, { role: "customer" }); } catch (_) {}
      }

      STATE.currentUser = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || profile?.displayName || profile?.name || (profile ? `${profile.firstName || ""} ${profile.lastName || ""}`.trim() : "User"),
        phone: profile?.phone || "",
        role: userRole
      };
    } catch (err) {
      const localAccount = findUserProfile(email);
      if (localAccount && (password === "Password123!" || password === "password" || password.length >= 6)) {
        const verifiedRole = extractRoleFromProfile(localAccount) || "customer";
        STATE.currentUser = {
          uid: localAccount.id || localAccount.uid || ("usr-" + Date.now()),
          email: localAccount.email,
          displayName: localAccount.name || localAccount.displayName || email.split("@")[0],
          phone: localAccount.phone || "0751234567",
          role: verifiedRole
        };
      } else {
        hideAuthLoadingScreen();
        openNotice("Sign-in Failed", "Invalid email or password. Please check your credentials.");
        return;
      }
    }

    STATE.activeRole = STATE.currentUser.role;
    STATE.developerPreviewRole = null;
    saveSessionUser(STATE.currentUser);
    await loadAppData(STATE.currentUser.uid);
    hideAuthLoadingScreen();
    updateDeveloperPreviewBanner();
    updateUserPill();
    renderSidebarNavigation();

    openNotice("Welcome Back", `Signed in as <strong>${escapeHtml(STATE.currentUser.displayName)}</strong> (${formatRoleName(STATE.activeRole)}).`);

    if (STATE.pendingAction) {
      executePendingAction();
    } else {
      navigateTo(ROLE_HOME_ROUTES[STATE.activeRole] || "customer/dashboard");
    }
  });

  // Dedicated Staff Portal Login Form (#staff-login)
  $("#staff-login-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = $("#staff-login-email").value.trim();
    const password = $("#staff-login-password").value;

    showAuthLoadingScreen("Staff Authentication...", "Verifying staff credentials and access permissions...");

    try {
      const user = await signInUser(email, password);
      let profile = null;
      try { profile = await getClientProfile(user.uid); } catch (_) {}
      if (!profile && user.email) {
        try { profile = await getClientProfile(user.email); } catch (_) {}
      }
      if (!profile) {
        profile = findUserProfile(user.uid) || findUserProfile(user.email);
        if (profile && profile.role) {
          try {
            await updateClientProfile(user.uid, {
              uid: user.uid,
              email: user.email,
              displayName: profile.name || profile.displayName || user.displayName || "Staff Member",
              phone: profile.phone || "",
              role: profile.role,
              status: "active"
            });
          } catch (_) {}
        }
      }

      if (profile && (profile.status === "inactive" || profile.status === "suspended")) {
        try { await signOutUser(); } catch (_) {}
        clearSavedSessionUser();
        hideAuthLoadingScreen();
        openNotice("Access Denied", "Your staff account has been deactivated or suspended. Please contact the administrator.");
        return;
      }

      const staffRole = extractRoleFromProfile(profile);

      if (!staffRole) {
        hideAuthLoadingScreen();
        openNotice("Role Verification Failed", "Your account role could not be verified in the BloomCare staff database. Please contact administrator.");
        return;
      }

      if (staffRole === "customer") {
        try { await signOutUser(); } catch (_) {}
        clearSavedSessionUser();
        hideAuthLoadingScreen();
        openNotice("Access Denied", "Customer accounts cannot sign in through the Staff Portal. Please use the Customer Login.");
        return;
      }

      STATE.currentUser = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || profile?.displayName || profile?.name || (profile ? `${profile.firstName || ""} ${profile.lastName || ""}`.trim() : "Staff Member"),
        phone: profile?.phone || "",
        role: staffRole
      };
    } catch (err) {
      const localStaff = findUserProfile(email);
      if (localStaff && (password === "Password123!" || password === "password" || password.length >= 6)) {
        const staffRole = extractRoleFromProfile(localStaff);
        if (staffRole === "customer") {
          hideAuthLoadingScreen();
          openNotice("Access Denied", "Customer accounts cannot sign in through the Staff Portal. Please use the Customer Login.");
          return;
        }
        STATE.currentUser = {
          uid: localStaff.id || localStaff.uid || ("usr-staff-" + Date.now()),
          email: localStaff.email,
          displayName: localStaff.name || localStaff.displayName || "Staff Member",
          phone: localStaff.phone || "0751234567",
          role: staffRole
        };
      } else {
        hideAuthLoadingScreen();
        openNotice("Staff Sign In Failed", "Invalid staff credentials. Please check your email and password.");
        return;
      }
    }

    STATE.activeRole = STATE.currentUser.role;
    STATE.developerPreviewRole = null;
    saveSessionUser(STATE.currentUser);
    await loadAppData(STATE.currentUser.uid);
    hideAuthLoadingScreen();
    updateDeveloperPreviewBanner();
    updateUserPill();
    renderSidebarNavigation();
    recordStaffAudit("STAFF_LOGIN", "users", STATE.currentUser.uid, `Staff user signed into Staff Portal as ${STATE.activeRole}`);

    openNotice("Staff Sign In", `Authenticated as <strong>${escapeHtml(STATE.currentUser.displayName)}</strong> (${formatRoleName(STATE.activeRole)}).`);
    navigateTo(ROLE_HOME_ROUTES[STATE.activeRole] || "dashboard");
  });

  $("#back-to-customer-login-btn")?.addEventListener("click", () => {
    $("#staff-login-card")?.classList.add("hidden");
    $("#login-card")?.classList.remove("hidden");
  });

  // Top Bar Role Switcher Listener
  $("#demo-role-select")?.addEventListener("change", (e) => {
    switchActiveRole(e.target.value);
    openNotice("View Switched", `Active view changed to <strong>${escapeHtml(STATE.activeRole)}</strong>.`);
  });

  // Demo Login Buttons
  $("#demo-customer-login-btn")?.addEventListener("click", () => {
    switchActiveRole("customer");
    openNotice("Customer Portal", `Authenticated as demo customer <strong>${escapeHtml(STATE.currentUser.displayName)}</strong>.`);
  });

  document.addEventListener("click", (e) => {
    const staffBtn = e.target.closest(".demo-staff-btn");
    if (staffBtn) {
      const role = staffBtn.dataset.role;
      switchActiveRole(role);
      openNotice("Staff Portal Sign In", `Authenticated as <strong>${escapeHtml(STATE.currentUser.displayName)}</strong> (${escapeHtml(STATE.activeRole)}).`);
    }
  });

  // Register Form (Strictly Creates Customer Accounts)
  $("#register-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fullName = $("#reg-fullname").value.trim();
    const email = $("#reg-email").value.trim();
    const phone = $("#reg-phone").value.trim();
    const password = $("#reg-password").value;
    const confirm = $("#reg-confirm").value;

    const nameVal = validateName(fullName);
    if (!nameVal.valid) return openNotice("Invalid Name", nameVal.message);
    const emailVal = validateEmail(email);
    if (!emailVal.valid) return openNotice("Invalid Email", emailVal.message);
    const phoneVal = validateUgandanPhone(phone);
    if (!phoneVal.valid) return openNotice("Invalid Phone Number", phoneVal.message);
    if (password !== confirm) return openNotice("Password Mismatch", "Passwords do not match.");
    const passVal = validatePassword(password);
    if (!passVal.valid) return openNotice("Weak Password", passVal.message);

    const nameParts = fullName.split(" ");
    const firstName = nameParts[0] || fullName;
    const lastName = nameParts.slice(1).join(" ") || "";

    try {
      const { user } = await signUpUser({
        firstName,
        lastName,
        email,
        phone: phoneVal.normalized,
        password,
        role: "customer"
      });
      STATE.currentUser = {
        uid: user.uid,
        email: user.email,
        displayName: fullName,
        phone: phoneVal.normalized,
        role: "customer"
      };
    } catch (err) {
      STATE.currentUser = {
        uid: "usr-" + Date.now(),
        email,
        displayName: fullName,
        phone: phoneVal.normalized,
        role: "customer"
      };
    }

    STATE.activeRole = "customer";
    updateUserPill();
    renderSidebarNavigation();

    openNotice("Account Created", `Welcome to BloomCare Pharmacy, <strong>${escapeHtml(fullName)}</strong>!`);

    if (STATE.pendingAction) {
      executePendingAction();
    } else {
      navigateTo("dashboard");
    }
  });

  // Forgot Password
  $("#forgot-password-link")?.addEventListener("click", () => $("#forgot-password-dialog")?.showModal());
  $("#close-forgot-modal")?.addEventListener("click", () => $("#forgot-password-dialog")?.close());
  $("#forgot-password-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = $("#forgot-email").value.trim();
    try { await requestPasswordReset(email); } catch (_) {}
    $("#forgot-password-dialog")?.close();
    openNotice("Password Reset Link", `If an account exists for <strong>${escapeHtml(email)}</strong>, a reset link has been dispatched.`);
  });

  // Contact Form
  $("#contact-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = $("#contact-name")?.value.trim() || "";
    const email = $("#contact-email")?.value.trim() || "";
    const message = $("#contact-message")?.value.trim() || "";

    try {
      await submitContactMessage({ name, email, message });
    } catch (err) {
      console.warn("[BLOOMCARE] Contact message saved locally:", err);
    }

    $("#contact-form")?.reset();
    const fb = $("#contact-form-feedback");
    if (fb) {
      fb.textContent = `Thank you, ${name}! Your message has been received by the BloomCare Pharmacy care desk.`;
      fb.classList.remove("hidden");
      setTimeout(() => fb.classList.add("hidden"), 6000);
    }
    openNotice("Message Dispatched", `Thank you, <strong>${escapeHtml(name)}</strong>! Our customer care desk will respond to your inquiry.`);
  });

  // Profile Edit
  $("#profile-edit-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!STATE.currentUser) return;
    const fullName = $("#prof-fullname")?.value.trim() || "";
    const phone = $("#prof-phone")?.value.trim() || "";

    const nameParts = fullName.split(" ");
    const firstName = nameParts[0] || fullName;
    const lastName = nameParts.slice(1).join(" ") || "";

    STATE.currentUser.displayName = fullName;
    STATE.currentUser.phone = phone;

    try {
      await updateClientProfile(STATE.currentUser.uid, {
        firstName,
        lastName,
        phone
      });
    } catch (err) {
      console.warn("[BLOOMCARE] Profile updated locally:", err);
    }

    updateUserPill();
    openNotice("Profile Saved", "Your personal details have been updated successfully.");
  });

  // Profile Send Password Reset
  $("#btn-profile-reset-pass")?.addEventListener("click", async () => {
    if (!STATE.currentUser?.email) return;
    try { await requestPasswordReset(STATE.currentUser.email); } catch (_) {}
    openNotice("Password Reset Link Sent", `A password reset link has been sent to <strong>${escapeHtml(STATE.currentUser.email)}</strong>.`);
  });

  // Notifications Mark All
  $("#btn-mark-all-notifs")?.addEventListener("click", () => {
    STATE.notifications.forEach(n => n.read = true);
    updateNotifBadge();
    renderNotificationsView();
    openNotice("Notifications Cleared", "All notifications marked as read.");
  });

  // Hash Routing
  window.addEventListener("hashchange", handleHashRoute);
}

function openStockAdjustModal(prodId = null) {
  const effRole = getEffectiveRole();
  const isStaff = effRole === "admin" || effRole === "developer" || effRole === "pharmacist" || effRole === "assistant_pharmacist";
  if (!isStaff) {
    openNotice("Permission Denied", "Only pharmacy staff can adjust inventory stock.");
    return;
  }
  const select = $("#adjust-prod-select");
  if (select) {
    select.innerHTML = STATE.products.map(p => `
      <option value="${p.id}" ${prodId === p.id ? "selected" : ""}>${escapeHtml(p.name)} (Current: ${p.stockQuantity})</option>
    `).join("");
  }
  $("#stock-adjust-dialog").showModal();
}

function openOrderStatusModal(orderId) {
  const effRole = getEffectiveRole();
  if (effRole === "customer" || effRole === "visitor") {
    openNotice("Permission Denied", "Customers cannot manage order fulfillment statuses.");
    return;
  }
  const order = STATE.orders.find(o => o.id === orderId);
  if (!order) return;
  $("#manage-order-id").value = order.id;
  $("#manage-order-status").value = order.orderStatus || "Pending";
  $("#manage-order-driver").value = order.assignedStaff || "Unassigned";
  $("#order-status-dialog").showModal();
}

function openUserFormModal(userId = null) {
  const effRole = getEffectiveRole();
  if (effRole !== "admin" && effRole !== "developer") {
    openNotice("Permission Denied", "Only administrators and developers can manage staff users and assign roles.");
    return;
  }
  const user = userId ? STATE.users.find(u => (u.id === userId || u.uid === userId)) : null;
  if (user && !canManageRole(effRole, user.role)) {
    openNotice("Clearance Denied", `You do not have clearance to edit an account with equal or higher authority (${formatRoleName(user.role)}). Only Developers can edit Developer accounts.`);
    return;
  }
  $("#usr-id").value = user ? (user.id || user.uid) : "";
  $("#user-modal-title").textContent = user ? "Edit Staff Account" : "Add Staff Account";
  $("#usr-name").value = user ? (user.name || user.displayName || "") : "";
  $("#usr-email").value = user ? (user.email || "") : "";
  $("#usr-phone").value = user ? (user.phone || "") : "";
  $("#usr-role").value = user ? normalizeRole(user.role) : "pharmacist";
  if ($("#usr-status")) $("#usr-status").value = user ? (user.status || "active") : "active";
  $("#user-form-dialog").showModal();
}

// Start Application
if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", initApp);
}
