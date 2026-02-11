#!/bin/bash

# Integration Test Script for Phos Healthcare Platform
# This script tests the integration between all components

echo "Starting integration tests for Phos Healthcare Platform..."

# Create test directory if it doesn't exist
mkdir -p /home/ubuntu/PhosHealthcarePlatform/integration-tests

# Create a sample omics file for testing
cat > /home/ubuntu/PhosHealthcarePlatform/integration-tests/sample-omics.json << EOL
{
  "patientId": "test-patient-123",
  "dataType": "genomic",
  "source": "test-source",
  "data": {
    "markers": [
      {"id": "rs123", "value": "AA"},
      {"id": "rs456", "value": "GC"},
      {"id": "rs789", "value": "TT"}
    ],
    "metadata": {
      "platform": "test-platform",
      "version": "1.0"
    }
  }
}
EOL

echo "Created sample omics test file"

# Test 1: Test OpenAI Chat Endpoint
echo "Test 1: Testing OpenAI Chat Endpoint..."
curl -X POST http://localhost:8080/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"prompt": "What is the role of genomics in personalized medicine?"}' \
  -o /home/ubuntu/PhosHealthcarePlatform/integration-tests/chat-response.json

if [ $? -eq 0 ]; then
  echo "✅ Chat endpoint test completed"
else
  echo "❌ Chat endpoint test failed"
fi

# Test 2: Test Omics Upload Endpoint
echo "Test 2: Testing Omics Upload Endpoint..."
curl -X POST http://localhost:8080/api/omics/upload \
  -H "Content-Type: multipart/form-data" \
  -F "file=@/home/ubuntu/PhosHealthcarePlatform/integration-tests/sample-omics.json" \
  -F "patientId=test-patient-123" \
  -F "dataType=genomic" \
  -F "source=test-source" \
  -o /home/ubuntu/PhosHealthcarePlatform/integration-tests/upload-response.json

if [ $? -eq 0 ]; then
  echo "✅ Omics upload endpoint test completed"
else
  echo "❌ Omics upload endpoint test failed"
fi

# Test 3: Test Omics Analyze Endpoint
echo "Test 3: Testing Omics Analyze Endpoint..."
curl -X POST http://localhost:8080/api/omics/analyze \
  -H "Content-Type: application/json" \
  -d '{"patientId": "test-patient-123", "fileIds": ["test-file-id"], "analysisType": "risk_assessment"}' \
  -o /home/ubuntu/PhosHealthcarePlatform/integration-tests/analyze-response.json

if [ $? -eq 0 ]; then
  echo "✅ Omics analyze endpoint test completed"
else
  echo "❌ Omics analyze endpoint test failed"
fi

# Test 4: Test Telehealth Sessions Endpoint
echo "Test 4: Testing Telehealth Sessions Endpoint..."
curl -X GET http://localhost:8080/telehealth/sessions?role=patient \
  -H "Content-Type: application/json" \
  -o /home/ubuntu/PhosHealthcarePlatform/integration-tests/telehealth-sessions-response.json

if [ $? -eq 0 ]; then
  echo "✅ Telehealth sessions endpoint test completed"
else
  echo "❌ Telehealth sessions endpoint test failed"
fi

# Test 5: Test Telehealth Schedule Endpoint
echo "Test 5: Testing Telehealth Schedule Endpoint..."
curl -X POST http://localhost:8080/telehealth/schedule \
  -H "Content-Type: application/json" \
  -d '{"scheduledAt": "2025-05-01T10:00:00Z", "reason": "Integration test appointment"}' \
  -o /home/ubuntu/PhosHealthcarePlatform/integration-tests/telehealth-schedule-response.json

if [ $? -eq 0 ]; then
  echo "✅ Telehealth schedule endpoint test completed"
else
  echo "❌ Telehealth schedule endpoint test failed"
fi

# Test 6: Verify Vault Integration
echo "Test 6: Verifying Vault Integration..."
# Check if the .env file is created with the OPENAI_API_KEY
if [ -f "/vault/secrets/.env" ]; then
  echo "✅ Vault integration test completed - .env file exists"
else
  echo "❌ Vault integration test failed - .env file does not exist"
fi

echo "Integration tests completed. Check the response files in the integration-tests directory for details."
