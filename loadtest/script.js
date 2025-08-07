import http from 'k6/http';
import { sleep, check } from 'k6';
import { SharedArray } from 'k6/data';
import { Rate } from 'k6/metrics';

// Define custom metrics
const errorRate = new Rate('errors');

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';
const API_VERSION = __ENV.API_VERSION || 'v1';

// Test data
const users = new SharedArray('users', function() {
  return [
    { username: 'rn_user1', password: 'password123', role: 'RN' },
    { username: 'rn_user2', password: 'password123', role: 'RN' },
    { username: 'md_user1', password: 'password123', role: 'MD' },
    { username: 'patient_user1', password: 'password123', role: 'Patient' },
    { username: 'employer_user1', password: 'password123', role: 'Employer' }
  ];
});

const patientIds = new SharedArray('patientIds', function() {
  return [
    'patient-001',
    'patient-002',
    'patient-003',
    'patient-004',
    'patient-005',
    'patient-006',
    'patient-007',
    'patient-008',
    'patient-009',
    'patient-010'
  ];
});

// Helper functions
function getRandomUser() {
  return users[Math.floor(Math.random() * users.length)];
}

function getRandomPatientId() {
  return patientIds[Math.floor(Math.random() * patientIds.length)];
}

function getAuthToken(username, password) {
  const loginUrl = `${BASE_URL}/api/${API_VERSION}/auth/login`;
  const payload = JSON.stringify({
    username: username,
    password: password
  });
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  const response = check(http.post(loginUrl, payload, params), {
    'login successful': (r) => r.status === 200 && r.json('token') !== undefined,
  });
  
  if (!response) {
    errorRate.add(1);
    return null;
  }
  
  return response ? http.post(loginUrl, payload, params).json('token') : null;
}

// Test scenarios
export const options = {
  scenarios: {
    rn_alerts_scenario: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 50 },
        { duration: '1m', target: 100 },
        { duration: '30s', target: 200 },
        { duration: '1m', target: 200 },
        { duration: '30s', target: 0 }
      ],
      gracefulRampDown: '30s',
      exec: 'rnAlertsScenario'
    },
    patient_dashboard_scenario: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 50 },
        { duration: '1m', target: 100 },
        { duration: '30s', target: 500 },
        { duration: '1m', target: 500 },
        { duration: '30s', target: 0 }
      ],
      gracefulRampDown: '30s',
      exec: 'patientDashboardScenario'
    }
  },
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.01'],
    errors: ['rate<0.01']
  }
};

// RN Alerts Scenario
export function rnAlertsScenario() {
  const user = users.filter(u => u.role === 'RN')[Math.floor(Math.random() * users.filter(u => u.role === 'RN').length)];
  const token = getAuthToken(user.username, user.password);
  
  if (!token) {
    console.log('Failed to get auth token for RN user');
    return;
  }
  
  const params = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
  
  // Get alerts for RN dashboard
  const alertsResponse = http.get(`${BASE_URL}/api/${API_VERSION}/rn/alerts`, params);
  check(alertsResponse, {
    'alerts request successful': (r) => r.status === 200,
    'alerts response has data': (r) => r.json('data') !== undefined,
    'alerts response time < 200ms': (r) => r.timings.duration < 200
  }) || errorRate.add(1);
  
  // Get patient list
  const patientsResponse = http.get(`${BASE_URL}/api/${API_VERSION}/rn/patients`, params);
  check(patientsResponse, {
    'patients request successful': (r) => r.status === 200,
    'patients response has data': (r) => r.json('data') !== undefined,
    'patients response time < 300ms': (r) => r.timings.duration < 300
  }) || errorRate.add(1);
  
  // Get details for a specific patient
  const patientId = getRandomPatientId();
  const patientDetailsResponse = http.get(`${BASE_URL}/api/${API_VERSION}/patients/${patientId}`, params);
  check(patientDetailsResponse, {
    'patient details request successful': (r) => r.status === 200,
    'patient details response has data': (r) => r.json('data') !== undefined,
    'patient details response time < 300ms': (r) => r.timings.duration < 300
  }) || errorRate.add(1);
  
  // Get health score for the patient
  const healthScoreResponse = http.get(`${BASE_URL}/api/${API_VERSION}/ai/healthscore/${patientId}`, params);
  check(healthScoreResponse, {
    'health score request successful': (r) => r.status === 200,
    'health score response has data': (r) => r.json('score') !== undefined,
    'health score response time < 500ms': (r) => r.timings.duration < 500
  }) || errorRate.add(1);
  
  sleep(1);
}

// Patient Dashboard Scenario
export function patientDashboardScenario() {
  const user = users.filter(u => u.role === 'Patient')[Math.floor(Math.random() * users.filter(u => u.role === 'Patient').length)];
  const token = getAuthToken(user.username, user.password);
  
  if (!token) {
    console.log('Failed to get auth token for Patient user');
    return;
  }
  
  const params = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
  
  // Get patient dashboard data
  const dashboardResponse = http.get(`${BASE_URL}/api/${API_VERSION}/patient/dashboard-data`, params);
  check(dashboardResponse, {
    'dashboard request successful': (r) => r.status === 200,
    'dashboard response has data': (r) => r.json('data') !== undefined,
    'dashboard response time < 300ms': (r) => r.timings.duration < 300
  }) || errorRate.add(1);
  
  // Get care plan
  const carePlanResponse = http.get(`${BASE_URL}/api/${API_VERSION}/patient/care-plan`, params);
  check(carePlanResponse, {
    'care plan request successful': (r) => r.status === 200,
    'care plan response has data': (r) => r.json('data') !== undefined,
    'care plan response time < 300ms': (r) => r.timings.duration < 300
  }) || errorRate.add(1);
  
  // Get health metrics
  const healthMetricsResponse = http.get(`${BASE_URL}/api/${API_VERSION}/patient/health-metrics`, params);
  check(healthMetricsResponse, {
    'health metrics request successful': (r) => r.status === 200,
    'health metrics response has data': (r) => r.json('data') !== undefined,
    'health metrics response time < 400ms': (r) => r.timings.duration < 400
  }) || errorRate.add(1);
  
  // Submit a new health measurement
  const measurementPayload = JSON.stringify({
    type: 'blood_pressure',
    systolic: 120 + Math.floor(Math.random() * 20),
    diastolic: 80 + Math.floor(Math.random() * 10),
    timestamp: new Date().toISOString(),
    notes: 'Recorded during load test'
  });
  
  const measurementResponse = http.post(`${BASE_URL}/api/${API_VERSION}/patient/measurements`, measurementPayload, params);
  check(measurementResponse, {
    'measurement submission successful': (r) => r.status === 201,
    'measurement response time < 500ms': (r) => r.timings.duration < 500
  }) || errorRate.add(1);
  
  sleep(1);
}
