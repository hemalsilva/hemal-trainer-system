import React, { useState } from 'react';
import { Award, Lock, User, LogIn, AlertCircle } from 'lucide-react';
import axios from 'axios';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await axios.post('/api/auth/login', { username, password });
      if (res.data.token) {
        localStorage.setItem('hk_token', res.data.token);
        onLogin(true);
      }
    } catch (err) {
      const eData = err.response?.data?.error; setError(typeof eData === 'string' ? eData : (eData?.message || 'Invalid username or password'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-brand-dark flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-64 bg-brand-gold/5 rounded-full blur-[100px] pointer-events-none"></div>
      
      <div className="w-full max-w-md bg-brand-card border border-gray-800 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden relative z-10">
        
        <div className="p-8 border-b border-gray-800 flex flex-col items-center text-center bg-[#181818]">
          <div className="w-16 h-16 rounded-full bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(212,175,55,0.1)]">
            <Award className="w-8 h-8 text-brand-gold" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wide">HK Training Portal</h1>
          <p className="text-sm text-gray-400 mt-2">Sign in to manage training schedules and analytics.</p>
        </div>

        <div className="p-8">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-sm mb-6 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm text-gray-400 mb-2 font-medium">Username</label>
              <div className="relative">
                <User className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter administrator username"
                  className="w-full bg-[#121212] border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white focus:border-brand-gold focus:ring-1 focus:ring-brand-gold outline-none transition-all shadow-inner"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2 font-medium">Password</label>
              <div className="relative">
                <Lock className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#121212] border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white focus:border-brand-gold focus:ring-1 focus:ring-brand-gold outline-none transition-all shadow-inner"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-brand-gold hover:bg-brand-goldHover text-black py-3.5 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(212,175,55,0.3)] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? 'Authenticating...' : (
                <>
                  <LogIn className="w-5 h-5" /> Sign In
                </>
              )}
            </button>
          </form>
        </div>
        
      </div>
      
      <p className="mt-8 text-gray-500 text-sm flex flex-col items-center">
        <span>Restricted Access System</span>
        <span>Authorized Personnel Only</span>
      </p>
    </div>
  );
}

