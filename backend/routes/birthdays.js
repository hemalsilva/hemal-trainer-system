const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { OpenAI } = require('openai');

// Cache to store today's wishes so we don't spam the AI API
const wishesCache = {
  date: null,
  wishes: {}
};

const fallbackTemplates = [
  "Wishing you a fantastic birthday filled with joy and success, [Name]!",
  "Happy Birthday, [Name]! We hope you have a wonderful day.",
  "Sending you our best wishes on your special day. Happy Birthday, [Name]!",
  "[Name], wishing you another year of great achievements and happiness. Happy Birthday!"
];

async function generateBirthdayWish(name) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === 'YOUR_OPENAI_API_KEY') {
    // Fallback if no API key
    const template = fallbackTemplates[Math.floor(Math.random() * fallbackTemplates.length)];
    return template.replace('[Name]', name);
  }

  try {
    const openai = new OpenAI({ apiKey: apiKey });
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a professional but warm HR assistant generating birthday wishes." },
        { role: "user", content: `Write a short, professional, and warm birthday wish for our employee named ${name}. Just 1 or 2 sentences. Do not use placeholders. Make it enthusiastic!` }
      ],
      max_tokens: 60,
      temperature: 0.7,
    });
    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error("AI Generation Error:", error);
    const template = fallbackTemplates[Math.floor(Math.random() * fallbackTemplates.length)];
    return template.replace('[Name]', name);
  }
}

router.get('/today', async (req, res) => {
  try {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();

    // Reset cache if it's a new day
    if (wishesCache.date !== todayStr) {
      wishesCache.date = todayStr;
      wishesCache.wishes = {};
    }

    const result = await pool.query(`
      SELECT emp_no, full_name, date_of_birth, photo_url 
      FROM employees 
      WHERE date_of_birth IS NOT NULL
        AND EXTRACT(MONTH FROM date_of_birth) = $1 
        AND EXTRACT(DAY FROM date_of_birth) = $2
    `, [currentMonth, currentDay]);

    const birthdays = result.rows;

    for (let emp of birthdays) {
      if (!wishesCache.wishes[emp.emp_no]) {
        wishesCache.wishes[emp.emp_no] = await generateBirthdayWish(emp.full_name);
      }
      emp.wish = wishesCache.wishes[emp.emp_no];
    }

    res.json(birthdays);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch birthdays' });
  }
});

module.exports = router;