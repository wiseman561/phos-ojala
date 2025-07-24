using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Ojala.Services.Interfaces;
using Ojala.Contracts.Models;
using Ojala.Contracts.DTOs;
using System.Threading.Tasks;
using System.Collections.Generic;
using System;

namespace Ojala.Api.Controllers
{
    [ApiController]
    [Route("api/appointments")]
    [Authorize]
    public class AppointmentsController : ControllerBase
    {
        private readonly IAppointmentService _appointmentService;

        public AppointmentsController(IAppointmentService appointmentService)
        {
            _appointmentService = appointmentService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<AppointmentDto>>> GetAll()
        {
            var appointments = await _appointmentService.GetAllAppointmentsAsync();
            return Ok(appointments);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<AppointmentDto>> GetById(string id)
        {
            var appointment = await _appointmentService.GetAppointmentByIdAsync(id);
            if (appointment == null)
            {
                return NotFound();
            }
            return Ok(appointment);
        }

        [HttpGet("patient/{patientId}")]
        public async Task<ActionResult<IEnumerable<AppointmentDto>>> GetByPatientId(string patientId)
        {
            var appointments = await _appointmentService.GetAppointmentsByPatientIdAsync(patientId);
            return Ok(appointments);
        }

        [HttpGet("provider/{providerId}")]
        [Authorize(Roles = "Provider,Admin")]
        public async Task<ActionResult<IEnumerable<AppointmentDto>>> GetByProviderId(string providerId)
        {
            var appointments = await _appointmentService.GetAppointmentsByProviderIdAsync(providerId);
            return Ok(appointments);
        }

        [HttpGet("date/{date}")]
        public async Task<ActionResult<IEnumerable<AppointmentDto>>> GetByDate(DateTime date)
        {
            var appointments = await _appointmentService.GetAppointmentsByDateAsync(date);
            return Ok(appointments);
        }

        [HttpPost]
        public async Task<ActionResult<AppointmentDto>> Create(AppointmentDto appointmentDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var createdAppointment = await _appointmentService.CreateAppointmentAsync(appointmentDto);
            return CreatedAtAction(nameof(GetById), new { id = createdAppointment.Id }, createdAppointment);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, AppointmentDto appointmentDto)
        {
            if (id != appointmentDto.Id)
            {
                return BadRequest("ID mismatch");
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var success = await _appointmentService.UpdateAppointmentAsync(appointmentDto);
            if (!success)
            {
                return NotFound();
            }

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var success = await _appointmentService.DeleteAppointmentAsync(id);
            if (!success)
            {
                return NotFound();
            }

            return NoContent();
        }

        [HttpPost("{id}/status")]
        public async Task<IActionResult> UpdateStatus(string id, [FromBody] string status)
        {
            var success = await _appointmentService.UpdateAppointmentStatusAsync(id, status);
            if (!success)
            {
                return NotFound();
            }

            return NoContent();
        }

        [HttpGet("available-slots")]
        public async Task<ActionResult<IEnumerable<DateTime>>> GetAvailableSlots([FromQuery] string providerId, [FromQuery] DateTime date)
        {
            var slots = await _appointmentService.GetAvailableSlotsAsync(providerId, date);
            return Ok(slots);
        }
    }
}
