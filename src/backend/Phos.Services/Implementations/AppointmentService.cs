using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Phos.Contracts.DTOs;
using Phos.Services.Interfaces;
using Phos.Data;
using Phos.Data.Entities;
using Phos.Contracts.Models;

namespace Phos.Services.Implementations
{
    public class AppointmentService : IAppointmentService
    {
        private readonly PhosDbContext _dbContext;
        private readonly IMapper _mapper;
        private readonly ILogger<AppointmentService> _logger;

        public AppointmentService(
            PhosDbContext dbContext,
            IMapper mapper,
            ILogger<AppointmentService> logger)
        {
            _dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
            _mapper = mapper ?? throw new ArgumentNullException(nameof(mapper));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        public async Task<IEnumerable<AppointmentDto>> GetAllAppointmentsAsync()
        {
            var entities = await _dbContext.Appointments
                .AsNoTracking()
                .Include(a => a.Patient)
                .Include(a => a.Provider)
                .ToListAsync();

            return _mapper.Map<IEnumerable<AppointmentDto>>(entities);
        }

        public async Task<AppointmentDto?> GetAppointmentByIdAsync(string id)
        {
            var entity = await _dbContext.Appointments
                .AsNoTracking()
                .Include(a => a.Patient)
                .Include(a => a.Provider)
                .FirstOrDefaultAsync(a => a.Id == id);

            return _mapper.Map<AppointmentDto?>(entity);
        }

        public async Task<IEnumerable<AppointmentDto>> GetAppointmentsByPatientIdAsync(string patientId)
        {
            var entities = await _dbContext.Appointments
                .AsNoTracking()
                .Include(a => a.Provider)
                .Where(a => a.PatientId == patientId)
                .ToListAsync();

            return _mapper.Map<IEnumerable<AppointmentDto>>(entities);
        }

        public async Task<IEnumerable<AppointmentDto>> GetAppointmentsByProviderIdAsync(string providerId)
        {
            var entities = await _dbContext.Appointments
                .AsNoTracking()
                .Include(a => a.Patient)
                .Where(a => a.ProviderId == providerId)
                .ToListAsync();

            return _mapper.Map<IEnumerable<AppointmentDto>>(entities);
        }

        // overload for int-based providerId
        public Task<IEnumerable<AppointmentDto>> GetAppointmentsByProviderIdAsync(int providerId)
            => GetAppointmentsByProviderIdAsync(providerId.ToString());

        public async Task<IEnumerable<AppointmentDto>> GetAppointmentsByDateAsync(DateTime date)
        {
            var start = date.Date;
            var end = start.AddDays(1);

            var entities = await _dbContext.Appointments
                .AsNoTracking()
                .Include(a => a.Patient)
                .Include(a => a.Provider)
                .Where(a => a.AppointmentDate >= start && a.AppointmentDate < end)
                .ToListAsync();

            return _mapper.Map<IEnumerable<AppointmentDto>>(entities);
        }

        public async Task<AppointmentDto> CreateAppointmentAsync(AppointmentCreateDto dto)
        {
            var entity = _mapper.Map<Appointment>(dto);
            entity.Id = Guid.NewGuid().ToString();
            entity.CreatedAt = DateTime.UtcNow;
            entity.UpdatedAt = DateTime.UtcNow;

            await _dbContext.Appointments.AddAsync(entity);
            await _dbContext.SaveChangesAsync();

            var created = await _dbContext.Appointments
                .Include(a => a.Patient)
                .Include(a => a.Provider)
                .FirstOrDefaultAsync(a => a.Id == entity.Id);

            return _mapper.Map<AppointmentDto>(created);
        }

        public async Task<bool> UpdateAppointmentAsync(AppointmentUpdateDto dto)
        {
            var entity = await _dbContext.Appointments
                .FirstOrDefaultAsync(a => a.Id == dto.Id);
            if (entity == null) return false;

            _mapper.Map(dto, entity);
            entity.UpdatedAt = DateTime.UtcNow;

            _dbContext.Appointments.Update(entity);
            await _dbContext.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteAppointmentAsync(string id)
        {
            var entity = await _dbContext.Appointments
                .FirstOrDefaultAsync(a => a.Id == id);
            if (entity == null) return false;

            _dbContext.Appointments.Remove(entity);
            await _dbContext.SaveChangesAsync();
            return true;
        }

        public async Task<int> GetTodayAppointmentsCountAsync()
        {
            var today = DateTime.Today;
            var tomorrow = today.AddDays(1);

            return await _dbContext.Appointments
                .AsNoTracking()
                .CountAsync(a => a.AppointmentDate >= today && a.AppointmentDate < tomorrow);
        }

        public async Task<IEnumerable<ChartData>> GetAppointmentsByMonthAsync()
        {
            var list = await _dbContext.Appointments
                .AsNoTracking()
                .ToListAsync();

            return list
                .GroupBy(a => new { a.AppointmentDate.Year, a.AppointmentDate.Month })
                .Select(g => new ChartData
                {
                    Label = new DateTime(g.Key.Year, g.Key.Month, 1).ToString("MMMM yyyy"),
                    Value = g.Count()
                })
                .OrderBy(cd => cd.Label)
                .ToList();
        }

        public async Task<int> GetProviderTodayAppointmentsCountAsync(string providerId)
        {
            var today = DateTime.Today;
            var tomorrow = today.AddDays(1);

            return await _dbContext.Appointments
                .AsNoTracking()
                .CountAsync(a =>
                    a.ProviderId == providerId &&
                    a.AppointmentDate >= today &&
                    a.AppointmentDate < tomorrow
                );
        }

        public async Task<IEnumerable<ChartData>> GetProviderAppointmentsByMonthAsync(string providerId)
        {
            var list = await _dbContext.Appointments
                .AsNoTracking()
                .Where(a => a.ProviderId == providerId)
                .ToListAsync();

            return list
                .GroupBy(a => new { a.AppointmentDate.Year, a.AppointmentDate.Month })
                .Select(g => new ChartData
                {
                    Label = new DateTime(g.Key.Year, g.Key.Month, 1).ToString("MMMM yyyy"),
                    Value = g.Count()
                })
                .OrderBy(cd => cd.Label)
                .ToList();
        }

        public async Task<IEnumerable<AppointmentDto>> GetPatientUpcomingAppointmentsAsync(string patientId)
        {
            var today = DateTime.Today;

            var upcoming = await _dbContext.Appointments
                .AsNoTracking()
                .Include(a => a.Provider)
                .Where(a => a.PatientId == patientId && a.AppointmentDate >= today)
                .OrderBy(a => a.AppointmentDate)
                .Take(5)
                .ToListAsync();

            return _mapper.Map<IEnumerable<AppointmentDto>>(upcoming);
        }

        public async Task<bool> UpdateAppointmentStatusAsync(string appointmentId, string newStatus)
        {
            var appt = await _dbContext.Appointments.FindAsync(appointmentId);
            if (appt == null) return false;

            appt.Status = newStatus;
            appt.UpdatedAt = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<DateTime>> GetAvailableSlotsAsync(string providerId, DateTime date)
        {
            // e.g. 8am–6pm slots on the hour
            var allSlots = Enumerable.Range(8, 11)
                .Select(h => date.Date.AddHours(h));

            var taken = await _dbContext.Appointments
                .AsNoTracking()
                .Where(a =>
                    a.ProviderId == providerId &&
                    a.AppointmentDate.Date == date.Date
                )
                .Select(a => a.AppointmentDate)
                .ToListAsync();

            return allSlots.Except(taken);
        }
    }
}

