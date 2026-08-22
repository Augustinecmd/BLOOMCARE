/**
 * USAGE EXAMPLES - How to Use the Improved Modules
 * 
 * This file demonstrates practical usage of all the new improvement modules.
 * Copy these patterns to your code.
 */

// ============================================================================
// VALIDATORS EXAMPLE
// ============================================================================

import {
  validateEmail,
  validatePhoneNumber,
  validatePassword,
  validateLmp,
  calculateDueDate,
  calculatePregnancyWeek,
  formatDate,
} from './validators-unified.js';

function handleRegistrationForm(formData) {
  // Validate each field
  const emailValidation = validateEmail(formData.email);
  const phoneValidation = validatePhoneNumber(formData.phone);
  const passwordValidation = validatePassword(formData.password);

  // Check if all valid
  if (!emailValidation.valid || !phoneValidation.valid || !passwordValidation.valid) {
    return {
      success: false,
      errors: {
        email: emailValidation.message,
        phone: phoneValidation.message,
        password: passwordValidation.message,
      },
    };
  }

  // Use normalized values
  const normalizedEmail = emailValidation.value;
  const normalizedPhone = phoneValidation.value;

  // Proceed with registration
  return {
    success: true,
    data: {
      email: normalizedEmail,
      phone: normalizedPhone,
      password: formData.password, // Never normalize passwords
    },
  };
}

function handlePregnancyProfile(lmpDate) {
  const validation = validateLmp(lmpDate);

  if (!validation.valid) {
    return { error: validation.message };
  }

  // Calculate due date
  const dueDate = calculateDueDate(lmpDate);
  
  // Calculate pregnancy week
  const weekNumber = calculatePregnancyWeek(lmpDate);
  
  // Format for display
  const formattedLmp = formatDate(lmpDate);
  const formattedDue = formatDate(dueDate);

  return {
    success: true,
    profile: {
      lmp: lmpDate,
      edd: dueDate,
      currentWeek: weekNumber,
      displayLmp: formattedLmp,
      displayEdd: formattedDue,
    },
  };
}

// ============================================================================
// LOGGER EXAMPLE
// ============================================================================

import logger from './logger.js';

async function handleUserSignUp(userData) {
  logger.debug('Sign up attempt', { email: userData.email });

  try {
    // Validate
    const validation = validateEmail(userData.email);
    if (!validation.valid) {
      logger.warn('Invalid email provided', { email: userData.email });
      throw new Error(validation.message);
    }

    // Sign up with Firebase
    // const user = await signUpUser(userData);
    
    logger.info('User registered successfully', {
      uid: 'user-123',
      email: userData.email,
    });

    return { success: true };
  } catch (error) {
    logger.logFirebaseAuthError(error, {
      email: userData.email,
      action: 'sign-up',
    });

    return { success: false, error: error.message };
  }
}

function handlePaymentError(error, context) {
  logger.logPaymentError(error, {
    amount: context.amount,
    provider: context.provider,
    userId: context.userId,
  });
}

function trackHttpRequest(method, url, status, duration) {
  logger.logHttpRequest(method, url, {
    status,
    duration,
  });
}

// ============================================================================
// STATE MANAGER EXAMPLE
// ============================================================================

import stateManager from './state-manager.js';

async function handleUserLogin(user, profile, records) {
  // Set authenticated user
  stateManager.setCurrentUser(user);
  logger.info('User authenticated', { uid: user.uid });

  // Set pregnancy profile
  if (profile) {
    stateManager.setProfile(profile);
  }

  // Load health records
  if (Array.isArray(records)) {
    stateManager.setRecords(records);
  }

  // Subscribe to state changes
  const unsubscribe = stateManager.subscribe((state) => {
    console.log('App state updated:', {
      isAuthenticated: stateManager.isAuthenticated(),
      hasProfile: !!state.profile,
      recordCount: state.records.length,
    });
  });

  // Later: unsubscribe();
  return unsubscribe;
}

function handleUserLogout() {
  // Clear user data
  stateManager.setCurrentUser(null);
  stateManager.clearUserData();
  
  logger.info('User logged out');
}

function addNewHealthRecord(record) {
  // Add to state
  stateManager.addRecord(record);
  
  logger.info('Record added', { recordId: record.id });
  
  // UI will automatically update via subscribers
}

function updatePregnancyProfile(updates) {
  // Update profile
  stateManager.updateProfile(updates);
  
  logger.info('Profile updated', { updated: Object.keys(updates) });
}

function getAppState() {
  // Get current state for display
  const userInfo = stateManager.getUserInfo();
  const error = stateManager.getError();
  const isLoading = stateManager.isLoading();

  return {
    userInfo,
    error,
    isLoading,
  };
}

// ============================================================================
// DOM UTILS EXAMPLE
// ============================================================================

import {
  query,
  queryAll,
  setText,
  getValue,
  setValue,
  addClass,
  removeClass,
  hasClass,
  on,
  show,
  hide,
  setVisible,
} from './dom-utils.js';

