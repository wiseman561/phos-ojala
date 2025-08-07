namespace Phos.Contracts.Models
{
    public class HealthScoreData
    {
        public string PatientId { get; set; } = null!;
        public double Score { get; set; }
        public string Status { get; set; } = null!;
        public DateTime DateRecorded { get; set; }
    }
}
