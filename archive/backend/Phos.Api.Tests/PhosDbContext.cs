using Microsoft.EntityFrameworkCore;
using Phos.Data.Entities;
using Phos.Data.Models;

namespace Phos.Data
{
    public class PhosDbContext : DbContext
    {
        public PhosDbContext(DbContextOptions<PhosDbContext> options) : base(options)
        {
        }

        public DbSet<Patient> Patients { get; set; } = null!;
        public DbSet<Appointment> Appointments { get; set; } = null!;
        public DbSet<MedicalRecord> MedicalRecords { get; set; } = null!;
        public DbSet<HealthcarePlan> HealthcarePlans { get; set; } = null!;
        public DbSet<Provider> Providers { get; set; } = null!;
        public DbSet<Medication> Medications { get; set; } = null!;
        public DbSet<Prescription> Prescriptions { get; set; } = null!;
        public DbSet<EscalatedAlert> EscalatedAlerts { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Patient configuration
            modelBuilder.Entity<Patient>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.FirstName).IsRequired().HasMaxLength(100);
                entity.Property(e => e.LastName).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Email).HasMaxLength(255);
                entity.Property(e => e.PhoneNumber).HasMaxLength(20);
                entity.Property(e => e.DateOfBirth).IsRequired();
                entity.Property(e => e.Gender).HasMaxLength(20);
                entity.Property(e => e.Address).HasMaxLength(500);
                entity.Property(e => e.EmergencyContactName).HasMaxLength(200);
                entity.Property(e => e.EmergencyContactPhone).HasMaxLength(20);
                entity.Property(e => e.CreatedAt).IsRequired();
                entity.Property(e => e.UpdatedAt).IsRequired();
            });

            // Provider configuration
            modelBuilder.Entity<Provider>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.FirstName).IsRequired().HasMaxLength(100);
                entity.Property(e => e.LastName).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Email).HasMaxLength(255);
                entity.Property(e => e.PhoneNumber).HasMaxLength(20);
                entity.Property(e => e.Specialty).HasMaxLength(100);
                entity.Property(e => e.LicenseNumber).HasMaxLength(50);
                entity.Property(e => e.CreatedAt).IsRequired();
                entity.Property(e => e.UpdatedAt).IsRequired();
            });

            // Appointment configuration
            modelBuilder.Entity<Appointment>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.AppointmentDate).IsRequired();
                entity.Property(e => e.Duration).IsRequired();
                entity.Property(e => e.Status).HasMaxLength(50);
                entity.Property(e => e.Notes).HasMaxLength(1000);
                entity.Property(e => e.CreatedAt).IsRequired();
                entity.Property(e => e.UpdatedAt).IsRequired();

                entity.HasOne(e => e.Patient)
                    .WithMany(p => p.Appointments)
                    .HasForeignKey(e => e.PatientId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.Provider)
                    .WithMany(p => p.Appointments)
                    .HasForeignKey(e => e.ProviderId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // MedicalRecord configuration
            modelBuilder.Entity<MedicalRecord>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.RecordDate).IsRequired();
                entity.Property(e => e.Diagnosis).HasMaxLength(500);
                entity.Property(e => e.Treatment).HasMaxLength(1000);
                entity.Property(e => e.Notes).HasMaxLength(2000);
                entity.Property(e => e.CreatedAt).IsRequired();
                entity.Property(e => e.UpdatedAt).IsRequired();

                entity.HasOne(e => e.Patient)
                    .WithMany(p => p.MedicalRecords)
                    .HasForeignKey(e => e.PatientId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.Provider)
                    .WithMany(p => p.MedicalRecords)
                    .HasForeignKey(e => e.ProviderId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // HealthcarePlan configuration
            modelBuilder.Entity<HealthcarePlan>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.PlanName).IsRequired().HasMaxLength(100);
                entity.Property(e => e.PlanType).HasMaxLength(50);
                entity.Property(e => e.CoverageDetails).HasMaxLength(1000);
                entity.Property(e => e.StartDate).IsRequired();
                entity.Property(e => e.EndDate);
                entity.Property(e => e.CreatedAt).IsRequired();
                entity.Property(e => e.UpdatedAt).IsRequired();

                entity.HasOne(e => e.Patient)
                    .WithMany(p => p.HealthcarePlans)
                    .HasForeignKey(e => e.PatientId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Medication configuration
            modelBuilder.Entity<Medication>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Description).HasMaxLength(500);
                entity.Property(e => e.Dosage).HasMaxLength(100);
                entity.Property(e => e.Manufacturer).HasMaxLength(100);
                entity.Property(e => e.CreatedAt).IsRequired();
                entity.Property(e => e.UpdatedAt).IsRequired();
            });

            // Prescription configuration
            modelBuilder.Entity<Prescription>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.PrescriptionDate).IsRequired();
                entity.Property(e => e.Dosage).HasMaxLength(100);
                entity.Property(e => e.Frequency).HasMaxLength(100);
                entity.Property(e => e.Duration).HasMaxLength(100);
                entity.Property(e => e.Notes).HasMaxLength(500);
                entity.Property(e => e.CreatedAt).IsRequired();
                entity.Property(e => e.UpdatedAt).IsRequired();

                entity.HasOne(e => e.Patient)
                    .WithMany(p => p.Prescriptions)
                    .HasForeignKey(e => e.PatientId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.Provider)
                    .WithMany(p => p.Prescriptions)
                    .HasForeignKey(e => e.ProviderId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.Medication)
                    .WithMany(m => m.Prescriptions)
                    .HasForeignKey(e => e.MedicationId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // EscalatedAlert configuration
            modelBuilder.Entity<EscalatedAlert>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.PatientId).IsRequired().HasMaxLength(100);
                entity.Property(e => e.DeviceId).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Metric).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Value).IsRequired();
                entity.Property(e => e.Timestamp).IsRequired();
                entity.Property(e => e.Severity).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Message).HasMaxLength(500);
                entity.Property(e => e.CreatedAt).IsRequired();
                entity.Property(e => e.IsAcknowledged).IsRequired();
                entity.Property(e => e.AcknowledgedAt);
                entity.Property(e => e.AcknowledgedBy).HasMaxLength(100);
            });
        }
    }
}
