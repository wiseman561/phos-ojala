/**
 * Utility functions for managing escalated alerts in localStorage
 */

const STORAGE_KEY = 'escalated_alerts';

/**
 * Get all escalated alerts from localStorage
 * @returns {Array} Array of escalated alerts
 */
export const getEscalatedAlerts = () => {
  try {
    const alerts = localStorage.getItem(STORAGE_KEY);
    return alerts ? JSON.parse(alerts) : [];
  } catch (error) {
    console.error('Error reading escalated alerts from localStorage:', error);
    return [];
  }
};

/**
 * Save escalated alerts to localStorage
 * @param {Array} alerts - Array of escalated alerts to save
 */
export const saveEscalatedAlerts = (alerts) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
  } catch (error) {
    console.error('Error saving escalated alerts to localStorage:', error);
  }
};

/**
 * Add a new escalated alert
 * @param {Object} alert - Alert object to add
 * @returns {Array} Updated array of alerts
 */
export const addEscalatedAlert = (alert) => {
  const alerts = getEscalatedAlerts();
  const newAlert = {
    ...alert,
    id: Date.now().toString(), // Simple unique ID
    timestamp: new Date().toISOString(),
    status: 'pending'
  };
  const updatedAlerts = [...alerts, newAlert];
  saveEscalatedAlerts(updatedAlerts);
  return updatedAlerts;
};

/**
 * Update an existing escalated alert
 * @param {string} alertId - ID of alert to update
 * @param {Object} updates - Object containing updates to apply
 * @returns {Array} Updated array of alerts
 */
export const updateEscalatedAlert = (alertId, updates) => {
  const alerts = getEscalatedAlerts();
  const updatedAlerts = alerts.map(alert =>
    alert.id === alertId ? { ...alert, ...updates } : alert
  );
  saveEscalatedAlerts(updatedAlerts);
  return updatedAlerts;
};

/**
 * Remove an escalated alert
 * @param {string} alertId - ID of alert to remove
 * @returns {Array} Updated array of alerts
 */
export const removeEscalatedAlert = (alertId) => {
  const alerts = getEscalatedAlerts();
  const updatedAlerts = alerts.filter(alert => alert.id !== alertId);
  saveEscalatedAlerts(updatedAlerts);
  return updatedAlerts;
};

/**
 * Sort alerts by status and timestamp
 * @param {Array} alerts - Array of alerts to sort
 * @returns {Array} Sorted array of alerts
 */
export const sortEscalatedAlerts = (alerts) => {
  return [...alerts].sort((a, b) => {
    // First sort by status (pending first)
    if (a.status !== b.status) {
      return a.status === 'pending' ? -1 : 1;
    }
    // Then sort by timestamp (newest first)
    return new Date(b.timestamp) - new Date(a.timestamp);
  });
};
