using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Serilog;
using Serilog.Events;
using System;
using System.IO;

namespace Phos.ApiGateway
{
    public class Program
    {
        public static void Main(string[] args)
        {
            // Configure Serilog
            Log.Logger = new LoggerConfiguration()
                .MinimumLevel.Debug()
                .MinimumLevel.Override("Microsoft", LogEventLevel.Information)
                .Enrich.FromLogContext()
                .WriteTo.Console()
                .WriteTo.File(Path.Combine("logs", "api-gateway-.log"), rollingInterval: RollingInterval.Day)
                .CreateLogger();

            try
            {
                Log.Information("Starting Phos API Gateway");
                CreateHostBuilder(args).Build().Run();
            }
            catch (Exception ex)
            {
                Log.Fatal(ex, "API Gateway terminated unexpectedly");
            }
            finally
            {
                Log.CloseAndFlush();
            }
        }

        public static IHostBuilder CreateHostBuilder(string[] args) =>
            Host.CreateDefaultBuilder(args)
                .ConfigureAppConfiguration((hostingContext, config) =>
                {
                    config
                        .SetBasePath(hostingContext.HostingEnvironment.ContentRootPath)
                        .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
                        .AddJsonFile($"appsettings.{hostingContext.HostingEnvironment.EnvironmentName}.json", optional: true, reloadOnChange: true)
                        .AddJsonFile("ocelot.json", optional: false, reloadOnChange: true)
                        .AddJsonFile($"ocelot.{hostingContext.HostingEnvironment.EnvironmentName}.json", optional: true, reloadOnChange: true)
                        .AddEnvironmentVariables();

                    // Add Vault configuration if enabled
                    if (bool.TryParse(config.Build()["Vault:Enabled"], out bool vaultEnabled) && vaultEnabled)
                    {
                        var vaultConfig = config.Build().GetSection("Vault");
                        config.AddVaultConfiguration(options =>
                        {
                            options.VaultUrl = vaultConfig["Url"];
                            options.SecretPath = vaultConfig["SecretPath"];
                            options.AuthType = vaultConfig["AuthType"];
                            options.RoleId = vaultConfig["RoleId"];
                            options.SecretId = vaultConfig["SecretId"];
                        });
                    }
                })
                .ConfigureWebHostDefaults(webBuilder =>
                {
                    webBuilder.UseStartup<Startup>();
                    webBuilder.UseKestrel(options =>
                    {
                        options.Limits.MaxRequestBodySize = 104857600; // 100 MB
                    });
                })
                .UseSerilog();
    }
}
