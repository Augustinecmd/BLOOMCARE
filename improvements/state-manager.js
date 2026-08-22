/**
 * Application State Manager
 * 
 * Centralized state management for user, profile, records, and appointments.
 * Replaces scattered global variables (currentUser, currentProfile, etc.)
 * 
 * Usage:
 *   import stateManager from './state-manager.js';
 *   stateManager.setCurrentUser(user);
 *   const user = stateManager.getCurrentUser();
 *   stateManager.subscribe(state => console.log('State changed:', state));
 */

import logger from './logger.js';

/**
 * Application state store
 */
class StateManager {
  constructor() {
    this.state = {
      user: null,           // Current authenticated user
      profile: null,        // User's pregnancy profile
      records: [],          // Health records
      appointment: null,    // Pending appointment request
      loading: false,       // Global loading state
      error: null,          // Current error message
      lastUpdated: null,    // Last state update timestamp
    };

    this.subscribers = [];  // State change listeners
  }

  /**
   * Subscribe to state changes
   * @param {Function} callback - Called with new state on changes
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback) {
    this.subscribers.push(callback);
    logger.debug('State subscriber added', { totalSubscribers: this.subscribers.length });
    
    // Return unsubscribe function
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  /**
   * Notify all subscribers of state changes
   * @private
   */
  notifySubscribers() {
    this.state.lastUpdated = new Date().toISOString();
    this.subscribers.forEach(callback => {
      try {
        callback({ ...this.state });
      } catch (error) {
        logger.error('State subscriber error', error);
      }
    });
  }

  /**
   * Update state immutably and notify subscribers
   * @private
   */
  setState(updates) {
    const changed = Object.keys(updates).some(key => 
      JSON.stringify(this.state[key]) !== JSON.stringify(updates[key])
    );
    
    if (!changed) return;

    this.state = { ...this.state, ...updates };
    this.notifySubscribers();
    
    logger.debug('State updated', {
      changed: Object.keys(updates),
      timestamp: this.state.lastUpdated,
    });
  }

  // =========================================================================
  // USER MANAGEMENT
  // =========================================================================

  /**
   * Set current authenticated user
   * @param {Object|null} user - User object from Firebase Auth or null
   */
  setCurrentUser(user) {
    this.setState({ user, error: null });
    
    if (!user) {
      logger.info('User logged out');
      this.clearUserData();
    } else {
      logger.info('User authenticated', { 
        uid: user.uid, 
        email: user.email 
      });
    }
  }

  /**
   * Get current authenticated user
   * @returns {Object|null}
   */
  getCurrentUser() {
    return this.state.user;
  }

  /**
   * Get current user's email
   * @returns {string}
   */
  getCurrentUserEmail() {
    return this.state.user?.email || '';
  }

  /**
   * Check if user is authenticated
   * @returns {boolean}
   */
  isAuthenticated() {
    return this.state.user !== null && this.state.user !== undefined;
  }

  /**
   * Update current user (partial update)
   * @param {Object} updates - Partial user object
   */
  updateCurrentUser(updates) {
    if (!this.state.user) {
      logger.warn('Attempted to update user when not authenticated');
      return;
    }
    
    const updated = { ...this.state.user, ...updates };
    this.setState({ user: updated });
  }

  // =========================================================================
  // PROFILE MANAGEMENT
  // =========================================================================

  /**
   * Set user's pregnancy profile
   * @param {Object|null} profile - Pregnancy profile object
   */
  setProfile(profile) {
    this.setState({ profile });
    
    if (profile) {
      logger.info('Profile loaded', { 
        lmp: profile.lmp, 
        hasEdd: !!profile.edd 
      });
    }
  }

  /**
   * Get current profile
   * @returns {Object|null}
   */
  getProfile() {
    return this.state.profile;
  }

  /**
   * Update profile (partial update)
   * @param {Object} updates - Partial profile object
   */
  updateProfile(updates) {
    if (!this.state.profile) {
      this.setProfile(updates);
      return;
    }
    
    const updated = { ...this.state.profile, ...updates };
    this.setState({ profile: updated });
    
    logger.info('Profile updated', { updated: Object.keys(updates) });
  }

  /**
   * Clear profile data
   */
  clearProfile() {
    this.setState({ profile: null });
  }

  // =========================================================================
  // HEALTH RECORDS MANAGEMENT
  // =========================================================================

  /**
   * Set all health records
   * @param {Array} records - Array of health record objects
   */
  setRecords(records) {
    if (!Array.isArray(records)) {
      logger.warn('setRecords called with non-array', { type: typeof records });
      return;
    }
    
    this.setState({ records });
    logger.debug('Records loaded', { count: records.length });
  }

  /**
   * Get all health records
   * @returns {Array}
   */
  getRecords() {
    return this.state.records;
  }

