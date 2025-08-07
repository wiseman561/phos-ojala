// Update the omics.js file to use the new omics-analysis module
const express = require('express');
const router = express.Router();
const { authenticateToken, checkRole } = require('../../frontend/employer-dashboard/src/auth');
const { createLogger } = require('../../monitoring/logger');
const metrics = require('../../monitoring/metrics');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { analyzeOmicsData } = require('./omics-analysis');

// Initialize logger
const logger = createLogger('omics-integration', {
  enableConsole: true,
  enableFile: true,
  enableCloudWatch: process.env.NODE_ENV === 'production'
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.OMICS_UPLOAD_DIR || '/tmp/omics-uploads';
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    // Create tenant-specific directory
    const tenantDir = path.join(uploadDir, req.tenant?.id || 'default');
    if (!fs.existsSync(tenantDir)) {
      fs.mkdirSync(tenantDir, { recursive: true });
    }
    
    cb(null, tenantDir);
  },
  filename: (req, file, cb) => {
    // Generate a secure filename
    const fileId = uuidv4();
    const fileExt = path.extname(file.originalname);
    const filename = `${fileId}${fileExt}`;
    
    cb(null, filename);
  }
});

// Configure file filter to only allow specific file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/json',
    'text/csv',
    'text/plain',
    'application/zip',
    'application/x-gzip',
    'application/octet-stream'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JSON, CSV, TXT, ZIP, GZIP, and binary files are allowed.'), false);
  }
};

// Configure upload limits
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100 MB
    files: 5
  }
});

/**
 * @swagger
 * /api/omics/upload:
 *   post:
 *     summary: Upload omics data files
 *     description: Upload genomic or microbiome data files for a patient
 *     tags: [Omics]
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: files
 *         type: file
 *         description: Omics data files to upload
 *       - in: formData
 *         name: patientId
 *         type: string
 *         required: true
 *         description: Patient ID
 *       - in: formData
 *         name: dataType
 *         type: string
 *         required: true
 *         enum: [genomic, microbiome, metabolomic, other]
 *         description: Type of omics data
 *       - in: formData
 *         name: source
 *         type: string
 *         required: true
 *         description: Source of the data (e.g., 23andMe, Viome)
 *       - in: formData
 *         name: description
 *         type: string
 *         description: Additional description of the data
 *     responses:
 *       200:
 *         description: Files uploaded successfully
 *       400:
 *         description: Invalid request parameters
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       403:
 *         description: Forbidden - insufficient permissions
 *       413:
 *         description: Payload too large
 *       500:
 *         description: Server error
 */
router.post(
  '/upload',
  authenticateToken,
  checkRole(['clinician', 'researcher']),
  (req, res) => {
    // Use multer upload middleware
    upload.array('files', 5)(req, res, async (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({
            error: 'File too large',
            message: 'Maximum file size is 100 MB'
          });
        }
        
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({
            error: 'Too many files',
            message: 'Maximum 5 files can be uploaded at once'
          });
        }
        
        return res.status(400).json({
          error: 'Upload error',
          message: err.message
        });
      }
      
      try {
        const { patientId, dataType, source, description } = req.body;
        
        if (!patientId || !dataType || !source) {
          // Clean up uploaded files
          if (req.files) {
            req.files.forEach(file => {
              fs.unlinkSync(file.path);
            });
          }
          
          return res.status(400).json({
            error: 'Missing required parameters',
            message: 'Patient ID, data type, and source are required'
          });
        }
        
        if (!req.files || req.files.length === 0) {
          return res.status(400).json({
            error: 'No files uploaded',
            message: 'At least one file must be uploaded'
          });
        }
        
        // Process uploaded files
        const uploadedFiles = await processOmicsFiles(req.files, {
          patientId,
          dataType,
          source,
          description,
          userId: req.user.id,
          tenantId: req.tenant?.id || 'default'
        });
        
        // Record metrics
        metrics.recordApiRequest('POST', '/api/omics/upload', 200, Date.now() - req.startTime);
        metrics.incrementCounter('omics_files_uploaded', uploadedFiles.length);
        
        return res.status(200).json({
          message: 'Files uploaded successfully',
          files: uploadedFiles
        });
      } catch (error) {
        logger.error('Error processing omics files', {
          error: error.message,
          stack: error.stack,
          patientId: req.body.patientId,
          userId: req.user.id
        });
        
        // Clean up uploaded files
        if (req.files) {
          req.files.forEach(file => {
            try {
              fs.unlinkSync(file.path);
            } catch (unlinkError) {
              logger.error('Error deleting file after failed processing', {
                error: unlinkError.message,
                filePath: file.path
              });
            }
          });
        }
        
        return res.status(500).json({
          error: 'Failed to process omics files',
          message: error.message
        });
      }
    });
  }
);

