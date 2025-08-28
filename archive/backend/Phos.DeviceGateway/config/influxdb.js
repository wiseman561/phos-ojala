const { InfluxDB, Point } = require('@influxdata/influxdb-client');
const logger = require('winston');

// InfluxDB configuration
const INFLUX_URL = process.env.INFLUX_URL || 'http://influxdb:8086';
const INFLUX_TOKEN = process.env.INFLUX_TOKEN || 'phos-influxdb-token';
const INFLUX_ORG = process.env.INFLUX_ORG || 'phos';
const INFLUX_BUCKET = process.env.INFLUX_BUCKET || 'phos_telemetry';

// Create InfluxDB client
const influxClient = new InfluxDB({
  url: INFLUX_URL,
  token: INFLUX_TOKEN
});

// Create write API
const writeApi = influxClient.getWriteApi(INFLUX_ORG, INFLUX_BUCKET, 'ns');

// Create query API
const queryApi = influxClient.getQueryApi(INFLUX_ORG);

// Function to write telemetry data to InfluxDB
exports.writeTelemetry = async (deviceId, patientId, telemetryData) => {
  try {
    // Process each telemetry point
    for (const point of telemetryData) {
      const { timestamp, metric, value, unit = '', tags = {} } = point;
      
      // Create a new point
      const influxPoint = new Point(metric)
        .tag('deviceId', deviceId)
        .tag('patientId', patientId)
        .tag('unit', unit);
      
      // Add any additional tags
      for (const [key, value] of Object.entries(tags)) {
        influxPoint.tag(key, value);
      }
      
      // Add value - handle different types
      if (typeof value === 'number') {
        influxPoint.floatField('value', value);
      } else if (typeof value === 'string' && value.includes('/')) {
        // Handle blood pressure format (e.g., "120/80")
        const [systolic, diastolic] = value.split('/').map(v => parseFloat(v));
        influxPoint.floatField('systolic', systolic);
        influxPoint.floatField('diastolic', diastolic);
      } else {
        influxPoint.stringField('value', value.toString());
      }
      
      // Set timestamp
      influxPoint.timestamp(new Date(timestamp));
      
      // Write to InfluxDB
      writeApi.writePoint(influxPoint);
    }
    
    // Flush the write API
    await writeApi.flush();
    
    logger.info(`Wrote ${telemetryData.length} points to InfluxDB for device ${deviceId}`);
    return true;
  } catch (error) {
    logger.error(`Error writing to InfluxDB: ${error.message}`);
    throw error;
  }
};

// Function to write HealthKit data to InfluxDB
exports.writeHealthKitData = async (deviceId, patientId, healthKitData) => {
  try {
    // Process each HealthKit data point
    for (const point of healthKitData) {
      const { 
        timestamp, 
        type, 
        value, 
        unit = '', 
        source = 'HealthKit',
        metadata = {} 
      } = point;
      
      // Create a new point
      const influxPoint = new Point('healthkit')
        .tag('deviceId', deviceId)
        .tag('patientId', patientId)
        .tag('type', type)
        .tag('unit', unit)
        .tag('source', source);
      
      // Add any additional metadata as tags
      for (const [key, value] of Object.entries(metadata)) {
        if (typeof value === 'string' || typeof value === 'number') {
          influxPoint.tag(key, value.toString());
        }
      }
      
      // Add value - handle different types
      if (typeof value === 'number') {
        influxPoint.floatField('value', value);
      } else {
        influxPoint.stringField('value', value.toString());
      }
      
      // Set timestamp
      influxPoint.timestamp(new Date(timestamp));
      
      // Write to InfluxDB
      writeApi.writePoint(influxPoint);
    }
    
    // Flush the write API
    await writeApi.flush();
    
    logger.info(`Wrote ${healthKitData.length} HealthKit points to InfluxDB for device ${deviceId}`);
    return true;
  } catch (error) {
    logger.error(`Error writing HealthKit data to InfluxDB: ${error.message}`);
    throw error;
  }
};

// Function to query telemetry data from InfluxDB
exports.queryTelemetry = async (deviceId, range, metrics = []) => {
  try {
    // Build the Flux query
    let query = `
      from(bucket: "${INFLUX_BUCKET}")
        |> range(start: -${range})
        |> filter(fn: (r) => r.deviceId == "${deviceId}")
    `;
    
    // Add metric filter if specified
    if (metrics.length > 0) {
      const metricsString = metrics.map(m => `"${m}"`).join(', ');
      query += `|> filter(fn: (r) => contains(value: r._measurement, set: [${metricsString}]))`;
    }
    
    // Complete the query
    query += `
      |> sort(columns: ["_time"], desc: false)
      |> yield(name: "results")
    `;
    
    // Execute the query
    const results = await queryApi.collectRows(query);
    
    // Transform the results into a more usable format
    const transformedResults = results.map(row => ({
      timestamp: row._time,
      metric: row._measurement,
      value: row._field === 'value' ? row._value : 
             (row._field === 'systolic' ? `${row._value}/${row.diastolic}` : row._value),
      unit: row.unit || '',
      deviceId: row.deviceId,
      patientId: row.patientId
    }));
    
    logger.info(`Retrieved ${transformedResults.length} telemetry points for device ${deviceId}`);
    return transformedResults;
  } catch (error) {
    logger.error(`Error querying InfluxDB: ${error.message}`);
    throw error;
  }
};

