import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Tesseract from 'tesseract.js';
import { Calendar, Search, FileText, CheckCircle, XCircle, Link as LinkIcon, Upload, Users, Save, Plus, X } from 'lucide-react';




const DEPARTMENTS = ['All Staff', 'Rooms', 'Public Area', 'Laundry', 'Flower', 'Stores', 'Coordinator', 'Hotel School', 'Cinnamon Hotel Academy', 'General'];

export default function TrainingAttendance() {
  const [trainings, setTrainings] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ topic: '', category: 'Mandatory', venue: '', duration: 60, trainer: '', training_date: '', department: '' });
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedTrainingId, setSelectedTrainingId] = useState('');
  
  const [attended, setAttended] = useState([]);
  const [absent, setAbsent] = useState([]);
  
  const [googleFormLink, setGoogleFormLink] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [employees, setEmployees] = useState([]);
  const [manualRows, setManualRows] = useState([{ emp_no: '', emp_name: '' }]);
  const [savingManual, setSavingManual] = useState(false);
  const rowRefs = useRef([]);

  const fileInputRef = useRef(null);
  
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  useEffect(() => {
    fetchTrainings();
    fetchEmployees();
    
  }, []);

  
  
  
  const removeAttendance = async (empNo) => {
    if (!window.confirm('Are you sure you want to remove this staff member from the attendance list?')) return;
    try {
      await axios.delete(`/api/trainings/${selectedTrainingId}/attendance/${empNo}`);
      fetchAttendanceSummary();
      showMessage('Attendance record removed', 'success');
    } catch (err) {
      console.error(err);
      showMessage('Failed to remove attendance', 'error');
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        training_date: formData.training_date ? new Date(formData.training_date).toISOString() : null,
        venue: formData.venue || 'Main Room',
        trainer: formData.trainer || 'TBD',
        duration: formData.duration || 60,
      };
      await axios.post('/api/trainings', payload);
      setShowAddModal(false);
      setFormData({ topic: '', category: 'Mandatory', venue: '', duration: 60, trainer: '', training_date: '', department: '' });
      fetchTrainings();
      showMessage('Session scheduled successfully!', 'success');
    } catch (err) {
      alert('Error scheduling session: ' + (err?.response?.data?.error || err.message));
    }
  };
  
  const fetchEmployees = async () => {
    try {
      const res = await axios.get(`/api/employees?t=${Date.now()}&t=${Date.now()}`);
      setEmployees(res.data);
    } catch (err) {
      console.error(err);
    }
  };
  
  const fetchTrainings = async () => {
    try {
      const res = await axios.get(`/api/trainings?t=${Date.now()}&t=${Date.now()}`);
      setTrainings(res.data);
    } catch (err) {
      console.error(err);
      showMessage('Error fetching trainings', 'error');
    }
  };

  useEffect(() => {
    if (selectedTrainingId) {
      fetchAttendanceSummary();
      const interval = setInterval(() => fetchAttendanceSummary(true), 5000);
      window.__taInterval = interval;
      const tr = trainings.find(t => t.id === Number(selectedTrainingId));
      if (tr) {
        setGoogleFormLink(tr.google_form_link || '');
      }
    } else {
      setAttended([]);
      setAbsent([]);
      setGoogleFormLink('');
    }
    return () => { if (window.__taInterval) clearInterval(window.__taInterval); };
  }, [selectedTrainingId, trainings]);

  const fetchAttendanceSummary = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const res = await axios.get('/api/trainings/' + selectedTrainingId + '/attendance-summary');
      setAttended(res.data.attended || []);
      setAbsent(res.data.absent || []);
    } catch (err) {
      console.error(err);
      if (!isBackground) showMessage('Error fetching attendance summary', 'error');
    }
    if (!isBackground) setLoading(false);
  };

  const showMessage = (msg, type = 'success') => {
    setMessage({ text: msg, type });
    setTimeout(() => setMessage(''), 3000);
  };

  
  const handleManualRowChange = (index, field, value) => {
    const newRows = [...manualRows];
    newRows[index][field] = value;
    
    if (field === 'emp_no') {
      const emp = employees.find(e => e.emp_no === value);
      if (emp) {
        newRows[index].emp_name = emp.full_name;
      }
    } else if (field === 'emp_name') {
      const emp = employees.find(e => e.full_name.toLowerCase() === value.toLowerCase());
      if (emp) {
        newRows[index].emp_no = emp.emp_no;
      }
    }
    setManualRows(newRows);
  };

  const handleManualKeyDown = (e, index) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Auto add new row on Enter up to 50
      if (index === manualRows.length - 1 && manualRows.length < 50) {
        setManualRows([...manualRows, { emp_no: '', emp_name: '' }]);
        setTimeout(() => {
          if (rowRefs.current[index + 1]) rowRefs.current[index + 1].focus();
        }, 50);
      } else if (index < manualRows.length - 1) {
        if (rowRefs.current[index + 1]) rowRefs.current[index + 1].focus();
      }
    }
  };

  const handleSaveManual = async () => {
    if (!selectedTrainingId) return showMessage('Please select a training session first', 'error');
    const validRows = manualRows.filter(r => r.emp_no || r.emp_name);
    if (validRows.length === 0) return showMessage('No valid employee records to save', 'error');

    const tr = trainings.find(t => t.id === Number(selectedTrainingId));
    if (tr && tr.department && tr.department !== 'General') {
      const mismatchedEmployees = [];
      for (const row of validRows) {
        const emp = employees.find(e => e.emp_no === row.emp_no);
        if (emp && emp.department !== tr.department) {
          mismatchedEmployees.push(`${emp.full_name || emp.emp_name || row.emp_no} (${emp.department})`);
        }
      }
      if (mismatchedEmployees.length > 0) {
        const confirmMsg = `The following staff belong to different departments, but this training is for ${tr.department}:\n\n` +
                           mismatchedEmployees.join('\n') +
                           `\n\nDo you still want to add them to this attendance?`;
        if (!window.confirm(confirmMsg)) {
          return;
        }
      }
    }

    setSavingManual(true);
    try {
      const res = await axios.post(`/api/trainings/${selectedTrainingId}/attendance/bulk`, { records: validRows });
      showMessage(`Successfully marked ${res.data.added} employees as attended!`, 'success');
      fetchAttendanceSummary();
      setManualRows([{ emp_no: '', emp_name: '' }]);
      if (rowRefs.current[0]) rowRefs.current[0].focus();
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.error || err.message || 'Unknown error';
      showMessage('Error: ' + errMsg, 'error');
    }
    setSavingManual(false);
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
      
      // Look for standard employee numbers (EMP-XXX or just digits)
      const empMatches = text.match(/EMP-\d+/gi) || [];
      const numbers = text.match(/\b\d{4,6}\b/g) || [];
      const combined = [...empMatches.map(m => m.toUpperCase()), ...numbers];
      const uniqueNumbers = [...new Set(combined)];
      
      if (uniqueNumbers.length === 0) {
        showMessage('No employee numbers found in image.', 'error');
        setOcrLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      const tr = trainings.find(t => t.id === Number(selectedTrainingId));
      if (tr && tr.department && tr.department !== 'General') {
        const mismatchedEmployees = [];
        for (const empNo of uniqueNumbers) {
          const emp = employees.find(e => e.emp_no === empNo);
          if (emp && emp.department !== tr.department) {
            mismatchedEmployees.push(`${emp.full_name || empNo} (${emp.department})`);
          }
        }
        if (mismatchedEmployees.length > 0) {
          const confirmMsg = `The sign sheet contains staff from different departments, but this training is for ${tr.department}:\n\n` +
                             mismatchedEmployees.join('\n') +
                             `\n\nDo you still want to add them?`;
          if (!window.confirm(confirmMsg)) {
            setOcrLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
          }
        }
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
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-brand-primary tracking-tight mb-2">Training Attendance</h1>
          <p className="text-gray-400">Manage and track session attendance via manual entry, AI OCR, and Google Forms.</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="bg-brand-primary hover:bg-brand-primaryHover text-black px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors">
          <Plus className="w-5 h-5" /> Schedule New Training
        </button>
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
          
      {selectedTrainingId && (
        <div className="bg-brand-card p-6 rounded-2xl border border-gray-800 shadow-xl mb-8 animate-in fade-in slide-in-from-bottom-4">
          <h3 className="text-xl font-bold text-blue-200 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-primary" />
            Fast Manual Entry (Bulk Update)
          </h3>
          <p className="text-sm text-gray-400 mb-4">
            Type Employee No and press Enter to quickly add multiple employees. Up to 50 at once.
          </p>
          
          <datalist id="employee-names-list">{employees.map((e, i) => <option key={i} value={e.full_name} />)}</datalist>
          <div className="space-y-3 mb-6 max-h-[400px] overflow-y-auto pr-2">
            {manualRows.map((row, idx) => (
              <div key={idx} className="flex items-center gap-4 animate-in fade-in slide-in-from-left-4">
                <span className="text-gray-500 font-mono w-6 text-right">{idx + 1}.</span>
                <input 
                  type="text"
                  placeholder="Employee No (e.g. 8000123)"
                  value={row.emp_no}
                  onChange={(e) => handleManualRowChange(idx, 'emp_no', e.target.value)}
                  onKeyDown={(e) => handleManualKeyDown(e, idx)}
                  ref={el => rowRefs.current[idx] = el}
                  className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-blue-200 focus:border-brand-primary outline-none max-w-[250px]"
                />
                <input type="text" list="employee-names-list" placeholder="Name (Search or Type)" value={row.emp_name} onChange={(e) => handleManualRowChange(idx, 'emp_name', e.target.value)} onKeyDown={(e) => handleManualKeyDown(e, idx)} className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-blue-200 focus:border-brand-primary outline-none max-w-[300px]" />
              </div>
            ))}
          </div>
          
          <button 
            onClick={handleSaveManual}
            disabled={savingManual || manualRows.filter(r=>r.emp_no || r.emp_name).length === 0}
            className="bg-brand-primary hover:bg-brand-primaryHover text-black px-8 py-3 rounded-xl font-bold transition-transform hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 shadow-[0_4px_14px_0_rgba(212,175,55,0.39)] flex items-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            {savingManual ? 'Saving...' : `Save ${manualRows.filter(r=>r.emp_no || r.emp_name).length} Records`}
          </button>
        </div>
      )}
  
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
                Scan Sign Sheet (OCR)
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
                {ocrLoading ? 'Analyzing Image...' : 'Scan Sign Sheet'}
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
                      <tr><td colSpan="4" className="py-8 text-center text-gray-500">Loading...</td></tr>
                    ) : attended.length === 0 ? (
                      <tr><td colSpan="4" className="py-8 text-center text-gray-500 border-b border-gray-800/50">No records found.</td></tr>
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
                      <tr><td colSpan="4" className="py-8 text-center text-gray-500">Loading...</td></tr>
                    ) : absent.length === 0 ? (
                      <tr><td colSpan="4" className="py-8 text-center text-gray-500 border-b border-gray-800/50">Everyone attended!</td></tr>
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
﻿      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#242b3d] border border-gray-800 rounded-2xl max-w-md w-full p-6 relative">
            <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            <h2 className="text-xl font-bold text-blue-100 mb-6">Schedule New Training</h2>
            
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Topic</label>
                <input required list="ta-topics-list" value={formData.topic} onChange={e => setFormData({...formData, topic: e.target.value})} className="w-full bg-[#161a22] border border-gray-700 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none" />
                <datalist id="ta-topics-list">
                  {[...new Set(trainings.filter(t => !formData.department || t.department === formData.department || t.department === 'All Staff').map(t => t.topic))].sort().map((topic, i) => <option key={i} value={topic} />)}
                </datalist>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Department</label>
                <select value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="w-full bg-[#161a22] border border-gray-700 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none">
                  <option value="">Select Department</option>
                  <option value="All Staff">All Staff</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">Category</label>
                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-[#161a22] border border-gray-700 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none">
                  <option value="Mandatory">Mandatory</option>
                  <option value="Optional">Optional</option>
                  <option value="Compliance">Compliance</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Trainer</label>
                <input value={formData.trainer} onChange={e => setFormData({...formData, trainer: e.target.value})} className="w-full bg-[#161a22] border border-gray-700 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none" placeholder="TBD" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Venue</label>
                    <input value={formData.venue} onChange={e => setFormData({...formData, venue: e.target.value})} className="w-full bg-[#161a22] border border-gray-700 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none" placeholder="Main Room" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Duration (mins)</label>
                    <select value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} className="w-full bg-[#161a22] border border-gray-700 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none"><option value="30">30 mins</option><option value="60">1 Hour</option><option value="90">1.5 Hours</option><option value="120">2 Hours</option><option value="180">3 Hours</option><option value="240">4 Hours</option></select>
                  </div>
                </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Date & Time</label>
                <input required type="datetime-local" value={formData.training_date} onChange={e => setFormData({...formData, training_date: e.target.value})} className="w-full bg-[#161a22] border border-gray-700 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none [color-scheme:dark]" />
              </div>

              <button type="submit" className="w-full mt-4 bg-blue-500 hover:bg-blue-600 text-black py-3 rounded-lg font-bold transition-colors">
                Save Session
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}


