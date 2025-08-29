// File: src/backend/Phos.Api/Interfaces/INotificationService.cs
namespace Phos.Contracts.Interfaces
{
    public interface INotificationService
    {
        Task NotifyOnCallMDsAsync(string subject, string message);
    }
}
