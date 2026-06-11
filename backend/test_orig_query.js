const { Client } = require('pg');

async function test() {
  const client = new Client({
    connectionString: "postgresql://neondb_owner:npg_dvm1yAkENnO8@ep-shiny-tooth-aqfpdhtk.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require"
  });
  
  try {
    await client.connect();
    
    // Simulate trainingFilter exactly as in original code
    let trainingFilter = '1=1 AND training_date >= $1 AND training_date <= $2';
    let trainingParams = ['2026-06-01', '2026-06-10'];
    
    const query = `
      SELECT topic, COUNT(id) as sessions, 
             COALESCE((SELECT COUNT(*) FROM attendance_records a WHERE a.training_id IN (SELECT id FROM trainings t2 WHERE t2.topic = t.topic)), 0) as attendees 
      FROM trainings t 
      WHERE category IN ('Mandatory', 'SOP') AND ${trainingFilter}
      GROUP BY topic
    `;
    
    const res = await client.query(query, trainingParams);
    console.log("Original query result:", res.rows);

  } catch (err) {
    console.error("SQL ERROR:", err.message);
  } finally {
    await client.end();
  }
}
test();
