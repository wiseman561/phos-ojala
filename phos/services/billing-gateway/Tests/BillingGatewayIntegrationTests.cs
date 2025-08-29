using System.Net.Http.Json;
using DotNet.Testcontainers.Builders;
using DotNet.Testcontainers.Containers;
using Microsoft.AspNetCore.Mvc.Testing;
using NATS.Client;
using Xunit;

public class BillingGatewayIntegrationTests : IAsyncLifetime
{
    private IContainer _nats = default!;

    public async Task InitializeAsync()
    {
        _nats = new ContainerBuilder()
            .WithImage("nats:2")
            .WithPortBinding(14222, 4222)
            .WithWaitStrategy(Wait.ForUnixContainer().UntilPortIsAvailable(4222))
            .Build();
        await _nats.StartAsync();
    }

    public async Task DisposeAsync()
    {
        await _nats.DisposeAsync();
    }

    [Fact]
    public async Task Charge_Publishes_BillingAttempted()
    {
        var natsUrl = "nats://localhost:14222";
        var cf = new ConnectionFactory();
        using var conn = cf.CreateConnection(natsUrl);
        var got = new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);
        var sub = conn.SubscribeAsync("billing.attempted");
        sub.MessageHandler += (s, a) => got.TrySetResult(true);
        sub.Start();

        var appFactory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.UseSetting("NATS:URL", natsUrl);
            builder.UseSetting("DISABLE_AUTH", "true");
        });
        var client = appFactory.CreateClient();
        var res = await client.PostAsJsonAsync("/api/billing/charge", new { userId = "u1", amount = 10.0, method = "credit" });
        res.EnsureSuccessStatusCode();

        var completed = await Task.WhenAny(got.Task, Task.Delay(TimeSpan.FromSeconds(10)));
        Assert.True(got.Task.IsCompleted, "Expected billing.attempted");
    }
}


