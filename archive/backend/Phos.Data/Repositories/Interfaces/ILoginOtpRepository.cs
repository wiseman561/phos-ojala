using System;
using System.Threading.Tasks;
using Phos.Data.Entities;

namespace Phos.Data.Repositories.Interfaces
{
    public interface ILoginOtpRepository
    {
        Task<LoginOtpRequest?> GetByIdAsync(Guid id);
        Task CreateAsync(LoginOtpRequest request);
        Task DeleteAsync(Guid id);
    }
} 