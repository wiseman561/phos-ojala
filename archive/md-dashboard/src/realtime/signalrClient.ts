import * as signalR from '@microsoft/signalr';

export interface ChatMessage {
  user: string;
  message: string;
  timestamp: string;
}

export interface PrivateMessage {
  sender: string;
  recipient: string;
  message: string;
  timestamp: string;
}

export interface SignalRAlert {
  id: string;
  patientName: string;
  alertType: 'critical' | 'warning' | 'info' | 'emergency';
  message: string;
  timestamp: string;
  patientId?: number;
  severity?: 'high' | 'medium' | 'low';
}

class SignalRClient {
  private connection: signalR.HubConnection | null = null;
  private isConnecting: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 3000; // 3 seconds

  // Event handlers
  private messageHandlers: Array<(message: ChatMessage) => void> = [];
  private privateMessageHandlers: Array<(message: PrivateMessage) => void> = [];
  private alertHandlers: Array<(alert: SignalRAlert) => void> = [];
  private connectionHandlers: Array<(connected: boolean) => void> = [];

  constructor() {
    // Only initialize connection in production mode
    if (process.env.NODE_ENV === 'production') {
      this.initializeConnection();
    } else {
      console.log('[SignalR] Mock mode - skipping real connection in development');
      // Simulate connection in development
      setTimeout(() => {
        console.log('[SignalR] Mock mode - simulating successful connection');
        this.notifyConnectionHandlers(true);
        // Simulate initial alerts after connection
        this.simulateInitialAlerts();
      }, 1000);
    }
  }

