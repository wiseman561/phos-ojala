import React, { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { AlertCircle, CheckCircle, ChevronDown, ChevronUp, Bell } from 'react-feather';
import { Snackbar, Alert as MuiAlert } from '@mui/material';
import signalRClient, { ChatMessage, PrivateMessage } from '../realtime/signalrClient';

const EscalatedAlertsPanel = () => {
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState([]);
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [socket, setSocket] = useState(null);
  const [signalRConnected, setSignalRConnected] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('info');
  const { token } = useAuth();

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const ALERTS_STREAMER_URL = process.env.REACT_APP_ALERTS_STREAMER_URL || 'http://localhost:5004';

  // Fetch initial alerts
  const fetchAlerts = useCallback(async () => {
    try {
      // Fetch active alerts
      const activeResponse = await fetch(`${API_URL}/alerts/active`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (activeResponse.ok) {
        const activeData = await activeResponse.json();
        setActiveAlerts(activeData);
      }

      // Fetch all alerts to get acknowledged ones
      const allResponse = await fetch(`${API_URL}/alerts`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (allResponse.ok) {
        const allData = await allResponse.json();
        setAcknowledgedAlerts(allData.filter(alert => alert.isAcknowledged));
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  }, [API_URL, token]);

  // Acknowledge an alert
  const acknowledgeAlert = async (alertId) => {
    try {
      const response = await fetch(`${API_URL}/alerts/${alertId}/acknowledge`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Update will come through WebSocket, but we can also update locally
        const alert = activeAlerts.find(a => a.id === alertId);
        if (alert) {
          setActiveAlerts(prev => prev.filter(a => a.id !== alertId));
          alert.isAcknowledged = true;
          alert.acknowledgedAt = new Date().toISOString();
          setAcknowledgedAlerts(prev => [alert, ...prev]);
        }
      }
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

      // Snackbar helper function
  const showSnackbar = useCallback((message, severity = 'info') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  }, []);

  const handleSnackbarClose = useCallback((event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  }, []);

  // SignalR message handlers
  const handleChatMessage = useCallback((message) => {
    console.log('[EscalatedAlertsPanel] Received chat message:', message);
    showSnackbar(`New message from ${message.user}: ${message.message}`, 'info');
  }, [showSnackbar]);

  const handlePrivateMessage = useCallback((message) => {
    console.log('[EscalatedAlertsPanel] Received private message:', message);
    showSnackbar(`Private message from ${message.sender}: ${message.message}`, 'warning');
  }, [showSnackbar]);

  const handleConnectionChange = useCallback((connected) => {
    console.log('[EscalatedAlertsPanel] SignalR connection changed:', connected);
    setSignalRConnected(connected);

    if (connected) {
      showSnackbar('Real-time connection established', 'success');
    } else {
      showSnackbar('Real-time connection lost', 'error');
    }
  }, [showSnackbar]);

  // Connect to both WebSocket and SignalR
  useEffect(() => {
    if (!token) return;

    // SignalR connection setup
    console.log('[EscalatedAlertsPanel] Setting up SignalR connection');

    // Connect to SignalR
    signalRClient.connect();

    // Subscribe to SignalR events
    const unsubscribeMessage = signalRClient.onMessage(handleChatMessage);
    const unsubscribePrivateMessage = signalRClient.onPrivateMessage(handlePrivateMessage);
    const unsubscribeConnection = signalRClient.onConnectionChange(handleConnectionChange);

    // WebSocket connection setup (keeping existing functionality)
    const newSocket = io(`${ALERTS_STREAMER_URL}/ws/alerts`, {
      query: { token },
      transports: ['websocket']
    });

    newSocket.on('connect', () => {
      console.log('Connected to alerts WebSocket');
    });

    newSocket.on('emergency-alert', (alert) => {
      console.log('Received emergency alert:', alert);
      setActiveAlerts(prev => {
        // Check if alert already exists
        if (prev.some(a => a.id === alert.id)) {
          return prev;
        }
        return [alert, ...prev];
      });

      // Auto-expand panel when new alert arrives
      setIsExpanded(true);
      showSnackbar(`Emergency Alert: ${alert.message}`, 'error');
    });

    newSocket.on('alert-acknowledged', (ack) => {
      console.log('Alert acknowledged:', ack);

      setActiveAlerts(prev => {
        const alertToMove = prev.find(a => a.id === ack.id);
        const filteredAlerts = prev.filter(a => a.id !== ack.id);

        if (alertToMove) {
          alertToMove.isAcknowledged = true;
          alertToMove.acknowledgedAt = ack.acknowledgedAt;
          alertToMove.acknowledgedBy = ack.acknowledgedBy;

          setAcknowledgedAlerts(prevAck => [alertToMove, ...prevAck]);
        }

        return filteredAlerts;
      });

      showSnackbar('Alert acknowledged successfully', 'success');
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from alerts WebSocket');
    });

    newSocket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    setSocket(newSocket);

    // Fetch initial alerts
    fetchAlerts();

    return () => {
      // Cleanup WebSocket
      newSocket.disconnect();

      // Cleanup SignalR subscriptions
      unsubscribeMessage();
      unsubscribePrivateMessage();
      unsubscribeConnection();
    };
      }, [token, ALERTS_STREAMER_URL, fetchAlerts, handleChatMessage, handlePrivateMessage, handleConnectionChange]);

  // Format timestamp
  const formatTime = (timestamp) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (error) {
      return 'Unknown time';
    }
  };

  // Get severity color
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'Emergency':
        return 'text-red-600';
      case 'Warning':
        return 'text-yellow-600';
      case 'Info':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  // Get severity icon
  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'Emergency':
        return <AlertCircle className="text-red-600" size={18} />;
      case 'Warning':
        return <AlertCircle className="text-yellow-600" size={18} />;
      case 'Info':
        return <AlertCircle className="text-blue-600" size={18} />;
      default:
        return <AlertCircle className="text-gray-600" size={18} />;
    }
  };

  return (
    <div className="w-full">
      {/* Banner */}
      <div
        className={`flex items-center justify-between p-3 ${
          activeAlerts.length > 0 ? 'bg-red-100 border-l-4 border-red-600' : 'bg-gray-100 border-l-4 border-gray-400'
        } cursor-pointer`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center">
          <Bell className={activeAlerts.length > 0 ? 'text-red-600 mr-2' : 'text-gray-600 mr-2'} size={20} />
          <span className="font-semibold">
            {activeAlerts.length > 0
              ? `${activeAlerts.length} Emergency Alert${activeAlerts.length > 1 ? 's' : ''}`
              : 'No Emergency Alerts'}
          </span>
        </div>
        <div>
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </div>

      {/* Expanded Panel */}
      {isExpanded && (
        <div className="border border-gray-300 p-4 bg-white shadow-md">
          {/* Filter Toggle */}
          <div className="mb-4 flex justify-between items-center">
            <h3 className="text-lg font-semibold">Alert Details</h3>
            <div className="flex items-center">
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="form-checkbox h-5 w-5 text-blue-600"
                  checked={showActiveOnly}
                  onChange={() => setShowActiveOnly(!showActiveOnly)}
                />
                <span className="ml-2 text-gray-700">Show Active Only</span>
              </label>
            </div>
          </div>

          {/* Active Alerts */}
          {activeAlerts.length > 0 ? (
            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-2">Active Alerts</h4>
              <div className="space-y-3">
                {activeAlerts.map(alert => (
                  <div key={alert.id} className="border-l-4 border-red-500 bg-red-50 p-3 rounded-r">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center">
                          {getSeverityIcon(alert.severity)}
                          <span className={`ml-2 font-semibold ${getSeverityColor(alert.severity)}`}>
                            {alert.severity}
                          </span>
                          <span className="ml-2 text-sm text-gray-500">
                            {formatTime(alert.timestamp)}
                          </span>
                        </div>
                        <p className="mt-1 text-gray-800">{alert.message}</p>
                        <div className="mt-1 text-sm text-gray-600">
                          <span>Patient ID: {alert.patientId}</span>
                          <span className="ml-3">Metric: {alert.metric}</span>
                          <span className="ml-3">Value: {alert.value}</span>
                        </div>
                      </div>
                      <button
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                        onClick={() => acknowledgeAlert(alert.id)}
                      >
                        Acknowledge
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              No active emergency alerts
            </div>
          )}

          {/* Acknowledged Alerts */}
          {!showActiveOnly && acknowledgedAlerts.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Acknowledged Alerts</h4>
              <div className="space-y-3">
                {acknowledgedAlerts.map(alert => (
                  <div key={alert.id} className="border-l-4 border-gray-300 bg-gray-50 p-3 rounded-r opacity-75">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center">
                          <CheckCircle className="text-green-600" size={18} />
                          <span className="ml-2 font-semibold text-gray-600">
                            {alert.severity} (Acknowledged)
                          </span>
                          <span className="ml-2 text-sm text-gray-500">
                            {formatTime(alert.timestamp)}
                          </span>
                        </div>
                        <p className="mt-1 text-gray-700">{alert.message}</p>
                        <div className="mt-1 text-sm text-gray-600">
                          <span>Patient ID: {alert.patientId}</span>
                          <span className="ml-3">Metric: {alert.metric}</span>
                          <span className="ml-3">Value: {alert.value}</span>
                        </div>
                        {alert.acknowledgedAt && (
                          <div className="mt-1 text-xs text-gray-500">
                            Acknowledged {formatTime(alert.acknowledgedAt)}
                            {alert.acknowledgedBy && ` by ${alert.acknowledgedBy}`}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SignalR Notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MuiAlert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </MuiAlert>
      </Snackbar>
    </div>
  );
};

export default EscalatedAlertsPanel;
