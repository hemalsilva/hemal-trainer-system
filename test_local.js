const axios = require("axios");

async function test() {
  try {
    const res = await axios.get("http://localhost:5000/api/reports/analytics?start=2026-06-01&end=2026-06-10");
    console.log("Local API keys:", Object.keys(res.data));
    console.log("Local API SOP Data length:", res.data.printDataSOP.length);
  } catch (err) {
    console.error("Local API Error:", err.message);
  }
}
test();
