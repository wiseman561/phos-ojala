using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;

using Phos.Api.Controllers;
using Phos.Contracts.DTOs;
using Phos.Services.Interfaces;

namespace Phos.Api.Tests.Controllers
{
    public class PatientsControllerTests
    {
        private readonly Mock<IPatientService> _patientServiceMock;

        public PatientsControllerTests()
        {
            _patientServiceMock = new Mock<IPatientService>();
        }

        private PatientsController CreateControllerWithUser(string userId, string role)
        {
            var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, userId),
                new Claim("sub", userId),
                new Claim(ClaimTypes.Role, role)
            }, "mock"));

            return new PatientsController(_patientServiceMock.Object)
            {
                ControllerContext = new ControllerContext
                {
                    HttpContext = new DefaultHttpContext { User = user }
                }
            };
        }

        // ─── GET tests ───────────────────────────────────────────

        [Fact]
        public async Task GetById_WhenPatientAccessingOwnRecord_ShouldReturnOk()
        {
            var patientId = "patient1";
            _patientServiceMock.Setup(s => s.GetPatientByIdAsync(patientId))
                               .ReturnsAsync(new PatientDto { Id = patientId });

            var controller = CreateControllerWithUser(patientId, "Patient");

            ActionResult<PatientDto> result = await controller.GetById(patientId);

            var ok = Assert.IsType<OkObjectResult>(result.Result);
            var returned = Assert.IsType<PatientDto>(ok.Value);
            Assert.Equal(patientId, returned.Id);
        }

        [Fact]
        public async Task GetById_WhenPatientAccessingOtherPatientRecord_ShouldReturnOk()
        {
            var targetId = "patient1";
            var callerId = "patient2";

            _patientServiceMock.Setup(s => s.GetPatientByIdAsync(targetId))
                               .ReturnsAsync(new PatientDto { Id = targetId });

            var controller = CreateControllerWithUser(callerId, "Patient");

            ActionResult<PatientDto> result = await controller.GetById(targetId);

            var ok = Assert.IsType<OkObjectResult>(result.Result);
            var returned = Assert.IsType<PatientDto>(ok.Value);
            Assert.Equal(targetId, returned.Id);
        }

        [Fact]
        public async Task GetById_WhenProviderAccessingAnyPatientRecord_ShouldReturnOk()
        {
            var targetId = "patient1";
            var provider = "provider1";

            _patientServiceMock.Setup(s => s.GetPatientByIdAsync(targetId))
                               .ReturnsAsync(new PatientDto { Id = targetId });

            var controller = CreateControllerWithUser(provider, "Provider");

            ActionResult<PatientDto> result = await controller.GetById(targetId);

            var ok = Assert.IsType<OkObjectResult>(result.Result);
            var returned = Assert.IsType<PatientDto>(ok.Value);
            Assert.Equal(targetId, returned.Id);
        }

        // ─── UPDATE tests ────────────────────────────────────────

        [Fact]
        public async Task Update_WhenPatientUpdatingOwnRecord_ShouldReturnNoContent()
        {
            var patientId = "patient1";
            var dto = new PatientUpdateDto { Id = patientId, Name = "Updated Name" };

            _patientServiceMock.Setup(s => s.UpdatePatientAsync(It.IsAny<PatientUpdateDto>()))
                               .ReturnsAsync(true);

            var controller = CreateControllerWithUser(patientId, "Patient");

            var result = await controller.Update(patientId, dto);

            Assert.IsType<NoContentResult>(result);
        }

        [Fact]
        public async Task Update_WhenPatientUpdatingOtherPatientRecord_ShouldReturnForbidden()
        {
            var targetId = "patient1";
            var callerId = "patient2";
            var dto = new PatientUpdateDto { Id = targetId, Name = "Updated Name" };

            var controller = CreateControllerWithUser(callerId, "Patient");

            var result = await controller.Update(targetId, dto);

            Assert.IsType<ForbidResult>(result);
        }

        [Fact]
        public async Task Update_WhenProviderUpdatingAnyPatientRecord_ShouldReturnForbid()
        {
            var targetId = "patient1";
            var provider = "provider1";
            var dto = new PatientUpdateDto { Id = targetId, Name = "Updated Name" };

            _patientServiceMock.Setup(s => s.UpdatePatientAsync(It.IsAny<PatientUpdateDto>()))
                               .ReturnsAsync(true);

            var controller = CreateControllerWithUser(provider, "Provider");

            var result = await controller.Update(targetId, dto);

            Assert.IsType<ForbidResult>(result);
        }

        // ─── SEARCH injection-safety test ───────────────────────

        [Fact]
        public async Task Search_WithPotentiallyMaliciousQuery_ShouldBeHandledSafelyByServiceLayer()
        {
            var provider  = "provider1";
            var malicious = "'; DROP TABLE Patients; --";

            _patientServiceMock.Setup(s => s.SearchPatientsAsync(malicious))
                               .ReturnsAsync(new List<PatientDto>());

            var controller = CreateControllerWithUser(provider, "Provider");

            var result = await controller.Search(malicious);

            var ok = Assert.IsType<OkObjectResult>(result.Result);
            Assert.IsAssignableFrom<IEnumerable<PatientDto>>(ok.Value);
            _patientServiceMock.Verify(s => s.SearchPatientsAsync(malicious), Times.Once);
        }
    }
}
