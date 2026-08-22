/**
 * Unified Validation Module
 * 
 * Single source of truth for all input validation.
 * Consolidates validators from validators.js, app.js, and BLOOMCARE-main/app.js
 * 
 * All validators return: { valid: boolean, value: string, message: string, errors?: string[] }
 * 
 * Usage:
 *   import { validateEmail, validatePhoneNumber } from './validators-unified.js';
 *   const result = validateEmail(userInput);
 *   if (result.valid) use(result.value);
 *   else showError(result.message);
 */

import config from './security-config.js';

// ============================================================================
// VALIDATION REGEX PATTERNS (from config)
// ============================================================================

const PATTERNS = {
  ugandaPhone: config.validation.phone.ugandaLocal,
  ugandaPhoneIntl: config.validation.phone.ugandaInternational,
  email: config.validation.email,
  name: config.validation.name,
};

// ============================================================================
// PHONE VALIDATION
// ============================================================================

/**
 * Normalize Ugandan phone number to local format (07XXXXXXXX)
 * @param {*} value - Input phone number
 * @returns {string} Normalized phone number or empty string
 */
export function normalizePhoneNumber(value) {
  const phone = String(value ?? '').trim().replace(/[ \t]/g, '');
  
  // If international format, convert to local
  if (PATTERNS.ugandaPhoneIntl.test(phone)) {
    return `0${phone.slice(4)}`;
  }
  
  return phone;
}

/**
 * Validate Ugandan phone number
 * @param {*} value - Input phone number
 * @returns {Object} Validation result with normalized value
 */
export function validatePhoneNumber(value) {
  const normalized = normalizePhoneNumber(value);
  const valid = PATTERNS.ugandaPhone.test(normalized);
  
  return {
    valid,
    value: normalized,
    message: valid 
      ? ''
      : 'Enter a valid Ugandan number such as 0751234567 or +256751234567.',
  };
}

// ============================================================================
// EMAIL VALIDATION
// ============================================================================

/**
 * Validate email address
 * @param {*} value - Input email
 * @returns {Object} Validation result
 */
export function validateEmail(value) {
  const email = String(value ?? '').trim().toLowerCase();
  const valid = PATTERNS.email.test(email);
  
  return {
    valid,
    value: email,
    message: valid 
      ? ''
      : 'Please enter a valid email address.',
  };
}

// ============================================================================
// PASSWORD VALIDATION
// ============================================================================

/**
 * Validate password against security policy
 * @param {*} value - Input password
 * @returns {Object} Validation result with detailed error list
 */
export function validatePassword(value) {
  const password = String(value ?? '');
  const { minLength, requireUppercase, requireLowercase, requireNumbers, requireSpecialChars } = config.validation.password;
  const errors = [];
  
  if (password.length < minLength) {
    errors.push(`Use at least ${minLength} characters.`);
  }
  if (requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Add at least one uppercase letter.');
  }
  if (requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Add at least one lowercase letter.');
  }
  if (requireNumbers && !/[0-9]/.test(password)) {
    errors.push('Add at least one number.');
  }
  if (requireSpecialChars && !/[^A-Za-z0-9]/.test(password)) {
    errors.push('Add at least one special character.');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    message: errors.join(' '),
  };
}

// ============================================================================
// NAME VALIDATION
// ============================================================================

/**
 * Validate person's name
 * @param {*} value - Input name
 * @returns {Object} Validation result with normalized value
 */
export function validateName(value) {
  const name = String(value ?? '').trim().replace(/[ \t]+/g, ' ');
  const minLength = 2;
  const maxLength = 100;
  
  const valid = 
    name.length >= minLength && 
    name.length <= maxLength && 
    PATTERNS.name.test(name);
  
  return {
    valid,
    value: name,
    message: valid 
      ? ''
      : 'Enter a name using letters, spaces, apostrophes, or hyphens.',
  };
}

// ============================================================================
// DATE VALIDATION & CALCULATION
// ============================================================================

/**
 * Parse date string in YYYY-MM-DD format
 * @param {*} value - Date string or value
 * @returns {Date|null} Parsed Date object or null if invalid
 */
export function parseDate(value) {
  const dateString = String(value ?? '');
  
  // Validate format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return null;
  }
  
  const date = new Date(`${dateString}T00:00:00Z`);
  
  // Check if date is valid
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  
  // Verify the date string round-trips correctly (catches invalid dates like Feb 30)
  const isoDate = date.toISOString().slice(0, 10);
  if (isoDate !== dateString) {
    return null;
  }
  
  return date;
}

/**
 * Validate date of birth
 * @param {*} value - Date string in YYYY-MM-DD format
 * @returns {Object} Validation result
 */
