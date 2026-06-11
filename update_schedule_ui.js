const fs = require('fs');
const filePath = 'frontend/src/pages/Schedule.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add All Staff to DEPARTMENTS
content = content.replace(
  `const DEPARTMENTS = ['Rooms', 'Public Area', 'Laundry', 'Flower', 'Stores', 'Coordinator', 'Hotel School', 'Cinnamon Hotel Academy', 'General'];`,
  `const DEPARTMENTS = ['All Staff', 'Rooms', 'Public Area', 'Laundry', 'Flower', 'Stores', 'Coordinator', 'Hotel School', 'Cinnamon Hotel Academy', 'General'];`
);

// 2. Add duration input
const oldVenueInput = `<div><label className="block text-sm text-gray-400 mb-1">Venue</label><input type="text" value={formData.venue} onChange={(e) => setFormData({...formData, venue: e.target.value})} placeholder="Main Room" className="w-full bg-[#181818] border border-gray-700 rounded-lg p-2.5 text-blue-200 focus:border-brand-primary outline-none" /></div>`;

const newVenueInput = `<div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm text-gray-400 mb-1">Venue</label><input type="text" value={formData.venue} onChange={(e) => setFormData({...formData, venue: e.target.value})} placeholder="Main Room" className="w-full bg-[#181818] border border-gray-700 rounded-lg p-2.5 text-blue-200 focus:border-brand-primary outline-none" /></div>
                  <div><label className="block text-sm text-gray-400 mb-1">Duration (mins)</label><input type="number" min="1" value={formData.duration} onChange={(e) => setFormData({...formData, duration: e.target.value})} className="w-full bg-[#181818] border border-gray-700 rounded-lg p-2.5 text-blue-200 focus:border-brand-primary outline-none" /></div>
                </div>`;
content = content.replace(oldVenueInput, newVenueInput);

// 3. Add topic datalist
const oldTopicInput = `<div><label className="block text-sm text-gray-400 mb-1">Topic</label><input required type="text" value={formData.topic} onChange={(e) => setFormData({...formData, topic: e.target.value})} className="w-full bg-[#181818] border border-gray-700 rounded-lg p-2.5 text-blue-200 focus:border-brand-primary outline-none" /></div>`;

const newTopicInput = `<div>
                  <label className="block text-sm text-gray-400 mb-1">Topic</label>
                  <input required list="topics-list" type="text" value={formData.topic} onChange={(e) => setFormData({...formData, topic: e.target.value})} className="w-full bg-[#181818] border border-gray-700 rounded-lg p-2.5 text-blue-200 focus:border-brand-primary outline-none" />
                  <datalist id="topics-list">
                    {[...new Set(schedules.map(s => s.topic))].sort().map((t, i) => <option key={i} value={t} />)}
                  </datalist>
                </div>`;
content = content.replace(oldTopicInput, newTopicInput);

fs.writeFileSync(filePath, content, 'utf8');
console.log('UI fields updated in Schedule.jsx');
