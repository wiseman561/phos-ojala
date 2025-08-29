@echo off
REM Vault initialization script for Phos API (Windows)
REM This script sets up Vault with JWT secrets and AppRole authentication

setlocal enabledelayedexpansion

REM Configuration
set VAULT_ADDR=http://localhost:8200
set VAULT_TOKEN=phos-dev-token
set SECRET_PATH=secret/jwt-secret
set POLICY_NAME=phos-api-policy
set ROLE_NAME=phos-api-role

echo 🔐 Initializing Vault for Phos API...

REM Wait for Vault to be ready
echo ⏳ Waiting for Vault to be ready...
:wait_loop
vault status >nul 2>&1
if errorlevel 1 (
    echo Vault not ready, waiting...
    timeout /t 2 /nobreak >nul
    goto wait_loop
)

echo ✅ Vault is ready!

REM Enable KV secrets engine if not already enabled
echo 📦 Enabling KV secrets engine...
vault secrets enable -path=secret kv-v2 2>nul || echo KV secrets engine already enabled

REM Create JWT secret
echo 🔑 Creating JWT secret...
vault kv put %SECRET_PATH% ^
    secret="Z4tccK0JGnd7MwnUVTstw4jl0MXeRcIyi50SQFnPh0E=" ^
    issuer="PhosHealthcarePlatform" ^
    audience="PhosHealthcarePlatformClients" ^
    expiry_minutes="60"

echo ✅ JWT secret created at %SECRET_PATH%

REM Create policy
echo 📋 Creating Vault policy...
vault policy write %POLICY_NAME% vault/policies/phos-api-policy.hcl

echo ✅ Policy '%POLICY_NAME%' created

REM Enable AppRole auth method
echo 🔐 Enabling AppRole authentication...
vault auth enable approle 2>nul || echo AppRole auth method already enabled

REM Create AppRole
echo 👤 Creating AppRole...
vault write auth/approle/role/%ROLE_NAME% ^
    token_policies=%POLICY_NAME% ^
    token_ttl=1h ^
    token_max_ttl=4h

echo ✅ AppRole '%ROLE_NAME%' created

REM Get Role ID
echo 🆔 Getting Role ID...
for /f "tokens=*" %%i in ('vault read -format=json auth/approle/role/%ROLE_NAME%/role-id ^| jq -r ".data.role_id"') do set ROLE_ID=%%i
echo !ROLE_ID! > vault/role-id
echo ✅ Role ID saved to vault/role-id

REM Generate Secret ID
echo 🔒 Generating Secret ID...
for /f "tokens=*" %%i in ('vault write -format=json -f auth/approle/role/%ROLE_NAME%/secret-id ^| jq -r ".data.secret_id"') do set SECRET_ID=%%i
echo !SECRET_ID! > vault/secret-id
echo ✅ Secret ID saved to vault/secret-id

echo 🎉 Vault initialization complete!
echo.
echo 📋 Summary:
echo   - JWT Secret: %SECRET_PATH%
echo   - Policy: %POLICY_NAME%
echo   - AppRole: %ROLE_NAME%
echo   - Role ID: vault/role-id
echo   - Secret ID: vault/secret-id
echo.
echo 🚀 You can now start the application with:
echo    docker-compose up
