# Kubernetes Network Policies for HIPAA Compliance

## Overview

This directory contains Kubernetes NetworkPolicy resources that implement HIPAA §164.312(a)(1) access control requirements. The policies enforce the principle of least privilege by default-deny all traffic and explicitly allowing only approved communication paths.

## HIPAA Compliance

### §164.312(a)(1) - Access Control
The implemented network policies ensure:
- **Default Deny**: All pod-to-pod communication is blocked by default
- **Explicit Allow**: Only specific, documented traffic paths are permitted
- **Role-Based Access**: Services are labeled with roles for granular control
- **Audit Trail**: All policies are documented with HIPAA compliance annotations

## Network Policy Files

### 1. `default-deny.yaml`
- **Purpose**: Implements default-deny for all pods in both `demo` and `phos-ns` namespaces
- **Effect**: Blocks all ingress and egress traffic by default
- **Compliance**: Enforces principle of least privilege

### 2. `api-allow-nurse.yaml`
- **Purpose**: Allows nurse-assistant service to communicate with API service
- **Traffic**: HTTP/HTTPS (ports 80, 5000)
- **Direction**: Nurse Assistant → API
- **Labels Required**: 
  - API pods: `app: phos-api, role: api`
  - Nurse pods: `app: phos-nurse-assistant, role: nurse-assistant`

### 3. `api-allow-db.yaml`
- **Purpose**: Allows API service to communicate with PostgreSQL database
- **Traffic**: PostgreSQL (port 5432)
- **Direction**: API → Database (cross-namespace)
- **Labels Required**:
  - API pods: `app: phos-api, role: api`
  - DB pods: `app: phos-db, role: db`

### 4. `identity-allow-api.yaml`
- **Purpose**: Allows identity service to communicate with API for authentication
- **Traffic**: HTTP/HTTPS (ports 80, 5000)
- **Direction**: Identity → API (cross-namespace)
- **Labels Required**:
  - API pods: `app: phos-api, role: api`
  - Identity pods: `app: phos-identity, role: identity`

### 5. `essential-services.yaml`
- **Purpose**: Allows essential Kubernetes services (DNS resolution)
- **Traffic**: DNS (port 53 UDP/TCP)
- **Effect**: Enables basic cluster functionality while maintaining security

## Required Pod Labels

To ensure network policies work correctly, all pods must have the following labels:

```yaml
# API Service
labels:
  app: phos-api
  role: api

# Nurse Assistant Service
labels:
  app: phos-nurse-assistant
  role: nurse-assistant

# Identity Service
labels:
  app: phos-identity
  role: identity

# Database Service
labels:
  app: phos-db
  role: db
```

## Required Namespace Labels

Namespaces must be labeled for cross-namespace communication:

```yaml
# demo namespace
metadata:
  name: demo
  labels:
    name: demo

# phos-ns namespace
metadata:
  name: phos-ns
  labels:
    name: phos-ns
```

## Deployment Instructions

### 1. Apply Namespace Labels
```bash
kubectl label namespace demo name=demo
kubectl label namespace phos-ns name=phos-ns
```

### 2. Update Pod Labels
Ensure all deployments include the required role labels in their pod templates.

### 3. Apply Network Policies
```bash
# Apply in order of dependency
kubectl apply -f default-deny.yaml
kubectl apply -f essential-services.yaml
kubectl apply -f api-allow-db.yaml
kubectl apply -f identity-allow-api.yaml
kubectl apply -f api-allow-nurse.yaml
```

## Verification

### Check Network Policy Status
```bash
kubectl get networkpolicies --all-namespaces
```

### Test Connectivity
```bash
# Test nurse-assistant to API
kubectl exec -n demo deployment/phos-nurse-assistant -- curl -v http://phos-api:80/healthz

# Test API to database
kubectl exec -n demo deployment/phos-api -- nc -zv phos-db-service.phos-ns.svc.cluster.local 5432

# Test identity to API
kubectl exec -n phos-ns deployment/phos-identity -- curl -v http://phos-api.demo.svc.cluster.local:80/healthz
```

### Verify Default Deny
```bash
# This should fail (blocked by default-deny)
kubectl exec -n demo deployment/phos-nurse-assistant -- curl -v http://phos-identity-service.phos-ns.svc.cluster.local:80/healthz
```

## Troubleshooting

### Common Issues

1. **DNS Resolution Fails**
   - Ensure `essential-services.yaml` is applied
   - Check kube-dns service is running in kube-system namespace

2. **Cross-Namespace Communication Fails**
   - Verify namespace labels are applied
   - Check pod labels match network policy selectors

3. **Health Checks Fail**
   - Ensure health check endpoints are accessible
   - Verify service selectors match pod labels

### Debug Commands
```bash
# Check network policy details
kubectl describe networkpolicy -n demo
kubectl describe networkpolicy -n phos-ns

# Check pod labels
kubectl get pods -n demo --show-labels
kubectl get pods -n phos-ns --show-labels

# Check namespace labels
kubectl get namespaces --show-labels
```

## Security Considerations

### HIPAA Compliance
- All policies include HIPAA compliance annotations
- Default-deny approach ensures no unauthorized access
- Explicit allow rules document all permitted communication paths

### Monitoring
- Monitor network policy violations in cluster logs
- Set up alerts for unexpected connection attempts
- Regular audits of network policy effectiveness

### Updates
- Review and update policies when adding new services
- Test policies in non-production environments first
- Document all changes with compliance rationale

## Helm Integration

For Helm charts, add the following to `values.yaml`:

```yaml
networkPolicy:
  enabled: true
  annotations:
    hipaa.compliance: "164.312(a)(1)"
```

This enables automatic application of network policies when deploying with Helm. 
