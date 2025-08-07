{{- with secret "phos-secrets/api" -}}
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
  "FeatureManagement": {
    "AIIntegration": {{ .Data.data.FeatureManagement_AIIntegration }},
    "AdvancedAnalytics": {{ .Data.data.FeatureManagement_AdvancedAnalytics }},
    "TeleHealth": {{ .Data.data.FeatureManagement_TeleHealth }},
    "PatientPortal": {{ .Data.data.FeatureManagement_PatientPortal }}
  },
  "EmailSettings": {
    "SmtpServer": "{{ .Data.data.EmailSettings_SmtpServer }}",
    "SmtpPort": {{ .Data.data.EmailSettings_SmtpPort }},
    "SenderEmail": "{{ .Data.data.EmailSettings_SenderEmail }}",
    "SenderName": "{{ .Data.data.EmailSettings_SenderName }}"
  },
  "VaultSettings": {
    "Url": "{{ .Data.data.VaultSettings_Url }}",
    "MountPath": "{{ .Data.data.VaultSettings_MountPath }}"
  }
}
{{- end -}}
