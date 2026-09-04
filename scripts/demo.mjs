/**
 * BloomCare Pharmacy Management System - CLI Diagnostic & Test Runner
 */
import http from 'node:http';
import {
  normalizeUgandanPhone,
  validateUgandanPhone,
  validateEmail,
  validatePassword,
  validateProduct,
  validateOrder,
  validatePrescription
} from '../validators.js';
import { createWhatsAppUrl } from '../whatsapp.js';

console.log('====================================================');
console.log('  BLOOMCARE PHARMACY - SYSTEM DIAGNOSTICS & AUDIT   ');
console.log('====================================================\n');

// 1. Phone & Auth Validation
console.log('1. Testing Ugandan Mobile Money Phone Validation:');
const testPhones = ['0772123456', '+256751234567', '0786426344', 'invalid-phone'];
for (const p of testPhones) {
  const res = validateUgandanPhone(p);
  console.log(`   - ${p.padEnd(16)} -> Valid: ${String(res.valid).padEnd(5)} (Normalized: ${res.normalized || 'N/A'})`);
}

// 2. Product Catalog & Inventory Checks
console.log('\n2. Testing Product Catalog & Price Rules:');
const sampleProducts = [
  { name: 'Panadol Extra 500mg', category: 'Pain Relief', price: 6500, stockQuantity: 120 },
  { name: 'Amoxicillin 500mg', category: 'Antibiotics & Infections', price: 18000, stockQuantity: 45, requiresPrescription: true },
  { name: 'Digital Blood Pressure Monitor', category: 'Medical Devices', price: 185000, stockQuantity: 14 }
];
for (const prod of sampleProducts) {
  const val = validateProduct(prod);
  console.log(`   - ${prod.name.padEnd(30)} [${prod.category}] -> Valid: ${val.valid} (Price: UGX ${prod.price.toLocaleString()})`);
}

// 3. Cart & Order Validation
console.log('\n3. Testing Cart Order & Prescription Verification:');
const orderSample = {
  customerName: 'Grace Nakato',
  customerPhone: '0751234567',
  deliveryAddress: 'Bukoto, Plot 14, Kampala',
  items: sampleProducts,
  total: 209500
};
const orderVal = validateOrder(orderSample);
console.log(`   - Order Validation: ${orderVal.valid ? 'PASSED (Ready for Checkout)' : 'FAILED'}`);

const rxSample = { customerId: 'user-001', notes: 'Amoxicillin 500mg TDS x 5 days' };
const rxVal = validatePrescription(rxSample);
console.log(`   - Prescription Validation: ${rxVal.valid ? 'PASSED (Sent to Pharmacist Queue)' : 'FAILED'}`);

// 4. WhatsApp Gateway
console.log('\n4. Testing WhatsApp Customer Support Integration:');
const waUrl = createWhatsAppUrl('256750210886', 'Hello BloomCare Pharmacy, I would like to make an inquiry.');
console.log(`   - Configured Link: ${waUrl}`);

// 5. Payment API Probe
console.log('\n5. Probing Local Pharmacy Payment API Server (port 8787)...');
const req = http.get('http://127.0.0.1:8787/health', (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    try {
      const data = JSON.parse(body);
      console.log(`   - Payment API Status: ${res.statusCode === 200 ? 'ONLINE 🟢' : 'OFFLINE 🔴'} (${data.service})`);
      console.log('\n====================================================');
      console.log('  ALL PHARMACY DIAGNOSTICS COMPLETED SUCCESSFULLY!  ');
      console.log('====================================================\n');
    } catch {
      console.log('   - Non-JSON response from Payment API.');
    }
  });
});
req.on('error', (err) => {
  console.log(`   - Payment API Offline or Starting: ${err.message}`);
  console.log('\n====================================================');
  console.log('  DIAGNOSTICS COMPLETED (Start API via run-dev.js)  ');
  console.log('====================================================\n');
});
