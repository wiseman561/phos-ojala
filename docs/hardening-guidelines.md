# Ojalá Healthcare Platform - Hardening Guidelines

This document provides security hardening guidelines based on the comprehensive audit performed. It covers Docker, Kubernetes, CI/CD, and recommendations for continuous monitoring.

## 1. Docker Security Hardening

Based on the audit of individual Dockerfiles (`docker-security-audit-*.md` files), the following hardening steps are recommended:

*   **Use Specific, Secure Base Images**: Replace generic tags like `latest` or broad version tags (e.g., `node:18`) with specific, minimal, and security-patched versions (e.g., `node:18.19.0-alpine`, `mcr.microsoft.com/dotnet/aspnet:6.0.25-alpine`). Regularly update base images.
*   **Implement Non-Root Users**: Add `USER` instructions in all Dockerfiles to run containers as non-root users. Create a dedicated user and group.
*   **Pin Dependency Versions**: Ensure all package installations (e.g., `apt-get`, `npm`, `pip`) use specific versions to prevent unexpected changes and vulnerabilities.
*   **Minimize Image Layers**: Combine related `RUN` commands using `&&` to reduce the number of layers.
*   **Multi-Stage Builds**: Utilize multi-stage builds effectively, especially for compiled languages (.NET) and Node.js applications, to ensure the final image contains only necessary runtime artifacts, excluding build tools and source code.
*   **Remove Unnecessary Tools**: Ensure final container images do not include unnecessary tools like `curl`, `wget`, compilers, or package managers.
*   **COPY Specific Files**: Use specific `COPY` instructions instead of copying entire directories (`COPY . .`) to avoid including sensitive files (e.g., `.git`, `.env`). Utilize `.dockerignore` effectively.
*   **Health Checks**: Implement proper `HEALTHCHECK` instructions in all service Dockerfiles.
*   **Secrets Management**: Do not build secrets or credentials into the image. Fetch them at runtime using mechanisms like Vault.

## 2. Kubernetes Security Hardening

Based on the audit of Helm charts and `docker-compose.yml`:

*   **Secret Management**: 
    *   Remove all hardcoded secrets and tokens (Vault tokens, DB passwords, JWT secrets) from `docker-compose.yml`, Helm `values.yaml` files, and deployment templates.
    *   Integrate Vault with Kubernetes using the Kubernetes Auth Method. Inject secrets into pods via annotations or CSI driver, not environment variables containing tokens.
    *   Use Kubernetes Secrets for non-Vault managed secrets, mounted as volumes rather than environment variables.
*   **Network Security**:
    *   Implement default-deny Kubernetes Network Policies to restrict ingress and egress traffic for all pods.
    *   Allow communication only between necessary services on specific ports.
    *   Consider implementing a service mesh (e.g., Istio, Linkerd) for mutual TLS (mTLS) between internal services.
*   **Container Security Contexts**:
    *   Apply strict `securityContext` settings to all pods/containers in all environments (not just production):
        *   `runAsNonRoot: true`
        *   `runAsUser: <non-root-UID>` (e.g., 1000)
        *   `readOnlyRootFilesystem: true` (requires careful volume mounting for writable paths)
        *   `allowPrivilegeEscalation: false`
        *   `capabilities: { drop: ["ALL"] }`
    *   Apply `podSecurityContext` (e.g., `fsGroup`).
*   **Resource Limits**: Define CPU and memory `requests` and `limits` for all containers in all environments to prevent resource exhaustion.
*   **RBAC**: Ensure least privilege principle is applied to Service Accounts. Review roles and role bindings.
*   **Ingress Security**: Continue using TLS for ingress. Ensure strong cipher suites and protocols are configured. Implement WAF (Web Application Firewall) if possible.
*   **Storage Security**: Configure `StorageClass` to enable encryption at rest for PersistentVolumes. Ensure backups are also encrypted.
*   **Admission Controllers**: Implement policy-as-code using admission controllers like OPA/Gatekeeper or Kyverno to enforce security best practices (e.g., disallow privileged containers, require labels, enforce resource limits).

## 3. CI/CD Pipeline Hardening

Based on the audit of GitHub Actions workflows:

