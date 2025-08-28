using System.Collections.Generic;
using Microsoft.AspNetCore.Identity;

namespace Phos.Identity.Models
{
    public class AuthResult
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public IEnumerable<IdentityError> Errors { get; set; }
        public string Token { get; set; } = string.Empty;
        public string RefreshToken { get; set; } = string.Empty;
        public UserDto? User { get; set; }

        public AuthResult()
        {
            Errors = new List<IdentityError>();
        }
    }
}
