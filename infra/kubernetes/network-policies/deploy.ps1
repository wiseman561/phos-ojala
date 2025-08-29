# Kubernetes Network Policies Deployment Script for HIPAA Compliance
# This script applies network policies and required labels for HIPAA §164.312(a)(1) access control

param(
    [switch]$SkipVerification
)

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

Write-Host "🚀 Deploying Kubernetes Network Policies for HIPAA Compliance" -ForegroundColor Cyan
Write-Host "==============================================================" -ForegroundColor Cyan

# Check if kubectl is available
try {
    $null = Get-Command kubectl -ErrorAction Stop
} catch {
    Write-Error "kubectl is not installed or not in PATH"
    exit 1
}

# Check if we can connect to the cluster
try {
    $null = kubectl cluster-info 2>$null
} catch {
    Write-Error "Cannot connect to Kubernetes cluster. Please check your kubeconfig."
    exit 1
}

Write-Status "Connected to Kubernetes cluster: $(kubectl config current-context)"

# Step 1: Label namespaces
Write-Status "Step 1: Labeling namespaces for cross-namespace communication"

# Check if namespaces exist
try {
    $null = kubectl get namespace demo 2>$null
} catch {
    Write-Warning "Namespace 'demo' does not exist. Creating it..."
    kubectl create namespace demo
}

try {
    $null = kubectl get namespace phos-ns 2>$null
} catch {
    Write-Warning "Namespace 'phos-ns' does not exist. Creating it..."
    kubectl create namespace phos-ns
}

# Label namespaces
kubectl label namespace demo name=demo --overwrite
kubectl label namespace phos-ns name=phos-ns --overwrite

Write-Status "Namespaces labeled successfully"

# Step 2: Apply network policies in dependency order
Write-Status "Step 2: Applying network policies"

# Apply default deny policies first
Write-Status "Applying default deny policies..."
kubectl apply -f default-deny.yaml

# Apply essential services policies
Write-Status "Applying essential services policies..."
kubectl apply -f essential-services.yaml

# Apply database access policies
Write-Status "Applying database access policies..."
kubectl apply -f api-allow-db.yaml

# Apply identity service policies
Write-Status "Applying identity service policies..."
kubectl apply -f identity-allow-api.yaml

# Apply nurse assistant policies
Write-Status "Applying nurse assistant policies..."
kubectl apply -f api-allow-nurse.yaml

# Step 3: Verify deployment
Write-Status "Step 3: Verifying network policy deployment"

# Check network policies
Write-Host ""
Write-Status "Network Policies Status:"
kubectl get networkpolicies --all-namespaces

# Check namespace labels
Write-Host ""
Write-Status "Namespace Labels:"
kubectl get namespaces --show-labels | Select-String "(demo|phos-ns)"

# Step 4: Verification instructions
Write-Host ""
Write-Status "Step 4: Verification Instructions"
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To verify the network policies are working correctly:" -ForegroundColor White
Write-Host ""
Write-Host "1. Check network policy status:" -ForegroundColor White
Write-Host "   kubectl get networkpolicies --all-namespaces" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Test nurse-assistant to API connectivity:" -ForegroundColor White
Write-Host "   kubectl exec -n demo deployment/phos-nurse-assistant -- curl -v http://phos-api:80/healthz" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Test API to database connectivity:" -ForegroundColor White
Write-Host "   kubectl exec -n demo deployment/phos-api -- nc -zv phos-db-service.phos-ns.svc.cluster.local 5432" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Test identity to API connectivity:" -ForegroundColor White
Write-Host "   kubectl exec -n phos-ns deployment/phos-identity -- curl -v http://phos-api.demo.svc.cluster.local:80/healthz" -ForegroundColor Gray
Write-Host ""
Write-Host "5. Verify default deny (this should fail):" -ForegroundColor White
Write-Host "   kubectl exec -n demo deployment/phos-nurse-assistant -- curl -v http://phos-identity-service.phos-ns.svc.cluster.local:80/healthz" -ForegroundColor Gray
Write-Host ""

Write-Status "✅ Network policies deployment completed successfully!"
Write-Status "📋 Remember to update your pod deployments with the required role labels:"
Write-Host "   - API pods: role: api" -ForegroundColor White
Write-Host "   - Nurse Assistant pods: role: nurse-assistant" -ForegroundColor White
Write-Host "   - Identity pods: role: identity" -ForegroundColor White
Write-Host "   - Database pods: role: db" -ForegroundColor White
Write-Host ""
Write-Status "📖 For detailed documentation, see: infra/kubernetes/network-policies/README.md"
