const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(403).json({ error: 'No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'secret123', (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Unauthorized!' });
    }
    req.user = decoded;
    next();
  });
};

// Middleware to check roles
const checkRole = (roles) => {
  return async (req, res, next) => {
    try {
      // In a real app, you would fetch the user from DB to get the actual role
      // For this implementation, we will assume the token contains the role string
      const userRole = req.user.role;
      
      if (!roles.includes(userRole)) {
        return res.status(403).json({ error: 'Require correct role!' });
      }
      next();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
};

module.exports = {
  verifyToken,
  checkRole
};
