import os
import re

filepath = 'routes/trainings.js'
with open(filepath, 'r', encoding='utf8') as f:
    content = f.read()

# Replace the broken ::int with $1::int
new_content = re.sub(r'SELECT\s+::int, \$2::varchar, \$3::varchar', r'SELECT $1::int, $2::varchar, $3::varchar', content)

if new_content != content:
    with open(filepath, 'w', encoding='utf8') as f:
        f.write(new_content)
    print("Fixed bad SQL successfully with regex!")
else:
    print("Regex replacement did not change anything.")
