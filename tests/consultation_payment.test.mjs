import assert from 'node:assert/strict';
import test from 'node:test';
import { validateProviderPhone, UGANDA_CARRIER_PREFIXES } from '../validators.js';

// 1. Validation Logic
function validateUgandanPhone(phone) {
  if (!phone || typeof phone !== 'string') {
    return { valid: false, message: 'Please enter a valid phone number.' };
  }
  const clean = phone.replace(/[\s\-]/g, '');
  let normalized = '';
  if (/^07\d{8}$/.test(clean)) {
    normalized = clean;
  } else if (/^\+2567\d{8}$/.test(clean)) {
    normalized = '0' + clean.slice(4);
  } else if (/^2567\d{8}$/.test(clean)) {
    normalized = '0' + clean.slice(3);
  } else {
    return { valid: false, message: 'Please enter a valid 10-digit Ugandan phone number (e.g. 0772123456 or 0751234567).' };
  }

  const prefix = normalized.slice(0, 3);
  const airtelPrefixes = ['070', '074', '075'];
  const mtnPrefixes = ['077', '078', '076'];

  let carrier = 'Other';
  if (airtelPrefixes.includes(prefix)) carrier = 'Airtel Money';
  else if (mtnPrefixes.includes(prefix)) carrier = 'MTN Mobile Money';

  return { valid: true, normalized, carrier };
}

