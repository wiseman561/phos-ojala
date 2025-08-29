using System.Threading.Tasks;

namespace Phos.Contracts.Events
{
    /// <summary>
    /// Generic event bus interface for publishing and subscribing to events
    /// </summary>
    public interface IEventBus
    {
        /// <summary>
        /// Publishes an event to the event bus
        /// </summary>
        /// <typeparam name="T">Type of the event</typeparam>
        /// <param name="event">The event to publish</param>
        /// <returns>Task representing the asynchronous operation</returns>
        Task PublishAsync<T>(T @event) where T : class;

        /// <summary>
        /// Subscribes to events of a specific type
        /// </summary>
        /// <typeparam name="T">Type of the event to subscribe to</typeparam>
        /// <param name="handler">The event handler to execute when the event is received</param>
        /// <returns>Task representing the asynchronous operation</returns>
        Task SubscribeAsync<T>(Func<T, Task> handler) where T : class;
    }
}
