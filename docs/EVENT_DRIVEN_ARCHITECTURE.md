# Event-Driven Architecture for User Registration

This document describes the implementation of a scalable, decoupled event-driven architecture that automatically creates patient records when users register with the "Patient" role.

## 🏗️ Architecture Overview

The system uses a publish-subscribe pattern with Redis as the message broker to decouple the user registration process from patient record creation.

```
┌─────────────────┐    ┌─────────────┐    ┌─────────────┐
│   Phos.Identity│    │    Redis    │    │  Phos.Api  │
│                 │    │   Pub/Sub   │    │             │
│ ┌─────────────┐ │    │             │    │ ┌─────────┐ │
│ │AuthService  │ │───▶│  Event Bus  │───▶│ │Listener │ │
│ │             │ │    │             │    │ │         │ │
│ │Register()   │ │    │             │    │ │Patient  │ │
│ │             │ │    │             │    │ │Creation │ │
│ └─────────────┘ │    │             │    │ └─────────┘ │
└─────────────────┘    └─────────────┘    └─────────────┘
```

## 📋 Components

### 1. Event Definition
- **File**: `src/shared/Phos.Contracts/Events/UserRegisteredEvent.cs`
- **Purpose**: Defines the structure of user registration events
- **Properties**: UserId, Email, Role, FirstName, LastName, RegisteredAt, Metadata

### 2. Event Bus Interface
- **File**: `src/shared/Phos.Contracts/Events/IEventBus.cs`
- **Purpose**: Generic interface for publishing and subscribing to events
- **Methods**: `PublishAsync<T>()`, `SubscribeAsync<T>()`

### 3. Redis Event Bus Implementation
- **File**: `src/shared/Phos.Common/Events/RedisEventBus.cs`
- **Purpose**: Redis-based implementation of the event bus using pub/sub
- **Features**: JSON serialization, error handling, logging

### 4. Event Publisher (Phos.Identity)
- **File**: `src/backend/Phos.Identity/Events/UserEventPublisher.cs`
- **Purpose**: Publishes UserRegistered events when users are created
- **Integration**: Called from AuthService.RegisterAsync()

### 5. Event Handler (Phos.Api)
- **File**: `src/backend/Phos.Api/Listeners/UserRegisteredHandler.cs`
- **Purpose**: Background service that listens for UserRegistered events
- **Action**: Creates patient records for users with "Patient" role

## 🔧 Configuration

### Redis Connection
Both services are configured to connect to Redis:

```json
{
  "ConnectionStrings": {
    "Redis": "phos-redis:6379"
  }
}
```

### Service Registration

#### Phos.Identity (Program.cs)
```csharp
// Add Redis and Event Bus
builder.Services.AddSingleton<IConnectionMultiplexer>(sp =>
{
    var configuration = sp.GetRequiredService<IConfiguration>();
    var connectionString = configuration.GetConnectionString("Redis") ?? "localhost:6379";
    return ConnectionMultiplexer.Connect(connectionString);
});

builder.Services.AddSingleton<IEventBus, RedisEventBus>();
builder.Services.AddScoped<IUserEventPublisher, UserEventPublisher>();
```

#### Phos.Api (Program.cs)
```csharp
// Add Redis and Event Bus
builder.Services.AddSingleton<IConnectionMultiplexer>(sp =>
{
    var configuration = sp.GetRequiredService<IConfiguration>();
    var connectionString = configuration.GetConnectionString("Redis") ?? "localhost:6379";
    return ConnectionMultiplexer.Connect(connectionString);
});

builder.Services.AddSingleton<IEventBus, RedisEventBus>();

// Add Event Handlers
builder.Services.AddHostedService<UserRegisteredHandler>();
```

## 🔄 Event Flow

### 1. User Registration
1. User submits registration form to `POST /api/auth/register`
2. `AuthService.RegisterAsync()` creates user and profile
3. `UserEventPublisher.PublishUserRegisteredAsync()` publishes event
4. Event is serialized to JSON and sent to Redis channel `events:userregisteredevent`

### 2. Event Processing
1. `UserRegisteredHandler` (BackgroundService) subscribes to events
2. When event is received, it deserializes the JSON
3. If role is "Patient", creates `PatientCreateDto` with user data
4. Calls `IPatientService.CreatePatientAsync()` to create patient record
5. Logs success or failure

### 3. Error Handling
- Event publishing failures don't prevent user registration
- Event processing failures are logged but don't stop the service
- Redis connection issues are handled gracefully

## 🧪 Testing

### Unit Tests
- **File**: `tests/Phos.Tests.Unit/Events/UserRegisteredEventTests.cs`
- **Coverage**: Event serialization, Redis pub/sub, error handling

### Integration Tests
- **File**: `tests/Phos.Tests.Integration/UserRegistrationIntegrationTests.cs`
- **Coverage**: Complete flow from event to patient creation

## 🚀 Benefits

### 1. Decoupling
- Phos.Identity has no knowledge of Phos.Api
- Services can be deployed independently
- Changes to patient creation logic don't affect user registration

### 2. Scalability
- Multiple instances can subscribe to the same events
- Redis handles message distribution
- Background processing doesn't block user registration

### 3. Fault Tolerance
- Event publishing failures don't break user registration
- Failed events can be retried
- Service continues running even if some events fail

### 4. Extensibility
- Easy to add new event handlers
- Other services can subscribe to the same events
- New event types can be added without changing existing code

## 🔍 Monitoring

### Logging
All event operations are logged with structured logging:

```csharp
_logger.LogInformation("Published UserRegistered event for user {UserId} with role {Role}", userId, role);
_logger.LogInformation("Successfully created patient record {PatientId} for user {UserId}", patientId, userId);
```

### Health Checks
Redis connectivity can be monitored through health checks.

## 🔮 Future Enhancements

### 1. Event Persistence
- Store events in a persistent queue (e.g., Redis Streams)
- Enable event replay for debugging
- Implement event sourcing

### 2. Event Versioning
- Add version numbers to events
- Support backward compatibility
- Handle schema evolution

### 3. Dead Letter Queue
- Move failed events to a separate queue
- Implement retry mechanisms
- Alert on persistent failures

### 4. Event Sourcing
- Store all events in an event store
- Rebuild state from event history
- Enable temporal queries

## 🛠️ Troubleshooting

### Common Issues

1. **Redis Connection Failed**
   - Check Redis service is running
   - Verify connection string in appsettings.json
   - Check network connectivity

2. **Events Not Being Processed**
   - Verify UserRegisteredHandler is registered as HostedService
   - Check logs for subscription errors
   - Ensure Redis pub/sub is working

3. **Patient Records Not Created**
   - Check if user role is exactly "Patient" (case-sensitive)
   - Verify IPatientService is properly registered
   - Check database connectivity

### Debug Commands

```bash
# Check Redis connectivity
redis-cli ping

# Monitor Redis pub/sub
redis-cli monitor

# Check specific channel
redis-cli subscribe events:userregisteredevent
```

## 📚 Related Documentation

- [Repository Structure Summary](./REPOSITORY_STRUCTURE.md)
- [API Documentation](./API_DOCUMENTATION.md)
- [Deployment Guide](./DEPLOYMENT.md) 
