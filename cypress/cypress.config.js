const { defineConfig } = require('cypress')

module.exports = defineConfig({
  viewportWidth: 1280,
  viewportHeight: 720,
  defaultCommandTimeout: 10000,
  requestTimeout: 10000,
  responseTimeout: 30000,
  video: true,
  screenshotOnRunFailure: true,
  chromeWebSecurity: false,
  reporter: 'cypress-multi-reporters',
  reporterOptions: {
    reporterEnabled: 'mochawesome',
    mochawesomeReporterOptions: {
      reportDir: 'cypress/reports/mocha',
      quite: true,
      overwrite: false,
      html: false,
      json: true
    }
  },
  e2e: {
    baseUrl: 'http://localhost:3000',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
  env: {
    apiUrl: 'http://localhost:8080',
    adminUsername: 'admin@phos-healthcare.com',
    adminPassword: 'admin-password',
    rnUsername: 'nurse@phos-healthcare.com',
    rnPassword: 'nurse-password',
    mdUsername: 'doctor@phos-healthcare.com',
    mdPassword: 'doctor-password',
    employerUsername: 'employer@phos-healthcare.com',
    employerPassword: 'employer-password',
    patientUsername: 'patient@phos-healthcare.com',
    patientPassword: 'patient-password'
  }
})
