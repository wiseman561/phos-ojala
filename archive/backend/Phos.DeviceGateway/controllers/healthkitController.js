const express = require('express');
const { check, validationResult } = require('express-validator');
const influxdb = require('../config/influxdb');
const logger = require('winston');

// Controller for recording HealthKit data
exports.recordHealthKitData = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { deviceId } = req.params;
    const healthKitData = req.body;
    const patientId = req.device.patientId; // From the JWT token

    // Check if HealthKit data is provided and is an array
    if (!Array.isArray(healthKitData)) {
      return res.status(400).json({ 
        error: 'HealthKit data must be an array of measurements' 
      });
    }

    // Validate each HealthKit data point
    for (const point of healthKitData) {
      if (!point.timestamp || !point.type || point.value === undefined) {
        return res.status(400).json({ 
          error: 'Each HealthKit data point must include timestamp, type, and value' 
        });
      }
    }

    // Write HealthKit data to InfluxDB
    await influxdb.writeHealthKitData(deviceId, patientId, healthKitData);

    // Return success
    return res.status(200).json({
      message: 'HealthKit data recorded successfully',
      pointsReceived: healthKitData.length
    });
  } catch (error) {
    logger.error(`Error recording HealthKit data: ${error.message}`);
    return res.status(500).json({ error: 'Failed to record HealthKit data' });
  }
};

// Controller for retrieving HealthKit data
exports.getHealthKitData = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { range = '24h', types } = req.query;

    // Validate range format (simple validation)
    if (!range.match(/^\d+[hdwmy]$/)) {
      return res.status(400).json({ 
        error: 'Invalid range format. Use format like 24h, 7d, 4w, 6m, 1y' 
      });
    }

    // Parse types if provided
    const typesArray = types ? types.split(',') : [];

    // Query HealthKit data from InfluxDB
    const healthKitData = await influxdb.queryHealthKitData(deviceId, range, typesArray);

    // Format the response
    const response = {
      deviceId,
      range,
      types: typesArray.length > 0 ? typesArray : ['all'],
      count: healthKitData.length,
      data: healthKitData
    };

    logger.info(`Retrieved ${healthKitData.length} HealthKit data points for device ${deviceId} with range ${range}`);

    return res.status(200).json(response);
  } catch (error) {
    logger.error(`Error retrieving HealthKit data: ${error.message}`);
    return res.status(500).json({ error: 'Failed to retrieve HealthKit data' });
  }
};
