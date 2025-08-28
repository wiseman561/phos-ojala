const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const logger = require('winston');

// Require JWT secret from environment, no fallback permitted
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  logger.error('JWT_SECRET environment variable is not defined');
  throw new Error('Missing JWT_SECRET');
}

/**
 * Controller for device registration
 */
exports.registerDevice = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { deviceSerial, patientId, firmwareVersion } = req.body;
    if (!deviceSerial || !patientId || !firmwareVersion) {
      return res.status(400).json({
        error: 'Missing required fields: deviceSerial, patientId, firmwareVersion'
      });
    }

    const deviceId = `dev-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const token = jwt.sign(
      { deviceId, deviceSerial, patientId, type: 'device' },
      JWT_SECRET,
      { expiresIn: '1y' }
    );

    logger.info(`Device registered: ${deviceId} for patient ${patientId}`);

    return res.status(201).json({ deviceId, token, message: 'Device registered successfully' });
  } catch (error) {
    logger.error(`Error registering device: ${error.message}`);
    return res.status(500).json({ error: 'Failed to register device' });
  }
};

/**
 * Controller for recording telemetry data
 */
exports.recordTelemetry = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { deviceId } = req.params;
    const telemetryData = req.body;
    if (!Array.isArray(telemetryData)) {
      return res.status(400).json({ error: 'Telemetry data must be an array of measurements' });
    }

    for (const point of telemetryData) {
      if (!point.timestamp || !point.metric || point.value === undefined) {
        return res.status(400).json({ error: 'Each telemetry point must include timestamp, metric, and value' });
      }
    }

    logger.info(`Received telemetry from device ${deviceId}: ${telemetryData.length} points`);

    return res.status(200).json({ message: 'Telemetry data recorded successfully', pointsReceived: telemetryData.length });
  } catch (error) {
    logger.error(`Error recording telemetry: ${error.message}`);
    return res.status(500).json({ error: 'Failed to record telemetry data' });
  }
};

/**
 * Controller for retrieving telemetry data
 */
exports.getTelemetry = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { range = '24h', metrics } = req.query;
    if (!/^[0-9]+[hdwmy]$/.test(range)) {
      return res.status(400).json({ error: 'Invalid range format. Use formats like 24h, 7d, 4w, 6m, or 1y.' });
    }

    const mockData = {
      deviceId,
      range,
      metrics: metrics ? metrics.split(',') : ['heartRate', 'bloodPressure', 'temperature'],
      data: [
        { timestamp: new Date(Date.now() - 3600000).toISOString(), heartRate: 72, bloodPressure: '120/80', temperature: 36.6 },
        { timestamp: new Date(Date.now() - 7200000).toISOString(), heartRate: 75, bloodPressure: '122/82', temperature: 36.7 },
        { timestamp: new Date(Date.now() - 10800000).toISOString(), heartRate: 70, bloodPressure: '118/78', temperature: 36.5 }
      ]
    };

    logger.info(`Retrieved telemetry for device ${deviceId} with range ${range}`);

    return res.status(200).json(mockData);
  } catch (error) {
    logger.error(`Error retrieving telemetry: ${error.message}`);
    return res.status(500).json({ error: 'Failed to retrieve telemetry data' });
  }
};
