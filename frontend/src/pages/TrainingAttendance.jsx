import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Tesseract from 'tesseract.js';
import { Calendar, Search, FileText, CheckCircle, XCircle, Link as LinkIcon, Upload, Users, Save } from 'lucide-react';




const DEPARTMENTS = ['Rooms', 'Public Area', 'Laundry', 'Flower', 'Stores', 'Coordinator', 'Hotel School', 'Cinnamon Hotel Academy', 'General'];

export default function TrainingAttendance() {
  const [trainings, setTrainings] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedTrainingId, setSelectedTrainingId] = useState('');
  
  const [attended, setAttended] = useState([]);
  const [absent, setAbsent] = useState([]);
  
  const [googleFormLink, setGoogleFormLink] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [message, setMessage] = useState('');

  const fileInputRef = useRef(null);
  
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  useEffect(() => {
    fetchTrainings();
  }, []);

  const fetchTrainings = async () => {
    try {
      const res = await axios.get('/api/trainings');
      setTrainings(res.data);
    } catch (err) {
      console.error(err);
      showMessage('Error fetching trainings', 'error');
    }
  };

  useEffect(() => {
    if (selectedTrainingId) {
      fetchAttendanceSummary();
      const tr = trainings.find(t => t.id === Number(selectedTrainingId));
      if (tr) {
        setGoogleFormLink(tr.google_form_link || '');
      }
    } else {
      setAttended([]);
      setAbsent([]);
      setGoogleFormLink('');
    }
  }, [selectedTrainingId, trainings]);

  const fetchAttendanceSummary = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/trainings/' + selectedTrainingId + '/attendance-summary');
      setAttended(res.data.attended || []);
      setAbsent(res.data.absent || []);
    } catch (err) {
      console.error(err);
      showMessage('Error fetching attendance summary', 'error');
    }
    setLoading(false);
  };

  const showMessage = (msg, type = 'success') => {
    setMessage({ text: msg, type });
    setTimeout(() => setMessage(''), 3000);
  };

  const saveGoogleFormLink = async () => {
    if (!selectedTrainingId) return;
    const tr = trainings.find(t => t.id === Number(selectedTrainingId));
    if (!tr) return;

    try {
      await axios.put('/api/trainings/' + selectedTrainingId, {
        ...tr,
        google_form_link: googleFormLink
      });
      showMessage('Google Form link saved!', 'success');
      fetchTrainings(); // Refresh data
    } catch (err) {
      console.error(err);
      showMessage('Error saving link', 'error');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedTrainingId) return;

    setOcrLoading(true);
    showMessage('Analyzing sign sheet with AI... This may take a minute.', 'info');

    try {
      const { data: { text } } = await Tesseract.recognize(file, 'eng');
      
      // Look for standard employee numbers (4-6 digits)
      const numbers = text.match(/\b\d{4,6}\b/g) || [];
      const uniqueNumbers = [...new Set(numbers)];
      
      if (uniqueNumbers.length === 0) {
        showMessage('No employee numbers found in image.', 'error');
        setOcrLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      const res = await axios.post('/api/trainings/' + selectedTrainingId + '/attendance/bulk', {
        emp_nos: uniqueNumbers
      });

      showMessage('Successfully marked ' + res.data.added + ' employees as attended!', 'success');
      fetchAttendanceSummary();
    } catch (err) {
      console.error(err);
      showMessage('Error processing sign sheet', 'error');
    }
    setOcrLoading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Filter trainings by selected month and department
  const filteredTrainings = trainings.filter(t => {
    if (!t.training_date) return false;
    const matchesMonth = new Date(t.training_date).getMonth() === selectedMonth;
    const matchesDept = selectedDepartment === '' || t.department === selectedDepartment;
    return matchesMonth && matchesDept;
  });

  return (
    <div className="p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-brand-primary tracking-tight mb-2">Training Attendance</h1>
        <p className="text-gray-400">Manage and track session attendance via manual entry, AI OCR, and Google Forms.</p>
      </header>

      {message && (
        <div className={'mb-6 p-4 rounded-lg flex items-center gap-3 ' + (message.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : message.type === 'info' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20')}>
          {message.type === 'error' ? <XCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
          {message.text}
        </div>
      )}

      {/* Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-brand-card p-6 rounded-2xl border border-gray-800 shadow-xl">
          <label className="block text-sm text-gray-400 mb-2">Select Month</label>
          <select 
            value={selectedMonth}
            onChange={(e) => {
              setSelectedMonth(Number(e.target.value));
              setSelectedTrainingId('');
            }}
            className="w-full bg-[#181818] border border-gray-800 rounded-lg text-blue-200 px-4 py-3 focus:outline-none focus:border-brand-primary transition-colors"
          >
            {monthNames.map((m, i) => (
              <option key={i} value={i}>{m}</option>
            ))}
          </select>
        </div>

        <div className="bg-brand-card p-6 rounded-2xl border border-gray-800 shadow-xl">
          <label className="block text-sm text-gray-400 mb-2">Select Department</label>
          <select 
            value={selectedDepartment}
            onChange={(e) => {
              setSelectedDepartment(e.target.value);
              setSelectedTrainingId('');
            }}
            className="w-full bg-[#181818] border border-gray-800 rounded-lg text-blue-200 px-4 py-3 focus:outline-none focus:border-brand-primary transition-colors"
          >
            <option value="">All Departments</option>
            {DEPARTMENTS.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>

        <div className="bg-brand-card p-6 rounded-2xl border border-gray-800 shadow-xl">
          <label className="block text-sm text-gray-400 mb-2">Select Training Session</label>
          <select 
            value={selectedTrainingId}
            onChange={(e) => setSelectedTrainingId(e.target.value)}
            className="w-full bg-[#181818] border border-gray-800 rounded-lg text-blue-200 px-4 py-3 focus:outline-none focus:border-brand-primary transition-colors"
          >
            <option value="">-- Choose a Session --</option>
            {filteredTrainings.map(t => (
              <option key={t.id} value={t.id}>
                {new Date(t.training_date).toLocaleDateString()} - {t.topic} ({t.venue})
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedTrainingId && (
        <>
          {/* Action Tools */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-brand-card p-6 rounded-2xl border border-gray-800 shadow-xl">
              <h3 className="text-lg font-bold text-blue-200 mb-4 flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-brand-primary" />
                Google Forms Attendance Link
              </h3>
              <div className="flex gap-3">
                <input 
                  type="text" 
                  value={googleFormLink}
                  onChange={(e) => setGoogleFormLink(e.target.value)}
                  placeholder="Paste Google Form or Sheet URL..."
                  className="flex-1 bg-[#181818] border border-gray-800 rounded-lg text-blue-200 px-4 py-2 focus:outline-none focus:border-brand-primary"
                />
                <button 
                  onClick={saveGoogleFormLink}
                  className="bg-brand-primary/10 text-brand-primary hover:bg-brand-primary hover:text-black px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2"
                >
                  <Save className="w-4 h-4" /> Save
                </button>
              </div>
              {googleFormLink && (
                <div className="mt-3">
                  <a href={googleFormLink} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-400 hover:underline break-all">
                    Open Linked Form / Sheet
                  </a>
                </div>
              )}
            </div>

            <div className="bg-brand-card p-6 rounded-2xl border border-gray-800 shadow-xl">
              <h3 className="text-lg font-bold text-blue-200 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand-primary" />
                Upload Manual Sign Sheet (OCR)
              </h3>
              <p className="text-sm text-gray-400 mb-4">
                Take a photo of the manual sign-in sheet. The AI will extract employee numbers and automatically mark them as present.
              </p>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept="image/*" 
                className="hidden" 
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={ocrLoading}
                className="w-full bg-gradient-to-r from-brand-primary to-yellow-600 hover:from-yellow-500 hover:to-orange-600 text-black font-bold py-3 px-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {ocrLoading ? (
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Upload className="w-5 h-5" />
                )}
                {ocrLoading ? 'Analyzing Image...' : 'Upload Sign Sheet Image'}
              </button>
            </div>
          </div>

          {/* Data Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Attended Table */}
            <div className="bg-brand-card p-6 rounded-2xl border border-green-500/20 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-green-400 flex items-center gap-2">
                  <CheckCircle className="w-6 h-6" />
                  Attended ({attended.length})
                </h3>
              </div>
              
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-800 text-gray-400 text-sm">
                      <th className="pb-3 font-medium">Emp No</th>
                      <th className="pb-3 font-medium">Name</th>
                      <th className="pb-3 font-medium">Department</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan="3" className="py-8 text-center text-gray-500">Loading...</td></tr>
                    ) : attended.length === 0 ? (
                      <tr><td colSpan="3" className="py-8 text-center text-gray-500 border-b border-gray-800/50">No records found.</td></tr>
                    ) : (
                      attended.map((emp, i) => (
                        <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                          <td className="py-3 text-blue-200">{emp.emp_no}</td>
                          <td className="py-3 text-gray-300">{emp.emp_name}</td>
                          <td className="py-3 text-gray-400 text-sm">{emp.department || 'N/A'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Absent Table */}
            <div className="bg-brand-card p-6 rounded-2xl border border-red-500/20 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-red-400 flex items-center gap-2">
                  <Users className="w-6 h-6" />
                  Did Not Attend ({absent.length})
                </h3>
              </div>
              
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-800 text-gray-400 text-sm">
                      <th className="pb-3 font-medium">Emp No</th>
                      <th className="pb-3 font-medium">Name</th>
                      <th className="pb-3 font-medium">Department</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan="3" className="py-8 text-center text-gray-500">Loading...</td></tr>
                    ) : absent.length === 0 ? (
                      <tr><td colSpan="3" className="py-8 text-center text-gray-500 border-b border-gray-800/50">Everyone attended!</td></tr>
                    ) : (
                      absent.map((emp, i) => (
                        <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                          <td className="py-3 text-blue-200">{emp.emp_no}</td>
                          <td className="py-3 text-gray-300">{emp.emp_name}</td>
                          <td className="py-3 text-gray-400 text-sm">{emp.department || 'N/A'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
}
