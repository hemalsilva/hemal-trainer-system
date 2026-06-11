import os
import re

filepath = 'frontend/src/pages/TrainingAttendance.jsx'
with open(filepath, 'r', encoding='utf8') as f:
    content = f.read()

pattern = r'(<option value="">Select Department</option>\s*)(.*?DEPARTMENTS\.map)'
replacement = r'\1<option value="All Staff">All Staff</option>\n                    \2'

new_content = re.sub(pattern, replacement, content)

if new_content != content:
    with open(filepath, 'w', encoding='utf8') as f:
        f.write(new_content)
    print("Successfully added All Staff option using regex!")
else:
    print("Regex failed to find the block.")
