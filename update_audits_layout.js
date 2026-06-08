const fs = require('fs');
let audits = fs.readFileSync('frontend/src/pages/Audits.jsx', 'utf8');

const oldHeader = `      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-blue-200 mb-2 tracking-tight flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-emerald-400" />
            Room Audits
          </h1>
          <p className="text-gray-400">Track and monitor room cleaning quality via Google Forms integration.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button onClick={() => setShowBulkModal(true)} className="bg-blue-600 hover:bg-blue-500 text-blue-100 px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors">
            <LayoutDashboard className="w-5 h-5" /> Bulk Upload in Text
          </button>
          <button onClick={() => setShowAddModal(true)} className="bg-emerald-600 hover:bg-emerald-500 text-emerald-100 px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors">
            <Plus className="w-5 h-5" /> Add Manual Audit
          </button>
          
          <div className="flex items-center gap-2 bg-[#181818] border border-gray-800 rounded-xl px-3 py-1.5 ml-4">
            <CalendarIcon className="w-4 h-4 text-gray-500" />
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="bg-transparent text-gray-300 outline-none text-sm font-medium" />
            <span className="text-gray-600 mx-2">|</span>
            <select value={department} onChange={(e) => setDepartment(e.target.value)} className="bg-transparent text-blue-200 outline-none text-sm font-bold w-40">
              <option value="All">All Departments</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>
      </header>`;

const newHeader = `      <header className="mb-8 flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-blue-200 mb-2 tracking-tight flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-emerald-400" />
            Room Audits
          </h1>
          <p className="text-gray-400">Track and monitor room cleaning quality via Google Forms integration.</p>
        </div>
        
        <div className="flex flex-col items-end gap-3">
          <div className="flex items-center gap-2 bg-[#181818] border border-gray-800 rounded-xl px-3 py-1.5">
            <CalendarIcon className="w-4 h-4 text-gray-500" />
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="bg-transparent text-gray-300 outline-none text-sm font-medium" />
            <span className="text-gray-600 mx-2">|</span>
            <select value={department} onChange={(e) => setDepartment(e.target.value)} className="bg-transparent text-blue-200 outline-none text-sm font-bold w-40">
              <option value="All">All Departments</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => setShowBulkModal(true)} className="bg-blue-600 hover:bg-blue-500 text-blue-100 px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors whitespace-nowrap">
              <LayoutDashboard className="w-5 h-5" /> Bulk Upload in Text
            </button>
            <button onClick={() => setShowAddModal(true)} className="bg-emerald-600 hover:bg-emerald-500 text-emerald-100 px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors whitespace-nowrap">
              <Plus className="w-5 h-5" /> Add Manual Audit
            </button>
          </div>
        </div>
      </header>`;

const replaced = audits.replace(oldHeader, newHeader);
if(replaced === audits) {
  console.log("Failed to replace!");
} else {
  fs.writeFileSync('frontend/src/pages/Audits.jsx', replaced, 'utf8');
  console.log("Successfully replaced Audits header layout");
}
