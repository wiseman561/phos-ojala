import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import EscalatedAlertsPanel from '../components/EscalatedAlertsPanel';
import { io } from 'socket.io-client';
import sinon from 'sinon';

// Mock modules
jest.mock('socket.io-client');

// Import and mock auth
const { mockAuthContext } = jest.requireActual('../../__mocks__/auth');
jest.mock('../../../../hooks/useAuth', () => ({
  __esModule: true,
  default: () => mockAuthContext
}));

// Mock fetch
global.fetch = jest.fn();

describe('EscalatedAlertsPanel', () => {
  const mockActiveAlerts = [
    {
      id: '1',
      patientId: 'P12345',
      deviceId: 'D6789',
      metric: 'heartRate',
      value: 125,
      timestamp: '2025-04-27T12:00:00Z',
      severity: 'Emergency',
      message: 'EMERGENCY: Heart rate reading of 125 bpm is outside normal range',
      isAcknowledged: false
    }
  ];

  const mockAcknowledgedAlerts = [
    {
      id: '2',
      patientId: 'P67890',
      deviceId: 'D12345',
      metric: 'oxygenSaturation',
      value: 83,
      timestamp: '2025-04-27T11:30:00Z',
      severity: 'Emergency',
      message: 'EMERGENCY: Oxygen saturation reading of 83% is outside normal range',
      isAcknowledged: true,
      acknowledgedAt: '2025-04-27T11:35:00Z',
      acknowledgedBy: 'Dr. Smith'
    }
  ];

  // Mock socket events
  const mockSocket = {
    on: jest.fn(),
    disconnect: jest.fn()
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup socket mock
    io.mockReturnValue(mockSocket);

    // Setup fetch mock for active alerts
    global.fetch.mockImplementation(async (url, options = {}) => {
      if (url.includes('/alerts/active')) {
        return {
          ok: true,
          json: async () => mockActiveAlerts
        };
      } else if (url.includes('/alerts/1/acknowledge') && options.method === 'POST') {
        return {
          ok: true,
          json: async () => ({ success: true })
        };
      } else if (url.includes('/alerts')) {
        return {
          ok: true,
          json: async () => [...mockActiveAlerts, ...mockAcknowledgedAlerts]
        };
      }
      throw new Error('Not found');
    });
  });

  test('renders the banner with correct alert count', async () => {
    render(<EscalatedAlertsPanel />);
    const alertBanner = await screen.findByRole('button', { name: /1 Emergency Alert/i });
    expect(alertBanner).toBeInTheDocument();
  });

  test('expands panel when banner is clicked', async () => {
    render(<EscalatedAlertsPanel />);
    const alertBanner = await screen.findByRole('button', { name: /1 Emergency Alert/i });

    // Panel should be collapsed initially
    expect(screen.queryByRole('region', { name: /Alert Details/i })).not.toBeInTheDocument();

    // Click the banner
    fireEvent.click(alertBanner);

    // Panel should be expanded
    const alertDetails = await screen.findByRole('region', { name: /Alert Details/i });
    const activeAlerts = await screen.findByRole('region', { name: /Active Alerts/i });
    expect(alertDetails).toBeInTheDocument();
    expect(activeAlerts).toBeInTheDocument();
  });

  test('shows active alerts when expanded', async () => {
    render(<EscalatedAlertsPanel />);
    const alertBanner = await screen.findByRole('button', { name: /1 Emergency Alert/i });
    fireEvent.click(alertBanner);

    // Should show active alert details
    const alertMessage = await screen.findByText(/Heart rate reading of 125 bpm/i);
    const patientId = await screen.findByText(/Patient ID: P12345/i);
    const metric = await screen.findByText(/Metric: heartRate/i);
    const value = await screen.findByText(/Value: 125/i);

    expect(alertMessage).toBeInTheDocument();
    expect(patientId).toBeInTheDocument();
    expect(metric).toBeInTheDocument();
    expect(value).toBeInTheDocument();
  });

  test('toggles between active only and all alerts', async () => {
    render(<EscalatedAlertsPanel />);
    const alertBanner = await screen.findByRole('button', { name: /1 Emergency Alert/i });
    fireEvent.click(alertBanner);

    // Should only show active alerts initially
    expect(screen.queryByRole('region', { name: /Acknowledged Alerts/i })).not.toBeInTheDocument();

    // Toggle to show all alerts
    const showAllToggle = await screen.findByRole('checkbox', { name: /Show Active Only/i });
    fireEvent.click(showAllToggle);

    // Should now show acknowledged alerts section
    const acknowledgedSection = await screen.findByRole('region', { name: /Acknowledged Alerts/i });
    const acknowledgedAlert = await screen.findByText(/Oxygen saturation reading of 83%/i);
    const acknowledgedStatus = await screen.findByText(/Acknowledged/i);

    expect(acknowledgedSection).toBeInTheDocument();
    expect(acknowledgedAlert).toBeInTheDocument();
    expect(acknowledgedStatus).toBeInTheDocument();
  });

  test('acknowledges an alert when acknowledge button is clicked', async () => {
    render(<EscalatedAlertsPanel />);
    const alertBanner = await screen.findByRole('button', { name: /1 Emergency Alert/i });
    fireEvent.click(alertBanner);

    const acknowledgeButton = await screen.findByRole('button', { name: /Acknowledge/i });
    fireEvent.click(acknowledgeButton);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/alerts/1/acknowledge'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': `Bearer ${mockAuthContext.accessToken}`,
          'Content-Type': 'application/json'
        })
      })
    );
  });

  test('connects to WebSocket with token', async () => {
    render(<EscalatedAlertsPanel />);
    await screen.findByRole('button', { name: /1 Emergency Alert/i });

    expect(io).toHaveBeenCalledWith(
      expect.stringContaining('/ws/alerts'),
      expect.objectContaining({
        query: { token: mockAuthContext.accessToken },
        transports: ['websocket']
      })
    );

    // Verify event listeners were registered
    expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('emergency-alert', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('alert-acknowledged', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('error', expect.any(Function));
  });

  test('handles new emergency alert from WebSocket', async () => {
    render(<EscalatedAlertsPanel />);
    await screen.findByRole('button', { name: /1 Emergency Alert/i });

    // Find the emergency-alert handler
    const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1];
    const emergencyAlertHandler = mockSocket.on.mock.calls.find(call => call[0] === 'emergency-alert')[1];

    // Simulate connection
    connectHandler();

    // Simulate receiving a new emergency alert
    const newAlert = {
      id: '3',
      patientId: 'P54321',
      deviceId: 'D98765',
      metric: 'bloodPressureSystolic',
      value: 180,
      timestamp: '2025-04-27T12:15:00Z',
      severity: 'Emergency',
      message: 'EMERGENCY: Blood pressure systolic reading of 180 mmHg is outside normal range',
      isAcknowledged: false
    };

    emergencyAlertHandler(newAlert);

    // Panel should auto-expand and show the new alert
    const newAlertMessage = await screen.findByText(/Blood pressure systolic reading of 180 mmHg/i);
    expect(newAlertMessage).toBeInTheDocument();
  });

  test('handles alert acknowledgment from WebSocket', async () => {
    render(<EscalatedAlertsPanel />);
    const alertBanner = await screen.findByRole('button', { name: /1 Emergency Alert/i });
    fireEvent.click(alertBanner);

    // Find the alert-acknowledged handler
    const alertAcknowledgedHandler = mockSocket.on.mock.calls.find(call => call[0] === 'alert-acknowledged')[1];

    // Simulate receiving an acknowledgment
    const acknowledgment = {
      id: '1',
      acknowledgedAt: '2025-04-27T12:20:00Z',
      acknowledgedBy: 'Dr. Johnson'
    };

    alertAcknowledgedHandler(acknowledgment);

    // Toggle to show all alerts
    const showAllToggle = await screen.findByRole('checkbox', { name: /Show Active Only/i });
    fireEvent.click(showAllToggle);

    // Should now show the acknowledged alert
    const acknowledgedSection = await screen.findByRole('region', { name: /Acknowledged Alerts/i });
    const acknowledgedStatus = await screen.findByText(/Acknowledged/i);

    expect(acknowledgedSection).toBeInTheDocument();
    expect(acknowledgedStatus).toBeInTheDocument();
  });

  test('disconnects from WebSocket on unmount', async () => {
    const { unmount } = render(<EscalatedAlertsPanel />);
    await screen.findByRole('button', { name: /1 Emergency Alert/i });
    unmount();
    expect(mockSocket.disconnect).toHaveBeenCalled();
  });
});
