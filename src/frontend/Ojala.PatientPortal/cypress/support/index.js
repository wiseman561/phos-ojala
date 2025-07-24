// Cypress support file
import './commands';

// Hide fetch/XHR requests from command log
const app = window.top;
if (!app.document.head.querySelector('[data-hide-command-log-request]')) {
  const style = app.document.createElement('style');
  style.innerHTML = '.command-name-request, .command-name-xhr { display: none }';
  style.setAttribute('data-hide-command-log-request', '');
  app.document.head.appendChild(style);
}

// Global configuration
Cypress.on('uncaught:exception', (err, runnable) => {
  // Prevent Cypress from failing on uncaught exceptions
  console.error('Uncaught exception:', err.message);
  return false;
});

// Set default viewport
beforeEach(() => {
  cy.viewport(1280, 720);
});

// Custom assertions
chai.use(require('chai-dom'));
