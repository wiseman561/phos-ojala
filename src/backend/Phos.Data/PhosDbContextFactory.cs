using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;
using System.IO;

namespace Phos.Data
{
    public class PhosDbContextFactory : IDesignTimeDbContextFactory<PhosDbContext>
    {
        public PhosDbContext CreateDbContext(string[] args)
        {
            // Get connection string from environment variable
            var connectionString = Environment.GetEnvironmentVariable("DB_CONNECTION_STRING");

            // Create DbContext options
            var optionsBuilder = new DbContextOptionsBuilder<PhosDbContext>();
            optionsBuilder.UseNpgsql(connectionString);

            return new PhosDbContext(optionsBuilder.Options);
        }
    }
}
