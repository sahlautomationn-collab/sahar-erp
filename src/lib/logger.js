/**
 * Logging utility for SAHAR ERP System
 * Replaces console.error/console.log with structured logging
 */

import Toastify from 'toastify-js';
import 'toastify-js/src/toastify.css';

const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  SUCCESS: 'SUCCESS'
};

const LOG_STYLES = {
  ERROR: { background: '#ff4444', color: '#fff' },
  WARN: { background: '#ffbb33', color: '#000' },
  INFO: { background: '#33b5e5', color: '#fff' },
  SUCCESS: { background: '#00c851', color: '#fff' }
};

/**
 * Helper function to safely check if we're in development mode
 */
const isDevelopment = () => {
  if (typeof window === 'undefined') return false;
  // Check if we're in development by looking at the hostname
  return window.location.hostname === 'localhost' ||
         window.location.hostname === '127.0.0.1' ||
         window.location.hostname === '';
};

/**
 * Helper function to safely access localStorage
 */
const safeGetItem = (key) => {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeSetItem = (key, value) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, value);
  } catch {
    // Silently fail
  }
};

const safeRemoveItem = (key) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(key);
  } catch {
    // Silently fail
  }
};

/**
 * Logger class for structured logging
 */
class Logger {
  /**
   * Log error messages
   */
  error(message, error = null, showToast = true) {
    // Log to console for debugging
    if (isDevelopment()) {
      console.error(`[${LOG_LEVELS.ERROR}]`, message, error);
    }

    // Show toast notification
    if (showToast && typeof window !== 'undefined') {
      const errorMessage = error?.message || message;
      Toastify({
        text: errorMessage,
        duration: 5000,
        style: LOG_STYLES.ERROR,
        gravity: 'top',
        position: 'right',
        close: true
      }).showToast();
    }

    // Store error in localStorage for debugging
    this._storeError(LOG_LEVELS.ERROR, message, error);
  }

  /**
   * Log warning messages
   */
  warn(message, showToast = false) {
    if (isDevelopment()) {
      console.warn(`[${LOG_LEVELS.WARN}]`, message);
    }

    if (showToast && typeof window !== 'undefined') {
      Toastify({
        text: message,
        duration: 4000,
        style: LOG_STYLES.WARN,
        gravity: 'top',
        position: 'right',
        close: true
      }).showToast();
    }

    this._storeError(LOG_LEVELS.WARN, message);
  }

  /**
   * Log info messages
   */
  info(message, showToast = false) {
    if (isDevelopment()) {
      console.info(`[${LOG_LEVELS.INFO}]`, message);
    }

    if (showToast && typeof window !== 'undefined') {
      Toastify({
        text: message,
        duration: 3000,
        style: LOG_STYLES.INFO,
        gravity: 'top',
        position: 'right',
        close: true
      }).showToast();
    }
  }

  /**
   * Log success messages
   */
  success(message, showToast = true) {
    if (isDevelopment()) {
      console.log(`[${LOG_LEVELS.SUCCESS}]`, message);
    }

    if (showToast && typeof window !== 'undefined') {
      Toastify({
        text: message,
        duration: 3000,
        style: LOG_STYLES.SUCCESS,
        gravity: 'top',
        position: 'right',
        close: true
      }).showToast();
    }
  }

  /**
   * Store error in localStorage for debugging
   */
  _storeError(level, message, error = null) {
    try {
      const logs = JSON.parse(safeGetItem('erp_logs') || '[]');
      logs.push({
        level,
        message,
        error: error ? {
          message: error.message,
          stack: error.stack,
          code: error.code
        } : null,
        timestamp: new Date().toISOString()
      });

      // Keep only last 100 logs
      if (logs.length > 100) {
        logs.shift();
      }

      safeSetItem('erp_logs', JSON.stringify(logs));
    } catch (e) {
      // Silently fail if localStorage is not available
    }
  }

  /**
   * Get all stored logs
   */
  getLogs() {
    try {
      return JSON.parse(safeGetItem('erp_logs') || '[]');
    } catch {
      return [];
    }
  }

  /**
   * Clear all stored logs
   */
  clearLogs() {
    safeRemoveItem('erp_logs');
  }

  /**
   * Send error to error tracking service (placeholder)
   */
  async sendToErrorTracking(message, error) {
    // Implement error tracking integration here
    // Example: Sentry.captureException(error, { extra: { message } });
  }
}

// Export singleton instance
export const logger = new Logger();

// Export convenience functions
export const logError = (message, error, showToast) => logger.error(message, error, showToast);
export const logWarn = (message, showToast) => logger.warn(message, showToast);
export const logInfo = (message, showToast) => logger.info(message, showToast);
export const logSuccess = (message, showToast) => logger.success(message, showToast);
