import React, { useState, useEffect, useMemo } from 'react';
import { ClipboardList, Plus, X, TrendingUp, TrendingDown, Users, Award, Filter, Search, AlertTriangle, CheckCircle, BarChart2, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';

const STORAGE_KEY = 'hk_quiz_results';
const DEPARTMENTS = ['Rooms', 'Public Area', 'Laundry', 'Flower', 'Stores', 'Coordinator', 'Hotel School', 'Cinnamon Hotel Academy', 'General'];

const scoreColor = (s) => {
  if (s >= 80) return { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30', badge: 'bg-green-500', label: 'Excellent' };
  if (s >= 60) return { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30', badge: 'bg-yellow-500', label: 'Average' };
  return { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30', badge: 'bg-red-500', label: 'Low' };
};

export default function QuizResults() {
  const [results, setResults] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch { return []; }
  });
  const [showModal, setShowModal] = useState(false);
  const [filterDept, setFilterDept] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterTopic, setFilterTopic] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('date_desc');
  const [form, setForm] = useState({ emp_no: '', emp_name: '', department: '', topic: '', training_date: new Date().toISOString().split('T')[0], score: '' });

  const save = (data) => { setResults(data); localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); };

  const handleAdd = (e) => {
    e.preventDefault();
    const score = parseInt(form.score);
    if (score < 0 || score > 100) { alert('Score must be between 0 and 100'); return; }
    const entry = { id: Date.now(), ...form, score, added_at: new Date().toISOString() };
    save([...results, entry]);
    setForm({ emp_no: '', emp_name: '', department: '', topic: '', training_date: new Date().toISOString().split('T')[0], score: '' });
    setShowModal(false);
  };

  const handleDelete = (id) => { if (window.confirm('Remove this result?')) save(results.filter(r => r.id !== id)); };

  const filtered = useMemo(() => {
    let r = [...results];
    if (filterDept) r = r.filter(x => x.department === filterDept);
    if (filterDate) r = r.filter(x => x.training_date === filterDate);
    if (filterTopic) r = r.filter(x => x.topic.toLowerCase().includes(filterTopic.toLowerCase()));
    if (search) r = r.filter(x => x.emp_name.toLowerCase().includes(search.toLowerCase()) || x.emp_no.toLowerCase().includes(search.toLowerCase()));
    r.sort((a, b) => {
      if (sortBy === 'date_desc') return new Date(b.training_date) - new Date(a.training_date);
      if (sortBy === 'date_asc') return new Date(a.training_date) - new Date(b.training_date);
      if (sortBy === 'score_desc') return b.score - a.score;
      if (sortBy === 'score_asc') return a.score - b.score;
      return 0;
    });
    return r;
  }, [results, filterDept, filterDate, filterTopic, search, sortBy]);

  const avg = filtered.length ? Math.round(filtered.reduce((s, r) => s + r.score, 0) / filtered.length) : 0;
  const lowScorers = filtered.filter(r => r.score < 60);
  const topScorers = filtered.filter(r => r.score >= 80);
  const topics = [...new Set(results.map(r => r.topic))];

  // Department avg breakdown
  const deptStats = DEPARTMENTS.map(d => {
    const dr = results.filter(r => r.department === d);
    const a = dr.length ? Math.round(dr.reduce((s, r) => s + r.score, 0) / dr.length) : null;
    return { dept: d, count: dr.length, avg: a };
  }).filter(d => d.count > 0);

  return (
    <div className="p-8 w-full max-w-7xl mx-auto pb-24">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-blue-200 mb-2 tracking-tight flex items-center gap-3">
            <ClipboardList className="w-8 h-8 text-brand-primary" /> Questionnaire Results
          </h1>
          <p className="text-gray-400">Track post-training quiz scores � by date, department, and employee.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-brand-primary hover:bg-brand-primaryHover text-black px-5 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-brand-primary/20 transition-all hover:-translate-y-0.5">
          <Plus className="w-5 h-5" /> Add Score
        </button>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-brand-card border border-gray-800 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3"><Users className="w-5 h-5 text-blue-400" /><span className="text-gray-400 text-sm">Total Tests</span></div>
          <p className="text-3xl font-bold text-blue-200">{filtered.length}</p>
        </div>
        <div className="bg-brand-card border border-gray-800 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3"><BarChart2 className="w-5 h-5 text-brand-primary" /><span className="text-gray-400 text-sm">Average Score</span></div>
          <p className={`text-3xl font-bold ${scoreColor(avg).text}`}>{filtered.length ? avg : '--'}<span className="text-gray-500 text-lg">/100</span></p>
        </div>
        <div className="bg-red-900/20 border border-red-800/40 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3"><AlertTriangle className="w-5 h-5 text-red-400" /><span className="text-red-400 text-sm">Low Scores (&lt;60)</span></div>
          <p className="text-3xl font-bold text-red-400">{lowScorers.length}</p>
          <p className="text-red-500/60 text-xs mt-1">Need follow-up</p>
        </div>
        <div className="bg-green-900/20 border border-green-800/40 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3"><Award className="w-5 h-5 text-green-400" /><span className="text-green-400 text-sm">Top Scorers (=80)</span></div>
          <p className="text-3xl font-bold text-green-400">{topScorers.length}</p>
          <p className="text-green-500/60 text-xs mt-1">Excellent performers</p>
        </div>
      </div>

      {/* Dept Breakdown */}
      {deptStats.length > 0 && (
        <div className="bg-brand-card border border-gray-800 rounded-2xl p-6 mb-8">
          <h2 className="text-blue-200 font-bold mb-4 flex items-center gap-2"><BarChart2 className="w-5 h-5 text-brand-primary" /> Average Score by Department</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {deptStats.map(d => {
              const c = scoreColor(d.avg);
              const pct = d.avg;
              return (
                <div key={d.dept} className={`rounded-xl p-4 border ${c.border} ${c.bg}`}>
                  <p className="text-blue-200 font-semibold text-sm mb-1 truncate">{d.dept}</p>
                  <p className={`text-2xl font-bold ${c.text}`}>{d.avg}<span className="text-sm text-gray-500">/100</span></p>
                  <div className="mt-2 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${c.badge}`} style={{width: `${pct}%`, transition: 'width 0.5s'}} />
                  </div>
                  <p className="text-gray-500 text-xs mt-1">{d.count} tests</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-brand-card border border-gray-800 rounded-2xl p-4 mb-6 flex flex-wrap gap-3 items-center">
        <Filter className="w-5 h-5 text-brand-primary flex-shrink-0" />
        <div className="relative flex-1 min-w-[160px]">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name / emp no..." className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-blue-200 text-sm focus:border-brand-primary outline-none" />
        </div>
        <select value={filterDept} onChange={e => setFilterDept(e.target.value)} className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-blue-200 text-sm focus:border-brand-primary outline-none">
          <option value="">All Departments</option>
          {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-blue-200 text-sm focus:border-brand-primary outline-none" style={{colorScheme:'dark'}} />
        <select value={filterTopic} onChange={e => setFilterTopic(e.target.value)} className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-blue-200 text-sm focus:border-brand-primary outline-none">
          <option value="">All Topics</option>
          {topics.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-blue-200 text-sm focus:border-brand-primary outline-none">
          <option value="date_desc">Newest First</option>
          <option value="date_asc">Oldest First</option>
          <option value="score_desc">Highest Score</option>
          <option value="score_asc">Lowest Score</option>
        </select>
        {(filterDept || filterDate || filterTopic || search) && (
          <button onClick={() => { setFilterDept(''); setFilterDate(''); setFilterTopic(''); setSearch(''); }} className="text-xs text-gray-400 hover:text-red-400 transition-colors flex items-center gap-1"><X className="w-3 h-3" />Clear</button>
        )}
      </div>

      {/* Results Table */}
      {filtered.length === 0 ? (
        <div className="bg-brand-card border border-dashed border-gray-700 rounded-2xl p-16 text-center">
          <ClipboardList className="w-16 h-16 text-gray-700 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-500 mb-2">No Results Found</h2>
          <p className="text-gray-600 mb-6">Click "Add Score" to record a post-training questionnaire result.</p>
          <button onClick={() => setShowModal(true)} className="bg-brand-primary text-black px-6 py-3 rounded-xl font-bold hover:bg-brand-primaryHover transition-colors">
            <Plus className="w-5 h-5 inline mr-2" />Add First Score
          </button>
        </div>
      ) : (
        <div className="bg-brand-card border border-gray-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 bg-[#181818]">
                  <th className="text-left px-4 py-3 text-gray-400 font-semibold">Employee</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-semibold">Department</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-semibold">Training Topic</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-semibold">Date</th>
                  <th className="text-center px-4 py-3 text-gray-400 font-semibold">Score</th>
                  <th className="text-center px-4 py-3 text-gray-400 font-semibold">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filtered.map((r) => {
                  const c = scoreColor(r.score);
                  return (
                    <tr key={r.id} className={`hover:bg-gray-800/30 transition-colors ${c.bg}`}>
                      <td className="px-4 py-3">
                        <p className="text-blue-200 font-semibold">{r.emp_name}</p>
                        <p className="text-gray-500 text-xs">{r.emp_no}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-300">{r.department}</td>
                      <td className="px-4 py-3 text-gray-300">{r.topic}</td>
                      <td className="px-4 py-3 text-gray-400">{r.training_date}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-2xl font-bold ${c.text}`}>{r.score}</span>
                        <span className="text-gray-500 text-xs">/100</span>
                        <div className="mt-1 h-1 bg-gray-800 rounded-full w-16 mx-auto overflow-hidden">
                          <div className={`h-full rounded-full ${c.badge}`} style={{width:`${r.score}%`}} />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold border ${c.border} ${c.text} ${c.bg}`}>
                          {r.score >= 80 ? <TrendingUp className="w-3 h-3" /> : r.score < 60 ? <AlertTriangle className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {c.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => handleDelete(r.id)} className="text-gray-600 hover:text-red-400 transition-colors p-1"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Low Score Alert */}
      {lowScorers.length > 0 && (
        <div className="mt-6 bg-red-900/20 border border-red-800/40 rounded-2xl p-6">
          <h3 className="text-red-400 font-bold mb-3 flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> Low Scorers Requiring Follow-Up ({lowScorers.length})</h3>
          <div className="flex flex-wrap gap-2">
            {lowScorers.map(r => (
              <div key={r.id} className="bg-red-900/30 border border-red-700/40 rounded-lg px-3 py-2 text-sm">
                <span className="text-blue-200 font-semibold">{r.emp_name}</span>
                <span className="text-gray-400 mx-1">�</span>
                <span className="text-gray-400">{r.department}</span>
                <span className="text-red-400 ml-2 font-bold">{r.score}/100</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Score Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-brand-card border border-gray-800 rounded-2xl w-full max-w-lg p-8 relative shadow-2xl">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-blue-200"><X className="w-6 h-6" /></button>
            <h2 className="text-2xl font-bold text-blue-200 mb-1 flex items-center gap-2"><ClipboardList className="text-brand-primary w-6 h-6" /> Add Quiz Result</h2>
            <p className="text-gray-400 text-sm mb-6">Record a post-training questionnaire score (out of 100).</p>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Employee No *</label>
                  <input required value={form.emp_no} onChange={e => setForm({...form, emp_no: e.target.value})} placeholder="EMP-001" className="w-full bg-[#181818] border border-gray-700 rounded-xl p-3 text-blue-200 focus:border-brand-primary outline-none" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Employee Name *</label>
                  <input required value={form.emp_name} onChange={e => setForm({...form, emp_name: e.target.value})} placeholder="Full Name" className="w-full bg-[#181818] border border-gray-700 rounded-xl p-3 text-blue-200 focus:border-brand-primary outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Department *</label>
                <select required value={form.department} onChange={e => setForm({...form, department: e.target.value})} className="w-full bg-[#181818] border border-gray-700 rounded-xl p-3 text-blue-200 focus:border-brand-primary outline-none">
                  <option value="">Select Department</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Training Topic *</label>
                <input required value={form.topic} onChange={e => setForm({...form, topic: e.target.value})} placeholder="e.g. Fire Safety Protocol" className="w-full bg-[#181818] border border-gray-700 rounded-xl p-3 text-blue-200 focus:border-brand-primary outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Training Date *</label>
                  <input required type="date" value={form.training_date} onChange={e => setForm({...form, training_date: e.target.value})} className="w-full bg-[#181818] border border-gray-700 rounded-xl p-3 text-blue-200 focus:border-brand-primary outline-none" style={{colorScheme:'dark'}} />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Score (0�100) *</label>
                  <input required type="number" min="0" max="100" value={form.score} onChange={e => setForm({...form, score: e.target.value})} placeholder="e.g. 85"
                    className={`w-full bg-[#181818] border rounded-xl p-3 text-blue-200 focus:ring-1 outline-none transition-all font-bold text-xl text-center ${form.score !== '' ? scoreColor(parseInt(form.score)||0).border : 'border-gray-700 focus:border-brand-primary'}`} />
                </div>
              </div>
              {form.score !== '' && (
                <div className={`p-3 rounded-xl border ${scoreColor(parseInt(form.score)||0).border} ${scoreColor(parseInt(form.score)||0).bg} flex items-center gap-2`}>
                  <span className={`font-bold text-sm ${scoreColor(parseInt(form.score)||0).text}`}>
                    {parseInt(form.score) >= 80 ? '?? Excellent � Top performer!' : parseInt(form.score) >= 60 ? '?? Average � Meets expectations' : '?? Low Score � Follow-up training recommended!'}
                  </span>
                </div>
              )}
              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-gray-700 text-gray-400 hover:text-blue-200 py-3 rounded-xl font-semibold">Cancel</button>
                <button type="submit" className="flex-1 bg-brand-primary text-black py-3 rounded-xl font-bold hover:bg-brand-primaryHover">Save Result</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
