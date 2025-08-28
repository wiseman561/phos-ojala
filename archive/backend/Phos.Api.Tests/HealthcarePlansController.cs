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
    [Route("api/healthcare-plans")]
    [Authorize]
    public class HealthcarePlansController : ControllerBase
    {
        private readonly IHealthcarePlanService _healthcarePlanService;

        public HealthcarePlansController(IHealthcarePlanService healthcarePlanService)
        {
            _healthcarePlanService = healthcarePlanService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<HealthcarePlanDto>>> GetAll()
        {
            var plans = await _healthcarePlanService.GetAllPlansAsync();
            return Ok(plans);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<HealthcarePlanDto>> GetById(string id)
        {
            var plan = await _healthcarePlanService.GetPlanByIdAsync(id);
            if (plan == null)
            {
                return NotFound();
            }
            return Ok(plan);
        }

        [HttpGet("patient/{patientId}")]
        public async Task<ActionResult<IEnumerable<HealthcarePlanDto>>> GetByPatientId(string patientId)
        {
            var plans = await _healthcarePlanService.GetPlansByPatientIdAsync(patientId);
            return Ok(plans);
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Provider")]
        public async Task<ActionResult<HealthcarePlanDto>> Create(HealthcarePlanDto planDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var createdPlan = await _healthcarePlanService.CreatePlanAsync(planDto);
            return CreatedAtAction(nameof(GetById), new { id = createdPlan.Id }, createdPlan);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Provider")]
        public async Task<IActionResult> Update(string id, HealthcarePlanDto planDto)
        {
            if (id != planDto.Id)
            {
                return BadRequest("ID mismatch");
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var success = await _healthcarePlanService.UpdatePlanAsync(planDto);
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
            var success = await _healthcarePlanService.DeletePlanAsync(id);
            if (!success)
            {
                return NotFound();
            }

            return NoContent();
        }

        [HttpGet("available-plans")]
        public async Task<ActionResult<IEnumerable<HealthcarePlanDto>>> GetAvailablePlans()
        {
            var plans = await _healthcarePlanService.GetAvailablePlansAsync();
            return Ok(plans);
        }

        [HttpPost("{planId}/assign/{patientId}")]
        [Authorize(Roles = "Admin,Provider")]
        public async Task<IActionResult> AssignPlanToPatient(string planId, string patientId)
        {
            var success = await _healthcarePlanService.AssignPlanToPatientAsync(planId, patientId);
            if (!success)
            {
                return BadRequest("Failed to assign plan to patient");
            }

            return NoContent();
        }
    }
}
