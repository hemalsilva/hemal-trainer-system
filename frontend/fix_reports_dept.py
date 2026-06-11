import os
import re

filepath = 'frontend/src/pages/Reports.jsx'
with open(filepath, 'r', encoding='utf8') as f:
    content = f.read()

# Add DEPARTMENTS array at the top if it's not there
if "const DEPARTMENTS = [" not in content:
    content = content.replace("export default function Reports() {", "const DEPARTMENTS = ['Rooms', 'Public Area', 'Laundry', 'Flower', 'Stores', 'Coordinator', 'Hotel School', 'Cinnamon Hotel Academy', 'General'];\n\nexport default function Reports() {")

# Replace {departments.map...} with {DEPARTMENTS.map...}
content = content.replace("{departments.map((dept, i) => (", "{DEPARTMENTS.map((dept, i) => (")

with open(filepath, 'w', encoding='utf8') as f:
    f.write(content)
print("Updated DEPARTMENTS in Reports.jsx successfully!")
