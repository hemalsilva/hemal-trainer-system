import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Printer, Calendar, AlertCircle, FileText, Search, UserX, BarChart, PieChart, Sparkles, Send, Loader2, Gift, Eye } from 'lucide-react';
import { Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Pie, Cell } from 'recharts';

export default function Reports() {
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedReportTab, setSelectedReportTab] = useState('overview');
  const [employees, setEmployees] = useState([]);
  const [birthdayMonth, setBirthdayMonth] = useState(new Date().getMonth());
  const [selectedDepartment, setSelectedDepartment] = useState('');

  const departments = [...new Set(employees.map(e => e.department).filter(Boolean))];

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await axios.get('/api/employees');
        setEmployees(res.data);
      } catch (err) {
        console.error('Failed to fetch employees for birthdays:', err);
      }
    };
    fetchEmployees();
  }, []);

  // AI Assistant State
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [aiResult, setAiResult] = useState(null);

  // LIVE ANALYTICS DATA
  const [monthlyData, setMonthlyData] = useState([]);
  const [deptData, setDeptData] = useState([]);
  const [absentData, setAbsentData] = useState([]);
  const [missingTopicsData, setMissingTopicsData] = useState([]);
  const [lowPerformanceOJT, setLowPerformanceOJT] = useState([]);
  const [ojtDetails, setOjtDetails] = useState([]);
  
  const [printDataSOP, setPrintDataSOP] = useState([]);
  const [printDataOJT, setPrintDataOJT] = useState([]);
  const [printDataHR, setPrintDataHR] = useState([]);
  const [printDataHours, setPrintDataHours] = useState([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const params = {};
      if (dateRange.start) params.start = dateRange.start;
      if (dateRange.end) params.end = dateRange.end;
      if (selectedDepartment) params.department = selectedDepartment;

      const res = await axios.get('/api/reports/analytics', { params });
      const data = res.data;
      
      setMonthlyData(data.monthlyData || []);
      setDeptData(data.deptData || []);
      setAbsentData(data.absentData || []);
      setMissingTopicsData(data.missingTopicsData || []);
      setLowPerformanceOJT(data.lowPerformanceOJT || []);
      setOjtDetails(data.ojtDetails || []);
      setPrintDataSOP(data.printDataSOP || []);
      setPrintDataOJT(data.printDataOJT || []);
      setPrintDataHR(data.printDataHR || []);
      setPrintDataHours(data.printDataHours || []);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);


  const handleAskAI = async (e) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;

    setIsAiThinking(true);
    setAiResult(null);
    setSelectedReportTab('ai-report');

    try {
      const res = await axios.post('/api/reports/ai', { prompt: aiPrompt });
      setAiResult(res.data);
    } catch (err) {
      console.error(err);
      alert('Error connecting to HK Training AI Engine');
    } finally {
      setIsAiThinking(false);
    }
  };

  return (
    <div className="p-8 w-full max-w-7xl mx-auto pb-24">
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-bold text-blue-200 mb-2 tracking-tight">Reports & Analytics</h1>
          <p className="text-gray-400">Deep insights into training performance and compliance.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => window.print()} className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-blue-200 px-4 py-2 rounded-lg font-medium transition-colors border border-gray-700 shadow-lg">
            <Printer className="w-4 h-4" />
            Print Current Report
          </button>
        </div>
      </header>

      {/* HEMAL AI ASSISTANT */}
      <div className="bg-gradient-to-r from-gray-900 to-[#181818] rounded-2xl p-6 border border-gray-800 mb-8 shadow-2xl relative overflow-hidden print:hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-brand-primary"></div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center border border-brand-primary/20">
            <Sparkles className="w-5 h-5 text-brand-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-blue-200">Ask HK Training AI</h2>
            <p className="text-xs text-gray-400">Generate custom database reports using natural language.</p>
          </div>
        </div>
        
        <form onSubmit={handleAskAI} className="relative">
          <input 
            type="text" 
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="E.g., 'Show me all employees in Rooms who failed OJT' or 'Print upcoming mandatory trainings'" 
            className="w-full bg-[#121212] border border-gray-700 rounded-xl pl-4 pr-16 py-4 text-blue-200 focus:border-brand-primary outline-none shadow-inner"
          />
          <button 
            type="submit" 
            disabled={isAiThinking}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-brand-primary hover:bg-brand-primaryHover text-black p-2.5 rounded-lg font-bold transition-colors shadow-md disabled:opacity-50"
          >
            {isAiThinking ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </form>
      </div>

      {/* Date Range Filter (Hidden on AI Tab) */}
      {selectedReportTab !== 'ai-report' && (
        <div className="bg-brand-card rounded-xl p-5 border border-gray-800 mb-8 flex flex-wrap items-end gap-4 shadow-xl print:hidden">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Start Date</label>
            <input type="date" value={dateRange.start} onChange={(e) => setDateRange({...dateRange, start: e.target.value})} className="bg-[#181818] border border-gray-700 rounded-lg p-2 text-blue-200 focus:border-brand-primary outline-none" style={{colorScheme:'dark'}}/>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">End Date</label>
            <input type="date" value={dateRange.end} onChange={(e) => setDateRange({...dateRange, end: e.target.value})} className="bg-[#181818] border border-gray-700 rounded-lg p-2 text-blue-200 focus:border-brand-primary outline-none" style={{colorScheme:'dark'}}/>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Department</label>
            <select value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)} className="bg-[#181818] border border-gray-700 rounded-lg p-2.5 text-blue-200 focus:border-brand-primary outline-none">
              <option value="">All Departments</option>
              {departments.map((dept, i) => (
                <option key={i} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3">
            <button onClick={fetchAnalytics} disabled={analyticsLoading} className="bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20 border border-brand-primary/30 px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50">
              <Calendar className="w-4 h-4" />
              Apply Filter
            </button>
            <button onClick={() => setSelectedReportTab('detailed-summary')} className="bg-gray-800 text-blue-200 hover:bg-gray-700 border border-gray-700 px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
              <Eye className="w-4 h-4" />
              View
            </button>
            <button onClick={() => window.print()} className="bg-gray-800 text-blue-200 hover:bg-gray-700 border border-gray-700 px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
              <Printer className="w-4 h-4" />
              Print
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-800 mb-8 overflow-x-auto print:hidden">
        {['overview', 'attendance', 'ojt-performance', 'detailed-summary', 'birthday-calendar', 'ai-report'].map((tab) => {
          if (tab === 'ai-report' && !isAiThinking && !aiResult) return null;
          return (
            <button
              key={tab}
              onClick={() => setSelectedReportTab(tab)}
              className={`px-6 py-3 font-medium text-sm transition-colors whitespace-nowrap flex items-center gap-2 ${selectedReportTab === tab ? 'text-brand-primary border-b-2 border-brand-primary bg-brand-primary/5' : 'text-gray-400 hover:text-blue-200'}`}
            >
              {tab === 'ai-report' && <Sparkles className="w-4 h-4"/>}
              {tab === 'overview' ? 'Training Overview' : tab === 'attendance' ? 'Attendance & Coverage' : tab === 'ojt-performance' ? 'OJT Employee Details' : tab === 'detailed-summary' ? 'Detailed Summary (Printable)' : tab === 'birthday-calendar' ? 'Birthday Calendar' : 'AI Custom Report'}
            </button>
          )
        })}
      </div>

      {/* AI CUSTOM REPORT TAB */}
      {selectedReportTab === 'ai-report' && (
        <div className="space-y-8">
          {isAiThinking ? (
            <div className="flex flex-col items-center justify-center p-24 text-gray-400 print:hidden">
              <Loader2 className="w-12 h-12 animate-spin text-brand-primary mb-4" />
              <p className="text-lg font-medium">HK Training AI is analyzing the database...</p>
            </div>
          ) : aiResult ? (
            <div className="bg-brand-card print:bg-white rounded-2xl border border-gray-800 print:border-none shadow-lg print:shadow-none overflow-hidden print:block">
              
              <div className="p-6 border-b border-gray-800 print:border-gray-400 bg-[#181818] print:bg-white print:text-center print:mb-6 flex justify-between items-center">
                <div>
                  <h2 className="text-2xl print:text-3xl font-bold text-blue-200 print:text-black flex items-center gap-2 print:justify-center print:mb-2">
                    <Sparkles className="w-6 h-6 text-brand-primary print:hidden" /> {aiResult.title}
                  </h2>
                  <p className="text-sm text-gray-400 print:text-gray-600 print:font-medium">Found {aiResult.count} records based on your request.</p>
                </div>
              </div>

              {aiResult.data.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  No records matched your AI query.
                </div>
              ) : (
                <div className="overflow-x-auto p-6 print:p-0">
                  <table className="w-full text-left border-collapse border border-gray-800 print:border-gray-300">
                    <thead>
                      <tr className="bg-gray-900 print:bg-gray-100">
                        {Object.keys(aiResult.data[0]).map(key => (
                          <th key={key} className="p-4 border border-gray-800 print:border-gray-300 text-sm font-bold text-gray-400 print:text-black">
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {aiResult.data.map((row, i) => (
                        <tr key={i} className="hover:bg-gray-800/30 print:hover:bg-transparent transition-colors">
                          {Object.values(row).map((val, j) => (
                            <td key={j} className={`p-4 border border-gray-800 print:border-gray-300 text-sm font-medium ${
                              val === 'FAIL' || val?.toString().includes('Missing') ? 'text-red-400 print:text-black' : 
                              val === 'PASS' ? 'text-green-400 print:text-black' : 'text-blue-200 print:text-black'
                            }`}>
                              {val}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* OVERVIEW TAB */}
      {selectedReportTab === 'overview' && (
        <div className="space-y-8 print:hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-brand-card rounded-2xl p-6 border border-gray-800 shadow-lg">
              <h2 className="text-lg font-bold text-blue-200 mb-6 flex items-center gap-2"><BarChart className="w-5 h-5 text-brand-primary"/> Monthly Training Hours</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis dataKey="name" stroke="#666" tick={{fill: '#888'}} axisLine={false} />
                    <YAxis stroke="#666" tick={{fill: '#888'}} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#1E1E1E', borderColor: '#333', color: '#fff' }} itemStyle={{ color: '#D4AF37' }} />
                    <Line type="monotone" dataKey="hours" stroke="#D4AF37" strokeWidth={3} dot={{r: 4, fill: '#1E1E1E', strokeWidth: 2}} activeDot={{r: 6}} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-brand-card rounded-2xl p-6 border border-gray-800 shadow-lg">
              <h2 className="text-lg font-bold text-blue-200 mb-6 flex items-center gap-2"><PieChart className="w-5 h-5 text-brand-primary"/> Dept. Training Hours (Housekeeping)</h2>
              <div className="h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={deptData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {deptData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(0,0,0,0.2)" />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1E1E1E', borderColor: '#333', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute right-8 flex flex-col gap-2">
                  {deptData.map((d, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 rounded-full" style={{backgroundColor: d.color}}></div>
                      <span className="text-gray-300">{d.name} ({d.value}h)</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ATTENDANCE TAB */}
      {selectedReportTab === 'attendance' && (
        <div className="space-y-8 print:hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-brand-card rounded-2xl border border-gray-800 shadow-lg overflow-hidden">
              <div className="p-6 border-b border-gray-800 bg-[#181818]">
                <h2 className="text-lg font-bold text-blue-200 flex items-center gap-2"><UserX className="w-5 h-5 text-red-400"/> Topic-wise Absenteeism</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#1e1e1e] border-b border-gray-800">
                      <th className="p-4 text-sm font-semibold text-gray-400">Training Topic</th>
                      <th className="p-4 text-sm font-semibold text-gray-400">Absent Count</th>
                      <th className="p-4 text-sm font-semibold text-gray-400">Names</th>
                    </tr>
                  </thead>
                  <tbody>
                    {absentData.map((row, i) => (
                      <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                        <td className="p-4 text-blue-200 font-medium">{row.topic}</td>
                        <td className="p-4"><span className="bg-red-500/10 text-red-400 py-1 px-3 rounded-full text-xs font-bold">{row.absent} Missed</span></td>
                        <td className="p-4 text-gray-400 text-sm">{row.names}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-brand-card rounded-2xl border border-gray-800 shadow-lg overflow-hidden">
              <div className="p-6 border-b border-gray-800 bg-[#181818]">
                <h2 className="text-lg font-bold text-blue-200 flex items-center gap-2"><AlertCircle className="w-5 h-5 text-orange-400"/> Employees Missing Topics</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#1e1e1e] border-b border-gray-800">
                      <th className="p-4 text-sm font-semibold text-gray-400">Employee</th>
                      <th className="p-4 text-sm font-semibold text-gray-400">Missing Mandatory Topic</th>
                      <th className="p-4 text-sm font-semibold text-gray-400">Severity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {missingTopicsData.map((row, i) => (
                      <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                        <td className="p-4 text-blue-200 font-medium">{row.employee}</td>
                        <td className="p-4 text-gray-300 text-sm">{row.topic}</td>
                        <td className="p-4">
                          <span className={`py-1 px-3 rounded-full text-xs font-bold ${row.severity === 'High' ? 'bg-red-500/10 text-red-400' : 'bg-orange-500/10 text-orange-400'}`}>
                            {row.severity}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OJT PERFORMANCE & DETAILS TAB */}
      {selectedReportTab === 'ojt-performance' && (
        <div className="space-y-8 print:hidden">
          <div className="bg-red-500/5 border border-red-500/20 rounded-2xl shadow-lg overflow-hidden relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
            <div className="p-6 border-b border-red-500/10 bg-red-500/5">
              <h2 className="text-lg font-bold text-blue-200 flex items-center gap-2"><AlertCircle className="w-5 h-5 text-red-500"/> Low Performance OJT Assessments</h2>
              <p className="text-gray-400 text-sm mt-1">Employees who failed recent On-The-Job training assessments and require immediate retuning.</p>
            </div>
            <div className="overflow-x-auto p-2">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-red-500/20">
                    <th className="p-4 text-sm font-semibold text-gray-400">Employee</th>
                    <th className="p-4 text-sm font-semibold text-gray-400">Topic Failed</th>
                    <th className="p-4 text-sm font-semibold text-gray-400">Rating</th>
                    <th className="p-4 text-sm font-semibold text-gray-400">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {lowPerformanceOJT.map((row, i) => (
                    <tr key={i} className="border-b border-red-500/10 hover:bg-red-500/10 transition-colors">
                      <td className="p-4 text-blue-200 font-medium flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 font-bold text-xs">{row.employee.charAt(0)}</div>
                        {row.employee}
                      </td>
                      <td className="p-4 text-gray-300 text-sm">{row.topic}</td>
                      <td className="p-4 flex gap-1">
                        {[1, 2, 3, 4, 5].map(star => (
                          <svg key={star} className={`w-4 h-4 ${star <= row.rating ? 'text-brand-primary fill-current' : 'text-gray-700 stroke-current fill-none'}`} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                        ))}
                      </td>
                      <td className="p-4 text-gray-400 text-sm">{row.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-brand-card rounded-2xl border border-gray-800 shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-800 bg-[#181818] flex justify-between items-center">
              <h2 className="text-lg font-bold text-blue-200 flex items-center gap-2"><FileText className="w-5 h-5 text-brand-primary"/> Employee OJT Master Record</h2>
              <div className="relative">
                <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input type="text" placeholder="Search employee..." className="bg-gray-900 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm text-blue-200 focus:border-brand-primary outline-none" />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#1e1e1e] border-b border-gray-800">
                    <th className="p-4 text-sm font-semibold text-gray-400">Employee Name</th>
                    <th className="p-4 text-sm font-semibold text-gray-400">Total OJT Completed</th>
                    <th className="p-4 text-sm font-semibold text-gray-400">Failed Attempts</th>
                    <th className="p-4 text-sm font-semibold text-gray-400">Avg. Rating</th>
                    <th className="p-4 text-sm font-semibold text-gray-400">Latest Topic</th>
                    <th className="p-4 text-sm font-semibold text-gray-400">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {ojtDetails.map((row, i) => (
                    <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                      <td className="p-4 text-blue-200 font-medium">{row.employee}</td>
                      <td className="p-4 text-gray-300">{row.completed}</td>
                      <td className="p-4"><span className={row.failed > 0 ? 'text-red-400 font-bold' : 'text-gray-400'}>{row.failed}</span></td>
                      <td className="p-4 text-brand-primary font-bold">{row.avgRating} <span className="text-xs text-gray-500">/ 5</span></td>
                      <td className="p-4 text-gray-400 text-sm">{row.lastTopic}</td>
                      <td className="p-4">
                        <button className="text-brand-primary hover:text-blue-200 text-sm font-medium transition-colors">View Full History</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* BIRTHDAY CALENDAR TAB */}
      {(selectedReportTab === 'birthday-calendar' || (typeof window !== 'undefined' && window.matchMedia('print').matches && selectedReportTab === 'birthday-calendar')) && (
        <div className="space-y-8 print:block">
          <div className="bg-brand-card print:bg-white rounded-2xl border border-gray-800 print:border-none shadow-lg print:shadow-none overflow-hidden print:block p-8">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 border-b border-gray-800 print:border-gray-400 pb-6 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-pink-500/10 print:bg-transparent rounded-xl text-pink-500 print:text-black">
                  <Gift className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-blue-200 print:text-black">Monthly Birthday Calendar</h2>
                  <p className="text-gray-400 print:text-gray-600">Employee Birthdays across all departments</p>
                </div>
              </div>
              <div className="print:hidden">
                <select 
                  value={birthdayMonth}
                  onChange={(e) => setBirthdayMonth(Number(e.target.value))}
                  className="bg-[#181818] border border-gray-700 rounded-lg p-3 text-blue-200 focus:border-brand-primary outline-none font-bold text-lg"
                >
                  {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m, i) => (
                    <option key={i} value={i}>{m}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-800 print:border-gray-300">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-900 print:bg-gray-100">
                    <th className="p-4 border-b border-gray-800 print:border-gray-300 text-sm font-bold text-gray-400 print:text-black">Date</th>
                    <th className="p-4 border-b border-gray-800 print:border-gray-300 text-sm font-bold text-gray-400 print:text-black">Employee Name</th>
                    <th className="p-4 border-b border-gray-800 print:border-gray-300 text-sm font-bold text-gray-400 print:text-black">Department</th>
                    <th className="p-4 border-b border-gray-800 print:border-gray-300 text-sm font-bold text-gray-400 print:text-black">Designation</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const monthBirthdays = employees
                      .filter(emp => emp.date_of_birth && new Date(emp.date_of_birth).getMonth() === birthdayMonth)
                      .sort((a, b) => new Date(a.date_of_birth).getDate() - new Date(b.date_of_birth).getDate());

                    if (monthBirthdays.length === 0) {
                      return (
                        <tr>
                          <td colSpan="4" className="p-12 text-center text-gray-500 print:text-gray-600 border-b border-gray-800 print:border-gray-300">
                            No birthdays recorded for this month.
                          </td>
                        </tr>
                      );
                    }

                    return monthBirthdays.map((emp) => (
                      <tr key={emp.id} className="hover:bg-gray-800/50 print:hover:bg-transparent transition-colors">
                        <td className="p-4 border-b border-gray-800 print:border-gray-300 text-pink-500 print:text-black font-bold text-lg">
                          {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][birthdayMonth]} {new Date(emp.date_of_birth).getDate()}
                        </td>
                        <td className="p-4 border-b border-gray-800 print:border-gray-300 text-blue-200 print:text-black font-medium">{emp.full_name}</td>
                        <td className="p-4 border-b border-gray-800 print:border-gray-300 text-gray-400 print:text-gray-700">{emp.department || 'N/A'}</td>
                        <td className="p-4 border-b border-gray-800 print:border-gray-300 text-gray-400 print:text-gray-700">{emp.designation}</td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
            
          </div>
        </div>
      )}

      {/* DETAILED SUMMARY TAB (Fixed Print Template) */}
      {(selectedReportTab === 'detailed-summary' || (typeof window !== 'undefined' && window.matchMedia('print').matches && selectedReportTab !== 'ai-report')) && (
        <div className={`${selectedReportTab === 'detailed-summary' ? 'block' : 'hidden'} print:block w-full bg-brand-card print:bg-white border border-gray-800 print:border-none rounded-2xl p-8 print:p-0`}>
          <div className="text-center mb-8 border-b border-gray-800 print:border-b-2 print:border-black pb-6">
            <h1 className="text-3xl print:text-4xl font-bold uppercase tracking-widest text-blue-200 print:text-black mb-2">Housekeeping Department Trainings</h1>
            <p className="text-brand-primary print:text-gray-600 font-medium">Monthly Training & Compliance Report</p>
            <p className="text-sm text-gray-500 mt-1">Generated: {new Date().toLocaleDateString()}</p>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-bold border-b border-gray-700 print:border-gray-400 mb-4 pb-2 text-blue-200 print:text-black">Department wise SOP training</h2>
            <div className="overflow-hidden rounded-lg border border-gray-800 print:border-gray-300">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-900 print:bg-gray-100">
                    <th className="p-3 border-b border-gray-800 print:border-gray-300 text-sm font-bold text-gray-400 print:text-black">Training Topic</th>
                    <th className="p-3 border-b border-gray-800 print:border-gray-300 text-sm font-bold text-gray-400 print:text-black">Sessions Held</th>
                    <th className="p-3 border-b border-gray-800 print:border-gray-300 text-sm font-bold text-gray-400 print:text-black">Total Attendees</th>
                  </tr>
                </thead>
                <tbody>
                  {printDataSOP.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-800/50 print:hover:bg-transparent">
                      <td className="p-3 border-b border-gray-800 print:border-gray-300 text-sm text-blue-200 print:text-black">{row.topic}</td>
                      <td className="p-3 border-b border-gray-800 print:border-gray-300 text-sm text-blue-200 print:text-black">{row.sessions}</td>
                      <td className="p-3 border-b border-gray-800 print:border-gray-300 text-sm text-blue-200 print:text-black">{row.attendees}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-bold border-b border-gray-700 print:border-gray-400 mb-4 pb-2 text-blue-200 print:text-black">OJT</h2>
            <div className="overflow-hidden rounded-lg border border-gray-800 print:border-gray-300">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-900 print:bg-gray-100">
                    <th className="p-3 border-b border-gray-800 print:border-gray-300 text-sm font-bold text-gray-400 print:text-black">OJT Assessment Topic</th>
                    <th className="p-3 border-b border-gray-800 print:border-gray-300 text-sm font-bold text-gray-400 print:text-black">Staff Assessed</th>
                    <th className="p-3 border-b border-gray-800 print:border-gray-300 text-sm font-bold text-gray-400 print:text-black">Passed</th>
                  </tr>
                </thead>
                <tbody>
                  {printDataOJT.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-800/50 print:hover:bg-transparent">
                      <td className="p-3 border-b border-gray-800 print:border-gray-300 text-sm text-blue-200 print:text-black">{row.topic}</td>
                      <td className="p-3 border-b border-gray-800 print:border-gray-300 text-sm text-blue-200 print:text-black">{row.assessed}</td>
                      <td className="p-3 border-b border-gray-800 print:border-gray-300 text-sm text-brand-primary print:text-black">{row.passed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-bold border-b border-gray-700 print:border-gray-400 mb-4 pb-2 text-blue-200 print:text-black">Hotel HR Training</h2>
            <div className="overflow-hidden rounded-lg border border-gray-800 print:border-gray-300">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-900 print:bg-gray-100">
                    <th className="p-3 border-b border-gray-800 print:border-gray-300 text-sm font-bold text-gray-400 print:text-black">HR Training Topic</th>
                    <th className="p-3 border-b border-gray-800 print:border-gray-300 text-sm font-bold text-gray-400 print:text-black">Sessions Held</th>
                    <th className="p-3 border-b border-gray-800 print:border-gray-300 text-sm font-bold text-gray-400 print:text-black">Total Attendees</th>
                  </tr>
                </thead>
                <tbody>
                  {printDataHR.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-800/50 print:hover:bg-transparent">
                      <td className="p-3 border-b border-gray-800 print:border-gray-300 text-sm text-blue-200 print:text-black">{row.topic}</td>
                      <td className="p-3 border-b border-gray-800 print:border-gray-300 text-sm text-blue-200 print:text-black">{row.sessions}</td>
                      <td className="p-3 border-b border-gray-800 print:border-gray-300 text-sm text-blue-200 print:text-black">{row.attendees}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-bold border-b border-gray-700 print:border-gray-400 mb-4 pb-2 text-blue-200 print:text-black">Training Hours Summary</h2>
            <div className="overflow-hidden rounded-lg border border-gray-800 print:border-gray-300">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-900 print:bg-gray-100">
                    <th className="p-3 border-b border-gray-800 print:border-gray-300 text-sm font-bold text-gray-400 print:text-black">Category</th>
                    <th className="p-3 border-b border-gray-800 print:border-gray-300 text-sm font-bold text-gray-400 print:text-black">Total Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {printDataHours.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-800/50 print:hover:bg-transparent">
                      <td className="p-3 border-b border-gray-800 print:border-gray-300 text-sm font-bold text-brand-primary print:text-black">{row.category}</td>
                      <td className="p-3 border-b border-gray-800 print:border-gray-300 text-sm text-blue-200 print:text-black">{row.hours}h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="mt-16 pt-8 border-t border-gray-800 print:border-gray-300 flex justify-between px-12">
            <div className="text-center">
              <div className="w-48 border-b border-gray-500 print:border-black mb-2"></div>
              <p className="text-sm text-gray-400 print:text-black font-bold">Training Manager</p>
            </div>
            <div className="text-center">
              <div className="w-48 border-b border-gray-500 print:border-black mb-2"></div>
              <p className="text-sm text-gray-400 print:text-black font-bold">Executive Housekeeper</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
