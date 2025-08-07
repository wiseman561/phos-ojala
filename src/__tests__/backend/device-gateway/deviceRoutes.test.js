const request = require('supertest');
const express = require('express');
const deviceController = require('../controllers/deviceController');
const telemetryController = require('../controllers/telemetryController');
const healthkitController = require('../controllers/healthkitController');
const authMiddleware = require('../middleware/authMiddleware');
const influxdb = require('../config/influxdb');

// Mock verifyDeviceToken before requiring routes
jest.mock('../middleware/authMiddleware', () => ({
  verifyDeviceToken: jest.fn((req, res, next) => next()),
  verifyToken: jest.fn((req, res, next) => next())
}));

// Now require routes after mocking
const deviceRoutes = require('../routes/deviceRoutes');

// Mock other dependencies
jest.mock('../controllers/deviceController');
jest.mock('../controllers/telemetryController');
jest.mock('../controllers/healthkitController');
jest.mock('../config/influxdb');

describe('Device Gateway API Routes', () => {
  let app;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create a new express app for each test
    app = express();
    app.use(express.json());
    app.use('/devices', deviceRoutes);

    // Setup auth middleware mock implementations
    const mockAuthMiddleware = require('../middleware/authMiddleware');
    mockAuthMiddleware.verifyDeviceToken.mockImplementation((req, res, next) => {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No device token provided' });
      }
      const token = authHeader.split(' ')[1];
      if (token === 'invalid-token') {
        return res.status(403).json({ error: 'Invalid device token' });
      }
      req.device = { id: 'device123', patientId: 'patient123' };
      next();
    });

    mockAuthMiddleware.verifyToken.mockImplementation((req, res, next) => {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
      }
      const token = authHeader.split(' ')[1];
      if (token === 'invalid-token') {
        return res.status(403).json({ error: 'Invalid token' });
      }
      req.user = { id: 'user123', role: 'admin' };
      next();
    });
  });

  describe('POST /devices/register', () => {
    it('should register a new device and return a token', async () => {
      // Mock the controller response
      deviceController.registerDevice.mockImplementation((req, res) => {
        res.status(201).json({
          success: true,
          message: 'Device registered successfully',
          deviceId: 'device123',
          token: 'jwt-token-123'
        });
      });

      // Test request
      const response = await request(app)
        .post('/register')
        .send({
          deviceSerial: 'SN12345',
          patientId: 'patient123',
          firmwareVersion: '1.0.0'
        });

      // Assertions
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.deviceId).toBe('device123');
      expect(response.body.token).toBe('jwt-token-123');
      expect(deviceController.registerDevice).toHaveBeenCalledTimes(1);
    });

    it('should return 400 for invalid input', async () => {
      // Mock the controller response for validation error
      deviceController.registerDevice.mockImplementation((req, res) => {
        res.status(400).json({
          success: false,
          message: 'Invalid input data',
          errors: ['deviceSerial is required']
        });
      });

      // Test request with missing required field
      const response = await request(app)
        .post('/register')
        .send({
          patientId: 'patient123',
          firmwareVersion: '1.0.0'
        });

      // Assertions
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContain('deviceSerial is required');
      expect(deviceController.registerDevice).toHaveBeenCalledTimes(1);
    });
  });

  describe('POST /devices/:deviceId/telemetry', () => {
    it('should verify device token before storing telemetry data', async () => {
      const authMiddleware = require('../middleware/authMiddleware');
      
      // Mock the controller response
      telemetryController.storeTelemetry.mockImplementation((req, res) => {
        res.status(200).json({
          success: true,
          message: 'Telemetry data stored successfully',
          count: 3
        });
      });

      // Test request with valid token
      const response = await request(app)
        .post('/device123/telemetry')
        .set('Authorization', 'Bearer valid-device-token')
        .send([
          { timestamp: '2025-04-27T12:00:00Z', metric: 'heartRate', value: 72, unit: 'bpm' }
        ]);

      // Verify middleware was called and request succeeded
      expect(authMiddleware.verifyDeviceToken).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });

    it('should return 401 when no device token is provided', async () => {
      // Test request without token
      const response = await request(app)
        .post('/device123/telemetry')
        .send([
          { timestamp: '2025-04-27T12:00:00Z', metric: 'heartRate', value: 72, unit: 'bpm' }
        ]);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('No device token provided');
    });

    it('should return 403 when invalid device token is provided', async () => {
      // Test request with invalid token
      const response = await request(app)
        .post('/device123/telemetry')
        .set('Authorization', 'Bearer invalid-token')
        .send([
          { timestamp: '2025-04-27T12:00:00Z', metric: 'heartRate', value: 72, unit: 'bpm' }
        ]);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Invalid device token');
    });

    it('should store telemetry data and return success', async () => {
      // Mock the controller response
      telemetryController.storeTelemetry.mockImplementation((req, res) => {
        res.status(200).json({
          success: true,
          message: 'Telemetry data stored successfully',
          count: 3
        });
      });

      // Test request
      const response = await request(app)
        .post('/device123/telemetry')
        .send([
          { timestamp: '2025-04-27T12:00:00Z', metric: 'heartRate', value: 72, unit: 'bpm' },
          { timestamp: '2025-04-27T12:00:00Z', metric: 'bloodPressure', value: '120/80', unit: 'mmHg' },
          { timestamp: '2025-04-27T12:00:00Z', metric: 'oxygenSaturation', value: 98, unit: '%' }
        ]);

      // Assertions
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(3);
      expect(telemetryController.storeTelemetry).toHaveBeenCalledTimes(1);
    });

    it('should return 400 for invalid telemetry data', async () => {
      // Mock the controller response for validation error
      telemetryController.storeTelemetry.mockImplementation((req, res) => {
        res.status(400).json({
          success: false,
          message: 'Invalid telemetry data',
          errors: ['timestamp is required for all readings']
        });
      });

      // Test request with invalid data
      const response = await request(app)
        .post('/device123/telemetry')
        .send([
          { metric: 'heartRate', value: 72, unit: 'bpm' }, // Missing timestamp
          { timestamp: '2025-04-27T12:00:00Z', metric: 'bloodPressure', value: '120/80', unit: 'mmHg' }
        ]);

      // Assertions
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContain('timestamp is required for all readings');
      expect(telemetryController.storeTelemetry).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET /devices/:deviceId/telemetry', () => {
    it('should retrieve telemetry data for a device', async () => {
      // Mock the controller response
      telemetryController.getTelemetry.mockImplementation((req, res) => {
        res.status(200).json({
          success: true,
          deviceId: 'device123',
          data: [
            { timestamp: '2025-04-27T12:00:00Z', metric: 'heartRate', value: 72, unit: 'bpm' },
            { timestamp: '2025-04-27T12:00:00Z', metric: 'bloodPressure', value: '120/80', unit: 'mmHg' },
            { timestamp: '2025-04-27T12:00:00Z', metric: 'oxygenSaturation', value: 98, unit: '%' }
          ]
        });
      });

      // Test request
      const response = await request(app)
        .get('/device123/telemetry?range=24h');

      // Assertions
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.deviceId).toBe('device123');
      expect(response.body.data).toHaveLength(3);
      expect(telemetryController.getTelemetry).toHaveBeenCalledTimes(1);
    });
  });

  describe('POST /devices/:deviceId/healthkit', () => {
    it('should verify device token before storing HealthKit data', async () => {
      const authMiddleware = require('../middleware/authMiddleware');
      
      // Mock the controller response
      healthkitController.storeHealthKitData.mockImplementation((req, res) => {
        res.status(200).json({
          success: true,
          message: 'HealthKit data stored successfully',
          count: 1
        });
      });

      // Test request with valid token
      const response = await request(app)
        .post('/device123/healthkit')
        .set('Authorization', 'Bearer valid-device-token')
        .send({
          samples: [
            { type: 'HKQuantityTypeIdentifierHeartRate', value: 72, unit: 'count/min', startDate: '2025-04-27T12:00:00Z', endDate: '2025-04-27T12:00:01Z' }
          ]
        });

      // Verify middleware was called and request succeeded
      expect(authMiddleware.verifyDeviceToken).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });

    it('should return 401 when no device token is provided', async () => {
      // Test request without token
      const response = await request(app)
        .post('/device123/healthkit')
        .send({
          samples: [
            { type: 'HKQuantityTypeIdentifierHeartRate', value: 72, unit: 'count/min', startDate: '2025-04-27T12:00:00Z', endDate: '2025-04-27T12:00:01Z' }
          ]
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('No device token provided');
    });

    it('should return 403 when invalid device token is provided', async () => {
      // Test request with invalid token
      const response = await request(app)
        .post('/device123/healthkit')
        .set('Authorization', 'Bearer invalid-token')
        .send({
          samples: [
            { type: 'HKQuantityTypeIdentifierHeartRate', value: 72, unit: 'count/min', startDate: '2025-04-27T12:00:00Z', endDate: '2025-04-27T12:00:01Z' }
          ]
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Invalid device token');
    });

    it('should store HealthKit data and return success', async () => {
      // Mock the controller response
      healthkitController.storeHealthKitData.mockImplementation((req, res) => {
        res.status(200).json({
          success: true,
          message: 'HealthKit data stored successfully',
          count: 5
        });
      });

      // Test request
      const response = await request(app)
        .post('/device123/healthkit')
        .send({
          samples: [
            { type: 'HKQuantityTypeIdentifierHeartRate', value: 72, unit: 'count/min', startDate: '2025-04-27T12:00:00Z', endDate: '2025-04-27T12:00:01Z' },
            { type: 'HKQuantityTypeIdentifierStepCount', value: 8500, unit: 'count', startDate: '2025-04-27T00:00:00Z', endDate: '2025-04-27T23:59:59Z' }
          ]
        });

      // Assertions
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(5);
      expect(healthkitController.storeHealthKitData).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET /devices/:deviceId/healthkit', () => {
    it('should retrieve HealthKit data for a device', async () => {
      // Mock the controller response
      healthkitController.getHealthKitData.mockImplementation((req, res) => {
        res.status(200).json({
          success: true,
          deviceId: 'device123',
          data: [
            { type: 'HKQuantityTypeIdentifierHeartRate', value: 72, unit: 'count/min', startDate: '2025-04-27T12:00:00Z', endDate: '2025-04-27T12:00:01Z' },
            { type: 'HKQuantityTypeIdentifierStepCount', value: 8500, unit: 'count', startDate: '2025-04-27T00:00:00Z', endDate: '2025-04-27T23:59:59Z' }
          ]
        });
      });

      // Test request
      const response = await request(app)
        .get('/device123/healthkit?range=7d&type=HKQuantityTypeIdentifierHeartRate');

      // Assertions
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.deviceId).toBe('device123');
      expect(response.body.data).toHaveLength(2);
      expect(healthkitController.getHealthKitData).toHaveBeenCalledTimes(1);
    });
  });
});
