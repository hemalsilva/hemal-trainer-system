import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

export default function OCRScan() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileDrop = (e) => {
    e.preventDefault();
    const uploadedFile = e.dataTransfer ? e.dataTransfer.files[0] : e.target.files[0];
    if (uploadedFile && uploadedFile.type.startsWith('image/')) {
      setFile(uploadedFile);
      setPreview(URL.createObjectURL(uploadedFile));
    }
  };

  const handleScan = () => {
    if (!file) return;
    setScanning(true);
    
    // Simulating OCR extraction delay
    setTimeout(() => {
      setScanning(false);
      setResult({
        employees: ['EMP-001', 'EMP-004', 'EMP-012'],
        topic: 'Fire Safety Protocol',
        confidence: '94%'
      });
    }, 3000);
  };

  return (
    <div className="p-8 w-full max-w-5xl mx-auto pb-24">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">AI Attendance Scanner</h1>
        <p className="text-gray-400">Upload physical attendance sheets. Our OCR engine will automatically extract attendees.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Section */}
        <div className="bg-brand-card rounded-2xl border border-gray-800 p-8 flex flex-col">
          <h2 className="text-xl font-bold text-white mb-6">Upload Document</h2>
          
          <div 
            className={`flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-8 transition-colors ${preview ? 'border-brand-gold/50 bg-brand-gold/5' : 'border-gray-700 hover:border-gray-500 hover:bg-gray-800/50 cursor-pointer'}`}
            onClick={() => !preview && fileInputRef.current.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileDrop} 
              accept="image/*" 
              className="hidden" 
            />
            
            {preview ? (
              <div className="w-full flex flex-col items-center">
                <img src={preview} alt="Document Preview" className="max-h-64 object-contain mb-4 rounded shadow-lg" />
                <button 
                  onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null); setResult(null); }}
                  className="text-sm text-gray-400 hover:text-red-400"
                >
                  Remove Image
                </button>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UploadCloud className="w-8 h-8 text-brand-gold" />
                </div>
                <p className="text-white font-medium mb-1">Click to upload or drag and drop</p>
                <p className="text-sm text-gray-500">JPG, PNG, or TIFF (Max 10MB)</p>
              </div>
            )}
          </div>

          <button 
            onClick={handleScan}
            disabled={!file || scanning}
            className={`mt-6 w-full py-3 rounded-lg font-bold text-black transition-all ${
              !file ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 
              scanning ? 'bg-brand-gold/50' : 'bg-brand-gold hover:bg-brand-goldHover shadow-[0_0_15px_rgba(212,175,55,0.3)]'
            }`}
          >
            {scanning ? 'Scanning Document...' : 'Run OCR Extraction'}
          </button>
        </div>

        {/* Results Section */}
        <div className="bg-brand-card rounded-2xl border border-gray-800 p-8">
          <h2 className="text-xl font-bold text-white mb-6">Extraction Results</h2>
          
          {!result && !scanning && (
            <div className="h-full flex flex-col items-center justify-center text-gray-500">
              <FileText className="w-16 h-16 mb-4 opacity-20" />
              <p>Upload and scan a document to see results here.</p>
            </div>
          )}

          {scanning && (
            <div className="h-full flex flex-col items-center justify-center space-y-6">
              <div className="relative w-24 h-24">
                <div className="absolute inset-0 border-4 border-gray-700 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-brand-gold rounded-full border-t-transparent animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-brand-gold">AI</span>
                </div>
              </div>
              <p className="text-brand-gold animate-pulse">Running Tesseract.js Engine...</p>
            </div>
          )}

          {result && !scanning && (
            <div className="space-y-6 animate-in fade-in zoom-in duration-500">
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5" />
                <div>
                  <h4 className="text-green-400 font-bold">Extraction Successful</h4>
                  <p className="text-sm text-gray-400 mt-1">Confidence Score: <span className="text-white">{result.confidence}</span></p>
                </div>
              </div>

              <div>
                <h4 className="text-sm text-gray-400 uppercase tracking-wider font-bold mb-2">Detected Topic</h4>
                <div className="bg-[#181818] border border-gray-800 p-3 rounded-lg text-white font-medium">
                  {result.topic}
                </div>
              </div>

              <div>
                <h4 className="text-sm text-gray-400 uppercase tracking-wider font-bold mb-2">Detected Employee IDs ({result.employees.length})</h4>
                <div className="bg-[#181818] border border-gray-800 rounded-lg overflow-hidden divide-y divide-gray-800">
                  {result.employees.map((emp, i) => (
                    <div key={i} className="p-3 flex justify-between items-center text-gray-300">
                      <span>{emp}</span>
                      <span className="text-xs px-2 py-1 bg-green-500/10 text-green-400 rounded">Match Found</span>
                    </div>
                  ))}
                </div>
              </div>

              <button className="w-full bg-white hover:bg-gray-100 text-black py-3 rounded-lg font-bold transition-colors">
                Save to Database
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
