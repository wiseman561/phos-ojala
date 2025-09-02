import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import EscalatedAlertsPanel from '../components/EscalatedAlertsPanel';
import { io } from 'socket.io-client';
import sinon from 'sinon';
import { useAuth } from '../hooks/useAuth';

// Mock modules
jest.mock('socket.io-client');

// Import and mock auth
const { mockAuthContext } = jest.requireActual('../../__mocks__/auth');
jest.mock('../../../hooks/useAuth', () => ({
  __esModule: true,
  default: () => mockAuthContext
}));

/* ────────────────────────────────────────────────────────────
   Mock setup
   ──────────────────────────────────────────────────────────── */

// Jest's global fetch mock
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve([])
  })
);

/* ────────────────────────────────────────────────────────────
   Mock data
   ──────────────────────────────────────────────────────────── */

const mockActiveAlerts = [
  {
    id        : '1',
    patientId : 'P12345',
    deviceId  : 'D6789',
    metric    : 'heartRate',
    value     : 125,
    timestamp : '2025-04-27T12:00:00Z',
    severity  : 'Emergency',
    message   : 'EMERGENCY: Heart rate reading of 125 bpm is outside normal range',
    isAcknowledged: false
  }
];

const mockAcknowledgedAlerts = [
  {
    id          : '2',
    patientId   : 'P67890',
    deviceId    : 'D12345',
    metric      : 'oxygenSaturation',
    value       : 83,
    timestamp   : '2025-04-27T11:30:00Z',
    severity    : 'Emergency',
    message     : 'EMERGENCY: Oxygen saturation reading of 83% is outside normal range',
    isAcknowledged: true,
    acknowledgedAt: '2025-04-27T11:35:00Z',
    acknowledgedBy: 'Dr. Smith'
  }
];

/* ────────────────────────────────────────────────────────────
   Socket mock
   ──────────────────────────────────────────────────────────── */

const mockSocket = {
  on        : sinon.spy(),
  disconnect: sinon.spy()
};

/* ────────────────────────────────────────────────────────────
   beforeEach: reset and wire mocks
   ──────────────────────────────────────────────────────────── */

beforeEach(() => {
  sinon.resetHistory();
  io.mockReturnValue(mockSocket);

  // fetch implementation for the various endpoints
  global.fetch.mockImplementation(async (url, options = {}) => {
    if (url.includes('/alerts/active')) {
      return {
        ok: true,
        json: async () => mockActiveAlerts
      };
    }
    if (url.includes('/alerts/1/acknowledge') && options.method === 'POST') {
      return {
        ok: true,
        json: async () => ({ success: true })
      };
    }
    if (url.includes('/alerts')) {
      return {
        ok: true,
        json: async () => [...mockActiveAlerts, ...mockAcknowledgedAlerts]
      };
    }
    throw new Error('Not found');
  });

  useAuth.mockImplementation(() => mockAuthContext);
});

/* ────────────────────────────────────────────────────────────
   Tests
   ──────────────────────────────────────────────────────────── */

describe('<EscalatedAlertsPanel />', () => {
  test('renders the banner with correct alert count', async () => {
    render(<EscalatedAlertsPanel />);
    const alertBanner = await screen.findByRole('button', { name: /1 Emergency Alert/i });
    expect(alertBanner).toBeInTheDocument();
  });

  test('expands panel when banner is clicked', async () => {
    render(<EscalatedAlertsPanel />);
    const alertBanner = await screen.findByRole('button', { name: /1 Emergency Alert/i });
    fireEvent.click(alertBanner);

    const alertDetails = await screen.findByRole('region', { name: /Alert Details/i });
    const activeAlerts = await screen.findByRole('region', { name: /Active Alerts/i });

    expect(alertDetails).toBeInTheDocument();
    expect(activeAlerts).toBeInTheDocument();
  });

  test('shows active alerts when expanded', async () => {
    render(<EscalatedAlertsPanel />);
    const alertBanner = await screen.findByRole('button', { name: /1 Emergency Alert/i });
    fireEvent.click(alertBanner);

    const alertMessage = await screen.findByText(/EMERGENCY: Heart rate reading of 125 bpm/i);
    const patientId = await screen.findByText(/Patient ID: P12345/i);

    expect(alertMessage).toBeInTheDocument();
    expect(patientId).toBeInTheDocument();
  });

  test('toggles between active only and all alerts', async () => {
    render(<EscalatedAlertsPanel />);
    const alertBanner = await screen.findByRole('button', { name: /1 Emergency Alert/i });
    fireEvent.click(alertBanner);

    const showAllToggle = await screen.findByRole('checkbox', { name: /Show Active Only/i });
    fireEvent.click(showAllToggle);

    const acknowledgedSection = await screen.findByRole('region', { name: /Acknowledged Alerts/i });
    const acknowledgedAlert = await screen.findByText(/Oxygen saturation reading of 83%/i);

    expect(acknowledgedSection).toBeInTheDocument();
    expect(acknowledgedAlert).toBeInTheDocument();
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
          Authorization: `Bearer ${mockAuthContext.accessToken}`,
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
  });

  test('handles new emergency alert from WebSocket', async () => {
    render(<EscalatedAlertsPanel />);
    await screen.findByRole('button', { name: /1 Emergency Alert/i });

    const [[eventName, handler]] = mockSocket.on.getCalls();
    expect(eventName).toBe('emergency-alert');

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

    handler(newAlert);

    const newAlertMessage = await screen.findByText(/Blood pressure systolic reading of 180 mmHg/i);
    expect(newAlertMessage).toBeInTheDocument();
  });

  test('disconnects from WebSocket on unmount', async () => {
    const { unmount } = render(<EscalatedAlertsPanel />);
    await screen.findByRole('button', { name: /1 Emergency Alert/i });
    unmount();
    expect(mockSocket.disconnect.called).toBe(true);
  });
});
