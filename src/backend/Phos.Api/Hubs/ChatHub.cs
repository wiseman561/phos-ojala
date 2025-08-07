using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace Phos.Api.Hubs
{
    /// <summary>
    /// SignalR hub for Telehealth chat functionality
    /// </summary>
    public class ChatHub : Hub
    {
        private readonly ILogger<ChatHub> _logger;

        public ChatHub(ILogger<ChatHub> logger)
        {
            _logger = logger;
        }

        /// <summary>
        /// Sends a message to all connected clients
        /// </summary>
        /// <param name="user">The user sending the message</param>
        /// <param name="message">The message content</param>
        public async Task SendMessage(string user, string message)
        {
            _logger.LogInformation("Message received from {User}: {Message}", user, message);
            await Clients.All.SendAsync("ReceiveMessage", user, message);
        }

        /// <summary>
        /// Sends a message to a specific user
        /// </summary>
        /// <param name="sender">The user sending the message</param>
        /// <param name="recipient">The recipient of the message</param>
        /// <param name="message">The message content</param>
        public async Task SendPrivateMessage(string sender, string recipient, string message)
        {
            _logger.LogInformation("Private message from {Sender} to {Recipient}: {Message}", sender, recipient, message);
            await Clients.User(recipient).SendAsync("ReceivePrivateMessage", sender, message);
        }

        /// <summary>
        /// Called when a client connects to the hub
        /// </summary>
        public override async Task OnConnectedAsync()
        {
            // Check for mock auth token
            var httpContext = Context.GetHttpContext();
            var token = httpContext?.Request.Headers["X-Auth-Token"].FirstOrDefault();
            
            if (string.IsNullOrEmpty(token))
            {
                _logger.LogWarning("Connection attempt without auth token from {ConnectionId}", Context.ConnectionId);
                // In a real implementation, you might want to close the connection
                // For this mock, we'll allow it but log the warning
            }
            else
            {
                _logger.LogInformation("Client connected with token: {Token}", token);
            }

            await base.OnConnectedAsync();
        }
    }
} 