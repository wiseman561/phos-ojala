# Phase 2 Security Hardening Summary

This document summarizes the security improvements implemented during Phase 2 (Docker/Kubernetes/CI Hardening) of the Phos Healthcare Platform project.

## 1. Dockerfile Hardening

Security best practices were applied across multiple Dockerfiles to minimize the container attack surface and enhance runtime security. Key improvements include:

*   **Non-Root User Execution:** Standardized on running container processes as a non-root user (`appuser`) to limit potential damage if the container is compromised.
*   **File Ownership:** Ensured correct file ownership for copied application files using the `COPY --chown=appuser:appuser` directive, preventing potential permission issues.
*   **Minimal Base Images:** Utilized minimal base images (e.g., `alpine` variants for .NET) where feasible to reduce the number of pre-installed tools and libraries, shrinking the potential vulnerability footprint.
*   **Multi-Stage Builds:** Leveraged multi-stage builds to separate build-time dependencies from the final runtime image, resulting in smaller and more secure production images.
*   **Secure Health Checks:** Implemented more secure `HEALTHCHECK` commands, avoiding tools like `curl` or `wget` where simpler checks suffice (e.g., checking process status or using built-in health check endpoints).
*   **Optimized Package Installation:** Used flags like `--no-cache-dir` (pip) to avoid storing unnecessary cache data within the image layers.

These improvements were applied to the Dockerfiles for the following services:
*   `Phos.Api`
*   `rn-dashboard`
*   `Phos.Identity`
*   `Phos.AlertsStreamer`
*   `Phos.ApiGateway`
*   `Phos.DeviceGateway`
*   `Phos.Services`
*   `Phos.TelemetryProcessor`
*   `ai-engine`
*   `nurse-assistant`
*   `Phos.PatientPortal`
*   `Phos.Web`

## 2. Kubernetes Manifest Hardening (Helm Charts)

The Helm charts for the `api` and `identity` services were updated to address critical security vulnerabilities and enforce stricter configurations:

*   **Removed Hardcoded Secrets:** Eliminated hardcoded Vault tokens (`vault.token: "phos-root-token"`) from `values.yaml` files, preventing sensitive credentials from being stored in version control.
*   **Secure Secret Injection (Vault Agent):** Configured deployments to use the Vault Agent Injector with the Kubernetes authentication method. Pods now authenticate to Vault using their Service Account Token (SAT) and receive secrets securely via annotations (`vault.hashicorp.com/agent-inject: 'true'`, `vault.hashicorp.com/role`, `vault.hashicorp.com/agent-inject-secret-*`), replacing the insecure injection of `VAULT_TOKEN` as an environment variable.
*   **Stricter Security Contexts:** Implemented Pod and Container `securityContext` settings in `deployment.yaml` templates to enforce the principle of least privilege:
    *   `runAsNonRoot: true`: Prevents containers from running as root.
    *   `allowPrivilegeEscalation: false`: Disables privilege escalation.
    *   `seccompProfile: { type: RuntimeDefault }`: Applies the default seccomp profile for the container runtime, blocking risky syscalls.
    *   `capabilities: { drop: ["ALL"] }`: Drops all default Linux capabilities, reducing the potential impact of a container breakout.

## 3. CI/CD Pipeline Security (GitHub Actions)

Security was enhanced across the GitHub Actions workflows (`ci-cd.yml`, `docker-ci.yml`, `db-migrations.yml`):

*   **Least Privilege Permissions:** Set default read-only permissions (`permissions: read` or `permissions: contents: read`) at the workflow level. Specific write permissions (`contents: write`, `packages: write`, `id-token: write`) are granted only to the jobs that require them.
*   **Pinned Action Versions:** Replaced floating version tags (e.g., `@v3`, `@v4`) with specific commit SHAs (e.g., `actions/checkout@85e6279`, `actions/setup-dotnet@267870a`) or immutable version tags (e.g., `@v4.3.1`) for all used GitHub Actions. This prevents unexpected changes or potential compromises introduced in newer, unverified action versions.
*   **Secure Secret Handling:**
    *   Removed hardcoded Vault tokens from workflow files (`docker-ci.yml`).
    *   Scoped sensitive secrets (like database connection strings in `db-migrations.yml`) to the environment (`env:`) of specific steps, minimizing their exposure compared to exporting them directly in `run` blocks.
*   **Vulnerability Scanning:** Integrated and configured Trivy (`aquasecurity/trivy-action`) in `docker-ci.yml` to scan container images for vulnerabilities, failing the build on `CRITICAL` or `HIGH` severity findings.
*   **Workflow Optimization:** Added `--no-build` flag to `dotnet ef database update` in `db-migrations.yml` to avoid potentially redundant build steps during migration application.

These combined measures significantly improve the security posture of the Phos Healthcare Platform's containerization, deployment, and CI/CD processes.

