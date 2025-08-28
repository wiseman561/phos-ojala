using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Phos.Identity.Services.Interfaces;

namespace Phos.Identity.Services
{
    public class EmailService : IEmailService
    {
        private readonly ILogger<EmailService> _logger;

        public EmailService(ILogger<EmailService> logger)
        {
            _logger = logger;
        }

        public async Task SendTwoFactorCodeAsync(string email, string code)
        {
            // TODO: Implement actual email sending logic
            // For now, just log the code
            _logger.LogInformation("2FA code {Code} sent to {Email}", code, email);
            await Task.CompletedTask;
        }
    }
} 