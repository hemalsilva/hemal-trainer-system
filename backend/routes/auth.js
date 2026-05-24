const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  // Default MVP Credentials
  if (username === 'admin' && password === 'admin123') {
    const token = jwt.sign(
      { username: 'admin', role: 'admin' },
      process.env.JWT_SECRET || 'secret123',
      { expiresIn: '1d' }
    );
    return res.json({ token });
  }

  // Invalid credentials
  return res.status(401).json({ error: 'Invalid username or password' });
});

module.exports = router;
