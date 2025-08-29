using System;
using System.Collections.Generic;

namespace Phos.Data.Entities
{
    public class Medication
    {
        public string? Id { get; set; }
        public string? Name { get; set; }
        public string? Description { get; set; }
        public string? Dosage { get; set; }
        public string? Manufacturer { get; set; }
        public bool RequiresPrescription { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        // Navigation properties
        public virtual ICollection<Prescription> Prescriptions { get; set; } = new List<Prescription>();
    }
}
