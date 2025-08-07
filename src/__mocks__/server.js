const express = require('express');
const app = express();

// Mock route handlers
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.post('/api/data', (req, res) => {
  res.status(201).json({ success: true });
});

// Mock WebSocket functionality
const io = {
  on: jest.fn(),
  use: jest.fn(),
  emit: jest.fn()
};

module.exports = { app, io }; 