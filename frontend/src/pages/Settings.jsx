import React, { useState, useRef, useEffect } from 'react';
import { Upload, Settings as SettingsIcon, Save, Image as ImageIcon, MousePointer2, CheckCircle2, FormInput, Plus, X, ExternalLink, ClipboardList, Users, ChevronDown, ChevronUp, BookOpen, CheckCircle, Copy, Info , ScanLine, Award, MessageSquare} from 'lucide-react';

const STORAGE_KEYS = { attendance: 'hk_attendance_forms', quiz: 'hk_quiz_forms', audit: 'hk_audit_forms' };

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
  const DEPARTMENTS = ['Rooms','Public Area','Laundry','Flower','Stores','Hotel School','Cinnamon Hotel Academy','General'];
  const isQuiz = type === 'quiz';
  const isAudit = type === 'audit';

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
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-4 ${isQuiz ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : isAudit ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'}`}>
          {isQuiz ? <ClipboardList className="w-3 h-3" /> : isAudit ? <CheckCircle className="w-3 h-3" /> : <Users className="w-3 h-3" />}
          {isQuiz ? 'Questionnaire Form' : isAudit ? 'Room Audit Form' : 'Attendance Form'}
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
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${isQuiz ? 'bg-purple-500/20 text-purple-400' : link.type === 'audit' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
            {isQuiz ? <ClipboardList className="w-3 h-3" /> : link.type === 'audit' ? <CheckCircle className="w-3 h-3" /> : <Users className="w-3 h-3" />}
            {isQuiz ? 'Questionnaire' : link.type === 'audit' ? 'Room Audit' : 'Attendance'}
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

export default function Settings() {
  const [activeTab, setActiveTab] = useState('photos');
  
  // Bulk Photos State
  const [photosToUpload, setPhotosToUpload] = useState([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [photoUploadStatus, setPhotoUploadStatus] = useState('');

  // Form Integrations State
  const attendance = useFormLinks(STORAGE_KEYS.attendance);
  const quiz = useFormLinks(STORAGE_KEYS.quiz);
  const audit = useFormLinks(STORAGE_KEYS.audit);
  const [modal, setModal] = useState(null); // 'attendance' | 'quiz' | 'audit' | null
  const [showAttGuide, setShowAttGuide] = useState(true);
  const [showQuizGuide, setShowQuizGuide] = useState(true);
  const [showAuditGuide, setShowAuditGuide] = useState(true);
  
  // OneDrive Config
  const [oneDrivePath, setOneDrivePath] = useState('');
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupResult, setBackupResult] = useState(null);

  useEffect(() => {
    // Load config
    fetch('http://localhost:5000/api/backups/config')
      .then(r => r.json())
      .then(data => { if (data.oneDrivePath) setOneDrivePath(data.oneDrivePath); })
      .catch(console.error);
  }, []);

  const saveOneDriveConfig = async () => {
    setIsSavingConfig(true);
    try {
      await fetch('http://localhost:5000/api/backups/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oneDrivePath })
      });
      alert('OneDrive configuration saved!');
    } catch (err) {
      alert('Failed to save config.');
    }
    setIsSavingConfig(false);
  };

  const triggerBackup = async () => {
    setIsBackingUp(true);
    setBackupResult(null);
    try {
      const res = await fetch('http://localhost:5000/api/backups/trigger', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setBackupResult({ success: true, message: data.message });
      } else {
        setBackupResult({ success: false, message: data.error });
      }
    } catch (err) {
      setBackupResult({ success: false, message: 'Network error triggering backup' });
    }
    setIsBackingUp(false);
  };

  const handlePhotoSelect = (e) => {
    if (e.target.files) {
      setPhotosToUpload(Array.from(e.target.files));
    }
  };

  const handleBulkPhotoUpload = async () => {
    if (photosToUpload.length === 0) return;
    setUploadingPhotos(true);
    setPhotoUploadStatus('');

    const formData = new FormData();
    photosToUpload.forEach(file => {
      formData.append('photos', file);
    });

    try {
      const res = await fetch('http://localhost:5000/api/employees/bulk-photos', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setPhotoUploadStatus(`Successfully mapped ${data.processed} photos to employees!`);
        setPhotosToUpload([]);
      } else {
        setPhotoUploadStatus('Upload failed: ' + data.error);
      }
    } catch (err) {
      setPhotoUploadStatus('Network error during upload.');
    }
    setUploadingPhotos(false);
  };

  return (
    <div className="p-8 w-full max-w-7xl mx-auto pb-24">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight flex items-center gap-3">
          <SettingsIcon className="w-8 h-8 text-brand-gold" />
          System Settings
        </h1>
        <p className="text-gray-400">Configure your global preferences, form integrations, and templates.</p>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-gray-800 mb-8 overflow-x-auto">
        {['photos', 'integrations', 'backups', 'general'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === tab ? 'text-brand-gold border-b-2 border-brand-gold bg-brand-gold/5' : 'text-gray-400 hover:text-white'}`}
          >
            {tab === 'photos' ? 'Bulk Staff Photos' : tab === 'integrations' ? 'Form Integrations' : tab === 'backups' ? 'Backups & Storage' : 'General Preferences'}
          </button>
        ))}
      </div>

      {activeTab === 'photos' && (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <section className="bg-brand-card border border-gray-800 rounded-2xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3"><ImageIcon className="text-brand-gold w-6 h-6" /> Bulk Staff Photo Upload</h2>
            <p className="text-gray-400 mb-6">Upload multiple staff photos at once. Ensure the image files are named with the exact Employee Number (e.g., <strong className="text-white">E1024.jpg</strong> or <strong className="text-white">E1024.png</strong>). The system will automatically map the photo to the correct employee profile.</p>
            
            <div className="bg-gray-900 border-2 border-dashed border-gray-700 hover:border-brand-gold transition-colors rounded-2xl p-10 text-center relative cursor-pointer group">
              <input type="file" multiple accept="image/*" onChange={handlePhotoSelect} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
              <Upload className="w-12 h-12 text-gray-500 group-hover:text-brand-gold transition-colors mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Drag & Drop photos here</h3>
              <p className="text-gray-500 text-sm">or click to browse from your computer</p>
              {photosToUpload.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-800">
                  <p className="text-brand-gold font-bold">{photosToUpload.length} files selected ready for upload.</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-between">
              {photoUploadStatus ? (
                <p className={`text-sm font-bold ${photoUploadStatus.includes('failed') || photoUploadStatus.includes('error') ? 'text-red-400' : 'text-emerald-400'}`}>
                  {photoUploadStatus}
                </p>
              ) : <div></div>}

              <button 
                onClick={handleBulkPhotoUpload} 
                disabled={uploadingPhotos || photosToUpload.length === 0}
                className="bg-brand-gold text-black px-8 py-3 rounded-xl font-bold hover:bg-brand-goldHover transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {uploadingPhotos ? 'Uploading...' : 'Upload Photos'}
              </button>
            </div>
          </section>
        </div>
      )}\n\n      {activeTab === 'integrations' && (
        <div className="max-w-4xl mx-auto space-y-10">
          <header className="mb-4">
            <h2 className="text-2xl font-bold text-white mb-2 tracking-tight flex items-center gap-3">
              <FormInput className="w-6 h-6 text-brand-gold" /> Google Forms Manager
            </h2>
            <p className="text-gray-400 text-sm">Link your Google Forms to training topics — for attendance tracking and post-training questionnaires.</p>
          </header>

          {/* ─── ATTENDANCE FORMS ─── */}
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2"><Users className="w-5 h-5 text-blue-400" /> Attendance Forms</h3>
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
                <h3 className="text-xl font-bold text-white flex items-center gap-2"><ClipboardList className="w-5 h-5 text-purple-400" /> Questionnaire / Quiz Forms</h3>
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

          {/* ─── ROOM AUDIT FORMS ─── */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2"><CheckCircle className="w-5 h-5 text-emerald-400" /> Room Audit Forms</h3>
                <p className="text-gray-500 text-sm mt-0.5">Forms used by supervisors to perform daily Room Audits (Departure/Stayover)</p>
              </div>
              <button onClick={() => setModal('audit')} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-lg shadow-emerald-900/30">
                <Plus className="w-4 h-4" /> Add Audit Form
              </button>
            </div>

            <div className="bg-emerald-900/10 border border-emerald-500/20 rounded-2xl mb-4 overflow-hidden">
              <button onClick={() => setShowAuditGuide(!showAuditGuide)} className="w-full flex items-center justify-between p-4 text-left hover:bg-emerald-900/20 transition-colors">
                <span className="text-emerald-400 font-semibold text-sm flex items-center gap-2"><Info className="w-4 h-4" /> How to link a Room Audit Form</span>
                {showAuditGuide ? <ChevronUp className="w-4 h-4 text-emerald-400" /> : <ChevronDown className="w-4 h-4 text-emerald-400" />}
              </button>
              {showAuditGuide && (
                <div className="px-6 pb-6 space-y-3 border-t border-emerald-500/20 pt-4">
                  <HowToStep num="1" text='Create a Google Form for your Audits.' />
                  <HowToStep num="2" text='Add required fields: "Employee Number" (Short answer), "Employee Name" (Short answer), "Audit Type" (Multiple choice: Departure, Stayover, Public Area, Laundry, Flower, Stores), "Score" (Number), and "Area / Room Number".' />
                  <HowToStep num="3" text='In your Google Form, go to the top right menu (3 dots) → Script editor.' />
                  <HowToStep num="4" text='Copy the webhook script (provided below) and paste it into the editor. Save it.' />
                  <HowToStep num="5" text='Set up a Trigger in Apps Script (Clock icon) to run on "On form submit".' />
                  <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 mt-3">
                    <p className="text-gray-400 text-xs font-bold mb-2">Webhook Apps Script (Copy & Paste):</p>
                    <pre className="text-emerald-300 text-[10px] overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed bg-black p-3 rounded border border-gray-800">
{`function onSubmit(e) {
  var responses = e.namedValues;
  var payload = {
    emp_no: responses['Employee Number'] ? responses['Employee Number'][0] : '',
    emp_name: responses['Employee Name'] ? responses['Employee Name'][0] : '',
    audit_type: responses['Audit Type'] ? responses['Audit Type'][0] : 'Departure',
    score: parseInt(responses['Score'] ? responses['Score'][0] : '0'),
    room_number: responses['Area / Room Number'] ? responses['Area / Room Number'][0] : '',
    audit_date: new Date().toISOString()
  };
  
  var options = {
    'method' : 'post',
    'contentType': 'application/json',
    'payload' : JSON.stringify(payload)
  };
  UrlFetchApp.fetch('http://YOUR_SERVER_IP:5000/api/audits/webhook', options);
}`}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            {audit.links.length === 0 ? (
              <div className="border border-dashed border-gray-700 rounded-2xl p-10 text-center">
                <CheckCircle className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500 font-semibold mb-1">No room audit forms linked yet</p>
                <p className="text-gray-600 text-sm mb-4">Click "Add Audit Form" to link your Google Audit Form</p>
                <button onClick={() => setModal('audit')} className="text-emerald-400 hover:text-emerald-300 text-sm font-semibold flex items-center gap-1 mx-auto"><Plus className="w-4 h-4" /> Add Audit Form</button>
              </div>
            ) : (
              <div className="space-y-3">
                {audit.links.map(l => <FormCard key={l.id} link={l} onDelete={audit.remove} />)}
              </div>
            )}
          </section>

          {/* ─── MODAL ─── */}
          {modal && (
            <AddFormModal
              type={modal}
              onAdd={modal === 'attendance' ? attendance.add : modal === 'quiz' ? quiz.add : audit.add}
              onClose={() => setModal(null)}
            />
          )}
        </div>
      )}

      {/* ─── BACKUPS TAB ─── */}
      {activeTab === 'backups' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <section className="bg-brand-card border border-gray-800 rounded-2xl p-8">
            <h2 className="text-xl font-bold text-white mb-6">OneDrive Backup Settings</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">Local OneDrive Path</label>
                <div className="flex gap-4">
                  <input 
                    type="text" 
                    value={oneDrivePath} 
                    onChange={e => setOneDrivePath(e.target.value)} 
                    placeholder="e.g., C:\Users\User\OneDrive\HK_Backups" 
                    className="flex-1 bg-[#1a1a1a] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-gold"
                  />
                  <button onClick={saveOneDriveConfig} disabled={isSavingConfig} className="bg-brand-gold hover:bg-yellow-500 text-black px-6 py-3 rounded-xl font-bold transition-colors disabled:opacity-50">
                    {isSavingConfig ? 'Saving...' : 'Save Path'}
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-2">The system will compress your database and uploaded certificates/photos into a .zip file and save it directly to this folder on your computer. Your OneDrive desktop app will automatically sync it to the cloud.</p>
              </div>

              <div className="border-t border-gray-800 pt-6">
                <button 
                  onClick={triggerBackup} 
                  disabled={isBackingUp || !oneDrivePath}
                  className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors"
                >
                  <Save className="w-5 h-5" />
                  {isBackingUp ? 'Creating Backup...' : 'Backup Now'}
                </button>
                
                {backupResult && (
                  <div className={`mt-4 p-4 rounded-xl ${backupResult.success ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>
                    {backupResult.message}
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      )}

      {activeTab === 'general' && (
        <div className="bg-brand-card rounded-2xl p-8 border border-gray-800 shadow-lg text-center text-gray-500 py-24">
          <SettingsIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <h2 className="text-xl font-bold text-gray-400 mb-2">General Preferences</h2>
          <p>Global system settings will be configured here in a future update.</p>
        </div>
      )}
    </div>
  );
}
