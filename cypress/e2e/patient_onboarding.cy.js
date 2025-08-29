describe('Patient Onboarding and Dashboard Tests', () => {
  beforeEach(() => {
    cy.loginAsPatient();
  });

  it('should load Patient dashboard with health summary', () => {
    // Verify dashboard elements
    cy.get('[data-cy=dashboard-title]').containsAndVisible('Patient Dashboard');
    cy.get('[data-cy=health-summary-panel]').should('be.visible');
    cy.get('[data-cy=health-score-display]').should('be.visible');
    cy.get('[data-cy=upcoming-tasks]').should('be.visible');
    
    // Verify care plan section
    cy.get('[data-cy=care-plan-summary]').should('be.visible');
    
    // Verify messaging section
    cy.get('[data-cy=messages-panel]').should('be.visible');
  });

  it('should complete onboarding process for new patient', () => {
    // Simulate new patient by clearing onboarding flag
    cy.window().then((win) => {
      win.localStorage.setItem('onboardingCompleted', 'false');
      win.location.reload();
    });
    
    // Verify onboarding welcome screen
    cy.get('[data-cy=onboarding-welcome]').should('be.visible');
    cy.get('[data-cy=start-onboarding-button]').click();
    
    // Step 1: Personal Information
    cy.get('[data-cy=onboarding-step-title]').should('contain', 'Personal Information');
    cy.get('[data-cy=personal-info-form]').should('be.visible');
    
    // Fill personal information
    cy.get('[data-cy=height-input]').type('175');
    cy.get('[data-cy=weight-input]').type('70');
    cy.get('[data-cy=date-of-birth-input]').type('1980-01-01');
    cy.get('[data-cy=gender-select]').select('Male');
    cy.get('[data-cy=next-button]').click();
    
    // Step 2: Medical History
    cy.get('[data-cy=onboarding-step-title]').should('contain', 'Medical History');
    cy.get('[data-cy=medical-history-form]').should('be.visible');
    
    // Fill medical history
    cy.get('[data-cy=existing-conditions-diabetes]').check();
    cy.get('[data-cy=existing-conditions-hypertension]').check();
    cy.get('[data-cy=allergies-input]').type('Penicillin');
    cy.get('[data-cy=medications-input]').type('Metformin, Lisinopril');
    cy.get('[data-cy=next-button]').click();
    
    // Step 3: Lifestyle Information
    cy.get('[data-cy=onboarding-step-title]').should('contain', 'Lifestyle Information');
    cy.get('[data-cy=lifestyle-form]').should('be.visible');
    
    // Fill lifestyle information
    cy.get('[data-cy=exercise-frequency-select]').select('3-4 times per week');
    cy.get('[data-cy=smoking-status-select]').select('Non-smoker');
    cy.get('[data-cy=alcohol-consumption-select]').select('Occasional');
    cy.get('[data-cy=stress-level-select]').select('Moderate');
    cy.get('[data-cy=next-button]').click();
    
    // Step 4: Communication Preferences
    cy.get('[data-cy=onboarding-step-title]').should('contain', 'Communication Preferences');
    cy.get('[data-cy=communication-form]').should('be.visible');
    
    // Fill communication preferences
    cy.get('[data-cy=preferred-contact-method-select]').select('Email');
    cy.get('[data-cy=notification-preferences-appointment-reminders]').check();
    cy.get('[data-cy=notification-preferences-care-plan-updates]').check();
    cy.get('[data-cy=notification-preferences-health-tips]').check();
    cy.get('[data-cy=complete-button]').click();
    
    // Verify onboarding completion
    cy.get('[data-cy=onboarding-complete-message]').should('be.visible');
    cy.get('[data-cy=go-to-dashboard-button]').click();
    
    // Verify redirected to dashboard
    cy.get('[data-cy=dashboard-title]').should('be.visible');
    cy.get('[data-cy=health-summary-panel]').should('be.visible');
  });

  it('should view and interact with care plan tasks', () => {
    // Navigate to care plan section
    cy.get('[data-cy=care-plan-tab]').click();
    
    // Verify care plan details
    cy.get('[data-cy=care-plan-details]').should('be.visible');
    cy.get('[data-cy=care-plan-goals]').should('be.visible');
    cy.get('[data-cy=care-plan-tasks]').should('be.visible');
    
    // Mark a task as completed
    cy.get('[data-cy=task-item]').first().within(() => {
      cy.get('[data-cy=task-complete-checkbox]').check();
    });
    
    // Verify task marked as complete
    cy.get('[data-cy=task-item]').first().should('have.class', 'completed');
    
    // Add a comment to a task
    cy.get('[data-cy=task-item]').eq(1).within(() => {
      cy.get('[data-cy=add-comment-button]').click();
    });
    
    cy.get('[data-cy=task-comment-input]').type('Completed this task but had some difficulty with the instructions');
    cy.get('[data-cy=submit-comment-button]').click();
    
    // Verify comment was added
    cy.get('[data-cy=task-item]').eq(1).within(() => {
      cy.get('[data-cy=task-comments]').should('contain', 'Completed this task but had some difficulty');
    });
  });

  it('should record health measurements', () => {
    // Navigate to health tracking section
    cy.get('[data-cy=health-tracking-tab]').click();
    
    // Verify health tracking form
    cy.get('[data-cy=health-tracking-form]').should('be.visible');
    
    // Record blood pressure
    cy.get('[data-cy=measurement-type-select]').select('Blood Pressure');
    cy.get('[data-cy=systolic-input]').type('120');
    cy.get('[data-cy=diastolic-input]').type('80');
    cy.get('[data-cy=measurement-notes]').type('Taken after morning walk');
    cy.get('[data-cy=save-measurement-button]').click();
    
    // Verify measurement was saved
    cy.get('[data-cy=recent-measurements]').should('contain', 'Blood Pressure');
    cy.get('[data-cy=recent-measurements]').should('contain', '120/80');
    
    // Record weight
    cy.get('[data-cy=measurement-type-select]').select('Weight');
    cy.get('[data-cy=weight-input]').type('70.5');
    cy.get('[data-cy=measurement-notes]').type('Morning weight');
    cy.get('[data-cy=save-measurement-button]').click();
    
    // Verify measurement was saved
    cy.get('[data-cy=recent-measurements]').should('contain', 'Weight');
    cy.get('[data-cy=recent-measurements]').should('contain', '70.5');
    
    // View measurement history
    cy.get('[data-cy=view-history-button]').click();
    
    // Verify history chart is displayed
    cy.get('[data-cy=measurement-history-chart]').should('be.visible');
    cy.get('[data-cy=measurement-type-filter]').select('Blood Pressure');
    cy.get('[data-cy=measurement-history-chart]').should('be.visible');
  });

  it('should toggle between legacy and new dashboard views', () => {
    // Verify toggle button is present
    cy.get('[data-cy=dashboard-view-toggle]').should('be.visible');
    
    // Switch to legacy view
    cy.get('[data-cy=dashboard-view-toggle]').click();
    cy.get('[data-cy=legacy-view-indicator]').should('be.visible');
    
    // Verify legacy iframe is loaded
    cy.get('[data-cy=legacy-dashboard-iframe]').should('be.visible');
    cy.get('[data-cy=legacy-dashboard-iframe]').should('have.attr', 'src').and('include', '/legacy/patient');
    
    // Switch back to new view
    cy.get('[data-cy=dashboard-view-toggle]').click();
    cy.get('[data-cy=new-view-indicator]').should('be.visible');
    
    // Verify new dashboard is displayed
    cy.get('[data-cy=health-summary-panel]').should('be.visible');
  });
});
