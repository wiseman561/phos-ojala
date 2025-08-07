const { InfluxDB, Point } = require('@influxdata/influxdb-client');
const axios = require('axios');
const cron = require('node-cron');
const dotenv = require('dotenv');
const winston = require('winston');

// Load environment variables
dotenv.config();

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'telemetry-processor' },
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// InfluxDB configuration
const INFLUX_URL = process.env.INFLUX_URL || 'http://influxdb:8086';
const INFLUX_TOKEN = process.env.INFLUX_TOKEN || 'phos-influxdb-token';
const INFLUX_ORG = process.env.INFLUX_ORG || 'phos';
const INFLUX_BUCKET = process.env.INFLUX_BUCKET || 'phos_telemetry';

// Nurse Assistant API configuration
const NURSE_ASSISTANT_URL = process.env.NURSE_ASSISTANT_URL || 'http://nurse-assistant:80';
const ALERTS_ENDPOINT = '/api/alerts';

// Create InfluxDB client
const influxClient = new InfluxDB({
  url: INFLUX_URL,
  token: INFLUX_TOKEN
});

// Create query API
const queryApi = influxClient.getQueryApi(INFLUX_ORG);

// Define threshold rules for different metrics
const thresholdRules = {
  heartRate: {
    min: 40,
    max: 120,
    criticalMin: 30,
    criticalMax: 150,
    unit: 'bpm'
  },
  bloodPressureSystolic: {
    min: 90,
    max: 140,
    criticalMin: 80,
    criticalMax: 180,
    unit: 'mmHg'
  },
  bloodPressureDiastolic: {
    min: 60,
    max: 90,
    criticalMin: 50,
    criticalMax: 110,
    unit: 'mmHg'
  },
  bloodGlucose: {
    min: 70,
    max: 180,
    criticalMin: 54,
    criticalMax: 250,
    unit: 'mg/dL'
  },
  oxygenSaturation: {
    min: 94,
    max: 100,
    criticalMin: 90,
    criticalMax: 100,
    unit: '%'
  },
  temperature: {
    min: 36.1,
    max: 37.8,
    criticalMin: 35.0,
    criticalMax: 39.0,
    unit: '°C'
  },
  respiratoryRate: {
    min: 12,
    max: 20,
    criticalMin: 8,
    criticalMax: 30,
    unit: 'breaths/min'
  },
  weight: {
    // Weight doesn't have critical thresholds, but we monitor significant changes
    changeThreshold: 2.0, // kg
    unit: 'kg'
  }
};

// Function to check if a value is outside normal range
function isOutsideNormalRange(metric, value) {
  const rule = thresholdRules[metric];
  if (!rule) return false;
  
  if (rule.min !== undefined && rule.max !== undefined) {
    return value < rule.min || value > rule.max;
  }
  
  return false;
}

// Function to check if a value is at critical level
function isCriticalLevel(metric, value) {
  const rule = thresholdRules[metric];
  if (!rule) return false;
  
  if (rule.criticalMin !== undefined && rule.criticalMax !== undefined) {
    return value < rule.criticalMin || value > rule.criticalMax;
  }
  
  return false;
}

// Function to get the severity level of a reading
function getSeverityLevel(metric, value) {
  if (isCriticalLevel(metric, value)) {
    return 'critical';
  } else if (isOutsideNormalRange(metric, value)) {
    return 'warning';
  }
  return 'normal';
}

// Function to send alert to Nurse Assistant service
async function sendAlert(alert) {
  try {
    const response = await axios.post(`${NURSE_ASSISTANT_URL}${ALERTS_ENDPOINT}`, alert);
    logger.info(`Alert sent successfully: ${JSON.stringify(alert)}`);
    return response.data;
  } catch (error) {
    logger.error(`Error sending alert: ${error.message}`);
    throw error;
  }
}

// Function to process telemetry data and check for alerts
async function processTelemetryData() {
  try {
    logger.info('Starting telemetry data processing');
    
    // Query the latest telemetry data from the last 5 minutes
    const query = `
      from(bucket: "${INFLUX_BUCKET}")
        |> range(start: -5m)
        |> filter(fn: (r) => r._field == "value" or r._field == "systolic" or r._field == "diastolic")
    `;
    
    const results = await queryApi.collectRows(query);
    logger.info(`Retrieved ${results.length} telemetry points for processing`);
    
    // Process each result and check against thresholds
    const alerts = [];
    
    for (const row of results) {
      const metric = row._measurement;
      const value = row._value;
      const patientId = row.patientId;
      const deviceId = row.deviceId;
      const timestamp = row._time;
      
      // Skip if no threshold rule exists for this metric
      if (!thresholdRules[metric]) continue;
      
      // Check severity level
      const severity = getSeverityLevel(metric, value);
      
      // If severity is warning or critical, create an alert
      if (severity !== 'normal') {
        const alert = {
          patientId,
          deviceId,
          metric,
          value,
          unit: thresholdRules[metric].unit || '',
          timestamp,
          severity,
          message: `${severity === 'critical' ? 'CRITICAL' : 'WARNING'}: ${metric} reading of ${value} ${thresholdRules[metric].unit || ''} is outside normal range for patient ${patientId}`
        };
        
        alerts.push(alert);
      }
    }
    
    // Send alerts to Nurse Assistant service
    if (alerts.length > 0) {
      logger.info(`Sending ${alerts.length} alerts to Nurse Assistant service`);
      for (const alert of alerts) {
        await sendAlert(alert);
      }
    } else {
      logger.info('No alerts to send');
    }
    
    logger.info('Telemetry data processing completed');
  } catch (error) {
    logger.error(`Error processing telemetry data: ${error.message}`);
  }
}

// Schedule the processor to run every minute
cron.schedule('* * * * *', async () => {
  logger.info('Running scheduled telemetry processing');
  await processTelemetryData();
});

// Initial run
logger.info('Starting Telemetry Processor Worker');
processTelemetryData();

// Keep the process running
process.on('SIGINT', () => {
  logger.info('Telemetry Processor Worker shutting down');
  process.exit(0);
});
