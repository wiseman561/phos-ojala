const express = require('express');
const { check, validationResult } = require('express-validator');
const influxdb = require('../config/influxdb');
const logger = require('winston');

// Controller for recording telemetry data
exports.recordTelemetry = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { deviceId } = req.params;
    const telemetryData = req.body;
    const patientId = req.device.patientId; // From the JWT token

    // Check if telemetry data is provided and is an array
    if (!Array.isArray(telemetryData)) {
      return res.status(400).json({ 
        error: 'Telemetry data must be an array of measurements' 
      });
    }

    // Validate each telemetry point
    for (const point of telemetryData) {
      if (!point.timestamp || !point.metric || point.value === undefined) {
        return res.status(400).json({ 
          error: 'Each telemetry point must include timestamp, metric, and value' 
        });
      }
    }

    // Write telemetry data to InfluxDB
    await influxdb.writeTelemetry(deviceId, patientId, telemetryData);

    // Return success
    return res.status(200).json({
      message: 'Telemetry data recorded successfully',
      pointsReceived: telemetryData.length
    });
  } catch (error) {
    logger.error(`Error recording telemetry: ${error.message}`);
    return res.status(500).json({ error: 'Failed to record telemetry data' });
  }
};

// Controller for retrieving telemetry data
exports.getTelemetry = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { range = '24h', metrics } = req.query;

    // Validate range format (simple validation)
    if (!range.match(/^\d+[hdwmy]$/)) {
      return res.status(400).json({ 
        error: 'Invalid range format. Use format like 24h, 7d, 4w, 6m, 1y' 
      });
    }

    // Parse metrics if provided
    const metricsArray = metrics ? metrics.split(',') : [];

    // Query telemetry data from InfluxDB
    const telemetryData = await influxdb.queryTelemetry(deviceId, range, metricsArray);

    // Format the response
    const response = {
      deviceId,
      range,
      metrics: metricsArray.length > 0 ? metricsArray : ['all'],
      count: telemetryData.length,
      data: telemetryData
    };

    logger.info(`Retrieved ${telemetryData.length} telemetry points for device ${deviceId} with range ${range}`);

    return res.status(200).json(response);
  } catch (error) {
    logger.error(`Error retrieving telemetry: ${error.message}`);
    return res.status(500).json({ error: 'Failed to retrieve telemetry data' });
  }
};
