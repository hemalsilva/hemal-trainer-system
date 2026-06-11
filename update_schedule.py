import os

filepath = 'frontend/src/pages/Schedule.jsx'
with open(filepath, 'r', encoding='utf8') as f:
    content = f.read()

# 1. handleGenerateAllocations
old_gen = """  const handleGenerateAllocations = () => {
    const uploadedDepts = Object.keys(monthlyRosters);
    if (uploadedDepts.length === 0) {
      alert('Please upload at least one department roster first.');
      return;
    }

    const preview = [];
    
    // Look at all sessions in the current month
    const currentMonthSessions = filteredSchedules.filter(s => new Date(s.training_date).getMonth() === currentMonth && new Date(s.training_date).getFullYear() === currentYear);

    currentMonthSessions.forEach(session => {
      const roster = monthlyRosters[session.department];
      if (!roster) return; // No roster for this dept, skip

      const dateObj = new Date(session.training_date);
      const day = dateObj.getDate();
      const hour = dateObj.getHours();

      if (isDayOff(dateObj)) return;

      // Determine required shift based on hour (before 12 PM = 8, else 13)
      const requiredShift = hour < 12 ? '8' : '13';

      const eligibleEmps = roster.employees.filter(emp => String(emp.days[day]).trim() === requiredShift);

      if (eligibleEmps.length > 0) {
        // Cap to rosterBatchSize
        const batch = eligibleEmps.slice(0, parseInt(rosterBatchSize) || 15);
        preview.push({
          session, // The master session object
          employees: batch,
          dept: session.department,
          topic: session.topic,
          dateLabel: dateObj.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' }),
          timeLabel: dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        });
      }
    });"""

new_gen = """  const handleGenerateAllocations = async () => {
    const uploadedDepts = Object.keys(monthlyRosters);
    if (uploadedDepts.length === 0) {
      alert('Please upload at least one department roster first.');
      return;
    }

    // Fetch past allocations to prevent duplicates
    let pastAllocations = [];
    try {
      const res = await axios.get('/api/trainings/allocations/all');
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
    });"""

content = content.replace(old_gen, new_gen)

# 2. Export Funcs
export_funcs = """
  const downloadAllocationsExcel = () => {
    let csv = 'Topic,Department,Date,Time,Emp No,Emp Name\\n';
    syncPreview.forEach(item => {
      item.employees.forEach(emp => {
        csv += `"${item.topic}","${item.dept}","${item.dateLabel}","${item.timeLabel}","${emp.emp_no}","${emp.name}"\\n`;
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
    let csv = 'Date & Time,Department,Topic,Trainer,Venue\\n';
    filteredSchedules.forEach(s => {
      csv += `"${new Date(s.training_date).toLocaleString()}","${s.department}","${s.topic}","${s.trainer_name}","${s.venue}"\\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Detailed_Schedule.csv';
    a.click();
  };
"""
content = content.replace('  const handleSaveSync = async () => {', export_funcs + '\n  const handleSaveSync = async () => {')

# 3. Export Buttons
old_sync_buttons = """<button onClick={() => setShowSyncModal(false)} className="px-5 py-2.5 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors font-medium">Cancel</button>
            <button onClick={handleSaveSync} disabled={savingSync} className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-2 transition-colors">
              {savingSync ? 'Saving...' : <><Save className="w-4 h-4" /> Save Allocations</>}
            </button>"""
new_sync_buttons = """<button onClick={() => setShowSyncModal(false)} className="px-5 py-2.5 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors font-medium">Cancel</button>
            <button onClick={downloadAllocationsExcel} className="px-5 py-2.5 rounded-lg bg-green-600/20 text-green-400 hover:bg-green-600/30 transition-colors font-medium">Export to Excel</button>
            <button onClick={handleSaveSync} disabled={savingSync} className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-2 transition-colors">
              {savingSync ? 'Saving...' : <><Save className="w-4 h-4" /> Save Allocations</>}
            </button>"""
content = content.replace(old_sync_buttons, new_sync_buttons)

old_print = """<button onClick={() => window.print()} className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 px-4 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-lg">
            <Printer className="w-5 h-5" /> Print
          </button>"""
new_print = """<button onClick={() => { document.body.classList.add('print-calendar-only'); window.print(); document.body.classList.remove('print-calendar-only'); }} className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 px-4 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-lg">
            <Printer className="w-5 h-5" /> Print Calendar
          </button>"""
content = content.replace(old_print, new_print)

old_detailed_header = """<div className="flex items-center justify-between p-6 border-b border-gray-800 bg-gray-800/50">
          <div>
            <h2 className="text-xl font-bold text-blue-200 flex items-center gap-3"><BookOpen className="w-6 h-6 text-brand-primary" /> Detailed Training Schedule</h2>
            <p className="text-sm text-gray-400 mt-1">Detailed list view for the selected month and department.</p>
          </div>
          <button onClick={() => window.print()} className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 px-4 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-lg">
            <Printer className="w-5 h-5" /> Print Detailed Schedule
          </button>
        </div>"""
new_detailed_header = """<div className="flex items-center justify-between p-6 border-b border-gray-800 bg-gray-800/50 print:hidden">
          <div>
            <h2 className="text-xl font-bold text-blue-200 flex items-center gap-3"><BookOpen className="w-6 h-6 text-brand-primary" /> Detailed Training Schedule</h2>
            <p className="text-sm text-gray-400 mt-1">Detailed list view for the selected month and department.</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={downloadDetailedScheduleExcel} className="bg-green-600/20 text-green-400 hover:bg-green-600/30 px-4 py-2.5 rounded-lg font-medium transition-colors">Export to Excel</button>
            <button onClick={() => { document.body.classList.add('print-list-only'); window.print(); document.body.classList.remove('print-list-only'); }} className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 px-4 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-lg">
              <Printer className="w-5 h-5" /> Print Detailed Schedule
            </button>
          </div>
        </div>"""
content = content.replace(old_detailed_header, new_detailed_header)

style_tag = """
      <style>{`
        @media print {
          .print-calendar-only .print\\\\:hidden, .print-calendar-only .detailed-list-section { display: none !important; }
          .print-list-only .print\\\\:hidden, .print-list-only .calendar-section { display: none !important; }
          .print-calendar-only .truncate { white-space: normal !important; text-overflow: clip !important; overflow: visible !important; }
          .print-calendar-only .text-xs { font-size: 10px !important; }
          .print-calendar-only .min-h-[140px] { min-height: 200px !important; }
        }
      `}</style>
"""
content = content.replace('<header className="mb-8 flex', style_tag + '<header className="mb-8 flex')
content = content.replace('      {/* BIG CALENDAR GRID */}', '      {/* BIG CALENDAR GRID */}\\n      <div className="calendar-section">')
content = content.replace('      {/* Detailed List View */}', '      </div>\\n      {/* Detailed List View */}')
content = content.replace('<div className="bg-brand-card border border-gray-800 rounded-2xl shadow-xl overflow-hidden mt-12 print:break-before-page">', '<div className="bg-brand-card border border-gray-800 rounded-2xl shadow-xl overflow-hidden mt-12 print:break-before-page detailed-list-section">')

with open(filepath, 'w', encoding='utf8') as f:
    f.write(content)

print("Schedule.jsx updated successfully!")
