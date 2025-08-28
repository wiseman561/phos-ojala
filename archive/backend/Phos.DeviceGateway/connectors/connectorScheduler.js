const cron = require('node-cron');
const logger = require('winston');
const vendorConnectors = require('./connectors/vendorConnectors');

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'vendor-connector-scheduler' },
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Mock patient-device mapping (in a real implementation, this would come from a database)
const patientDeviceMap = [
  { patientId: 'patient-001', deviceId: 'device-001', type: 'bpcuff' },
  { patientId: 'patient-001', deviceId: 'device-002', type: 'pulseox' },
  { patientId: 'patient-002', deviceId: 'device-003', type: 'cgm' },
  { patientId: 'patient-003', deviceId: 'device-004', type: 'scales' },
  { patientId: 'patient-003', deviceId: 'device-005', type: 'bpcuff' }
];

// Function to poll all BP Cuff devices
async function pollBPCuffDevices() {
  logger.info('Polling BP Cuff devices');
  const bpCuffDevices = patientDeviceMap.filter(device => device.type === 'bpcuff');
  
  for (const device of bpCuffDevices) {
    try {
      await vendorConnectors.fetchBPCuffData(device.patientId, device.deviceId);
    } catch (error) {
      logger.error(`Error polling BP Cuff device ${device.deviceId}: ${error.message}`);
    }
  }
}

// Function to poll all Pulse Ox devices
async function pollPulseOxDevices() {
  logger.info('Polling Pulse Ox devices');
  const pulseOxDevices = patientDeviceMap.filter(device => device.type === 'pulseox');
  
  for (const device of pulseOxDevices) {
    try {
      await vendorConnectors.fetchPulseOxData(device.patientId, device.deviceId);
    } catch (error) {
      logger.error(`Error polling Pulse Ox device ${device.deviceId}: ${error.message}`);
    }
  }
}

// Function to poll all CGM devices
async function pollCGMDevices() {
  logger.info('Polling CGM devices');
  const cgmDevices = patientDeviceMap.filter(device => device.type === 'cgm');
  
  for (const device of cgmDevices) {
    try {
      await vendorConnectors.fetchCGMData(device.patientId, device.deviceId);
    } catch (error) {
      logger.error(`Error polling CGM device ${device.deviceId}: ${error.message}`);
    }
  }
}

// Function to poll all Scales devices
async function pollScalesDevices() {
  logger.info('Polling Scales devices');
  const scalesDevices = patientDeviceMap.filter(device => device.type === 'scales');
  
  for (const device of scalesDevices) {
    try {
      await vendorConnectors.fetchScalesData(device.patientId, device.deviceId);
    } catch (error) {
      logger.error(`Error polling Scales device ${device.deviceId}: ${error.message}`);
    }
  }
}

// Schedule polling for each device type
// BP Cuff - every 5 minutes
cron.schedule('*/5 * * * *', pollBPCuffDevices);

// Pulse Ox - every 5 minutes
cron.schedule('*/5 * * * *', pollPulseOxDevices);

// CGM - every 15 minutes
cron.schedule('*/15 * * * *', pollCGMDevices);

// Scales - every hour
cron.schedule('0 * * * *', pollScalesDevices);

// Initial run on startup
logger.info('Starting vendor connector scheduler');
pollBPCuffDevices();
pollPulseOxDevices();
pollCGMDevices();
pollScalesDevices();

// Keep the process running
process.on('SIGINT', () => {
  logger.info('Vendor connector scheduler shutting down');
  process.exit(0);
});
