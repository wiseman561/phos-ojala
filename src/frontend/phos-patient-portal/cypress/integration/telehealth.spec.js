describe('Telehealth Component', () => {
  beforeEach(() => {
    // Mock the sessions API response
    cy.intercept('GET', '/telehealth/sessions?role=patient', {
      statusCode: 200,
      body: [
        {
          id: 'session-1',
          providerName: 'Dr. Smith',
          scheduledAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
          status: 'Scheduled',
          durationMinutes: 30,
          reason: 'Annual checkup'
        },
        {
          id: 'session-2',
          providerName: 'Dr. Johnson',
          scheduledAt: new Date(Date.now() + 86400000).toISOString(), // 1 day from now
          status: 'Scheduled',
          durationMinutes: 45,
          reason: 'Follow-up consultation'
        },
        {
          id: 'session-3',
          providerName: 'Dr. Williams',
          scheduledAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          status: 'Completed',
          durationMinutes: 30,
          reason: 'Medication review'
        }
      ]
    }).as('getSessions');

    // Mock the schedule appointment API
    cy.intercept('POST', '/telehealth/schedule', {
      statusCode: 200,
      body: {
        id: 'new-session-id',
        status: 'Scheduled'
      }
    }).as('scheduleAppointment');

    // Mock the join session API
    cy.intercept('GET', '/telehealth/join/*', {
      statusCode: 200,
      body: {
        roomName: 'test-room',
        token: 'test-token'
      }
    }).as('joinSession');

    cy.visit('/telehealth');
  });

  it('should display upcoming telehealth sessions', () => {
    cy.wait('@getSessions');
    
    // Check that sessions are displayed
    cy.contains('Session with Dr. Smith').should('be.visible');
    cy.contains('Session with Dr. Johnson').should('be.visible');
    cy.contains('Session with Dr. Williams').should('be.visible');
    
    // Check status chips
    cy.contains('Scheduled').should('be.visible');
    cy.contains('Completed').should('be.visible');
  });

  it('should allow requesting a new appointment', () => {
    cy.wait('@getSessions');
    
    // Click request appointment button
    cy.contains('Request Appointment').click();
    
    // Fill out the form
    cy.get('.MuiDialog-root').should('be.visible');
    cy.get('input[type="text"]').first().type('2023-12-01T10:00');
    cy.get('textarea').type('Need to discuss recent test results');
    
    // Submit the form
    cy.contains('Submit Request').click();
    
    // Wait for API call
    cy.wait('@scheduleAppointment');
    
    // Verify the dialog closed and sessions refreshed
    cy.get('.MuiDialog-root').should('not.exist');
    cy.wait('@getSessions');
  });

  it('should show Join Session button for eligible sessions', () => {
    // Override the session data to make one session eligible for joining
    cy.intercept('GET', '/telehealth/sessions?role=patient', {
      statusCode: 200,
      body: [
        {
          id: 'session-1',
          providerName: 'Dr. Smith',
          scheduledAt: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago (eligible for joining)
          status: 'Scheduled',
          durationMinutes: 30,
          reason: 'Annual checkup'
        }
      ]
    }).as('getEligibleSessions');
    
    cy.visit('/telehealth');
    cy.wait('@getEligibleSessions');
    
    // Check that Join Session button is visible
    cy.contains('Join Session').should('be.visible');
    
    // Click the Join Session button
    cy.window().then((win) => {
      // Stub window.open to prevent actual navigation
      cy.stub(win, 'open').as('windowOpen');
    });
    
    cy.contains('Join Session').click();
    
    // Verify window.open was called with the correct URL
    cy.get('@windowOpen').should('be.calledWith', Cypress.sinon.match.string);
  });

  it('should handle errors when fetching sessions', () => {
    // Override the intercept to return an error
    cy.intercept('GET', '/telehealth/sessions?role=patient', {
      statusCode: 500,
      body: { error: 'Server error' }
    }).as('getSessionsError');
    
    cy.visit('/telehealth');
    cy.wait('@getSessionsError');
    
    // Verify error is displayed
    cy.contains('Failed to load your telehealth sessions').should('be.visible');
  });

  it('should handle errors when scheduling appointments', () => {
    cy.wait('@getSessions');
    
    // Override the intercept to return an error
    cy.intercept('POST', '/telehealth/schedule', {
      statusCode: 500,
      body: { error: 'Server error during scheduling' }
    }).as('scheduleError');
    
    // Click request appointment button
    cy.contains('Request Appointment').click();
    
    // Fill out the form
    cy.get('.MuiDialog-root').should('be.visible');
    cy.get('input[type="text"]').first().type('2023-12-01T10:00');
    cy.get('textarea').type('Need to discuss recent test results');
    
    // Submit the form
    cy.contains('Submit Request').click();
    
    // Wait for error response
    cy.wait('@scheduleError');
    
    // Verify error is displayed in the dialog
    cy.get('.MuiDialog-root').contains('Failed to schedule appointment').should('be.visible');
  });
});
