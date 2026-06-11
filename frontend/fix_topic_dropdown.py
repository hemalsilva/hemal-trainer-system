import os
import re

# Update Schedule.jsx
filepath = 'frontend/src/pages/Schedule.jsx'
with open(filepath, 'r', encoding='utf8') as f:
    content = f.read()

old_datalist = """                  <datalist id="topics-list">
                    {[...new Set(schedules.map(s => s.topic))].sort().map((t, i) => <option key={i} value={t} />)}
                  </datalist>"""

new_datalist = """                  <datalist id="topics-list">
                    {[...new Set(schedules.filter(s => !formData.department || s.department === formData.department || s.department === 'All Staff').map(s => s.topic))].sort().map((t, i) => <option key={i} value={t} />)}
                  </datalist>"""

content = content.replace(old_datalist, new_datalist)
with open(filepath, 'w', encoding='utf8') as f:
    f.write(content)

# Update TrainingAttendance.jsx
filepath = 'frontend/src/pages/TrainingAttendance.jsx'
with open(filepath, 'r', encoding='utf8') as f:
    content = f.read()

old_topic_input = """                <input required value={formData.topic} onChange={e => setFormData({...formData, topic: e.target.value})} className="w-full bg-[#161a22] border border-gray-700 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none" />"""

new_topic_input = """                <input required list="ta-topics-list" value={formData.topic} onChange={e => setFormData({...formData, topic: e.target.value})} className="w-full bg-[#161a22] border border-gray-700 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none" />
                <datalist id="ta-topics-list">
                  {[...new Set(trainings.filter(t => !formData.department || t.department === formData.department || t.department === 'All Staff').map(t => t.topic))].sort().map((topic, i) => <option key={i} value={topic} />)}
                </datalist>"""

content = content.replace(old_topic_input, new_topic_input)
with open(filepath, 'w', encoding='utf8') as f:
    f.write(content)

print("Updated topic inputs in both files successfully!")
