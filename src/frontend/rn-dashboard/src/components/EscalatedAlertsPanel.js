import React, { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { AlertCircle, CheckCircle, ChevronDown, ChevronUp, Bell } from 'react-feather';
import { nurseApi } from '../services/apiClient';

const EscalatedAlertsPanel = () => {
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState([]);
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [socket, setSocket] = useState(null);
  const { isAuthenticated, user } = useAuth();
  
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const ALERTS_STREAMER_URL = process.env.REACT_APP_ALERTS_STREAMER_URL || 'http://localhost:5004';

  // Get access token for WebSocket authentication
  const getAccessToken = () => {
    const tokens = localStorage.getItem('rn-dashboard-tokens');
    if (tokens) {
      const parsedTokens = JSON.parse(tokens);
      return parsedTokens.accessToken;
    }
    return null;
  };

  // Fetch initial alerts using the API client
  const fetchAlerts = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      // Fetch active alerts using API client
      const activeResponse = await nurseApi.getActiveAlerts();
      setActiveAlerts(activeResponse.data);
      
      // Fetch all alerts to get acknowledged ones
      const allResponse = await nurseApi.getAllAlerts();
      setAcknowledgedAlerts(allResponse.data.filter(alert => alert.isAcknowledged));
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  }, [isAuthenticated]);

  // Acknowledge an alert using API client
  const acknowledgeAlert = async (alertId) => {
    if (!isAuthenticated) return;
    
    try {
      await nurseApi.acknowledgeAlert(alertId);
      
      // Update local state
      const alert = activeAlerts.find(a => a.id === alertId);
      if (alert) {
        setActiveAlerts(prev => prev.filter(a => a.id !== alertId));
        alert.isAcknowledged = true;
        alert.acknowledgedAt = new Date().toISOString();
        alert.acknowledgedBy = user?.id;
        setAcknowledgedAlerts(prev => [alert, ...prev]);
      }
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  // Connect to WebSocket
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const token = getAccessToken();
    if (!token) return;
    
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
      newSocket.disconnect();
    };
  }, [isAuthenticated, ALERTS_STREAMER_URL, fetchAlerts]);

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

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

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
          {/* Filter buttons */}
          <div className="flex space-x-2 mb-4">
            <button
              className={`px-3 py-1 rounded text-sm ${
                showActiveOnly 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              onClick={() => setShowActiveOnly(true)}
            >
              Active ({activeAlerts.length})
            </button>
            <button
              className={`px-3 py-1 rounded text-sm ${
                !showActiveOnly 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              onClick={() => setShowActiveOnly(false)}
            >
              Acknowledged ({acknowledgedAlerts.length})
            </button>
          </div>

          {/* Alerts List */}
          <div className="max-h-96 overflow-y-auto">
            {showActiveOnly ? (
              activeAlerts.length > 0 ? (
                activeAlerts.map((alert) => (
                  <div key={alert.id} className="border-b border-gray-200 py-3 last:border-b-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          {getSeverityIcon(alert.severity)}
                          <span className={`font-semibold text-sm ${getSeverityColor(alert.severity)}`}>
                            {alert.severity}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatTime(alert.timestamp)}
                          </span>
                        </div>
                        <h4 className="font-medium text-gray-900 mb-1">{alert.title}</h4>
                        <p className="text-sm text-gray-600 mb-2">{alert.description}</p>
                        <div className="text-xs text-gray-500">
                          <span>Patient: {alert.patientName || 'Unknown'}</span>
                          {alert.location && <span> • Location: {alert.location}</span>}
                        </div>
                      </div>
                      <div className="ml-4">
                        <button
                          onClick={() => acknowledgeAlert(alert.id)}
                          className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                        >
                          Acknowledge
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="mx-auto mb-2 text-green-500" size={32} />
                  <p>No active emergency alerts</p>
                </div>
              )
            ) : (
              acknowledgedAlerts.length > 0 ? (
                acknowledgedAlerts.map((alert) => (
                  <div key={alert.id} className="border-b border-gray-200 py-3 last:border-b-0 opacity-75">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <CheckCircle className="text-green-600" size={18} />
                          <span className="font-semibold text-sm text-green-600">
                            Acknowledged
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatTime(alert.acknowledgedAt)}
                          </span>
                        </div>
                        <h4 className="font-medium text-gray-700 mb-1">{alert.title}</h4>
                        <p className="text-sm text-gray-500 mb-2">{alert.description}</p>
                        <div className="text-xs text-gray-400">
                          <span>Patient: {alert.patientName || 'Unknown'}</span>
                          {alert.acknowledgedBy && <span> • Acknowledged by: Nurse {alert.acknowledgedBy}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No acknowledged alerts</p>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EscalatedAlertsPanel;
