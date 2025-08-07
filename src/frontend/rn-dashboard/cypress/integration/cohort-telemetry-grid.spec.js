describe('RN Dashboard Telemetry Grid', () => {
  beforeEach(() => {
    // Set up authentication
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        token: 'fake-jwt-token',
        user: {
          id: 'nurse123',
          role: 'nurse'
        }
      }
    }).as('login');

    // Mock assigned patients
    cy.intercept('GET', '/nurses/*/patients', {
      statusCode: 200,
      body: [
        {
          id: 'patient1',
          firstName: 'John',
          lastName: 'Doe',
          dateOfBirth: '1980-01-15'
        },
        {
          id: 'patient2',
          firstName: 'Jane',
          lastName: 'Smith',
          dateOfBirth: '1975-05-20'
        },
        {
          id: 'patient3',
          firstName: 'Robert',
          lastName: 'Johnson',
          dateOfBirth: '1968-11-03'
        }
      ]
    }).as('getPatients');

    // Mock patient devices
    cy.intercept('GET', '/patients/*/devices', (req) => {
      const patientId = req.url.split('/')[2];
      let devices = [];
      
      if (patientId === 'patient1') {
        devices = [
          { id: 'device1', type: 'bloodPressure', model: 'BP-Monitor-X1', lastSyncTime: '2025-04-27T10:30:00Z' },
          { id: 'device2', type: 'glucometer', model: 'GlucoTrack-G2', lastSyncTime: '2025-04-27T09:15:00Z' }
        ];
      } else if (patientId === 'patient2') {
        devices = [
          { id: 'device3', type: 'pulseOximeter', model: 'OxyPulse-P3', lastSyncTime: '2025-04-27T11:45:00Z' }
        ];
      } else if (patientId === 'patient3') {
        devices = [
          { id: 'device4', type: 'scale', model: 'SmartScale-S1', lastSyncTime: '2025-04-27T08:00:00Z' },
          { id: 'device5', type: 'thermometer', model: 'TempTrack-T1', lastSyncTime: '2025-04-27T12:30:00Z' }
        ];
      }
      
      req.reply({
        statusCode: 200,
        body: devices
      });
    }).as('getDevices');

    // Mock telemetry data
    cy.intercept('GET', '/devices/*/telemetry*', (req) => {
      const deviceId = req.url.split('/')[2].split('?')[0];
      let telemetryData = [];
      
      // Generate different telemetry data based on device ID
      switch (deviceId) {
        case 'device1': // Blood pressure device
          telemetryData = [
            { timestamp: '2025-04-27T10:30:00Z', metric: 'bloodPressure', value: '145/95', unit: 'mmHg' }
          ];
          break;
        case 'device2': // Glucometer
          telemetryData = [
            { timestamp: '2025-04-27T09:15:00Z', metric: 'bloodGlucose', value: 185, unit: 'mg/dL' }
          ];
          break;
        case 'device3': // Pulse oximeter
          telemetryData = [
            { timestamp: '2025-04-27T11:45:00Z', metric: 'oxygenSaturation', value: 93, unit: '%' },
            { timestamp: '2025-04-27T11:45:00Z', metric: 'heartRate', value: 88, unit: 'bpm' }
          ];
          break;
        case 'device4': // Scale
          telemetryData = [
            { timestamp: '2025-04-27T08:00:00Z', metric: 'weight', value: 82.5, unit: 'kg' }
          ];
          break;
        case 'device5': // Thermometer
          telemetryData = [
            { timestamp: '2025-04-27T12:30:00Z', metric: 'temperature', value: 38.2, unit: '°C' }
          ];
          break;
        default:
          telemetryData = [];
      }
      
      req.reply({
        statusCode: 200,
        body: {
          success: true,
          deviceId: deviceId,
          data: telemetryData
        }
      });
    }).as('getTelemetry');

    // Login and navigate to dashboard
    cy.visit('/login');
    cy.get('input[name="username"]').type('nurse');
    cy.get('input[name="password"]').type('password');
    cy.get('button[type="submit"]').click();
    cy.wait('@login');
    cy.visit('/dashboard');
  });

  it('should display the cohort telemetry grid with patient data', () => {
    // Wait for patients and devices data to load
    cy.wait('@getPatients');
    
    // Verify the component is displayed
    cy.get('.patient-telemetry-dashboard').should('be.visible');
    
    // Verify table headers
    cy.get('th').contains('Patient').should('be.visible');
    cy.get('th').contains('Heart Rate').should('be.visible');
    cy.get('th').contains('Blood Pressure').should('be.visible');
    cy.get('th').contains('Oxygen').should('be.visible');
    cy.get('th').contains('Temperature').should('be.visible');
    cy.get('th').contains('Blood Glucose').should('be.visible');
    
    // Verify patient rows are displayed
    cy.get('tbody tr').should('have.length', 3);
    cy.get('tbody tr').eq(0).should('contain', 'Doe, John');
    cy.get('tbody tr').eq(1).should('contain', 'Smith, Jane');
    cy.get('tbody tr').eq(2).should('contain', 'Johnson, Robert');
    
    // Verify out-of-range values are highlighted
    cy.get('tbody tr').eq(0).find('td').eq(2).should('contain', '145/95');
    cy.get('tbody tr').eq(0).find('td').eq(2).find('.badge-danger').should('be.visible');
    
    cy.get('tbody tr').eq(0).find('td').eq(5).should('contain', '185');
    cy.get('tbody tr').eq(0).find('td').eq(5).find('.badge-danger').should('be.visible');
    
    cy.get('tbody tr').eq(1).find('td').eq(3).should('contain', '93');
    cy.get('tbody tr').eq(1).find('td').eq(3).find('.badge-warning').should('be.visible');
    
    cy.get('tbody tr').eq(2).find('td').eq(4).should('contain', '38.2');
    cy.get('tbody tr').eq(2).find('td').eq(4).find('.badge-danger').should('be.visible');
  });

  it('should enable real-time updates', () => {
    // Wait for initial data to load
    cy.wait('@getPatients');
    
    // Enable real-time updates
    cy.get('button').contains('Real-time: OFF').click();
    cy.get('button').contains('Real-time: ON').should('be.visible');
    
    // Mock updated telemetry data for polling
    cy.intercept('GET', '/devices/device1/telemetry*', {
      statusCode: 200,
      body: {
        success: true,
        deviceId: 'device1',
        data: [
          { timestamp: '2025-04-27T13:30:00Z', metric: 'bloodPressure', value: '135/85', unit: 'mmHg' }
        ]
      }
    }).as('updatedTelemetry');
    
    // Wait for polling to occur (should happen after 60 seconds, but we'll force it)
    cy.clock();
    cy.tick(60000);
    cy.wait('@updatedTelemetry');
    
    // Verify the data has been updated
    cy.get('tbody tr').eq(0).find('td').eq(2).should('contain', '135/85');
    cy.get('tbody tr').eq(0).find('td').eq(2).find('.badge-warning').should('be.visible');
    
    // Disable real-time updates
    cy.get('button').contains('Real-time: ON').click();
    cy.get('button').contains('Real-time: OFF').should('be.visible');
  });

  it('should navigate to patient details when View Details is clicked', () => {
    // Wait for patients data to load
    cy.wait('@getPatients');
    
    // Click on View Details button for first patient
    cy.get('tbody tr').eq(0).find('a').contains('View Details').click();
    
    // Verify navigation to patient telemetry page
    cy.url().should('include', '/patients/patient1/telemetry');
  });

  it('should navigate to schedule call page when Schedule Call is clicked', () => {
    // Wait for patients data to load
    cy.wait('@getPatients');
    
    // Click on Schedule Call button for first patient
    cy.get('tbody tr').eq(0).find('a').contains('Schedule Call').click();
    
    // Verify navigation to telehealth schedule page with patient ID
    cy.url().should('include', '/telehealth/schedule');
    cy.url().should('include', 'patientId=patient1');
  });
});
