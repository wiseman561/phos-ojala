using System;
using System.Threading.Tasks;
using Phos.Data.Entities;

namespace Phos.Data.Repositories.Interfaces
{
    public interface IUserProfileRepository
    {
        Task<UserProfile?> GetByUserIdAsync(string userId);
        Task<UserProfile> CreateAsync(UserProfile profile);
        Task<UserProfile> UpdateAsync(UserProfile profile);
        Task<bool> DeleteAsync(string id);
    }
} 