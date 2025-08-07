{{- with secret "phos-secrets/api" -}}
{
  "secret": "{{ .Data.data.JwtSettings_SecretKey }}",
  "issuer": "{{ .Data.data.JwtSettings_Issuer }}",
  "audience": "{{ .Data.data.JwtSettings_Audience }}",
  "expiryInMinutes": {{ .Data.data.JwtSettings_ExpiryInMinutes }}
}
{{- end -}}
