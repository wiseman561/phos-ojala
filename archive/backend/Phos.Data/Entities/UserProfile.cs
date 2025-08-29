using System;

namespace Phos.Data.Entities
{
    public class UserProfile
    {
        public string Id { get; set; } = string.Empty;   // non-nullable default
        public string FirstName { get; set; } = "";
        public string LastName  { get; set; } = "";
        public ApplicationUser? User { get; set; }
    }
} 