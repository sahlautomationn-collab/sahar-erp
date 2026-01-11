/**
 * Authentication and Session Management utilities
 */

const AUTH_KEYS = {
  TOKEN: 'erp_auth_token',
  USER: 'erp_user',
  ROLE: 'erp_role',
  SESSION_TIMESTAMP: 'erp_session_timestamp'
};

const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Helper function to safely access localStorage (client-side only)
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
  } catch (error) {
    console.error('Failed to set localStorage item:', error);
  }
};

const safeRemoveItem = (key) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to remove localStorage item:', error);
  }
};

/**
 * Authentication utilities
 */
export const auth = {
  /**
   * Check if user is authenticated
   */
  isAuthenticated: () => {
    const token = safeGetItem(AUTH_KEYS.TOKEN);
    const timestamp = safeGetItem(AUTH_KEYS.SESSION_TIMESTAMP);

    if (!token || !timestamp) {
      return false;
    }

    // Check session timeout
    const sessionAge = Date.now() - parseInt(timestamp);
    if (sessionAge > SESSION_TIMEOUT) {
      auth.logout();
      return false;
    }

    return true;
  },

  /**
   * Get current user role
   */
  getRole: () => {
    return safeGetItem(AUTH_KEYS.ROLE) || 'user';
  },

  /**
   * Get current user data
   */
  getUser: () => {
    try {
      const userStr = safeGetItem(AUTH_KEYS.USER);
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },

  /**
   * Set authentication data
   */
  setAuth: (token, user, role) => {
    safeSetItem(AUTH_KEYS.TOKEN, token);
    safeSetItem(AUTH_KEYS.USER, JSON.stringify(user));
    safeSetItem(AUTH_KEYS.ROLE, role || 'user');
    safeSetItem(AUTH_KEYS.SESSION_TIMESTAMP, Date.now().toString());
  },

  /**
   * Logout user
   */
  logout: () => {
    safeRemoveItem(AUTH_KEYS.TOKEN);
    safeRemoveItem(AUTH_KEYS.USER);
    safeRemoveItem(AUTH_KEYS.ROLE);
    safeRemoveItem(AUTH_KEYS.SESSION_TIMESTAMP);
    console.log('Logged out successfully');
  },

  /**
   * Update session timestamp to keep session alive
   */
  refreshSession: () => {
    if (auth.isAuthenticated()) {
      safeSetItem(AUTH_KEYS.SESSION_TIMESTAMP, Date.now().toString());
    }
  },

  /**
   * Check if user has required role
   */
  hasRole: (requiredRole) => {
    const userRole = auth.getRole();
    const roleHierarchy = {
      admin: 3,
      manager: 2,
      user: 1
    };

    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
  }
};

/**
 * Auto-refresh session every hour (client-side only)
 */
if (typeof window !== 'undefined') {
  setInterval(() => {
    auth.refreshSession();
  }, 60 * 60 * 1000); // Every hour
}
