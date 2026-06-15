import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, AlertCircle, User, Award, ArrowLeft } from 'lucide-react';

export default function AttendancePortal() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [training, setTraining] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [empNo, setEmpNo] = useState('');
  const [empName, setEmpName] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchTraining = async () => {
      try {
        const res = await axios.get(`/api/trainings/${id}?t=${Date.now()}`);
        setTraining(res.data);
      } catch (err) {
        setError('Training session not found or link is invalid.');
      } finally {
        setLoading(false);
      }
    };
    fetchTraining();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!empNo) {
      setError('Employee number is required.');
      return;
    }

    try {
      await axios.post(`/api/trainings/${id}/attendance`, { emp_no: empNo, emp_name: empName });
      setSuccess(true);
      setError('');
    } catch (err) {
      setError('Failed to mark attendance. Please try again.');
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-brand-dark flex items-center justify-center text-brand-primary">Loading secure portal...</div>;
  }

  if (error && !training) {
    return (
      <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-blue-200 mb-2">Invalid Session</h1>
        <p className="text-gray-400">{error}</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center p-6 text-center">
        <CheckCircle className="w-20 h-20 text-green-500 mb-6 drop-shadow-[0_0_15px_rgba(34,197,94,0.5)]" />
        <h1 className="text-3xl font-bold text-blue-200 mb-2 tracking-tight">Attendance Logged!</h1>
        <p className="text-gray-400 mb-8 max-w-sm">
          You have successfully checked in to <span className="text-brand-primary font-bold">{training.topic}</span>.
        </p>
        <button 
          onClick={() => { setSuccess(false); setEmpNo(''); setEmpName(''); }}
          className="bg-brand-card hover:bg-gray-800 text-blue-200 border border-gray-700 px-6 py-3 rounded-xl font-medium transition-colors"
        >
          Check in another employee
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-dark flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-64 bg-brand-primary/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-brand-card border border-brand-primary/20 rounded-3xl shadow-2xl overflow-hidden relative z-10">
        {/* Header */}
        <div className="bg-[#181818] p-8 border-b border-gray-800 flex flex-col items-center text-center">
          <Award className="w-12 h-12 text-brand-primary mb-4 drop-shadow-md" />
          <h2 className="text-brand-primary text-sm font-bold uppercase tracking-widest mb-2">HK Training Portal</h2>
          <h1 className="text-2xl font-bold text-blue-200 leading-tight">{training.topic}</h1>
          <p className="text-gray-400 text-sm mt-2 flex items-center gap-2">
            <span>{new Date(training.training_date).toLocaleString()}</span>
            <span>•</span>
            <span>{training.venue}</span>
          </p>
        </div>

        {/* Form */}
        <div className="p-8">
          <h3 className="text-blue-200 font-medium text-lg mb-6 text-center">Scan successful. Please check in below:</h3>
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-sm mb-6 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Employee Number *</label>
              <div className="relative">
                <User className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  required
                  type="text" 
                  value={empNo} 
                  onChange={(e) => setEmpNo(e.target.value)} 
                  placeholder="e.g. EMP-1042"
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-10 pr-4 py-3.5 text-blue-200 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-2">Employee Name (Optional)</label>
              <input 
                type="text" 
                value={empName} 
                onChange={(e) => setEmpName(e.target.value)} 
                placeholder="Full Name"
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3.5 text-blue-200 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all"
              />
            </div>

            <button type="submit" className="w-full bg-brand-primary hover:bg-brand-primaryHover text-black py-4 rounded-xl font-bold text-lg mt-4 shadow-[0_4px_14px_0_rgba(212,175,55,0.39)] transition-transform hover:-translate-y-0.5">
              Check In Now
            </button>
          </form>
        </div>
      </div>
      
      {/* Mobile back link if needed */}
      <button onClick={() => navigate('/schedule')} className="mt-8 text-gray-500 hover:text-blue-200 flex items-center gap-2 text-sm transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </button>
    </div>
  );
}

