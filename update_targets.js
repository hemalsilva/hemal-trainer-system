const fs = require('fs');
let audits = fs.readFileSync('backend/routes/audits.js', 'utf8');

// Update target in balances
audits = audits.replace(
  "const targetStayover = 30;",
  "const targetStayover = 20;"
);
audits = audits.replace(
  "const targetDeparture = 30;",
  "const targetDeparture = 20;"
);

// Update top performers query
const oldQuery = `      WITH RankedAudits AS (
        SELECT emp_no, emp_name, audit_type, ROUND(AVG(score), 1) as score,
               DENSE_RANK() OVER(PARTITION BY audit_type ORDER BY AVG(score) DESC) as rank
        FROM room_audits
        \${dateFilter}
        GROUP BY emp_no, emp_name, audit_type
      )`;

const newQuery = `      WITH RankedAudits AS (
        SELECT emp_no, emp_name, audit_type, ROUND(AVG(score), 1) as score,
               COUNT(id) as audit_count,
               DENSE_RANK() OVER(PARTITION BY audit_type ORDER BY AVG(score) DESC) as rank
        FROM room_audits
        \${dateFilter}
        GROUP BY emp_no, emp_name, audit_type
        HAVING 
          (audit_type IN ('Stayover', 'IP Stayover', 'Departure', 'IP Departure') AND COUNT(id) >= 20)
          OR 
          (audit_type NOT IN ('Stayover', 'IP Stayover', 'Departure', 'IP Departure') AND COUNT(id) >= 5)
      )`;

audits = audits.replace(oldQuery, newQuery);

fs.writeFileSync('backend/routes/audits.js', audits, 'utf8');
console.log("Successfully updated audits.js with 20 targets");
