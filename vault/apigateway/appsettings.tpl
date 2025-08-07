{{- with secret "phos-secrets/apigateway" -}}
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
  "ApiGatewaySettings": {
    "ApiBaseUrl": "{{ .Data.data.ApiGatewaySettings_ApiBaseUrl }}",
    "IdentityBaseUrl": "{{ .Data.data.ApiGatewaySettings_IdentityBaseUrl }}"
  },
  "JwtSettings": {
    "SecretKey": "{{ .Data.data.JwtSettings_SecretKey }}",
    "Issuer": "{{ .Data.data.JwtSettings_Issuer }}",
    "Audience": "{{ .Data.data.JwtSettings_Audience }}",
    "ExpiryInMinutes": {{ .Data.data.JwtSettings_ExpiryInMinutes }}
  }
}
{{- end -}}
