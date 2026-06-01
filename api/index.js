module.exports = (req, res) => { try { const app = require(`../backend/server.js`); return app(req, res); } catch (error) { res.status(500).json({ error: error.message, stack: error.stack }); } };
