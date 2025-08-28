const winston = require('winston');

/**
 * Creates and configures the Winston logger for the tenant isolation module
 * @returns {winston.Logger} Configured logger instance
 */
function createLogger() {
  // Define log format
  const logFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  );

  // Create transports array
  const transports = [
    // Always log to console
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    
    // Log to file in non-production environments
    ...(process.env.NODE_ENV !== 'production' ? [
      new winston.transports.File({ 
        filename: 'logs/tenant-isolation-error.log', 
        level: 'error' 
      }),
      new winston.transports.File({ 
        filename: 'logs/tenant-isolation-combined.log' 
      })
    ] : [])
  ];

  // Create and return the logger
  return winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    defaultMeta: { service: 'tenant-isolation' },
    transports
  });
}

module.exports = { createLogger };