/**
 * @swagger
 * /api/omics/patient/{patientId}:
 *   get:
 *     summary: Get omics data for a patient
 *     description: Retrieves metadata for all omics data files associated with a patient
 *     tags: [Omics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         schema:
 *           type: string
 *         required: true
 *         description: Patient ID
 *       - in: query
 *         name: dataType
 *         schema:
 *           type: string
 *           enum: [genomic, microbiome, metabolomic, other]
 *         required: false
 *         description: Filter by data type
 *     responses:
 *       200:
 *         description: Omics data retrieved successfully
 *       400:
 *         description: Invalid request parameters
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: No omics data found for the patient
 *       500:
 *         description: Server error
 */
router.get(
  '/patient/:patientId',
  authenticateToken,
  checkRole(['clinician', 'researcher']),
  async (req, res) => {
    try {
      const { patientId } = req.params;
      const { dataType } = req.query;
      
      if (!patientId) {
        return res.status(400).json({
          error: 'Missing required parameter',
          message: 'Patient ID is required'
        });
      }
      
      // Get omics data for patient
      const omicsData = await getPatientOmicsData(patientId, {
        dataType,
        tenantId: req.tenant?.id || 'default'
      });
      
      if (!omicsData || omicsData.length === 0) {
        return res.status(404).json({
          error: 'No omics data found',
          message: 'No omics data found for the specified patient'
        });
      }
      
      // Record metrics
      metrics.recordApiRequest('GET', '/api/omics/patient/:patientId', 200, Date.now() - req.startTime);
      
      return res.status(200).json({
        patientId,
        omicsData
      });
    } catch (error) {
      logger.error('Error retrieving patient omics data', {
        error: error.message,
        stack: error.stack,
        patientId: req.params.patientId,
        userId: req.user.id
      });
      
      return res.status(500).json({
        error: 'Failed to retrieve omics data',
        message: error.message
      });
    }
  }
);

/**
 * @swagger
 * /api/omics/file/{fileId}:
 *   get:
 *     summary: Get omics file
 *     description: Retrieves a specific omics data file
 *     tags: [Omics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         schema:
 *           type: string
 *         required: true
 *         description: File ID
 *     responses:
 *       200:
 *         description: File retrieved successfully
 *       400:
 *         description: Invalid request parameters
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: File not found
 *       500:
 *         description: Server error
 */
router.get(
  '/file/:fileId',
  authenticateToken,
  checkRole(['clinician', 'researcher']),
  async (req, res) => {
    try {
      const { fileId } = req.params;
      
      if (!fileId) {
        return res.status(400).json({
          error: 'Missing required parameter',
          message: 'File ID is required'
        });
      }
      
      // Get file metadata
      const fileMetadata = await getOmicsFileMetadata(fileId, {
        tenantId: req.tenant?.id || 'default'
      });
      
      if (!fileMetadata) {
        return res.status(404).json({
          error: 'File not found',
          message: 'The specified file was not found'
        });
      }
      
      // Check if file exists
      if (!fs.existsSync(fileMetadata.filePath)) {
        return res.status(404).json({
          error: 'File not found',
          message: 'The physical file was not found on the server'
        });
      }
      
      // Record metrics
      metrics.recordApiRequest('GET', '/api/omics/file/:fileId', 200, Date.now() - req.startTime);
      
      // Send file
      return res.download(fileMetadata.filePath, fileMetadata.originalName);
    } catch (error) {
      logger.error('Error retrieving omics file', {
        error: error.message,
        stack: error.stack,
        fileId: req.params.fileId,
        userId: req.user.id
      });
      
      return res.status(500).json({
        error: 'Failed to retrieve omics file',
        message: error.message
      });
    }
  }
);

