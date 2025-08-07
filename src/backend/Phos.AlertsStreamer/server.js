// Alerts-Streamer – main server
// Streams “emergency alert” events from Redis to WebSocket clients
// with JWT-based auth for doctors & nurses.
//
// ─────────────  Standard imports  ─────────────
const express  = require('express');
const http     = require('http');
const { Server } = require('socket.io');
const redis    = require('redis');
const jwt      = require('jsonwebtoken');
const cors     = require('cors');
const winston  = require('winston');
const dotenv   = require('dotenv');

// ─────────────  ENV & basic validation  ─────────────
dotenv.config();

const PORT             = Number(process.env.PORT || 80);
const JWT_SECRET       = process.env.JWT_SECRET;
const REDIS_CONNECTION = process.env.REDIS_CONNECTION;        // e.g. redis:6379

if (!JWT_SECRET)       throw new Error('JWT_SECRET env-var is required');
if (!REDIS_CONNECTION) throw new Error('REDIS_CONNECTION env-var is required');

// ─────────────  Logger  ─────────────
const logger = winston.createLogger({
  level      : 'info',
  format     : winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'alerts-streamer' },
  transports : [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log',    level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// ─────────────  Constants  ─────────────
const CHANNELS = {
  EMERGENCY_ALERTS      : 'emergency-alerts',
  ALERT_ACKNOWLEDGMENTS : 'alert-acknowledgments'
};

// ─────────────  Helper: verifyToken (Promise)  ─────────────
const verifyToken = (token, secret) =>
  new Promise((resolve, reject) =>
    jwt.verify(token, secret, (err, decoded) =>
      err ? reject(err) : resolve(decoded)
    )
  );

// ─────────────  Helper: createRedisSubscriber  ─────────────
async function createRedisSubscriber (redisUrl, channel, handler) {
  const client = redis.createClient({ url: `redis://${redisUrl}` });

  client.on('error', (err) =>
    logger.error('Redis subscriber error', { channel, error: err.message })
  );

  await client.connect();
  await client.subscribe(channel, handler);

  logger.info('Subscribed to channel', { channel });
  return client;
}

// ─────────────  Express / HTTP / WebSocket  ─────────────
const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.use(cors());
app.use(express.json());

// ─────────────  Socket auth middleware (JWT)  ─────────────
io.use(async (socket, next) => {
  try {
    const token =
      socket.handshake.query.token ||
      socket.handshake.headers.authorization?.split(' ')[1];

    if (!token) return next(new Error('Authentication token is required'));

    const decoded = await verifyToken(token, JWT_SECRET);

    const roles = decoded.roles || [];
    if (!roles.includes('doctor') && !roles.includes('nurse')) {
      return next(new Error('Insufficient permissions'));
    }

    socket.user = decoded;          // attach claims
    next();
  } catch (err) {
    logger.warn('Socket authentication failed', { error: err.message });
    next(new Error('Authentication error'));
  }
});

// ─────────────  Redis publisher (for health-check)  ─────────────
const redisClient = redis.createClient({ url: `redis://${REDIS_CONNECTION}` });
redisClient.on('error', (err) =>
  logger.error('Redis client error', { error: err.message })
);
redisClient.connect().then(() =>
  logger.info('Connected to Redis (publisher)')
);

// ─────────────  Redis subscribers  ─────────────
(async () => {
  // Handler for emergency alerts
  const emergencyAlertHandler = (msg) => {
    try {
      const alert = JSON.parse(msg);
      io.to(CHANNELS.EMERGENCY_ALERTS).emit('emergency-alert', alert);
      logger.info('Forwarded emergency alert', { alertId: alert.id });
    } catch (err) {
      logger.error('Failed to process alert message', { error: err.message });
    }
  };

  // Handler for acknowledgments
  const alertAckHandler = (msg) => {
    try {
      const ack = JSON.parse(msg);
      io.to(CHANNELS.EMERGENCY_ALERTS).emit('alert-acknowledged', ack);
      logger.info('Forwarded alert acknowledgment', { alertId: ack.id });
    } catch (err) {
      logger.error('Failed to process ack message', { error: err.message });
    }
  };

  await createRedisSubscriber(REDIS_CONNECTION, CHANNELS.EMERGENCY_ALERTS,      emergencyAlertHandler);
  await createRedisSubscriber(REDIS_CONNECTION, CHANNELS.ALERT_ACKNOWLEDGMENTS, alertAckHandler);
})();

// ─────────────  Socket connection events  ─────────────
io.on('connection', (socket) => {
  logger.info('Client connected', {
    socketId: socket.id,
    userId  : socket.user.id,
    roles   : socket.user.roles
  });

  socket.join(CHANNELS.EMERGENCY_ALERTS);

  socket.on('disconnect', () =>
    logger.info('Client disconnected', { socketId: socket.id, userId: socket.user.id })
  );
});

// ─────────────  Health & root endpoints  ─────────────
app.get('/health', async (_req, res) => {
  const redisStatus = redisClient.isOpen ? 'connected' : 'disconnected';
  res.status(200).json({
    status    : 'healthy',
    service   : 'alerts-streamer',
    timestamp : new Date().toISOString(),
    redis     : redisStatus
  });
});

app.get('/', (_req, res) =>
  res.status(200).json({
    service  : 'Alerts Streamer Service',
    version  : '1.0.0',
    endpoints: ['/health', '/ws/alerts']
  })
);

// ─────────────  Start server  ─────────────
server.listen(PORT, '0.0.0.0', () =>
  logger.info(`Alerts-Streamer running on port ${PORT}`)
);

// ─────────────  Graceful shutdown  ─────────────
async function shutdown () {
  logger.info('Graceful shutdown initiated');
  try {
    await redisClient.quit();
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  } catch (err) {
    logger.error('Error during shutdown', { error: err.message });
    process.exit(1);
  }
}
process.on('SIGINT',  shutdown);
process.on('SIGTERM', shutdown);

module.exports = { app, server, io };
