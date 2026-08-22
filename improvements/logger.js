/**
 * Unified Logging Module
 * 
 * Centralized logging with levels, timestamps, and error tracking.
 * Replaces scattered console.log/warn/error calls throughout the codebase.
 * 
 * Usage:
 *   import logger from './logger.js';
 *   logger.debug('User signed in', { uid: user.id });
 *   logger.error('Payment failed', { code: error.code, attempt: 3 });
 */

import config from './security-config.js';

// Log levels with numeric values for filtering
const LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

// Level names for display
const LEVEL_NAMES = {
  0: 'DEBUG',
  1: 'INFO',
  2: 'WARN',
  3: 'ERROR',
};

// Color codes for console output (browser console)
const COLORS = {
  DEBUG: '#888',
  INFO: '#0066cc',
  WARN: '#ff8800',
  ERROR: '#cc0000',
};

/**
 * Logger class for unified logging
 */
class Logger {
  constructor() {
    this.logLevel = LEVELS[config.logging.level?.toUpperCase()] ?? LEVELS.INFO;
    this.logToConsole = config.logging.logToConsole;
    this.logToServer = config.logging.logToServer;
    this.requestsInFlight = 0; // Prevent infinite loops from server logging
  }

  /**
   * Format log message with timestamp and level
   * @private
   */
  formatMessage(level, message, data) {
    const timestamp = new Date().toISOString();
    const levelName = LEVEL_NAMES[level];
    const dataStr = data ? ` | ${JSON.stringify(data)}` : '';
    return `[${timestamp}] [${levelName}] ${message}${dataStr}`;
  }

  /**
   * Format for console output
   * @private
   */
  formatConsoleOutput(level, message, data) {
    const levelName = LEVEL_NAMES[level];
    const color = COLORS[levelName];
    const style = `color: ${color}; font-weight: bold;`;
    return { style, prefix: `%c[${levelName}]`, message, data };
  }

  /**
   * Log to console
   * @private
   */
  async logToConsoleOutput(level, message, data) {
    if (!this.logToConsole) return;

    const { style, prefix, message: msg, data: d } = this.formatConsoleOutput(level, message, data);
    
    if (typeof window !== 'undefined' && window.console) {
      if (d) {
        console.log(`%c${LEVEL_NAMES[level]}`, style, msg, d);
      } else {
        console.log(`%c${LEVEL_NAMES[level]}`, style, msg);
      }
    }
  }

  /**
   * Log to server (for production error tracking)
   * @private
   */
  async logToServerOutput(level, message, data) {
    if (!this.logToServer || this.requestsInFlight > 0) return;
    
    // Prevent recursive logging if server is used
    this.requestsInFlight++;
    
    try {
      const payload = {
        level: LEVEL_NAMES[level],
        message,
        data,
        timestamp: new Date().toISOString(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      };
      
      // Send to logging endpoint (implement this in production)
      // await fetch('/api/logs', { method: 'POST', body: JSON.stringify(payload) });
    } catch (error) {
      // Silently fail to prevent infinite loops
    } finally {
      this.requestsInFlight--;
    }
  }

  /**
   * Core logging method
   * @private
   */
  async log(level, message, data = null) {
    if (level < this.logLevel) return;

    // Always log to console in development
    if (config.logging.logToConsole) {
      await this.logToConsoleOutput(level, message, data);
    }

    // Optionally log to server in production
    if (config.logging.logToServer && level >= LEVELS.WARN) {
      await this.logToServerOutput(level, message, data);
    }
  }

  /**
   * Log debug message
   * @param {string} message - Log message
   * @param {*} data - Additional data object
   */
  debug(message, data) {
    this.log(LEVELS.DEBUG, message, data);
  }

  /**
   * Log info message
   * @param {string} message - Log message
   * @param {*} data - Additional data object
   */
  info(message, data) {
    this.log(LEVELS.INFO, message, data);
  }

  /**
   * Log warning message
   * @param {string} message - Log message
   * @param {*} data - Additional data object
   */
  warn(message, data) {
    this.log(LEVELS.WARN, message, data);
  }

  /**
   * Log error message with optional stack trace
   * @param {string} message - Log message
   * @param {Error|Object} error - Error object or data
   */
  error(message, error) {
    const errorData = error instanceof Error 
      ? { 
          message: error.message, 
          stack: error.stack,
          name: error.name,
        }
      : error;
    
    this.log(LEVELS.ERROR, message, errorData);
  }

  /**
   * Log Firebase authentication errors
   * @param {Error} error - Firebase error
   * @param {Object} context - Additional context (userId, etc.)
   */
  logFirebaseAuthError(error, context = {}) {
    const firebaseErrors = {
      'auth/email-already-in-use': 'Email already registered',
      'auth/invalid-credential': 'Invalid email or password',
      'auth/weak-password': 'Password too weak',
      'auth/operation-not-allowed': 'Auth method not enabled',
      'auth/user-not-found': 'No account found with this email',
      'auth/too-many-requests': 'Too many login attempts. Try again later.',
      'auth/network-request-failed': 'Network error. Check your connection.',
    };

    const friendlyMessage = firebaseErrors[error.code] || error.message;
    
    this.error('Firebase Auth Error', {
      code: error.code,
      message: friendlyMessage,
      originalMessage: error.message,
      ...context,
    });
  }

  /**
   * Log Firestore database errors
   * @param {Error} error - Firestore error
   * @param {Object} context - Additional context (operation, collection, etc.)
   */
  logFirestoreError(error, context = {}) {
    const firestoreErrors = {
      'permission-denied': 'You do not have permission to access this data',
      'not-found': 'The requested document was not found',
      'already-exists': 'This document already exists',
      'invalid-argument': 'Invalid request parameters',
      'unavailable': 'Firestore service is temporarily unavailable',
      'unauthenticated': 'You must sign in to access this',
    };

    const friendlyMessage = firestoreErrors[error.code] || error.message;
    
    this.error('Firestore Error', {
      code: error.code,
      message: friendlyMessage,
      originalMessage: error.message,
      ...context,
    });
  }

  /**
   * Log payment processing errors
   * @param {Error} error - Payment error
   * @param {Object} context - Payment context (amount, provider, etc.)
   */
  logPaymentError(error, context = {}) {
    this.error('Payment Error', {
      message: error.message,
      type: error.type || 'unknown',
      statusCode: error.statusCode,
      ...context,
    });
  }

  /**
   * Log HTTP request/response
   * @param {string} method - HTTP method
   * @param {string} url - Request URL
   * @param {Object} options - Request details
   */
  logHttpRequest(method, url, options = {}) {
    const { status, duration, error } = options;
    const success = status && status < 400;
    const level = success ? LEVELS.DEBUG : LEVELS.WARN;
    
    this.log(level, `HTTP ${method} ${url}`, {
      status,
      duration: `${duration}ms`,
      ...error ? { error } : {},
    });
  }

  /**
   * Set log level dynamically
   * @param {string} level - 'debug', 'info', 'warn', 'error'
   */
  setLogLevel(level) {
    this.logLevel = LEVELS[level?.toUpperCase()] ?? LEVELS.INFO;
    this.info(`Log level changed to ${level}`);
  }

  /**
   * Clear in-flight requests counter (for testing)
   */
  clearInFlightRequests() {
    this.requestsInFlight = 0;
  }
}

// Create singleton instance
const logger = new Logger();

export default logger;

// Also export the class for testing/mocking
export { Logger };
