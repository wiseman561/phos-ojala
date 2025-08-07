const express = require('express');
const router = express.Router();
const { InfluxDB, Point } = require('@influxdata/influxdb-client');
const { OpenAI } = require('openai');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const logger = require('winston');

// Configure OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'sk-demo-key'
});

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

// Create query API
const queryApi = influxClient.getQueryApi(INFLUX_ORG);

// Analyze telemetry data
router.post('/telemetry/analyze', async (req, res) => {
  try {
    const { deviceId, range = '24h' } = req.body;
    
    if (!deviceId) {
      return res.status(400).json({ error: 'Device ID is required' });
    }
    
    // Validate range format
    if (!range.match(/^\d+[hdwmy]$/)) {
      return res.status(400).json({ 
        error: 'Invalid range format. Use format like 24h, 7d, 4w, 6m, 1y' 
      });
    }
    
    // Query telemetry data from InfluxDB
    const telemetryData = await queryTelemetryData(deviceId, range);
    
    if (telemetryData.length === 0) {
      return res.status(404).json({ 
        error: 'No telemetry data found for the specified device and time range' 
      });
    }
    
    // Run data through Python models
    const modelResults = await runPythonModels(telemetryData);
    
    // Generate narrative insights using OpenAI
    const narrativeInsights = await generateNarrativeInsights(telemetryData, modelResults);
    
    // Combine results
    const analysisResults = {
      deviceId,
      range,
      timestamp: new Date().toISOString(),
      dataPoints: telemetryData.length,
      metrics: [...new Set(telemetryData.map(point => point.metric))],
      modelResults,
      narrativeInsights
    };
    
    return res.status(200).json(analysisResults);
  } catch (error) {
    logger.error(`Error analyzing telemetry data: ${error.message}`);
    return res.status(500).json({ error: 'Failed to analyze telemetry data' });
  }
});

// Analyze HealthKit data
router.post('/healthkit/analyze', async (req, res) => {
  try {
    const { deviceId, range = '24h' } = req.body;
    
    if (!deviceId) {
      return res.status(400).json({ error: 'Device ID is required' });
    }
    
    // Validate range format
    if (!range.match(/^\d+[hdwmy]$/)) {
      return res.status(400).json({ 
        error: 'Invalid range format. Use format like 24h, 7d, 4w, 6m, 1y' 
      });
    }
    
    // Query HealthKit data from InfluxDB
    const healthKitData = await queryHealthKitData(deviceId, range);
    
    if (healthKitData.length === 0) {
      return res.status(404).json({ 
        error: 'No HealthKit data found for the specified device and time range' 
      });
    }
    
    // Run data through Python models
    const modelResults = await runPythonModels(healthKitData);
    
    // Generate narrative insights using OpenAI
    const narrativeInsights = await generateNarrativeInsights(healthKitData, modelResults);
    
    // Combine results
    const analysisResults = {
      deviceId,
      range,
      timestamp: new Date().toISOString(),
      dataPoints: healthKitData.length,
      metrics: [...new Set(healthKitData.map(point => point.type))],
      modelResults,
      narrativeInsights
    };
    
    return res.status(200).json(analysisResults);
  } catch (error) {
    logger.error(`Error analyzing HealthKit data: ${error.message}`);
    return res.status(500).json({ error: 'Failed to analyze HealthKit data' });
  }
});

