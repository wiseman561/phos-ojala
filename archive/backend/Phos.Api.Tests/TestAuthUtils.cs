using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace Phos.Api.Tests.Utils // Assuming a Utils namespace
{
    public static class TestAuthUtils
    {
        // --- Test Configuration --- 
        // WARNING: Use dedicated test secrets, do not use production secrets.
        // These should ideally match the configuration used by Phos.Identity during testing.
        private const string TestSecretKey = "TestSecretKeyNeedsToBeLongEnoughForHS256Validation"; // Replace with a secure, long key for testing
        private const string TestIssuer = "TestIssuer";
        private const string TestAudience = "TestAudience";
        // ------------------------

        public static string GenerateJwtToken(string userId, string role, int expiryMinutes = 15)
        {
            return GenerateJwtToken(userId, new List<string> { role }, expiryMinutes);
        }

        public static string GenerateJwtToken(string userId, List<string> roles, int expiryMinutes = 15)
        {
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(TestSecretKey));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, userId),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                // Add other standard claims if needed (e.g., NameIdentifier)
                new Claim(ClaimTypes.NameIdentifier, userId) 
            };

            foreach (var role in roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }

            var token = new JwtSecurityToken(
                issuer: TestIssuer,
                audience: TestAudience,
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(expiryMinutes),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}

