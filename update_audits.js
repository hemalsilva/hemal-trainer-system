const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/Audits.jsx', 'utf8');

const targetContent = `      blocks.forEach(block => {
        const lines = block.split('\\n');
        const audit = {};
        lines.forEach(line => {
          const lowerLine = line.toLowerCase();
          if (lowerLine.startsWith('employee no:')) audit.emp_no = line.split(':')[1].trim();
          if (lowerLine.startsWith('employee name:')) audit.emp_name = line.split(':')[1].trim();
          if (lowerLine.startsWith('audit type:')) audit.audit_type = line.split(':')[1].trim();
          if (lowerLine.startsWith('date:')) {
            const dateStr = line.split(':')[1].trim();
            // Try to parse DD/MM/YYYY or MM/DD/YYYY to YYYY-MM-DD
            try {
               const parts = dateStr.split('/');
               if(parts.length === 3) {
                 audit.audit_date = \`\${parts[2]}-\${parts[0]}-\${parts[1]}\`; // Assume MM/DD/YYYY from image
               } else {
                 audit.audit_date = new Date(dateStr).toISOString().split('T')[0];
               }
            } catch(err) {
               audit.audit_date = dateStr;
            }
          }
          if (lowerLine.startsWith('score:')) audit.score = parseInt(line.split(':')[1].trim(), 10);
          if (lowerLine.startsWith('room / area:')) audit.room_number = line.split(':')[1].trim();
        });
        
        if (audit.emp_no && audit.score !== undefined && audit.audit_date) {
          parsedAudits.push(audit);
        }
      });`;

const replacementContent = `      blocks.forEach(block => {
        const lines = block.split('\\n');
        const audit = {};
        lines.forEach(line => {
          const parts = line.split(':');
          if (parts.length < 2) return;
          const key = parts[0].trim().toLowerCase();
          const val = parts.slice(1).join(':').trim();

          if (key.includes('employee no')) audit.emp_no = val;
          if (key.includes('employee name')) audit.emp_name = val;
          if (key.includes('audit type')) audit.audit_type = val;
          if (key.includes('date')) {
            const dateStr = val;
            try {
               const dParts = dateStr.split('/');
               if(dParts.length === 3) {
                 // Try to guess if it's DD/MM/YYYY or MM/DD/YYYY. Usually days > 12 are days.
                 const p0 = parseInt(dParts[0], 10);
                 const p1 = parseInt(dParts[1], 10);
                 if (p0 > 12) {
                   // DD/MM/YYYY
                   audit.audit_date = \`\${dParts[2]}-\${dParts[1].toString().padStart(2,'0')}-\${dParts[0].toString().padStart(2,'0')}\`;
                 } else {
                   // MM/DD/YYYY
                   audit.audit_date = \`\${dParts[2]}-\${dParts[0].toString().padStart(2,'0')}-\${dParts[1].toString().padStart(2,'0')}\`;
                 }
               } else {
                 audit.audit_date = new Date(dateStr).toISOString().split('T')[0];
               }
            } catch(err) {
               audit.audit_date = dateStr;
            }
          }
          if (key.includes('score')) {
            const parsedScore = parseInt(val, 10);
            if (!isNaN(parsedScore)) audit.score = parsedScore;
          }
          if (key.includes('room') || key.includes('area')) audit.room_number = val;
        });
        
        if (audit.emp_no && audit.score !== undefined && audit.audit_date) {
          parsedAudits.push(audit);
        }
      });`;

code = code.replace(targetContent, replacementContent);
fs.writeFileSync('frontend/src/pages/Audits.jsx', code, 'utf8');
console.log('Fixed parsing logic in Audits.jsx');
