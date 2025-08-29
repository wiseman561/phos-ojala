#!/bin/bash

# Staging Deployment Script for Emergency Alert Escalation System
# This script deploys the Emergency Alert Escalation system to the staging environment

echo "Starting deployment to staging environment"
echo "==========================================================="

# Set variables
STAGING_SERVER="staging.phos-healthcare.com"
STAGING_USER="deploy"
SSH_KEY="~/.ssh/phos_staging_key"
REPO_URL="https://github.com/wiseman561/phos-healthcare-platform.git"
BRANCH="feature/emergency-alert-system"
DEPLOY_DIR="/opt/phos-healthcare"

# Create deployment script to run on staging server
cat > deploy-staging.sh << 'EOF'
#!/bin/bash

set -e

echo "Deploying Emergency Alert Escalation System to staging..."

# Navigate to deployment directory
cd $DEPLOY_DIR

# Pull latest code from the feature branch
git fetch --all
git checkout $BRANCH
git pull origin $BRANCH

# Build and deploy services
echo "Building and deploying services..."

# Stop existing services
docker-compose down

# Build new services including alerts-streamer
docker-compose build nurse-assistant phos-api alerts-streamer

# Start all services with Redis
docker-compose up -d

# Wait for services to start
echo "Waiting for services to start..."
sleep 30

# Run database migrations if needed
echo "Running database migrations..."
docker-compose exec -T phos-api dotnet ef database update

# Run integration tests
echo "Running integration tests..."
./scripts/test-emergency-alert-system.sh

echo "Deployment to staging complete!"
echo "The system is now available at https://staging.phos-healthcare.com"
EOF

# Make the script executable
chmod +x deploy-staging.sh

# Copy deployment script to staging server
echo "Copying deployment script to staging server..."
scp -i $SSH_KEY deploy-staging.sh $STAGING_USER@$STAGING_SERVER:/tmp/

# Execute deployment script on staging server
echo "Executing deployment script on staging server..."
ssh -i $SSH_KEY $STAGING_USER@$STAGING_SERVER "bash /tmp/deploy-staging.sh"

# Clean up
rm deploy-staging.sh

echo "==========================================================="
echo "Staging deployment initiated. Check the staging server for deployment status."
echo "Once deployment is complete, the system will be available at:"
echo "https://staging.phos-healthcare.com"
echo ""
echo "You can monitor the deployment with:"
echo "ssh -i $SSH_KEY $STAGING_USER@$STAGING_SERVER 'tail -f /var/log/phos/deployment.log'"
