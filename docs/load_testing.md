# Load Testing Guide for PhosHealthcarePlatform

This document provides instructions for running load tests against the PhosHealthcarePlatform API services.

## Prerequisites

- Docker and Docker Compose installed
- Access to the PhosHealthcarePlatform API services
- Network connectivity to the API Gateway

## Test Scenarios

The load testing suite includes the following scenarios:

1. **RN Alerts Scenario**: Tests the performance of the RN dashboard API endpoints, including alerts, patient lists, and health scores.
   - Simulates up to 200 concurrent users
   - Ramps up gradually over 3 minutes
   - Focuses on read-heavy operations

2. **Patient Dashboard Scenario**: Tests the performance of the patient dashboard API endpoints, including dashboard data, care plans, and health metrics.
   - Simulates up to 500 concurrent users
   - Ramps up gradually over 3 minutes
   - Includes both read and write operations (submitting health measurements)

## Running the Tests

### Using Docker Compose

1. Navigate to the loadtest directory:
   ```
   cd /path/to/healthcare_platform/loadtest
   ```

2. Run the tests using Docker Compose:
   ```
   docker-compose -f docker-compose.override.yml up
   ```

3. View the results in the `results` directory:
   ```
   cat results/result.json
   ```

### Running Locally with k6

If you have k6 installed locally, you can run the tests directly:

1. Navigate to the loadtest directory:
   ```
   cd /path/to/healthcare_platform/loadtest
   ```

2. Run the tests with k6:
   ```
   k6 run script.js
   ```

3. To specify the API endpoint:
   ```
   k6 run -e BASE_URL=https://api.phos-healthcare.com script.js
   ```

## Configuration Options

You can customize the load tests using environment variables:

- `BASE_URL`: The base URL of the API (default: http://localhost:5000)
- `API_VERSION`: The API version to test (default: v1)

Example:
```
docker-compose -f docker-compose.override.yml run -e BASE_URL=https://staging-api.phos-healthcare.com -e API_VERSION=v2 loadtest
```

## Performance Thresholds

The tests include the following performance thresholds:

- 95% of requests should complete in less than 500ms
- 99% of requests should complete in less than 1000ms
- Error rate should be less than 1%

## Interpreting Results

After running the tests, review the following metrics:

- **Request Rate**: The number of requests per second
- **Response Time**: The time taken to process requests (p95, p99)
- **Error Rate**: The percentage of failed requests
- **HTTP Status Codes**: Distribution of response status codes

## Continuous Integration

The load tests are integrated into the CI/CD pipeline and run automatically on staging environments before production deployments.

To run the tests in CI:
```
docker-compose -f docker-compose.override.yml up --abort-on-container-exit
```

## Troubleshooting

If you encounter issues:

1. Check network connectivity to the API services
2. Verify that the API services are running
3. Check the API Gateway logs for errors
4. Ensure the test user credentials are valid

For additional support, contact the DevOps team.
