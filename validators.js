const UGANDAN_LOCAL_PHONE = /^07[0-9]{8}$/;
const UGANDAN_INTERNATIONAL_PHONE = /^\+2567[0-9]{8}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_PATTERN = /^\p{L}+(?:[ '-]\p{L}+)*$/u;

export function normalizeUgandanPhone(value) {
  const phone = String(value ?? '').trim().replace(/[ \t]/g, '');
  if (UGANDAN_INTERNATIONAL_PHONE.test(phone)) {
    return `0${phone.slice(4)}`;
  }
  return phone;
}

export function validateUgandanPhone(value) {
  const normalized = normalizeUgandanPhone(value);
  return {
    valid: UGANDAN_LOCAL_PHONE.test(normalized),
    value: normalized,
    message: 'Enter a valid Ugandan number such as 0751234567 or +256751234567.'
  };
}

export function validateEmail(value) {
  const email = String(value ?? '').trim().toLowerCase();
  return {
    valid: EMAIL_PATTERN.test(email),
    value: email,
    message: 'Please enter a valid email address.'
  };
}

export function validatePassword(value) {
  const password = String(value ?? '');
  const errors = [];
  if (password.length < 8) errors.push('Use at least 8 characters.');
  if (!/[A-Z]/.test(password)) errors.push('Add at least one uppercase letter.');
  if (!/[a-z]/.test(password)) errors.push('Add at least one lowercase letter.');
  if (!/[0-9]/.test(password)) errors.push('Add at least one number.');
  if (!/[^A-Za-z0-9]/.test(password)) errors.push('Add at least one special character.');
  return { valid: errors.length === 0, errors, message: errors.join(' ') };
}

export function validateName(value) {
  const name = String(value ?? '').trim().replace(/[ \t]+/g, ' ');
  const valid = name.length >= 2 && name.length <= 100 && NAME_PATTERN.test(name);
  return { valid, value: name, message: 'Enter a name using letters, spaces, apostrophes, or hyphens.' };
}

export function parseDate(value) {
  const date = new Date(`${value}T00:00:00`);
  const localDate = [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    .map((part, index) => index === 0 ? String(part).padStart(4, '0') : String(part).padStart(2, '0'))
    .join('-');
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value)) && !Number.isNaN(date.getTime()) && localDate === value ? date : null;
}

export function validateDateOfBirth(value) {
  const date = parseDate(value);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return {
    valid: Boolean(date && date <= today),
    message: date && date > today ? 'Date of birth cannot be in the future.' : 'Enter a valid date of birth.'
  };
}

export function calculateDueDate(lmp) {
  const date = parseDate(lmp);
  if (!date) return '';
  date.setDate(date.getDate() + 280);
  return date.toISOString().slice(0, 10);
}

export function validateLmp(value) {
  const date = parseDate(value);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const earliest = new Date(today);
  earliest.setDate(earliest.getDate() - 294);
  const valid = Boolean(date && date <= today && date >= earliest);
  let message = 'Enter a valid last menstrual period date.';
  if (date && date > today) message = 'Last menstrual period cannot be in the future.';
  if (date && date < earliest) message = 'Use an LMP date from the last 42 weeks.';
  return { valid, message, dueDate: calculateDueDate(value) };
}

export function validateMeasurement({ weight, temperature, systolic, diastolic }) {
  const errors = {};
  const values = { weight, temperature, systolic, diastolic };
  for (const [field, value] of Object.entries(values)) {
    if (value !== '' && value != null && !Number.isFinite(Number(value))) errors[field] = 'Enter a numeric value.';
  }
  if (weight !== '' && (Number(weight) <= 0 || Number(weight) > 400)) errors.weight = 'Weight must be between 0 and 400 kg.';
  if (temperature !== '' && (Number(temperature) < 30 || Number(temperature) > 45)) errors.temperature = 'Temperature must be between 30 and 45 °C.';
  if (systolic !== '' && (Number(systolic) < 50 || Number(systolic) > 250)) errors.systolic = 'Systolic pressure must be between 50 and 250 mmHg.';
  if (diastolic !== '' && (Number(diastolic) < 30 || Number(diastolic) > 150)) errors.diastolic = 'Diastolic pressure must be between 30 and 150 mmHg.';
  if (systolic !== '' && diastolic !== '' && Number(diastolic) > Number(systolic)) errors.diastolic = 'Diastolic pressure cannot be higher than systolic pressure.';
  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateEmergencyContact({ name, phone, relationship }) {
  const errors = {};
  const nameResult = validateName(name);
  const phoneResult = validateUgandanPhone(phone);
  if (!nameResult.valid) errors.name = nameResult.message;
  if (!phoneResult.valid) errors.phone = phoneResult.message;
  if (!String(relationship ?? '').trim()) errors.relationship = 'Select or enter a relationship.';
  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateAppointment({ date, time, provider, facility }) {
  const errors = {};
  const appointmentDate = parseDate(date);
  const now = new Date();
  if (!appointmentDate) errors.date = 'Enter a valid appointment date.';
  else if (appointmentDate < new Date(now.toISOString().slice(0, 10))) errors.date = 'Appointment date cannot be in the past.';
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(String(time ?? ''))) errors.time = 'Enter a valid appointment time.';
  if (!String(provider ?? '').trim()) errors.provider = 'Choose a healthcare provider.';
  if (!String(facility ?? '').trim()) errors.facility = 'Enter a healthcare facility.';
  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateMedication({ name, instructions, reminderTime }) {
  const errors = {};
  if (!String(name ?? '').trim()) errors.name = 'Enter the medication name.';
  if (!String(instructions ?? '').trim()) errors.instructions = 'Enter medication instructions.';
  if (reminderTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(reminderTime)) errors.reminderTime = 'Enter a valid reminder time.';
  return { valid: Object.keys(errors).length === 0, errors };
}
