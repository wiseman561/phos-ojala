// chat.js - OpenAI Chat Integration for AI Engine
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../frontend/employer-dashboard/src/auth');
const { createLogger } = require('../../monitoring/logger');
const metrics = require('../../monitoring/metrics');
const { OpenAI } = require('openai');

// Initialize logger
const logger = createLogger('ai-chat', {
  enableConsole: true,
  enableFile: true,
  enableCloudWatch: process.env.NODE_ENV === 'production'
});

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * @swagger
 * /api/ai/chat:
 *   post:
 *     summary: Chat with AI assistant
 *     description: Send a prompt to the OpenAI GPT model and receive a response
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - prompt
 *             properties:
 *               prompt:
 *                 type: string
 *                 description: The prompt to send to the AI
 *               systemMessage:
 *                 type: string
 *                 description: Optional system message to set context
 *               model:
 *                 type: string
 *                 description: OpenAI model to use
 *                 default: gpt-4
 *               temperature:
 *                 type: number
 *                 description: Controls randomness (0-1)
 *                 default: 0.7
 *               maxTokens:
 *                 type: number
 *                 description: Maximum tokens in response
 *                 default: 1000
 *     responses:
 *       200:
 *         description: AI response received successfully
 *       400:
 *         description: Invalid request parameters
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       500:
 *         description: Server error
 */
router.post('/chat', authenticateToken, async (req, res) => {
  try {
    const startTime = Date.now();
    const { prompt, systemMessage, model, temperature, maxTokens } = req.body;
    
    if (!prompt) {
      return res.status(400).json({
        error: 'Missing required parameter',
        message: 'Prompt is required'
      });
    }
    
    // Default system message if not provided
    const defaultSystemMessage = "You are an AI assistant specialized in healthcare and medical analysis. Provide clear, accurate, and helpful information.";
    
    // Prepare messages for OpenAI API
    const messages = [
      {
        role: 'system',
        content: systemMessage || defaultSystemMessage
      },
      {
        role: 'user',
        content: prompt
      }
    ];
    
    // Log the request (excluding sensitive data)
    logger.info('Processing chat request', {
      userId: req.user.id,
      modelRequested: model || 'gpt-4',
      promptLength: prompt.length,
      hasSystemMessage: !!systemMessage
    });
    
    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: model || 'gpt-4',
      messages: messages,
      temperature: temperature !== undefined ? temperature : 0.7,
      max_tokens: maxTokens || 1000,
    });
    
    // Extract the response
    const aiResponse = completion.choices[0].message.content;
    
    // Record metrics
    const duration = Date.now() - startTime;
    metrics.recordApiRequest('POST', '/api/ai/chat', 200, duration);
    metrics.recordHistogram('ai_chat_response_time', duration);
    metrics.incrementCounter('ai_chat_requests');
    
    // Return the response
    return res.status(200).json({
      response: aiResponse,
      model: completion.model,
      usage: completion.usage,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error processing chat request', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });
    
    // Determine if this is an OpenAI API error
    const isOpenAIError = error.name === 'OpenAIError' || 
                          error.message.includes('OpenAI') ||
                          error.message.includes('API');
    
    // Return appropriate error response
    if (isOpenAIError) {
      return res.status(502).json({
        error: 'AI Service Error',
        message: 'Error communicating with OpenAI API',
        details: error.message
      });
    } else {
      return res.status(500).json({
        error: 'Server Error',
        message: 'An unexpected error occurred',
        details: error.message
      });
    }
  }
});

module.exports = router;
