import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import {
  getEscalatedAlerts,
  addEscalatedAlert,
  updateEscalatedAlert,
  removeEscalatedAlert,
  sortEscalatedAlerts
} from '../utils/alertStorage';

/**
 * Custom hook for managing escalated alerts
 * @returns {Object} Object containing alerts state and operations
 */
export const useEscalatedAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load alerts on mount
  useEffect(() => {
    const loadAlerts = () => {
      const storedAlerts = getEscalatedAlerts();
      setAlerts(sortEscalatedAlerts(storedAlerts));
      setLoading(false);
    };

    loadAlerts();

    // Listen for storage changes
    const handleStorageChange = (e) => {
      if (e.key === 'escalated_alerts') {
        loadAlerts();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Add new alert
  const addAlert = useCallback((alert) => {
    const updatedAlerts = addEscalatedAlert(alert);
    setAlerts(sortEscalatedAlerts(updatedAlerts));
    toast.success('Alert escalated successfully');
  }, []);

  // Update alert status
  const updateAlert = useCallback((alertId, updates) => {
    const updatedAlerts = updateEscalatedAlert(alertId, updates);
    setAlerts(sortEscalatedAlerts(updatedAlerts));
    toast.success('Alert updated successfully');
  }, []);

  // Remove alert
  const removeAlert = useCallback((alertId) => {
    const updatedAlerts = removeEscalatedAlert(alertId);
    setAlerts(sortEscalatedAlerts(updatedAlerts));
    toast.success('Alert removed successfully');
  }, []);

  // Approve alert
  const approveAlert = useCallback((alertId) => {
    updateAlert(alertId, { status: 'approved' });
  }, [updateAlert]);

  // Dismiss alert
  const dismissAlert = useCallback((alertId) => {
    updateAlert(alertId, { status: 'dismissed' });
  }, [updateAlert]);

  return {
    alerts,
    loading,
    addAlert,
    updateAlert,
    removeAlert,
    approveAlert,
    dismissAlert
  };
};
