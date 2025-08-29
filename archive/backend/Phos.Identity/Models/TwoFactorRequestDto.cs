using System;
using System.ComponentModel.DataAnnotations;

namespace Phos.Identity.Models
{
    public class TwoFactorRequestDto
    {
        [Required]
        public required Guid RequestId { get; set; }

        [Required]
        [StringLength(6, MinimumLength = 6, ErrorMessage = "Code must be exactly 6 digits")]
        [RegularExpression(@"^\d{6}$", ErrorMessage = "Code must contain only digits")]
        public required string Code { get; set; }
    }
} 