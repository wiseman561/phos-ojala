using System.Threading.Tasks;

namespace Phos.Identity.Services.Interfaces
{
    public interface IEmailService
    {
        Task SendTwoFactorCodeAsync(string email, string code);
    }
} 