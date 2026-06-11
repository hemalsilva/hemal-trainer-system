import os

filepath = 'frontend/src/pages/TrainingAttendance.jsx'
with open(filepath, 'r', encoding='utf8') as f:
    content = f.read()

old_venue = """                <div>
                  <label className="block text-sm text-gray-400 mb-1">Venue</label>
                  <input value={formData.venue} onChange={e => setFormData({...formData, venue: e.target.value})} className="w-full bg-[#161a22] border border-gray-700 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none" placeholder="Main Room" />
                </div>"""

new_venue_duration = """                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Venue</label>
                    <input value={formData.venue} onChange={e => setFormData({...formData, venue: e.target.value})} className="w-full bg-[#161a22] border border-gray-700 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none" placeholder="Main Room" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Duration (mins)</label>
                    <input type="number" min="1" value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} className="w-full bg-[#161a22] border border-gray-700 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none" />
                  </div>
                </div>"""

if old_venue in content:
    content = content.replace(old_venue, new_venue_duration)
    with open(filepath, 'w', encoding='utf8') as f:
        f.write(content)
    print("Added duration field successfully!")
else:
    print("Could not find the Venue div!")
