describe('TelehealthScheduleList Component', () => {
  beforeEach(() => {
    // Mock the sessions API response
    cy.intercept('GET', '/telehealth/sessions?role=provider', {
      statusCode: 200,
      body: [
        {
          id: 'session-1',
          patientName: 'John Doe',
          scheduledAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
          status: 'Scheduled',
          durationMinutes: 30,
          reason: 'Annual checkup'
        },
        {
          id: 'session-2',
          patientName: 'Jane Smith',
          scheduledAt: new Date(Date.now() + 86400000).toISOString(), // 1 day from now
          status: 'Scheduled',
          durationMinutes: 45,
          reason: 'Follow-up consultation'
        },
        {
          id: 'session-3',
          patientName: 'Robert Johnson',
          scheduledAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          status: 'Completed',
          durationMinutes: 30,
          reason: 'Medication review'
        }
      ]
    }).as('getSessions');

    // Mock the reschedule appointment API
    cy.intercept('POST', '/telehealth/schedule', {
      statusCode: 200,
      body: {
        id: 'session-2',
        status: 'Scheduled'
      }
    }).as('rescheduleAppointment');

    // Mock the start session API
    cy.intercept('GET', '/telehealth/session/*', {
      statusCode: 200,
      body: {
        id: 'session-1',
        patientName: 'John Doe',
        scheduledAt: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
        status: 'Scheduled',
        twilioToken: 'mock-token'
      }
    }).as('getSessionDetails');

    cy.visit('/provider/telehealth');
  });

  it('should display telehealth sessions grouped by date', () => {
    cy.wait('@getSessions');
    
    // Check that tabs are displayed
    cy.contains('Today').should('be.visible');
    cy.contains('Tomorrow').should('be.visible');
    cy.contains('Upcoming').should('be.visible');
    cy.contains('Past').should('be.visible');
    
    // Check that sessions are displayed
    cy.contains('John Doe').should('be.visible');
    
    // Switch to Tomorrow tab
    cy.contains('Tomorrow').click();
    cy.contains('Jane Smith').should('be.visible');
    
    // Switch to Past tab
    cy.contains('Past').click();
    cy.contains('Robert Johnson').should('be.visible');
  });

  it('should allow rescheduling an appointment', () => {
    cy.wait('@getSessions');
    
    // Find and click the Reschedule button for Jane Smith's appointment
    cy.contains('Tomorrow').click();
    cy.contains('Jane Smith').parent().parent().contains('Reschedule').click();
    
    // Fill out the reschedule form
    cy.get('.MuiDialog-root').should('be.visible');
    cy.get('input[type="text"]').first().type('2023-12-01T14:00');
    
    // Submit the form
    cy.contains('Reschedule').click();
    
    // Wait for API call
    cy.wait('@rescheduleAppointment');
    
    // Verify the dialog closed and sessions refreshed
    cy.get('.MuiDialog-root').should('not.exist');
    cy.wait('@getSessions');
  });

  it('should enable Start Session button for eligible sessions', () => {
    // Override the session data to make one session eligible for starting
    cy.intercept('GET', '/telehealth/sessions?role=provider', {
      statusCode: 200,
      body: [
        {
          id: 'session-1',
          patientName: 'John Doe',
          scheduledAt: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago (eligible for starting)
          status: 'Scheduled',
          durationMinutes: 30,
          reason: 'Annual checkup'
        }
      ]
    }).as('getEligibleSessions');
    
    cy.visit('/provider/telehealth');
    cy.wait('@getEligibleSessions');
    
    // Check that Start Session button is enabled
    cy.contains('Start Session').should('not.be.disabled');
    
    // Click the Start Session button
    cy.contains('Start Session').click();
    
    // Wait for session details to be fetched
    cy.wait('@getSessionDetails');
    
    // Verify we navigated to the TelehealthRoom component
    cy.contains('Session with John Doe').should('be.visible');
  });

  it('should handle errors when fetching sessions', () => {
    // Override the intercept to return an error
    cy.intercept('GET', '/telehealth/sessions?role=provider', {
      statusCode: 500,
      body: { error: 'Server error' }
    }).as('getSessionsError');
    
    cy.visit('/provider/telehealth');
    cy.wait('@getSessionsError');
    
    // Verify error is displayed
    cy.contains('Failed to load telehealth sessions').should('be.visible');
  });

  it('should handle errors when rescheduling appointments', () => {
    cy.wait('@getSessions');
    
    // Override the intercept to return an error
    cy.intercept('POST', '/telehealth/schedule', {
      statusCode: 500,
      body: { error: 'Server error during rescheduling' }
    }).as('rescheduleError');
    
    // Find and click the Reschedule button
    cy.contains('Tomorrow').click();
    cy.contains('Jane Smith').parent().parent().contains('Reschedule').click();
    
    // Fill out the reschedule form
    cy.get('.MuiDialog-root').should('be.visible');
    cy.get('input[type="text"]').first().type('2023-12-01T14:00');
    
    // Submit the form
    cy.contains('Reschedule').click();
    
    // Wait for error response
    cy.wait('@rescheduleError');
    
    // Verify error is displayed in the dialog
    cy.get('.MuiDialog-root').contains('Failed to reschedule appointment').should('be.visible');
  });
});
