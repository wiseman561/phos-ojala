/// <reference types="cypress" />

/**
 * @type {Cypress.PluginConfig}
 */
module.exports = (on, config) => {
  // Enable code coverage if needed
  // require('@cypress/code-coverage/task')(on, config);

  // Browser launch options
  on('before:browser:launch', (browser = {}, launchOptions) => {
    if (browser.name === 'chrome') {
      launchOptions.args.push('--disable-dev-shm-usage');
      launchOptions.args.push('--disable-extensions');
    }

    return launchOptions;
  });

  // Task for logging
  on('task', {
    log(message) {
      console.log(message);
      return null;
    },
  });

  return config;
};
