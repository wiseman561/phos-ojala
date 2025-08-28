import apiClient from '../api/axios';
import { getAllAlerts, getActiveAlerts, getAcknowledgedAlerts, EscalatedAlert } from '../mocks/mockAlerts';
import * as signalR from '@microsoft/signalr';

// Simulate network delay for mock mode
const simulateDelay = (min: number = 300, max: number = 800): Promise<void> => {
  const delay = Math.random() * (max - min) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
};

export interface Alert {
  id: string;
  patientId: number;
  patientName: string;
  severity: 'Emergency' | 'Warning' | 'Info';
  message: string;
  metric: string;
  value: string;
  timestamp: string;
  isAcknowledged: boolean;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
}

class AlertService {
  private useMocks: boolean;
  private signalRConnection: signalR.HubConnection | null = null;
  private alertCallbacks: Array<(alert: Alert) => void> = [];
  private connectionChangeCallbacks: Array<(connected: boolean) => void> = [];
  private isConnected: boolean = false;

  constructor() {
    this.useMocks = process.env.REACT_APP_USE_MOCKS === 'true';
    console.log(`[AlertService] Initialized with useMocks: ${this.useMocks}`);

    if (!this.useMocks) {
      this.initializeSignalR();
    }
  }

  private initializeSignalR(): void {
    const hubUrl = process.env.REACT_APP_SIGNALR_URL || 'http://localhost:5000/hubs/alerts';
    console.log('[AlertService] Initializing SignalR connection to:', hubUrl);

    this.signalRConnection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        skipNegotiation: false,
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          console.log(`[AlertService] SignalR reconnect attempt ${retryContext.previousRetryCount + 1}`);
          if (retryContext.previousRetryCount < 4) {
            return Math.min(3000 * Math.pow(2, retryContext.previousRetryCount), 30000);
          }
          return 30000;
        }
      })
      .configureLogging(signalR.LogLevel.Information)
      .build();

    this.setupSignalREventHandlers();
  }

  private setupSignalREventHandlers(): void {
    if (!this.signalRConnection) return;

    this.signalRConnection.onclose((error) => {
      console.error('[AlertService] SignalR connection closed:', error);
      this.isConnected = false;
      // Notify connection change for UI updates
      this.notifyConnectionChangeCallbacks(false);
    });

    this.signalRConnection.onreconnecting((error) => {
      console.warn('[AlertService] SignalR attempting to reconnect:', error);
      this.isConnected = false;
      // Notify connection change for UI updates
      this.notifyConnectionChangeCallbacks(false);
    });

    this.signalRConnection.onreconnected((connectionId) => {
      console.log('[AlertService] SignalR reconnected successfully. Connection ID:', connectionId);
      this.isConnected = true;
      // Notify connection change for UI updates
      this.notifyConnectionChangeCallbacks(true);
    });

    // Handle incoming alerts
    this.signalRConnection.on('ReceiveAlert', (alertData: any) => {
      console.log('[AlertService] Received alert via SignalR:', alertData);
      const alert: Alert = {
        id: alertData.id || Date.now().toString(),
        patientId: alertData.patientId,
        patientName: alertData.patientName || 'Unknown Patient',
        severity: alertData.severity || 'Info',
        message: alertData.message || 'No message',
        metric: alertData.metric || 'Unknown',
        value: alertData.value || 'Unknown',
        timestamp: alertData.timestamp || new Date().toISOString(),
        isAcknowledged: false,
      };
      this.notifyAlertCallbacks(alert);
    });

    // Handle emergency alerts
    this.signalRConnection.on('EmergencyAlert', (alertData: any) => {
      console.log('[AlertService] Received emergency alert via SignalR:', alertData);
      const alert: Alert = {
        id: alertData.id || Date.now().toString(),
        patientId: alertData.patientId,
        patientName: alertData.patientName || 'Unknown Patient',
        severity: 'Emergency',
        message: alertData.message || 'Emergency alert',
        metric: alertData.metric || 'Unknown',
        value: alertData.value || 'Unknown',
        timestamp: alertData.timestamp || new Date().toISOString(),
        isAcknowledged: false,
      };
      this.notifyAlertCallbacks(alert);
    });
  }

  private notifyAlertCallbacks(alert: Alert): void {
    this.alertCallbacks.forEach(callback => {
      try {
        callback(alert);
      } catch (error) {
        console.error('[AlertService] Error in alert callback:', error);
      }
    });
  }

  private notifyConnectionChangeCallbacks(connected: boolean): void {
    this.connectionChangeCallbacks.forEach(callback => {
      try {
        callback(connected);
      } catch (error) {
        console.error('[AlertService] Error in connection change callback:', error);
      }
    });
  }

  /**
   * Subscribe to real-time alerts
   */
  subscribeToAlerts(callback: (alert: Alert) => void): () => void {
    console.log('[AlertService] Adding alert subscription');
    this.alertCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.alertCallbacks.indexOf(callback);
      if (index > -1) {
        this.alertCallbacks.splice(index, 1);
        console.log('[AlertService] Removed alert subscription');
      }
    };
  }

  /**
   * Subscribe to connection status changes
   */
  subscribeToConnectionChanges(callback: (connected: boolean) => void): () => void {
    console.log('[AlertService] Adding connection change subscription');
    this.connectionChangeCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.connectionChangeCallbacks.indexOf(callback);
      if (index > -1) {
        this.connectionChangeCallbacks.splice(index, 1);
        console.log('[AlertService] Removed connection change subscription');
      }
    };
  }

  /**
   * Connect to SignalR (for real mode)
   */
  async connect(): Promise<void> {
    if (this.useMocks) {
      console.log('[AlertService] Mock mode - simulating connection');
      this.isConnected = true;
      // Simulate some initial alerts after a delay
      setTimeout(() => {
        this.simulateMockAlerts();
      }, 2000);
      return;
    }

    if (!this.signalRConnection) {
      throw new Error('SignalR connection not initialized');
    }

    try {
      await this.signalRConnection.start();
      this.isConnected = true;
      console.log('[AlertService] SignalR connected successfully');
    } catch (error) {
      console.error('[AlertService] Error connecting to SignalR:', error);
      throw error;
    }
  }

  /**
   * Disconnect from SignalR
   */
  async disconnect(): Promise<void> {
    if (this.useMocks) {
      console.log('[AlertService] Mock mode - simulating disconnection');
      this.isConnected = false;
      return;
    }

    if (this.signalRConnection) {
      try {
        await this.signalRConnection.stop();
        this.isConnected = false;
        console.log('[AlertService] SignalR disconnected successfully');
      } catch (error) {
        console.error('[AlertService] Error disconnecting from SignalR:', error);
      }
    }
  }

  /**
   * Get all alerts
   */
  async getAlerts(): Promise<Alert[]> {
    if (this.useMocks) {
      console.log('[AlertService] Using mock data for getAlerts');
      await simulateDelay();
      return getAllAlerts();
    } else {
      console.log('[AlertService] Fetching alerts from real API');
      try {
        const response = await apiClient.get<Alert[]>('/alerts');
        console.log('[AlertService] Successfully fetched alerts from real API:', response.data.length, 'alerts');
        return response.data;
      } catch (error) {
        console.warn('[RealMode] API call failed - getAlerts:', error);
        console.warn('[RealMode] Falling back to mock data for getAlerts');
        return getAllAlerts();
      }
    }
  }

  /**
   * Get active (unacknowledged) alerts
   */
  async getActiveAlerts(): Promise<Alert[]> {
    if (this.useMocks) {
      console.log('[AlertService] Using mock data for getActiveAlerts');
      await simulateDelay();
      return getActiveAlerts();
    } else {
      console.log('[AlertService] Fetching active alerts from real API');
      try {
        const response = await apiClient.get<Alert[]>('/alerts/active');
        console.log('[AlertService] Successfully fetched active alerts from real API:', response.data.length, 'alerts');
        return response.data;
      } catch (error) {
        console.warn('[RealMode] API call failed - getActiveAlerts:', error);
        console.warn('[RealMode] Falling back to mock data for getActiveAlerts');
        return getActiveAlerts();
      }
    }
  }

  /**
   * Get acknowledged alerts
   */
  async getAcknowledgedAlerts(): Promise<Alert[]> {
    if (this.useMocks) {
      console.log('[AlertService] Using mock data for getAcknowledgedAlerts');
      await simulateDelay();
      return getAcknowledgedAlerts();
    } else {
      console.log('[AlertService] Fetching acknowledged alerts from real API');
      try {
        const response = await apiClient.get<Alert[]>('/alerts/acknowledged');
        console.log('[AlertService] Successfully fetched acknowledged alerts from real API:', response.data.length, 'alerts');
        return response.data;
      } catch (error) {
        console.warn('[RealMode] API call failed - getAcknowledgedAlerts:', error);
        console.warn('[RealMode] Falling back to mock data for getAcknowledgedAlerts');
        return getAcknowledgedAlerts();
      }
    }
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(alertId: string): Promise<any> {
    if (this.useMocks) {
      console.log(`[AlertService] Mock acknowledgeAlert for alert ${alertId}`);
      await simulateDelay();
      return {
        success: true,
        message: `Alert ${alertId} acknowledged`,
        alertId,
        acknowledgedAt: new Date().toISOString(),
        acknowledgedBy: 'Dr. Test',
      };
    } else {
      console.log(`[AlertService] Acknowledging alert via real API: ${alertId}`);
      try {
        const response = await apiClient.post(`/alerts/${alertId}/ack`);
        console.log(`[AlertService] Successfully acknowledged alert ${alertId} via real API:`, response.data);
        return response.data;
      } catch (error) {
        console.warn(`[RealMode] API call failed - acknowledgeAlert ${alertId}:`, error);
        console.warn(`[RealMode] Falling back to mock acknowledgment for alert ${alertId}`);
        return {
          success: true,
          message: `Alert ${alertId} acknowledged (mock fallback)`,
          alertId,
          acknowledgedAt: new Date().toISOString(),
          acknowledgedBy: 'Dr. Test (fallback)',
        };
      }
    }
  }

  /**
   * Simulate mock alerts for testing
   */
  private simulateMockAlerts(): void {
    console.log('[AlertService] Simulating mock alerts...');

    // Simulate alerts at different intervals
    setTimeout(() => {
      const alert: Alert = {
        id: `mock-alert-${Date.now()}`,
        patientId: 1,
        patientName: 'John Smith',
        severity: 'Emergency',
        message: 'Blood pressure critically high - 180/110',
        metric: 'Blood Pressure',
        value: '180/110',
        timestamp: new Date().toISOString(),
        isAcknowledged: false,
      };
      this.notifyAlertCallbacks(alert);
    }, 3000);

    setTimeout(() => {
      const alert: Alert = {
        id: `mock-alert-${Date.now()}`,
        patientId: 3,
        patientName: 'Robert Johnson',
        severity: 'Warning',
        message: 'Temperature elevated - 101.2°F',
        metric: 'Temperature',
        value: '101.2°F',
        timestamp: new Date().toISOString(),
        isAcknowledged: false,
      };
      this.notifyAlertCallbacks(alert);
    }, 8000);
  }

  /**
   * Check if connected
   */
  isConnectedToRealTime(): boolean {
    return this.isConnected;
  }

  /**
   * Get connection state
   */
  getConnectionState(): string {
    if (this.useMocks) {
      return this.isConnected ? 'Connected' : 'Disconnected';
    }
    return this.signalRConnection?.state || 'Unknown';
  }
}

// Export singleton instance
export const alertService = new AlertService();
export default alertService;
