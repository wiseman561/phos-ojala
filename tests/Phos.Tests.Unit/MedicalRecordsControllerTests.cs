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
    public class MedicalRecordsControllerTests
    {
        private readonly Mock<IMedicalRecordService> _medicalRecordServiceMock;

        public MedicalRecordsControllerTests()
        {
            _medicalRecordServiceMock = new Mock<IMedicalRecordService>();
        }

        private MedicalRecordsController CreateControllerWithUser(string userId, string role)
        {
            var user = new ClaimsPrincipal(new ClaimsIdentity(new Claim[]
            {
                new Claim(ClaimTypes.NameIdentifier, userId),
                new Claim("sub", userId),
                new Claim(ClaimTypes.Role, role)
            }, "mock"));

            var controller = new MedicalRecordsController(_medicalRecordServiceMock.Object)
            {
                ControllerContext = new ControllerContext
                {
                    HttpContext = new DefaultHttpContext { User = user }
                }
            };
            return controller;
        }

        [Fact]
        public async Task GetById_WhenPatientAccessingOwnRecord_ShouldReturnOk()
        {
            var recordId = "rec1";
            var patientId = "patient1";
            _medicalRecordServiceMock.Setup(s => s.GetMedicalRecordByIdAsync(recordId))
                .ReturnsAsync(new MedicalRecordDto { Id = recordId, PatientId = patientId });

            var controller = CreateControllerWithUser(patientId, "Patient");

            var result = await controller.GetById(recordId);

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var returnedRecord = Assert.IsType<MedicalRecordDto>(okResult.Value);
            Assert.Equal(recordId, returnedRecord.Id);
        }

        [Fact]
        public async Task GetById_WhenPatientAccessingOtherPatientRecord_ShouldReturnForbidden()
        {
            var recordId = "rec1";
            var targetPatientId = "patient1";
            var requestingUserId = "patient2";
            _medicalRecordServiceMock.Setup(s => s.GetMedicalRecordByIdAsync(recordId))
                .ReturnsAsync(new MedicalRecordDto { Id = recordId, PatientId = targetPatientId });

            var controller = CreateControllerWithUser(requestingUserId, "Patient");

            var result = await controller.GetById(recordId);

            Assert.IsType<ForbidResult>(result.Result);
        }

        [Fact]
        public async Task GetById_WhenProviderAccessingAnyRecord_ShouldReturnOk()
        {
            var recordId = "rec1";
            var patientId = "patient1";
            var providerId = "provider1";
            _medicalRecordServiceMock.Setup(s => s.GetMedicalRecordByIdAsync(recordId))
                .ReturnsAsync(new MedicalRecordDto { Id = recordId, PatientId = patientId });

            var controller = CreateControllerWithUser(providerId, "Provider");

            var result = await controller.GetById(recordId);

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var returnedRecord = Assert.IsType<MedicalRecordDto>(okResult.Value);
            Assert.Equal(recordId, returnedRecord.Id);
        }

        [Fact]
        public async Task GetByPatientId_WhenPatientAccessingOwnRecords_ShouldReturnOk()
        {
            var patientId = "patient1";
            _medicalRecordServiceMock.Setup(s => s.GetMedicalRecordsByPatientIdAsync(patientId))
                .ReturnsAsync(new List<MedicalRecordDto> { new MedicalRecordDto { PatientId = patientId } });

            var controller = CreateControllerWithUser(patientId, "Patient");

            var result = await controller.GetByPatientId(patientId);

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            Assert.IsAssignableFrom<IEnumerable<MedicalRecordDto>>(okResult.Value);
        }

        [Fact]
        public async Task GetByPatientId_WhenPatientAccessingOtherPatientRecords_ShouldReturnForbidden()
        {
            var targetPatientId = "patient1";
            var requestingUserId = "patient2";
            _medicalRecordServiceMock.Setup(s => s.GetMedicalRecordsByPatientIdAsync(targetPatientId))
                .ReturnsAsync(new List<MedicalRecordDto> { new MedicalRecordDto { PatientId = targetPatientId } });

            var controller = CreateControllerWithUser(requestingUserId, "Patient");

            var result = await controller.GetByPatientId(targetPatientId);

            Assert.IsType<ForbidResult>(result.Result);
        }

        [Fact]
        public async Task Update_WhenProviderUpdatingOwnRecord_ShouldReturnNoContent()
        {
            var recordId = "rec1";
            var providerId = "provider1";
            var recordDto = new MedicalRecordDto { Id = recordId, ProviderId = providerId };

            _medicalRecordServiceMock.Setup(s => s.GetMedicalRecordByIdAsync(recordId))
                .ReturnsAsync(new MedicalRecordDto { Id = recordId, ProviderId = providerId });
            _medicalRecordServiceMock.Setup(s => s.UpdateMedicalRecordAsync(It.IsAny<MedicalRecordDto>()))
                .ReturnsAsync(true);

            var controller = CreateControllerWithUser(providerId, "Provider");

            var result = await controller.Update(recordId, recordDto);

            Assert.IsType<NoContentResult>(result);
        }

        [Fact]
        public async Task Update_WhenProviderUpdatingAnotherProvidersRecord_ShouldReturnForbidden()
        {
            var recordId = "rec1";
            var recordOwnerProviderId = "provider1";
            var requestingProviderId = "provider2";
            var recordDto = new MedicalRecordDto { Id = recordId, ProviderId = recordOwnerProviderId };

            _medicalRecordServiceMock.Setup(s => s.GetMedicalRecordByIdAsync(recordId))
                .ReturnsAsync(new MedicalRecordDto { Id = recordId, ProviderId = recordOwnerProviderId });

            var controller = CreateControllerWithUser(requestingProviderId, "Provider");

            var result = await controller.Update(recordId, recordDto);

            Assert.IsType<ForbidResult>(result);
        }

        [Fact]
        public async Task Update_WhenAdminUpdatingAnyRecord_ShouldReturnNoContent()
        {
            var recordId = "rec1";
            var recordOwnerProviderId = "provider1";
            var adminId = "admin1";
            var recordDto = new MedicalRecordDto { Id = recordId, ProviderId = recordOwnerProviderId };

            _medicalRecordServiceMock.Setup(s => s.GetMedicalRecordByIdAsync(recordId))
                .ReturnsAsync(new MedicalRecordDto { Id = recordId, ProviderId = recordOwnerProviderId });
            _medicalRecordServiceMock.Setup(s => s.UpdateMedicalRecordAsync(It.IsAny<MedicalRecordDto>()))
                .ReturnsAsync(true);

            var controller = CreateControllerWithUser(adminId, "Admin");

            var result = await controller.Update(recordId, recordDto);

            Assert.IsType<NoContentResult>(result);
        }
    }
}
