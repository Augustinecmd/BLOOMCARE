import assert from 'node:assert/strict';
import test from 'node:test';
import {
  normalizeUgandanPhone,
  validateUgandanPhone,
  validateEmail,
  validatePassword,
  validateName,
  validateDateOfBirth,
  validateMeasurement,
  validateEmergencyContact,
  validateAppointment,
  validateMedication
} from '../validators.js';

test('accepts and normalizes valid Ugandan phone numbers', () => {
  for (const phone of ['0741592069', '0786426344', '0751234567', '0771234567', '+256741592069', '+256786426344']) {
    assert.equal(validateUgandanPhone(phone).valid, true, phone);
  }
  assert.equal(normalizeUgandanPhone('+256751234567'), '0751234567');
  assert.equal(normalizeUgandanPhone('075 123 4567'), '0751234567');
});

test('rejects invalid Ugandan phone numbers', () => {
  for (const phone of ['074159206', '741592069', '07415920699', '0841592069', '07415ABC69', '074-159-2069', 'abcdefghij']) {
    assert.equal(validateUgandanPhone(phone).valid, false, phone);
  }
});

test('validates email, password, and names with specific rules', () => {
  assert.equal(validateEmail('name@gmail.com').valid, true);
  assert.equal(validateEmail('user@').valid, false);
  assert.equal(validatePassword('Strong9').valid, false);
  assert.equal(validatePassword('StrongPass9!').valid, true);
  assert.equal(validateName('Mary Atim').valid, true);
  assert.equal(validateName("Anne-Marie O'Kello").valid, true);
  assert.equal(validateName('12345').valid, false);
});

test('rejects future birth dates and malformed measurements', () => {
  assert.equal(validateDateOfBirth('2999-01-01').valid, false);
  assert.equal(validateMeasurement({ weight: '70', temperature: '37', systolic: '110', diastolic: '80' }).valid, true);
  assert.equal(validateMeasurement({ weight: '-1', temperature: '90', systolic: '80', diastolic: '100' }).valid, false);
});

test('validates emergency contacts, appointments, and medications', () => {
  assert.equal(validateEmergencyContact({ name: 'Mary Atim', phone: '0751234567', relationship: 'Parent' }).valid, true);
  assert.equal(validateEmergencyContact({ name: '123', phone: '074159206', relationship: '' }).valid, false);
  assert.equal(validateAppointment({ date: '2999-01-01', time: '10:30', provider: 'Dr A', facility: 'Clinic' }).valid, true);
  assert.equal(validateMedication({ name: 'Iron', instructions: 'One tablet daily', reminderTime: '08:00' }).valid, true);
  assert.equal(validateMedication({ name: '', instructions: '', reminderTime: '25:00' }).valid, false);
});
