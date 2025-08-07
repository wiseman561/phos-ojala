const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { createLogger } = require('../../monitoring/logger');
const axios = require('axios');

// Initialize logger
const logger = createLogger('omics-analysis', {
  enableConsole: true,
  enableFile: true,
  enableCloudWatch: process.env.NODE_ENV === 'production'
});

// Service‑to‑service bearer token (injected via env; obvious placeholder otherwise)
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'SAMPLE_TOKEN';

/**
 * Analyze omics data files
 * @param {Array} omicsData - Array of omics file metadata
 * @param {string} analysisType - Type of analysis to perform
 * @param {Object} parameters - Additional parameters for the analysis
 * @returns {Promise<Object>} Analysis results
 */
async function analyzeOmicsData(omicsData, analysisType, parameters = {}) {
  try {
    logger.info('Starting omics data analysis', {
      analysisType,
      fileCount: omicsData.length,
      parameters
    });

    // Locate and read the files
    const fileContents = await Promise.all(
      omicsData.map(async (file) => {
        try {
          if (!fs.existsSync(file.filePath)) {
            logger.warn(`File not found: ${file.filePath}`);
            return null;
          }

          const content = await fs.promises.readFile(file.filePath, 'utf8');
          return {
            fileId: file.fileId,
            fileName: file.originalName,
            dataType: file.dataType,
            content,
            mimeType: file.mimeType
          };
        } catch (error) {
          logger.error(`Error reading file ${file.filePath}`, {
            error: error.message,
            fileId: file.fileId
          });
          return null;
        }
      })
    );

    // Filter out null entries (files that couldn't be read)
    const validFiles = fileContents.filter(file => file !== null);

    if (validFiles.length === 0) {
      throw new Error('No valid files could be read for analysis');
    }

    // Parse files based on their type
    const parsedData = validFiles.map(file => {
      try {
        if (file.mimeType === 'application/json') {
          return {
            ...file,
            parsedContent: JSON.parse(file.content)
          };
        } else if (file.mimeType === 'text/csv') {
          // Simple CSV parsing (in a real app, use a proper CSV parser)
          const lines = file.content.split('\n');
          const headers = lines[0].split(',');
          const rows = lines.slice(1).map(line => {
            const values = line.split(',');
            return headers.reduce((obj, header, index) => {
              obj[header.trim()] = values[index]?.trim() || '';
              return obj;
            }, {});
          });
          return {
            ...file,
            parsedContent: rows
          };
        } else {
          // For binary files, just note the file type
          return {
            ...file,
            parsedContent: null,
            isBinary: true
          };
        }
      } catch (error) {
        logger.error(`Error parsing file ${file.fileName}`, {
          error: error.message,
          fileId: file.fileId,
          mimeType: file.mimeType
        });
        return {
          ...file,
          parsedContent: null,
          parseError: error.message
        };
      }
    });

    // 1. Run Python models to get numeric metrics
    const modelResults = await runPythonModels(parsedData, analysisType, parameters);

    // 2. Generate LLM narrative insights using the chat endpoint
    const llmInsights = await generateLLMInsights(parsedData, modelResults, analysisType);

    // Combine results
    return {
      analysisType,
      timestamp: new Date().toISOString(),
      files: validFiles.map(f => ({
        fileId: f.fileId,
        fileName: f.fileName,
        dataType: f.dataType
      })),
      modelResults,
      llmInsights
    };
  } catch (error) {
    logger.error('Error analyzing omics data', {
      error: error.message,
      stack: error.stack,
      analysisType
    });
    throw error;
  }
}

/* ------------------------------------------------------------------
 * Python model runner (unchanged from previous version)
 * ----------------------------------------------------------------*/
