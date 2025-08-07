describe('MD Care Plan Creation Tests', () => {
  beforeEach(() => {
    cy.loginAsMD();
  });

  it('should load MD dashboard with assigned patients', () => {
    // Verify dashboard elements
    cy.get('[data-cy=dashboard-title]').containsAndVisible('MD Dashboard');
    cy.get('[data-cy=patient-list]').should('be.visible');
    cy.get('[data-cy=patient-list-item]').should('have.length.at.least', 1);
    
    // Verify care plan section
    cy.get('[data-cy=care-plans-panel]').should('be.visible');
    
    // Verify pending reviews section
    cy.get('[data-cy=pending-reviews]').should('be.visible');
  });

  it('should create a new care plan for a patient', () => {
    // Click on first patient in the list
    cy.get('[data-cy=patient-list-item]').first().click();
    
    // Click on create care plan button
    cy.get('[data-cy=create-care-plan-button]').click();
    
    // Fill in care plan details
    cy.get('[data-cy=care-plan-title-input]').type('Diabetes Management Plan');
    cy.get('[data-cy=care-plan-description-input]').type('Comprehensive plan for managing Type 2 Diabetes');
    cy.get('[data-cy=care-plan-start-date]').type('2025-05-01');
    cy.get('[data-cy=care-plan-end-date]').type('2025-11-01');
    
    // Add goals
    cy.get('[data-cy=add-goal-button]').click();
    cy.get('[data-cy=goal-description-input]').type('Reduce HbA1c to below 7.0%');
    cy.get('[data-cy=goal-target-date]').type('2025-08-01');
    cy.get('[data-cy=save-goal-button]').click();
    
    // Add another goal
    cy.get('[data-cy=add-goal-button]').click();
    cy.get('[data-cy=goal-description-input]').type('Maintain blood pressure below 130/80');
    cy.get('[data-cy=goal-target-date]').type('2025-07-01');
    cy.get('[data-cy=save-goal-button]').click();
    
    // Add tasks
    cy.get('[data-cy=add-task-button]').click();
    cy.get('[data-cy=task-title-input]').type('Weekly blood glucose monitoring');
    cy.get('[data-cy=task-description-input]').type('Check and record blood glucose levels 3 times per week');
    cy.get('[data-cy=task-assignee-select]').select('RN');
    cy.get('[data-cy=task-frequency-select]').select('Weekly');
    cy.get('[data-cy=save-task-button]').click();
    
    // Add another task
    cy.get('[data-cy=add-task-button]').click();
    cy.get('[data-cy=task-title-input]').type('Monthly HbA1c test');
    cy.get('[data-cy=task-description-input]').type('Perform HbA1c test and record results');
    cy.get('[data-cy=task-assignee-select]').select('MD');
    cy.get('[data-cy=task-frequency-select]').select('Monthly');
    cy.get('[data-cy=save-task-button]').click();
    
    // Save care plan
    cy.get('[data-cy=save-care-plan-button]').click();
    
    // Verify care plan was created
    cy.get('[data-cy=success-message]').should('be.visible');
    cy.get('[data-cy=care-plan-title]').should('contain', 'Diabetes Management Plan');
  });

  it('should review and approve a pending care plan', () => {
    // Go to pending reviews section
    cy.get('[data-cy=pending-reviews-tab]').click();
    
    // Click on first pending review
    cy.get('[data-cy=pending-review-item]').first().click();
    
    // Review care plan details
    cy.get('[data-cy=care-plan-details]').should('be.visible');
    cy.get('[data-cy=care-plan-goals]').should('be.visible');
    cy.get('[data-cy=care-plan-tasks]').should('be.visible');
    
    // Add review comment
    cy.get('[data-cy=review-comment-input]').type('Approved with minor adjustments to glucose monitoring frequency');
    
    // Make an adjustment to a task
    cy.get('[data-cy=edit-task-button]').first().click();
    cy.get('[data-cy=task-frequency-select]').select('Daily');
    cy.get('[data-cy=save-task-button]').click();
    
    // Approve care plan
    cy.get('[data-cy=approve-care-plan-button]').click();
    
    // Verify approval was successful
    cy.get('[data-cy=success-message]').should('be.visible');
    cy.get('[data-cy=pending-reviews]').should('not.contain', 'Diabetes Management Plan');
  });

  it('should integrate with AI engine for risk assessment', () => {
    // Click on first patient in the list
    cy.get('[data-cy=patient-list-item]').first().click();
    
    // Click on risk assessment tab
    cy.get('[data-cy=risk-assessment-tab]').click();
    
    // Verify risk assessment data is loaded
    cy.get('[data-cy=risk-assessment-panel]').should('be.visible');
    cy.get('[data-cy=overall-risk-level]').should('be.visible');
    cy.get('[data-cy=risk-categories]').should('be.visible');
    
    // Request new risk assessment
    cy.get('[data-cy=refresh-risk-assessment-button]').click();
    
    // Wait for API call to complete
    cy.waitForApi('GET', '**/api/ai/risk/*');
    
    // Verify updated risk assessment
    cy.get('[data-cy=risk-assessment-date]').should('contain', new Date().toLocaleDateString());
  });

  it('should toggle between legacy and new implementation', () => {
    // Get the first patient ID
    let patientId;
    cy.get('[data-cy=patient-list-item]').first().invoke('attr', 'data-patient-id').then((id) => {
      patientId = id;
      
      // Enable new risk model implementation
      cy.toggleFeature('UseNewRiskModel', true);
      
      // Click on the patient
      cy.get(`[data-patient-id="${patientId}"]`).click();
      
      // Go to risk assessment tab
      cy.get('[data-cy=risk-assessment-tab]').click();
      
      // Verify risk assessment is displayed with new implementation indicator
      cy.get('[data-cy=risk-model-implementation]').should('contain', 'New Model');
      
      // Disable new risk model implementation
      cy.toggleFeature('UseNewRiskModel', false);
      
      // Refresh the page
      cy.reload();
      
      // Click on the patient again
      cy.get(`[data-patient-id="${patientId}"]`).click();
      
      // Go to risk assessment tab
      cy.get('[data-cy=risk-assessment-tab]').click();
      
      // Verify risk assessment is displayed with legacy implementation indicator
      cy.get('[data-cy=risk-model-implementation]').should('contain', 'Legacy Model');
    });
  });
});
