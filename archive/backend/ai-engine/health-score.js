const express = require('express');
const rateLimit = require('express-rate-limit');
const { createLogger } = require('../../monitoring/logger');
const metrics = require('../../monitoring/metrics');
const { authenticateToken, checkRole } = require('../../frontend/employer-dashboard/src/auth');

// Initialize logger
const logger = createLogger('api-gateway', {
  enableConsole: true,
  enableFile: true,
  enableCloudWatch: process.env.NODE_ENV === 'production'
});

// Create rate limiter
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests',
    message: 'Please try again later'
  }
});

// Create router
const router = express.Router();

// Apply rate limiter to all routes
router.use(apiLimiter);

// Add request timestamp for metrics
router.use((req, res, next) => {
  req.startTime = Date.now();
  next();
});

/**
 * @swagger
 * /api/health-score/predict:
 *   post:
 *     summary: Predict health score and risk factors for a patient
 *     description: Returns health score, risk level, SHAP values, and adverse event probabilities
 *     tags:
 *       - Health Score
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
 *             properties:
 *               patientId:
 *                 type: string
 *                 description: Unique identifier for the patient
 *               includeAdverseEvents:
 *                 type: boolean
 *                 description: Whether to include adverse event predictions
 *                 default: true
 *     responses:
 *       '200':
 *         description: Health score prediction successful
 *       '400':
 *         description: Invalid request parameters
 *       '401':
 *         description: Unauthorized - missing or invalid token
 *       '403':
 *         description: Forbidden - insufficient permissions
 *       '404':
 *         description: Patient not found
 *       '429':
 *         description: Too many requests - rate limit exceeded
 *       '500':
 *         description: Server error
 */
router.post('/predict', authenticateToken, checkRole(['clinician', 'researcher']), async (req, res) => {
  try {
    const { patientId, includeAdverseEvents = true } = req.body;
    
    if (!patientId) {
      return res.status(400).json({
        error: 'Missing required parameter',
        message: 'Patient ID is required'
      });
    }
    
    // In a real implementation, this would call the health score service
    // For this implementation, we'll return mock data
    
    // Simulate service call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Generate mock health score data with SHAP explanations
    const healthScore = generateMockHealthScore(patientId, includeAdverseEvents);
    
    // Record metrics
    metrics.recordApiRequest('POST', '/api/health-score/predict', 200, Date.now() - req.startTime);
    
    return res.status(200).json(healthScore);
  } catch (error) {
    logger.error('Error predicting health score', {
      error: error.message,
      stack: error.stack,
      patientId: req.body.patientId,
      userId: req.user.id
    });
    
    return res.status(500).json({
      error: 'Failed to predict health score',
      message: error.message
    });
  }
});

/**
 * Generate mock health score data with SHAP explanations
 * @param {string} patientId Patient ID
 * @param {boolean} includeAdverseEvents Whether to include adverse event predictions
 * @returns {Object} Mock health score data
 */