async function runPythonModels(parsedData, analysisType, parameters) {
  try {
    logger.info('Running Python models for analysis', {
      analysisType,
      fileCount: parsedData.length
    });

    let scriptPath;
    const scriptArgs = [];

    switch (analysisType) {
      case 'risk_assessment':
        scriptPath = path.join(__dirname, 'risk_model.py');
        break;
      case 'medication_response':
        scriptPath = path.join(__dirname, 'health_score_model.py');
        break;
      case 'nutrition':
        scriptPath = path.join(__dirname, 'metrics.py');
        break;
      case 'condition_predisposition':
        scriptPath = path.join(__dirname, 'forecasting.py');
        break;
      default:
        throw new Error(`Unsupported analysis type: ${analysisType}`);
    }

    const tempDataFile = path.join('/tmp', `omics_data_${Date.now()}.json`);
    await fs.promises.writeFile(tempDataFile, JSON.stringify({ files: parsedData, parameters }));
    scriptArgs.push(tempDataFile);

    const results = await new Promise((resolve, reject) => {
      const p = spawn('python3', [scriptPath, ...scriptArgs]);
      let stdout = '';
      let stderr = '';
      p.stdout.on('data', d => (stdout += d.toString()));
      p.stderr.on('data', d => (stderr += d.toString()));
      p.on('close', code => {
        fs.unlink(tempDataFile, () => {});
        if (code !== 0) {
          logger.error('Python exited with code', { code, stderr });
          return reject(new Error(stderr));
        }
        try {
          resolve(JSON.parse(stdout));
        } catch (e) {
          reject(new Error(`Bad JSON from Python: ${e.message}`));
        }
      });
    });

    return results;
  } catch (error) {
    logger.error('Error running Python models', {
      error: error.message,
      stack: error.stack,
      analysisType
    });
    return { error: error.message, status: 'failed', metrics: [] };
  }
}

/* ------------------------------------------------------------------
 * LLM insight generator (header token fixed)
 * ----------------------------------------------------------------*/
async function generateLLMInsights(parsedData, modelResults, analysisType) {
  try {
    logger.info('Generating LLM narrative insights', {
      analysisType,
      modelResultsAvailable: !!modelResults
    });

    const dataSummary = parsedData
      .map(file => {
        if (file.isBinary) {
          return `Binary file: ${file.fileName} (${file.dataType})`;
        }
        if (file.parsedContent) {
          return `File: ${file.fileName} (${file.dataType}) - Contains ${Array.isArray(file.parsedContent) ? `${file.parsedContent.length} records` : 'structured data'}`;
        }
        return `File: ${file.fileName} (${file.dataType}) - Could not be parsed`;
      })
      .join('\n');

    let modelSummary = '';
    if (modelResults && !modelResults.error) {
      modelSummary = `Model analysis results for ${analysisType}:\n`;
      if (modelResults.metrics?.length) {
        modelSummary += modelResults.metrics.map(m => `- ${m.name}: ${m.value} ${m.unit || ''}`).join('\n');
      } else {
        modelSummary += 'No specific metrics available.';
      }
    } else {
      modelSummary = 'Model analysis did not produce valid results.';
    }

    const prompt = `You are an AI assistant specialized in analyzing omics data for healthcare purposes.\nPlease provide the top 5 insights based on the following omics data and analysis results:\n\nDATA SUMMARY:\n${dataSummary}\n\nMODEL RESULTS:\n${modelSummary}\n\nANALYSIS TYPE:\n${analysisType}\n\nPlease provide 5 key insights that would be valuable for healthcare professionals and the patient. Format your response as a list of insights, each with a brief explanation.`;

    try {
      const response = await axios.post(
        'http://localhost/api/ai/chat',
        {
          prompt,
          systemMessage: 'You are an AI assistant specialized in healthcare and omics data analysis. Provide clear, accurate, and helpful insights based on the provided data.',
          model: 'gpt-4',
          temperature: 0.3,
          maxTokens: 1500
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${INTERNAL_SERVICE_TOKEN}`
          }
        }
      );

      const aiResponse = response.data.response;
      const insights = [];
      const lines = aiResponse.split('\n');
      let current = null;
      for (const line of lines) {
        const t = line.trim();
        if (/^\d+\.\s+/.test(t)) {
          if (current) insights.push(current);
          current = { title: t.replace(/^\d+\.\s+/, ''), explanation: '' };
        } else if (current && t) {
          current.explanation += current.explanation ? '\n' + t : t;
        }
      }
      if (current) insights.push(current);

      return {
        insights: insights.length ? insights : [{ title: 'AI Analysis', explanation: aiResponse }],
        analysisType,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error calling chat endpoint', { error: error.message, stack: error.stack });
      return {
        insights: [
          { title: 'Error Generating AI Insights', explanation: error.message },
          { title: 'Data Summary', explanation: `Analysis performed on ${parsedData.length} files for ${analysisType}.` }
        ],
        analysisType,
        timestamp: new Date().toISOString()
      };
    }
  } catch (error) {
    logger.error('Error generating LLM insights', { error: error.message, stack: error.stack, analysisType });
    return {
      error: error.message,
      status: 'failed',
      insights: [{ title: 'Error Generating Insights', explanation: error.message }]
    };
  }
}

module.exports = { analyzeOmicsData };
