const fs = require('fs');
const filePath = 'frontend/src/pages/Schedule.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add "All Staff" to DEPARTMENTS
content = content.replace(
  `const DEPARTMENTS = ['Rooms', 'Public Area', 'Laundry', 'Flower', 'Stores', 'Coordinator', 'Hotel School', 'Cinnamon Hotel Academy', 'General'];`,
  `const DEPARTMENTS = ['All Staff', 'Rooms', 'Public Area', 'Laundry', 'Flower', 'Stores', 'Coordinator', 'Hotel School', 'Cinnamon Hotel Academy', 'General'];`
);

// 2. Add duration input & replace Topic input with datalist
const oldTopicInput = `<label className="block text-sm font-medium text-gray-400 mb-1">Topic</label>
              <input type="text" required value={formData.topic} onChange={e => setFormData({...formData, topic: e.target.value})} className="w-full bg-[#181818] border border-gray-700 rounded-xl px-4 py-3 text-blue-200 focus:outline-none focus:border-brand-primary transition-colors" />`;

const newTopicInput = `<label className="block text-sm font-medium text-gray-400 mb-1">Topic</label>
              <input type="text" list="topics-list" required value={formData.topic} onChange={e => setFormData({...formData, topic: e.target.value})} className="w-full bg-[#181818] border border-gray-700 rounded-xl px-4 py-3 text-blue-200 focus:outline-none focus:border-brand-primary transition-colors" />
              <datalist id="topics-list">
                {[...new Set(schedules.map(s => s.topic))].sort().map((t, i) => <option key={i} value={t} />)}
              </datalist>`;
content = content.replace(oldTopicInput, newTopicInput);

// Wait, the Add Session modal also needs Duration
const oldVenueInput = `<div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Venue</label>
              <input type="text" value={formData.venue} onChange={e => setFormData({...formData, venue: e.target.value})} className="w-full bg-[#181818] border border-gray-700 rounded-xl px-4 py-3 text-blue-200 focus:outline-none focus:border-brand-primary transition-colors" />
            </div>`;

const newVenueInput = `<div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Venue</label>
              <input type="text" value={formData.venue} onChange={e => setFormData({...formData, venue: e.target.value})} className="w-full bg-[#181818] border border-gray-700 rounded-xl px-4 py-3 text-blue-200 focus:outline-none focus:border-brand-primary transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Duration (minutes)</label>
              <input type="number" min="1" value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} className="w-full bg-[#181818] border border-gray-700 rounded-xl px-4 py-3 text-blue-200 focus:outline-none focus:border-brand-primary transition-colors" />
            </div>
          </div>`;

// Actually the structure might be slightly different. Let's find the exact string.
