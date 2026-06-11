import os

filepath = 'frontend/src/pages/TrainingAttendance.jsx'
with open(filepath, 'r', encoding='utf8') as f:
    content = f.read()

old_select = """                  <select value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="w-full bg-[#161a22] border border-gray-700 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none">
                    <option value="">Select Department</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>"""

new_select = """                  <select value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="w-full bg-[#161a22] border border-gray-700 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none">
                    <option value="">Select Department</option>
                    <option value="All Staff">All Staff</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>"""

if old_select in content:
    content = content.replace(old_select, new_select)
    with open(filepath, 'w', encoding='utf8') as f:
        f.write(content)
    print("Successfully added All Staff option!")
else:
    print("Could not find the select block.")
