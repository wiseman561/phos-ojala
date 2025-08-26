using System.Text;

namespace Phos.LabInterpreter.Services
{
  public interface IAuditLogger
  {
    Task LogAsync(string? userId, string action, string resource, string status, CancellationToken ct = default);
  }

  public sealed class FileAuditLogger : IAuditLogger
  {
    private readonly string _logPath;

    public FileAuditLogger()
    {
      var dir = Path.Combine(AppContext.BaseDirectory, "logs");
      Directory.CreateDirectory(dir);
      _logPath = Path.Combine(dir, "audit.log");
    }

    public async Task LogAsync(string? userId, string action, string resource, string status, CancellationToken ct = default)
    {
      var line = $"{DateTimeOffset.UtcNow:o}\t{userId ?? "unknown"}\t{action}\t{resource}\t{status}\n";
      var bytes = Encoding.UTF8.GetBytes(line);
      await using var fs = new FileStream(_logPath, FileMode.Append, FileAccess.Write, FileShare.ReadWrite);
      await fs.WriteAsync(bytes, 0, bytes.Length, ct);
    }
  }
}


