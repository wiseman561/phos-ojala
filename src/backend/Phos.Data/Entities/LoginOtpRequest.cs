using System;

namespace Phos.Data.Entities
{
    public class LoginOtpRequest
    {
        public Guid Id { get; set; }
        public required string UserId { get; set; }
        public required string HashedCode { get; set; }
        public DateTime ExpiresAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
} 