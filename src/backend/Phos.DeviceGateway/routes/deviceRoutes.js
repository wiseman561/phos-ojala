const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/deviceController');
const telemetryController = require('../controllers/telemetryController');
const healthkitController = require('../controllers/healthkitController');
const authMiddleware = require('../middleware/authMiddleware');
const { check } = require('express-validator');

// Device registration endpoint
router.post('/register', [
  check('deviceSerial').notEmpty().withMessage('Device serial is required'),
  check('patientId').notEmpty().withMessage('Patient ID is required'),
  check('firmwareVersion').notEmpty().withMessage('Firmware version is required')
], deviceController.registerDevice);

// Device telemetry endpoint - protected by auth middleware
router.post('/:deviceId/telemetry', 
  authMiddleware.verifyDeviceToken,
  telemetryController.recordTelemetry
);

// HealthKit data endpoint - protected by auth middleware
router.post('/:deviceId/healthkit', 
  authMiddleware.verifyDeviceToken,
  healthkitController.recordHealthKitData
);

// Get device telemetry endpoint
router.get('/:deviceId/telemetry', 
  authMiddleware.verifyToken,
  telemetryController.getTelemetry
);

// Get HealthKit data endpoint
router.get('/:deviceId/healthkit', 
  authMiddleware.verifyToken,
  healthkitController.getHealthKitData
);

module.exports = router;
