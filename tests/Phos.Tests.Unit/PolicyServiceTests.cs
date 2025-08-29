using System.Collections.Generic;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Abstractions;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Routing;
using Moq;
using Phos.Api.Services;
using Xunit;

namespace Phos.Tests.Unit
{
    public class PolicyServiceTests
    {
        // Test the SameUserAuthorizationHandler

        [Fact]
        public async void SameUserHandler_MatchingIds_ShouldSucceed()
        {
            // Arrange
            var userId = "user123";
            var authorizationContext = CreateAuthorizationContext(userId, "Patient", "id", userId);
            var requirement = new SameUserRequirement();
            var handler = new SameUserAuthorizationHandler();
            
            // Act
            await handler.HandleAsync(authorizationContext);
            
            // Assert
            Assert.True(authorizationContext.HasSucceeded);
        }
        
        [Fact]
        public async void SameUserHandler_DifferentIds_ShouldNotSucceed()
        {
            // Arrange
            var userId = "user123";
            var differentId = "user456";
            var authorizationContext = CreateAuthorizationContext(userId, "Patient", "id", differentId);
            var requirement = new SameUserRequirement();
            var handler = new SameUserAuthorizationHandler();
            
            // Act
            await handler.HandleAsync(authorizationContext);
            
            // Assert
            Assert.False(authorizationContext.HasSucceeded);
        }
        
        [Fact]
        public async void SameUserHandler_NotPatientRole_ShouldNotSucceed()
        {
            // Arrange
            var userId = "user123";
            var authorizationContext = CreateAuthorizationContext(userId, "Doctor", "id", userId);
            var requirement = new SameUserRequirement();
            var handler = new SameUserAuthorizationHandler();
            
            // Act
            await handler.HandleAsync(authorizationContext);
            
            // Assert
            Assert.False(authorizationContext.HasSucceeded);
        }
        
        [Fact]
        public async void SameUserHandler_NoRouteData_ShouldNotSucceed()
        {
            // Arrange
            var userId = "user123";
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, userId),
                new Claim(ClaimTypes.Role, "Patient")
            };
            var identity = new ClaimsIdentity(claims, "TestAuthType");
            var claimsPrincipal = new ClaimsPrincipal(identity);
            
            var authorizationContext = new AuthorizationHandlerContext(
                new[] { new SameUserRequirement() },
                claimsPrincipal,
                null); // No resource (routeData)
            
            var handler = new SameUserAuthorizationHandler();
            
            // Act
            await handler.HandleAsync(authorizationContext);
            
            // Assert
            Assert.False(authorizationContext.HasSucceeded);
        }

        // Helper methods
        private AuthorizationHandlerContext CreateAuthorizationContext(
            string userId, 
            string role, 
            string routeParameterName, 
            string routeParameterValue)
        {
            // Create claims identity
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, userId),
                new Claim(ClaimTypes.Role, role)
            };
            var identity = new ClaimsIdentity(claims, "TestAuthType");
            var claimsPrincipal = new ClaimsPrincipal(identity);
            
            // Create mock route data
            var routeData = new RouteData();
            routeData.Values.Add(routeParameterName, routeParameterValue);
            
            // Create ActionContext with HttpContext and RouteData
            var httpContext = new DefaultHttpContext
            {
                User = claimsPrincipal
            };
            
            var actionContext = new ActionContext(
                httpContext,
                routeData,
                new ActionDescriptor());
            
            // Create AuthorizationFilterContext
            var authFilterContext = new AuthorizationFilterContext(
                actionContext,
                new List<IFilterMetadata>());
            
            // Create AuthorizationHandlerContext
            return new AuthorizationHandlerContext(
                new[] { new SameUserRequirement() },
                claimsPrincipal,
                authFilterContext);
        }
    }
} 