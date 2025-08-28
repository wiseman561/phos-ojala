using System;
using System.Threading.Tasks;
using Phos.Contracts.Models;
using Phos.Services.Interfaces;

namespace Phos.Services.Implementations
{
    public class VitalSignsService : IVitalSignsService
    {
        public VitalSignsService()
        {
            // TODO: Inject any required dependencies
        }

        public IEnumerable<PatientVitalsSnapshot> GetAbnormalVitals()
        {
            throw new NotImplementedException();
        }

        public VitalSignsData GetLatestVitals(string patientId)
        {
            throw new NotImplementedException();
        }

        public IEnumerable<VitalSignsData> GetVitalsHistory(string patientId, DateTime startDate, DateTime endDate)
        {
            throw new NotImplementedException();
        }

        public void RecordVitals(VitalSignsData vitals)
        {
            throw new NotImplementedException();
        }

        // TODO: Implement IVitalSignsService methods
        // public Task<VitalSignsDto> GetLatestVitalsAsync(Guid patientId)
        // {
        //     throw new NotImplementedException();
        // }
    }
}
