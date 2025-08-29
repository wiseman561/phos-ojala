using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;

namespace Phos.Common.Email
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;

        public EmailService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public async Task SendEmailAsync(string to, string subject, string body)
        {
            await SendEmailAsync(to, subject, body, false);
        }

        public async Task SendEmailAsync(string to, string subject, string body, bool isHtml)
        {
            // TODO: Implement actual email sending logic
            // For now, just log the email details
            System.Console.WriteLine($"Sending email to: {to}");
            System.Console.WriteLine($"Subject: {subject}");
            System.Console.WriteLine($"Body: {body}");
            System.Console.WriteLine($"IsHtml: {isHtml}");
            
            await Task.CompletedTask;
        }
    }
} 