function setupUserInterface() {
  // Set display name
  const user = stateManager.getCurrentUser();
  if (user) {
    setText('#patient-name', user.firstName || user.email.split('@')[0]);
  }

  // Setup form handlers
  on('#registration-form', 'submit', (e) => {
    e.preventDefault();

    const formData = {
      email: getValue('#email-input'),
      phone: getValue('#phone-input'),
      password: getValue('#password-input'),
    };

    const result = handleRegistrationForm(formData);

    if (result.success) {
      setText('#status', 'Registration successful!');
      addClass('#status', 'success');
      show('#dashboard-view');
      hide('#auth-view');
    } else {
      setText('#error-message', result.errors.email || 'Registration failed');
      addClass('#error-message', 'error');
    }
  });

  // Setup button handlers
  on('#logout-btn', 'click', () => {
    handleUserLogout();
  });

  // Toggle sections
  on('#quick-check-btn', 'click', () => {
    const isVisible = hasClass('#health-form', 'hidden');
    setVisible('#health-form', isVisible);
  });
}

function updatePregnancyDisplay() {
  const profile = stateManager.getProfile();
  const records = stateManager.getRecords();

  if (!profile) return;

  // Update summary
  const week = calculatePregnancyWeek(profile.lmp);
  const progress = Math.round((week / 40) * 100);

  setText('#week-number', week);
  setText('#progress-value', `${progress}%`);
  setValue('#progress-bar', progress);

  // Update records list
  const recordsList = query('#records-list');
  if (recordsList && records.length > 0) {
    const latest = records[0];
    setText('#latest-record', formatDate(latest.date));
  }
}

function displayError(message) {
  const errorEl = query('#error-message');
  if (errorEl) {
    setText(errorEl, message);
    addClass(errorEl, 'error');
    show(errorEl);
  }

  logger.error('User-facing error', { message });
}

function clearError() {
  const errorEl = query('#error-message');
  if (errorEl) {
    hide(errorEl);
    removeClass(errorEl, 'error');
  }

  stateManager.clearError();
}

// ============================================================================
// SECURITY CONFIG EXAMPLE
// ============================================================================

import config from './security-config.js';

function setupPaymentRequest(amount, provider) {
  // Check rate limits
  const limit = config.getRateLimit('payment');
  const attempts = getPaymentAttempts(); // Your tracking

  if (attempts >= limit.maxAttempts) {
    const error = 'Too many payment attempts. Please try again later.';
    logger.warn('Payment rate limit exceeded', { attempts, limit: limit.maxAttempts });
    throw new Error(error);
  }

  // Build payment request
  const paymentUrl = config.getPaymentApiUrl();
  
  return {
    url: `${paymentUrl}/initialize`,
    method: 'POST',
    body: {
      amount,
      provider,
      phone: stateManager.getCurrentUser()?.phone,
    },
  };
}

function validateCorsOrigin(origin) {
  // Check if origin is allowed
  if (!config.isOriginAllowed(origin)) {
    logger.warn('CORS blocked', { origin, allowed: config.security.allowedOrigins });
    return false;
  }

  return true;
}

function getEnvironmentConfig() {
  return {
    isProduction: config.isProduction(),
    isDevelopment: config.isDevelopment(),
    logLevel: config.logging.level,
    sessionTimeout: config.security.sessionTimeout,
  };
}

// ============================================================================
// COMPLETE FLOW EXAMPLE
// ============================================================================

/**
 * Full user authentication and profile setup flow
 */
async function completeUserOnboarding(authUser, profileData, healthRecords) {
  try {
    logger.info('Starting user onboarding', { uid: authUser.uid });

    // 1. Validate inputs
    const emailValidation = validateEmail(authUser.email);
    const lmpValidation = validateLmp(profileData.lmp);

    if (!emailValidation.valid || !lmpValidation.valid) {
      throw new Error('Invalid user data');
    }

    // 2. Set up application state
    stateManager.setCurrentUser(authUser);
    stateManager.setProfile({
      ...profileData,
      edd: calculateDueDate(profileData.lmp),
    });
    stateManager.setRecords(healthRecords || []);

    // 3. Update UI
    setupUserInterface();
    updatePregnancyDisplay();

    // 4. Log success
    logger.info('User onboarding complete', {
      uid: authUser.uid,
      email: emailValidation.value,
      hasProfile: true,
      recordCount: healthRecords?.length || 0,
    });

    return { success: true };
  } catch (error) {
    logger.error('Onboarding failed', error);
    displayError('Failed to set up your account. Please try again.');
    return { success: false, error };
  }
}

// ============================================================================
// EXPORT FOR USE IN MAIN APP
// ============================================================================

export {
  handleRegistrationForm,
  handlePregnancyProfile,
  handleUserSignUp,
  handlePaymentError,
  trackHttpRequest,
  handleUserLogin,
  handleUserLogout,
  addNewHealthRecord,
  updatePregnancyProfile,
  getAppState,
  setupUserInterface,
  updatePregnancyDisplay,
  displayError,
  clearError,
  setupPaymentRequest,
  validateCorsOrigin,
  getEnvironmentConfig,
  completeUserOnboarding,
};