// Query telemetry data from InfluxDB
async function queryTelemetryData(deviceId, range) {
  try {
    // Build the Flux query
    const query = `
      from(bucket: "${INFLUX_BUCKET}")
        |> range(start: -${range})
        |> filter(fn: (r) => r.deviceId == "${deviceId}")
        |> filter(fn: (r) => r._measurement != "healthkit")
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
    logger.error(`Error querying telemetry data from InfluxDB: ${error.message}`);
    throw error;
  }
}

// Query HealthKit data from InfluxDB
async function queryHealthKitData(deviceId, range) {
  try {
    // Build the Flux query
    const query = `
      from(bucket: "${INFLUX_BUCKET}")
        |> range(start: -${range})
        |> filter(fn: (r) => r.deviceId == "${deviceId}")
        |> filter(fn: (r) => r._measurement == "healthkit")
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
}

// Run data through Python models
async function runPythonModels(data) {
  try {
    // Create a temporary file to store the data
    const tempDataFile = path.join('/tmp', `data_${Date.now()}.json`);
    fs.writeFileSync(tempDataFile, JSON.stringify(data));
    
    // Results object to store all model outputs
    const results = {};
    
    // Run health score model
    const healthScoreResult = await runPythonModel('health_score_model.py', tempDataFile);
    results.healthScore = healthScoreResult;
    
    // Run risk model
    const riskModelResult = await runPythonModel('risk_model.py', tempDataFile);
    results.riskFactors = riskModelResult;
    
    // Run forecasting model
    const forecastingResult = await runPythonModel('forecasting.py', tempDataFile);
    results.forecasts = forecastingResult;
    
    // Clean up temporary file
    fs.unlinkSync(tempDataFile);
    
    return results;
  } catch (error) {
    logger.error(`Error running Python models: ${error.message}`);
    throw error;
  }
}

// Run a specific Python model
async function runPythonModel(modelScript, dataFile) {
  return new Promise((resolve, reject) => {
    const modelPath = path.join(process.cwd(), 'models', modelScript);
    
    // Check if model exists
    if (!fs.existsSync(modelPath)) {
      // Return mock data if model doesn't exist (for development)
      if (modelScript === 'health_score_model.py') {
        return resolve({
          overallScore: 78,
          categories: {
            cardiovascular: 82,
            metabolic: 75,
            respiratory: 80,
            activity: 70
          }
        });
      } else if (modelScript === 'risk_model.py') {
        return resolve({
          highRiskFactors: ['sedentary lifestyle'],
          mediumRiskFactors: ['elevated blood pressure'],
          lowRiskFactors: ['occasional elevated heart rate'],
          riskScore: 35
        });
      } else if (modelScript === 'forecasting.py') {
        return resolve({
          trends: {
            bloodPressure: 'stable',
            heartRate: 'improving',
            activity: 'declining'
          },
          predictions: {
            nextMonth: {
              healthScore: 'likely to improve by 3-5 points',
              keyMetrics: ['expect blood pressure to stabilize']
            }
          }
        });
      }
    }
    
    // Spawn Python process
    const pythonProcess = spawn('python3', [modelPath, dataFile]);
    
    let output = '';
    let errorOutput = '';
    
    // Collect output
    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    // Collect error output
    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    // Handle process completion
    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        logger.error(`Python model ${modelScript} exited with code ${code}: ${errorOutput}`);
        reject(new Error(`Model execution failed: ${errorOutput}`));
      } else {
        try {
          const result = JSON.parse(output);
          resolve(result);
        } catch (error) {
          reject(new Error(`Failed to parse model output: ${error.message}`));
        }
      }
    });
  });
}

// Generate narrative insights using OpenAI
async function generateNarrativeInsights(data, modelResults) {
  try {
    // Prepare a summary of the data and model results
    const dataSummary = summarizeData(data);
    const modelSummary = JSON.stringify(modelResults, null, 2);
    
    // Create a prompt for OpenAI
    const prompt = `
      You are a healthcare AI assistant analyzing patient health data. Based on the following data summary and model results, provide 5 key insights about the patient's health status, trends, and recommendations. Focus on actionable information and clear explanations.
      
      Data Summary:
      ${dataSummary}
      
      Model Results:
      ${modelSummary}
      
      Please provide 5 key insights in a structured format with headings and brief explanations. Be specific, clear, and actionable.
    `;
    
    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are a healthcare AI assistant that analyzes patient health data and provides clear, actionable insights." },
        { role: "user", content: prompt }
      ],
      max_tokens: 1000,
      temperature: 0.5,
    });
    
    // Extract and return the narrative insights
    const narrativeInsights = response.choices[0].message.content;
    return narrativeInsights;
  } catch (error) {
    logger.error(`Error generating narrative insights: ${error.message}`);
    // Return a fallback message if OpenAI fails
    return "Unable to generate narrative insights at this time. Please review the numeric data and model results for health information.";
  }
}

// Summarize data for the OpenAI prompt
function summarizeData(data) {
  // Group data by metric/type
  const groupedData = {};
  
  data.forEach(point => {
    const metricName = point.metric || point.type;
    if (!groupedData[metricName]) {
      groupedData[metricName] = [];
    }
    groupedData[metricName].push(point);
  });
  
  // Create summary for each metric
  let summary = '';
  
  for (const [metric, points] of Object.entries(groupedData)) {
    // Sort points by timestamp
    points.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    // Calculate basic statistics
    const values = points.map(p => {
      if (typeof p.value === 'string' && p.value.includes('/')) {
        // Handle blood pressure format (e.g., "120/80")
        const [systolic, diastolic] = p.value.split('/').map(v => parseFloat(v));
        return systolic; // Just use systolic for statistics
      }
      return typeof p.value === 'number' ? p.value : parseFloat(p.value);
    }).filter(v => !isNaN(v));
    
    if (values.length > 0) {
      const min = Math.min(...values);
      const max = Math.max(...values);
      const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
      const latest = values[values.length - 1];
      const unit = points[0].unit || '';
      
      summary += `${metric}: ${points.length} readings, range ${min}-${max}${unit}, avg ${avg.toFixed(1)}${unit}, latest ${latest}${unit}\n`;
    }
  }
  
  return summary;
}

module.exports = router;
