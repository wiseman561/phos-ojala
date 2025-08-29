using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using System;
using System.IO;
using System.Threading.Tasks;

namespace Phos.Common.Extensions
{
    /// <summary>
    /// Extension methods for Vault integration
    /// </summary>
    public static class VaultExtensions
    {
        /// <summary>
        /// Adds Vault authentication services to the service collection
        /// </summary>
        /// <param name="services">The service collection</param>
        /// <param name="configuration">The configuration</param>
        /// <returns>The service collection for chaining</returns>
        public static IServiceCollection AddVaultAuthentication(this IServiceCollection services, IConfiguration configuration)
        {
            // Add Vault client configuration
            services.Configure<VaultOptions>(options =>
            {
                var section = configuration.GetSection("Vault");
                options.Address = section["Address"] ?? throw new InvalidOperationException("Vault:Address is required");
                options.Token = section["Token"] ?? throw new InvalidOperationException("Vault:Token is required");
                options.RoleId = section["RoleId"];
                options.SecretId = section["SecretId"];
            });

            // Add Vault client service
            services.AddSingleton<IVaultClient, VaultClient>();

            return services;
        }

        /// <summary>
        /// Configures the application to use Vault for secrets management
        /// </summary>
        /// <param name="configuration">The configuration builder</param>
        /// <returns>The configuration builder for chaining</returns>
        public static IConfigurationBuilder AddVaultConfiguration(this IConfigurationBuilder configuration)
        {
            var vaultEnabled = !string.IsNullOrEmpty(Environment.GetEnvironmentVariable("VAULT_ADDR"));
            if (vaultEnabled)
            {
                // Check if we're running in Kubernetes
                var kubernetesServiceHost = Environment.GetEnvironmentVariable("KUBERNETES_SERVICE_HOST");
                var isKubernetes = !string.IsNullOrEmpty(kubernetesServiceHost);

                // Use Vault-provided configuration if available
                var vaultSecretsPath = "/vault/secrets/appsettings.secrets.json";
                if (File.Exists(vaultSecretsPath))
                {
                    configuration.AddJsonFile(vaultSecretsPath, optional: false, reloadOnChange: true);
                    Console.WriteLine("Loaded configuration from Vault secrets");
                }
                else
                {
                    Console.WriteLine("Vault secrets file not found, using default configuration");

                    // In Kubernetes, we would wait for the file to be available
                    // For development with docker-compose, we'll use the token-based auth
                    if (Environment.GetEnvironmentVariable("VAULT_TOKEN") != null)
                    {
                        Console.WriteLine("Using Vault token-based authentication for development");
                    }
                }
            }

            return configuration;
        }
    }

    /// <summary>
    /// Options for Vault configuration
    /// </summary>
    public class VaultOptions
    {
        /// <summary>
        /// Gets or sets the Vault address
        /// </summary>
        public string Address { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the Vault token
        /// </summary>
        public string Token { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the Vault role ID for AppRole authentication
        /// </summary>
        public string? RoleId { get; set; }

        /// <summary>
        /// Gets or sets the Vault secret ID for AppRole authentication
        /// </summary>
        public string? SecretId { get; set; }
    }

    /// <summary>
    /// Interface for Vault client
    /// </summary>
    public interface IVaultClient
    {
        /// <summary>
        /// Gets a secret from Vault
        /// </summary>
        /// <param name="path">The path to the secret</param>
        /// <returns>The secret value</returns>
        Task<string> GetSecretAsync(string path);
    }

    /// <summary>
    /// Implementation of Vault client
    /// </summary>
    public class VaultClient : IVaultClient
    {
        private readonly VaultOptions _options;

        /// <summary>
        /// Initializes a new instance of the <see cref="VaultClient"/> class
        /// </summary>
        /// <param name="options">The Vault options</param>
        public VaultClient(IOptions<VaultOptions> options)
        {
            if (options?.Value == null)
                throw new ArgumentNullException(nameof(options));

            if (string.IsNullOrEmpty(options.Value.Address))
                throw new ArgumentException("Vault address is required", nameof(options));

            if (string.IsNullOrEmpty(options.Value.Token))
                throw new ArgumentException("Vault token is required", nameof(options));

            _options = options.Value;
        }

        /// <inheritdoc/>
        public async Task<string> GetSecretAsync(string path)
        {
            // Implement Vault client logic here
            // This is a placeholder implementation
            return await Task.FromResult(string.Empty);
        }
    }
}
