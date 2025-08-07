{{- with secret "phos-secrets/identity" -}}
{
  "ConnectionStrings": {
    "DefaultConnection": "{{ .Data.data.ConnectionStrings_DefaultConnection }}"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft": "Warning",
      "Microsoft.Hosting.Lifetime": "Information"
    }
  },
  "AllowedHosts": "*",
  "JwtSettings": {
    "SecretKey": "{{ .Data.data.JwtSettings_SecretKey }}",
    "Issuer": "{{ .Data.data.JwtSettings_Issuer }}",
    "Audience": "{{ .Data.data.JwtSettings_Audience }}",
    "ExpiryInMinutes": {{ .Data.data.JwtSettings_ExpiryInMinutes }}
  },
  "IdentitySettings": {
    "RequireConfirmedEmail": {{ .Data.data.IdentitySettings_RequireConfirmedEmail }},
    "LockoutMaxFailedAttempts": {{ .Data.data.IdentitySettings_LockoutMaxFailedAttempts }},
    "LockoutDefaultLockoutMinutes": {{ .Data.data.IdentitySettings_LockoutDefaultLockoutMinutes }}
  }
}
{{- end -}}
