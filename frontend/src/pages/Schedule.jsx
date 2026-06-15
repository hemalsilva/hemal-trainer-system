import * as XLSX from 'xlsx';
import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Calendar as CalendarIcon, Clock, MapPin, Users, ChevronLeft, ChevronRight, Plus, X, Upload, Printer, CheckCircle, Save, CalendarDays, Filter, UserMinus, Trash2, MessageCircle, BookOpen, RefreshCw, Edit3 } from 'lucide-react';

const DEPARTMENTS = ['All Staff', 'Rooms', 'Public Area', 'Laundry', 'Flower', 'Stores', 'Coordinator', 'Hotel School', 'Cinnamon Hotel Academy', 'General'];

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
  const [isEditingSession, setIsEditingSession] = useState(false);
  const [editSessionData, setEditSessionData] = useState({});

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
  const [allocConfig, setAllocConfig] = useState({ frequency: 'Daily', startDate: '', endDate: '' });

  // ── NEW: Monthly Roster & Sync State ──
  const [showMonthlyRosterModal, setShowMonthlyRosterModal] = useState(false);
  const [monthlyRosters, setMonthlyRosters] = useState({}); // { 'Rooms': { month, year, employees: [{emp_no, name, days:{1:'W',2:'O',...}}] } }
  const [rosterBatchSize, setRosterBatchSize] = useState(15);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncPreview, setSyncPreview] = useState([]);
  const [savingSync, setSavingSync] = useState(false);
  const rosterFileInputRef = useRef(null);
  const [activeRosterDept, setActiveRosterDept] = useState('Rooms');

  const fetchSchedules = async () => {
    try {
      const res = await axios.get(`/api/trainings?t=${Date.now()}&t=${Date.now()}`);
      setSchedules(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchTrainerDaysOff = async () => {
    try {
      const res = await axios.get(`/api/trainings/trainer/days-off?t=${Date.now()}&t=${Date.now()}`);
      setTrainerDaysOff(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchSchedules(); fetchTrainerDaysOff(); const interval = setInterval(() => { fetchSchedules(); fetchTrainerDaysOff(); }, 5000); return () => clearInterval(interval); }, []);

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
      await axios.post('/api/trainings', payload);
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
      await axios.post('/api/trainings/trainer/days-off', newDayOff);
      setNewDayOff({ trainer_name: '', date_off: '' });
      fetchTrainerDaysOff();
    } catch (err) { alert('Failed to add day off'); }
  };
  const handleDeleteDayOff = async (id) => {
    try {
      await axios.delete(`/api/trainings/trainer/days-off/${id}`);
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
      const res = await axios.get(`/api/trainings/${session.id}/allocations?t=${Date.now()}`);
      setViewSessionModal({ show: true, session, allocations: res.data });
    } catch (err) { alert('Failed to load allocated employees'); }
  };
  
  const handleEditClick = async (session) => {
    try {
      const res = await axios.get(`/api/trainings/${session.id}/allocations?t=${Date.now()}`);
      setViewSessionModal({ show: true, session, allocations: res.data });
      setEditSessionData(session);
      setIsEditingSession(true);
    } catch (err) { alert('Failed to load session'); }
  };

  const handleDeleteSession = async (id) => {
    if (window.confirm('Are you sure you want to delete this training session? This will also remove any staff allocations to this session.')) {
      try {
        await axios.delete(`/api/trainings/${id}`);
        fetchSchedules();
      } catch (err) {
        alert('Error deleting session: ' + err.message);
      }
    }
  };

  const handleUpdateSession = async () => {
    try {
      const payload = {
        ...editSessionData,
        duration: editSessionData.duration_minutes,
        trainer: editSessionData.trainer_name,
        status: editSessionData.status || 'TBS'
      };
      await axios.put(`/api/trainings/${editSessionData.id}`, payload);
      setViewSessionModal(prev => ({ ...prev, session: { ...prev.session, ...payload, duration_minutes: payload.duration, trainer_name: payload.trainer } }));
      setIsEditingSession(false);
      fetchSchedules();
      alert('Session updated successfully!');
    } catch (err) {
      alert('Error updating session: ' + err.message);
    }
  };
  
  const handleSendWhatsApp = async () => {
    const phone = prompt("Enter WhatsApp number (with country code, e.g. 94771234567):");
    if (!phone) return;
    try {
      const message = `*HK TRAINING PORTAL*\n\nHello! You have been allocated to a mandatory training session.\n\n*Topic:* ${viewSessionModal.session.topic}\n*Date:* ${new Date(viewSessionModal.session.training_date).toLocaleString()}\n*Venue:* ${viewSessionModal.session.venue}\n*Trainer:* ${viewSessionModal.session.trainer_name}\n\nPlease ensure you attend on time!`;
      await axios.post('/api/whatsapp/send', { phone, message });
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

      await axios.post('/api/trainings/upload', data);
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
      for (const id of idsToDelete) await axios.delete(`/api/trainings/${id}`);
      const promises = allocations.map(async (session) => {
        const res = await axios.post('/api/trainings', { topic: session.topic, category: 'Mandatory', venue: session.venue, duration: 120, trainer: session.trainer, training_date: session.training_date, department: session.department });
        await axios.post(`/api/trainings/${res.data.id}/allocations`, { employees: session.employees });
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
    setAllocConfig({ frequency: 'Daily', startDate: '', endDate: '' });
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

  const handleGenerateAllocations = async () => {
    const uploadedDepts = Object.keys(monthlyRosters);
    if (uploadedDepts.length === 0) {
      alert('Please upload at least one department roster first.');
      return;
    }

    // Fetch past allocations to prevent duplicates
    let pastAllocations = [];
    try {
      const res = await axios.get(`/api/trainings/allocations/all?t=${Date.now()}&t=${Date.now()}`);
      pastAllocations = res.data;
    } catch(e) { console.error('Failed to fetch allocations for dup check'); }

    // Create a Set of "empNo-topic"
    const allocatedSet = new Set(pastAllocations.map(a => a.emp_no + '-' + a.topic));

    const preview = [];
    
    // Look at all sessions in the current month
    const currentMonthSessions = filteredSchedules.filter(s => new Date(s.training_date).getMonth() === currentMonth && new Date(s.training_date).getFullYear() === currentYear);

    currentMonthSessions.forEach(session => {
      const dateObj = new Date(session.training_date);
      const day = dateObj.getDate();
      const hour = dateObj.getHours();

      if (isDayOff(dateObj)) return;

      const requiredShift = hour < 12 ? '8' : '13';
      let eligibleEmps = [];

      // Support "All Staff"
      if (session.department === 'All Staff') {
        uploadedDepts.forEach(dept => {
          const roster = monthlyRosters[dept];
          if (roster && roster.employees) {
            eligibleEmps.push(...roster.employees.filter(emp => String(emp.days[day]).trim() === requiredShift));
          }
        });
      } else {
        const roster = monthlyRosters[session.department];
        if (!roster) return; // No roster for this dept, skip
        eligibleEmps = roster.employees.filter(emp => String(emp.days[day]).trim() === requiredShift);
      }

      // Filter out those who already took this topic
      eligibleEmps = eligibleEmps.filter(emp => !allocatedSet.has(emp.emp_no + '-' + session.topic));

      if (eligibleEmps.length > 0) {
        // Cap to rosterBatchSize
        const batch = eligibleEmps.slice(0, parseInt(rosterBatchSize) || 15);
        // Add them to allocatedSet so we don't pick them again for the same topic in another session this generation loop
        batch.forEach(emp => allocatedSet.add(emp.emp_no + '-' + session.topic));

        preview.push({
          session, // The master session object
          employees: batch,
          dept: session.department,
          topic: session.topic,
          dateLabel: dateObj.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' }),
          timeLabel: dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        });
      }
    });

    if (preview.length === 0) {
      alert('No eligible staff found for the scheduled sessions. Please check the rosters and the Master Calendar.');
      return;
    }

    setSyncPreview(preview);
    setShowSyncModal(true);
  };


  const downloadAllocationsExcel = () => {
    let csv = 'Topic,Department,Date,Time,Emp No,Emp Name\n';
    syncPreview.forEach(item => {
      item.employees.forEach(emp => {
        csv += `"${item.topic}","${item.dept}","${item.dateLabel}","${item.timeLabel}","${emp.emp_no}","${emp.name}"\n`;
      });
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Allocations.csv';
    a.click();
  };

  const downloadDetailedScheduleExcel = () => {
    let csv = 'Date & Time,Department,Topic,Trainer,Venue\n';
    filteredSchedules.forEach(s => {
      csv += `"${new Date(s.training_date).toLocaleString()}","${s.department}","${s.topic}","${s.trainer_name}","${s.venue}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Detailed_Schedule.csv';
    a.click();
  };

  const handleSaveSync = async () => {
    setSavingSync(true);
    try {
      let saved = 0;
      for (const item of syncPreview) {
        if (item.employees.length > 0) {
          await axios.post(`/api/trainings/${item.session.id}/allocations`, {
            employees: item.employees.map(e => ({ emp_no: e.emp_no, name: e.name })),
          });
          saved++;
        }
      }
      alert(`✅ Staff allocated successfully to ${saved} sessions!`);
      setShowSyncModal(false);
      setSyncPreview([]);
      fetchSchedules();
    } catch (err) {
      console.error(err);
      alert('Failed to save allocations: ' + (err?.response?.data?.error || err.message));
    } finally {
      setSavingSync(false);
    }
  };

  const openMonthlyRosterModal = () => {
    setMonthlyRosters({});
    setRosterBatchSize(15);
    setActiveRosterDept('Rooms');
    setShowMonthlyRosterModal(true);
  };

  // Get roster summary stats
  const getRosterStats = (dept) => {
    const r = monthlyRosters[dept];
    if (!r) return null;
    const totalDays = Object.values(r.employees[0]?.days || {}).length;
    const workingDaysPerEmp = r.employees.map(e => Object.values(e.days).filter(d => String(d).trim() === '8' || String(d).trim() === '13').length);
    const avgWorkDays = workingDaysPerEmp.length > 0 ? Math.round(workingDaysPerEmp.reduce((a,b) => a+b, 0) / workingDaysPerEmp.length) : 0;
    return { empCount: r.employees.length, avgWorkDays };
  };

  return (
    <div className="p-8 w-full max-w-[1600px] mx-auto pb-24">
      <header className="flex flex-col xl:flex-row xl:items-end justify-between mb-8 gap-6 print:hidden">
        <div>
          <h1 className="text-3xl font-bold text-blue-200 mb-2 tracking-tight">Master Training Calendar</h1>
          <p className="text-gray-400">View your hotel's training schedule across all departments.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => setShowTrainerModal(true)} className="bg-gray-800 hover:bg-gray-700 text-blue-200 px-4 py-2.5 rounded-lg font-semibold flex items-center gap-2 transition-colors border border-gray-700 shadow-lg">
            <UserMinus className="w-5 h-5" /> Trainer Days Off
          </button>
          <button onClick={() => setShowCalUploadModal(true)} className="bg-gray-800 hover:bg-gray-700 text-blue-200 px-4 py-2.5 rounded-lg font-semibold flex items-center gap-2 transition-colors border border-gray-700 shadow-lg">
            <CalendarDays className="w-5 h-5" /> Import Calendar
          </button>
          <button onClick={openRosterModal} className="bg-gray-800 hover:bg-gray-700 text-blue-200 px-4 py-2.5 rounded-lg font-semibold flex items-center gap-2 transition-colors border border-gray-700 shadow-lg">
            <Upload className="w-5 h-5" /> Daily Staff Allocation
          </button>
          {/* NEW Monthly Roster Button */}
          <button onClick={openMonthlyRosterModal} className="bg-gray-800 hover:bg-gray-700 text-blue-200 px-4 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-all shadow-lg border border-gray-700">
            <Upload className="w-5 h-5" /> Upload Rosters
          </button>
          <button onClick={handleGenerateAllocations} className="bg-gradient-to-r from-brand-primary to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-black px-4 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-all shadow-lg shadow-brand-primary/20">
            <RefreshCw className="w-5 h-5" /> Generate Allocations
          </button>
          <button onClick={() => setShowModal(true)} className="bg-brand-primary hover:bg-brand-primaryHover text-black px-4 py-2.5 rounded-lg font-semibold flex items-center gap-2 transition-colors shadow-lg">
            <Plus className="w-5 h-5" /> Add Session
          </button>
        </div>
      </header>

      {/* Calendar Toolbar */}
      <div className="bg-brand-card border border-gray-800 rounded-t-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-4">
          <button onClick={prevMonth} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-blue-200 transition-colors"><ChevronLeft className="w-6 h-6" /></button>
          <h2 className="text-2xl font-bold text-blue-200 w-48 text-center">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-blue-200 transition-colors"><ChevronRight className="w-6 h-6" /></button>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <select value={calendarFilter} onChange={(e) => setCalendarFilter(e.target.value)} className="bg-gray-900 border border-gray-700 rounded-lg text-blue-200 px-4 py-2 focus:outline-none focus:border-brand-primary font-medium">
            <option value="All">All Departments</option>
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      {/* BIG CALENDAR GRID */}\n      
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
            <div key={day} className={`bg-brand-card print:bg-white min-h-[140px] p-2 border-t border-gray-800 print:border-gray-300 transition-colors hover:bg-gray-900 ${isToday ? 'ring-2 ring-brand-primary inset-0 z-10 relative' : ''}`}>
              <div className={`text-right text-sm font-bold mb-2 flex justify-between ${isToday ? 'text-brand-primary' : 'text-gray-500'}`}>
                {isToday && <span className="text-xs bg-brand-primary text-black px-1.5 rounded-full font-bold">TODAY</span>}
                <span className="ml-auto">{day}</span>
              </div>
              {daysOff.map((off, idx) => <div key={idx} className="text-xs bg-red-900/30 text-red-400 border border-red-900/50 px-1.5 py-0.5 rounded mb-1 truncate">🚫 {off.trainer_name} Off</div>)}
              {daySessions.slice(0, 3).map((session) => (
                <div key={session.id} onClick={() => openSessionView(session)} className={`text-xs px-2 py-1.5 rounded-md mb-1 cursor-pointer hover:opacity-80 transition-opacity border truncate font-medium ${DEPT_COLORS[session.department] || 'bg-brand-primary/20 text-brand-primary border-brand-primary/30'}`}>
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
            <h2 className="text-2xl font-bold text-blue-200 flex items-center gap-2"><BookOpen className="text-brand-primary w-6 h-6" /> Detailed Training Schedule</h2>
            <p className="text-gray-400 mt-1">Detailed list view for the selected month and department.</p>
          </div>
          <button onClick={() => window.print()} className="print:hidden bg-gray-800 hover:bg-gray-700 text-blue-200 px-5 py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors border border-gray-700">
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
                <th className="p-4 font-semibold">Venue</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredSchedules.filter(s => new Date(s.training_date).getMonth() === currentMonth && new Date(s.training_date).getFullYear() === currentYear).length === 0 ? (
                <tr><td colSpan="6" className="p-8 text-center text-gray-500">No training sessions scheduled for this month.</td></tr>
              ) : (
                filteredSchedules.filter(s => new Date(s.training_date).getMonth() === currentMonth && new Date(s.training_date).getFullYear() === currentYear)
                .sort((a,b) => new Date(a.training_date) - new Date(b.training_date))
                .map(session => (
                  <tr key={session.id} className="hover:bg-[#1a1a1a] transition-colors">
                    <td className="p-4 text-gray-300 font-medium whitespace-nowrap">
                      {new Date(session.training_date).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${DEPT_COLORS[session.department] || 'bg-brand-primary/20 text-brand-primary border-brand-primary/30'}`}>
                        {session.department}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-blue-200">{session.topic}</td>
                    <td className="p-4 text-gray-400">{session.trainer_name || 'TBD'}</td>
                    <td className="p-4 text-gray-400">{session.venue || 'N/A'}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold border ${session.status === 'Completed' ? 'bg-green-900/30 text-green-400 border-green-700' : session.status === 'On Going' ? 'bg-blue-900/30 text-blue-400 border-blue-700' : 'bg-gray-800 text-gray-400 border-gray-600'}`}>
                        {session.status || 'TBS'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={(e) => { e.stopPropagation(); handleEditClick(session); }} className="text-gray-500 hover:text-brand-primary p-1.5 rounded bg-gray-800/50 hover:bg-gray-800 transition-colors" title="Edit">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteSession(session.id); }} className="text-gray-500 hover:text-red-500 p-1.5 rounded bg-gray-800/50 hover:bg-red-500/10 transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Session View Modal */}
      {viewSessionModal.show && viewSessionModal.session && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 print:hidden" onClick={() => { setViewSessionModal({ show: false, session: null, allocations: [] }); setIsEditingSession(false); }}>
          <div className="bg-brand-card border border-gray-800 rounded-2xl max-w-lg w-full p-8 relative shadow-2xl" onClick={e => e.stopPropagation()}>
            <button onClick={() => { setViewSessionModal({ show: false, session: null, allocations: [] }); setIsEditingSession(false); }} className="absolute top-4 right-4 text-gray-400 hover:text-blue-200"><X className="w-6 h-6" /></button>
            <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-4 border ${DEPT_COLORS[viewSessionModal.session.department] || 'bg-brand-primary/20 text-brand-primary border-brand-primary/30'}`}>{viewSessionModal.session.department}</div>
            
            {isEditingSession ? (
              <>
                <input required list="edit-topics-list" value={editSessionData.topic} onChange={e => setEditSessionData({...editSessionData, topic: e.target.value})} className="w-full bg-[#181818] border border-gray-700 rounded-lg p-2 text-blue-200 text-2xl font-bold mb-2 focus:border-brand-primary outline-none" />
                <datalist id="edit-topics-list">{[...new Set(schedules.filter(s => !editSessionData.department || s.department === editSessionData.department || s.department === 'All Staff').map(s => s.topic))].sort().map((t, i) => <option key={i} value={t} />)}</datalist>
              </>
            ) : (
              <h2 className="text-2xl font-bold text-blue-200 mb-1 flex items-center justify-between">
                <span>{viewSessionModal.session.topic}</span>
                <button onClick={() => {setIsEditingSession(true); setEditSessionData(viewSessionModal.session);}} className="text-gray-500 hover:text-brand-primary p-2 rounded-lg hover:bg-gray-800 transition-colors" title="Edit Session"><Edit3 className="w-5 h-5"/></button>
              </h2>
            )}

            <p className="text-brand-primary text-sm font-medium mb-6">{viewSessionModal.session.category}</p>
            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
              <div className="bg-gray-900 rounded-xl p-3">
                <p className="text-gray-500 text-xs mb-1">Date & Time</p>
                {isEditingSession ? (
                  <input type="datetime-local" value={editSessionData.training_date ? new Date(new Date(editSessionData.training_date).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0,16) : ''} onChange={e => setEditSessionData({...editSessionData, training_date: new Date(e.target.value).toISOString()})} className="w-full bg-[#181818] text-blue-200 p-1 rounded border border-gray-700 outline-none focus:border-brand-primary" style={{ colorScheme: 'dark' }} />
                ) : (
                  <p className="text-blue-200 font-semibold">{new Date(viewSessionModal.session.training_date).toLocaleString()}</p>
                )}
              </div>
              <div className="bg-gray-900 rounded-xl p-3">
                <p className="text-gray-500 text-xs mb-1">Venue</p>
                {isEditingSession ? (
                  <input value={editSessionData.venue} onChange={e => setEditSessionData({...editSessionData, venue: e.target.value})} className="w-full bg-[#181818] text-blue-200 p-1 rounded border border-gray-700 outline-none focus:border-brand-primary" />
                ) : (
                  <p className="text-blue-200 font-semibold">{viewSessionModal.session.venue || 'N/A'}</p>
                )}
              </div>
              <div className="bg-gray-900 rounded-xl p-3">
                <p className="text-gray-500 text-xs mb-1">Status</p>
                {isEditingSession ? (
                  <select value={editSessionData.status || 'TBS'} onChange={e => setEditSessionData({...editSessionData, status: e.target.value})} className="w-full bg-[#181818] text-blue-200 p-1 rounded border border-gray-700 outline-none focus:border-brand-primary">
                    <option value="TBS">TBS</option>
                    <option value="On Going">On Going</option>
                    <option value="Completed">Completed</option>
                  </select>
                ) : (
                  <p className="text-blue-200 font-semibold">{viewSessionModal.session.status || 'TBS'}</p>
                )}
              </div>
              <div className="bg-gray-900 rounded-xl p-3">
                <p className="text-gray-500 text-xs mb-1">Trainer</p>
                {isEditingSession ? (
                  <input value={editSessionData.trainer_name} onChange={e => setEditSessionData({...editSessionData, trainer_name: e.target.value})} className="w-full bg-[#181818] text-blue-200 p-1 rounded border border-gray-700 outline-none focus:border-brand-primary" />
                ) : (
                  <p className="text-blue-200 font-semibold">{viewSessionModal.session.trainer_name || 'TBD'}</p>
                )}
              </div>
              <div className="bg-gray-900 rounded-xl p-3">
                <p className="text-gray-500 text-xs mb-1">Duration</p>
                {isEditingSession ? (
                  <select value={editSessionData.duration_minutes} onChange={e => setEditSessionData({...editSessionData, duration_minutes: e.target.value})} className="w-full bg-[#181818] text-blue-200 p-1 rounded border border-gray-700 outline-none focus:border-brand-primary"><option value="30">30 mins</option><option value="60">1 Hour</option><option value="90">1.5 Hours</option><option value="120">2 Hours</option><option value="180">3 Hours</option><option value="240">4 Hours</option></select>
                ) : (
                  <p className="text-blue-200 font-semibold">{viewSessionModal.session.duration_minutes || 60} mins</p>
                )}
              </div>
            </div>
            {viewSessionModal.allocations.length > 0 && (
              <div className="mb-6">
                <h3 className="text-blue-200 font-bold mb-3 flex items-center gap-2"><Users className="w-4 h-4 text-brand-primary" /> Allocated Staff ({viewSessionModal.allocations.length})</h3>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {viewSessionModal.allocations.map((emp, i) => <div key={i} className="text-sm text-gray-300 bg-gray-900 px-3 py-2 rounded-lg flex items-center gap-3"><span className="text-gray-500 font-mono text-xs w-14">{emp.emp_no}</span><span>{emp.emp_name}</span></div>)}
                </div>
              </div>
            )}
            <div className="flex gap-3">
              {isEditingSession ? (
                <>
                  <button onClick={() => setIsEditingSession(false)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-blue-200 py-2.5 rounded-lg font-bold transition-colors">Cancel</button>
                  <button onClick={handleUpdateSession} className="flex-1 bg-brand-primary hover:bg-brand-primaryHover text-black py-2.5 rounded-lg font-bold transition-colors shadow-lg">Save Changes</button>
                </>
              ) : (
                <>
                  <button onClick={handleSendWhatsApp} className="flex-1 bg-green-700 hover:bg-green-600 text-blue-200 py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"><MessageCircle className="w-4 h-4" /> Send WhatsApp</button>
                  <button onClick={() => window.print()} className="flex-1 bg-gray-800 hover:bg-gray-700 text-blue-200 py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors border border-gray-700"><Printer className="w-4 h-4" /> Print</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Trainer Days Off Modal */}
      {showTrainerModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 print:hidden">
          <div className="bg-brand-card border border-gray-800 rounded-2xl max-w-lg w-full p-8 relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowTrainerModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-blue-200"><X className="w-6 h-6" /></button>
            <h2 className="text-2xl font-bold text-blue-200 mb-2 flex items-center gap-2"><UserMinus className="text-brand-primary" /> Trainer Days Off</h2>
            <p className="text-gray-400 text-sm mb-6">Mark dates when your trainer is unavailable. The auto-scheduler will skip these dates.</p>
            <form onSubmit={handleAddDayOff} className="space-y-4 mb-6">
              <div><label className="block text-sm text-gray-400 mb-1">Trainer Name</label><input required value={newDayOff.trainer_name} onChange={e => setNewDayOff({...newDayOff, trainer_name: e.target.value})} className="w-full bg-[#181818] border border-gray-700 rounded-lg p-2.5 text-blue-200 focus:border-brand-primary outline-none" /></div>
              <div><label className="block text-sm text-gray-400 mb-1">Date Off</label><input required type="date" value={newDayOff.date_off} onChange={e => setNewDayOff({...newDayOff, date_off: e.target.value})} className="w-full bg-[#181818] border border-gray-700 rounded-lg p-2.5 text-blue-200 focus:border-brand-primary outline-none" style={{ colorScheme: 'dark' }} /></div>
              <button type="submit" className="w-full bg-brand-primary hover:bg-brand-primaryHover text-black py-2.5 rounded-lg font-bold">Add Day Off</button>
            </form>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {trainerDaysOff.map(t => (
                <div key={t.id} className="flex items-center justify-between bg-gray-900 rounded-lg px-4 py-2 border border-gray-800">
                  <div><p className="text-blue-200 font-medium text-sm">{t.trainer_name}</p><p className="text-gray-500 text-xs">{new Date(t.date_off).toLocaleDateString()}</p></div>
                  <button onClick={() => handleDeleteDayOff(t.id)} className="text-red-400 hover:text-red-300 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
              {trainerDaysOff.length === 0 && <p className="text-gray-600 text-sm text-center py-4">No days off recorded.</p>}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════ */}
      {/* MONTHLY ROSTER UPLOAD MODAL */}
      {/* ════════════════════════════════════════════════════════════ */}
      {showMonthlyRosterModal && (
        <div className="fixed inset-0 bg-black/90 flex items-start justify-center z-50 p-4 overflow-y-auto print:hidden">
          <div className="bg-brand-card border border-gray-800 rounded-2xl w-full max-w-5xl my-4 relative">
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <div>
                <h2 className="text-2xl font-bold text-blue-200 flex items-center gap-3">
                  <Upload className="text-brand-primary w-6 h-6" />
                  Upload Department Rosters
                </h2>
                <p className="text-gray-400 text-sm mt-1">Upload rosters to sync with the Master Calendar.</p>
              </div>
              <button onClick={() => setShowMonthlyRosterModal(false)} className="text-gray-400 hover:text-blue-200 transition-colors"><X className="w-6 h-6" /></button>
            </div>

            <div className="p-6">
              {/* CSV Format Guide */}
              <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 mb-6">
                <h3 className="text-brand-primary font-bold text-sm mb-2">📋 Required CSV Format</h3>
                <div className="font-mono text-xs text-gray-300 bg-black/40 rounded-lg p-3 overflow-x-auto">
                  <div className="text-gray-500 mb-1"># Row 1: Header with day numbers</div>
                  <div>EmpNo,Name,01,02,03,04,05,...,31</div>
                  <div>E001,John Smith,6,8,DO,13,22,AL,...</div>
                  <div>E002,Mary Jane,13,DO,6,6,8,13,...</div>
                </div>
                <div className="flex gap-4 mt-3 text-xs">
                  <span className="text-green-400 font-bold">8 = Morning Shift</span>
                  <span className="text-blue-400 font-bold">13 = Afternoon Shift</span>
                  <span className="text-red-400 font-bold">O = Day Off</span>
                </div>
              </div>

              <div className="flex items-center gap-4 mb-4 bg-gray-900/50 p-3 rounded-xl border border-gray-800">
                <label className="text-sm text-gray-400">Batch Size Limit (Staff per session)</label>
                <input type="number" min={1} max={100} value={rosterBatchSize} onChange={e => setRosterBatchSize(e.target.value)} className="w-24 bg-[#181818] border border-gray-700 rounded-lg p-2 text-blue-200 focus:border-brand-primary outline-none text-center" />
              </div>

              {/* Department Tabs */}
              <div className="flex flex-wrap gap-2 mb-4">
                {DEPARTMENTS.map(dept => (
                  <button key={dept} onClick={() => setActiveRosterDept(dept)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all border ${activeRosterDept === dept ? 'bg-brand-primary text-black border-brand-primary' : monthlyRosters[dept] ? 'bg-green-900/30 text-green-400 border-green-700' : 'bg-gray-900 text-gray-400 border-gray-700 hover:border-gray-500'}`}>
                    {monthlyRosters[dept] ? '✓ ' : ''}{dept}
                  </button>
                ))}
              </div>

              {/* Upload Card for Active Dept */}
              <div className="bg-gray-900 border border-dashed border-gray-600 rounded-xl p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-blue-200 font-bold text-lg">{activeRosterDept} Department</h3>
                    {monthlyRosters[activeRosterDept] ? (
                      <p className="text-green-400 text-sm mt-1">
                        ✅ {monthlyRosters[activeRosterDept].employees.length} employees loaded · Avg {getRosterStats(activeRosterDept)?.avgWorkDays} working days/person
                      </p>
                    ) : (
                      <p className="text-gray-500 text-sm mt-1">No roster uploaded yet</p>
                    )}
                  </div>
                  <input type="file" accept=".csv" ref={rosterFileInputRef} onChange={(e) => handleMonthlyRosterUpload(e, activeRosterDept)} className="hidden" />
                  <button onClick={() => rosterFileInputRef.current?.click()} className="bg-brand-primary text-black px-5 py-2.5 rounded-lg font-bold hover:bg-brand-primaryHover transition-colors flex items-center gap-2">
                    <Upload className="w-4 h-4" /> Upload CSV
                  </button>
                </div>

                {monthlyRosters[activeRosterDept] && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-gray-400">
                      <thead><tr className="border-b border-gray-800"><th className="text-left py-2 pr-3">Emp No</th><th className="text-left py-2 pr-3">Name</th><th className="text-center py-2 pr-2 text-green-400">Working Days</th><th className="text-center py-2 text-red-400">Off Days</th></tr></thead>
                      <tbody>
                        {monthlyRosters[activeRosterDept].employees.slice(0, 5).map((e, i) => {
                          const wDays = Object.values(e.days).filter(d => String(d).trim() === '8' || String(d).trim() === '13').length;
                          const oDays = Object.values(e.days).filter(d => d === 'O').length;
                          return <tr key={i} className="border-b border-gray-800/50"><td className="py-1.5 pr-3 font-mono">{e.emp_no}</td><td className="py-1.5 pr-3">{e.name}</td><td className="py-1.5 text-center text-green-400 font-bold">{wDays}</td><td className="py-1.5 text-center text-red-400">{oDays}</td></tr>;
                        })}
                        {monthlyRosters[activeRosterDept].employees.length > 5 && <tr><td colSpan={4} className="py-2 text-gray-600 text-center">... and {monthlyRosters[activeRosterDept].employees.length - 5} more employees</td></tr>}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end pt-4 border-t border-gray-800">
                 <button onClick={() => setShowMonthlyRosterModal(false)} className="bg-brand-primary text-black px-8 py-2.5 rounded-xl font-bold hover:bg-brand-primaryHover transition-colors">Done</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════ */}
      {/* SYNC CALENDAR / GENERATE ALLOCATIONS PREVIEW MODAL */}
      {/* ════════════════════════════════════════════════════════════ */}
      {showSyncModal && (
        <div className="fixed inset-0 bg-black/90 flex items-start justify-center z-50 p-4 overflow-y-auto print:hidden">
          <div className="bg-brand-card border border-gray-800 rounded-2xl w-full max-w-5xl my-4 relative">
             <div className="flex items-center justify-between p-6 border-b border-gray-800">
                <div>
                  <h3 className="text-2xl font-bold text-blue-200 flex items-center gap-2"><CheckCircle className="text-green-500 w-7 h-7" /> Allocations Generated</h3>
                  <p className="text-gray-400 mt-1">Found staff for {syncPreview.length} master calendar sessions.</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowSyncModal(false)} className="px-4 py-2 rounded-lg border border-gray-700 text-gray-400 hover:text-blue-200 transition-colors text-sm">Cancel</button>
                  <button onClick={handleSaveSync} disabled={savingSync} className="bg-brand-primary text-black px-6 py-2.5 rounded-xl font-bold hover:bg-brand-primaryHover transition-colors shadow-lg flex items-center gap-2">
                    {savingSync ? 'Saving...' : <><Save className="w-4 h-4" /> Save Allocations</>}
                  </button>
                </div>
             </div>

             <div className="p-6">
               <div className="grid grid-cols-3 gap-4 mb-6">
                 <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 text-center"><p className="text-3xl font-bold text-brand-primary">{syncPreview.length}</p><p className="text-gray-500 text-sm mt-1">Sessions Matched</p></div>
                 <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 text-center"><p className="text-3xl font-bold text-green-400">{syncPreview.reduce((a,s) => a + s.employees.length, 0)}</p><p className="text-gray-500 text-sm mt-1">Employees Allocated</p></div>
                 <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 text-center"><p className="text-3xl font-bold text-purple-400">{[...new Set(syncPreview.map(s => s.dept))].length}</p><p className="text-gray-500 text-sm mt-1">Departments Syncing</p></div>
               </div>

               <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                 {syncPreview.map((session, idx) => (
                   <div key={idx} className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                     <div className="flex items-center justify-between p-4 border-b border-gray-800">
                       <div className="flex items-center gap-3">
                         <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${DEPT_COLORS[session.dept] || 'bg-brand-primary/20 text-brand-primary border-brand-primary/30'}`}>{session.dept}</span>
                         <div>
                           <p className="text-blue-200 font-semibold">{session.topic}</p>
                           <p className="text-gray-400 text-xs mt-0.5">📅 {session.dateLabel} &nbsp; ⏰ {session.timeLabel}</p>
                         </div>
                       </div>
                       <span className="text-brand-primary font-bold text-sm bg-brand-primary/10 px-3 py-1 rounded-full">{session.employees.length} staff</span>
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
          </div>
        </div>
      )}

      {/* Old Auto-Allocate Roster Modal */}
      {showRosterModal && (
        <div className="fixed inset-0 bg-black/90 flex items-start justify-center z-50 p-4 overflow-y-auto print:hidden">
          <div className="bg-brand-card border border-gray-800 rounded-2xl w-full max-w-4xl my-4 relative p-8">
            <button onClick={() => setShowRosterModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-blue-200"><X className="w-6 h-6" /></button>
            <h2 className="text-2xl font-bold text-blue-200 mb-2 flex items-center gap-3"><Users className="text-brand-primary" /> Smart Roster Auto-Allocator</h2>
            <p className="text-gray-400 text-sm mb-6">Upload staff lists (EmpNo, Name CSV) per department. System will batch them into 15-person training slots.</p>

            
            {rosterStep === 1 && (
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Allocation Type</label>
                    <select value={allocConfig.frequency} onChange={e => setAllocConfig({...allocConfig, frequency: e.target.value})} className="w-full bg-[#181818] border border-gray-700 rounded-lg p-3 text-blue-200 focus:border-brand-primary outline-none">
                      <option value="Daily">Daily</option>
                      <option value="Monthly">Monthly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Start Date</label>
                    <input type="date" value={allocConfig.startDate} onChange={e => setAllocConfig({...allocConfig, startDate: e.target.value})} className="w-full bg-[#181818] border border-gray-700 rounded-lg p-3 text-blue-200 focus:border-brand-primary outline-none" style={{ colorScheme: 'dark' }} />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">End Date</label>
                    <input type="date" value={allocConfig.endDate} onChange={e => setAllocConfig({...allocConfig, endDate: e.target.value})} className="w-full bg-[#181818] border border-gray-700 rounded-lg p-3 text-blue-200 focus:border-brand-primary outline-none" style={{ colorScheme: 'dark' }} />
                  </div>
                </div>
                <div className="space-y-4 mb-8">

                  {['Rooms', 'Public Area', 'Laundry', 'Flower', 'Stores', 'Coordinator'].map(dept => {
                    const fileRef = React.createRef();
                    return (
                      <div key={dept} className={`bg-gray-900 border rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${pendingRosters[dept] ? 'border-green-700' : 'border-gray-800'}`}>
                        <div>
                          <h4 className={`font-bold ${pendingRosters[dept] ? 'text-green-400' : 'text-blue-200'}`}>{dept} {pendingRosters[dept] ? `✅ (${pendingRosters[dept].length} staff)` : ''}</h4>
                          <p className="text-gray-500 text-xs mt-1">CSV: EmpNo, Name (one per row)</p>
                        </div>
                        <div>
                          <input type="file" accept=".csv" ref={fileRef} onChange={(e) => handleDeptFileUpload(e, dept)} className="hidden" />
                          <button onClick={() => fileRef.current?.click()} className="bg-gray-800 hover:bg-gray-700 text-blue-200 px-4 py-2 rounded-lg text-sm font-semibold border border-gray-700 flex items-center gap-2">
                            <Upload className="w-4 h-4" /> Upload {dept} Roster
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="text-center pt-6 border-t border-gray-800">
                  <button onClick={handleGenerateSchedules} disabled={Object.values(pendingRosters).every(r => r === null)}
                    className={`px-12 py-4 rounded-xl font-bold transition-all shadow-lg text-xl flex items-center justify-center gap-3 mx-auto ${Object.values(pendingRosters).some(r => r !== null) ? 'bg-brand-primary text-black hover:bg-brand-primaryHover hover:-translate-y-0.5' : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'}`}>
                    <CalendarDays className="w-6 h-6" /> Generate Schedules
                  </button>
                </div>
              </div>
            )}

            {rosterStep === 2 && allocations.length > 0 && (
              <div>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 border-b border-gray-800 pb-6 gap-4">
                  <div>
                    <h2 className="text-3xl font-bold text-blue-200 mb-2 flex items-center gap-3"><CheckCircle className="text-green-500 w-8 h-8" /> Smart Slots Generated</h2>
                    <p className="text-gray-400">Batched into 9 AM / 3 PM slots. Trainer Days Off were actively skipped.</p>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={handleSaveSmartAllocations} disabled={savingAllocations} className="bg-brand-primary text-black px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-brand-primaryHover transition-colors font-bold shadow-lg">
                      {savingAllocations ? 'Saving...' : <><Save className="w-5 h-5" /> Push to Master Calendar</>}
                    </button>
                  </div>
                </div>
                <div className="space-y-6">
                  {allocations.map((session, index) => (
                    <div key={index} className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden shadow-md">
                      <div className="bg-gray-800 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-700 gap-2">
                        <div>
                          <h4 className="font-bold text-blue-200 text-lg"><span className="text-brand-primary mr-2">[{session.department}]</span>{session.topic}</h4>
                          <div className="text-sm text-gray-400 mt-1 flex items-center gap-2"><Clock className="w-4 h-4 text-brand-primary"/><span className="font-bold text-blue-200">{new Date(session.training_date).toLocaleString()}</span></div>
                        </div>
                        <span className="text-sm bg-brand-primary/20 text-brand-primary px-3 py-1 rounded-full font-bold">{session.employees.length} Staff</span>
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
            <button onClick={() => setShowCalUploadModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-blue-200"><X className="w-6 h-6" /></button>
            <h2 className="text-2xl font-bold text-blue-200 mb-2 flex items-center gap-2"><CalendarDays className="text-brand-primary" /> Import Calendar</h2>
            <p className="text-gray-400 text-sm mb-6">Upload a monthly Excel (.xlsx) or CSV schedule for a specific department.</p>
            <div className="space-y-5">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Target Department</label>
                <select value={calUploadDept} onChange={(e) => setCalUploadDept(e.target.value)} className="w-full bg-[#181818] border border-gray-700 rounded-lg p-3 text-blue-200 focus:border-brand-primary outline-none">
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="bg-gray-900 border border-dashed border-gray-700 rounded-xl p-6 text-center">
                <p className="text-xs text-gray-500 mb-4 text-left font-mono">Format: Date(YYYY-MM-DD), Time(HH:MM), Topic, Venue, Trainer</p>
                <input type="file" accept=".csv, .xlsx, .xls" ref={calFileInputRef} onChange={handleCalendarUpload} className="hidden" />
                <button onClick={() => calFileInputRef.current?.click()} disabled={uploadingCal} className="bg-brand-primary text-black px-6 py-2.5 rounded-lg font-bold hover:bg-brand-primaryHover transition-colors w-full">
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
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-blue-200"><X className="w-5 h-5" /></button>
            <h2 className="text-xl font-bold text-blue-200 mb-6">Schedule New Training</h2>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                  <label className="block text-sm text-gray-400 mb-1">Topic</label>
                  <input required list="topics-list" type="text" value={formData.topic} onChange={(e) => setFormData({...formData, topic: e.target.value})} className="w-full bg-[#181818] border border-gray-700 rounded-lg p-2.5 text-blue-200 focus:border-brand-primary outline-none" />
                  <datalist id="topics-list">
                    {[...new Set(schedules.filter(s => !formData.department || s.department === formData.department || s.department === 'All Staff').map(s => s.topic))].sort().map((t, i) => <option key={i} value={t} />)}
                  </datalist>
                </div>
              <div><label className="block text-sm text-gray-400 mb-1">Department</label>
                <select required value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})} className="w-full bg-[#181818] border border-gray-700 rounded-lg p-2.5 text-blue-200 focus:border-brand-primary outline-none">
                  <option value="">Select Department</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div><label className="block text-sm text-gray-400 mb-1">Category</label>
                <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full bg-[#181818] border border-gray-700 rounded-lg p-2.5 text-blue-200 focus:border-brand-primary outline-none">
                  <option>Mandatory</option><option>OJT</option><option>SOP</option><option>Hotel HR</option>
                </select>
              </div>
              <div><label className="block text-sm text-gray-400 mb-1">Trainer</label><input type="text" value={formData.trainer} onChange={(e) => setFormData({...formData, trainer: e.target.value})} placeholder="TBD" className="w-full bg-[#181818] border border-gray-700 rounded-lg p-2.5 text-blue-200 focus:border-brand-primary outline-none" /></div>
              <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm text-gray-400 mb-1">Venue</label><input type="text" value={formData.venue} onChange={(e) => setFormData({...formData, venue: e.target.value})} placeholder="Main Room" className="w-full bg-[#181818] border border-gray-700 rounded-lg p-2.5 text-blue-200 focus:border-brand-primary outline-none" /></div>
                  <div><label className="block text-sm text-gray-400 mb-1">Duration (mins)</label><select value={formData.duration} onChange={(e) => setFormData({...formData, duration: e.target.value})} className="w-full bg-[#181818] border border-gray-700 rounded-lg p-2.5 text-blue-200 focus:border-brand-primary outline-none"><option value="30">30 mins</option><option value="60">1 Hour</option><option value="90">1.5 Hours</option><option value="120">2 Hours</option><option value="180">3 Hours</option><option value="240">4 Hours</option></select></div>
                </div>
              <div><label className="block text-sm text-gray-400 mb-1">Date & Time</label><input required type="datetime-local" value={formData.training_date} onChange={(e) => setFormData({...formData, training_date: e.target.value})} className="w-full bg-[#181818] border border-gray-700 rounded-lg p-2.5 text-blue-200 focus:border-brand-primary outline-none" style={{ colorScheme: 'dark' }} /></div>
              <div className="pt-4"><button type="submit" className="w-full bg-brand-primary hover:bg-brand-primaryHover text-black py-2.5 rounded-lg font-bold transition-colors">Save Session</button></div>
            </form>
          </div>
        </div>
      )}

      {/* QR Modal */}
      {qrModal.show && qrModal.session && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 print:hidden">
          <div className="bg-brand-card border border-gray-800 rounded-2xl max-w-sm w-full p-8 relative flex flex-col items-center text-center shadow-2xl">
            <button onClick={() => setQrModal({ show: false, session: null })} className="absolute top-4 right-4 text-gray-400 hover:text-blue-200 transition-colors"><X className="w-6 h-6" /></button>
            <h2 className="text-2xl font-bold text-blue-200 mb-2">{qrModal.session.topic}</h2>
            <p className="text-brand-primary text-sm font-medium mb-6 uppercase tracking-widest">Attendance QR Portal</p>
            <div className="bg-white p-4 rounded-xl shadow-inner mb-6">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=http://localhost:5173/%23/attendance/${qrModal.session.id}`} alt="QR Code" className="w-48 h-48" />
            </div>
            <button onClick={() => window.print()} className="w-full bg-gray-800 hover:bg-gray-700 text-blue-200 py-3 rounded-lg font-bold transition-colors border border-gray-700 flex items-center justify-center gap-2"><Printer className="w-4 h-4" /> Print QR Poster</button>
          </div>
        </div>
      )}
    </div>
  );
}




