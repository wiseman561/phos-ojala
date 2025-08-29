import { useState, useEffect } from 'react';

/**
 * useEscalatedAlerts Hook (Web Stub)
 *
 * Minimal web-compatible version of the useEscalatedAlerts hook
 */
export const useEscalatedAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading with mock data
    setTimeout(() => {
      setAlerts([
        {
          id: 'alert-1',
          patientId: 'patient-1',
          patientName: 'John Doe',
          message: 'Blood pressure elevated consistently',
          severity: 'critical',
          metric: 'Blood Pressure',
          value: '160/100',
          timestamp: new Date().toISOString(),
          status: 'pending',
          escalatedBy: 'RN'
        },
        {
          id: 'alert-2',
          patientId: 'patient-2',
          patientName: 'Jane Smith',
          message: 'Missed medication doses',
          severity: 'medium',
          metric: 'Medication Adherence',
          value: '60%',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          status: 'approved',
          escalatedBy: 'RN'
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const addAlert = (alert) => {
    const newAlert = {
      ...alert,
      id: `alert-${Date.now()}`,
      timestamp: new Date().toISOString(),
      status: 'pending'
    };
    setAlerts(prev => [newAlert, ...prev]);
  };

  const approveAlert = (alertId) => {
    setAlerts(prev => prev.map(alert =>
      alert.id === alertId ? { ...alert, status: 'approved' } : alert
    ));
  };

  const dismissAlert = (alertId) => {
    setAlerts(prev => prev.map(alert =>
      alert.id === alertId ? { ...alert, status: 'dismissed' } : alert
    ));
  };

  return {
    alerts,
    loading,
    addAlert,
    approveAlert,
    dismissAlert
  };
};
