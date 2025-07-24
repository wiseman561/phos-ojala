import React, { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../contexts/auth/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { AlertCircle, CheckCircle, ChevronDown, ChevronUp, Bell } from 'react-feather';
import { Snackbar, Alert as MuiAlert } from '@mui/material';
import signalRClient, { ChatMessage, PrivateMessage } from '../realtime/signalrClient';
import alertService from '../services/alertService';

console.log('[EscalatedAlertsPanel] File loaded successfully');

const EscalatedAlertsPanel = () => {
  console.log('🔥🔥🔥 ESCALATED ALERTS PANEL - LATEST VERSION WITH TOKEN FIX 🔥🔥🔥');
  console.log('[EscalatedAlertsPanel] Component mounting...');

  // Quick localStorage check
  const quickTokenCheck = localStorage.getItem('token') || localStorage.getItem('md-tokens');
  console.log('[EscalatedAlertsPanel] Quick localStorage check:', quickTokenCheck ? 'TOKEN FOUND!' : 'NO TOKEN');

  const [activeAlerts, setActiveAlerts] = useState([]);
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState([]);
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [socket, setSocket] = useState(null);
  const [signalRConnected, setSignalRConnected] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('info');

  console.log('[EscalatedAlertsPanel] About to call useAuth...');
  const authContext = useAuth();
  console.log('[EscalatedAlertsPanel] Full auth context:', authContext);
  const { token } = authContext;
  console.log('[EscalatedAlertsPanel] useAuth called, token:', !!token);
  console.log('[EscalatedAlertsPanel] Token value:', token ? 'present' : 'null/undefined');

  // Fallback: try to get token from localStorage
  const localStorageToken = localStorage.getItem('token') || localStorage.getItem('md-tokens');
  console.log('[EscalatedAlertsPanel] localStorage token:', localStorageToken ? 'present' : 'null/undefined');

  // Use localStorage token as fallback if context token is missing
  const finalToken = token || (localStorageToken ? JSON.parse(localStorageToken).accessToken : null);
  console.log('[EscalatedAlertsPanel] Final token to use:', finalToken ? 'present' : 'null/undefined');

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const ALERTS_STREAMER_URL = process.env.REACT_APP_ALERTS_STREAMER_URL || 'http://localhost:5004';

  // Fetch initial alerts
  const fetchAlerts = useCallback(async () => {
    try {
      // Fetch active alerts
      const activeData = await alertService.getActiveAlerts();
      setActiveAlerts(activeData);

      // Fetch acknowledged alerts
      const acknowledgedData = await alertService.getAcknowledgedAlerts();
      setAcknowledgedAlerts(acknowledgedData);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  }, []);

  // Acknowledge an alert
  const acknowledgeAlert = async (alertId) => {
    try {
      const result = await alertService.acknowledgeAlert(alertId);

      if (result.success) {
        // Update will come through WebSocket, but we can also update locally
        const alert = activeAlerts.find(a => a.id === alertId);
        if (alert) {
          setActiveAlerts(prev => prev.filter(a => a.id !== alertId));
          alert.isAcknowledged = true;
          alert.acknowledgedAt = result.acknowledgedAt;
          alert.acknowledgedBy = result.acknowledgedBy;
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

    // Handle SignalR alerts
  const handleSignalRAlert = useCallback((alert) => {
    console.log('[EscalatedAlertsPanel] Received SignalR alert:', alert);
    console.log('[EscalatedAlertsPanel] Alert details:', {
      id: alert.id,
      patientName: alert.patientName,
      message: alert.message,
      severity: alert.severity,
      timestamp: alert.timestamp
    });

    // Convert SignalR alert to our alert format
    const formattedAlert = {
      id: alert.id,
      patientName: alert.patientName,
      message: alert.message,
      severity: alert.severity || 'medium',
      timestamp: alert.timestamp,
      patientId: alert.patientId,
      alertType: alert.alertType,
      isAcknowledged: false
    };

    console.log('[EscalatedAlertsPanel] Formatted alert:', formattedAlert);

    setActiveAlerts(prev => {
      console.log('[EscalatedAlertsPanel] Previous alerts:', prev);
      // Check if alert already exists
      if (prev.some(a => a.id === alert.id)) {
        console.log('[EscalatedAlertsPanel] Alert already exists, skipping');
        return prev;
      }
      const newAlerts = [formattedAlert, ...prev];
      console.log('[EscalatedAlertsPanel] New alerts array:', newAlerts);
      return newAlerts;
    });

    // Auto-expand panel when new alert arrives
    setIsExpanded(true);
    showSnackbar(`New Alert: ${alert.message}`, 'warning');
  }, [showSnackbar]);

  console.log('[EscalatedAlertsPanel] About to define useEffect...');

  // Connect to both WebSocket and SignalR
  useEffect(() => {
    console.log('[EscalatedAlertsPanel] useEffect triggered');

    // Alert service connection setup
    console.log('[EscalatedAlertsPanel] Setting up alert service connection');

    // Connect to alert service
    alertService.connect();

    // Subscribe to alert service events
    console.log('[EscalatedAlertsPanel] Subscribing to alert service events...');
    const unsubscribeAlert = alertService.subscribeToAlerts(handleSignalRAlert);
    console.log('[EscalatedAlertsPanel] Alert service event subscriptions completed');

    // Legacy SignalR connection setup (keeping for backward compatibility)
    if (finalToken) {
      console.log('[EscalatedAlertsPanel] Setting up legacy SignalR connection');
      signalRClient.connect();

      // Subscribe to SignalR events
      console.log('[EscalatedAlertsPanel] Subscribing to legacy SignalR events...');
      const unsubscribeMessage = signalRClient.onMessage(handleChatMessage);
      const unsubscribePrivateMessage = signalRClient.onPrivateMessage(handlePrivateMessage);
      const unsubscribeConnection = signalRClient.onConnectionChange(handleConnectionChange);
      console.log('[EscalatedAlertsPanel] Legacy SignalR event subscriptions completed');
    }

    // WebSocket connection setup (keeping existing functionality)
    const newSocket = io(`${ALERTS_STREAMER_URL}/ws/alerts`, {
      query: { token: finalToken },
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

      // Cleanup alert service subscriptions
      unsubscribeAlert();

      // Cleanup legacy SignalR subscriptions (if they exist)
      if (finalToken) {
        unsubscribeMessage();
        unsubscribePrivateMessage();
        unsubscribeConnection();
      }
    };
  }, [finalToken, ALERTS_STREAMER_URL]);

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
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  console.log('[EscalatedAlertsPanel] Manual test alert triggered');
                  signalRClient.simulateAlert({
                    id: `manual-test-${Date.now()}`,
                    patientName: 'Manual Test Patient',
                    alertType: 'critical',
                    message: 'Manual test alert from EscalatedAlertsPanel',
                    patientId: 999,
                    severity: 'high'
                  });
                }}
                className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
              >
                Test Alert
              </button>
              <button
                onClick={() => {
                  console.log('[EscalatedAlertsPanel] Testing localStorage token...');
                  const token = localStorage.getItem('token') || localStorage.getItem('md-tokens');
                  console.log('[EscalatedAlertsPanel] localStorage token:', token);
                  if (token) {
                    try {
                      const parsed = JSON.parse(token);
                      console.log('[EscalatedAlertsPanel] Parsed token:', parsed);
                      console.log('[EscalatedAlertsPanel] Access token:', parsed.accessToken);
                    } catch (e) {
                      console.log('[EscalatedAlertsPanel] Token is not JSON:', token);
                    }
                  }
                }}
                className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 ml-2"
              >
                Test Token
              </button>
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
