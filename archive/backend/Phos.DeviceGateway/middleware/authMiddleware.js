const logger = require('winston');
const jwt = require('jsonwebtoken');

// Load JWT secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  logger.error('JWT_SECRET environment variable is not defined');
  throw new Error('Missing JWT secret');
}

/**
 * Middleware to verify device JWT token.
 * Expects Authorization header in format: "Bearer <token>"
 */
function verifyDeviceToken(req, res, next) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader) {
    logger.warn('No Authorization header provided for device');
    return res.status(401).json({ error: 'Authorization header required' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    logger.warn('Malformed Authorization header for device', { header: authHeader });
    return res.status(401).json({ error: 'Malformed Authorization header' });
  }

  const token = parts[1];
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      logger.error('Device token verification failed', { error: err.message });
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    // Attach decoded token payload to request
    req.device = decoded;
    next();
  });
}

/**
 * Middleware to verify user JWT token.
 * Expects Authorization header in format: "Bearer <token>"
 */
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader) {
    logger.warn('No Authorization header provided for user');
    return res.status(401).json({ error: 'Authorization header required' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    logger.warn('Malformed Authorization header for user', { header: authHeader });
    return res.status(401).json({ error: 'Malformed Authorization header' });
  }

  const token = parts[1];
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      logger.error('User token verification failed', { error: err.message });
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    // Attach decoded token payload to request
    req.user = decoded;
    next();
  });
}

module.exports = {
  verifyDeviceToken,
  verifyToken
};
