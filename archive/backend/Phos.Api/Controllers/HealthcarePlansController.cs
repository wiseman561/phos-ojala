using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Phos.Contracts.DTOs;
using Phos.Services.Interfaces;
using Phos.Contracts.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

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

        // GET api/healthcareplans/{id}
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

        // GET api/healthcareplans/available-plans
        [HttpGet("available-plans")]
        public async Task<ActionResult<IEnumerable<HealthcarePlanDto>>> GetAvailablePlans()
        {
            var plans = await _healthcarePlanService.GetAvailablePlansAsync();
            return Ok(plans);
        }

        // POST api/healthcareplans
        [HttpPost]
        [Authorize(Roles = "Admin,Provider")]
        public async Task<ActionResult<HealthcarePlanDto>> Create([FromBody] HealthcarePlanDto planDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var createdPlan = await _healthcarePlanService.CreatePlanAsync(planDto);
            return CreatedAtAction(nameof(GetById), new { id = createdPlan.Id }, createdPlan);
        }

        // PUT api/healthcareplans/{id}
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Provider")]
        public async Task<IActionResult> Update(string id, [FromBody] HealthcarePlanDto planDto)
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

        // DELETE api/healthcareplans/{id}
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

        [HttpPost("{planId}/assign/{patientId}")]
        [Authorize(Roles = "Admin,Provider")]
        public async Task<IActionResult> AssignPlanToPatient(string planId, string patientId)
        {
            var success = await _healthcarePlanService.AssignPlanToPatientAsync(planId, patientId);
            if (!success)
            {
                return BadRequest("Failed to assign plan to patient");
            }

            return Ok(new { message = "Plan assigned successfully" });
        }
    }
}
