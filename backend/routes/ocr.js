const express = require('express');
const router = express.Router();
const multer = require('multer');
const Tesseract = require('tesseract.js');

const os = require('os');
const upload = multer({ dest: os.tmpdir() });

// POST endpoint for OCR extraction
router.post('/extract', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image uploaded' });
  }

  try {
    // Run Tesseract OCR on the uploaded image
    const result = await Tesseract.recognize(
      req.file.path,
      'eng',
      { logger: m => console.log(m) } // Optional logger to see progress
    );

    const text = result.data.text;

    // Simple RegEx parsing to simulate extracting known fields from attendance sheets
    // A real implementation might use LLM parsing or highly specific regex for form structure
    const empNoMatch = text.match(/EMP-\d{3,4}/g) || [];
    
    res.json({
      success: true,
      rawText: text,
      extractedData: {
        detected_employee_numbers: empNoMatch,
        summary: "Please review the extracted data before submitting."
      }
    });

  } catch (err) {
    res.status(500).json({ error: 'OCR Processing failed: ' + err.message });
  }
});

module.exports = router;
