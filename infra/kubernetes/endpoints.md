# PhosHealthcarePlatform Local Deployment Endpoints

After running the deployment script, the following endpoints will be available for accessing the PhosHealthcarePlatform services:

## API Endpoints
- **API Healthcheck**: http://localhost:5000/health
  - Use this to verify the API is running correctly
  - Returns a 200 OK response with health status information

## Frontend Applications
- **Provider Portal**: http://localhost:3000
  - Web application for healthcare providers
  - Features patient management, appointment scheduling, and medical records

- **Patient Portal**: http://localhost:3001
  - Web application for patients
  - Features appointment booking, medical history, and healthcare plan information

## Additional API Endpoints
- **API Gateway**: http://localhost:5001
  - Gateway service that routes requests to appropriate backend services
  - Authentication and authorization are handled here

## Testing the Deployment
To verify all services are running correctly:
1. Check the API health endpoint: `curl http://localhost:5000/health`
2. Open the Provider Portal in a browser: http://localhost:3000
3. Open the Patient Portal in a browser: http://localhost:3001

## Troubleshooting
If any service is not accessible:
1. Check pod status: `kubectl get pods -n demo`
2. View logs for specific service: `kubectl logs -n demo deployment/phos-api`
3. Restart the deployment script: `./scripts/deploy-local.sh`
