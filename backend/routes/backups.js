const express = require('express');
const router = express.Router();
router.post('/create', async (req, res) => {
  res.status(501).json({ error: 'Backups are not supported on Vercel (Read-Only Filesystem)' });
});
router.get('/', (req, res) => {
  res.json([]);
});
module.exports = router;
