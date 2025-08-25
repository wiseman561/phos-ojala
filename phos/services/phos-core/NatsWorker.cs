using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using NATS.Client;

public sealed class NatsWorker : BackgroundService
{
    private readonly ILogger<NatsWorker> _logger;
    private readonly IConfiguration _configuration;
    private IConnection? _connection;

    public NatsWorker(ILogger<NatsWorker> logger, IConfiguration configuration)
    {
        _logger = logger;
        _configuration = configuration;
    }

    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        return Task.Run(() =>
        {
            try
            {
                var url = _configuration["NATS:URL"] ?? "nats://nats:4222";
                var opts = ConnectionFactory.GetDefaultOptions();
                opts.Url = url;
                var cf = new ConnectionFactory();
                _connection = cf.CreateConnection(opts);

                _logger.LogInformation("Connected to NATS at {Url}", url);

                void Subscribe(string subject)
                {
                    var sub = _connection.SubscribeAsync(subject);
                    sub.MessageHandler += (s, a) =>
                    {
                        var payload = Encoding.UTF8.GetString(a.Message.Data);
                        _logger.LogInformation("[{Subject}] {Payload}", subject, payload);
                    };
                    sub.Start();
                    _logger.LogInformation("Subscribed to {Subject}", subject);
                }

                Subscribe("labs.interpreted");
                Subscribe("nutrition.updated");

                // Keep the worker alive until cancellation
                while (!stoppingToken.IsCancellationRequested)
                {
                    Task.Delay(500, stoppingToken).Wait(stoppingToken);
                }
            }
            catch (OperationCanceledException)
            {
                // normal shutdown
            }
            catch (System.Exception ex)
            {
                _logger.LogError(ex, "NATS worker failed");
            }
        }, stoppingToken);
    }

    public override Task StopAsync(CancellationToken cancellationToken)
    {
        try
        {
            _connection?.Drain();
            _connection?.Close();
        }
        catch { }
        finally
        {
            _connection?.Dispose();
            _connection = null;
        }
        return base.StopAsync(cancellationToken);
    }
}
