import React, { useState } from 'react';
import axios from 'axios';
import { ClipboardCheck, User, MapPin, CheckCircle, XCircle, FileSignature, Calendar, Hash } from 'lucide-react';

export default function OJT() {
  const [empDetails, setEmpDetails] = useState({
    emp_no: '',
    emp_name: '',
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

  const handleSubmit = async () => {
    if (!empDetails.emp_no || !empDetails.emp_name || !selectedTrainer || rating === 0 || passFail === null) {
      alert('Please complete all required fields including employee details, trainer, rating, and verdict.');
      return;
    }

    const payload = {
      emp_no: empDetails.emp_no,
      emp_name: empDetails.emp_name,
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
      await axios.post('http://localhost:5000/api/ojt', payload);
      alert('OJT Assessment Saved Successfully!');
      // Reset form
      setEmpDetails({ emp_no: '', emp_name: '', assessment_date: new Date().toISOString().split('T')[0] });
      setSelectedTrainer('');
      setRating(0);
      setPassFail(null);
      setFormData({ topic: '', location: '', assessment_notes: '' });
    } catch (err) {
      console.error(err);
      alert('Error saving assessment');
    }
  };

  return (
    <div className="p-8 w-full max-w-5xl mx-auto pb-24">
      <header className="mb-8 border-b border-gray-800 pb-6">
        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight flex items-center gap-3">
          <ClipboardCheck className="w-8 h-8 text-brand-gold" />
          OJT Assessment Record
        </h1>
        <p className="text-gray-400">Formal evaluation of employee performance during On-The-Job Training.</p>
      </header>

      <div className="bg-brand-card rounded-2xl border border-gray-800 shadow-2xl overflow-hidden">
        {/* Trainee Details Header */}
        <div className="p-8 border-b border-gray-800 bg-[#181818]">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <User className="w-5 h-5 text-brand-gold" /> Trainee Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Employee Number</label>
              <div className="relative">
                <Hash className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  value={empDetails.emp_no} 
                  onChange={(e) => setEmpDetails({...empDetails, emp_no: e.target.value})} 
                  placeholder="e.g. EMP-001"
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white focus:border-brand-gold focus:ring-1 focus:ring-brand-gold outline-none transition-all"
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
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white focus:border-brand-gold focus:ring-1 focus:ring-brand-gold outline-none transition-all"
                />
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
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white focus:border-brand-gold focus:ring-1 focus:ring-brand-gold outline-none transition-all"
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
              <h3 className="text-white font-bold text-lg border-b border-gray-800 pb-2">Session Details</h3>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Topic</label>
                <input type="text" value={formData.topic} onChange={(e) => setFormData({...formData, topic: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white focus:border-brand-gold outline-none transition-all" placeholder="e.g. Room Service Etiquette" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Location / Venue</label>
                <input type="text" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white focus:border-brand-gold outline-none transition-all" placeholder="e.g. Suite 401" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Trainer Name</label>
                <input type="text" value={selectedTrainer} onChange={(e) => setSelectedTrainer(e.target.value)} placeholder="Evaluating Trainer" className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white focus:border-brand-gold outline-none transition-all" />
              </div>
            </div>

            <div>
              <h3 className="text-white font-bold text-lg border-b border-gray-800 pb-2 mb-6">Skill Checklist</h3>
              <div className="space-y-3">
                {['Presentation', 'Proper technique', 'Knowledge of SOP', 'Timing'].map((skill, i) => (
                  <label key={i} className="flex items-center gap-4 p-4 rounded-xl border border-gray-800 bg-gray-900/50 hover:bg-gray-800/80 cursor-pointer transition-colors shadow-sm">
                    <input type="checkbox" className="w-5 h-5 rounded border-gray-600 text-brand-gold focus:ring-brand-gold focus:ring-offset-gray-900 bg-gray-800" />
                    <span className="text-gray-200 font-medium">{skill}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Performance Rating */}
            <div className="bg-gray-900/30 p-6 rounded-2xl border border-gray-800">
              <h3 className="text-white font-bold mb-4 text-lg">Performance Rating</h3>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button 
                    key={star}
                    onClick={() => setRating(star)}
                    className="focus:outline-none hover:scale-110 transition-transform"
                  >
                    <svg 
                      className={`w-10 h-10 drop-shadow-md ${star <= rating ? 'text-brand-gold fill-current' : 'text-gray-700 stroke-current fill-none'}`} 
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
              <h3 className="text-white font-bold mb-4 text-lg">Final Verdict</h3>
              <div className="flex gap-4">
                <button 
                  onClick={() => setPassFail(true)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${passFail === true ? 'bg-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.3)] scale-[1.02]' : 'bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500/20'}`}
                >
                  <CheckCircle className="w-5 h-5" /> PASS
                </button>
                <button 
                  onClick={() => setPassFail(false)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${passFail === false ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)] scale-[1.02]' : 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20'}`}
                >
                  <XCircle className="w-5 h-5" /> FAIL
                </button>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <h3 className="text-white font-bold text-lg border-b border-gray-800 pb-2 mb-6">Assessment Notes</h3>
            <textarea 
              rows="4" 
              value={formData.assessment_notes}
              onChange={(e) => setFormData({...formData, assessment_notes: e.target.value})}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition-colors"
              placeholder="Enter detailed observation notes here..."
            ></textarea>
          </div>

          <div className="pt-8 border-t border-gray-800 flex justify-end gap-4">
            <button className="bg-brand-gold hover:bg-brand-goldHover text-black px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-[0_4px_14px_0_rgba(212,175,55,0.39)] transition-transform hover:-translate-y-0.5" onClick={handleSubmit}>
              <FileSignature className="w-5 h-5" />
              Sign & Submit Record
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

