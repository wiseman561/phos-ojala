namespace Phos.Identity.Models
{
    public class TwoFactorResponseDto
    {
        public required string Token { get; set; }
        public required string RefreshToken { get; set; }
    }
} 