// Function to query HealthKit data from InfluxDB
exports.queryHealthKitData = async (deviceId, range, types = []) => {
  try {
    // Build the Flux query
    let query = `
      from(bucket: "${INFLUX_BUCKET}")
        |> range(start: -${range})
        |> filter(fn: (r) => r._measurement == "healthkit")
        |> filter(fn: (r) => r.deviceId == "${deviceId}")
    `;
    
    // Add type filter if specified
    if (types.length > 0) {
      const typesString = types.map(t => `"${t}"`).join(', ');
      query += `|> filter(fn: (r) => contains(value: r.type, set: [${typesString}]))`;
    }
    
    // Complete the query
    query += `
      |> sort(columns: ["_time"], desc: false)
      |> yield(name: "results")
    `;
    
    // Execute the query
    const results = await queryApi.collectRows(query);
    
    // Transform the results into a more usable format
    const transformedResults = results.map(row => ({
      timestamp: row._time,
      type: row.type,
      value: row._value,
      unit: row.unit || '',
      source: row.source || 'HealthKit',
      deviceId: row.deviceId,
      patientId: row.patientId
    }));
    
    logger.info(`Retrieved ${transformedResults.length} HealthKit points for device ${deviceId}`);
    return transformedResults;
  } catch (error) {
    logger.error(`Error querying HealthKit data from InfluxDB: ${error.message}`);
    throw error;
  }
};

// Function to get the latest telemetry values for a patient
exports.getLatestTelemetry = async (patientId) => {
  try {
    // Build the Flux query to get the latest value for each metric
    const query = `
      from(bucket: "${INFLUX_BUCKET}")
        |> range(start: -24h)
        |> filter(fn: (r) => r.patientId == "${patientId}")
        |> group(columns: ["_measurement"])
        |> last()
        |> yield(name: "results")
    `;
    
    // Execute the query
    const results = await queryApi.collectRows(query);
    
    // Transform the results into a more usable format
    const transformedResults = results.map(row => ({
      timestamp: row._time,
      metric: row._measurement,
      value: row._field === 'value' ? row._value : 
             (row._field === 'systolic' ? `${row._value}/${row.diastolic}` : row._value),
      unit: row.unit || '',
      deviceId: row.deviceId,
      patientId: row.patientId
    }));
    
    logger.info(`Retrieved ${transformedResults.length} latest telemetry points for patient ${patientId}`);
    return transformedResults;
  } catch (error) {
    logger.error(`Error querying latest telemetry from InfluxDB: ${error.message}`);
    throw error;
  }
};

// Function to get telemetry data for a cohort of patients
exports.getCohortTelemetry = async (patientIds, metrics = []) => {
  try {
    // Build the patient filter
    const patientFilter = patientIds.map(id => `r.patientId == "${id}"`).join(' or ');
    
    // Build the Flux query
    let query = `
      from(bucket: "${INFLUX_BUCKET}")
        |> range(start: -24h)
        |> filter(fn: (r) => ${patientFilter})
    `;
    
    // Add metric filter if specified
    if (metrics.length > 0) {
      const metricsString = metrics.map(m => `"${m}"`).join(', ');
      query += `|> filter(fn: (r) => contains(value: r._measurement, set: [${metricsString}]))`;
    }
    
    // Complete the query to get the latest value for each patient and metric
    query += `
      |> group(columns: ["patientId", "_measurement"])
      |> last()
      |> yield(name: "results")
    `;
    
    // Execute the query
    const results = await queryApi.collectRows(query);
    
    // Transform the results into a more usable format
    const transformedResults = results.map(row => ({
      timestamp: row._time,
      metric: row._measurement,
      value: row._field === 'value' ? row._value : 
             (row._field === 'systolic' ? `${row._value}/${row.diastolic}` : row._value),
      unit: row.unit || '',
      deviceId: row.deviceId,
      patientId: row.patientId
    }));
    
    // Group by patient ID
    const groupedByPatient = {};
    for (const result of transformedResults) {
      if (!groupedByPatient[result.patientId]) {
        groupedByPatient[result.patientId] = [];
      }
      groupedByPatient[result.patientId].push(result);
    }
    
    logger.info(`Retrieved telemetry for ${Object.keys(groupedByPatient).length} patients in cohort`);
    return groupedByPatient;
  } catch (error) {
    logger.error(`Error querying cohort telemetry from InfluxDB: ${error.message}`);
    throw error;
  }
};
