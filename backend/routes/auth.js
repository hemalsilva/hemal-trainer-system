const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');


router.post('/login', async (req, res) => {
  const user = (req.body.username || req.body.email || '').toString().trim().toLowerCase();
  const password = (req.body.password || '').toString().trim();
  
  // Admin credentials (supports both Admin / Admin123 and admin / admin123)
  if (user === 'admin' && (password === 'Admin123' || password === 'admin123')) {
    const token = jwt.sign(
      { username: 'admin', role: 'admin' },
      process.env.JWT_SECRET || 'secret123',
      { expiresIn: '7d' }
    );
    return res.json({ token, user: { username: 'Admin', role: 'admin' } });
  }

  // Invalid credentials
  return res.status(401).json({ error: 'Invalid username or password' });
});

module.exports = router;
