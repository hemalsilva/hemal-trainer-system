import os

filepath = 'frontend/src/pages/Schedule.jsx'
with open(filepath, 'r', encoding='utf8') as f:
    content = f.read()

content = content.replace('<div className="calendar-section">', '')
content = content.replace('.print-calendar-only .detailed-list-section { display: none !important; }', '.print-calendar-only .mt-12 { display: none !important; }')
content = content.replace('.print-list-only .calendar-section { display: none !important; }', '.print-list-only .mb-8, .print-list-only .bg-\\[\\#181818\\] { display: none !important; }')

with open(filepath, 'w', encoding='utf8') as f:
    f.write(content)

print("Fixed Schedule.jsx unclosed div")
