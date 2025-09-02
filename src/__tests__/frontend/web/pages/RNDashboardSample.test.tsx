import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import RNDashboardSample from './RNDashboardSample';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock child components
jest.mock('../../../../components/PatientCard', () => ({
  __esModule: true,
  default: ({ patient }: any) => <div data-testid="patient-card">{patient.firstName} {patient.lastName}</div>
}));

jest.mock('../components/AlertCard', () => ({
  __esModule: true,
  default: ({ alert }: any) => <div data-testid="alert-card">{alert.message}</div>
}));

jest.mock('../components/HealthScoreCard', () => ({
  __esModule: true,
  default: ({ healthScore }: any) => healthScore ? <div data-testid="health-score-card">Score: {healthScore.score}</div> : null
}));

jest.mock('../components/QuickNotesBox', () => ({
  __esModule: true,
  default: ({ value, onChange, onSubmit }: any) => (
    <div data-testid="quick-notes-box">
      <label htmlFor="quick-notes-input">Quick Notes</label>
      <input
        id="quick-notes-input"
        data-testid="quick-notes-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Quick notes input"
      />
      <button data-testid="quick-notes-submit" onClick={() => onSubmit(value)}>Submit</button>
    </div>
  )
}));

jest.mock('../components/ConditionFilterBar', () => ({
  __esModule: true,
  default: ({ conditions, selectedConditions, onChange }: any) => (
    <div data-testid="condition-filter-bar">
      {conditions.map((condition: string) => (
        <span key={condition} data-testid="condition-option">{condition}</span>
      ))}
    </div>
  )
}));

describe('RNDashboardSample', () => {
  const mockDashboardData = {
    patients: [
      {
        id: 'patient-1',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1980-01-01',
        gender: 'Male',
        healthScore: 85,
        riskLevel: 'Low',
        conditions: ['Diabetes', 'Hypertension'],
        lastContact: '2025-04-20T10:30:00Z'
      },
      {
        id: 'patient-2',
        firstName: 'Jane',
        lastName: 'Smith',
        dateOfBirth: '1975-05-15',
        gender: 'Female',
        healthScore: 72,
        riskLevel: 'Medium',
        conditions: ['Asthma'],
        lastContact: '2025-04-22T14:45:00Z'
      }
    ],
    alerts: [
      {
        id: 'alert-1',
        patientId: 'patient-1',
        patientName: 'John Doe',
        alertType: 'warning',
        message: 'Blood pressure reading above threshold',
        timestamp: '2025-04-23T09:15:00Z',
        isRead: false
      },
      {
        id: 'alert-2',
        patientId: 'patient-2',
        patientName: 'Jane Smith',
        alertType: 'info',
        message: 'Medication refill due in 3 days',
        timestamp: '2025-04-23T11:30:00Z',
        isRead: false
      }
    ],
    healthScores: [
      {
        patientId: 'patient-1',
        score: 85,
        trend: 'stable',
        factors: ['Regular medication adherence', 'Consistent exercise']
      },
      {
        patientId: 'patient-2',
        score: 72,
        trend: 'up',
        factors: ['Improved sleep patterns', 'Better diet']
      }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders loading state initially', () => {
    mockedAxios.get.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<RNDashboardSample />);

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  test('renders dashboard data when API call succeeds', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: mockDashboardData });

    render(<RNDashboardSample />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    // Check if patient cards are rendered
    expect(screen.getAllByTestId('patient-card')).toHaveLength(2);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();

    // Check if alert cards are rendered
    expect(screen.getAllByTestId('alert-card')).toHaveLength(2);
    expect(screen.getByText('Blood pressure reading above threshold')).toBeInTheDocument();
    expect(screen.getByText('Medication refill due in 3 days')).toBeInTheDocument();

    // Check if health score cards are rendered
    expect(screen.getAllByTestId('health-score-card')).toHaveLength(2);

    // Check if condition filter bar is rendered with correct conditions
    expect(screen.getByTestId('condition-filter-bar')).toBeInTheDocument();
    expect(screen.getAllByTestId('condition-option')).toHaveLength(3); // Diabetes, Hypertension, Asthma

    // Check if quick notes box is rendered
    expect(screen.getByTestId('quick-notes-box')).toBeInTheDocument();
  });

  test('renders error state when API call fails', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('API Error'));

    render(<RNDashboardSample />);

    // Wait for error to be displayed
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    expect(screen.getByText(/Error!/i)).toBeInTheDocument();
    expect(screen.getByText(/Failed to load dashboard data/i)).toBeInTheDocument();
  });

  test('handles quick note submission', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: mockDashboardData });
    mockedAxios.post.mockResolvedValueOnce({ data: { success: true } });

    render(<RNDashboardSample />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    // Submit a quick note
    const input = screen.getByTestId('quick-notes-input');
    const submitButton = screen.getByTestId('quick-notes-submit');

    // Type in the input
    input.value = 'Test note';
    input.dispatchEvent(new Event('change'));

    // Click submit button
    submitButton.click();

    // Verify API was called with correct data
    expect(mockedAxios.post).toHaveBeenCalledWith('/api/rn/notes', { content: 'Test note' });
  });
});
