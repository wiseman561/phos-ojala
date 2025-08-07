const express = require('express');
const router = express.Router();

// Mock chat endpoint
router.post('/chat', (req, res) => {
  const { prompt, options = {} } = req.body;
  
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }
  
  // Respond with mock data
  return res.status(200).json({
    response: 'This is a test response from the mocked API',
    prompt,
    options
  });
});

// Error handler
router.use((err, req, res, next) => {
  console.error('Chat API Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = router; 