/**
 * @swagger
 * /api/omics/analyze:
 *   post:
 *     summary: Analyze omics data
 *     description: Performs analysis on omics data for a patient
 *     tags: [Omics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - patientId
 *               - analysisType
 *             properties:
 *               patientId:
 *                 type: string
 *                 description: Patient ID
 *               fileIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Specific file IDs to analyze (optional)
 *               analysisType:
 *                 type: string
 *                 enum: [risk_assessment, medication_response, nutrition, condition_predisposition]
 *                 description: Type of analysis to perform
 *               parameters:
 *                 type: object
 *                 description: Additional parameters for the analysis
 *     responses:
 *       200:
 *         description: Analysis completed successfully
 *       202:
 *         description: Analysis started (for long-running analyses)
 *       400:
 *         description: Invalid request parameters
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: No omics data found for the patient
 *       500:
 *         description: Server error
 */
router.post(
  '/analyze',
  authenticateToken,
  checkRole(['clinician', 'researcher']),
  async (req, res) => {
    try {
      const { patientId, fileIds, analysisType, parameters } = req.body;
      
      if (!patientId || !analysisType) {
        return res.status(400).json({
          error: 'Missing required parameters',
          message: 'Patient ID and analysis type are required'
        });
      }
      
      // Validate analysis type
      const validAnalysisTypes = ['risk_assessment', 'medication_response', 'nutrition', 'condition_predisposition'];
      if (!validAnalysisTypes.includes(analysisType)) {
        return res.status(400).json({
          error: 'Invalid analysis type',
          message: `Analysis type must be one of: ${validAnalysisTypes.join(', ')}`
        });
      }
      
      // Get omics data for patient
      let omicsData;
      if (fileIds && fileIds.length > 0) {
        // Get specific files
        omicsData = await getOmicsFilesByIds(fileIds, {
          tenantId: req.tenant?.id || 'default'
        });
      } else {
        // Get all files for patient
        omicsData = await getPatientOmicsData(patientId, {
          tenantId: req.tenant?.id || 'default'
        });
      }
      
      if (!omicsData || omicsData.length === 0) {
        return res.status(404).json({
          error: 'No omics data found',
          message: 'No omics data found for the specified patient or file IDs'
        });
      }
      
      // Perform analysis using the new analyzeOmicsData function
      const analysisResults = await analyzeOmicsData(omicsData, analysisType, parameters);
      
      // Record metrics
      metrics.recordApiRequest('POST', '/api/omics/analyze', 200, Date.now() - req.startTime);
      
      return res.status(200).json({
        message: 'Analysis completed',
        results: analysisResults
      });
    } catch (error) {
      logger.error('Error analyzing omics data', {
        error: error.message,
        stack: error.stack,
        patientId: req.body.patientId,
        analysisType: req.body.analysisType,
        userId: req.user.id
      });
      
      return res.status(500).json({
        error: 'Failed to analyze omics data',
        message: error.message
      });
    }
  }
);

/**
 * Process uploaded omics files
 * 
 * @param {Array} files - Uploaded files
 * @param {Object} options - Processing options
 * @returns {Promise<Array>} Processed file metadata
 */
async function processOmicsFiles(files, options) {
  const {
    patientId,
    dataType,
    source,
    description,
    userId,
    tenantId
  } = options;
  
  // In a real implementation, this would store file metadata in a database
  // For this implementation, we'll just return the file information
  return files.map(file => {
    const fileId = path.basename(file.filename, path.extname(file.filename));
    
    return {
      fileId,
      originalName: file.originalname,
      filePath: file.path,
      mimeType: file.mimetype,
      size: file.size,
      dataType,
      source,
      description,
      patientId,
      uploadedBy: userId,
      tenantId,
      uploadedAt: new Date().toISOString()
    };
  });
}

