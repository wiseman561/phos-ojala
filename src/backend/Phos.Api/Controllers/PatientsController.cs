using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Phos.Services.Interfaces;
using Phos.Contracts.Models;
using Phos.Contracts.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Phos.Api.Controllers
{
    [ApiController]
    [Route("api/patients")]
    [Authorize]
    public class PatientsController : ControllerBase
    {
        private readonly IPatientService _patientService;

        public PatientsController(IPatientService patientService)
        {
            _patientService = patientService;
        }

        // GET api/patients
        [HttpGet]
        [Authorize(Roles = "Provider,Admin")]
        public async Task<ActionResult<IEnumerable<PatientDto>>> GetAll()
        {
            var patients = await _patientService.GetAllPatientsAsync();
            return Ok(patients);
        }

        // GET api/patients/{id}
        [HttpGet("{id}")]
        [Authorize(Policy = "CanViewPatient")]
        public async Task<ActionResult<PatientDto>> GetById(string id)
        {
            var patient = await _patientService.GetPatientByIdAsync(id);
            if (patient == null)
                return NotFound();

            return Ok(patient);
        }

        // GET api/patients/self
        [HttpGet("self")]
        [Authorize(Policy = "CanViewSelf")]
        public async Task<ActionResult<PatientDto>> GetSelf()
        {
            var userId = User.FindFirst("sub")?.Value;
            if (string.IsNullOrEmpty(userId))
                return Forbid();

            var patient = await _patientService.GetPatientByIdAsync(userId);
            if (patient == null)
                return NotFound();

            return Ok(patient);
        }

        // GET api/patients/self/medical-history
        [HttpGet("self/medical-history")]
        [Authorize(Policy = "CanViewSelf")]
        public async Task<ActionResult<PatientMedicalHistoryDto>> GetSelfMedicalHistory()
        {
            var userId = User.FindFirst("sub")?.Value;
            if (string.IsNullOrEmpty(userId))
                return Forbid();

            var medicalHistory = await _patientService.GetPatientMedicalHistoryAsync(userId);
            if (medicalHistory == null)
                return NotFound();

            return Ok(medicalHistory);
        }

        // GET api/patients/provider/{providerId}
        [HttpGet("provider/{providerId}")]
        [Authorize(Roles = "Provider,Admin")]
        public async Task<ActionResult<IEnumerable<PatientDto>>> GetByProviderId(string providerId)
        {
            if (!User.IsInRole("Admin"))
            {
                var currentUserId = User.FindFirst("sub")?.Value;
                if (providerId != currentUserId)
                    return Forbid();
            }

            var patients = await _patientService.GetPatientsByProviderIdAsync(providerId);
            return Ok(patients);
        }

        // POST api/patients
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<PatientDto>> Create([FromBody] PatientCreateDto patientDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var created = await _patientService.CreatePatientAsync(patientDto);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        // PUT api/patients/{id}
        [HttpPut("{id}")]
        [Authorize(Roles = "Provider,Admin")]
        public async Task<IActionResult> Update(string id, [FromBody] PatientUpdateDto patientDto)
        {
            if (id != patientDto.Id)
                return BadRequest("ID mismatch");

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (!User.IsInRole("Admin"))
            {
                var currentUserId = User.FindFirst("sub")?.Value;
                if (id != currentUserId)
                    return Forbid();
            }

            var updated = await _patientService.UpdatePatientAsync(patientDto);
            if (!updated)
                return NotFound();

            return NoContent();
        }

        // DELETE api/patients/{id}
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(string id)
        {
            var success = await _patientService.DeletePatientAsync(id);
            if (!success)
                return NotFound();

            return NoContent();
        }

        // GET api/patients/search?query=value
        [HttpGet("search")]
        [Authorize(Roles = "Provider,Admin")]
        public async Task<ActionResult<IEnumerable<PatientDto>>> Search([FromQuery] string query)
        {
            var patients = await _patientService.SearchPatientsAsync(query);
            return Ok(patients);
        }

        // POST api/patients/{patientId}/assign-provider/{providerId}
        [HttpPost("{patientId}/assign-provider/{providerId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> AssignProvider(string patientId, string providerId)
        {
            var success = await _patientService.AssignProviderToPatientAsync(patientId, providerId);
            if (!success)
                return BadRequest("Failed to assign provider to patient");

            return NoContent();
        }

        // GET api/patients/{id}/medical-history
        [HttpGet("{id}/medical-history")]
        [Authorize(Roles = "Provider,Admin")]
        public async Task<ActionResult<PatientMedicalHistoryDto>> GetMedicalHistory(string id)
        {
            var medicalHistory = await _patientService.GetPatientMedicalHistoryAsync(id);
            if (medicalHistory == null)
                return NotFound();

            return Ok(medicalHistory);
        }
    }
}