  /**
   * Add new health record to collection
   * @param {Object} record - New health record
   */
  addRecord(record) {
    const records = [record, ...this.state.records];
    this.setState({ records });
    logger.info('Record added', { recordId: record.id });
  }

  /**
   * Update existing record
   * @param {string} recordId - Record ID
   * @param {Object} updates - Partial record update
   */
  updateRecord(recordId, updates) {
    const records = this.state.records.map(r => 
      r.id === recordId ? { ...r, ...updates } : r
    );
    this.setState({ records });
    logger.info('Record updated', { recordId });
  }

  /**
   * Get latest record
   * @returns {Object|null}
   */
  getLatestRecord() {
    return this.state.records[0] || null;
  }

  /**
   * Clear all records
   */
  clearRecords() {
    this.setState({ records: [] });
  }

  // =========================================================================
  // APPOINTMENT MANAGEMENT
  // =========================================================================

  /**
   * Set pending appointment request
   * @param {Object|null} appointment - Appointment request object
   */
  setAppointment(appointment) {
    this.setState({ appointment });
    
    if (appointment) {
      logger.info('Appointment set', { 
        type: appointment.type,
        status: appointment.status 
      });
    }
  }

  /**
   * Get pending appointment
   * @returns {Object|null}
   */
  getAppointment() {
    return this.state.appointment;
  }

  /**
   * Clear appointment
   */
  clearAppointment() {
    this.setState({ appointment: null });
  }

  // =========================================================================
  // ERROR HANDLING
  // =========================================================================

  /**
   * Set error message for display
   * @param {string|Error|null} error - Error message, Error object, or null
   */
  setError(error) {
    let message = null;
    
    if (error) {
      if (error instanceof Error) {
        message = error.message;
        logger.error('Application error', error);
      } else {
        message = String(error);
        logger.warn('Error set', { message });
      }
    }
    
    this.setState({ error: message });
  }

  /**
   * Get current error message
   * @returns {string|null}
   */
  getError() {
    return this.state.error;
  }

  /**
   * Clear error message
   */
  clearError() {
    this.setState({ error: null });
  }

  // =========================================================================
  // LOADING STATE
  // =========================================================================

  /**
   * Set global loading state
   * @param {boolean} loading
   */
  setLoading(loading) {
    this.setState({ loading });
    logger.debug('Loading state changed', { loading });
  }

  /**
   * Get loading state
   * @returns {boolean}
   */
  isLoading() {
    return this.state.loading;
  }

  // =========================================================================
  // UTILITY METHODS
  // =========================================================================

  /**
   * Get entire state object (for debugging)
   * @returns {Object}
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Clear all user data while keeping auth state
   * (Called on logout or session clear)
   */
  clearUserData() {
    this.setState({
      profile: null,
      records: [],
      appointment: null,
      error: null,
    });
    logger.debug('User data cleared');
  }

  /**
   * Reset entire state to initial values
   */
  reset() {
    this.state = {
      user: null,
      profile: null,
      records: [],
      appointment: null,
      loading: false,
      error: null,
      lastUpdated: null,
    };
    this.notifySubscribers();
    logger.info('State manager reset');
  }

  /**
   * Load state from localStorage (for session restoration)
   * @param {string} key - localStorage key
   * @returns {boolean} Whether restoration was successful
   */
  restoreFromStorage(key) {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return false;

      const saved = JSON.parse(stored);
      
      // Only restore non-sensitive data (never restore auth tokens)
      if (saved.profile) this.setProfile(saved.profile);
      if (saved.records) this.setRecords(saved.records);
      
      logger.info('State restored from storage');
      return true;
    } catch (error) {
      logger.error('Failed to restore state from storage', error);
      return false;
    }
  }

  /**
   * Save state to localStorage
   * @param {string} key - localStorage key
   * @param {boolean} includeUser - Whether to save user (default: false for security)
   */
  saveToStorage(key, includeUser = false) {
    try {
      const toSave = {
        profile: this.state.profile,
        records: this.state.records,
        ...(includeUser && { user: this.state.user }),
      };
      
      localStorage.setItem(key, JSON.stringify(toSave));
      logger.debug('State saved to storage', { key });
    } catch (error) {
      logger.error('Failed to save state to storage', error);
    }
  }

  /**
   * Get combined user info (for display purposes)
   * @returns {Object} Combined user and profile data
   */
  getUserInfo() {
    const user = this.state.user;
    const profile = this.state.profile;
    
    return {
      email: user?.email || '',
      displayName: user?.displayName || profile?.firstName || 'User',
      firstName: profile?.firstName || user?.displayName?.split(' ')[0] || '',
      lastName: profile?.lastName || user?.displayName?.split(' ')[1] || '',
      hasProfile: !!profile,
      lmp: profile?.lmp || '',
      edd: profile?.edd || '',
      recordCount: this.state.records.length,
    };
  }
}

// Create singleton instance
const stateManager = new StateManager();

export default stateManager;

// Also export the class for testing/mocking
export { StateManager };
