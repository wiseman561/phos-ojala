// craco.config.js

const path = require('path');

module.exports = {
  eslint: {
    // Disable CRACO's ESLint integration
    enable: false,
  },
  webpack: {
    configure: (config) => {
      // Fix for fullySpecified loader issue with MUI and other ES modules
      config.module.rules.forEach((rule) => {
        if (rule.oneOf) {
          rule.oneOf.forEach((oneOf) => {
            if (oneOf.resolve) {
              oneOf.resolve.fullySpecified = false;
            }
          });
        }
      });

      // Additional fix for module resolution
      config.resolve.fullySpecified = false;

      // Add alias for @api to point to src/api
      config.resolve = config.resolve || {};
      config.resolve.alias = {
        ...(config.resolve.alias || {}),
        '@api': path.resolve(__dirname, 'src/api'),
      };

      return config;
    },
  },
  babel: {
    plugins: [
      ['@babel/plugin-transform-react-jsx', { runtime: 'automatic' }]
    ],
  },
  jest: {
    configure: (jestConfig, { env, paths, resolve, rootDir }) => {
      jestConfig.transformIgnorePatterns = [
        "[/\\\\]node_modules[/\\\\](?!axios).+\\.(js|jsx|ts|tsx)$",
        "^.+\\.module\\.(css|sass|scss)$",
        "/node_modules/(?!(@phos|react-native|react-native-.*|@react-native-.*)/)"
      ];
      jestConfig.collectCoverage = true;
      jestConfig.coverageReporters = [
        "json",
        "lcov",
        "text",
        "clover",
        "text-summary",
      ];
      jestConfig.coverageDirectory = "coverage";
      jestConfig.coverageThreshold = {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      };
      return jestConfig;
    },
  },
};
