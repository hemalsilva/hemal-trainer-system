import os

filepath = 'backend/routes/trainings.js'
with open(filepath, 'r', encoding='utf8') as f:
    content = f.read()

bad_sql = """        const insertRes = await client.query(
          `INSERT INTO attendance_records (training_id, emp_no, emp_name)
           SELECT 
           ::int, $2::varchar, $3::varchar
           WHERE NOT EXISTS (
             SELECT 1 FROM attendance_records WHERE training_id = $1 AND emp_no = $2
           ) RETURNING *`,
          [id, cleanEmpNo, empName]
        );"""

good_sql = """        const insertRes = await client.query(
          `INSERT INTO attendance_records (training_id, emp_no, emp_name)
           SELECT $1::int, $2::varchar, $3::varchar
           WHERE NOT EXISTS (
             SELECT 1 FROM attendance_records WHERE training_id = $1 AND emp_no = $2
           ) RETURNING *`,
          [id, cleanEmpNo, empName]
        );"""

if bad_sql in content:
    content = content.replace(bad_sql, good_sql)
    with open(filepath, 'w', encoding='utf8') as f:
        f.write(content)
    print("Fixed bad SQL successfully!")
else:
    print("Could not find the bad SQL string.")
