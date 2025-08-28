using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Phos.Data.Entities;
using Phos.Data.Repositories.Interfaces;

namespace Phos.Data.Repositories
{
    public class LoginOtpRepository : ILoginOtpRepository
    {
        private readonly ApplicationDbContext _context;

        public LoginOtpRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<LoginOtpRequest?> GetByIdAsync(Guid id)
        {
            return await _context.LoginOtpRequests
                .FirstOrDefaultAsync(x => x.Id == id);
        }

        public async Task CreateAsync(LoginOtpRequest request)
        {
            await _context.LoginOtpRequests.AddAsync(request);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(Guid id)
        {
            var request = await _context.LoginOtpRequests.FindAsync(id);
            if (request != null)
            {
                _context.LoginOtpRequests.Remove(request);
                await _context.SaveChangesAsync();
            }
        }
    }
} 