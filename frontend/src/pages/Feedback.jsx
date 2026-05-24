import React, { useState } from 'react';
import { FormInput, Plus, X, ExternalLink, ClipboardList, Users, ChevronDown, ChevronUp, BookOpen, CheckCircle, Copy, Info } from 'lucide-react';

const STORAGE_KEYS = { attendance: 'hk_attendance_forms', quiz: 'hk_quiz_forms' };

function useFormLinks(key) {
  const [links, setLinks] = useState(() => { try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; } });
  const save = (data) => { setLinks(data); localStorage.setItem(key, JSON.stringify(data)); };
  const add = (entry) => save([...links, { id: Date.now(), ...entry }]);
  const remove = (id) => save(links.filter(l => l.id !== id));
  return { links, add, remove };
}

function AddFormModal({ type, onAdd, onClose }) {
  const [topic, setTopic] = useState('');
  const [dept, setDept] = useState('');
  const [url, setUrl] = useState('');
  const DEPARTMENTS = ['Rooms', 'Public Area', 'Laundry', 'Flower', 'Stores', 'Coordinator', 'Hotel School', 'Cinnamon Hotel Academy', 'General'];
  const isQuiz = type === 'quiz';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url.includes('google.com') && !url.includes('docs.google')) { alert('Please enter a valid Google Forms or Google Sheets URL.'); return; }
    onAdd({ topic, department: dept, url, type, added: new Date().toISOString() });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-brand-card border border-gray-800 rounded-2xl w-full max-w-lg p-8 relative shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X className="w-6 h-6" /></button>
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-4 ${isQuiz ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'}`}>
          {isQuiz ? <ClipboardList className="w-3 h-3" /> : <Users className="w-3 h-3" />}
          {isQuiz ? 'Questionnaire Form' : 'Attendance Form'}
        </div>
        <h2 className="text-2xl font-bold text-white mb-1">Link Google Form</h2>
        <p className="text-gray-400 text-sm mb-6">Paste your Google Form or linked Google Sheet URL.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Training Topic *</label>
            <input required value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Fire Safety Protocol" className="w-full bg-[#181818] border border-gray-700 rounded-xl p-3 text-white focus:border-brand-gold outline-none" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Department</label>
            <select value={dept} onChange={e => setDept(e.target.value)} className="w-full bg-[#181818] border border-gray-700 rounded-xl p-3 text-white focus:border-brand-gold outline-none">
              <option value="">All Departments</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Google Form / Sheet URL *</label>
            <input required type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://forms.google.com/..." className="w-full bg-[#181818] border border-gray-700 rounded-xl p-3 text-white focus:border-brand-gold outline-none font-mono text-sm" />
            <p className="text-gray-600 text-xs mt-1">Paste the Google Form link (to share with staff) or Google Sheets link (for auto-sync of results)</p>
          </div>
          <div className="pt-2 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-700 text-gray-400 hover:text-white py-3 rounded-xl font-semibold">Cancel</button>
            <button type="submit" className="flex-1 bg-brand-gold text-black py-3 rounded-xl font-bold hover:bg-brand-goldHover">Save Link</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function HowToStep({ num, text }) {
  return (
    <div className="flex gap-3">
      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-gold text-black text-xs font-bold flex items-center justify-center">{num}</span>
      <p className="text-gray-300 text-sm leading-relaxed">{text}</p>
    </div>
  );
}

function FormCard({ link, onDelete }) {
  const copyUrl = () => { navigator.clipboard.writeText(link.url); };
  const isQuiz = link.type === 'quiz';
  return (
    <div className={`p-5 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${isQuiz ? 'bg-purple-900/10 border-purple-500/20' : 'bg-blue-900/10 border-blue-500/20'}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${isQuiz ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
            {isQuiz ? <ClipboardList className="w-3 h-3" /> : <Users className="w-3 h-3" />}
            {isQuiz ? 'Questionnaire' : 'Attendance'}
          </span>
          {link.department && <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">{link.department}</span>}
        </div>
        <h3 className="text-white font-bold">{link.topic}</h3>
        <p className="text-gray-500 text-xs mt-1 truncate max-w-xs font-mono">{link.url}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button onClick={copyUrl} title="Copy link" className="p-2 text-gray-400 hover:text-white bg-gray-800 rounded-lg transition-colors"><Copy className="w-4 h-4" /></button>
        <a href={link.url} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-400 hover:text-brand-gold bg-gray-800 rounded-lg transition-colors"><ExternalLink className="w-4 h-4" /></a>
        <button onClick={() => onDelete(link.id)} className="p-2 text-gray-400 hover:text-red-400 bg-gray-800 rounded-lg transition-colors"><X className="w-4 h-4" /></button>
      </div>
    </div>
  );
}

export default function Feedback() {
  const attendance = useFormLinks(STORAGE_KEYS.attendance);
  const quiz = useFormLinks(STORAGE_KEYS.quiz);
  const [modal, setModal] = useState(null); // 'attendance' | 'quiz' | null
  const [showAttGuide, setShowAttGuide] = useState(true);
  const [showQuizGuide, setShowQuizGuide] = useState(true);

  return (
    <div className="p-8 w-full max-w-5xl mx-auto pb-24">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight flex items-center gap-3">
          <FormInput className="w-8 h-8 text-brand-gold" /> Google Forms Manager
        </h1>
        <p className="text-gray-400">Link your Google Forms to training topics — for attendance tracking and post-training questionnaires.</p>
      </header>

      {/* ─── ATTENDANCE FORMS ─── */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2"><Users className="w-5 h-5 text-blue-400" /> Attendance Forms</h2>
            <p className="text-gray-500 text-sm mt-0.5">Google Forms used to record employee attendance for each training session</p>
          </div>
          <button onClick={() => setModal('attendance')} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-lg shadow-blue-900/30">
            <Plus className="w-4 h-4" /> Add Attendance Form
          </button>
        </div>

        {/* How to guide */}
        <div className="bg-blue-900/10 border border-blue-500/20 rounded-2xl mb-4 overflow-hidden">
          <button onClick={() => setShowAttGuide(!showAttGuide)} className="w-full flex items-center justify-between p-4 text-left hover:bg-blue-900/20 transition-colors">
            <span className="text-blue-400 font-semibold text-sm flex items-center gap-2"><Info className="w-4 h-4" /> How to set up an Attendance Form</span>
            {showAttGuide ? <ChevronUp className="w-4 h-4 text-blue-400" /> : <ChevronDown className="w-4 h-4 text-blue-400" />}
          </button>
          {showAttGuide && (
            <div className="px-6 pb-6 space-y-3 border-t border-blue-500/20 pt-4">
              <HowToStep num="1" text='Go to forms.google.com → Create a new form titled with the training topic (e.g. "Fire Safety Attendance").' />
              <HowToStep num="2" text='Add fields: Employee Number (Short answer), Full Name (Short answer), Department (Short answer), Date (Date).' />
              <HowToStep num="3" text='Click the "Send" button → Copy the form link.' />
              <HowToStep num="4" text='Come back here → Click "Add Attendance Form" → Paste the link and select the training topic.' />
              <HowToStep num="5" text='Share this link with your staff via WhatsApp or print a QR code. When they complete it, responses go to the linked Google Sheet automatically.' />
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 mt-2">
                <p className="text-blue-300 text-xs font-semibold">💡 Tip: To share as QR code — open the form, click Send → Link icon → copy → paste into any QR code generator (e.g. qr-code-generator.com)</p>
              </div>
            </div>
          )}
        </div>

        {attendance.links.length === 0 ? (
          <div className="border border-dashed border-gray-700 rounded-2xl p-10 text-center">
            <Users className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 font-semibold mb-1">No attendance forms linked yet</p>
            <p className="text-gray-600 text-sm mb-4">Click "Add Attendance Form" to link your first Google Form</p>
            <button onClick={() => setModal('attendance')} className="text-blue-400 hover:text-blue-300 text-sm font-semibold flex items-center gap-1 mx-auto"><Plus className="w-4 h-4" /> Add Attendance Form</button>
          </div>
        ) : (
          <div className="space-y-3">
            {attendance.links.map(l => <FormCard key={l.id} link={l} onDelete={attendance.remove} />)}
          </div>
        )}
      </section>

      {/* ─── QUESTIONNAIRE FORMS ─── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2"><ClipboardList className="w-5 h-5 text-purple-400" /> Questionnaire / Quiz Forms</h2>
            <p className="text-gray-500 text-sm mt-0.5">Post-training quiz forms — scores are tracked in the Quiz Results page</p>
          </div>
          <button onClick={() => setModal('quiz')} className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-lg shadow-purple-900/30">
            <Plus className="w-4 h-4" /> Add Quiz Form
          </button>
        </div>

        {/* How to guide */}
        <div className="bg-purple-900/10 border border-purple-500/20 rounded-2xl mb-4 overflow-hidden">
          <button onClick={() => setShowQuizGuide(!showQuizGuide)} className="w-full flex items-center justify-between p-4 text-left hover:bg-purple-900/20 transition-colors">
            <span className="text-purple-400 font-semibold text-sm flex items-center gap-2"><Info className="w-4 h-4" /> How to set up a Questionnaire / Quiz Form</span>
            {showQuizGuide ? <ChevronUp className="w-4 h-4 text-purple-400" /> : <ChevronDown className="w-4 h-4 text-purple-400" />}
          </button>
          {showQuizGuide && (
            <div className="px-6 pb-6 space-y-3 border-t border-purple-500/20 pt-4">
              <HowToStep num="1" text='Go to forms.google.com → Click the "+" to create a new form.' />
              <HowToStep num="2" text='Click the Settings (⚙️) icon → Enable "Make this a quiz" → Set point values for each question.' />
              <HowToStep num="3" text='Add required fields at the top: Employee Number (Short answer — required), Full Name (Short answer), Department (Dropdown).' />
              <HowToStep num="4" text='Add your training questions with correct answers. Google Forms will auto-calculate the score out of 100.' />
              <HowToStep num="5" text='Click Send → Copy the form link → Come back here → Click "Add Quiz Form" → Paste the link.' />
              <HowToStep num="6" text='Share the quiz form with staff after training. After they complete it, manually record their score in the "Quiz Results" page using the score from Google Forms responses.' />
              <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-3 mt-2">
                <p className="text-purple-300 text-xs font-semibold">💡 Future: Link the Google Sheet to the Quiz Results page for auto-sync of scores!</p>
              </div>
              <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 mt-1">
                <p className="text-gray-400 text-xs font-bold mb-2">📋 Recommended form fields:</p>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  {['Employee Number *','Full Name *','Department *','Training Topic (auto-fill)','Score (auto-calculated)','Date'].map(f => (
                    <div key={f} className="flex items-center gap-1 text-gray-400"><CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />{f}</div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {quiz.links.length === 0 ? (
          <div className="border border-dashed border-gray-700 rounded-2xl p-10 text-center">
            <ClipboardList className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 font-semibold mb-1">No quiz forms linked yet</p>
            <p className="text-gray-600 text-sm mb-4">Click "Add Quiz Form" to link your Google Quiz Form</p>
            <button onClick={() => setModal('quiz')} className="text-purple-400 hover:text-purple-300 text-sm font-semibold flex items-center gap-1 mx-auto"><Plus className="w-4 h-4" /> Add Quiz Form</button>
          </div>
        ) : (
          <div className="space-y-3">
            {quiz.links.map(l => <FormCard key={l.id} link={l} onDelete={quiz.remove} />)}
          </div>
        )}
      </section>

      {/* ─── MODAL ─── */}
      {modal && (
        <AddFormModal
          type={modal}
          onAdd={modal === 'attendance' ? attendance.add : quiz.add}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
