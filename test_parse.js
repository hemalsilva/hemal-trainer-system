const text = \
Department : Laundry
Employee No: 1234
Employee Name: John Doe
Audit type: Stayover
Date: 06/07/2026
Score: 90
Room / Area: 101
\;

const blocks = text.split(/\n\s*\n/);
const parsedAudits = [];

blocks.forEach(block => {
  const lines = block.split('\n');
  const audit = {};
  lines.forEach(line => {
    const lowerLine = line.trim().toLowerCase();
    if (lowerLine.includes('employee no')) audit.emp_no = line.split(':')[1]?.trim();
    if (lowerLine.includes('employee name')) audit.emp_name = line.split(':')[1]?.trim();
    if (lowerLine.includes('audit type')) audit.audit_type = line.split(':')[1]?.trim();
    if (lowerLine.includes('date')) {
      const dateStr = line.split(':')[1]?.trim();
      audit.audit_date = dateStr;
    }
    if (lowerLine.includes('score')) audit.score = parseInt(line.split(':')[1]?.trim(), 10);
    if (lowerLine.includes('room / area')) audit.room_number = line.split(':')[1]?.trim();
  });
  
  console.log(audit);
  if (audit.emp_no && audit.score !== undefined && audit.audit_date) {
    parsedAudits.push(audit);
  }
});
console.log('Parsed audits:', parsedAudits.length);
