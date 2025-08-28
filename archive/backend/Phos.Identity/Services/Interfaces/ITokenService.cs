using System.Security.Claims;
using System.Threading.Tasks;
using Phos.Data.Entities;

namespace Phos.Identity.Services.Interfaces
{
    public interface ITokenService
    {
        Task<string> GenerateJwtToken(ApplicationUser user);
        ClaimsPrincipal ValidateToken(string token);
        Task<string> GenerateRefreshToken(ApplicationUser user);
    }
}
