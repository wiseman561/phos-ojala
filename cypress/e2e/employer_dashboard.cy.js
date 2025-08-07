describe('Employer Dashboard Tests', () => {
  beforeEach(() => {
    cy.loginAsEmployer();
  });

  it('should load Employer dashboard with analytics', () => {
    // Verify dashboard elements
    cy.get('[data-cy=dashboard-title]').containsAndVisible('Employer Dashboard');
    cy.get('[data-cy=analytics-panel]').should('be.visible');
    cy.get('[data-cy=employee-health-trends]').should('be.visible');
    cy.get('[data-cy=cost-analysis]').should('be.visible');
    
    // Verify employee list
    cy.get('[data-cy=employee-list]').should('be.visible');
    cy.get('[data-cy=employee-list-item]').should('have.length.at.least', 1);
  });

  it('should filter dashboard data and generate reports', () => {
    // Apply date range filter
    cy.get('[data-cy=date-range-picker]').click();
    cy.get('[data-cy=date-range-last-quarter]').click();
    
    // Apply department filter
    cy.get('[data-cy=department-filter]').select('Engineering');
    
    // Apply health risk filter
    cy.get('[data-cy=risk-level-filter]').select('All Risks');
    
    // Click apply filters
    cy.get('[data-cy=apply-filters-button]').click();
    
    // Wait for data to refresh
    cy.waitForApi('GET', '**/api/employer/analytics');
    
    // Verify filtered data is displayed
    cy.get('[data-cy=filtered-date-range]').should('contain', 'Last Quarter');
    cy.get('[data-cy=filtered-department]').should('contain', 'Engineering');
    
    // Generate report
    cy.get('[data-cy=generate-report-button]').click();
    
    // Select report type
    cy.get('[data-cy=report-type-select]').select('Health Risk Distribution');
    
    // Select report format
    cy.get('[data-cy=report-format-select]').select('PDF');
    
    // Generate the report
    cy.get('[data-cy=download-report-button]').click();
    
    // Verify report generation success message
    cy.get('[data-cy=report-success-message]').should('be.visible');
  });

  it('should display detailed employee health statistics', () => {
    // Click on first employee in the list
    cy.get('[data-cy=employee-list-item]').first().click();
    
    // Verify employee details are displayed
    cy.get('[data-cy=employee-details-panel]').should('be.visible');
    cy.get('[data-cy=employee-name]').should('be.visible');
    cy.get('[data-cy=employee-department]').should('be.visible');
    
    // Verify health metrics are displayed
    cy.get('[data-cy=health-metrics-panel]').should('be.visible');
    cy.get('[data-cy=health-score-trend]').should('be.visible');
    cy.get('[data-cy=risk-level-indicator]').should('be.visible');
    
    // Verify absence and productivity metrics
    cy.get('[data-cy=absence-metrics]').should('be.visible');
    cy.get('[data-cy=productivity-metrics]').should('be.visible');
    
    // Verify anonymized comparison to department average
    cy.get('[data-cy=department-comparison]').should('be.visible');
    cy.get('[data-cy=company-comparison]').should('be.visible');
  });

  it('should navigate between legacy and new dashboard views', () => {
    // Verify toggle button is present
    cy.get('[data-cy=dashboard-view-toggle]').should('be.visible');
    
    // Switch to legacy view
    cy.get('[data-cy=dashboard-view-toggle]').click();
    cy.get('[data-cy=legacy-view-indicator]').should('be.visible');
    
    // Verify legacy iframe is loaded
    cy.get('[data-cy=legacy-dashboard-iframe]').should('be.visible');
    cy.get('[data-cy=legacy-dashboard-iframe]').should('have.attr', 'src').and('include', '/legacy/employer');
    
    // Switch back to new view
    cy.get('[data-cy=dashboard-view-toggle]').click();
    cy.get('[data-cy=new-view-indicator]').should('be.visible');
    
    // Verify new dashboard is displayed
    cy.get('[data-cy=analytics-panel]').should('be.visible');
  });

  it('should configure wellness program settings', () => {
    // Navigate to wellness program settings
    cy.get('[data-cy=wellness-program-tab]').click();
    
    // Verify settings panel is displayed
    cy.get('[data-cy=wellness-settings-panel]').should('be.visible');
    
    // Update incentive settings
    cy.get('[data-cy=incentive-amount-input]').clear().type('500');
    cy.get('[data-cy=incentive-threshold-input]').clear().type('80');
    
    // Update program options
    cy.get('[data-cy=enable-fitness-program]').check();
    cy.get('[data-cy=enable-nutrition-program]').check();
    cy.get('[data-cy=enable-mental-health-program]').check();
    
    // Save settings
    cy.get('[data-cy=save-wellness-settings]').click();
    
    // Verify success message
    cy.get('[data-cy=settings-saved-message]').should('be.visible');
    
    // Verify settings were saved
    cy.reload();
    cy.get('[data-cy=wellness-program-tab]').click();
    cy.get('[data-cy=incentive-amount-input]').should('have.value', '500');
    cy.get('[data-cy=incentive-threshold-input]').should('have.value', '80');
    cy.get('[data-cy=enable-fitness-program]').should('be.checked');
    cy.get('[data-cy=enable-nutrition-program]').should('be.checked');
    cy.get('[data-cy=enable-mental-health-program]').should('be.checked');
  });
});
