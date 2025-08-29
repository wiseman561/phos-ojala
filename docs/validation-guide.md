# Validation and Troubleshooting Guide for Emergency Alert Escalation System

This guide provides step-by-step instructions for validating the Emergency Alert Escalation system in the staging environment and troubleshooting common issues.

## Validation Steps

### 1. Verify Redis Connection

```bash
# Connect to the staging server
ssh -i ~/.ssh/phos_staging_key deploy@staging.phos-healthcare.com

# Check Redis status
docker-compose exec redis redis-cli ping
```

Expected result: `PONG`

### 2. Verify Service Health

```bash
# Check all services are running
docker-compose ps

# Verify health endpoints
curl http://localhost:5000/health  # Phos.Api
curl http://localhost:5003/health  # Nurse Assistant
curl http://localhost:5004/health  # Alerts Streamer
```

Expected result: All services should return status code 200 with `"status": "healthy"`

### 3. Test Alert Classification

```bash
# Send a test alert with heart rate in Emergency range
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <test-token>" \
  -d '{
    "patientId": "P12345",
    "deviceId": "D6789",
    "metric": "heartRate",
    "value": 125,
    "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'",
    "additionalData": {}
  }' \
  http://localhost:5003/api/alerts
```

Expected result: Response should include `"severity": "Emergency"` and `"escalated": true`

### 4. Verify Alert Storage

```bash
# Check if the alert was stored in the database
docker-compose exec phos-api dotnet ef dbcontext-info
docker-compose exec phos-api dotnet ef dbcontext-info --context PhosDbContext

# Query the database for the alert
docker-compose exec phos-api dotnet ef database-drop
```

Expected result: The alert should be present in the EscalatedAlerts table

### 5. Test WebSocket Connection

```bash
# Install wscat if not already available
npm install -g wscat

# Connect to the WebSocket endpoint
wscat -c "ws://localhost:5004/ws/alerts?token=<test-token>"
```

Expected result: Successful connection and any new alerts should appear in real-time

### 6. Verify UI Components

1. Open the RN Dashboard at https://staging.phos-healthcare.com/rn-dashboard
2. Log in with test credentials
3. Verify the Emergency Alert banner is visible
4. Click on the banner to expand the panel
5. Verify active alerts are displayed correctly
6. Test the acknowledge button functionality
7. Toggle between active-only and all alerts views

Expected result: UI should display alerts correctly and respond to user interactions

## Troubleshooting Common Issues

### Redis Connection Issues

**Symptoms**: Services fail to start or WebSocket connections fail

**Solutions**:
1. Verify Redis container is running: `docker-compose ps redis`
2. Check Redis logs: `docker-compose logs redis`
3. Ensure Redis port is accessible: `docker-compose exec redis redis-cli ping`
4. Restart Redis if needed: `docker-compose restart redis`

### Alert Classification Issues

**Symptoms**: Alerts not being classified correctly or not escalated

**Solutions**:
1. Check Nurse Assistant logs: `docker-compose logs nurse-assistant`
2. Verify thresholds in alertSeverity.js match requirements
3. Test with different values to confirm classification logic
4. Ensure the alertsRouter.js is correctly processing alerts

### API Issues

**Symptoms**: Alerts not being stored or notifications not sent

**Solutions**:
1. Check API logs: `docker-compose logs phos-api`
2. Verify database connection: `docker-compose exec phos-api dotnet ef dbcontext-info`
3. Check notification service: `docker-compose logs notification-service`
4. Ensure Redis publishing is working: `docker-compose exec redis redis-cli monitor`

### WebSocket Issues

**Symptoms**: Real-time updates not working or connection failures

**Solutions**:
1. Check Alerts Streamer logs: `docker-compose logs alerts-streamer`
2. Verify JWT token is valid and includes required roles
3. Check Redis subscription: `docker-compose exec redis redis-cli psubscribe '*'`
4. Ensure WebSocket endpoint is accessible: `curl -I http://localhost:5004/health`

### UI Issues

**Symptoms**: Alerts not displaying or acknowledgment not working

**Solutions**:
1. Check browser console for errors
2. Verify WebSocket connection in Network tab
3. Check API calls for alert retrieval and acknowledgment
4. Clear browser cache and reload the page

## Rollback Procedure

If critical issues are found that cannot be resolved quickly:

```bash
# Connect to the staging server
ssh -i ~/.ssh/phos_staging_key deploy@staging.phos-healthcare.com

# Switch back to the main branch
cd /opt/phos-healthcare
git checkout main
git pull origin main

# Rebuild and restart services
docker-compose down
docker-compose build
docker-compose up -d
```

## Contact Information

For urgent issues during validation, contact:

- DevOps Team: devops@phos-healthcare.com
- Backend Team Lead: backend-lead@phos-healthcare.com
- Frontend Team Lead: frontend-lead@phos-healthcare.com
