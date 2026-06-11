const { Client } = require('pg');

async function test() {
  const client = new Client({
    connectionString: "postgresql://neondb_owner:npg_dvm1yAkENnO8@ep-shiny-tooth-aqfpdhtk.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require"
  });
  
  try {
    await client.connect();
    
    const tRes = await client.query("SELECT topic, training_date FROM trainings");
    console.log(tRes.rows);

  } catch (err) {
    console.error("SQL ERROR:", err.message);
  } finally {
    await client.end();
  }
}
test();