*   **Secrets**: Ensure GitHub Actions secrets are used correctly and not exposed in logs.
*   **Pin Actions Versions**: Use specific commit SHAs or version tags for third-party GitHub Actions (e.g., `actions/checkout@v3.1.0` instead of `actions/checkout@v3`).
*   **Least Privilege**: Grant workflows only the minimum necessary permissions.
*   **Dependency Scanning**: Continue using OWASP Dependency-Check and npm audit. Consider integrating tools that fail the build on high/critical vulnerabilities.
*   **SAST**: Utilize the newly added CodeQL workflow for Static Application Security Testing.
*   **Container Image Scanning**: Integrate container image vulnerability scanning (e.g., Trivy, Clair, Aqua Security) directly into the CI pipeline after the image build step. Fail builds if critical vulnerabilities are found in the final image.
*   **Signed Commits/Artifacts**: Consider enforcing signed commits and signing build artifacts.

## 4. Continuous Compliance Monitoring

To maintain security and compliance (including HIPAA) post-deployment, implement continuous monitoring strategies:

*   **Kubernetes Security Posture Management (KSPM)**:
    *   **Tools**: Deploy open-source tools like **Kubescape** or **Checkov**, or commercial solutions like Wiz, Orca Security, Sysdig, or Aqua Security.
    *   **Functionality**: These tools continuously scan Kubernetes configurations against security benchmarks (CIS Kubernetes Benchmark), compliance frameworks (HIPAA, SOC 2, NIST), and organizational policies.
    *   **Integration**: Integrate KSPM tools into the CI/CD pipeline to check manifests before deployment and run them continuously against the live cluster.
*   **Container Image Scanning (Runtime)**: Continuously scan running containers and registries for newly discovered vulnerabilities using tools like Trivy, Clair, or commercial equivalents.
*   **Runtime Security**: Implement runtime security monitoring tools (e.g., Falco, Sysdig Secure, Aqua Security) to detect anomalous behavior within containers and on nodes.
*   **Cloud Security Posture Management (CSPM)**: If deployed in a cloud environment (AWS, Azure, GCP), use native cloud provider tools (e.g., AWS Security Hub, Azure Security Center, Google Security Command Center) or third-party CSPM tools to monitor the security posture of the underlying cloud infrastructure (VPCs, firewalls, storage, IAM).
*   **Log Monitoring & Alerting (SIEM)**:
    *   Implement the recommendations from the Logging and Monitoring audit (centralized logging, PHI sanitization).
    *   Feed security-relevant logs (audit logs, KSPM alerts, runtime alerts, firewall logs) into a Security Information and Event Management (SIEM) system.
    *   Configure alerts for critical security events and compliance violations.
*   **Automated Compliance Reporting**: Utilize KSPM and CSPM tools to generate regular compliance reports for HIPAA, SOC 2, etc.
*   **Regular Audits**: Schedule regular internal and third-party security audits and penetration tests.



## 5. End-to-End Penetration Testing Recommendation

While this audit provides a comprehensive review of the codebase, configurations, and adherence to security best practices, it is not a substitute for a thorough, independent penetration test.

**Recommendation:**

*   **Engage a Third-Party Penetration Testing Firm**: Prior to full production launch and handling real patient PHI, it is **strongly recommended** to engage a reputable third-party security firm specializing in healthcare application and infrastructure penetration testing.
*   **Scope**: The penetration test should cover:
    *   External network infrastructure
    *   Web applications (Patient Portal, RN Dashboard, Employer Dashboard, etc.)
    *   Mobile application (Patient App)
    *   Internal network and Kubernetes cluster security
    *   API security (including testing for OWASP API Security Top 10 vulnerabilities)
    *   Authentication and authorization bypass attempts
    *   PHI data exposure testing
    *   Cloud configuration review (if applicable, complementing this audit)
*   **Timing**: Conduct the penetration test after implementing the hardening recommendations from this audit and deploying to a production-like staging environment.
*   **Remediation**: Allocate time and resources to remediate any findings from the penetration test before the final go-live date.

Conducting regular penetration tests (e.g., annually or after significant changes) is a crucial part of maintaining a robust security posture and meeting compliance requirements like HIPAA.
