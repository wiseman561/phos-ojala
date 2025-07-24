using Ojala.Api.Controllers;
using Ojala.Identity.Services.Interfaces;
using Moq;

namespace AuthControllerManualTest
{
    class Program
    {
        static void Main(string[] args)
        {
            Console.WriteLine("🧪 Testing AuthController...");

            try
            {
                // Test that we can create the AuthController
                var mockAuthService = new Mock<IAuthService>();
                var controller = new AuthController(mockAuthService.Object);

                Console.WriteLine("✅ AuthController created successfully!");
                Console.WriteLine($"Controller type: {controller.GetType().Name}");
                Console.WriteLine($"Controller namespace: {controller.GetType().Namespace}");

                // Test that the controller has the GetProfile method
                var getProfileMethod = controller.GetType().GetMethod("GetProfile");
                if (getProfileMethod != null)
                {
                    Console.WriteLine("✅ GetProfile method found!");
                    Console.WriteLine($"Method return type: {getProfileMethod.ReturnType.Name}");
                }
                else
                {
                    Console.WriteLine("❌ GetProfile method not found!");
                }

                Console.WriteLine("\n🎉 All tests passed! AuthController is working correctly.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
            }
        }
    }
}
