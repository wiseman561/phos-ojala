using System;
using System.Collections.Generic;
using Phos.Contracts.Models;

namespace Phos.Services.Interfaces
{
    public interface IClinicalAlertService
    {
        IEnumerable<ClinicalAlert> GetActiveAlerts();
        IEnumerable<ClinicalAlert> GetPatientAlerts(string patientId);
        ClinicalAlert GetAlert(string alertId);
        void UpdateAlertStatus(string alertId, AlertStatus status, string? notes = null);
        void CreateAlert(ClinicalAlert alert);
    }
}
