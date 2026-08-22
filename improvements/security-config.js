/**
 * Security & Environment Configuration
 * 
 * Centralizes all configuration with environment variable support.
 * Never commit secrets - use .env.local or Firebase environment variables.
 * 
 * Usage:
 *   import config from './security-config.js';
 *   const apiUrl = config.getPaymentApiUrl();
 */

const CONFIG = {
  // Firebase Configuration (moved from firebase-config.js)
  // In production, these should come from Firebase Hosting environment variables
  firebase: {
    apiKey: import.meta.env?.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || '',
    authDomain: import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN || '',
    projectId: import.meta.env?.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || '',
    storageBucket: import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID || '',
    appId: import.meta.env?.VITE_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID || '',
    measurementId: import.meta.env?.VITE_FIREBASE_MEASUREMENT_ID || process.env.FIREBASE_MEASUREMENT_ID || '',
  },

  // API Configuration
  api: {
    paymentBaseUrl: import.meta.env?.VITE_PAYMENT_API_URL || 'http://127.0.0.1:8787',
    timeout: 30000, // 30 seconds
    retryAttempts: 3,
  },

  // Security Settings
  security: {
    // CORS: Restricted to specific origins in production
    allowedOrigins: import.meta.env?.VITE_ALLOWED_ORIGINS?.split(',') || ['http://localhost:8080', 'http://127.0.0.1:8080'],
    
    // Rate Limiting
    rateLimits: {
      signIn: { maxAttempts: 5, windowMs: 15 * 60 * 1000 }, // 5 attempts per 15 min
      signUp: { maxAttempts: 3, windowMs: 60 * 60 * 1000 },  // 3 attempts per hour
      payment: { maxAttempts: 5, windowMs: 60 * 1000 },      // 5 attempts per minute
    },

    // Session Settings
    sessionTimeout: 30 * 60 * 1000, // 30 minutes of inactivity
    maxSessionDuration: 8 * 60 * 60 * 1000, // 8 hours max
  },

  // Storage Configuration
  storage: {
    // Use sessionStorage for temporary data, never store passwords
    useSessionStorage: true,
    clearOnLogout: true,
    encryptSensitiveData: false, // Set to true in production with proper encryption
  },

  // Application Constants
  pregnancy: {
    standardDuration: 280, // days (Naegele's rule)
    trimesterWeeks: [12, 24, 40],
    viabilityWeeks: 24,
  },

  // Validation Rules
  validation: {
    password: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
    },
    phone: {
      ugandaLocal: /^07[0-9]{8}$/,
      ugandaInternational: /^\+2567[0-9]{8}$/,
    },
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    name: /^\p{L}+(?:[ '-]\p{L}+)*$/u,
    dateOfBirth: {
      minAge: 13, // Minimum age for app usage
      maxAge: 100,
    },
  },

  // Feature Flags
  features: {
    enableAnalytics: true,
    enablePasswordReset: true,
    enableAppointmentReminders: true,
    enableHealthRecordExport: true,
    maintenanceMode: false,
  },

  // Logging
  logging: {
    level: import.meta.env?.VITE_LOG_LEVEL || 'info', // 'debug', 'info', 'warn', 'error'
    logToConsole: true,
    logToServer: false, // Can be enabled for production error tracking
  },
};

/**
 * Get Firebase configuration
 * @returns {Object} Firebase config object
 * @throws {Error} If required Firebase config is missing
 */
export function getFirebaseConfig() {
  const { firebase } = CONFIG;
  const required = ['apiKey', 'authDomain', 'projectId', 'appId'];
  const missing = required.filter(key => !firebase[key]);
  
  if (missing.length > 0) {
    throw new Error(
      `Missing Firebase configuration: ${missing.join(', ')}. ` +
      `Set environment variables: VITE_FIREBASE_* or FIREBASE_*`
    );
  }
  
  return firebase;
}

/**
 * Get payment API URL with protocol validation
 * @returns {string} Payment API base URL
 */
export function getPaymentApiUrl() {
  return CONFIG.api.paymentBaseUrl;
}

/**
 * Check if origin is allowed (for CORS)
 * @param {string} origin - Request origin
 * @returns {boolean} Whether origin is whitelisted
 */
export function isOriginAllowed(origin) {
  return CONFIG.security.allowedOrigins.includes(origin);
}

/**
 * Get rate limit configuration
 * @param {string} type - Rate limit type (signIn, signUp, payment)
 * @returns {Object} Rate limit settings
 */
export function getRateLimit(type) {
  return CONFIG.security.rateLimits[type] || { maxAttempts: 10, windowMs: 60000 };
}

/**
 * Check if environment is development
 * @returns {boolean}
 */
export function isDevelopment() {
  return import.meta.env?.DEV || false;
}

/**
 * Check if environment is production
 * @returns {boolean}
 */
export function isProduction() {
  return import.meta.env?.PROD || false;
}

/**
 * Get all configuration
 * @returns {Object} Complete config object
 */
export function getConfig() {
  return { ...CONFIG };
}

// Validate configuration on load
if (typeof window !== 'undefined') {
  try {
    getFirebaseConfig();
  } catch (error) {
    console.warn('[CONFIG]', error.message);
  }
}

export default {
  getFirebaseConfig,
  getPaymentApiUrl,
  isOriginAllowed,
  getRateLimit,
  isDevelopment,
  isProduction,
  getConfig,
};
