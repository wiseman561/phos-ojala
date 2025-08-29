using System;
using System.IO;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Phos.Identity.Extensions
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
        private string? _cachedToken = null;
        private DateTime _tokenExpiry = DateTime.MinValue;

        public KubernetesVaultService()
        {
            _vaultAddr = Environment.GetEnvironmentVariable("VAULT_ADDR") ?? "http://vault:8200";
            _vaultPath = Environment.GetEnvironmentVariable("VAULT_PATH") ?? "phos-secrets";
            _k8sRole = Environment.GetEnvironmentVariable("VAULT_K8S_ROLE") ?? "identity-role";
        }

        public async Task<string> GetVaultTokenAsync()
        {
            if (!string.IsNullOrEmpty(_cachedToken) && DateTime.UtcNow < _tokenExpiry)
            {
                return _cachedToken;
            }

            if (!File.Exists(_serviceAccountTokenPath))
            {
                var devToken = Environment.GetEnvironmentVariable("VAULT_TOKEN");
                if (!string.IsNullOrEmpty(devToken))
                {
                    _cachedToken = devToken;
                    _tokenExpiry = DateTime.UtcNow.AddHours(1);
                    return devToken;
                }

                throw new InvalidOperationException("Not running in Kubernetes and no VAULT_TOKEN provided");
            }

            var jwt = await File.ReadAllTextAsync(_serviceAccountTokenPath);

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

            string? token = responseJson.RootElement
                .GetProperty("auth")
                .GetProperty("client_token")
                .GetString();

            if (string.IsNullOrEmpty(token))
                throw new InvalidOperationException("Vault did not return a valid token");

            var leaseDuration = responseJson.RootElement
                .GetProperty("auth")
                .GetProperty("lease_duration")
                .GetInt32();

            _cachedToken = token;
            _tokenExpiry = DateTime.UtcNow.AddSeconds(leaseDuration * 0.8);

            return token;
        }
    }
}