/**
 * Get omics data for a patient
 * 
 * @param {string} patientId - Patient ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Omics data
 */
async function getPatientOmicsData(patientId, options = {}) {
  // In a real implementation, this would query a database
  // For this implementation, we'll return mock data
  return [
    {
      fileId: 'mock-file-1',
      originalName: 'patient_genomic_data.json',
      filePath: '/tmp/omics-uploads/default/mock-file-1.json',
      mimeType: 'application/json',
      size: 1024,
      dataType: 'genomic',
      source: '23andMe',
      description: 'Genomic data from 23andMe',
      patientId,
      uploadedBy: 'user-1',
      tenantId: options.tenantId || 'default',
      uploadedAt: new Date().toISOString()
    },
    {
      fileId: 'mock-file-2',
      originalName: 'patient_microbiome_data.csv',
      filePath: '/tmp/omics-uploads/default/mock-file-2.csv',
      mimeType: 'text/csv',
      size: 2048,
      dataType: 'microbiome',
      source: 'Viome',
      description: 'Microbiome data from Viome',
      patientId,
      uploadedBy: 'user-1',
      tenantId: options.tenantId || 'default',
      uploadedAt: new Date().toISOString()
    }
  ];
}

/**
 * Get omics file metadata
 * 
 * @param {string} fileId - File ID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} File metadata
 */
async function getOmicsFileMetadata(fileId, options = {}) {
  // In a real implementation, this would query a database
  // For this implementation, we'll return mock data
  if (fileId === 'mock-file-1') {
    return {
      fileId: 'mock-file-1',
      originalName: 'patient_genomic_data.json',
      filePath: '/tmp/omics-uploads/default/mock-file-1.json',
      mimeType: 'application/json',
      size: 1024,
      dataType: 'genomic',
      source: '23andMe',
      description: 'Genomic data from 23andMe',
      patientId: 'patient-1',
      uploadedBy: 'user-1',
      tenantId: options.tenantId || 'default',
      uploadedAt: new Date().toISOString()
    };
  } else if (fileId === 'mock-file-2') {
    return {
      fileId: 'mock-file-2',
      originalName: 'patient_microbiome_data.csv',
      filePath: '/tmp/omics-uploads/default/mock-file-2.csv',
      mimeType: 'text/csv',
      size: 2048,
      dataType: 'microbiome',
      source: 'Viome',
      description: 'Microbiome data from Viome',
      patientId: 'patient-1',
      uploadedBy: 'user-1',
      tenantId: options.tenantId || 'default',
      uploadedAt: new Date().toISOString()
    };
  }
  
  return null;
}

/**
 * Get omics files by IDs
 * 
 * @param {Array} fileIds - File IDs
 * @param {Object} options - Query options
 * @returns {Promise<Array>} File metadata
 */
async function getOmicsFilesByIds(fileIds, options = {}) {
  // In a real implementation, this would query a database
  // For this implementation, we'll filter mock data
  const allFiles = [
    {
      fileId: 'mock-file-1',
      originalName: 'patient_genomic_data.json',
      filePath: '/tmp/omics-uploads/default/mock-file-1.json',
      mimeType: 'application/json',
      size: 1024,
      dataType: 'genomic',
      source: '23andMe',
      description: 'Genomic data from 23andMe',
      patientId: 'patient-1',
      uploadedBy: 'user-1',
      tenantId: options.tenantId || 'default',
      uploadedAt: new Date().toISOString()
    },
    {
      fileId: 'mock-file-2',
      originalName: 'patient_microbiome_data.csv',
      filePath: '/tmp/omics-uploads/default/mock-file-2.csv',
      mimeType: 'text/csv',
      size: 2048,
      dataType: 'microbiome',
      source: 'Viome',
      description: 'Microbiome data from Viome',
      patientId: 'patient-1',
      uploadedBy: 'user-1',
      tenantId: options.tenantId || 'default',
      uploadedAt: new Date().toISOString()
    }
  ];
  
  return allFiles.filter(file => fileIds.includes(file.fileId));
}

module.exports = router;
