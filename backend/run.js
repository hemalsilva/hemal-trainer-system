const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://neondb_owner:npg_dvm1yAkENnO8@ep-shiny-tooth-aqfpdhtk.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require' });
client.connect().then(async () => {
  const t = await client.query('SELECT COUNT(*) FROM trainings');
  console.log('Total trainings:', t.rows[0].count);
  const t2 = await client.query('SELECT topic, category, training_date FROM trainings ORDER BY training_date DESC LIMIT 10');
  console.log('Recent trainings:', t2.rows);
  const printSOPRes = await client.query(`SELECT topic, COUNT(id) as sessions, COALESCE((SELECT COUNT(*) FROM attendance_records a WHERE a.training_id IN (SELECT id FROM trainings t2 WHERE t2.topic = t.topic)), 0) as attendees FROM trainings t WHERE category ILIKE ANY (ARRAY['IMandatoryI', '%SOP%']) GROUP BY topic`);
  console.log('printDataSOP unfiltered:', printSOPRes.rows);
  client.end();
}).catch(e => console.error(e));