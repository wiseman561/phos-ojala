// Mock authentication middleware
const verifyToken = jest.fn((req, res, next) => {
  req.user = {
    id: 'mock-user-id',
    role: 'admin',
    permissions: ['read', 'write']
  };
  next();
});

const verifyDeviceToken = jest.fn((req, res, next) => {
  req.device = {
    id: 'mock-device-id',
    type: 'monitor',
    patientId: 'mock-patient-id'
  };
  next();
});

const requireRole = (role) => jest.fn((req, res, next) => {
  if (req.user?.role === role) {
    next();
  } else {
    res.status(403).json({ error: 'Insufficient permissions' });
  }
});

module.exports = {
  verifyToken,
  verifyDeviceToken,
  requireRole
}; 