describe('Telemetry Visualization', () => {
  beforeEach(() => {
    // Set up authentication
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        token: 'fake-jwt-token',
        user: {
          id: 'user123',
          role: 'patient'
        }
      }
    }).as('login');

    // Mock device telemetry data
    cy.intercept('GET', '/devices/*/telemetry*', {
      statusCode: 200,
      body: {
        success: true,
        deviceId: 'device123',
        data: [
          { timestamp: '2025-04-20T12:00:00Z', metric: 'heartRate', value: 72, unit: 'bpm' },
          { timestamp: '2025-04-21T12:00:00Z', metric: 'heartRate', value: 75, unit: 'bpm' },
          { timestamp: '2025-04-22T12:00:00Z', metric: 'heartRate', value: 70, unit: 'bpm' },
          { timestamp: '2025-04-23T12:00:00Z', metric: 'heartRate', value: 68, unit: 'bpm' },
          { timestamp: '2025-04-24T12:00:00Z', metric: 'heartRate', value: 73, unit: 'bpm' },
          { timestamp: '2025-04-25T12:00:00Z', metric: 'heartRate', value: 76, unit: 'bpm' },
          { timestamp: '2025-04-26T12:00:00Z', metric: 'heartRate', value: 74, unit: 'bpm' },
          { timestamp: '2025-04-27T12:00:00Z', metric: 'heartRate', value: 71, unit: 'bpm' },
          { timestamp: '2025-04-20T12:00:00Z', metric: 'bloodPressure', value: '120/80', unit: 'mmHg' },
          { timestamp: '2025-04-21T12:00:00Z', metric: 'bloodPressure', value: '118/78', unit: 'mmHg' },
          { timestamp: '2025-04-22T12:00:00Z', metric: 'bloodPressure', value: '122/82', unit: 'mmHg' },
          { timestamp: '2025-04-23T12:00:00Z', metric: 'bloodPressure', value: '119/79', unit: 'mmHg' },
          { timestamp: '2025-04-24T12:00:00Z', metric: 'bloodPressure', value: '121/81', unit: 'mmHg' },
          { timestamp: '2025-04-25T12:00:00Z', metric: 'bloodPressure', value: '123/83', unit: 'mmHg' },
          { timestamp: '2025-04-26T12:00:00Z', metric: 'bloodPressure', value: '120/80', unit: 'mmHg' },
          { timestamp: '2025-04-27T12:00:00Z', metric: 'bloodPressure', value: '118/78', unit: 'mmHg' },
          { timestamp: '2025-04-20T12:00:00Z', metric: 'oxygenSaturation', value: 98, unit: '%' },
          { timestamp: '2025-04-21T12:00:00Z', metric: 'oxygenSaturation', value: 97, unit: '%' },
          { timestamp: '2025-04-22T12:00:00Z', metric: 'oxygenSaturation', value: 98, unit: '%' },
          { timestamp: '2025-04-23T12:00:00Z', metric: 'oxygenSaturation', value: 99, unit: '%' },
          { timestamp: '2025-04-24T12:00:00Z', metric: 'oxygenSaturation', value: 98, unit: '%' },
          { timestamp: '2025-04-25T12:00:00Z', metric: 'oxygenSaturation', value: 97, unit: '%' },
          { timestamp: '2025-04-26T12:00:00Z', metric: 'oxygenSaturation', value: 98, unit: '%' },
          { timestamp: '2025-04-27T12:00:00Z', metric: 'oxygenSaturation', value: 99, unit: '%' }
        ]
      }
    }).as('getTelemetry');

    // Mock AI analysis
    cy.intercept('POST', '/api/telemetry/analyze', {
      statusCode: 200,
      body: {
        success: true,
        deviceId: 'device123',
        patientId: 'patient123',
        metrics: {
          heartRate: {
            average: 72.4,
            min: 68,
            max: 76,
            trend: 'stable'
          },
          bloodPressure: {
            systolicAverage: 120.1,
            diastolicAverage: 80.1,
            trend: 'stable'
          },
          oxygenSaturation: {
            average: 98,
            min: 97,
            max: 99,
            trend: 'stable'
          }
        },
        insights: [
          "All vital signs are within normal ranges.",
          "Heart rate has remained stable over the past week.",
          "Blood pressure readings show good control.",
          "Oxygen saturation levels are excellent."
        ],
        riskScore: 0.2,
        recommendations: [
          "Continue current monitoring schedule.",
          "Maintain current medication regimen.",
          "Regular exercise is recommended."
        ]
      }
    }).as('analyzeTelemetry');

    // Login and navigate to telemetry page
    cy.visit('/login');
    cy.get('input[name="username"]').type('testuser');
    cy.get('input[name="password"]').type('password');
    cy.get('button[type="submit"]').click();
    cy.wait('@login');
    cy.visit('/telemetry');
  });

  it('should display telemetry history chart', () => {
    // Wait for telemetry data to load
    cy.wait('@getTelemetry');
    
    // Verify chart is displayed
    cy.get('.telemetry-chart').should('be.visible');
    
    // Verify time range buttons
    cy.get('button').contains('24 Hours').should('be.visible');
    cy.get('button').contains('7 Days').should('be.visible');
    cy.get('button').contains('30 Days').should('be.visible');
    cy.get('button').contains('90 Days').should('be.visible');
    
    // Verify metric checkboxes
    cy.get('input[type="checkbox"]#metric-heartRate').should('be.checked');
    cy.get('input[type="checkbox"]#metric-bloodPressure').should('be.checked');
    cy.get('input[type="checkbox"]#metric-oxygenSaturation').should('be.checked');
    
    // Toggle a metric off and verify chart updates
    cy.get('input[type="checkbox"]#metric-bloodPressure').click();
    cy.get('input[type="checkbox"]#metric-bloodPressure').should('not.be.checked');
    
    // Change time range and verify new request
    cy.get('button').contains('24 Hours').click();
    cy.wait('@getTelemetry');
  });

  it('should request AI analysis and display results', () => {
    // Wait for telemetry data to load
    cy.wait('@getTelemetry');
    
    // Click analyze button
    cy.get('button').contains('Analyze Data').click();
    cy.wait('@analyzeTelemetry');
    
    // Verify analysis results are displayed
    cy.get('.analysis-results').should('be.visible');
    cy.get('.metrics-summary').should('be.visible');
    cy.get('.insights-section').should('be.visible');
    
    // Verify metrics are displayed correctly
    cy.get('.metrics-summary').contains('Heart Rate: 72.4 bpm');
    cy.get('.metrics-summary').contains('Blood Pressure: 120.1/80.1 mmHg');
    cy.get('.metrics-summary').contains('Oxygen Saturation: 98%');
    
    // Verify insights are displayed
    cy.get('.insights-section').contains('All vital signs are within normal ranges');
    
    // Verify recommendations are displayed
    cy.get('.recommendations-section').contains('Continue current monitoring schedule');
  });

  it('should enable real-time updates', () => {
    // Wait for telemetry data to load
    cy.wait('@getTelemetry');
    
    // Enable real-time updates
    cy.get('button').contains('Real-time: OFF').click();
    cy.get('button').contains('Real-time: ON').should('be.visible');
    
    // Mock new telemetry data for polling
    cy.intercept('GET', '/devices/*/telemetry*', {
      statusCode: 200,
      body: {
        success: true,
        deviceId: 'device123',
        data: [
          // Previous data plus one new reading
          { timestamp: '2025-04-27T13:00:00Z', metric: 'heartRate', value: 73, unit: 'bpm' },
          // ... (rest of the data)
        ]
      }
    }).as('pollTelemetry');
    
    // Wait for polling to occur (should happen after 60 seconds, but we'll force it)
    cy.clock();
    cy.tick(60000);
    cy.wait('@pollTelemetry');
    
    // Verify chart has updated with new data
    cy.get('.telemetry-chart').should('contain', '73 bpm');
    
    // Disable real-time updates
    cy.get('button').contains('Real-time: ON').click();
    cy.get('button').contains('Real-time: OFF').should('be.visible');
  });
});
