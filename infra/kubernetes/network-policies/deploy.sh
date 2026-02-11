#!/bin/bash

# Kubernetes Network Policies Deployment Script for HIPAA Compliance
# This script applies network policies and required labels for HIPAA §164.312(a)(1) access control

set -e

echo "🚀 Deploying Kubernetes Network Policies for HIPAA Compliance"
echo "=============================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    print_error "kubectl is not installed or not in PATH"
    exit 1
fi

# Check if we can connect to the cluster
if ! kubectl cluster-info &> /dev/null; then
    print_error "Cannot connect to Kubernetes cluster. Please check your kubeconfig."
    exit 1
fi

print_status "Connected to Kubernetes cluster: $(kubectl config current-context)"

# Step 1: Label namespaces
print_status "Step 1: Labeling namespaces for cross-namespace communication"

# Check if namespaces exist
if ! kubectl get namespace demo &> /dev/null; then
    print_warning "Namespace 'demo' does not exist. Creating it..."
    kubectl create namespace demo
fi

if ! kubectl get namespace phos-ns &> /dev/null; then
    print_warning "Namespace 'phos-ns' does not exist. Creating it..."
    kubectl create namespace phos-ns
fi

# Label namespaces
kubectl label namespace demo name=demo --overwrite
kubectl label namespace phos-ns name=phos-ns --overwrite

print_status "Namespaces labeled successfully"

# Step 2: Apply network policies in dependency order
print_status "Step 2: Applying network policies"

# Apply default deny policies first
print_status "Applying default deny policies..."
kubectl apply -f default-deny.yaml

# Apply essential services policies
print_status "Applying essential services policies..."
kubectl apply -f essential-services.yaml

# Apply database access policies
print_status "Applying database access policies..."
kubectl apply -f api-allow-db.yaml

# Apply identity service policies
print_status "Applying identity service policies..."
kubectl apply -f identity-allow-api.yaml

# Apply nurse assistant policies
print_status "Applying nurse assistant policies..."
kubectl apply -f api-allow-nurse.yaml

# Step 3: Verify deployment
print_status "Step 3: Verifying network policy deployment"

# Check network policies
echo ""
print_status "Network Policies Status:"
kubectl get networkpolicies --all-namespaces

# Check namespace labels
echo ""
print_status "Namespace Labels:"
kubectl get namespaces --show-labels | grep -E "(demo|phos-ns)"

# Step 4: Verification instructions
echo ""
print_status "Step 4: Verification Instructions"
echo "========================================"
echo ""
echo "To verify the network policies are working correctly:"
echo ""
echo "1. Check network policy status:"
echo "   kubectl get networkpolicies --all-namespaces"
echo ""
echo "2. Test nurse-assistant to API connectivity:"
echo "   kubectl exec -n demo deployment/phos-nurse-assistant -- curl -v http://phos-api:80/healthz"
echo ""
echo "3. Test API to database connectivity:"
echo "   kubectl exec -n demo deployment/phos-api -- nc -zv phos-db-service.phos-ns.svc.cluster.local 5432"
echo ""
echo "4. Test identity to API connectivity:"
echo "   kubectl exec -n phos-ns deployment/phos-identity -- curl -v http://phos-api.demo.svc.cluster.local:80/healthz"
echo ""
echo "5. Verify default deny (this should fail):"
echo "   kubectl exec -n demo deployment/phos-nurse-assistant -- curl -v http://phos-identity-service.phos-ns.svc.cluster.local:80/healthz"
echo ""

print_status "✅ Network policies deployment completed successfully!"
print_status "📋 Remember to update your pod deployments with the required role labels:"
echo "   - API pods: role: api"
echo "   - Nurse Assistant pods: role: nurse-assistant"
echo "   - Identity pods: role: identity"
echo "   - Database pods: role: db"
echo ""
print_status "📖 For detailed documentation, see: infra/kubernetes/network-policies/README.md"