function generateMockHealthScore(patientId, includeAdverseEvents) {
  // Generate a deterministic but seemingly random score based on patient ID
  const hash = patientId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const baseScore = 50 + (hash % 40); // Score between 50-90
  
  // Generate domain scores
  const cardiovascularScore = Math.max(30, Math.min(95, baseScore + (hash % 20) - 10));
  const metabolicScore = Math.max(30, Math.min(95, baseScore + ((hash * 2) % 20) - 10));
  const respiratoryScore = Math.max(30, Math.min(95, baseScore + ((hash * 3) % 20) - 10));
  const mentalScore = Math.max(30, Math.min(95, baseScore + ((hash * 4) % 20) - 10));
  
  // Determine risk levels
  const getRiskLevel = (score) => {
    if (score >= 80) return 'Low';
    if (score >= 60) return 'Moderate';
    return 'High';
  };
  
  // Generate SHAP explanation
  const shapExplanation = {
    top_contributors: [
      {
        feature: 'Systolic Blood Pressure',
        shap_value: ((hash % 10) / 10).toFixed(2),
        impact: hash % 2 === 0 ? 'increases' : 'decreases'
      },
      {
        feature: 'HbA1c',
        shap_value: ((hash % 8) / 10).toFixed(2),
        impact: (hash * 2) % 2 === 0 ? 'increases' : 'decreases'
      },
      {
        feature: 'Medication Adherence',
        shap_value: ((hash % 12) / 10).toFixed(2),
        impact: (hash * 3) % 2 === 0 ? 'increases' : 'decreases'
      },
      {
        feature: 'Age',
        shap_value: ((hash % 6) / 10).toFixed(2),
        impact: (hash * 4) % 2 === 0 ? 'increases' : 'decreases'
      },
      {
        feature: 'BMI',
        shap_value: ((hash % 9) / 10).toFixed(2),
        impact: (hash * 5) % 2 === 0 ? 'increases' : 'decreases'
      }
    ],
    expected_value: (baseScore - 10).toFixed(1)
  };
  
  // Generate adverse events if requested
  let adverseEvents = null;
  if (includeAdverseEvents) {
    adverseEvents = {
      hospitalization: {
        probability: (0.05 + (hash % 20) / 100).toFixed(2),
        timeframe: '30 days',
        shap_explanation: {
          top_contributors: [
            {
              feature: 'Previous Hospitalizations',
              shap_value: ((hash % 15) / 100).toFixed(2),
              impact: 'increases'
            },
            {
              feature: 'Medication Complexity',
              shap_value: ((hash % 10) / 100).toFixed(2),
              impact: 'increases'
            },
            {
              feature: 'Age',
              shap_value: ((hash % 8) / 100).toFixed(2),
              impact: 'increases'
            }
          ],
          expected_value: 0.05
        }
      },
      appointment_no_show: {
        probability: (0.10 + (hash % 30) / 100).toFixed(2),
        shap_explanation: {
          top_contributors: [
            {
              feature: 'Previous No-Shows',
              shap_value: ((hash % 20) / 100).toFixed(2),
              impact: 'increases'
            },
            {
              feature: 'Distance to Clinic',
              shap_value: ((hash % 15) / 100).toFixed(2),
              impact: 'increases'
            },
            {
              feature: 'Appointment Time',
              shap_value: ((hash % 10) / 100).toFixed(2),
              impact: 'increases'
            }
          ],
          expected_value: 0.12
        }
      },
      medication_nonadherence: {
        probability: (0.15 + (hash % 25) / 100).toFixed(2),
        shap_explanation: {
          top_contributors: [
            {
              feature: 'Medication Complexity',
              shap_value: ((hash % 25) / 100).toFixed(2),
              impact: 'increases'
            },
            {
              feature: 'Side Effects',
              shap_value: ((hash % 20) / 100).toFixed(2),
              impact: 'increases'
            },
            {
              feature: 'Cost',
              shap_value: ((hash % 15) / 100).toFixed(2),
              impact: 'increases'
            }
          ],
          expected_value: 0.18
        }
      }
    };
  }
  
  // Generate recommendations based on domain scores
  const recommendations = [];
  
  if (cardiovascularScore < 70) {
    recommendations.push({
      category: 'cardiovascular',
      description: 'Schedule a cardiovascular health check with your provider',
      priority: cardiovascularScore < 50 ? 'high' : 'medium',
      timeframe: cardiovascularScore < 50 ? 'within 7 days' : 'within 30 days'
    });
  }
  
  if (metabolicScore < 70) {
    recommendations.push({
      category: 'metabolic',
      description: 'Review current medication regimen and dietary plan',
      priority: metabolicScore < 50 ? 'high' : 'medium',
      timeframe: metabolicScore < 50 ? 'within 14 days' : 'within 45 days'
    });
  }
  
  if (respiratoryScore < 70) {
    recommendations.push({
      category: 'respiratory',
      description: 'Perform pulmonary function test and assess current treatment plan',
      priority: respiratoryScore < 50 ? 'high' : 'medium',
      timeframe: respiratoryScore < 50 ? 'within 7 days' : 'within 30 days'
    });
  }
  
  if (mentalScore < 70) {
    recommendations.push({
      category: 'mental',
      description: 'Schedule mental health assessment and review support resources',
      priority: mentalScore < 50 ? 'high' : 'medium',
      timeframe: mentalScore < 50 ? 'within 7 days' : 'within 30 days'
    });
  }
  
  // Generate trends (changes over time)
  const trends = {
    overall: ((hash % 10) - 5) / 2,
    cardiovascular: ((hash % 12) - 6) / 2,
    metabolic: ((hash % 8) - 4) / 2,
    respiratory: ((hash % 10) - 5) / 2,
    mental: ((hash % 14) - 7) / 2
  };
  
  // Construct the full health score response
  return {
    health_score: baseScore.toFixed(1),
    risk_level: getRiskLevel(baseScore),
    shap_explanation: shapExplanation,
    domain_scores: {
      cardiovascular: {
        score: cardiovascularScore.toFixed(1),
        risk_level: getRiskLevel(cardiovascularScore).toLowerCase()
      },
      metabolic: {
        score: metabolicScore.toFixed(1),
        risk_level: getRiskLevel(metabolicScore).toLowerCase()
      },
      respiratory: {
        score: respiratoryScore.toFixed(1),
        risk_level: getRiskLevel(respiratoryScore).toLowerCase()
      },
      mental: {
        score: mentalScore.toFixed(1),
        risk_level: getRiskLevel(mentalScore).toLowerCase()
      }
    },
    adverse_events: adverseEvents,
    recommendations,
    trends
  };
}

module.exports = router;
