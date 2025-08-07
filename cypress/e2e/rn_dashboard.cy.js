describe('RN Dashboard Tests', () => {
  beforeEach(() => {
    cy.loginAsRN();
  });

  it('should load RN dashboard with patient list', () => {
    // Verify dashboard elements
    cy.get('[data-cy=dashboard-title]').containsAndVisible('RN Dashboard');
    cy.get('[data-cy=patient-list]').should('be.visible');
    cy.get('[data-cy=patient-list-item]').should('have.length.at.least', 1);
    
    // Verify alerts section
    cy.get('[data-cy=alerts-panel]').should('be.visible');
    cy.get('[data-cy=alerts-count]').should('be.visible');
    
    // Verify task list
    cy.get('[data-cy=task-list]').should('be.visible');
  });

  it('should display patient details when clicking on a patient', () => {
    // Click on first patient in the list
    cy.get('[data-cy=patient-list-item]').first().click();
    
    // Verify patient details are displayed
    cy.get('[data-cy=patient-details]').should('be.visible');
    cy.get('[data-cy=patient-name]').should('be.visible');
    cy.get('[data-cy=patient-health-score]').should('be.visible');
    cy.get('[data-cy=patient-risk-assessment]').should('be.visible');
    
    // Verify health score data is loaded
    cy.get('[data-cy=health-score-value]').should('not.be.empty');
    cy.get('[data-cy=health-score-trend]').should('be.visible');
    
    // Verify risk assessment data is loaded
    cy.get('[data-cy=risk-level]').should('be.visible');
    cy.get('[data-cy=risk-factors]').should('be.visible');
  });

  it('should filter patients by risk level', () => {
    // Select high risk filter
    cy.get('[data-cy=risk-filter]').select('High');
    
    // Verify filtered list
    cy.get('[data-cy=patient-list-item]').each(($el) => {
      cy.wrap($el).find('[data-cy=patient-risk-indicator]').should('contain', 'High');
    });
    
    // Change filter to medium risk
    cy.get('[data-cy=risk-filter]').select('Medium');
    
    // Verify filtered list
    cy.get('[data-cy=patient-list-item]').each(($el) => {
      cy.wrap($el).find('[data-cy=patient-risk-indicator]').should('contain', 'Medium');
    });
  });

  it('should create a new care plan task', () => {
    // Click on first patient in the list
    cy.get('[data-cy=patient-list-item]').first().click();
    
    // Open care plan tab
    cy.get('[data-cy=care-plan-tab]').click();
    
    // Click add task button
    cy.get('[data-cy=add-task-button]').click();
    
    // Fill in task details
    cy.get('[data-cy=task-title-input]').type('Blood pressure check');
    cy.get('[data-cy=task-description-input]').type('Perform routine blood pressure check');
    cy.get('[data-cy=task-due-date-input]').type('2025-05-01');
    cy.get('[data-cy=task-priority-select]').select('High');
    
    // Save task
    cy.get('[data-cy=save-task-button]').click();
    
    // Verify task was added
    cy.get('[data-cy=care-plan-task-list]').should('contain', 'Blood pressure check');
  });

  it('should toggle between legacy and new implementation', () => {
    // Get the first patient ID
    let patientId;
    cy.get('[data-cy=patient-list-item]').first().invoke('attr', 'data-patient-id').then((id) => {
      patientId = id;
      
      // Enable new health score implementation
      cy.toggleFeature('UseNewHealthScoreModel', true);
      
      // Click on the patient
      cy.get(`[data-patient-id="${patientId}"]`).click();
      
      // Verify health score is displayed with new implementation indicator
      cy.get('[data-cy=health-score-implementation]').should('contain', 'New Model');
      
      // Disable new health score implementation
      cy.toggleFeature('UseNewHealthScoreModel', false);
      
      // Refresh the page
      cy.reload();
      
      // Click on the patient again
      cy.get(`[data-patient-id="${patientId}"]`).click();
      
      // Verify health score is displayed with legacy implementation indicator
      cy.get('[data-cy=health-score-implementation]').should('contain', 'Legacy Model');
    });
  });
});
