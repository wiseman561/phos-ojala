using System;
using System.IO;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Ojala.Api.Extensions
{
    public static class VaultExtensions
    {
        public static IServiceCollection AddVaultAuthentication(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddSingleton<IVaultService, KubernetesVaultService>();
            return services;
        }
    }

    public interface IVaultService
    {
        Task<string> GetVaultTokenAsync();
    }

    public class KubernetesVaultService : IVaultService
    {
        private readonly string _vaultAddr;
        private readonly string _vaultPath;
        private readonly string _serviceAccountTokenPath = "/var/run/secrets/kubernetes.io/serviceaccount/token";
        private readonly string _k8sRole;
        private string _cachedToken;
        private DateTime _tokenExpiry = DateTime.MinValue;

        public KubernetesVaultService()
        {
            _vaultAddr = Environment.GetEnvironmentVariable("VAULT_ADDR") ?? "http://vault:8200";
            _vaultPath = Environment.GetEnvironmentVariable("VAULT_PATH") ?? "ojala-secrets";
            _k8sRole = Environment.GetEnvironmentVariable("VAULT_K8S_ROLE") ?? "api-role";
        }

        public async Task<string> GetVaultTokenAsync()
        {
            // If we have a cached token that's still valid, return it
            if (!string.IsNullOrEmpty(_cachedToken) && DateTime.UtcNow < _tokenExpiry)
            {
                return _cachedToken;
            }

            // Check if we're running in Kubernetes
            if (!File.Exists(_serviceAccountTokenPath))
            {
                // Not running in Kubernetes, use the root token for development
                var devToken = Environment.GetEnvironmentVariable("VAULT_TOKEN");
                if (!string.IsNullOrEmpty(devToken))
                {
                    _cachedToken = devToken;
                    _tokenExpiry = DateTime.UtcNow.AddHours(1); // Assume 1 hour validity for dev token
                    return devToken;
                }

                throw new InvalidOperationException("Not running in Kubernetes and no VAULT_TOKEN provided");
            }

            // Read the Kubernetes service account token
            var jwt = await File.ReadAllTextAsync(_serviceAccountTokenPath);

            // Authenticate to Vault using Kubernetes auth method
            using var httpClient = new HttpClient();
            httpClient.BaseAddress = new Uri(_vaultAddr);

            var requestData = new
            {
                jwt = jwt,
                role = _k8sRole
            };

            var content = new StringContent(
                JsonSerializer.Serialize(requestData),
                Encoding.UTF8,
                "application/json");

            var response = await httpClient.PostAsync("/v1/auth/kubernetes/login", content);
            response.EnsureSuccessStatusCode();

            var responseContent = await response.Content.ReadAsStringAsync();
            var responseJson = JsonDocument.Parse(responseContent);

            var token = responseJson.RootElement
                .GetProperty("auth")
                .GetProperty("client_token")
                .GetString();

            var leaseDuration = responseJson.RootElement
                .GetProperty("auth")
                .GetProperty("lease_duration")
                .GetInt32();

            _cachedToken = token;
            _tokenExpiry = DateTime.UtcNow.AddSeconds(leaseDuration * 0.8); // Renew at 80% of lease time

            return token;
        }
    }
}
