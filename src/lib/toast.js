/**
 * Toast notification utility
 * Replaces all alert() calls with user-friendly notifications
 */

import Toastify from 'toastify-js';

const TOAST_STYLES = {
  success: {
    background: 'linear-gradient(135deg, #00c851, #00a843)',
    boxShadow: '0 4px 15px rgba(0, 200, 81, 0.3)'
  },
  error: {
    background: 'linear-gradient(135deg, #ff4444, #cc0000)',
    boxShadow: '0 4px 15px rgba(255, 68, 68, 0.3)'
  },
  warning: {
    background: 'linear-gradient(135deg, #ffbb33, #ff9900)',
    boxShadow: '0 4px 15px rgba(255, 187, 51, 0.3)'
  },
  info: {
    background: 'linear-gradient(135deg, #33b5e5, #0099cc)',
    boxShadow: '0 4px 15px rgba(51, 181, 229, 0.3)'
  }
};

/**
 * Helper to safely show toast (client-side only)
 */
const showToast = (options) => {
  if (typeof window === 'undefined') return null;
  try {
    return Toastify(options).showToast();
  } catch (error) {
    console.error('Toastify error:', error);
    return null;
  }
};

/**
 * Toast notification helper
 */
export const toast = {
  /**
   * Show success notification
   */
  success: (message, duration = 3000) => {
    return showToast({
      text: message,
      duration,
      style: TOAST_STYLES.success,
      gravity: 'top',
      position: 'right',
      close: true,
      stopOnFocus: true,
      className: 'toast-success'
    });
  },

  /**
   * Show error notification
   */
  error: (message, duration = 5000) => {
    return showToast({
      text: message,
      duration,
      style: TOAST_STYLES.error,
      gravity: 'top',
      position: 'right',
      close: true,
      stopOnFocus: true,
      className: 'toast-error'
    });
  },

  /**
   * Show warning notification
   */
  warning: (message, duration = 4000) => {
    return showToast({
      text: message,
      duration,
      style: TOAST_STYLES.warning,
      gravity: 'top',
      position: 'right',
      close: true,
      stopOnFocus: true,
      className: 'toast-warning'
    });
  },

  /**
   * Show info notification
   */
  info: (message, duration = 3000) => {
    return showToast({
      text: message,
      duration,
      style: TOAST_STYLES.info,
      gravity: 'top',
      position: 'right',
      close: true,
      stopOnFocus: true,
      className: 'toast-info'
    });
  },

  /**
   * Show loading notification
   */
  loading: (message = 'Loading...') => {
    return showToast({
      text: `${message} ⏳`,
      duration: -1, // Never auto-dismiss
      style: {
        background: '#333',
        color: '#fff'
      },
      gravity: 'top',
      position: 'right',
      close: false
    });
  },

  /**
   * Confirm action with user
   */
  confirm: (message, callback) => {
    if (typeof window !== 'undefined' && window.confirm(message)) {
      callback();
    }
  }
};

/**
 * Convenience exports
 */
export const showSuccess = (message) => toast.success(message);
export const showError = (message) => toast.error(message);
export const showWarning = (message) => toast.warning(message);
export const showInfo = (message) => toast.info(message);