function validateConsultationForm({ pharmacist, date, time, phone, notes, fee }) {
  if (!pharmacist || pharmacist.trim().length === 0) {
    return { valid: false, error: 'Pharmacist is required' };
  }
  if (!date) {
    return { valid: false, error: 'Appointment date is required' };
  }
  const dateObj = new Date(date + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (isNaN(dateObj.getTime()) || dateObj < today) {
    return { valid: false, error: 'Appointment date must be today or a future date' };
  }
  if (!time || time.trim().length === 0) {
    return { valid: false, error: 'Time slot is required' };
  }
  const phoneVal = validateUgandanPhone(phone);
  if (!phoneVal.valid) {
    return { valid: false, error: phoneVal.message };
  }
  if (!notes || notes.trim().length < 3) {
    return { valid: false, error: 'Reason for consultation is required (minimum 3 characters)' };
  }
  if (fee !== 15000) {
    return { valid: false, error: 'Consultation fee must be exactly UGX 15,000' };
  }
  return { valid: true, normalizedPhone: phoneVal.normalized, carrier: phoneVal.carrier };
}

function createPendingBooking(existingBookings, { customerId, customerName, pharmacist, date, time, phone, notes, fee = 15000 }) {
  const existing = existingBookings.find(c =>
    c.customerId === customerId &&
    c.pharmacist === pharmacist &&
    c.date === date &&
    c.time === time &&
    (c.bookingStatus === 'Pending Payment' || c.status === 'Pending Payment')
  );

  if (existing) {
    existing.customerPhone = phone;
    existing.paymentPhone = phone;
    existing.reason = notes;
    return { booking: existing, isNew: false };
  }

  const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(10000 + Math.random() * 90000);
  const consultRef = `BC-CNS-${todayStr}-${rand}`;

  const newBooking = {
    id: consultRef,
    consultationNumber: consultRef,
    customerId,
    customerName,
    customerPhone: phone,
    pharmacist,
    date,
    time,
    reason: notes,
    fee,
    paymentMethod: 'Airtel Money',
    paymentPhone: phone,
    paymentStatus: 'Pending',
    bookingStatus: 'Pending Payment',
    status: 'Pending Payment',
    clinicalNotes: '',
    createdAt: new Date().toISOString()
  };

  existingBookings.unshift(newBooking);
  return { booking: newBooking, isNew: true };
}

function confirmConsultationPayment(booking, { paymentMethod, transactionId, receiptNumber }) {
  if (!booking) throw new Error('Booking not found');
  booking.paymentStatus = 'Paid';
  booking.bookingStatus = 'Confirmed';
  booking.status = 'Confirmed';
  booking.paymentMethod = paymentMethod;
  booking.transactionId = transactionId || `MM-UGX-${Date.now().toString().slice(-6)}`;
  booking.receiptNumber = receiptNumber;
  booking.verifiedAt = new Date().toISOString();
  return booking;
}

function checkPharmacistClinicalGate(consultation) {
  if (consultation.paymentStatus !== 'Paid' || consultation.bookingStatus !== 'Confirmed') {
    return { canStart: false, message: 'Consultation can only start after payment is confirmed' };
  }
  return { canStart: true };
}

// -------------------------------------------------------------
// TESTS
// -------------------------------------------------------------

test('validates consultation form with valid inputs and strictly 15,000 UGX fee', () => {
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const validForm = {
    pharmacist: 'Dr. Amina Nanyonga',
    date: tomorrow,
    time: '10:00 AM',
    phone: '0751234567',
    notes: 'Hypertension medication review and side effects',
    fee: 15000
  };

  const res = validateConsultationForm(validForm);
  assert.equal(res.valid, true);
  assert.equal(res.normalizedPhone, '0751234567');
  assert.equal(res.carrier, 'Airtel Money');
});

test('rejects consultation booking with past date or missing fields', () => {
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  
  // Missing pharmacist
  assert.equal(validateConsultationForm({ pharmacist: '', date: tomorrow, time: '10:00 AM', phone: '0751234567', notes: 'Review', fee: 15000 }).valid, false);

  // Past date
  assert.equal(validateConsultationForm({ pharmacist: 'Dr. Amina', date: '2020-01-01', time: '10:00 AM', phone: '0751234567', notes: 'Review', fee: 15000 }).valid, false);

  // Invalid phone number
  assert.equal(validateConsultationForm({ pharmacist: 'Dr. Amina', date: tomorrow, time: '10:00 AM', phone: '12345', notes: 'Review', fee: 15000 }).valid, false);

  // Missing notes/reason
  assert.equal(validateConsultationForm({ pharmacist: 'Dr. Amina', date: tomorrow, time: '10:00 AM', phone: '0751234567', notes: '', fee: 15000 }).valid, false);

  // Incorrect fee
  assert.equal(validateConsultationForm({ pharmacist: 'Dr. Amina', date: tomorrow, time: '10:00 AM', phone: '0751234567', notes: 'Review', fee: 10000 }).valid, false);
});

test('creates pending consultation booking with BC-CNS-YYYYMMDD-XXXXX reference', () => {
  const store = [];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const result = createPendingBooking(store, {
    customerId: 'cust-123',
    customerName: 'Grace Nakato',
    pharmacist: 'Pharm. David Mukasa',
    date: tomorrow,
    time: '02:00 PM',
    phone: '0772123456',
    notes: 'Prescription interaction check',
    fee: 15000
  });

  assert.equal(result.isNew, true);
  assert.match(result.booking.consultationNumber, /^BC-CNS-\d{8}-\d{5}$/);
  assert.equal(result.booking.bookingStatus, 'Pending Payment');
  assert.equal(result.booking.paymentStatus, 'Pending');
  assert.equal(result.booking.fee, 15000);
  assert.equal(store.length, 1);
});

test('prevents duplicate booking creation on retry for the same slot', () => {
  const store = [];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  
  // First attempt
  const first = createPendingBooking(store, {
    customerId: 'cust-123',
    customerName: 'Grace Nakato',
    pharmacist: 'Pharm. David Mukasa',
    date: tomorrow,
    time: '02:00 PM',
    phone: '0772123456',
    notes: 'Initial question',
    fee: 15000
  });

  // Second attempt (e.g. after payment failure or retry)
  const second = createPendingBooking(store, {
    customerId: 'cust-123',
    customerName: 'Grace Nakato',
    pharmacist: 'Pharm. David Mukasa',
    date: tomorrow,
    time: '02:00 PM',
    phone: '0772123456',
    notes: 'Updated question details',
    fee: 15000
  });

  assert.equal(second.isNew, false);
  assert.equal(second.booking.id, first.booking.id);
  assert.equal(second.booking.reason, 'Updated question details');
  assert.equal(store.length, 1, 'Should NOT create duplicate booking');
});

test('transitions pending booking to Paid and Confirmed upon successful payment', () => {
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const { booking } = createPendingBooking([], {
    customerId: 'cust-123',
    customerName: 'Grace Nakato',
    pharmacist: 'Dr. Amina Nanyonga',
    date: tomorrow,
    time: '11:00 AM',
    phone: '0751234567',
    notes: 'Asthma inhaler usage counseling',
    fee: 15000
  });

  assert.equal(booking.bookingStatus, 'Pending Payment');
  assert.equal(booking.paymentStatus, 'Pending');

  confirmConsultationPayment(booking, {
    paymentMethod: 'Airtel Money',
    transactionId: 'MM-UGX-987654',
    receiptNumber: 'RCP-123456'
  });

  assert.equal(booking.bookingStatus, 'Confirmed');
  assert.equal(booking.paymentStatus, 'Paid');
  assert.equal(booking.paymentMethod, 'Airtel Money');
  assert.equal(booking.transactionId, 'MM-UGX-987654');
  assert.ok(booking.verifiedAt);
});

test('clinical safeguard strictly prevents pharmacist from starting/completing unpaid consultations', () => {
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const { booking } = createPendingBooking([], {
    customerId: 'cust-123',
    customerName: 'Grace Nakato',
    pharmacist: 'Dr. Amina Nanyonga',
    date: tomorrow,
    time: '11:00 AM',
    phone: '0751234567',
    notes: 'Pediatric dosing inquiry',
    fee: 15000
  });

  // Unpaid pending booking
  const checkPending = checkPharmacistClinicalGate(booking);
  assert.equal(checkPending.canStart, false);
  assert.match(checkPending.message, /payment is confirmed/i);

  // Confirmed booking
  confirmConsultationPayment(booking, {
    paymentMethod: 'MTN Mobile Money',
    transactionId: 'MM-UGX-112233',
    receiptNumber: 'RCP-654321'
  });

  const checkConfirmed = checkPharmacistClinicalGate(booking);
  assert.equal(checkConfirmed.canStart, true);
});

test('AIRTEL MONEY: validates exactly 10 digits with Airtel prefixes (070, 074, 075) and rejects MTN prefixes', () => {
  // Valid Airtel numbers
  for (const validNum of ['0701234567', '0741234567', '0751234567']) {
    const res = validateProviderPhone('Airtel Money', validNum);
    assert.equal(res.valid, true, `Expected ${validNum} to be valid for Airtel Money`);
    assert.equal(res.carrier, 'Airtel');
    assert.equal(res.message, '✓ Valid Airtel Uganda number');
  }

  // Reject MTN prefixes when Airtel Money selected
  for (const mtnNum of ['0771234567', '0781234567', '0761234567']) {
    const res = validateProviderPhone('Airtel Money', mtnNum);
    assert.equal(res.valid, false, `Expected ${mtnNum} to be rejected for Airtel Money`);
    assert.equal(res.carrierMismatch, true);
    assert.equal(
      res.message,
      'Invalid Airtel number. Please enter a valid Airtel Uganda number beginning with 070, 074 or 075.'
    );
  }

  // Reject incomplete numbers
  const shortRes = validateProviderPhone('Airtel Money', '07512345');
  assert.equal(shortRes.valid, false);
  assert.equal(shortRes.message, 'Please enter a valid 10-digit Ugandan mobile number.');

  // Reject numbers with more than 10 digits
  const longRes = validateProviderPhone('Airtel Money', '075123456789');
  assert.equal(longRes.valid, false);
  assert.equal(longRes.message, 'Phone number cannot exceed 10 digits.');

  // Reject letters and special characters
  const alphaRes = validateProviderPhone('Airtel Money', '075123abcd');
  assert.equal(alphaRes.valid, false);
  assert.equal(alphaRes.message, 'Please enter digits only with no letters or special characters.');

  // Empty number
  const emptyRes = validateProviderPhone('Airtel Money', '');
  assert.equal(emptyRes.valid, false);
  assert.equal(emptyRes.empty, true);
});

test('MTN MOBILE MONEY: validates exactly 10 digits with MTN prefixes (076, 077, 078) and rejects Airtel prefixes', () => {
  // Valid MTN numbers
  for (const validNum of ['0761234567', '0771234567', '0781234567']) {
    const res = validateProviderPhone('MTN Mobile Money', validNum);
    assert.equal(res.valid, true, `Expected ${validNum} to be valid for MTN Mobile Money`);
    assert.equal(res.carrier, 'MTN');
    assert.equal(res.message, '✓ Valid MTN Uganda number');
  }

  // Reject Airtel prefixes when MTN selected
  for (const airtelNum of ['0701234567', '0741234567', '0751234567']) {
    const res = validateProviderPhone('MTN Mobile Money', airtelNum);
    assert.equal(res.valid, false, `Expected ${airtelNum} to be rejected for MTN Mobile Money`);
    assert.equal(res.carrierMismatch, true);
    assert.equal(
      res.message,
      'Invalid MTN number. Please enter a valid MTN Uganda number beginning with 076, 077 or 078.'
    );
  }

  // Reject incomplete numbers
  const shortRes = validateProviderPhone('MTN Mobile Money', '077123');
  assert.equal(shortRes.valid, false);
  assert.equal(shortRes.message, 'Please enter a valid 10-digit Ugandan mobile number.');

  // Reject numbers with more than 10 digits
  const longRes = validateProviderPhone('MTN Mobile Money', '077123456789');
  assert.equal(longRes.valid, false);
  assert.equal(longRes.message, 'Phone number cannot exceed 10 digits.');

  // Reject letters and special characters
  const alphaRes = validateProviderPhone('MTN Mobile Money', '077123TEST');
  assert.equal(alphaRes.valid, false);
  assert.equal(alphaRes.message, 'Please enter digits only with no letters or special characters.');

  // Empty number
  const emptyRes = validateProviderPhone('MTN Mobile Money', '');
  assert.equal(emptyRes.valid, false);
  assert.equal(emptyRes.empty, true);
});

test('SWITCHING PAYMENT METHODS: immediately revalidates entered phone number on provider switch', () => {
  const mtnPhone = '0771234567';

  // Step 1: User types MTN number under MTN
  const mtnInitial = validateProviderPhone('MTN Mobile Money', mtnPhone);
  assert.equal(mtnInitial.valid, true);
  assert.equal(mtnInitial.message, '✓ Valid MTN Uganda number');

  // Step 2: User switches method to Airtel Money -> must immediately fail with Airtel carrier hint
  const switchedToAirtel = validateProviderPhone('Airtel Money', mtnPhone);
  assert.equal(switchedToAirtel.valid, false);
  assert.equal(
    switchedToAirtel.message,
    'Invalid Airtel number. Please enter a valid Airtel Uganda number beginning with 070, 074 or 075.'
  );

  const airtelPhone = '0751234567';

  // Step 3: User enters valid Airtel number under Airtel
  const airtelInitial = validateProviderPhone('Airtel Money', airtelPhone);
  assert.equal(airtelInitial.valid, true);
  assert.equal(airtelInitial.message, '✓ Valid Airtel Uganda number');

  // Step 4: User switches method to MTN Mobile Money -> must immediately fail with MTN carrier hint
  const switchedToMTN = validateProviderPhone('MTN Mobile Money', airtelPhone);
  assert.equal(switchedToMTN.valid, false);
  assert.equal(
    switchedToMTN.message,
    'Invalid MTN number. Please enter a valid MTN Uganda number beginning with 076, 077 or 078.'
  );
});

test('PAYMENT BUTTON GATE: pay button is enabled ONLY when phone and provider pass validation', () => {
  function computeSubmitBtnDisabled(provider, phone) {
    const res = validateProviderPhone(provider, phone);
    return !res.valid;
  }

  // Disabled when empty
  assert.equal(computeSubmitBtnDisabled('Airtel Money', ''), true);
  assert.equal(computeSubmitBtnDisabled('MTN Mobile Money', ''), true);

  // Disabled when incomplete (<10 digits)
  assert.equal(computeSubmitBtnDisabled('Airtel Money', '075123'), true);
  assert.equal(computeSubmitBtnDisabled('MTN Mobile Money', '077123'), true);

  // Disabled when carrier mismatch
  assert.equal(computeSubmitBtnDisabled('Airtel Money', '0771234567'), true);
  assert.equal(computeSubmitBtnDisabled('MTN Mobile Money', '0751234567'), true);

  // Disabled when containing letters
  assert.equal(computeSubmitBtnDisabled('Airtel Money', '075123456a'), true);

  // Enabled ONLY when valid
  assert.equal(computeSubmitBtnDisabled('Airtel Money', '0751234567'), false);
  assert.equal(computeSubmitBtnDisabled('Airtel Money', '0701234567'), false);
  assert.equal(computeSubmitBtnDisabled('MTN Mobile Money', '0771234567'), false);
  assert.equal(computeSubmitBtnDisabled('MTN Mobile Money', '0781234567'), false);
});


