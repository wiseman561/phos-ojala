using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Phos.Data;
using System;

namespace Phos.Api.Extensions
{
    public static class DatabaseExtensions
    {
        /// <summary>
        /// Applies any pending migrations for the context to the database.
        /// Will create the database if it does not already exist.
        /// </summary>
        public static IHost MigrateDatabase(this IHost host)
        {
            using (var scope = host.Services.CreateScope())
            {
                var services = scope.ServiceProvider;
                try
                {
                    var context = services.GetRequiredService<PhosDbContext>();

                    // Apply migrations if they exist
                    if (context.Database.GetPendingMigrations().Any())
                    {
                        Console.WriteLine("Applying pending database migrations...");
                        context.Database.Migrate();
                        Console.WriteLine("Database migrations applied successfully.");
                    }
                    else
                    {
                        Console.WriteLine("No pending database migrations found.");
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"An error occurred while migrating the database: {ex.Message}");
                    // In a production environment, you might want to log this error
                    // or potentially rethrow depending on your error handling strategy
                }
            }
            return host;
        }
    }
}
