describe('OmicsInsights Component', () => {
  beforeEach(() => {
    cy.intercept('POST', '/api/omics/upload', {
      statusCode: 200,
      body: {
        files: [
          { fileId: 'file-1', fileName: 'test1.json', dataType: 'genomic' },
          { fileId: 'file-2', fileName: 'test2.csv', dataType: 'microbiome' }
        ]
      }
    }).as('uploadFiles');

    cy.intercept('POST', '/api/omics/analyze', {
      statusCode: 200,
      body: {
        results: {
          analysisType: 'risk_assessment',
          timestamp: new Date().toISOString(),
          modelResults: {
            metrics: [
              { name: 'Health Score', value: 85, unit: 'points', status: 'Normal' },
              { name: 'Diabetes Risk', value: 12, unit: '%', status: 'Low' },
              { name: 'Cardiovascular Risk', value: 15, unit: '%', status: 'Low' },
              { name: 'Inflammation Index', value: 3.2, unit: 'points', status: 'Normal' }
            ]
          },
          llmInsights: {
            insights: [
              { 
                title: 'Good Overall Health', 
                explanation: 'Your biomarkers indicate good overall health with normal ranges for most indicators.'
              },
              {
                title: 'Low Diabetes Risk',
                explanation: 'Your genetic profile and current biomarkers suggest a low risk for developing type 2 diabetes.'
              },
              {
                title: 'Healthy Microbiome Diversity',
                explanation: 'Your microbiome shows good diversity, which is associated with better overall health outcomes.'
              }
            ]
          },
          files: [
            { fileId: 'file-1', fileName: 'test1.json', dataType: 'genomic' },
            { fileId: 'file-2', fileName: 'test2.csv', dataType: 'microbiome' }
          ]
        }
      }
    }).as('analyzeFiles');

    cy.visit('/omics-insights');
  });

  it('should upload files and display them', () => {
    // Upload test files
    cy.get('input[type="file"]').attachFile(['test1.json', 'test2.csv']);
    cy.get('select#data-type').select('genomic');
    cy.get('input#source').type('23andMe');
    cy.get('textarea#description').type('Test genomic data');
    cy.get('button').contains('Upload Files').click();

    // Wait for upload to complete
    cy.wait('@uploadFiles');

    // Verify we moved to the next step
    cy.get('.MuiStepper-root .Mui-active').should('contain', 'Analyze Data');
    cy.get('button').contains('Analyze Data').should('be.visible');
  });

  it('should analyze files and display results', () => {
    // Skip to analyze step (mock the upload)
    cy.get('input[type="file"]').attachFile(['test1.json', 'test2.csv']);
    cy.get('select#data-type').select('genomic');
    cy.get('input#source').type('23andMe');
    cy.get('button').contains('Upload Files').click();
    cy.wait('@uploadFiles');

    // Click analyze button
    cy.get('button').contains('Analyze Data').click();
    
    // Wait for analysis to complete
    cy.wait('@analyzeFiles');

    // Verify we moved to the results step
    cy.get('.MuiStepper-root .Mui-active').should('contain', 'View Insights');
    
    // Check that model results are displayed
    cy.get('table').should('be.visible');
    cy.contains('Health Score').should('be.visible');
    cy.contains('85').should('be.visible');
    
    // Check that LLM insights are displayed
    cy.contains('Good Overall Health').should('be.visible');
    cy.contains('Low Diabetes Risk').should('be.visible');
    cy.contains('Healthy Microbiome Diversity').should('be.visible');
  });

  it('should handle errors during upload', () => {
    // Override the intercept to return an error
    cy.intercept('POST', '/api/omics/upload', {
      statusCode: 500,
      body: { error: 'Server error during upload' }
    }).as('uploadError');

    // Attempt to upload files
    cy.get('input[type="file"]').attachFile(['test1.json']);
    cy.get('select#data-type').select('genomic');
    cy.get('input#source').type('23andMe');
    cy.get('button').contains('Upload Files').click();

    // Wait for error response
    cy.wait('@uploadError');

    // Verify error is displayed
    cy.get('.MuiAlert-root').should('contain', 'Server error during upload');
  });

  it('should handle errors during analysis', () => {
    // Skip to analyze step (mock the upload)
    cy.get('input[type="file"]').attachFile(['test1.json']);
    cy.get('select#data-type').select('genomic');
    cy.get('input#source').type('23andMe');
    cy.get('button').contains('Upload Files').click();
    cy.wait('@uploadFiles');

    // Override the intercept to return an error
    cy.intercept('POST', '/api/omics/analyze', {
      statusCode: 500,
      body: { error: 'Server error during analysis' }
    }).as('analyzeError');

    // Click analyze button
    cy.get('button').contains('Analyze Data').click();
    
    // Wait for error response
    cy.wait('@analyzeError');

    // Verify error is displayed
    cy.get('.MuiAlert-root').should('contain', 'Server error during analysis');
  });
});
