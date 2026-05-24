const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { createBackup } = require('../services/backupService');

const CONFIG_FILE = path.join(__dirname, '..', 'backup_config.json');

// Get config
router.get('/config', (req, res) => {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
      res.json(config);
    } else {
      res.json({ oneDrivePath: '' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to read config' });
  }
});

// Save config
router.post('/config', (req, res) => {
  const { oneDrivePath } = req.body;
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify({ oneDrivePath }), 'utf8');
    res.json({ success: true, message: 'Configuration saved successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save config' });
  }
});

// Trigger backup
router.post('/trigger', async (req, res) => {
  try {
    let config = { oneDrivePath: '' };
    if (fs.existsSync(CONFIG_FILE)) {
      config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    }

    if (!config.oneDrivePath) {
      return res.status(400).json({ error: 'OneDrive path is not configured. Please set it first.' });
    }

    const result = await createBackup(config.oneDrivePath);
    res.json(result);
  } catch (err) {
    console.error('Backup error:', err);
    res.status(500).json({ error: 'Backup failed', details: err.message });
  }
});

module.exports = router;