export function validateDateOfBirth(value) {
  const date = parseDate(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let valid = false;
  let message = 'Enter a valid date of birth.';
  
  if (!date) {
    message = 'Enter a valid date in YYYY-MM-DD format.';
  } else if (date > today) {
    message = 'Date of birth cannot be in the future.';
  } else {
    // Calculate age
    const { minAge, maxAge } = config.validation.dateOfBirth;
    const age = today.getFullYear() - date.getFullYear();
    const monthDiff = today.getMonth() - date.getMonth();
    const dayDiff = today.getDate() - date.getDate();
    
    const adjustedAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;
    
    if (adjustedAge < minAge) {
      message = `You must be at least ${minAge} years old.`;
    } else if (adjustedAge > maxAge) {
      message = `Date of birth seems invalid (${adjustedAge} years old).`;
    } else {
      valid = true;
    }
  }
  
  return { valid, message };
}

/**
 * Calculate estimated due date from last menstrual period (Naegele's rule)
 * @param {*} lmp - Last menstrual period date in YYYY-MM-DD format
 * @returns {string} Due date in YYYY-MM-DD format or empty string if invalid
 */
export function calculateDueDate(lmp) {
  const date = parseDate(lmp);
  if (!date) return '';
  
  const duration = config.pregnancy.standardDuration;
  date.setDate(date.getDate() + duration);
  
  return date.toISOString().slice(0, 10);
}

/**
 * Validate last menstrual period date
 * @param {*} value - LMP date in YYYY-MM-DD format
 * @returns {Object} Validation result with calculated due date
 */
export function validateLmp(value) {
  const date = parseDate(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let valid = false;
  let message = 'Enter a valid last menstrual period date.';
  
  if (!date) {
    message = 'Enter a valid date in YYYY-MM-DD format.';
  } else if (date > today) {
    message = 'LMP cannot be in the future.';
  } else {
    // LMP should be within 294 days (42 weeks) in the past
    const maxLmpDays = 294;
    const earliest = new Date(today);
    earliest.setDate(earliest.getDate() - maxLmpDays);
    
    if (date < earliest) {
      message = `LMP should be within ${maxLmpDays} days (${Math.round(maxLmpDays / 7)} weeks).`;
    } else {
      valid = true;
    }
  }
  
  return { valid, message };
}

// ============================================================================
// PREGNANCY CALCULATIONS
// ============================================================================

/**
 * Calculate current pregnancy week from LMP
 * @param {*} lmp - Last menstrual period in YYYY-MM-DD format
 * @returns {number} Current pregnancy week (1-40+)
 */
export function calculatePregnancyWeek(lmp) {
  const date = parseDate(lmp);
  if (!date) return 0;
  
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const weeksSinceLmp = Math.floor((Date.now() - date.getTime()) / weekMs);
  
  // Cap between 1 and 40+ weeks
  return Math.max(1, Math.min(43, weeksSinceLmp));
}

/**
 * Calculate pregnancy progress percentage
 * @param {*} lmp - Last menstrual period in YYYY-MM-DD format
 * @returns {number} Progress percentage (0-100)
 */
export function calculatePregnancyProgress(lmp) {
  const week = calculatePregnancyWeek(lmp);
  return Math.min(100, Math.round((week / 40) * 100));
}

/**
 * Get pregnancy trimester number (1, 2, or 3)
 * @param {*} lmp - Last menstrual period in YYYY-MM-DD format
 * @returns {number} Trimester number
 */
export function getPregnancyTrimester(lmp) {
  const week = calculatePregnancyWeek(lmp);
  if (week <= 12) return 1;
  if (week <= 24) return 2;
  return 3;
}

// ============================================================================
// FORMATTING
// ============================================================================

/**
 * Format date for display
 * @param {*} value - Date string or Date object
 * @param {string} locale - Locale code (default: 'en')
 * @returns {string} Formatted date string or '--' if invalid
 */
export function formatDate(value, locale = 'en') {
  if (!value) return '--';
  
  const dateString = value instanceof Date ? value.toISOString().slice(0, 10) : String(value);
  const date = parseDate(dateString);
  
  if (!date) return '--';
  
  return new Intl.DateTimeFormat(locale, { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  }).format(date);
}

/**
 * Get current date formatted for display
 * @param {string} locale - Locale code
 * @returns {string} Formatted current date
 */
export function getFormattedToday(locale = 'en') {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date()).toUpperCase();
}

// ============================================================================
// COMPOSITE VALIDATION (for forms)
// ============================================================================

/**
 * Validate user registration data
 * @param {Object} data - User registration data
 * @returns {Object} Validation results keyed by field name
 */
export function validateRegistrationForm(data) {
  const results = {};
  
  if (data.firstName !== undefined) {
    results.firstName = validateName(data.firstName);
  }
  
  if (data.lastName !== undefined) {
    results.lastName = validateName(data.lastName);
  }
  
  if (data.email !== undefined) {
    results.email = validateEmail(data.email);
  }
  
  if (data.phone !== undefined) {
    results.phone = validatePhoneNumber(data.phone);
  }
  
  if (data.dateOfBirth !== undefined) {
    results.dateOfBirth = validateDateOfBirth(data.dateOfBirth);
  }
  
  if (data.password !== undefined) {
    results.password = validatePassword(data.password);
  }
  
  return results;
}

/**
 * Validate pregnancy profile data
 * @param {Object} data - Profile data
 * @returns {Object} Validation results keyed by field name
 */
export function validatePregnancyProfile(data) {
  const results = {};
  
  if (data.lmp !== undefined) {
    results.lmp = validateLmp(data.lmp);
  }
  
  if (data.dueDate !== undefined) {
    // Just validate format, actual due date should be calculated from LMP
    results.dueDate = { valid: !!parseDate(data.dueDate), message: '' };
  }
  
  return results;
}

/**
 * Check if all validation results are valid
 * @param {Object} results - Results from validateRegistrationForm, etc.
 * @returns {boolean} Whether all fields are valid
 */
export function allValid(results) {
  return Object.values(results).every(result => result.valid !== false);
}

export default {
  // Phone
  normalizePhoneNumber,
  validatePhoneNumber,
  
  // Email
  validateEmail,
  
  // Password
  validatePassword,
  
  // Name
  validateName,
  
  // Date & Pregnancy
  parseDate,
  validateDateOfBirth,
  calculateDueDate,
  validateLmp,
  calculatePregnancyWeek,
  calculatePregnancyProgress,
  getPregnancyTrimester,
  formatDate,
  getFormattedToday,
  
  // Form validation
  validateRegistrationForm,
  validatePregnancyProfile,
  allValid,
};
