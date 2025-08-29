import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import CreateAlertModal from '../components/CreateAlertModal';
import { XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

// Storage key for alerts
const STORAGE_KEY = 'phos_admin_alerts';
const MAX_ALERTS = 20;
const ALERTS_PER_PAGE = 10;

// Mock initial alerts data
const initialAlerts = [
  {
    id: '1',
    title: 'High Priority Alert',
    message: 'Patient requires immediate attention',
    priority: 'High',
    timestamp: '2024-03-20T10:00:00Z',
    status: 'Active',
    resolved: false
  },
  {
    id: '2',
    title: 'Medium Priority Alert',
    message: 'Regular check-up required',
    priority: 'Medium',
    timestamp: '2024-03-20T09:30:00Z',
    status: 'Active',
    resolved: false
  },
  {
    id: '3',
    title: 'Low Priority Alert',
    message: 'Routine update available',
    priority: 'Low',
    timestamp: '2024-03-20T09:00:00Z',
    status: 'Active',
    resolved: false
  }
];

// Helper function to save alerts to localStorage
const saveAlertsToStorage = (alerts) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
  } catch (error) {
    console.error('Error saving alerts to localStorage:', error);
  }
};

// Helper function to load alerts from localStorage
const loadAlertsFromStorage = () => {
  try {
    const savedAlerts = localStorage.getItem(STORAGE_KEY);
    return savedAlerts ? JSON.parse(savedAlerts) : null;
  } catch (error) {
    console.error('Error loading alerts from localStorage:', error);
    return null;
  }
};

// Helper function to sort alerts by timestamp and resolved status
const sortAlerts = (alerts) => {
  return [...alerts].sort((a, b) => {
    // First sort by resolved status
    if (a.resolved !== b.resolved) {
      return a.resolved ? 1 : -1;
    }
    // Then sort by timestamp
    return new Date(b.timestamp) - new Date(a.timestamp);
  });
};

// Helper function to limit alerts array size
const limitAlertsArray = (alerts) => {
  return alerts.slice(0, MAX_ALERTS);
};

// Helper function to format timestamp
const formatTimestamp = (timestamp) => {
  try {
    const date = new Date(timestamp);
    return date.toLocaleString(undefined, {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    console.error('Error formatting timestamp:', error);
    return 'Invalid date';
  }
};

export default function Alerts() {
  const [alerts, setAlerts] = useState(initialAlerts);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [visibleAlerts, setVisibleAlerts] = useState(ALERTS_PER_PAGE);

  // Load alerts from localStorage on component mount
  useEffect(() => {
    const savedAlerts = loadAlertsFromStorage();
    if (savedAlerts) {
      const sortedAlerts = sortAlerts(savedAlerts);
      const limitedAlerts = limitAlertsArray(sortedAlerts);
      setAlerts(limitedAlerts);
    } else {
      const sortedInitialAlerts = sortAlerts(initialAlerts);
      saveAlertsToStorage(sortedInitialAlerts);
    }
  }, []);

  const handleCreateAlert = (newAlert) => {
    const updatedAlerts = limitAlertsArray(
      sortAlerts([{ ...newAlert, resolved: false }, ...alerts])
    );
    setAlerts(updatedAlerts);
    saveAlertsToStorage(updatedAlerts);
  };

  const handleResolveAlert = (alertId) => {
    const updatedAlerts = alerts.map(alert =>
      alert.id === alertId ? { ...alert, resolved: !alert.resolved } : alert
    );
    const sortedAlerts = sortAlerts(updatedAlerts);
    setAlerts(sortedAlerts);
    saveAlertsToStorage(sortedAlerts);
  };

  const handleArchiveAlert = (alertId) => {
    const updatedAlerts = alerts.filter(alert => alert.id !== alertId);
    setAlerts(updatedAlerts);
    saveAlertsToStorage(updatedAlerts);
  };

  const handleLoadMore = () => {
    setVisibleAlerts(prev => prev + ALERTS_PER_PAGE);
  };

  const getPriorityStyles = (priority) => {
    switch (priority) {
      case 'High':
        return {
          bg: 'bg-red-50 dark:bg-red-900/20',
          text: 'text-red-800 dark:text-red-200',
          border: 'border-red-100 dark:border-red-800',
          badge: 'bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200'
        };
      case 'Medium':
        return {
          bg: 'bg-yellow-50 dark:bg-yellow-900/20',
          text: 'text-yellow-800 dark:text-yellow-200',
          border: 'border-yellow-100 dark:border-yellow-800',
          badge: 'bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200'
        };
      case 'Low':
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          text: 'text-blue-800 dark:text-blue-200',
          border: 'border-blue-100 dark:border-blue-800',
          badge: 'bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200'
        };
      default:
        return {
          bg: 'bg-gray-50 dark:bg-gray-900/20',
          text: 'text-gray-800 dark:text-gray-200',
          border: 'border-gray-100 dark:border-gray-800',
          badge: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
        };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Alerts</h2>
        <div className="flex space-x-4">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          >
            Create Alert
          </button>
          <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800">
            Filter
          </button>
        </div>
      </div>

      <Card>
        <div className="space-y-4">
          {alerts.slice(0, visibleAlerts).map((alert) => {
            const styles = getPriorityStyles(alert.priority);
            return (
              <div
                key={alert.id}
                className={`flex items-center justify-between p-4 ${styles.bg} rounded-lg border-l-4 ${styles.border} transition-all duration-200 ${
                  alert.resolved ? 'opacity-50 italic' : ''
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className={`text-sm font-medium ${styles.text}`}>{alert.title}</h3>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleResolveAlert(alert.id)}
                        className={`p-1 rounded-full hover:bg-white dark:hover:bg-gray-700 transition-colors ${
                          alert.resolved ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'
                        }`}
                        title={alert.resolved ? 'Unresolve' : 'Resolve'}
                      >
                        <CheckCircleIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleArchiveAlert(alert.id)}
                        className="p-1 rounded-full hover:bg-white dark:hover:bg-gray-700 transition-colors text-gray-400 dark:text-gray-500"
                        title="Archive"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  <p className={`text-sm ${styles.text}`}>{alert.message}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formatTimestamp(alert.timestamp)}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles.badge} ml-4`}>
                  {alert.priority}
                </span>
              </div>
            );
          })}

          {visibleAlerts < alerts.length && (
            <div className="flex justify-center pt-4">
              <button
                onClick={handleLoadMore}
                className="px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 rounded-lg"
              >
                Load More
              </button>
            </div>
          )}
        </div>
      </Card>

      <CreateAlertModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleCreateAlert}
      />
    </div>
  );
}
