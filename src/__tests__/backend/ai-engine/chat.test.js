const request = require('supertest');
const express = require('express');
const sinon = require('sinon');
const chatRouter = require('../chat');
const { OpenAI } = require('openai');

describe('Chat API Endpoint Tests', () => {
  let app;
  let openaiStub;

  beforeEach(() => {
    // Create a fresh Express app for each test
    app = express();
    app.use(express.json());
    
    // Stub OpenAI client
    openaiStub = sinon.stub(OpenAI.prototype, 'chat');
    openaiStub.returns({
      completions: {
        create: sinon.stub().resolves({
          choices: [
            {
              message: {
                content: 'This is a test response from the OpenAI API'
              }
            }
          ]
        })
      }
    });
    
    // Mount the chat router
    app.use('/api/ai', chatRouter);
  });

  afterEach(() => {
    // Restore stubs
    openaiStub.restore();
  });

  describe('POST /api/ai/chat', () => {
    it('should return 200 and a valid response for a valid prompt', async () => {
      const response = await request(app)
        .post('/api/ai/chat')
        .send({
          prompt: 'Test prompt',
          options: {
            temperature: 0.7,
            maxTokens: 100
          }
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('response');
      expect(typeof response.body.response).toBe('string');
    });

    it('should return 400 for a request without a prompt', async () => {
      const response = await request(app)
        .post('/api/ai/chat')
        .send({
          options: {
            temperature: 0.7,
            maxTokens: 100
          }
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should use default options when none are provided', async () => {
      const response = await request(app)
        .post('/api/ai/chat')
        .send({
          prompt: 'Test prompt'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('response');
    });

    it('should handle OpenAI API errors gracefully', async () => {
      // Restore the original stub and create a new one that throws an error
      openaiStub.restore();
      openaiStub = sinon.stub(OpenAI.prototype, 'chat').throws(new Error('OpenAI API Error'));

      const response = await request(app)
        .post('/api/ai/chat')
        .send({
          prompt: 'Test prompt'
        });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });
});
