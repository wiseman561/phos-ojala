// Update the integration.js file to use the new chat module
const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const { createLogger } = require('../../monitoring/logger');
const metrics = require('../../monitoring/metrics');
const healthScoreRouter = require('./health-score');
const metricsRouter = require('./metrics');
const forecastingRouter = require('./forecasting');
const omicsRouter = require('./omics');
const chatRouter = require('./chat');

// Initialize logger
const logger = createLogger('ai-engine', {
  enableConsole: true,
  enableFile: true,
  enableCloudWatch: process.env.NODE_ENV === 'production'
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  req.startTime = Date.now();
  
  // Log request
  logger.info(`${req.method} ${req.path}`, {
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - req.startTime;
    
    logger.info(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`, {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration
    });
    
    // Record metrics
    metrics.recordApiRequest(req.method, req.path, res.statusCode, duration);
  });
  
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'ai-engine',
    version: process.env.VERSION || '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/health-score', healthScoreRouter);
app.use('/api/metrics', metricsRouter);
app.use('/api/forecasting', forecastingRouter);
app.use('/api/omics', omicsRouter);
app.use('/api/ai', chatRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// Start server
const port = process.env.PORT || 80;
app.listen(port, '0.0.0.0', () => {
  logger.info(`AI Engine listening on port ${port}`);
});

module.exports = app;
