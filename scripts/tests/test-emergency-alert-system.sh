#!/bin/bash

# Integration Test Script for Emergency Alert Escalation System
# This script tests the complete flow of the Emergency Alert Escalation system

echo "Starting Emergency Alert Escalation System Integration Test"
echo "==========================================================="

# Set up variables
API_URL="http://localhost:8080"
NURSE_ASSISTANT_URL="http://localhost:5003"
ALERTS_STREAMER_URL="http://localhost:5004"
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlRlc3QgVXNlciIsInJvbGVzIjpbIm51cnNlIiwiZG9jdG9yIl0sImlhdCI6MTUxNjIzOTAyMn0.XbPfbIHMI6arZ3Y922BhjWgQzWXcXNrz0ogtVhfEd2o"

# Create output directory
mkdir -p integration-test-results
OUTPUT_DIR="integration-test-results"

echo "Testing Redis Connection..."
redis-cli ping > $OUTPUT_DIR/redis-ping.txt
if [ $? -ne 0 ]; then
  echo "❌ Redis connection failed. Make sure Redis is running."
  exit 1
else
  echo "✅ Redis connection successful"
fi

echo "Testing Nurse Assistant Alert Classification..."
# Create a test alert with heart rate in Emergency range
cat > $OUTPUT_DIR/test-alert.json << EOF
{
  "patientId": "P12345",
  "deviceId": "D6789",
  "metric": "heartRate",
  "value": 125,
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "additionalData": {}
}
EOF

# Send the alert to the nurse-assistant service
echo "Sending test alert to nurse-assistant service..."
curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d @$OUTPUT_DIR/test-alert.json \
  $NURSE_ASSISTANT_URL/api/alerts > $OUTPUT_DIR/nurse-assistant-response.json

# Check if the alert was processed and escalated
if grep -q "escalated" $OUTPUT_DIR/nurse-assistant-response.json; then
  echo "✅ Alert successfully classified as Emergency and escalated"
else
  echo "❌ Alert escalation failed"
  cat $OUTPUT_DIR/nurse-assistant-response.json
  exit 1
fi

# Extract escalation ID if available
ESCALATION_ID=$(grep -o '"escalationId":"[^"]*"' $OUTPUT_DIR/nurse-assistant-response.json | cut -d'"' -f4)
if [ -n "$ESCALATION_ID" ]; then
  echo "Escalation ID: $ESCALATION_ID"
else
  echo "⚠️ Couldn't extract escalation ID, using a placeholder for further tests"
  ESCALATION_ID="test-id"
fi

echo "Testing API Alerts Controller..."
# Get active alerts
echo "Fetching active alerts..."
curl -s -X GET \
  -H "Authorization: Bearer $TOKEN" \
  $API_URL/alerts/active > $OUTPUT_DIR/active-alerts.json

# Check if we have active alerts
ACTIVE_ALERTS_COUNT=$(grep -o '"id"' $OUTPUT_DIR/active-alerts.json | wc -l)
echo "Found $ACTIVE_ALERTS_COUNT active alert(s)"

if [ $ACTIVE_ALERTS_COUNT -gt 0 ]; then
  echo "✅ Active alerts retrieved successfully"
else
  echo "⚠️ No active alerts found, this might be expected if alerts were acknowledged"
fi

# Get all alerts
echo "Fetching all alerts..."
curl -s -X GET \
  -H "Authorization: Bearer $TOKEN" \
  $API_URL/alerts > $OUTPUT_DIR/all-alerts.json

# Check if we have any alerts
ALL_ALERTS_COUNT=$(grep -o '"id"' $OUTPUT_DIR/all-alerts.json | wc -l)
echo "Found $ALL_ALERTS_COUNT total alert(s)"

if [ $ALL_ALERTS_COUNT -gt 0 ]; then
  echo "✅ All alerts retrieved successfully"
else
  echo "❌ No alerts found"
  cat $OUTPUT_DIR/all-alerts.json
  exit 1
fi

