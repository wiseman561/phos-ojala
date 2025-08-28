namespace Phos.Identity.Models
{
    public class LoginRequest
    {
        public required string Email { get; set; }
        public required string Password { get; set; }
        public bool RememberMe { get; set; }
    }
}
