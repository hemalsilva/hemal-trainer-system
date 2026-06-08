const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/Settings.jsx', 'utf8');

if (!code.includes("import axios")) {
  code = code.replace("import React", "import React, { useState, useRef, useEffect } from 'react';\nimport axios from 'axios';\nimport Tesseract from 'tesseract.js';\n//");
  // wait, line 1 is "import React, { useState, useRef, useEffect } from 'react';"
  // I will just replace "import React, { useState, useRef, useEffect } from 'react';"
}
code = code.replace(
  "import React, { useState, useRef, useEffect } from 'react';",
  "import React, { useState, useRef, useEffect } from 'react';\nimport axios from 'axios';\nimport Tesseract from 'tesseract.js';"
);

// Add state to Settings
const stateReplacement = 
  const [waQrCode, setWaQrCode] = useState(null);

  // Scan Attendance State
  const [trainings, setTrainings] = useState([]);
  const [selectedScanTrainingId, setSelectedScanTrainingId] = useState('');
  const [ocrLoading, setOcrLoading] = useState(false);
  const [scanStatus, setScanStatus] = useState('');

  useEffect(() => {
    axios.get('/api/trainings').then(res => setTrainings(res.data)).catch(console.error);
  }, []);

  const handleScanUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedScanTrainingId) return;

    setOcrLoading(true);
    setScanStatus('Analyzing sign sheet with AI... This may take a minute.');

    try {
      const { data: { text } } = await Tesseract.recognize(file, 'eng');
      const empMatches = text.match(/EMP-\\d+/gi) || [];
      const numbers = text.match(/\\b\\d{4,6}\\b/g) || [];
      const combined = [...empMatches.map(m => m.toUpperCase()), ...numbers];
      const uniqueNumbers = [...new Set(combined)];
      
      if (uniqueNumbers.length === 0) {
        setScanStatus('No employee numbers found in image. Please try a clearer photo.');
        setOcrLoading(false);
        e.target.value = '';
        return;
      }

      const res = await axios.post('/api/trainings/' + selectedScanTrainingId + '/attendance/bulk', {
        emp_nos: uniqueNumbers
      });

      setScanStatus(\Successfully marked \ employees as attended!\);
    } catch (err) {
      console.error(err);
      setScanStatus('Error processing sign sheet.');
    }
    setOcrLoading(false);
    e.target.value = '';
  };
;
code = code.replace("  const [waQrCode, setWaQrCode] = useState(null);", stateReplacement);

// Add Tab
const tabTarget = "['photos', 'integrations', 'whatsapp', 'backups', 'general']";
const tabReplacement = "['photos', 'attendance-scan', 'integrations', 'whatsapp', 'backups', 'general']";
code = code.replace(tabTarget, tabReplacement);

// Update Tab Labels
const tabLabelTarget = "{tab === 'photos' ? 'Bulk Staff Photos' : tab === 'integrations' ? 'Form Integrations' : tab === 'whatsapp' ? 'WhatsApp Setup' : tab === 'backups' ? 'Backups & Storage' : 'General Preferences'}";
const tabLabelReplacement = "{tab === 'photos' ? 'Bulk Staff Photos' : tab === 'attendance-scan' ? 'Scan Attendance Sheets' : tab === 'integrations' ? 'Form Integrations' : tab === 'whatsapp' ? 'WhatsApp Setup' : tab === 'backups' ? 'Backups & Storage' : 'General Preferences'}";
code = code.replace(tabLabelTarget, tabLabelReplacement);

// Add Tab Content
const tabContent = 
      {activeTab === 'attendance-scan' && (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <section className="bg-brand-card border border-gray-800 rounded-2xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-blue-200 mb-2 flex items-center gap-3"><ScanLine className="text-brand-primary w-6 h-6" /> Scan Attendance Sheets</h2>
            <p className="text-gray-400 mb-6">Upload an image of your signed attendance sheet. The AI will automatically extract employee numbers and mark them as present for the selected training session.</p>
            
            <div className="mb-6">
              <label className="block text-sm text-gray-400 mb-2 font-semibold">1. Select Training Session</label>
              <select 
                value={selectedScanTrainingId}
                onChange={(e) => setSelectedScanTrainingId(e.target.value)}
                className="w-full bg-[#181818] border border-gray-700 rounded-xl px-4 py-3 text-blue-200 focus:outline-none focus:border-brand-primary"
              >
                <option value="">-- Choose a Training Session --</option>
                {trainings.map(t => (
                  <option key={t.id} value={t.id}>
                    {new Date(t.training_date).toLocaleDateString()} - {t.topic} ({t.department})
                  </option>
                ))}
              </select>
            </div>

            <div className={\g-gray-900 border-2 border-dashed \ transition-colors rounded-2xl p-10 text-center relative group\}>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleScanUpload} 
                disabled={!selectedScanTrainingId || ocrLoading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed" 
              />
              {ocrLoading ? (
                 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
              ) : (
                 <Upload className="w-12 h-12 text-gray-500 group-hover:text-brand-primary transition-colors mx-auto mb-4" />
              )}
              <h3 className="text-xl font-bold text-blue-200 mb-2">{ocrLoading ? 'Scanning...' : 'Upload Sign Sheet Photo'}</h3>
              <p className="text-gray-500 text-sm">
                 {!selectedScanTrainingId ? 'Select a training session first' : 'Click to browse or drag & drop an image'}
              </p>
            </div>

            {scanStatus && (
              <div className={\mt-6 p-4 rounded-xl border \\}>
                <p className="font-semibold text-center">{scanStatus}</p>
              </div>
            )}
          </section>
        </div>
      )}
;

code = code.replace("{activeTab === 'integrations' && (", tabContent + "\n\n      {activeTab === 'integrations' && (");

fs.writeFileSync('frontend/src/pages/Settings.jsx', code, 'utf8');
console.log('Fixed Settings.jsx');
