using System;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Ojala.Contracts.Events;
using StackExchange.Redis;

namespace Ojala.Common.Events
{
    /// <summary>
    /// Redis-based implementation of the event bus using pub/sub
    /// </summary>
    public class RedisEventBus : IEventBus, IDisposable
    {
        private readonly IConnectionMultiplexer _redis;
        private readonly ILogger<RedisEventBus> _logger;
        private readonly JsonSerializerOptions _jsonOptions;
        private ISubscriber? _subscriber;

        public RedisEventBus(IConnectionMultiplexer redis, ILogger<RedisEventBus> logger)
        {
            _redis = redis ?? throw new ArgumentNullException(nameof(redis));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));

            _jsonOptions = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                WriteIndented = false
            };
        }

        /// <summary>
        /// Publishes an event to Redis pub/sub
        /// </summary>
        public async Task PublishAsync<T>(T @event) where T : class
        {
            try
            {
                var channel = GetChannelName<T>();
                var message = JsonSerializer.Serialize(@event, _jsonOptions);

                var subscriber = _redis.GetSubscriber();
                await subscriber.PublishAsync(channel, message);

                _logger.LogInformation("Published event {EventType} to channel {Channel}", typeof(T).Name, channel);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to publish event {EventType}", typeof(T).Name);
                throw;
            }
        }

        /// <summary>
        /// Subscribes to events of a specific type
        /// </summary>
        public async Task SubscribeAsync<T>(Func<T, Task> handler) where T : class
        {
            try
            {
                var channel = GetChannelName<T>();
                var subscriber = _redis.GetSubscriber();

                await subscriber.SubscribeAsync(channel, async (_, value) =>
                {
                    try
                    {
                        var @event = JsonSerializer.Deserialize<T>(value!, _jsonOptions);
                        if (@event != null)
                        {
                            await handler(@event);
                            _logger.LogInformation("Successfully processed event {EventType}", typeof(T).Name);
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to process event {EventType}", typeof(T).Name);
                    }
                });

                _logger.LogInformation("Subscribed to events of type {EventType} on channel {Channel}", typeof(T).Name, channel);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to subscribe to events of type {EventType}", typeof(T).Name);
                throw;
            }
        }

        /// <summary>
        /// Gets the Redis channel name for a specific event type
        /// </summary>
        private static string GetChannelName<T>() where T : class
        {
            return $"events:{typeof(T).Name.ToLowerInvariant()}";
        }

        public void Dispose()
        {
            _subscriber?.UnsubscribeAll();
        }
    }
}
