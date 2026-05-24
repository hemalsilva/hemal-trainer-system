import React, { useState, useEffect } from 'react';
import { CheckCircle, Trophy, Calendar as CalendarIcon, Loader2, ArrowUpRight, ArrowDownRight, Award, History, LayoutDashboard , X} from 'lucide-react';
import axios from 'axios';

export default function Audits() {
  const [audits, setAudits] = useState([]);
  const [topPerformers, setTopPerformers] = useState([]);
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const year = parseInt(selectedDate.split('-')[0], 10);
  const month = parseInt(selectedDate.split('-')[1], 10);
  const [activeTab, setActiveTab] = useState('overview');
  const [department, setDepartment] = useState('All');
  const [selectedType, setSelectedType] = useState(null);
  const [employeeMap, setEmployeeMap] = useState({});
  const DEPARTMENTS = ['Rooms', 'Public Area', 'Laundry', 'Flower', 'Stores', 'Coordinator', 'Hotel School', 'Cinnamon Hotel Academy', 'General'];

  const fetchAudits = async () => {
    setLoading(true);
    try {
      const [auditsRes, topRes, balRes, empRes] = await Promise.all([
        axios.get('/api/audits'),
        axios.get(`/api/audits/top-performers?month=${month}&year=${year}`),
        axios.get(`/api/audits/balances?month=${month}&year=${year}`),
        axios.get('/api/employees')
      ]);
      setAudits(auditsRes.data);
      setTopPerformers(topRes.data);
      setBalances(balRes.data);
      if (empRes && empRes.data) {
        const map = {};
        empRes.data.forEach(e => map[e.emp_no] = e.department);
        setEmployeeMap(map);
      }
    } catch (err) {
      console.error('Error fetching audits:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudits();
  }, [month, year]);

  const auditTypes = ['Departure', 'Stayover', 'IP Departure', 'IP Stayover', 'Public Area', 'Laundry', 'Flower', 'Stores'];
  
  const renderTopPerformer = (performer, index) => {
    const medals = ['text-yellow-400', 'text-gray-300', 'text-amber-600'];
    const bgColors = ['bg-yellow-400/10 border-yellow-400/30', 'bg-gray-300/10 border-gray-300/30', 'bg-amber-600/10 border-amber-600/30'];
    
    
  return (
      <div key={`${performer.emp_no}-${performer.audit_type}-${index}`} className={`flex items-center justify-between p-4 rounded-xl border ${bgColors[index] || 'bg-gray-800/50 border-gray-700'}`}>
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${index < 3 ? medals[index] : 'text-gray-400'}`}>
            {index === 0 ? <Trophy className="w-6 h-6" /> : `#${index + 1}`}
          </div>
          <div>
            <h4 className="text-white font-bold">{performer.emp_name}</h4>
            <p className="text-gray-400 text-sm font-mono">{performer.emp_no}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-white">{performer.max_score}<span className="text-sm text-gray-500 font-normal">/100</span></div>
          <div className="text-xs text-gray-400 uppercase tracking-wide">Top Score</div>
        </div>
      </div>
    );
  };


  const filteredAudits = audits.filter(a => {
    if (department !== 'All' && employeeMap[a.emp_no] !== department) return false;
    if (selectedType && a.audit_type !== selectedType) return false;
    return true;
  });

  const filteredTopPerformers = topPerformers.filter(p => {
    if (department !== 'All' && employeeMap[p.emp_no] !== department) return false;
    return true;
  });

  const filteredBalances = balances.filter(b => {
    if (department !== 'All' && b.department !== department) return false;
    return true;
  });

  return (
    <div className="p-8 w-full max-w-7xl mx-auto pb-24">
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-emerald-400" />
            Room Audits
          </h1>
          <p className="text-gray-400">Track and monitor room cleaning quality via Google Forms integration.</p>
        </div>
        
        <div className="flex items-center gap-3 bg-brand-card p-2 rounded-xl border border-gray-800">
          <CalendarIcon className="w-5 h-5 text-gray-400 ml-2" />
          <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => {
              if (e.target.value) {
                setSelectedDate(e.target.value);
              }
            }}
            className="bg-transparent text-white font-semibold outline-none cursor-pointer [color-scheme:dark]"
          />
        </div>
      </header>

      <select 
            value={department} 
            onChange={(e) => setDepartment(e.target.value)}
            className="bg-transparent text-white font-semibold outline-none cursor-pointer border-l border-gray-700 pl-3"
          >
            <option value="All" className="bg-gray-900">All Departments</option>
            {DEPARTMENTS.map(d => <option key={d} value={d} className="bg-gray-900">{d}</option>)}
          </select>
        {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-gray-800 mb-8 pb-4">
        <button 
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-colors ${activeTab === 'overview' ? 'bg-brand-gold text-black' : 'text-gray-400 hover:text-white'}`}
        >
          <LayoutDashboard className="w-5 h-5" />
          Overview
        </button>
        <button 
          onClick={() => setActiveTab('balances')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-colors ${activeTab === 'balances' ? 'bg-emerald-500 text-black' : 'text-gray-400 hover:text-white'}`}
        >
          <CheckCircle className="w-5 h-5" />
          Audit Balances
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-12 h-12 text-emerald-400 animate-spin" />
        </div>
      ) : activeTab === 'overview' ? (
        <div className="space-y-8">
          
          {/* Top Performers Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {auditTypes.map((type, idx) => {
              const top = filteredTopPerformers.filter(t => t.audit_type === type).slice(0, 3);
              const colors = [
                { bg: 'bg-blue-500/20', text: 'text-blue-400' },
                { bg: 'bg-purple-500/20', text: 'text-purple-400' },
                { bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
                { bg: 'bg-amber-500/20', text: 'text-amber-400' },
                { bg: 'bg-pink-500/20', text: 'text-pink-400' },
                { bg: 'bg-cyan-500/20', text: 'text-cyan-400' },
              ];
              const color = colors[idx % colors.length];

              return (
                <div key={type} className="bg-brand-card border border-gray-800 rounded-2xl p-6 shadow-lg flex flex-col cursor-pointer hover:border-brand-gold transition-colors" onClick={() => setSelectedType(selectedType === type ? null : type)}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`w-10 h-10 rounded-full ${color.bg} flex items-center justify-center`}>
                      <ArrowUpRight className={`w-5 h-5 ${color.text}`} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">{type} Top Performers</h2>
                      <p className="text-sm text-gray-500">Highest scores this month</p>
                    </div>
                  </div>
                  <div className="space-y-3 flex-1">
                    {top.length > 0 ? top.map((p, i) => renderTopPerformer(p, i)) : (
                      <div className="h-full flex items-center justify-center p-6 text-gray-500 border border-dashed border-gray-700 rounded-xl">No audits recorded this month.</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recent Audits Table */}
          <div className="bg-brand-card border border-gray-800 rounded-2xl shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-800 flex items-center gap-3">
              <History className="w-5 h-5 text-brand-gold" />
              <h2 className="text-xl font-bold text-white">Recent Audits</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#1a1a1a] border-b border-gray-800 text-gray-400 text-sm uppercase tracking-wider">
                    <th className="p-4 font-semibold">Date</th>
                    <th className="p-4 font-semibold">Employee</th>
                    <th className="p-4 font-semibold">Type</th>
                    <th className="p-4 font-semibold">Room No</th>
                    <th className="p-4 font-semibold text-right">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {filteredAudits.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-gray-500">
                        No recent audits found. Audits submitted via Google Forms will appear here automatically.
                      </td>
                    </tr>
                  ) : (
                    filteredAudits.map((audit) => (
                      <tr key={audit.id} className="hover:bg-[#1a1a1a] transition-colors">
                        <td className="p-4 whitespace-nowrap text-gray-300">
                          {new Date(audit.audit_date).toLocaleDateString()}
                        </td>
                        <td className="p-4">
                          <div className="font-bold text-white">{audit.emp_name}</div>
                          <div className="text-xs text-gray-500 font-mono">{audit.emp_no}</div>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                            audit.audit_type === 'Departure' 
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/20' 
                              : 'bg-purple-500/20 text-purple-400 border border-purple-500/20'
                          }`}>
                            {audit.audit_type}
                          </span>
                        </td>
                        <td className="p-4 text-gray-300 font-mono">
                          {audit.room_number || 'N/A'}
                        </td>
                        <td className="p-4 text-right">
                          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gray-800 text-white font-bold border border-gray-700">
                            {audit.score}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
        </div>
      ) : (
        <div className="bg-brand-card border border-gray-800 rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-800">
            <h2 className="text-xl font-bold text-white">Employee Audit Balances</h2>
            <p className="text-sm text-gray-400 mt-1">Track monthly audit completion progress (Target: 60/month)</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#1a1a1a] border-b border-gray-800 text-gray-400 text-sm uppercase tracking-wider">
                  <th className="p-4 font-semibold">Employee</th>
                  <th className="p-4 font-semibold">Designation</th>
                  <th className="p-4 font-semibold text-center">Type</th>
                  <th className="p-4 font-semibold text-center">Stayover</th>
                  <th className="p-4 font-semibold text-center">Departure</th>
                  <th className="p-4 font-semibold text-center">Total Pending</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredBalances.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-gray-500">
                      No employees found.
                    </td>
                  </tr>
                ) : (
                  filteredBalances.map(b => (
                    <tr key={b.emp_no} className="hover:bg-[#1a1a1a] transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-white">{b.emp_name}</div>
                        <div className="text-xs text-gray-500">{b.emp_no}</div>
                      </td>
                      <td className="p-4 text-gray-300">{b.designation || 'N/A'}</td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex px-2 py-1 rounded text-xs font-bold ${b.isTeamLeader ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                          {b.typeLabel}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="text-white font-bold">{b.stayoverCompleted} <span className="text-gray-500 font-normal">/ {b.stayoverTarget}</span></div>
                        <div className={`text-xs font-bold mt-1 ${b.stayoverPending > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                          {b.stayoverPending > 0 ? `${b.stayoverPending} Pending` : 'Completed'}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="text-white font-bold">{b.departureCompleted} <span className="text-gray-500 font-normal">/ {b.departureTarget}</span></div>
                        <div className={`text-xs font-bold mt-1 ${b.departurePending > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                          {b.departurePending > 0 ? `${b.departurePending} Pending` : 'Completed'}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className={`inline-flex items-center justify-center w-12 h-8 rounded-lg font-bold ${b.totalPending > 0 ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                          {b.totalPending}
                        </div>
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
