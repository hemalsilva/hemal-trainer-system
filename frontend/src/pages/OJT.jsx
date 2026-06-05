import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ClipboardCheck, User, MapPin, CheckCircle, XCircle, FileSignature, Calendar, Hash, Search, List, PenTool } from 'lucide-react';

export default function OJT() {
  const [activeTab, setActiveTab] = useState('record'); // 'record' or 'view'
  
  // Form State
  const [empDetails, setEmpDetails] = useState({
    emp_no: '',
    emp_name: '',
    department: '',
    assessment_date: new Date().toISOString().split('T')[0]
  });
  const [selectedTrainer, setSelectedTrainer] = useState('');
  const [rating, setRating] = useState(0);
  const [passFail, setPassFail] = useState(null); // true = pass, false = fail
  const [formData, setFormData] = useState({
    topic: '',
    location: '',
    assessment_notes: ''
  });

  // View State
  const [ojtRecords, setOjtRecords] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'view') {
      fetchRecords();
    }
  }, [activeTab]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/ojt');
      setOjtRecords(res.data);
    } catch (err) {
      console.error('Failed to fetch OJT records:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!empDetails.emp_no || !empDetails.emp_name || !selectedTrainer || rating === 0 || passFail === null) {
      alert('Please complete all required fields including employee details, trainer, rating, and verdict.');
      return;
    }

    const payload = {
      emp_no: empDetails.emp_no,
      emp_name: empDetails.emp_name,
      department: empDetails.department,
      assessment_date: empDetails.assessment_date,
      topic: formData.topic,
      trainer_name: selectedTrainer,
      location: formData.location,
      assessment_notes: formData.assessment_notes,
      rating: rating,
      pass_fail: passFail,
      completion_status: 'Completed'
    };

    try {
      await axios.post('/api/ojt', payload);
      alert('OJT Assessment Saved Successfully!');
      // Reset form
      setEmpDetails({ emp_no: '', emp_name: '', department: '', assessment_date: new Date().toISOString().split('T')[0] });
      setSelectedTrainer('');
      setRating(0);
      setPassFail(null);
      setFormData({ topic: '', location: '', assessment_notes: '' });
    } catch (err) {
      console.error(err);
      alert('Error saving assessment: ' + (err.response?.data?.error || err.message));
    }
  };

  const filteredRecords = ojtRecords.filter(r => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = (r.emp_name || '').toLowerCase().includes(query) || (r.emp_no || '').toLowerCase().includes(query);
    const matchesDept = selectedDept === 'All' || r.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="p-8 w-full max-w-5xl mx-auto pb-24">
      <header className="mb-8 border-b border-gray-800 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-blue-200 mb-2 tracking-tight flex items-center gap-3">
            <ClipboardCheck className="w-8 h-8 text-brand-primary" />
            OJT Assessments
          </h1>
          <p className="text-gray-400">Evaluate and track employee On-The-Job Training records.</p>
        </div>
        
        {/* Tabs */}
        <div className="flex bg-gray-900 rounded-lg p-1 border border-gray-800">
          <button 
            onClick={() => setActiveTab('record')} 
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-semibold text-sm transition-colors ${activeTab === 'record' ? 'bg-brand-primary text-black' : 'text-gray-400 hover:text-blue-200'}`}
          >
            <PenTool className="w-4 h-4" /> Record Assessment
          </button>
          <button 
            onClick={() => setActiveTab('view')} 
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-semibold text-sm transition-colors ${activeTab === 'view' ? 'bg-brand-primary text-black' : 'text-gray-400 hover:text-blue-200'}`}
          >
            <List className="w-4 h-4" /> View Records
          </button>
        </div>
      </header>

      {activeTab === 'record' ? (
        <div className="bg-brand-card rounded-2xl border border-gray-800 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Trainee Details Header */}
          <div className="p-8 border-b border-gray-800 bg-[#181818]">
            <h2 className="text-xl font-bold text-blue-200 mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-brand-primary" /> Trainee Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Employee Number</label>
                <div className="relative">
                  <Hash className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    value={empDetails.emp_no} 
                    onChange={(e) => setEmpDetails({...empDetails, emp_no: e.target.value})} 
                    placeholder="e.g. EMP-001"
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-blue-200 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Employee Name</label>
                <div className="relative">
                  <User className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    value={empDetails.emp_name} 
                    onChange={(e) => setEmpDetails({...empDetails, emp_name: e.target.value})} 
                    placeholder="Full Name"
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-blue-200 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Department</label>
                <div className="relative">
                  <select 
                    value={empDetails.department}
                    onChange={(e) => setEmpDetails({...empDetails, department: e.target.value})}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-blue-200 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all appearance-none"
                  >
                    <option value="" disabled>Select Dept...</option>
                    <option value="Rooms">Rooms</option>
                    <option value="Public Area">Public Area</option>
                    <option value="Laundry">Laundry</option>
                    <option value="Flower">Flower</option>
                    <option value="Stores">Stores</option>
                    <option value="Coordinator">Coordinator</option>
                    <option value="Hotel School">Hotel School</option>
                    <option value="Cinnamon Hotel Academy">Cinnamon Hotel Academy</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Assessment Date</label>
                <div className="relative">
                  <Calendar className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="date" 
                    value={empDetails.assessment_date} 
                    onChange={(e) => setEmpDetails({...empDetails, assessment_date: e.target.value})} 
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-blue-200 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all"
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Assessment Form */}
          <div className="p-8 space-y-10">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <h3 className="text-blue-200 font-bold text-lg border-b border-gray-800 pb-2">Session Details</h3>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Topic</label>
                  <input type="text" value={formData.topic} onChange={(e) => setFormData({...formData, topic: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-blue-200 focus:border-brand-primary outline-none transition-all" placeholder="e.g. Room Service Etiquette" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Location / Venue</label>
                  <input type="text" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-blue-200 focus:border-brand-primary outline-none transition-all" placeholder="e.g. Suite 401" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Trainer Name</label>
                  <input type="text" value={selectedTrainer} onChange={(e) => setSelectedTrainer(e.target.value)} placeholder="Evaluating Trainer" className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-blue-200 focus:border-brand-primary outline-none transition-all" />
                </div>
              </div>

              <div>
                <h3 className="text-blue-200 font-bold text-lg border-b border-gray-800 pb-2 mb-6">Skill Checklist</h3>
                <div className="space-y-3">
                  {['Presentation', 'Proper technique', 'Knowledge of SOP', 'Timing'].map((skill, i) => (
                    <label key={i} className="flex items-center gap-4 p-4 rounded-xl border border-gray-800 bg-gray-900/50 hover:bg-gray-800/80 cursor-pointer transition-colors shadow-sm">
                      <input type="checkbox" className="w-5 h-5 rounded border-gray-600 text-brand-primary focus:ring-brand-primary focus:ring-offset-gray-900 bg-gray-800" />
                      <span className="text-gray-200 font-medium">{skill}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* Performance Rating */}
              <div className="bg-gray-900/30 p-6 rounded-2xl border border-gray-800">
                <h3 className="text-blue-200 font-bold mb-4 text-lg">Performance Rating</h3>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button 
                      key={star}
                      onClick={() => setRating(star)}
                      className="focus:outline-none hover:scale-110 transition-transform"
                    >
                      <svg 
                        className={`w-10 h-10 drop-shadow-md ${star <= rating ? 'text-brand-primary fill-current' : 'text-gray-700 stroke-current fill-none'}`} 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </button>
                  ))}
                  <span className="ml-4 text-gray-400 font-medium">
                    {rating === 0 ? 'Select rating' : `${rating} out of 5`}
                  </span>
                </div>
              </div>

              {/* Final Verdict */}
              <div className="bg-gray-900/30 p-6 rounded-2xl border border-gray-800">
                <h3 className="text-blue-200 font-bold mb-4 text-lg">Final Verdict</h3>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setPassFail(true)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${passFail === true ? 'bg-green-500 text-blue-200 shadow-[0_0_15px_rgba(34,197,94,0.3)] scale-[1.02]' : 'bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500/20'}`}
                  >
                    <CheckCircle className="w-5 h-5" /> PASS
                  </button>
                  <button 
                    onClick={() => setPassFail(false)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${passFail === false ? 'bg-red-500 text-blue-200 shadow-[0_0_15px_rgba(239,68,68,0.3)] scale-[1.02]' : 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20'}`}
                  >
                    <XCircle className="w-5 h-5" /> FAIL
                  </button>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <h3 className="text-blue-200 font-bold text-lg border-b border-gray-800 pb-2 mb-6">Assessment Notes</h3>
              <textarea 
                rows="4" 
                value={formData.assessment_notes}
                onChange={(e) => setFormData({...formData, assessment_notes: e.target.value})}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl p-4 text-blue-200 placeholder-gray-500 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors"
                placeholder="Enter detailed observation notes here..."
              ></textarea>
            </div>

            <div className="pt-8 border-t border-gray-800 flex justify-end gap-4">
              <button className="bg-brand-primary hover:bg-brand-primaryHover text-black px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-[0_4px_14px_0_rgba(212,175,55,0.39)] transition-transform hover:-translate-y-0.5" onClick={handleSubmit}>
                <FileSignature className="w-5 h-5" />
                Sign & Submit Record
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-brand-card border border-gray-800 rounded-2xl shadow-lg overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="p-6 border-b border-gray-800 flex items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-blue-200 flex items-center gap-2">
              <List className="w-5 h-5 text-brand-primary" /> OJT Records Directory
            </h2>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative w-full md:w-64">
                <Search className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text"
                  placeholder="Search Employee..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-10 pr-4 py-2 text-sm text-blue-200 focus:border-brand-primary outline-none"
                />
              </div>
              <select 
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-sm text-blue-200 focus:border-brand-primary outline-none"
              >
                <option value="All">All Departments</option>
                <option value="Rooms">Rooms</option>
                <option value="Public Area">Public Area</option>
                <option value="Laundry">Laundry</option>
                <option value="Flower">Flower</option>
                <option value="Stores">Stores</option>
                <option value="Coordinator">Coordinator</option>
                <option value="Hotel School">Hotel School</option>
                <option value="Cinnamon Hotel Academy">Cinnamon Hotel Academy</option>
                <option value="General">General</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#1a1a1a] border-b border-gray-800 text-gray-400 text-sm uppercase tracking-wider">
                  <th className="p-4 font-semibold">Date</th>
                  <th className="p-4 font-semibold">Employee</th>
                  <th className="p-4 font-semibold">Topic</th>
                  <th className="p-4 font-semibold">Trainer</th>
                  <th className="p-4 font-semibold text-center">Rating</th>
                  <th className="p-4 font-semibold text-center">Verdict</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {loading ? (
                  <tr><td colSpan="6" className="p-8 text-center text-gray-500">Loading records...</td></tr>
                ) : filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-12 text-center text-gray-500">
                      <List className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                      <p className="font-semibold text-lg">No OJT Records Found</p>
                      <p className="text-sm">Adjust your search or add a new record.</p>
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map(record => (
                    <tr key={record.id} className="hover:bg-gray-900/50 transition-colors">
                      <td className="p-4 whitespace-nowrap text-gray-300">
                        {new Date(record.assessment_date).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-blue-200">{record.emp_name}</div>
                        <div className="text-xs text-gray-500 font-mono">{record.emp_no}</div>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/20 truncate max-w-[200px]">
                          {record.topic}
                        </span>
                      </td>
                      <td className="p-4 text-gray-300">
                        {record.trainer_name}
                      </td>
                      <td className="p-4 text-center">
                        <div className="inline-flex items-center gap-1 font-bold text-brand-primary bg-brand-primary/10 px-3 py-1 rounded-full border border-brand-primary/20">
                          {record.rating} / 5
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        {record.pass_fail ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 font-bold text-sm">
                            <CheckCircle className="w-4 h-4" /> Pass
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-400 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20 font-bold text-sm">
                            <XCircle className="w-4 h-4" /> Fail
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
