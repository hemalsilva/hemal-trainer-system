import os
import re

filepath = 'backend/routes/reports.js'
with open(filepath, 'r', encoding='utf8') as f:
    content = f.read()

# Remove the broken references that were causing the crash
content = re.sub(r'printDataSOP:\s*printSOPRes.*?\n', '', content)
content = re.sub(r'printDataOJT:\s*printOJTRes.*?\n', '', content)
content = re.sub(r'printDataHR:\s*printHRRes.*?\n', '', content)
content = re.sub(r'printDataHours\n', '', content)
content = re.sub(r'printDataHours\r\n', '', content)
content = re.sub(r'printDataHours,', '', content)

if content != "":
    with open(filepath, 'w', encoding='utf8') as f:
        f.write(content)
    print("Cleaned up broken references in reports.js")
else:
    print("Something went wrong.")
