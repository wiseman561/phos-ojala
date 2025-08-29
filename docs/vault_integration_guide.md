# Vault Integration Guide for PhosHealthcarePlatform

## Overview

This document provides guidance on integrating HashiCorp Vault with the PhosHealthcarePlatform for secure secrets management. Vault will be used to store and manage sensitive information such as database credentials, API keys, and JWT tokens.

## Architecture

The Vault deployment consists of:
- 3 Vault server instances in an auto-scaling group for high availability
- AWS KMS for auto-unsealing
- Load balancer for distributing requests
- IAM roles and policies for secure access
- Separate policies for API and Web applications

## Setup Instructions

### Prerequisites

- AWS account with appropriate permissions
- Terraform installed (version 1.0.0+)
- AWS CLI configured
- SSH key pair for EC2 instances

### Deployment Steps

1. Initialize the Terraform backend:
```bash
terraform init
```

2. Create a `terraform.tfvars` file with your specific values:
```
aws_region = "us-east-1"
environment = "dev"
vpc_id = "vpc-xxxxxxxx"
vpc_cidr = "10.0.0.0/16"
subnet_ids = ["subnet-xxxxxxxx", "subnet-yyyyyyyy", "subnet-zzzzzzzz"]
vault_ami = "ami-xxxxxxxxxxxxxxxxx"
key_name = "your-ssh-key"
certificate_arn = "arn:aws:acm:us-east-1:xxxxxxxxxxxx:certificate/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

3. Review the plan:
```bash
terraform plan
```

4. Apply the configuration:
```bash
terraform apply
```

5. After deployment, retrieve the initial root token and unseal keys from the `vault_init.json` file generated on the Terraform machine.

## Integration with PhosHealthcarePlatform

### Backend Integration (Phos.Api)

1. Install the Vault client package:
```bash
dotnet add package VaultSharp
```

2. Add Vault configuration to `appsettings.json`:
```json
{
  "Vault": {
    "Address": "https://vault.phos-healthcare.com",
    "Role": "phos-api",
    "MountPath": "phos/kv",
    "SecretPath": "database/connection"
  }
}
```

3. Create a Vault service in `Phos.Services`:
```csharp
public interface IVaultService
{
    Task<string> GetSecret(string path);
    Task<Dictionary<string, object>> GetSecrets(string path);
}

public class VaultService : IVaultService
{
    private readonly IVaultClient _vaultClient;
    private readonly string _mountPath;
    
    public VaultService(IConfiguration configuration)
    {
        var vaultConfig = new VaultClientSettings(
            configuration["Vault:Address"],
            new TokenAuthMethodInfo(Environment.GetEnvironmentVariable("VAULT_TOKEN"))
        );
        
        _vaultClient = new VaultClient(vaultConfig);
        _mountPath = configuration["Vault:MountPath"];
    }
    
    public async Task<string> GetSecret(string path)
    {
        var secret = await _vaultClient.V1.Secrets.KeyValue.V2.ReadSecretAsync(
            path, 
            mountPoint: _mountPath
        );
        
        return secret.Data.Data.FirstOrDefault().Value.ToString();
    }
    
    public async Task<Dictionary<string, object>> GetSecrets(string path)
    {
        var secret = await _vaultClient.V1.Secrets.KeyValue.V2.ReadSecretAsync(
            path, 
            mountPoint: _mountPath
        );
        
        return secret.Data.Data;
    }
}
```

4. Register the service in `Startup.cs`:
```csharp
services.AddSingleton<IVaultService, VaultService>();
```

5. Use the service to retrieve secrets:
```csharp
public class DatabaseService
{
    private readonly IVaultService _vaultService;
    
    public DatabaseService(IVaultService vaultService)
    {
        _vaultService = vaultService;
    }
    
    public async Task<string> GetConnectionString()
    {
        return await _vaultService.GetSecret("database/connection");
    }
}
```

### Frontend Integration (Phos.Web)

1. Create a Vault API endpoint in the backend:
```csharp
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ConfigController : ControllerBase
{
    private readonly IVaultService _vaultService;
    
    public ConfigController(IVaultService vaultService)
    {
        _vaultService = vaultService;
    }
    
    [HttpGet("frontend")]
    public async Task<IActionResult> GetFrontendConfig()
    {
        var config = await _vaultService.GetSecrets("web-config/frontend");
        return Ok(config);
    }
}
```

2. In the React application, fetch configuration on startup:
```javascript
// src/api/configService.js
export const fetchConfig = async () => {
  const response = await fetch('/api/config/frontend', {
    headers: {
      'Authorization': `Bearer ${getToken()}`
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch configuration');
  }
  
  return response.json();
};

// src/App.js
import { fetchConfig } from './api/configService';
import { useEffect, useState } from 'react';

function App() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchConfig()
      .then(config => {
        setConfig(config);
        setLoading(false);
      })
      .catch(error => {
        console.error('Failed to load configuration:', error);
        setLoading(false);
      });
  }, []);
  
  if (loading) {
    return <div>Loading configuration...</div>;
  }
  
  return (
    // Application with config
  );
}
```

## Security Considerations

1. **Token Management**: Never hardcode Vault tokens. Use environment variables or instance profiles.
2. **Least Privilege**: Use specific policies for each service to limit access.
3. **Token Renewal**: Implement token renewal logic to prevent expiration.
4. **Audit Logging**: Enable audit logging in Vault to track access.
5. **Secrets Rotation**: Implement periodic rotation of secrets.

## Troubleshooting

1. **Connection Issues**: Verify network connectivity and security group rules.
2. **Authentication Failures**: Check token validity and permissions.
3. **Unsealing**: If Vault becomes sealed, use the unseal keys or verify KMS access.
4. **Performance**: Monitor Vault metrics and scale if necessary.

## Maintenance

1. **Upgrades**: Follow HashiCorp's upgrade guide for Vault version updates.
2. **Backup**: Regularly backup Vault data and configuration.
3. **Monitoring**: Set up alerts for Vault health and performance metrics.
