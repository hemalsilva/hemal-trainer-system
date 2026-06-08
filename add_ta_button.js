const fs = require('fs');
let ta = fs.readFileSync('frontend/src/pages/TrainingAttendance.jsx', 'utf8');

const oldHeader = `      <header className="mb-8">
        <h1 className="text-3xl font-bold text-brand-primary tracking-tight mb-2">Training Attendance</h1>
        <p className="text-gray-400">Manage and track session attendance via manual entry, AI OCR, and Google Forms.</p>
      </header>`;

const newHeader = `      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-brand-primary tracking-tight mb-2">Training Attendance</h1>
          <p className="text-gray-400">Manage and track session attendance via manual entry, AI OCR, and Google Forms.</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="bg-brand-primary hover:bg-brand-primaryHover text-black px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors">
          <Plus className="w-5 h-5" /> Schedule New Training
        </button>
      </header>`;

ta = ta.replace(oldHeader, newHeader);
fs.writeFileSync('frontend/src/pages/TrainingAttendance.jsx', ta, 'utf8');
console.log('Added Schedule New Training button to TrainingAttendance');
