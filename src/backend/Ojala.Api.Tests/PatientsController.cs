using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Ojala.Services.Interfaces;
using Ojala.Contracts.Models;
using Ojala.Contracts.DTOs;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace Ojala.Api.Controllers
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

        [HttpGet]
        [Authorize(Roles = "Provider,Admin")]
        public async Task<ActionResult<IEnumerable<PatientDto>>> GetAll()
        {
            var patients = await _patientService.GetAllPatientsAsync();
            return Ok(patients);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<PatientDto>> GetById(string id)
        {
            // Check if user has access to this patient
            if (!User.IsInRole("Admin") && !User.IsInRole("Provider"))
            {
                var currentUserId = User.FindFirst("sub")?.Value;
                if (id != currentUserId)
                {
                    return Forbid();
                }
            }

            var patient = await _patientService.GetPatientByIdAsync(id);
            if (patient == null)
            {
                return NotFound();
            }

            return Ok(patient);
        }

        [HttpGet("provider/{providerId}")]
        [Authorize(Roles = "Provider,Admin")]
        public async Task<ActionResult<IEnumerable<PatientDto>>> GetByProviderId(string providerId)
        {
            // Check if provider is accessing their own patients
            if (!User.IsInRole("Admin"))
            {
                var currentUserId = User.FindFirst("sub")?.Value;
                if (providerId != currentUserId)
                {
                    return Forbid();
                }
            }

            var patients = await _patientService.GetPatientsByProviderIdAsync(providerId);
            return Ok(patients);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<PatientDto>> Create(PatientDto patientDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var createdPatient = await _patientService.CreatePatientAsync(patientDto);
            return CreatedAtAction(nameof(GetById), new { id = createdPatient.Id }, createdPatient);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, PatientDto patientDto)
        {
            if (id != patientDto.Id)
            {
                return BadRequest("ID mismatch");
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Check if user has permission to update this patient
            if (!User.IsInRole("Admin") && !User.IsInRole("Provider"))
            {
                var currentUserId = User.FindFirst("sub")?.Value;
                if (id != currentUserId)
                {
                    return Forbid();
                }
            }

            var success = await _patientService.UpdatePatientAsync(patientDto);
            if (!success)
            {
                return NotFound();
            }

            return NoContent();
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(string id)
        {
            var success = await _patientService.DeletePatientAsync(id);
            if (!success)
            {
                return NotFound();
            }

            return NoContent();
        }

        [HttpGet("search")]
        [Authorize(Roles = "Provider,Admin")]
        public async Task<ActionResult<IEnumerable<PatientDto>>> Search([FromQuery] string query)
        {
            var patients = await _patientService.SearchPatientsAsync(query);
            return Ok(patients);
        }

        [HttpGet("{id}/medical-history")]
        public async Task<ActionResult<PatientMedicalHistoryDto>> GetMedicalHistory(string id)
        {
            // Check if user has access to this patient's medical history
            if (!User.IsInRole("Admin") && !User.IsInRole("Provider"))
            {
                var currentUserId = User.FindFirst("sub")?.Value;
                if (id != currentUserId)
                {
                    return Forbid();
                }
            }

            var medicalHistory = await _patientService.GetPatientMedicalHistoryAsync(id);
            if (medicalHistory == null)
            {
                return NotFound();
            }

            return Ok(medicalHistory);
        }

        [HttpPost("{patientId}/assign-provider/{providerId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> AssignProvider(string patientId, string providerId)
        {
            var success = await _patientService.AssignProviderToPatientAsync(patientId, providerId);
            if (!success)
            {
                return BadRequest("Failed to assign provider to patient");
            }

            return NoContent();
        }
    }
}
