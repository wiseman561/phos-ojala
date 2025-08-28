using System;
using System.Collections.Generic;
using Phos.Contracts.Models;

namespace Phos.Services.Interfaces
{
    public interface IVitalSignsService
    {
        VitalSignsData GetLatestVitals(string patientId);
        IEnumerable<VitalSignsData> GetVitalsHistory(string patientId, DateTime startDate, DateTime endDate);
        void RecordVitals(VitalSignsData vitals);
        IEnumerable<PatientVitalsSnapshot> GetAbnormalVitals();
    }
}
