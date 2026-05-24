const express = require('express');
const router = express.Router();
const https = require('https');
const http = require('http');

// Convert Google Sheets share URL to CSV download URL
function sheetUrlToCsv(url) {
  // Handle: https://docs.google.com/spreadsheets/d/SHEET_ID/edit#gid=GID
  const match1 = url.match(/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  const gidMatch = url.match(/gid=(\d+)/);
  if (match1) {
    const id = match1[1];
    const gid = gidMatch ? gidMatch[1] : '0';
    return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`;
  }
  // Handle: https://docs.google.com/spreadsheets/d/e/PUBLISH_ID/pub?output=csv
  const match2 = url.match(/spreadsheets\/d\/e\/([a-zA-Z0-9_-]+)\/pub/);
  if (match2) {
    return `https://docs.google.com/spreadsheets/d/e/${match2[1]}/pub?output=csv`;
  }
  return url; // already a CSV URL maybe
}

// Proxy fetch CSV from Google Sheets (bypass CORS)
router.get('/fetch-csv', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing url parameter' });
  
  try {
    const csvUrl = sheetUrlToCsv(decodeURIComponent(url));
    
    const fetchUrl = (urlStr, maxRedirects = 5) => new Promise((resolve, reject) => {
      const proto = urlStr.startsWith('https') ? https : http;
      proto.get(urlStr, (response) => {
        if ((response.statusCode === 301 || response.statusCode === 302) && maxRedirects > 0) {
          return resolve(fetchUrl(response.headers.location, maxRedirects - 1));
        }
        let data = '';
        response.on('data', chunk => data += chunk);
        response.on('end', () => resolve({ status: response.statusCode, data }));
      }).on('error', reject);
    });

    const result = await fetchUrl(csvUrl);
    
    if (result.status !== 200) {
      return res.status(400).json({ error: `Google Sheets returned status ${result.status}. Make sure the sheet is publicly shared (Anyone with link - Viewer).` });
    }
    
    res.setHeader('Content-Type', 'text/csv');
    res.send(result.data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sheet: ' + err.message });
  }
});

module.exports = router;
