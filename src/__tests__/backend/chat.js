const express = require('express');
const { OpenAI } = require('openai');
const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'test-key',
  dangerouslyAllowBrowser: true // Only for testing
});

router.post('/chat', async (req, res) => {
  try {
    const { prompt, options = {} } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const response = await openai.chat.completions.create({
      model: options.model || 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: options.max_tokens || 150,
      temperature: options.temperature || 0.7
    });

    res.json({
      response: response.choices[0].message.content,
      usage: response.usage
    });
  } catch (error) {
    console.error('OpenAI API error:', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

module.exports = router;
