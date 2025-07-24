using System;
using System.Collections.Generic;

namespace Ojala.Contracts.Events
{
    /// <summary>
    /// Event published when a new user is registered in the system
    /// </summary>
    public class UserRegisteredEvent
    {
        /// <summary>
        /// Unique identifier for the user
        /// </summary>
        public string UserId { get; set; } = string.Empty;

        /// <summary>
        /// User's email address
        /// </summary>
        public string Email { get; set; } = string.Empty;

        /// <summary>
        /// User's role in the system (e.g., "Patient", "Provider", "Admin")
        /// </summary>
        public string Role { get; set; } = string.Empty;

        /// <summary>
        /// User's first name
        /// </summary>
        public string FirstName { get; set; } = string.Empty;

        /// <summary>
        /// User's last name
        /// </summary>
        public string LastName { get; set; } = string.Empty;

        /// <summary>
        /// Timestamp when the user was registered
        /// </summary>
        public DateTime RegisteredAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Additional metadata that might be useful for event handlers
        /// </summary>
        public Dictionary<string, object> Metadata { get; set; } = new Dictionary<string, object>();
    }
}
