import * as XLSX from 'xlsx';
import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Calendar as CalendarIcon, Clock, MapPin, Users, ChevronLeft, ChevronRight, Plus, X, Upload, Printer, CheckCircle, Save, CalendarDays, Filter, UserMinus, Trash2, MessageCircle, BookOpen, RefreshCw } from 'lucide-react';

const DEPARTMENTS = ['Rooms', 'Public Area', 'Laundry', 'Flower', 'Stores', 'Coordinator', 'Hotel School', 'Cinnamon Hotel Academy', 'General'];

const DEPT_COLORS = {
  'Rooms':       'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'Public Area': 'bg-green-500/20 text-green-300 border-green-500/30',
  'Laundry':     'bg-purple-500/20 text-purple-300 border-purple-500/30',
  'Flower':      'bg-pink-500/20 text-pink-300 border-pink-500/30',
  'Stores':      'bg-orange-500/20 text-orange-300 border-orange-500/30',
  'Coordinator': 'bg-teal-500/20 text-teal-300 border-teal-500/30',
  'General':     'bg-gray-500/20 text-gray-300 border-gray-500/30',
};

export default function Schedule() {
  const [schedules, setSchedules] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [qrModal, setQrModal] = useState({ show: false, session: null });
  const [formData, setFormData] = useState({
    topic: '', category: 'Mandatory', venue: '', duration: 60, trainer: '', training_date: '', google_form_link: '', department: ''
  });

  // Big Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarFilter, setCalendarFilter] = useState('All');
  const [viewSessionModal, setViewSessionModal] = useState({ show: false, session: null, allocations: [] });

  // Calendar Upload State
  const [showCalUploadModal, setShowCalUploadModal] = useState(false);
  const [calUploadDept, setCalUploadDept] = useState('Rooms');
  const [uploadingCal, setUploadingCal] = useState(false);
  const calFileInputRef = useRef(null);

  // Trainer Days Off State
  const [trainerDaysOff, setTrainerDaysOff] = useState([]);
  const [showTrainerModal, setShowTrainerModal] = useState(false);
  const [newDayOff, setNewDayOff] = useState({ trainer_name: '', date_off: '' });

  // Old Roster Allocation State
  const [showRosterModal, setShowRosterModal] = useState(false);
  const [rosterStep, setRosterStep] = useState(1);
  const [selectedMasterTopics, setSelectedMasterTopics] = useState({ Rooms: '', 'Public Area': '', Laundry: '', Flower: '', Stores: '', Coordinator: '' });
  const [pendingRosters, setPendingRosters] = useState({ Rooms: null, 'Public Area': null, Laundry: null, Flower: null, Stores: null, Coordinator: null });
  const [allocations, setAllocations] = useState([]);
  const [savingAllocations, setSavingAllocations] = useState(false);

  // ── NEW: Monthly Roster State ──
  const [showMonthlyRosterModal, setShowMonthlyRosterModal] = useState(false);
  const [monthlyRosterStep, setMonthlyRosterStep] = useState(1); // 1=upload, 2=config, 3=preview
  const [monthlyRosters, setMonthlyRosters] = useState({}); // { 'Rooms': { month, year, employees: [{emp_no, name, days:{1:'W',2:'O',...}}] } }
  const [rosterUploadDept, setRosterUploadDept] = useState('Rooms');
  const [rosterTrainingTopic, setRosterTrainingTopic] = useState('');
  const [rosterTrainerName, setRosterTrainerName] = useState('');
  const [rosterVenue, setRosterVenue] = useState('Main Training Room');
  const [rosterBatchSize, setRosterBatchSize] = useState(15);
  const [autoSchedulePreview, setAutoSchedulePreview] = useState([]);
  const [savingAutoSchedule, setSavingAutoSchedule] = useState(false);
  const rosterFileInputRef = useRef(null);
  const [activeRosterDept, setActiveRosterDept] = useState('Rooms');

  const fetchSchedules = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/trainings');
      setSchedules(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchTrainerDaysOff = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/trainings/trainer/days-off');
      setTrainerDaysOff(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchSchedules(); fetchTrainerDaysOff(); }, []);

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
      await axios.post('http://localhost:5000/api/trainings', payload);
      setShowModal(false);
      setFormData({ topic: '', category: 'Mandatory', venue: '', duration: 60, trainer: '', training_date: '', google_form_link: '', department: '' });
      fetchSchedules();
    } catch (err) {
      alert('Error scheduling session: ' + (err?.response?.data?.error || err.message));
    }
  };

  // --- TRAINER DAYS OFF ---
  const handleAddDayOff = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/trainings/trainer/days-off', newDayOff);
      setNewDayOff({ trainer_name: '', date_off: '' });
      fetchTrainerDaysOff();
    } catch (err) { alert('Failed to add day off'); }
  };
  const handleDeleteDayOff = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/trainings/trainer/days-off/${id}`);
      fetchTrainerDaysOff();
    } catch (err) { alert('Failed to delete day off'); }
  };

  // --- BIG CALENDAR ---
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  let firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  if (firstDay === 0) firstDay = 7;
  const prevMonth = () => setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentYear, currentMonth + 1, 1));

  const filteredSchedules = schedules.filter(s => calendarFilter === 'All' || s.department === calendarFilter);
  const getSessionsForDay = (day) => filteredSchedules.filter(s => {
    const date = new Date(s.training_date);
    return date.getDate() === day && date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });
  const getDaysOffForDay = (day) => trainerDaysOff.filter(t => {
    const date = new Date(t.date_off);
    return date.getDate() === day && date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });
  const openSessionView = async (session) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/trainings/${session.id}/allocations`);
      setViewSessionModal({ show: true, session, allocations: res.data });
    } catch (err) { alert('Failed to load allocated employees'); }
  };
  const handleSendWhatsApp = async () => {
    const phone = prompt("Enter WhatsApp number (with country code, e.g. 94771234567):");
    if (!phone) return;
    try {
      const message = `*HK TRAINING PORTAL*\n\nHello! You have been allocated to a mandatory training session.\n\n*Topic:* ${viewSessionModal.session.topic}\n*Date:* ${new Date(viewSessionModal.session.training_date).toLocaleString()}\n*Venue:* ${viewSessionModal.session.venue}\n*Trainer:* ${viewSessionModal.session.trainer_name}\n\nPlease ensure you attend on time!`;
      await axios.post('http://localhost:5000/api/whatsapp/send', { phone, message });
      alert('WhatsApp Invite Sent!');
    } catch (err) { alert(err.response?.data?.error || 'Failed to send WhatsApp message.'); }
  };

  // --- CALENDAR UPLOAD ---
  const handleCalendarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingCal(true);

    try {
      let csvContent = '';
      if (file.name.endsWith('.csv')) {
        csvContent = await file.text();
      } else {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        csvContent = XLSX.utils.sheet_to_csv(worksheet);
      }

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const data = new FormData();
      data.append('file', blob, 'upload.csv');
      data.append('department', calUploadDept);

      await axios.post('http://localhost:5000/api/trainings/upload', data);
      alert('Monthly Calendar imported successfully!');
      setShowCalUploadModal(false);
      fetchSchedules();
    } catch (err) { 
      console.error(err);
      alert('Error uploading calendar file'); 
    }
    finally { setUploadingCal(false); }
  };

  // --- OLD SMART ROSTER ---
  const isDayOff = (dateObj) => {
    const dStr = dateObj.toISOString().split('T')[0];
    return trainerDaysOff.some(tdo => tdo.date_off.startsWith(dStr));
  };
  const handleDeptFileUpload = (e, targetDept) => {
    const file = e.target.files[0];
    if (!file) return;
    const masterSessions = schedules.filter(s => s.department === targetDept && new Date(s.training_date) >= new Date().setHours(0,0,0,0));
    if (masterSessions.length === 0) {
      alert(`No upcoming training topics found for ${targetDept}. Please import a Monthly Calendar first!`);
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const csv = event.target.result;
      const lines = csv.split('\n');
      const emps = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line) {
          const cols = line.split(',');
          if (cols.length >= 2) emps.push({ emp_no: cols[0].trim(), name: cols[1].trim() });
        }
      }
      setPendingRosters(prev => ({...prev, [targetDept]: emps}));
    };
    reader.readAsText(file);
  };
  const handleGenerateSchedules = () => {
    let generatedSessions = [];
    for (const [dept, emps] of Object.entries(pendingRosters)) {
      if (!emps) continue;
      const masterSessions = schedules.filter(s => s.department === dept && new Date(s.training_date) >= new Date().setHours(0,0,0,0));
      
      masterSessions.forEach(masterSession => {
        let currentAllocDate = new Date(masterSession.training_date);
        let remainingEmps = [...emps];
        
        while (remainingEmps.length > 0) {
          while (isDayOff(currentAllocDate)) currentAllocDate.setDate(currentAllocDate.getDate() + 1);
          
          const dayIndex = currentAllocDate.getDate();
          
          // Filter eligible employees for this specific day (Morning 6,8 or Afternoon 13)
          const eligibleForToday = remainingEmps.filter(emp => {
            const shift = String(emp.days[dayIndex]).trim().toUpperCase();
            return ['6', '8', '13'].includes(shift);
          });
          
          if (eligibleForToday.length === 0) {
             currentAllocDate.setDate(currentAllocDate.getDate() + 1);
             // Safety break to prevent infinite loops if no one is ever eligible
             if (currentAllocDate.getDate() > 30) break;
             continue;
          }
          
          let chunk1 = eligibleForToday.slice(0, 15);
          let chunk2 = eligibleForToday.slice(15, 30);
          
          if (chunk1.length > 0) {
            let d1 = new Date(currentAllocDate); d1.setHours(9,0,0,0);
            generatedSessions.push({ master_id_to_delete: remainingEmps.length === emps.length ? masterSession.id : null, department: dept, topic: masterSession.topic, employees: chunk1, training_date: d1.toISOString(), venue: masterSession.venue, trainer: masterSession.trainer_name });
            remainingEmps = remainingEmps.filter(e => !chunk1.includes(e));
          }
          
          if (chunk2.length > 0) {
            let d2 = new Date(currentAllocDate); d2.setHours(15,0,0,0);
            generatedSessions.push({ master_id_to_delete: null, department: dept, topic: masterSession.topic, employees: chunk2, training_date: d2.toISOString(), venue: masterSession.venue, trainer: masterSession.trainer_name });
            remainingEmps = remainingEmps.filter(e => !chunk2.includes(e));
          }
          
          currentAllocDate.setDate(currentAllocDate.getDate() + 1);
        }
      });
    }
    setAllocations(generatedSessions);
    setRosterStep(2);
  };
  const handleSaveSmartAllocations = async () => {
    setSavingAllocations(true);
    try {
      const idsToDelete = [...new Set(allocations.map(s => s.master_id_to_delete).filter(id => id !== null))];
      for (const id of idsToDelete) await axios.delete(`http://localhost:5000/api/trainings/${id}`);
      const promises = allocations.map(async (session) => {
        const res = await axios.post('http://localhost:5000/api/trainings', { topic: session.topic, category: 'Mandatory', venue: session.venue, duration: 120, trainer: session.trainer, training_date: session.training_date, department: session.department });
        await axios.post(`http://localhost:5000/api/trainings/${res.data.id}/allocations`, { employees: session.employees });
      });
      await Promise.all(promises);
      alert('Smart Allocations saved to Master Calendar!');
      setShowRosterModal(false);
      fetchSchedules();
    } catch (err) { alert('Failed to save smart allocations.'); }
    finally { setSavingAllocations(false); }
  };
  const openRosterModal = () => {
    setRosterStep(1); setAllocations([]);
    setPendingRosters({ Rooms: null, 'Public Area': null, Laundry: null, Flower: null, Stores: null, Coordinator: null });
    setShowRosterModal(true);
  };

  // ════════════════════════════════════════════════════════════
  // ── NEW: MONTHLY ROSTER LOGIC ──
  // ════════════════════════════════════════════════════════════

  /**
   * Parse Monthly Roster CSV
   * Expected format:
   * EmpNo,Name,01,02,03,...,31
   * E001,John Smith,W,W,O,W,L,W,W,...
   *
   * W = Working (available for training)
   * O = Off day
   * L = Leave
   * H = Holiday
   * S = Split shift (half day, treated as available)
   */
  const parseMonthlyRosterCSV = (csvText, dept) => {
    const lines = csvText.split('\n').map(l => l.trim()).filter(l => l);
    if (lines.length < 2) return null;

    const header = lines[0].split(',').map(h => h.trim());
    const dayColumns = header.slice(2); // columns after EmpNo, Name
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();

    const employees = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim());
      if (cols.length < 2 || !cols[0]) continue;
      const emp_no = cols[0];
      const name = cols[1];
      const days = {};
      dayColumns.forEach((dayLabel, idx) => {
        const dayNum = parseInt(dayLabel);
        if (dayNum >= 1 && dayNum <= 31) {
          days[dayNum] = (cols[idx + 2] || 'O').toUpperCase();
        }
      });
      employees.push({ emp_no, name, days });
    }

    return { dept, month, year, employees };
  };

  const handleMonthlyRosterUpload = (e, dept) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const parsed = parseMonthlyRosterCSV(ev.target.result, dept);
      if (!parsed || parsed.employees.length === 0) {
        alert('Could not parse roster. Please check the CSV format.');
        return;
      }
      setMonthlyRosters(prev => ({ ...prev, [dept]: parsed }));
      alert(`✅ Roster uploaded for ${dept}: ${parsed.employees.length} employees loaded.`);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  /**
   * Auto-generate training schedule from monthly roster
   * - Find days when ≥ batchSize employees are working
   * - Or group all available employees per day into batches
   * - Skip trainer days off
   * - Slot at 9 AM and 3 PM
   */
  const generateAutoSchedule = () => {
    if (!rosterTrainingTopic.trim()) { alert('Please enter a Training Topic first.'); return; }

    const uploadedDepts = Object.keys(monthlyRosters);
    if (uploadedDepts.length === 0) { alert('Please upload at least one department roster first.'); return; }

    const sessions = [];

    for (const dept of uploadedDepts) {
      const roster = monthlyRosters[dept];
      if (!roster) continue;

      const daysInRosterMonth = getDaysInMonth(roster.year, roster.month);

      // For each day of the month, collect available employees
      for (let day = 1; day <= daysInRosterMonth; day++) {
        const dateObj = new Date(roster.year, roster.month, day);
        const dateKey = dateObj.toISOString().split('T')[0];

        // Skip trainer days off
        if (isDayOff(dateObj)) continue;

        // Get employees available (W or S) on this day
        const availableEmps = roster.employees.filter(emp => {
          const status = emp.days[day] || 'O';
          return status === 'W' || status === 'S';
        });

        if (availableEmps.length === 0) continue;

        // Split into batches
        const bSize = parseInt(rosterBatchSize) || 15;
        for (let i = 0; i < availableEmps.length; i += bSize) {
          const batch = availableEmps.slice(i, i + bSize);
          const slotHour = (Math.floor(i / bSize) % 2 === 0) ? 9 : 15;
          const sessionDate = new Date(roster.year, roster.month, day, slotHour, 0, 0);

          sessions.push({
            dept,
            topic: rosterTrainingTopic,
            trainer: rosterTrainerName || 'TBD',
            venue: rosterVenue || 'Main Training Room',
            training_date: sessionDate.toISOString(),
            employees: batch,
            dateLabel: sessionDate.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' }),
            timeLabel: slotHour === 9 ? '9:00 AM' : '3:00 PM',
          });
        }
      }
    }

    if (sessions.length === 0) {
      alert('No available training slots found. Check if employees have working days marked in the roster.');
      return;
    }

    setAutoSchedulePreview(sessions);
    setMonthlyRosterStep(3);
  };

  const handleSaveAutoSchedule = async () => {
    setSavingAutoSchedule(true);
    try {
      let saved = 0;
      for (const session of autoSchedulePreview) {
        const res = await axios.post('http://localhost:5000/api/trainings', {
          topic: session.topic,
          category: 'Mandatory',
          venue: session.venue,
          duration: 120,
          trainer: session.trainer,
          training_date: session.training_date,
          department: session.dept,
        });
        if (session.employees.length > 0) {
          await axios.post(`http://localhost:5000/api/trainings/${res.data.id}/allocations`, {
            employees: session.employees.map(e => ({ emp_no: e.emp_no, name: e.name })),
          });
        }
        saved++;
      }
      alert(`✅ ${saved} training sessions saved to the Master Calendar!`);
      setShowMonthlyRosterModal(false);
      setMonthlyRosters({});
      setAutoSchedulePreview([]);
      setMonthlyRosterStep(1);
      fetchSchedules();
    } catch (err) {
      console.error(err);
      alert('Failed to save schedule: ' + (err?.response?.data?.error || err.message));
    } finally { setSavingAutoSchedule(false); }
  };

  const openMonthlyRosterModal = () => {
    setMonthlyRosterStep(1);
    setMonthlyRosters({});
    setAutoSchedulePreview([]);
    setRosterTrainingTopic('');
    setRosterTrainerName('');
    setRosterVenue('Main Training Room');
    setRosterBatchSize(15);
    setActiveRosterDept('Rooms');
    setShowMonthlyRosterModal(true);
  };

  // Get roster summary stats
  const getRosterStats = (dept) => {
    const r = monthlyRosters[dept];
    if (!r) return null;
    const totalDays = Object.values(r.employees[0]?.days || {}).length;
    const workingDaysPerEmp = r.employees.map(e => Object.values(e.days).filter(d => d === 'W' || d === 'S').length);
    const avgWorkDays = workingDaysPerEmp.length > 0 ? Math.round(workingDaysPerEmp.reduce((a,b) => a+b, 0) / workingDaysPerEmp.length) : 0;
    return { empCount: r.employees.length, avgWorkDays };
  };

  return (
    <div className="p-8 w-full max-w-[1600px] mx-auto pb-24">
      <header className="flex flex-col xl:flex-row xl:items-end justify-between mb-8 gap-6 print:hidden">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Master Training Calendar</h1>
          <p className="text-gray-400">View your hotel's training schedule across all departments.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => setShowTrainerModal(true)} className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2.5 rounded-lg font-semibold flex items-center gap-2 transition-colors border border-gray-700 shadow-lg">
            <UserMinus className="w-5 h-5" /> Trainer Days Off
          </button>
          <button onClick={() => setShowCalUploadModal(true)} className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2.5 rounded-lg font-semibold flex items-center gap-2 transition-colors border border-gray-700 shadow-lg">
            <CalendarDays className="w-5 h-5" /> Import Calendar
          </button>
          <button onClick={openRosterModal} className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2.5 rounded-lg font-semibold flex items-center gap-2 transition-colors border border-gray-700 shadow-lg">
            <Upload className="w-5 h-5" /> Auto-Allocate Roster
          </button>
          {/* NEW Monthly Roster Button */}
          <button onClick={openMonthlyRosterModal} className="bg-gradient-to-r from-brand-gold to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-black px-4 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-all shadow-lg shadow-brand-gold/20">
            <RefreshCw className="w-5 h-5" /> Monthly Roster Sync
          </button>
          <button onClick={() => setShowModal(true)} className="bg-brand-gold hover:bg-brand-goldHover text-black px-4 py-2.5 rounded-lg font-semibold flex items-center gap-2 transition-colors shadow-lg">
            <Plus className="w-5 h-5" /> Add Session
          </button>
        </div>
      </header>

      {/* Calendar Toolbar */}
      <div className="bg-brand-card border border-gray-800 rounded-t-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-4">
          <button onClick={prevMonth} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"><ChevronLeft className="w-6 h-6" /></button>
          <h2 className="text-2xl font-bold text-white w-48 text-center">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"><ChevronRight className="w-6 h-6" /></button>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <select value={calendarFilter} onChange={(e) => setCalendarFilter(e.target.value)} className="bg-gray-900 border border-gray-700 rounded-lg text-white px-4 py-2 focus:outline-none focus:border-brand-gold font-medium">
            <option value="All">All Departments</option>
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      {/* BIG CALENDAR GRID */}
      <div className="grid grid-cols-7 gap-px bg-gray-800 border-x border-b border-gray-800 rounded-b-2xl overflow-hidden shadow-2xl print:border print:shadow-none">
        {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(day => (
          <div key={day} className="bg-[#181818] print:bg-gray-200 p-3 text-center text-sm font-bold text-gray-400 print:text-black">{day}</div>
        ))}
        {[...Array(firstDay - 1)].map((_, i) => <div key={`empty-${i}`} className="bg-brand-card/50 print:bg-white min-h-[140px] p-2"></div>)}
        {[...Array(daysInMonth)].map((_, i) => {
          const day = i + 1;
          const daySessions = getSessionsForDay(day);
          const daysOff = getDaysOffForDay(day);
          const isToday = new Date().getDate() === day && new Date().getMonth() === currentMonth && new Date().getFullYear() === currentYear;
          return (
            <div key={day} className={`bg-brand-card print:bg-white min-h-[140px] p-2 border-t border-gray-800 print:border-gray-300 transition-colors hover:bg-gray-900 ${isToday ? 'ring-2 ring-brand-gold inset-0 z-10 relative' : ''}`}>
              <div className={`text-right text-sm font-bold mb-2 flex justify-between ${isToday ? 'text-brand-gold' : 'text-gray-500'}`}>
                {isToday && <span className="text-xs bg-brand-gold text-black px-1.5 rounded-full font-bold">TODAY</span>}
                <span className="ml-auto">{day}</span>
              </div>
              {daysOff.map((off, idx) => <div key={idx} className="text-xs bg-red-900/30 text-red-400 border border-red-900/50 px-1.5 py-0.5 rounded mb-1 truncate">🚫 {off.trainer_name} Off</div>)}
              {daySessions.slice(0, 3).map((session) => (
                <div key={session.id} onClick={() => openSessionView(session)} className={`text-xs px-2 py-1.5 rounded-md mb-1 cursor-pointer hover:opacity-80 transition-opacity border truncate font-medium ${DEPT_COLORS[session.department] || 'bg-brand-gold/20 text-brand-gold border-brand-gold/30'}`}>
                  {new Date(session.training_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })} · {session.topic}
                </div>
              ))}
              {daySessions.length > 3 && <div className="text-xs text-gray-500 text-center mt-1 font-medium">+{daySessions.length - 3} more</div>}
            </div>
          );
        })}
      </div>

      
      {/* Detailed Training Schedule List */}
      <div className="mt-12 bg-brand-card border border-gray-800 rounded-2xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2"><BookOpen className="text-brand-gold w-6 h-6" /> Detailed Training Schedule</h2>
            <p className="text-gray-400 mt-1">Detailed list view for the selected month and department.</p>
          </div>
          <button onClick={() => window.print()} className="print:hidden bg-gray-800 hover:bg-gray-700 text-white px-5 py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors border border-gray-700">
            <Printer className="w-5 h-5" /> Print Detailed Schedule
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#1a1a1a] border-b border-gray-800 text-gray-400 text-sm uppercase tracking-wider">
                <th className="p-4 font-semibold">Date & Time</th>
                <th className="p-4 font-semibold">Department</th>
                <th className="p-4 font-semibold">Topic</th>
                <th className="p-4 font-semibold">Trainer</th>
                <th className="p-4 font-semibold text-right">Venue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredSchedules.filter(s => new Date(s.training_date).getMonth() === currentMonth && new Date(s.training_date).getFullYear() === currentYear).length === 0 ? (
                <tr><td colSpan="5" className="p-8 text-center text-gray-500">No training sessions scheduled for this month.</td></tr>
              ) : (
                filteredSchedules.filter(s => new Date(s.training_date).getMonth() === currentMonth && new Date(s.training_date).getFullYear() === currentYear)
                .sort((a,b) => new Date(a.training_date) - new Date(b.training_date))
                .map(session => (
                  <tr key={session.id} className="hover:bg-[#1a1a1a] transition-colors">
                    <td className="p-4 text-gray-300 font-medium whitespace-nowrap">
                      {new Date(session.training_date).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${DEPT_COLORS[session.department] || 'bg-brand-gold/20 text-brand-gold border-brand-gold/30'}`}>
                        {session.department}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-white">{session.topic}</td>
                    <td className="p-4 text-gray-400">{session.trainer_name || 'TBD'}</td>
                    <td className="p-4 text-right text-gray-400">{session.venue || 'N/A'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Session View Modal */}
      {viewSessionModal.show && viewSessionModal.session && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 print:hidden" onClick={() => setViewSessionModal({ show: false, session: null, allocations: [] })}>
          <div className="bg-brand-card border border-gray-800 rounded-2xl max-w-lg w-full p-8 relative shadow-2xl" onClick={e => e.stopPropagation()}>
            <button onClick={() => setViewSessionModal({ show: false, session: null, allocations: [] })} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X className="w-6 h-6" /></button>
            <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-4 border ${DEPT_COLORS[viewSessionModal.session.department] || 'bg-brand-gold/20 text-brand-gold border-brand-gold/30'}`}>{viewSessionModal.session.department}</div>
            <h2 className="text-2xl font-bold text-white mb-1">{viewSessionModal.session.topic}</h2>
            <p className="text-brand-gold text-sm font-medium mb-6">{viewSessionModal.session.category}</p>
            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
              <div className="bg-gray-900 rounded-xl p-3"><p className="text-gray-500 text-xs mb-1">Date & Time</p><p className="text-white font-semibold">{new Date(viewSessionModal.session.training_date).toLocaleString()}</p></div>
              <div className="bg-gray-900 rounded-xl p-3"><p className="text-gray-500 text-xs mb-1">Venue</p><p className="text-white font-semibold">{viewSessionModal.session.venue || 'N/A'}</p></div>
              <div className="bg-gray-900 rounded-xl p-3"><p className="text-gray-500 text-xs mb-1">Trainer</p><p className="text-white font-semibold">{viewSessionModal.session.trainer_name || 'TBD'}</p></div>
              <div className="bg-gray-900 rounded-xl p-3"><p className="text-gray-500 text-xs mb-1">Duration</p><p className="text-white font-semibold">{viewSessionModal.session.duration_minutes || 60} mins</p></div>
            </div>
            {viewSessionModal.allocations.length > 0 && (
              <div className="mb-6">
                <h3 className="text-white font-bold mb-3 flex items-center gap-2"><Users className="w-4 h-4 text-brand-gold" /> Allocated Staff ({viewSessionModal.allocations.length})</h3>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {viewSessionModal.allocations.map((emp, i) => <div key={i} className="text-sm text-gray-300 bg-gray-900 px-3 py-2 rounded-lg flex items-center gap-3"><span className="text-gray-500 font-mono text-xs w-14">{emp.emp_no}</span><span>{emp.emp_name}</span></div>)}
                </div>
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={handleSendWhatsApp} className="flex-1 bg-green-700 hover:bg-green-600 text-white py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"><MessageCircle className="w-4 h-4" /> Send WhatsApp</button>
              <button onClick={() => window.print()} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors border border-gray-700"><Printer className="w-4 h-4" /> Print</button>
            </div>
          </div>
        </div>
      )}

      {/* Trainer Days Off Modal */}
      {showTrainerModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 print:hidden">
          <div className="bg-brand-card border border-gray-800 rounded-2xl max-w-lg w-full p-8 relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowTrainerModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X className="w-6 h-6" /></button>
            <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2"><UserMinus className="text-brand-gold" /> Trainer Days Off</h2>
            <p className="text-gray-400 text-sm mb-6">Mark dates when your trainer is unavailable. The auto-scheduler will skip these dates.</p>
            <form onSubmit={handleAddDayOff} className="space-y-4 mb-6">
              <div><label className="block text-sm text-gray-400 mb-1">Trainer Name</label><input required value={newDayOff.trainer_name} onChange={e => setNewDayOff({...newDayOff, trainer_name: e.target.value})} className="w-full bg-[#181818] border border-gray-700 rounded-lg p-2.5 text-white focus:border-brand-gold outline-none" /></div>
              <div><label className="block text-sm text-gray-400 mb-1">Date Off</label><input required type="date" value={newDayOff.date_off} onChange={e => setNewDayOff({...newDayOff, date_off: e.target.value})} className="w-full bg-[#181818] border border-gray-700 rounded-lg p-2.5 text-white focus:border-brand-gold outline-none" style={{ colorScheme: 'dark' }} /></div>
              <button type="submit" className="w-full bg-brand-gold hover:bg-brand-goldHover text-black py-2.5 rounded-lg font-bold">Add Day Off</button>
            </form>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {trainerDaysOff.map(t => (
                <div key={t.id} className="flex items-center justify-between bg-gray-900 rounded-lg px-4 py-2 border border-gray-800">
                  <div><p className="text-white font-medium text-sm">{t.trainer_name}</p><p className="text-gray-500 text-xs">{new Date(t.date_off).toLocaleDateString()}</p></div>
                  <button onClick={() => handleDeleteDayOff(t.id)} className="text-red-400 hover:text-red-300 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
              {trainerDaysOff.length === 0 && <p className="text-gray-600 text-sm text-center py-4">No days off recorded.</p>}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════ */}
      {/* MONTHLY ROSTER SYNC MODAL — NEW FEATURE */}
      {/* ════════════════════════════════════════════════════════════ */}
      {showMonthlyRosterModal && (
        <div className="fixed inset-0 bg-black/90 flex items-start justify-center z-50 p-4 overflow-y-auto print:hidden">
          <div className="bg-brand-card border border-gray-800 rounded-2xl w-full max-w-5xl my-4 relative">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <RefreshCw className="text-brand-gold w-6 h-6" />
                  Monthly Roster Sync
                </h2>
                <p className="text-gray-400 text-sm mt-1">Upload department rosters → auto-schedule trainings based on employee availability</p>
              </div>
              <button onClick={() => setShowMonthlyRosterModal(false)} className="text-gray-400 hover:text-white transition-colors"><X className="w-6 h-6" /></button>
            </div>

            {/* Step Indicator */}
            <div className="flex items-center gap-0 px-6 pt-6">
              {[{n:1,label:'Upload Rosters'},{n:2,label:'Configure'},{n:3,label:'Preview & Save'}].map((s, idx) => (
                <React.Fragment key={s.n}>
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${monthlyRosterStep === s.n ? 'bg-brand-gold text-black' : monthlyRosterStep > s.n ? 'text-green-400' : 'text-gray-500'}`}>
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${monthlyRosterStep === s.n ? 'bg-black/20' : monthlyRosterStep > s.n ? 'bg-green-500 text-white' : 'bg-gray-800 text-gray-500'}`}>
                      {monthlyRosterStep > s.n ? '✓' : s.n}
                    </span>
                    {s.label}
                  </div>
                  {idx < 2 && <div className="flex-1 h-px bg-gray-800 mx-2" />}
                </React.Fragment>
              ))}
            </div>

            <div className="p-6">

              {/* STEP 1: Upload Rosters */}
              {monthlyRosterStep === 1 && (
                <div>
                  {/* CSV Format Guide */}
                  <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 mb-6">
                    <h3 className="text-brand-gold font-bold text-sm mb-2">📋 Required CSV Format</h3>
                    <div className="font-mono text-xs text-gray-300 bg-black/40 rounded-lg p-3 overflow-x-auto">
                      <div className="text-gray-500 mb-1"># Row 1: Header with day numbers</div>
                      <div>EmpNo,Name,01,02,03,04,05,...,31</div>
                      <div>E001,John Smith,6,8,DO,13,22,AL,...</div>
                      <div>E002,Mary Jane,13,DO,6,6,8,13,...</div>
                    </div>
                    <div className="flex gap-4 mt-3 text-xs">
                      <span className="text-green-400 font-bold">W = Working</span>
                      <span className="text-red-400 font-bold">O = Day Off</span>
                      <span className="text-yellow-400 font-bold">L = Leave</span>
                      <span className="text-blue-400 font-bold">H = Holiday</span>
                      <span className="text-purple-400 font-bold">S = Split Shift</span>
                    </div>
                  </div>

                  {/* Department Tabs */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {DEPARTMENTS.map(dept => (
                      <button key={dept} onClick={() => setActiveRosterDept(dept)}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all border ${activeRosterDept === dept ? 'bg-brand-gold text-black border-brand-gold' : monthlyRosters[dept] ? 'bg-green-900/30 text-green-400 border-green-700' : 'bg-gray-900 text-gray-400 border-gray-700 hover:border-gray-500'}`}>
                        {monthlyRosters[dept] ? '✓ ' : ''}{dept}
                      </button>
                    ))}
                  </div>

                  {/* Upload Card for Active Dept */}
                  <div className="bg-gray-900 border border-dashed border-gray-600 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-white font-bold text-lg">{activeRosterDept} Department</h3>
                        {monthlyRosters[activeRosterDept] ? (
                          <p className="text-green-400 text-sm mt-1">
                            ✅ {monthlyRosters[activeRosterDept].employees.length} employees loaded · Avg {getRosterStats(activeRosterDept)?.avgWorkDays} working days/person
                          </p>
                        ) : (
                          <p className="text-gray-500 text-sm mt-1">No roster uploaded yet</p>
                        )}
                      </div>
                      <input type="file" accept=".csv" ref={rosterFileInputRef} onChange={(e) => handleMonthlyRosterUpload(e, activeRosterDept)} className="hidden" />
                      <button onClick={() => rosterFileInputRef.current?.click()} className="bg-brand-gold text-black px-5 py-2.5 rounded-lg font-bold hover:bg-brand-goldHover transition-colors flex items-center gap-2">
                        <Upload className="w-4 h-4" /> Upload CSV
                      </button>
                    </div>

                    {/* Show employee preview */}
                    {monthlyRosters[activeRosterDept] && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-gray-400">
                          <thead><tr className="border-b border-gray-800"><th className="text-left py-2 pr-3">Emp No</th><th className="text-left py-2 pr-3">Name</th><th className="text-center py-2 pr-2 text-green-400">Working Days</th><th className="text-center py-2 text-red-400">Off Days</th></tr></thead>
                          <tbody>
                            {monthlyRosters[activeRosterDept].employees.slice(0, 5).map((e, i) => {
                              const wDays = Object.values(e.days).filter(d => d === 'W' || d === 'S').length;
                              const oDays = Object.values(e.days).filter(d => d === 'O').length;
                              return <tr key={i} className="border-b border-gray-800/50"><td className="py-1.5 pr-3 font-mono">{e.emp_no}</td><td className="py-1.5 pr-3">{e.name}</td><td className="py-1.5 text-center text-green-400 font-bold">{wDays}</td><td className="py-1.5 text-center text-red-400">{oDays}</td></tr>;
                            })}
                            {monthlyRosters[activeRosterDept].employees.length > 5 && <tr><td colSpan={4} className="py-2 text-gray-600 text-center">... and {monthlyRosters[activeRosterDept].employees.length - 5} more employees</td></tr>}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Uploaded summary */}
                  {Object.keys(monthlyRosters).length > 0 && (
                    <div className="mt-4 flex items-center justify-between">
                      <p className="text-gray-400 text-sm">{Object.keys(monthlyRosters).length} department(s) roster uploaded</p>
                      <button onClick={() => setMonthlyRosterStep(2)} className="bg-brand-gold text-black px-6 py-2.5 rounded-xl font-bold hover:bg-brand-goldHover transition-colors flex items-center gap-2">
                        Next: Configure <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 2: Configure Training */}
              {monthlyRosterStep === 2 && (
                <div className="space-y-5">
                  <h3 className="text-white font-bold text-lg mb-4">Training Configuration</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Training Topic *</label>
                      <input required value={rosterTrainingTopic} onChange={e => setRosterTrainingTopic(e.target.value)}
                        placeholder="e.g. Monthly SOP Review, Fire Safety..."
                        className="w-full bg-[#181818] border border-gray-700 rounded-lg p-3 text-white focus:border-brand-gold outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Trainer Name</label>
                      <input value={rosterTrainerName} onChange={e => setRosterTrainerName(e.target.value)}
                        placeholder="e.g. Ms. Priya Silva"
                        className="w-full bg-[#181818] border border-gray-700 rounded-lg p-3 text-white focus:border-brand-gold outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Venue</label>
                      <input value={rosterVenue} onChange={e => setRosterVenue(e.target.value)}
                        className="w-full bg-[#181818] border border-gray-700 rounded-lg p-3 text-white focus:border-brand-gold outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Batch Size (max employees per session)</label>
                      <input type="number" min={1} max={50} value={rosterBatchSize} onChange={e => setRosterBatchSize(e.target.value)}
                        className="w-full bg-[#181818] border border-gray-700 rounded-lg p-3 text-white focus:border-brand-gold outline-none" />
                    </div>
                  </div>

                  <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                    <h4 className="text-brand-gold font-semibold text-sm mb-3">📅 Schedule Logic</h4>
                    <ul className="text-gray-400 text-sm space-y-1.5">
                      <li>• Sessions will be created for each day employees are marked <span className="text-green-400 font-semibold">W (Working)</span></li>
                      <li>• Employees grouped into batches of <strong className="text-white">{rosterBatchSize}</strong> per session</li>
                      <li>• Batch 1 = <strong className="text-white">9:00 AM</strong>, Batch 2 = <strong className="text-white">3:00 PM</strong>, next day continues</li>
                      <li>• Trainer Days Off dates are automatically <span className="text-red-400 font-semibold">skipped</span></li>
                      <li>• All sessions saved to the Master Training Calendar</li>
                    </ul>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setMonthlyRosterStep(1)} className="px-6 py-2.5 rounded-xl border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-colors">← Back</button>
                    <button onClick={generateAutoSchedule} disabled={!rosterTrainingTopic.trim()}
                      className="flex-1 bg-brand-gold text-black py-2.5 rounded-xl font-bold hover:bg-brand-goldHover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5" /> Generate Schedule Preview
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: Preview & Save */}
              {monthlyRosterStep === 3 && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-2xl font-bold text-white flex items-center gap-2"><CheckCircle className="text-green-500 w-7 h-7" /> Schedule Generated</h3>
                      <p className="text-gray-400 mt-1">{autoSchedulePreview.length} training sessions across {Object.keys(monthlyRosters).length} department(s)</p>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => setMonthlyRosterStep(2)} className="px-4 py-2 rounded-lg border border-gray-700 text-gray-400 hover:text-white transition-colors text-sm">← Back</button>
                      <button onClick={handleSaveAutoSchedule} disabled={savingAutoSchedule}
                        className="bg-brand-gold text-black px-6 py-2.5 rounded-xl font-bold hover:bg-brand-goldHover transition-colors shadow-lg flex items-center gap-2">
                        {savingAutoSchedule ? 'Saving...' : <><Save className="w-4 h-4" /> Push to Calendar</>}
                      </button>
                    </div>
                  </div>

                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 text-center">
                      <p className="text-3xl font-bold text-brand-gold">{autoSchedulePreview.length}</p>
                      <p className="text-gray-500 text-sm mt-1">Total Sessions</p>
                    </div>
                    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 text-center">
                      <p className="text-3xl font-bold text-green-400">{autoSchedulePreview.reduce((a,s) => a + s.employees.length, 0)}</p>
                      <p className="text-gray-500 text-sm mt-1">Employee Slots</p>
                    </div>
                    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 text-center">
                      <p className="text-3xl font-bold text-blue-400">{[...new Set(autoSchedulePreview.map(s => s.training_date.split('T')[0]))].length}</p>
                      <p className="text-gray-500 text-sm mt-1">Training Days</p>
                    </div>
                    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 text-center">
                      <p className="text-3xl font-bold text-purple-400">{Object.keys(monthlyRosters).length}</p>
                      <p className="text-gray-500 text-sm mt-1">Departments</p>
                    </div>
                  </div>

                  {/* Session List */}
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    {autoSchedulePreview.map((session, idx) => (
                      <div key={idx} className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b border-gray-800">
                          <div className="flex items-center gap-3">
                            <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${DEPT_COLORS[session.dept] || 'bg-brand-gold/20 text-brand-gold border-brand-gold/30'}`}>{session.dept}</span>
                            <div>
                              <p className="text-white font-semibold">{session.topic}</p>
                              <p className="text-gray-400 text-xs mt-0.5">📅 {session.dateLabel} &nbsp; ⏰ {session.timeLabel} &nbsp; 📍 {session.venue}</p>
                            </div>
                          </div>
                          <span className="text-brand-gold font-bold text-sm bg-brand-gold/10 px-3 py-1 rounded-full">{session.employees.length} staff</span>
                        </div>
                        <div className="p-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5">
                          {session.employees.map((emp, i) => (
                            <div key={i} className="text-xs text-gray-300 flex items-center gap-1.5 bg-[#181818] px-2 py-1.5 rounded border border-gray-800">
                              <span className="text-gray-500 font-mono">{emp.emp_no}</span>
                              <span className="truncate">{emp.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Old Auto-Allocate Roster Modal */}
      {showRosterModal && (
        <div className="fixed inset-0 bg-black/90 flex items-start justify-center z-50 p-4 overflow-y-auto print:hidden">
          <div className="bg-brand-card border border-gray-800 rounded-2xl w-full max-w-4xl my-4 relative p-8">
            <button onClick={() => setShowRosterModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X className="w-6 h-6" /></button>
            <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3"><Users className="text-brand-gold" /> Smart Roster Auto-Allocator</h2>
            <p className="text-gray-400 text-sm mb-6">Upload staff lists (EmpNo, Name CSV) per department. System will batch them into 15-person training slots.</p>

            {rosterStep === 1 && (
              <div>
                <div className="space-y-4 mb-8">
                  {['Rooms', 'Public Area', 'Laundry', 'Flower', 'Stores', 'Coordinator'].map(dept => {
                    const fileRef = React.createRef();
                    return (
                      <div key={dept} className={`bg-gray-900 border rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${pendingRosters[dept] ? 'border-green-700' : 'border-gray-800'}`}>
                        <div>
                          <h4 className={`font-bold ${pendingRosters[dept] ? 'text-green-400' : 'text-white'}`}>{dept} {pendingRosters[dept] ? `✅ (${pendingRosters[dept].length} staff)` : ''}</h4>
                          <p className="text-gray-500 text-xs mt-1">CSV: EmpNo, Name (one per row)</p>
                        </div>
                        <div>
                          <input type="file" accept=".csv" ref={fileRef} onChange={(e) => handleDeptFileUpload(e, dept)} className="hidden" />
                          <button onClick={() => fileRef.current?.click()} className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-semibold border border-gray-700 flex items-center gap-2">
                            <Upload className="w-4 h-4" /> Upload {dept} Roster
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="text-center pt-6 border-t border-gray-800">
                  <button onClick={handleGenerateSchedules} disabled={Object.values(pendingRosters).every(r => r === null)}
                    className={`px-12 py-4 rounded-xl font-bold transition-all shadow-lg text-xl flex items-center justify-center gap-3 mx-auto ${Object.values(pendingRosters).some(r => r !== null) ? 'bg-brand-gold text-black hover:bg-brand-goldHover hover:-translate-y-0.5' : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'}`}>
                    <CalendarDays className="w-6 h-6" /> Generate Schedules
                  </button>
                </div>
              </div>
            )}

            {rosterStep === 2 && allocations.length > 0 && (
              <div>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 border-b border-gray-800 pb-6 gap-4">
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3"><CheckCircle className="text-green-500 w-8 h-8" /> Smart Slots Generated</h2>
                    <p className="text-gray-400">Batched into 9 AM / 3 PM slots. Trainer Days Off were actively skipped.</p>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={handleSaveSmartAllocations} disabled={savingAllocations} className="bg-brand-gold text-black px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-brand-goldHover transition-colors font-bold shadow-lg">
                      {savingAllocations ? 'Saving...' : <><Save className="w-5 h-5" /> Push to Master Calendar</>}
                    </button>
                  </div>
                </div>
                <div className="space-y-6">
                  {allocations.map((session, index) => (
                    <div key={index} className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden shadow-md">
                      <div className="bg-gray-800 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-700 gap-2">
                        <div>
                          <h4 className="font-bold text-white text-lg"><span className="text-brand-gold mr-2">[{session.department}]</span>{session.topic}</h4>
                          <div className="text-sm text-gray-400 mt-1 flex items-center gap-2"><Clock className="w-4 h-4 text-brand-gold"/><span className="font-bold text-white">{new Date(session.training_date).toLocaleString()}</span></div>
                        </div>
                        <span className="text-sm bg-brand-gold/20 text-brand-gold px-3 py-1 rounded-full font-bold">{session.employees.length} Staff</span>
                      </div>
                      <div className="p-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {session.employees.map((emp, i) => (
                          <div key={i} className="text-sm text-gray-300 flex items-center gap-2 bg-[#181818] p-1.5 rounded border border-gray-800">
                            <span className="text-gray-500 font-mono text-xs w-14">{emp.emp_no}</span>
                            <span className="truncate">{emp.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Import Calendar Modal */}
      {showCalUploadModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 print:hidden">
          <div className="bg-brand-card border border-gray-800 rounded-2xl max-w-md w-full p-8 relative">
            <button onClick={() => setShowCalUploadModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X className="w-6 h-6" /></button>
            <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2"><CalendarDays className="text-brand-gold" /> Import Calendar</h2>
            <p className="text-gray-400 text-sm mb-6">Upload a monthly Excel (.xlsx) or CSV schedule for a specific department.</p>
            <div className="space-y-5">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Target Department</label>
                <select value={calUploadDept} onChange={(e) => setCalUploadDept(e.target.value)} className="w-full bg-[#181818] border border-gray-700 rounded-lg p-3 text-white focus:border-brand-gold outline-none">
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="bg-gray-900 border border-dashed border-gray-700 rounded-xl p-6 text-center">
                <p className="text-xs text-gray-500 mb-4 text-left font-mono">Format: Date(YYYY-MM-DD), Time(HH:MM), Topic, Venue, Trainer</p>
                <input type="file" accept=".csv, .xlsx, .xls" ref={calFileInputRef} onChange={handleCalendarUpload} className="hidden" />
                <button onClick={() => calFileInputRef.current?.click()} disabled={uploadingCal} className="bg-brand-gold text-black px-6 py-2.5 rounded-lg font-bold hover:bg-brand-goldHover transition-colors w-full">
                  {uploadingCal ? 'Uploading...' : 'Select CSV File'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Session Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 print:hidden">
          <div className="bg-brand-card border border-gray-800 rounded-xl max-w-md w-full p-6 relative">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            <h2 className="text-xl font-bold text-white mb-6">Schedule New Training</h2>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div><label className="block text-sm text-gray-400 mb-1">Topic</label><input required type="text" value={formData.topic} onChange={(e) => setFormData({...formData, topic: e.target.value})} className="w-full bg-[#181818] border border-gray-700 rounded-lg p-2.5 text-white focus:border-brand-gold outline-none" /></div>
              <div><label className="block text-sm text-gray-400 mb-1">Department</label>
                <select required value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})} className="w-full bg-[#181818] border border-gray-700 rounded-lg p-2.5 text-white focus:border-brand-gold outline-none">
                  <option value="">Select Department</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div><label className="block text-sm text-gray-400 mb-1">Category</label>
                <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full bg-[#181818] border border-gray-700 rounded-lg p-2.5 text-white focus:border-brand-gold outline-none">
                  <option>Mandatory</option><option>OJT</option><option>SOP</option><option>Hotel HR</option>
                </select>
              </div>
              <div><label className="block text-sm text-gray-400 mb-1">Trainer</label><input type="text" value={formData.trainer} onChange={(e) => setFormData({...formData, trainer: e.target.value})} placeholder="TBD" className="w-full bg-[#181818] border border-gray-700 rounded-lg p-2.5 text-white focus:border-brand-gold outline-none" /></div>
              <div><label className="block text-sm text-gray-400 mb-1">Venue</label><input type="text" value={formData.venue} onChange={(e) => setFormData({...formData, venue: e.target.value})} placeholder="Main Room" className="w-full bg-[#181818] border border-gray-700 rounded-lg p-2.5 text-white focus:border-brand-gold outline-none" /></div>
              <div><label className="block text-sm text-gray-400 mb-1">Date & Time</label><input required type="datetime-local" value={formData.training_date} onChange={(e) => setFormData({...formData, training_date: e.target.value})} className="w-full bg-[#181818] border border-gray-700 rounded-lg p-2.5 text-white focus:border-brand-gold outline-none" style={{ colorScheme: 'dark' }} /></div>
              <div className="pt-4"><button type="submit" className="w-full bg-brand-gold hover:bg-brand-goldHover text-black py-2.5 rounded-lg font-bold transition-colors">Save Session</button></div>
            </form>
          </div>
        </div>
      )}

      {/* QR Modal */}
      {qrModal.show && qrModal.session && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 print:hidden">
          <div className="bg-brand-card border border-gray-800 rounded-2xl max-w-sm w-full p-8 relative flex flex-col items-center text-center shadow-2xl">
            <button onClick={() => setQrModal({ show: false, session: null })} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"><X className="w-6 h-6" /></button>
            <h2 className="text-2xl font-bold text-white mb-2">{qrModal.session.topic}</h2>
            <p className="text-brand-gold text-sm font-medium mb-6 uppercase tracking-widest">Attendance QR Portal</p>
            <div className="bg-white p-4 rounded-xl shadow-inner mb-6">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=http://localhost:5173/%23/attendance/${qrModal.session.id}`} alt="QR Code" className="w-48 h-48" />
            </div>
            <button onClick={() => window.print()} className="w-full bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-lg font-bold transition-colors border border-gray-700 flex items-center justify-center gap-2"><Printer className="w-4 h-4" /> Print QR Poster</button>
          </div>
        </div>
      )}
    </div>
  );
}
