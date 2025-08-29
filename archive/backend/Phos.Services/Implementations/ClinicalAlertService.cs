using System;
using System.Collections.Generic;
using Phos.Services.Interfaces;
using Phos.Contracts.Models;
using Phos.Data;

namespace Phos.Services.Implementations
{
    public class ClinicalAlertService : IClinicalAlertService
    {
        private readonly PhosDbContext _db;

        public ClinicalAlertService(PhosDbContext db)
        {
            _db = db;
        }

        public IEnumerable<ClinicalAlert> GetActiveAlerts()
        {
            throw new NotImplementedException();
        }

        public IEnumerable<ClinicalAlert> GetPatientAlerts(string patientId)
        {
            throw new NotImplementedException();
        }

        public ClinicalAlert GetAlert(string alertId)
        {
            throw new NotImplementedException();
        }

        public void UpdateAlertStatus(string alertId, AlertStatus status, string? notes = null)
        {
            throw new NotImplementedException();
        }

        public void CreateAlert(ClinicalAlert alert)
        {
            throw new NotImplementedException();
        }
    }
}
