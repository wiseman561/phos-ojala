// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Import commands.js using ES2015 syntax:
import 'cypress-file-upload';
import 'cypress-localstorage-commands';

// -- This is a parent command --
Cypress.Commands.add('login', (username, password) => {
  cy.visit('/login');
  cy.get('[data-cy=username-input]').type(username);
  cy.get('[data-cy=password-input]').type(password);
  cy.get('[data-cy=login-button]').click();
  cy.url().should('not.include', '/login');
});

// Login as different user types
Cypress.Commands.add('loginAsRN', () => {
  cy.login(Cypress.env('rnUsername'), Cypress.env('rnPassword'));
  cy.url().should('include', '/rn/dashboard');
});

Cypress.Commands.add('loginAsMD', () => {
  cy.login(Cypress.env('mdUsername'), Cypress.env('mdPassword'));
  cy.url().should('include', '/md/dashboard');
});

Cypress.Commands.add('loginAsEmployer', () => {
  cy.login(Cypress.env('employerUsername'), Cypress.env('employerPassword'));
  cy.url().should('include', '/employer/dashboard');
});

Cypress.Commands.add('loginAsPatient', () => {
  cy.login(Cypress.env('patientUsername'), Cypress.env('patientPassword'));
  cy.url().should('include', '/patient/dashboard');
});

// Command to check if an element is visible and contains text
Cypress.Commands.add('containsAndVisible', { prevSubject: 'element' }, (subject, text) => {
  cy.wrap(subject).should('be.visible').and('contain', text);
});

// Command to wait for API request to complete
Cypress.Commands.add('waitForApi', (method, url) => {
  cy.intercept(method, url).as('apiRequest');
  cy.wait('@apiRequest');
});

// Command to check health score
Cypress.Commands.add('checkHealthScore', (patientId) => {
  cy.request({
    method: 'GET',
    url: `${Cypress.env('apiUrl')}/api/ai/healthscore/${patientId}`,
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`
    }
  }).then((response) => {
    expect(response.status).to.eq(200);
    expect(response.body).to.have.property('score');
  });
});

// Command to check risk assessment
Cypress.Commands.add('checkRiskAssessment', (patientId) => {
  cy.request({
    method: 'GET',
    url: `${Cypress.env('apiUrl')}/api/ai/risk/${patientId}`,
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`
    }
  }).then((response) => {
    expect(response.status).to.eq(200);
    expect(response.body).to.have.property('overallRisk');
  });
});

// Command to toggle between legacy and new implementations
Cypress.Commands.add('toggleFeature', (featureName, enabled) => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/api/features/toggle`,
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`
    },
    body: {
      featureName,
      enabled
    }
  }).then((response) => {
    expect(response.status).to.eq(200);
  });
});
