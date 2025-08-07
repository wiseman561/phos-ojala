using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Phos.Services.Interfaces;
using Phos.Contracts.Models;
using Phos.Contracts.DTOs;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace Phos.Api.Controllers
{
    [ApiController]
    [Route("api/medical-records")]
    [Authorize]
    public class MedicalRecordsController : ControllerBase
    {
        private readonly IMedicalRecordService _medicalRecordService;

        public MedicalRecordsController(IMedicalRecordService medicalRecordService)
        {
            _medicalRecordService = medicalRecordService;
        }

        [HttpGet]
        [Authorize(Roles = "Provider,Admin")]
        public async Task<ActionResult<IEnumerable<MedicalRecordDto>>> GetAll()
        {
            var records = await _medicalRecordService.GetAllRecordsAsync();
            return Ok(records);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<MedicalRecordDto>> GetById(string id)
        {
            var record = await _medicalRecordService.GetRecordByIdAsync(id);
            if (record == null)
            {
                return NotFound();
            }

            // Check if user has access to this record
            if (!User.IsInRole("Admin") && !User.IsInRole("Provider"))
            {
                var patientId = User.FindFirst("sub")?.Value;
                if (record.PatientId != patientId)
                {
                    return Forbid();
                }
            }

            return Ok(record);
        }

        [HttpGet("patient/{patientId}")]
        public async Task<ActionResult<IEnumerable<MedicalRecordDto>>> GetByPatientId(string patientId)
        {
            // Check if user has access to these records
            if (!User.IsInRole("Admin") && !User.IsInRole("Provider"))
            {
                var currentUserId = User.FindFirst("sub")?.Value;
                if (patientId != currentUserId)
                {
                    return Forbid();
                }
            }

            var records = await _medicalRecordService.GetRecordsByPatientIdAsync(patientId);
            return Ok(records);
        }

        [HttpGet("provider/{providerId}")]
        [Authorize(Roles = "Provider,Admin")]
        public async Task<ActionResult<IEnumerable<MedicalRecordDto>>> GetByProviderId(string providerId)
        {
            // Check if provider is accessing their own records
            if (!User.IsInRole("Admin"))
            {
                var currentUserId = User.FindFirst("sub")?.Value;
                if (providerId != currentUserId)
                {
                    return Forbid();
                }
            }

            var records = await _medicalRecordService.GetRecordsByProviderIdAsync(providerId);
            return Ok(records);
        }

        [HttpPost]
        [Authorize(Roles = "Provider,Admin")]
        public async Task<ActionResult<MedicalRecordDto>> Create(MedicalRecordDto recordDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var createdRecord = await _medicalRecordService.CreateRecordAsync(recordDto);
            return CreatedAtAction(nameof(GetById), new { id = createdRecord.Id }, createdRecord);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Provider,Admin")]
        public async Task<IActionResult> Update(string id, MedicalRecordDto recordDto)
        {
            if (id != recordDto.Id)
            {
                return BadRequest("ID mismatch");
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Check if provider is updating their own record
            if (!User.IsInRole("Admin"))
            {
                var currentUserId = User.FindFirst("sub")?.Value;
                var existingRecord = await _medicalRecordService.GetRecordByIdAsync(id);

                if (existingRecord == null)
                {
                    return NotFound();
                }

                if (existingRecord.ProviderId != currentUserId)
                {
                    return Forbid();
                }
            }

            var success = await _medicalRecordService.UpdateRecordAsync(recordDto);
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
            var success = await _medicalRecordService.DeleteRecordAsync(id);
            if (!success)
            {
                return NotFound();
            }

            return NoContent();
        }

        [HttpPost("{recordId}/prescriptions")]
        [Authorize(Roles = "Provider,Admin")]
        public async Task<ActionResult<PrescriptionDto>> AddPrescription(string recordId, PrescriptionDto prescriptionDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var prescription = await _medicalRecordService.AddPrescriptionAsync(recordId, prescriptionDto);
            if (prescription == null)
            {
                return NotFound();
            }

            return Ok(prescription);
        }

        [HttpGet("pending")]
        [Authorize(Roles = "Provider,Admin")]
        public async Task<ActionResult<IEnumerable<MedicalRecordDto>>> GetPendingRecords()
        {
            var records = await _medicalRecordService.GetPendingRecordsAsync();
            return Ok(records);
        }
    }
}
