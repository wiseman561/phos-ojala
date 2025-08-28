const express = require('express');
const router = express.Router();
const axios = require('axios');
const logger = require('winston');

// Ensure required static environment variables
const DEVICE_GATEWAY_URL = process.env.DEVICE_GATEWAY_URL;
if (!DEVICE_GATEWAY_URL) {
  logger.error('DEVICE_GATEWAY_URL environment variable is missing');
  throw new Error('Missing DEVICE_GATEWAY_URL');
}

// Vendor API configurations from environment variables
const VENDOR_CONFIGS = {
  bpcuff: {
    apiUrl: process.env.BP_CUFF_API_URL,
    apiKey: process.env.BP_CUFF_API_KEY,
    pollInterval: 5 * 60 * 1000
  },
  pulseox: {
    apiUrl: process.env.PULSE_OX_API_URL,
    apiKey: process.env.PULSE_OX_API_KEY,
    pollInterval: 5 * 60 * 1000
  },
  cgm: {
    apiUrl: process.env.CGM_API_URL,
    apiKey: process.env.CGM_API_KEY,
    pollInterval: 15 * 60 * 1000
  },
  scales: {
    apiUrl: process.env.SCALES_API_URL,
    apiKey: process.env.SCALES_API_KEY,
    pollInterval: 60 * 60 * 1000
  }
};
// Validate vendor configs
for (const [vendor, cfg] of Object.entries(VENDOR_CONFIGS)) {
  if (!cfg.apiUrl || !cfg.apiKey) {
    logger.error(`Missing API configuration for ${vendor}`);
    throw new Error(`Missing configuration for ${vendor}`);
  }
}

// Fetch functions for each vendor
async function fetchBPCuffData(patientId, deviceId) { /* unchanged */ }
async function fetchPulseOxData(patientId, deviceId) { /* unchanged */ }
async function fetchCGMData(patientId, deviceId) { /* unchanged */ }
async function fetchScalesData(patientId, deviceId) { /* unchanged */ }

// Function to send telemetry data to device gateway
async function sendToDeviceGateway(deviceId, telemetryData) {
  // Construct dynamic env var name
  const tokenVar = `DEVICE_${deviceId}_TOKEN`;
  const deviceToken = process.env[tokenVar];
  if (!deviceToken) {
    logger.error(`Environment variable ${tokenVar} is not defined`);
    throw new Error(`Missing device token for ${deviceId}`);
  }
  try {
    await axios.post(
      `${DEVICE_GATEWAY_URL}/devices/${deviceId}/telemetry`,
      telemetryData,
      {
        headers: {
          'Authorization': `Bearer ${deviceToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return true;
  } catch (error) {
    logger.error(`Error sending data to device gateway: ${error.message}`);
    throw error;
  }
}

module.exports = {
  fetchBPCuffData,
  fetchPulseOxData,
  fetchCGMData,
  fetchScalesData,
  sendToDeviceGateway
};
