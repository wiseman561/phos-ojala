// Custom Cypress commands for Patient Portal

// Login command
Cypress.Commands.add('loginAsPatient', (email, password) => {
  cy.visit('/login');
  cy.get('input[name="email"]').type(email || Cypress.env('PATIENT_EMAIL'));
  cy.get('input[name="password"]').type(password || Cypress.env('PATIENT_PASSWORD'));
  cy.get('button[type="submit"]').click();
  cy.url().should('include', '/dashboard');
});

// Mock authentication
Cypress.Commands.add('mockPatientAuth', () => {
  cy.window().then((win) => {
    win.localStorage.setItem('patient-portal-tokens', JSON.stringify({
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      expiresAt: new Date(Date.now() + 3600000).toISOString()
    }));
  });
});

// Clear authentication
Cypress.Commands.add('clearAuth', () => {
  cy.window().then((win) => {
    win.localStorage.removeItem('patient-portal-tokens');
  });
});

// File upload command
Cypress.Commands.add('uploadFiles', (selector, files) => {
  cy.get(selector).then(subject => {
    const fileArray = Array.isArray(files) ? files : [files];
    const fileObjects = fileArray.map(fileName => ({
      contents: Cypress.Buffer.from('file contents'),
      fileName,
      lastModified: Date.now(),
    }));

    cy.wrap(subject).trigger('change', {
      force: true,
      target: { files: fileObjects }
    });
  });
});

// Wait for loading to complete
Cypress.Commands.add('waitForPageLoad', () => {
  cy.get('[data-testid="loading"]', { timeout: 10000 }).should('not.exist');
  cy.get('body').should('be.visible');
});

// Assert notification
Cypress.Commands.add('shouldShowNotification', (message, type = 'success') => {
  cy.get('.MuiAlert-root')
    .should('be.visible')
    .and('contain', message)
    .and('have.class', `MuiAlert-${type}`);
});

// Check accessibility (basic)
Cypress.Commands.add('checkA11y', () => {
  cy.get('[role]').should('exist');
  cy.get('img').should('have.attr', 'alt');
  cy.get('button').should('be.visible');
});
