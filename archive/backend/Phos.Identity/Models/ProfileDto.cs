using System;

namespace Phos.Identity.Models
{
    public class ProfileDto
    {
        public required string Id { get; set; }
        public required string Email { get; set; }
        public required string Username { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public required DateTime CreatedAt { get; set; }
        public DateTime? LastLoginAt { get; set; }
    }
} 