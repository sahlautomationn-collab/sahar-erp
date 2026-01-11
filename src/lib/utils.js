/**
 * Utility functions for SAHAR ERP System
 */

/**
 * Input validation utilities
 */
export const validators = {
  /**
   * Validate email format
   */
  isEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Validate numeric input
   */
  isNumeric: (value) => {
    return !isNaN(value) && value !== '' && value !== null;
  },

  /**
   * Validate positive number
   */
  isPositive: (value) => {
    return !isNaN(value) && parseFloat(value) > 0;
  },

  /**
   * Validate required field
   */
  isRequired: (value) => {
    if (value === null || value === undefined || value === '') {
      return false;
    }
    if (typeof value === 'string' && value.trim().length === 0) {
      return false;
    }
    return true;
  },

  /**
   * Validate price (positive number with optional decimals)
   */
  isPrice: (value) => {
    const priceRegex = /^\d+(\.\d{1,2})?$/;
    return priceRegex.test(value) && parseFloat(value) >= 0;
  },

  /**
   * Validate URL
   */
  isUrl: (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
};

/**
 * Input sanitization utilities
 */
export const sanitizers = {
  /**
   * Sanitize string input by removing HTML tags and special characters
   */
  sanitizeString: (input) => {
    if (typeof input !== 'string') return input;
    return input
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
      .trim();
  },

  /**
   * Sanitize email
   */
  sanitizeEmail: (email) => {
    if (typeof email !== 'string') return email;
    return email.toLowerCase().trim();
  },

  /**
   * Sanitize number input
   */
  sanitizeNumber: (value) => {
    if (typeof value === 'number') return value;
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  },

  /**
   * Sanitize object keys and values
   */
  sanitizeObject: (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = sanitizers.sanitizeString(value);
      } else if (typeof value === 'object') {
        sanitized[key] = sanitizers.sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }
};

/**
 * Validation error handler
 */
export const ValidationError = (field, message) => {
  const error = new Error(message);
  error.field = field;
  error.type = 'VALIDATION_ERROR';
  return error;
};

/**
 * Validate form data based on schema
 */
export const validateForm = (data, schema) => {
  const errors = {};

  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];

    // Required validation
    if (rules.required && !validators.isRequired(value)) {
      errors[field] = `${field} is required`;
      continue;
    }

    // Skip other validations if field is empty and not required
    if (!validators.isRequired(value)) continue;

    // Type validation
    if (rules.type === 'email' && !validators.isEmail(value)) {
      errors[field] = `${field} must be a valid email`;
    }
    if (rules.type === 'number' && !validators.isNumeric(value)) {
      errors[field] = `${field} must be a number`;
    }
    if (rules.type === 'price' && !validators.isPrice(value)) {
      errors[field] = `${field} must be a valid price`;
    }
    if (rules.type === 'url' && !validators.isUrl(value)) {
      errors[field] = `${field} must be a valid URL`;
    }

    // Min/Max validation
    if (rules.min !== undefined && value < rules.min) {
      errors[field] = `${field} must be at least ${rules.min}`;
    }
    if (rules.max !== undefined && value > rules.max) {
      errors[field] = `${field} must be at most ${rules.max}`;
    }

    // Custom validation
    if (rules.custom && !rules.custom(value)) {
      errors[field] = rules.message || `${field} is invalid`;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
