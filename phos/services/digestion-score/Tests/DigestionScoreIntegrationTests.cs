using System.Text;
using DotNet.Testcontainers.Builders;
using DotNet.Testcontainers.Containers;
using NATS.Client;
using Xunit;

public class DigestionScoreIntegrationTests : IAsyncLifetime
{
    private IContainer _postgres = default!;
    private IContainer _nats = default!;

    public async Task InitializeAsync()
    {
        _postgres = new ContainerBuilder()
            .WithImage("postgres:16")
            .WithEnvironment("POSTGRES_USER", "phos")
            .WithEnvironment("POSTGRES_PASSWORD", "phos")
            .WithEnvironment("POSTGRES_DB", "phos")
            .WithPortBinding(5543, 5432)
            .WithWaitStrategy(Wait.ForUnixContainer().UntilPortIsAvailable(5432))
            .Build();
        _nats = new ContainerBuilder()
            .WithImage("nats:2")
            .WithPortBinding(14222, 4222)
            .WithWaitStrategy(Wait.ForUnixContainer().UntilPortIsAvailable(4222))
            .Build();
        await _postgres.StartAsync();
        await _nats.StartAsync();
    }

    public async Task DisposeAsync()
    {
        await _nats.DisposeAsync();
        await _postgres.DisposeAsync();
    }

    [Fact]
    public async Task Worker_Computes_And_Publishes()
    {
        var natsUrl = "nats://localhost:14222";
        var cf = new ConnectionFactory();
        using var conn = cf.CreateConnection(natsUrl);

        var got = new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);
        var sub = conn.SubscribeAsync("digestion.score.generated");
        sub.MessageHandler += (s, a) => got.TrySetResult(true);
        sub.Start();

        // Publish inputs
        conn.Publish("labs.result.created", Encoding.UTF8.GetBytes("{\"userId\":\"u1\"}"));
        conn.Publish("nutrition.analysis.completed", Encoding.UTF8.GetBytes("{\"userId\":\"u1\"}"));

        // Give the worker time (in real test, start the worker process configured to use these containers)
        // Here we only assert the publish path wiring. Full e2e would require hosting Program.
        var completed = await Task.WhenAny(got.Task, Task.Delay(TimeSpan.FromSeconds(10)));
        Assert.True(got.Task.IsCompleted, "Expected digestion.score.generated to be published");
    }
}


