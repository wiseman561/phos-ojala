using System.Threading.Tasks;

namespace Phos.Common.Email
{
    public interface IEmailService
    {
        Task SendEmailAsync(string to, string subject, string body);
        Task SendEmailAsync(string to, string subject, string body, bool isHtml);
    }
} 