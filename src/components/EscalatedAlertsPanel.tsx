import React, { useState, useEffect } from 'react';
import { useEscalatedAlerts } from '../frontend/shared/hooks/useEscalatedAlerts';

export interface EscalatedAlert {
  id: string;
  patientId: string;
  patientName: string;
  alertType: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface EscalatedAlertsPanelProps {
  onAlertClick?: (alert: EscalatedAlert) => void;
  maxAlerts?: number;
  className?: string;
}

const EscalatedAlertsPanel: React.FC<EscalatedAlertsPanelProps> = ({
  onAlertClick,
  maxAlerts = 10,
  className = ''
}) => {
  const [alerts, setAlerts] = useState<EscalatedAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        // Mock API call - replace with actual implementation
        const response = await fetch('/api/alerts/escalated');
        if (!response.ok) {
          throw new Error('Failed to fetch escalated alerts');
        }
        const data = await response.json();
        setAlerts(data.slice(0, maxAlerts));
      } catch (err: any) {
        setError(err.message || 'Failed to load alerts');
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, [maxAlerts]);

  const handleAlertClick = (alert: EscalatedAlert) => {
    if (onAlertClick) {
      onAlertClick(alert);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className={`escalated-alerts-panel ${className}`}>
        <div className="loading-spinner" role="status" aria-label="Loading alerts">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`escalated-alerts-panel ${className}`}>
        <div className="error-message" role="alert">
          <h3 className="text-red-600 font-semibold">Error Loading Alerts</h3>
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`escalated-alerts-panel ${className}`}>
      <div className="panel-header">
        <h2 className="text-lg font-semibold text-gray-900">Escalated Alerts</h2>
        <span className="badge text-sm bg-red-100 text-red-800 px-2 py-1 rounded">
          {alerts.length} active
        </span>
      </div>

      <div className="alerts-list" role="list">
        {alerts.length === 0 ? (
          <div className="no-alerts text-center text-gray-500 py-4">
            No escalated alerts at this time
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className={`alert-item cursor-pointer border-l-4 border-red-500 bg-white p-4 shadow-sm hover:shadow-md transition-shadow ${
                !alert.isRead ? 'font-semibold' : ''
              }`}
              role="listitem"
              onClick={() => handleAlertClick(alert)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleAlertClick(alert);
                }
              }}
              tabIndex={0}
            >
              <div className="alert-header flex justify-between items-start">
                <div className="patient-info">
                  <h3 className="text-sm font-medium text-gray-900">
                    {alert.patientName}
                  </h3>
                  <p className="text-xs text-gray-500">ID: {alert.patientId}</p>
                </div>
                <div className={`severity-badge text-xs px-2 py-1 rounded ${getSeverityColor(alert.severity)}`}>
                  {alert.severity.toUpperCase()}
                </div>
              </div>

              <div className="alert-content mt-2">
                <p className="text-sm text-gray-700">{alert.message}</p>
                <div className="alert-meta flex justify-between items-center mt-2">
                  <span className="alert-type text-xs text-gray-500 capitalize">
                    {alert.alertType}
                  </span>
                  <span className="timestamp text-xs text-gray-400">
                    {new Date(alert.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>

              {!alert.isRead && (
                <div className="unread-indicator absolute right-2 top-2 w-2 h-2 bg-blue-600 rounded-full"></div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default EscalatedAlertsPanel;
