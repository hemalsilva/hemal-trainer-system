const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const PdfPrinter = require('pdfmake');

// Basic font definitions for pdfmake
const fonts = {
  Roboto: {
    normal: 'Courier',
    bold: 'Courier-Bold',
    italics: 'Courier-Oblique',
    bolditalics: 'Courier-BoldOblique'
  }
};

const printer = new PdfPrinter(fonts);

router.get('/generate/:id', async (req, res) => {
  const recordId = req.params.id;

  try {
    // In a real scenario, fetch data from DB using recordId
    // For this demonstration, we generate a mock certificate
    
    const docDefinition = {
      content: [
        { text: 'CERTIFICATE OF COMPLETION', style: 'header', alignment: 'center', margin: [0, 50, 0, 20] },
        { text: 'This is to certify that', alignment: 'center', fontSize: 14, margin: [0, 20, 0, 10] },
        { text: 'SARAH JENKINS', style: 'name', alignment: 'center', margin: [0, 10, 0, 20] },
        { text: 'has successfully completed the training on', alignment: 'center', fontSize: 14, margin: [0, 20, 0, 10] },
        { text: 'LUXURY GUEST RELATIONS', style: 'topic', alignment: 'center', margin: [0, 10, 0, 30] },
        { text: 'Date: ' + new Date().toLocaleDateString(), alignment: 'center', fontSize: 12, margin: [0, 20, 0, 50] },
        {
          columns: [
            { text: '___________________\nTraining Manager', alignment: 'center' },
            { text: '___________________\nGeneral Manager', alignment: 'center' }
          ]
        }
      ],
      styles: {
        header: { fontSize: 24, bold: true, color: '#D4AF37' },
        name: { fontSize: 28, bold: true },
        topic: { fontSize: 20, bold: true, color: '#444444' }
      }
    };

    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=certificate.pdf');
    
    pdfDoc.pipe(res);
    pdfDoc.end();

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