  private initializeConnection(): void {
    // Get the base URL for the SignalR hub - specifically connect to localhost:5000
    const hubUrl = 'http://localhost:5000/hubs/chat';

    console.log('[SignalR] Initializing connection to:', hubUrl);

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        // Configure connection options
        skipNegotiation: false,
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
        headers: {
          'Authorization': 'Bearer mock-jwt-token-md-dashboard'
        }
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          // Exponential backoff: 3s, 6s, 12s, 24s, then 30s
          if (retryContext.previousRetryCount < 4) {
            return Math.min(3000 * Math.pow(2, retryContext.previousRetryCount), 30000);
          }
          return 30000;
        }
      })
      .configureLogging(signalR.LogLevel.Information)
      .build();

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    if (!this.connection) return;

    // Connection lifecycle events
    this.connection.onclose((error) => {
      console.error('[SignalR] Connection closed:', error);
      this.notifyConnectionHandlers(false);
    });

    this.connection.onreconnecting((error) => {
      console.warn('[SignalR] Attempting to reconnect:', error);
      this.notifyConnectionHandlers(false);
    });

    this.connection.onreconnected((connectionId) => {
      console.log('[SignalR] Reconnected successfully. Connection ID:', connectionId);
      this.reconnectAttempts = 0;
      this.notifyConnectionHandlers(true);
    });

    // Message event handlers
    this.connection.on('ReceiveMessage', (user: string, message: string) => {
      const chatMessage: ChatMessage = {
        user,
        message,
        timestamp: new Date().toISOString()
      };

      console.log('[SignalR] Received message:', chatMessage);
      this.notifyMessageHandlers(chatMessage);
    });

    this.connection.on('ReceivePrivateMessage', (sender: string, recipient: string, message: string) => {
      const privateMessage: PrivateMessage = {
        sender,
        recipient,
        message,
        timestamp: new Date().toISOString()
      };

      console.log('[SignalR] Received private message:', privateMessage);
      this.notifyPrivateMessageHandlers(privateMessage);
    });

    // Alert events (for MD Dashboard specific functionality)
    this.connection.on('ReceiveAlert', (alertData: any) => {
      console.log('[SignalR] Received alert:', alertData);

      // Convert to our alert format
      const alert: SignalRAlert = {
        id: alertData.id || Date.now().toString(),
        patientName: alertData.patientName || 'Unknown Patient',
        alertType: alertData.alertType || 'info',
        message: alertData.message || 'No message',
        timestamp: alertData.timestamp || new Date().toISOString(),
        patientId: alertData.patientId,
        severity: alertData.severity
      };

      this.notifyAlertHandlers(alert);
    });

    // Emergency alert events
    this.connection.on('EmergencyAlert', (alertData: any) => {
      console.log('[SignalR] Received emergency alert:', alertData);

      // Convert emergency alert to our alert format
      const alert: SignalRAlert = {
        id: alertData.id || Date.now().toString(),
        patientName: alertData.patientName || 'Unknown Patient',
        alertType: 'emergency',
        message: alertData.message || 'Emergency alert',
        timestamp: alertData.timestamp || new Date().toISOString(),
        patientId: alertData.patientId,
        severity: 'high'
      };

      this.notifyAlertHandlers(alert);
    });

    // Patient status updates
    this.connection.on('PatientStatusUpdate', (patientData: any) => {
      console.log('[SignalR] Received patient status update:', patientData);
    });
  }

  // Mock alert simulation methods
  private simulateInitialAlerts(): void {
    console.log('[SignalR] Simulating initial alerts...');

    // Simulate a few initial alerts with longer delays to ensure components are mounted
    setTimeout(() => {
      this.simulateAlert({
        id: 'mock-alert-1',
        patientName: 'John Smith',
        alertType: 'critical',
        message: 'Blood pressure critically high - 180/110',
        patientId: 1,
        severity: 'high'
      });
    }, 5000); // Increased from 2000 to 5000

    setTimeout(() => {
      this.simulateAlert({
        id: 'mock-alert-2',
        patientName: 'Sarah Johnson',
        alertType: 'warning',
        message: 'Heart rate elevated - 120 bpm',
        patientId: 2,
        severity: 'medium'
      });
    }, 7000); // Increased from 4000 to 7000

    setTimeout(() => {
      this.simulateAlert({
        id: 'mock-alert-3',
        patientName: 'Michael Brown',
        alertType: 'emergency',
        message: 'Cardiac arrest - immediate attention required',
        patientId: 3,
        severity: 'high'
      });
    }, 9000); // Increased from 6000 to 9000
  }

  public simulateAlert(alertData: Partial<SignalRAlert>): void {
    if (process.env.NODE_ENV !== 'production') {
      const alert: SignalRAlert = {
        id: alertData.id || `mock-alert-${Date.now()}`,
        patientName: alertData.patientName || 'Test Patient',
        alertType: alertData.alertType || 'info',
        message: alertData.message || 'Test alert message',
        timestamp: alertData.timestamp || new Date().toISOString(),
        patientId: alertData.patientId,
        severity: alertData.severity || 'medium'
      };

      console.log('[SignalR] Simulating alert:', alert);
      console.log('[SignalR] Number of alert handlers:', this.alertHandlers.length);
      this.notifyAlertHandlers(alert);
    }
  }

  public async connect(): Promise<void> {
    // In development mode, just simulate connection
    if (process.env.NODE_ENV !== 'production') {
      console.log('[SignalR] Mock mode - simulating connection');
      setTimeout(() => {
        console.log('[SignalR] Mock mode - connection simulation complete');
        this.notifyConnectionHandlers(true);
        // Simulate initial alerts after connection
        this.simulateInitialAlerts();
      }, 500);
      return;
    }

    if (!this.connection || this.isConnecting) {
      return;
    }

    if (this.connection.state === signalR.HubConnectionState.Connected) {
      console.log('[SignalR] Already connected');
      return;
    }

    try {
      this.isConnecting = true;
      console.log('[SignalR] Connecting...');

      await this.connection.start();

      console.log('[SignalR] Connected successfully. Connection ID:', this.connection.connectionId);
      this.reconnectAttempts = 0;
      this.notifyConnectionHandlers(true);

    } catch (error) {
      console.error('[SignalR] Connection failed:', error);
      this.scheduleReconnect();
    } finally {
      this.isConnecting = false;
    }
  }

  public async disconnect(): Promise<void> {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[SignalR] Mock mode - simulating disconnection');
      this.notifyConnectionHandlers(false);
      return;
    }

    if (this.connection) {
      console.log('[SignalR] Disconnecting...');
      await this.connection.stop();
      console.log('[SignalR] Disconnected');
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[SignalR] Max reconnection attempts reached. Giving up.');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`[SignalR] Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay}ms`);

    setTimeout(() => {
      this.connect();
    }, delay);
  }

  // Message sending methods
  public async sendMessage(user: string, message: string): Promise<void> {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[SignalR] Mock mode - simulating message send:', { user, message });
      return;
    }

    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      try {
        await this.connection.invoke('SendMessage', user, message);
        console.log('[SignalR] Message sent:', { user, message });
      } catch (error) {
        console.error('[SignalR] Failed to send message:', error);
      }
    } else {
      console.warn('[SignalR] Cannot send message - not connected');
    }
  }

  public async sendPrivateMessage(sender: string, recipient: string, message: string): Promise<void> {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[SignalR] Mock mode - simulating private message send:', { sender, recipient, message });
      return;
    }

    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      try {
        await this.connection.invoke('SendPrivateMessage', sender, recipient, message);
        console.log('[SignalR] Private message sent:', { sender, recipient, message });
      } catch (error) {
        console.error('[SignalR] Failed to send private message:', error);
      }
    } else {
      console.warn('[SignalR] Cannot send private message - not connected');
    }
  }

  // Event subscription methods
  public onMessage(handler: (message: ChatMessage) => void): () => void {
    this.messageHandlers.push(handler);
    return () => {
      const index = this.messageHandlers.indexOf(handler);
      if (index > -1) {
        this.messageHandlers.splice(index, 1);
      }
    };
  }

  public onPrivateMessage(handler: (message: PrivateMessage) => void): () => void {
    this.privateMessageHandlers.push(handler);
    return () => {
      const index = this.privateMessageHandlers.indexOf(handler);
      if (index > -1) {
        this.privateMessageHandlers.splice(index, 1);
      }
    };
  }

  public onAlert(handler: (alert: SignalRAlert) => void): () => void {
    console.log('[SignalR] Registering alert handler, current count:', this.alertHandlers.length);
    this.alertHandlers.push(handler);
    console.log('[SignalR] Alert handler registered, new count:', this.alertHandlers.length);
    return () => {
      const index = this.alertHandlers.indexOf(handler);
      if (index > -1) {
        console.log('[SignalR] Unregistering alert handler at index:', index);
        this.alertHandlers.splice(index, 1);
        console.log('[SignalR] Alert handler unregistered, new count:', this.alertHandlers.length);
      }
    };
  }

  public onConnectionChange(handler: (connected: boolean) => void): () => void {
    this.connectionHandlers.push(handler);
    return () => {
      const index = this.connectionHandlers.indexOf(handler);
      if (index > -1) {
        this.connectionHandlers.splice(index, 1);
      }
    };
  }

  // Event notification methods
  private notifyMessageHandlers(message: ChatMessage): void {
    this.messageHandlers.forEach(handler => {
      try {
        handler(message);
      } catch (error) {
        console.error('[SignalR] Error in message handler:', error);
      }
    });
  }

  private notifyPrivateMessageHandlers(message: PrivateMessage): void {
    this.privateMessageHandlers.forEach(handler => {
      try {
        handler(message);
      } catch (error) {
        console.error('[SignalR] Error in private message handler:', error);
      }
    });
  }

  private notifyAlertHandlers(alert: SignalRAlert): void {
    console.log('[SignalR] Notifying alert handlers, count:', this.alertHandlers.length);
    this.alertHandlers.forEach((handler, index) => {
      try {
        console.log(`[SignalR] Calling alert handler ${index + 1}`);
        handler(alert);
        console.log(`[SignalR] Alert handler ${index + 1} completed successfully`);
      } catch (error) {
        console.error(`[SignalR] Error in alert handler ${index + 1}:`, error);
      }
    });
  }

  private notifyConnectionHandlers(connected: boolean): void {
    this.connectionHandlers.forEach(handler => {
      try {
        handler(connected);
      } catch (error) {
        console.error('[SignalR] Error in connection handler:', error);
      }
    });
  }

  // Utility methods
  public getConnectionState(): signalR.HubConnectionState {
    // In development mode, return Connected state
    if (process.env.NODE_ENV !== 'production') {
      return signalR.HubConnectionState.Connected;
    }
    return this.connection?.state || signalR.HubConnectionState.Disconnected;
  }

  public isConnected(): boolean {
    // In development mode, consider it connected if we're in mock mode
    if (process.env.NODE_ENV !== 'production') {
      return true; // Mock mode is always "connected"
    }
    return this.connection?.state === signalR.HubConnectionState.Connected;
  }

  public getConnectionId(): string | null {
    return this.connection?.connectionId || null;
  }
}

// Export singleton instance
const signalRClient = new SignalRClient();
export default signalRClient;