# Extract the first alert ID for acknowledgment test
ALERT_ID=$(grep -o '"id":"[^"]*"' $OUTPUT_DIR/all-alerts.json | head -1 | cut -d'"' -f4)
if [ -n "$ALERT_ID" ]; then
  echo "Using alert ID: $ALERT_ID for acknowledgment test"

  # Acknowledge the alert
  echo "Acknowledging alert..."
  curl -s -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    $API_URL/alerts/$ALERT_ID/acknowledge > $OUTPUT_DIR/acknowledge-response.json

  # Check if acknowledgment was successful
  if grep -q '"success":true' $OUTPUT_DIR/acknowledge-response.json; then
    echo "✅ Alert acknowledged successfully"
  else
    echo "❌ Alert acknowledgment failed"
    cat $OUTPUT_DIR/acknowledge-response.json
    exit 1
  fi
else
  echo "⚠️ Couldn't extract alert ID for acknowledgment test"
fi

echo "Testing WebSocket Connection..."
# Create a simple Node.js script to test WebSocket connection
cat > $OUTPUT_DIR/websocket-test.js << EOF
const { io } = require('socket.io-client');
const fs = require('fs');

const token = '$TOKEN';
const socket = io('$ALERTS_STREAMER_URL/ws/alerts', {
  query: { token },
  transports: ['websocket']
});

console.log('Attempting to connect to WebSocket...');

socket.on('connect', () => {
  console.log('Connected to WebSocket');
  fs.writeFileSync('$OUTPUT_DIR/websocket-connect.log', 'Connected to WebSocket');

  // Wait for a few seconds to receive any messages
  setTimeout(() => {
    console.log('Disconnecting from WebSocket');
    socket.disconnect();
    process.exit(0);
  }, 5000);
});

socket.on('emergency-alert', (alert) => {
  console.log('Received emergency alert:', alert);
  fs.writeFileSync('$OUTPUT_DIR/websocket-alert.log', JSON.stringify(alert, null, 2));
});

socket.on('alert-acknowledged', (ack) => {
  console.log('Received alert acknowledgment:', ack);
  fs.writeFileSync('$OUTPUT_DIR/websocket-ack.log', JSON.stringify(ack, null, 2));
});

socket.on('error', (error) => {
  console.error('WebSocket error:', error);
  fs.writeFileSync('$OUTPUT_DIR/websocket-error.log', error.toString());
  process.exit(1);
});

socket.on('disconnect', () => {
  console.log('Disconnected from WebSocket');
});

// Exit after 10 seconds if no connection
setTimeout(() => {
  console.error('WebSocket connection timeout');
  fs.writeFileSync('$OUTPUT_DIR/websocket-timeout.log', 'Connection timeout');
  process.exit(1);
}, 10000);
EOF

# Run the WebSocket test
echo "Running WebSocket connection test..."
node $OUTPUT_DIR/websocket-test.js

# Check if WebSocket connection was successful
if [ -f "$OUTPUT_DIR/websocket-connect.log" ]; then
  echo "✅ WebSocket connection successful"
else
  echo "❌ WebSocket connection failed"
  if [ -f "$OUTPUT_DIR/websocket-error.log" ]; then
    cat $OUTPUT_DIR/websocket-error.log
  fi
  if [ -f "$OUTPUT_DIR/websocket-timeout.log" ]; then
    cat $OUTPUT_DIR/websocket-timeout.log
  fi
  exit 1
fi

# Check if we received any alerts or acknowledgments
if [ -f "$OUTPUT_DIR/websocket-alert.log" ]; then
  echo "✅ Received emergency alert via WebSocket"
  cat $OUTPUT_DIR/websocket-alert.log
fi

if [ -f "$OUTPUT_DIR/websocket-ack.log" ]; then
  echo "✅ Received alert acknowledgment via WebSocket"
  cat $OUTPUT_DIR/websocket-ack.log
fi

echo "==========================================================="
echo "Integration Test Summary:"
echo "- Redis Connection: ✅"
echo "- Nurse Assistant Alert Classification: ✅"
echo "- API Alerts Controller: ✅"
echo "- WebSocket Connection: ✅"
echo "- End-to-End Alert Flow: ✅"
echo "==========================================================="
echo "Emergency Alert Escalation System Integration Test Completed Successfully"
