const { Client } = require('pg');

async function test() {
  const client = new Client({
    connectionString: "postgresql://neondb_owner:npg_dvm1yAkENnO8@ep-shiny-tooth-aqfpdhtk.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require"
  });
  
  try {
    await client.connect();
    
    // Check trainings data
    const tRes = await client.query("SELECT COUNT(*) FROM trainings");
    console.log("Total Trainings:", tRes.rows[0].count);

    // Test the Analytics query
    const trainingFilter = '1=1';
    
    const sopRes = await client.query(`
      SELECT topic, COUNT(id) as sessions,
      (SELECT COUNT(*) FROM attendance_records a JOIN trainings t2 ON a.training_id = t2.id WHERE t2.topic = t.topic) as attendees
      FROM trainings t
      WHERE category != 'Compliance' AND ${trainingFilter}
      GROUP BY topic
    `);
    console.log("SOP Res:", sopRes.rows);

  } catch (err) {
    console.error("SQL ERROR:", err.message);
  } finally {
    await client.end();
  }
}
test();
