# Hemal TMS - Production Deployment Guide

Your codebase has been fully refactored and prepared for a live production environment! I have added dynamic environment variables and Infrastructure-as-Code files (`vercel.json`, `render.yaml`) so deployment is seamless.

Follow these exact steps to launch the system on the internet:

## 1. Prepare Your Database (Supabase)
Since the backend requires PostgreSQL, a free cloud database is the best solution.
1. Go to [Supabase](https://supabase.com) and create a free project.
2. Under **Project Settings > Database**, copy your `Connection string` (URI).
3. Go to your Supabase SQL Editor and run the entire SQL script found in your local file: `backend/database.sql` to initialize your tables.

## 2. Push Code to GitHub
Both Render and Vercel will pull your code directly from GitHub.
1. Open your terminal in the root workspace folder: `C:\Users\User\.gemini\antigravity\brain\efea42d5-e2f1-4aca-ad48-5b27089cfb4a`.
2. Run these commands:
   ```bash
   git init
   git add .
   git commit -m "Initial commit for Hemal TMS"
   git branch -M main
   # Replace the URL below with your actual empty GitHub repository URL
   git remote add origin https://github.com/yourusername/hemal-tms.git
   git push -u origin main
   ```

## 3. Deploy the Backend API (Render)
1. Go to [Render.com](https://render.com) and log in with GitHub.
2. Navigate to your Dashboard and click **"Blueprints"**.
3. Connect your new `hemal-tms` GitHub repository. Render will automatically detect the `backend/render.yaml` file I created.
4. Render will ask for your environment variables. 
   - Paste the Supabase connection string for `DATABASE_URL`.
   - Set a random string for `JWT_SECRET`.
5. Click **Apply**. Once finished, Render will give you a live URL (e.g., `https://hemal-backend.onrender.com`).

## 4. Deploy the Web Panel (Vercel)
1. Go to [Vercel.com](https://vercel.com) and log in with GitHub.
2. Click **"Add New Project"** and import your `hemal-tms` repository.
3. **IMPORTANT**: In the "Framework Preset" settings, set the **Root Directory** to `frontend`.
4. In the **Environment Variables** section, add:
   - Name: `VITE_API_URL`
   - Value: `https://hemal-backend.onrender.com/api` *(replace with your actual Render URL)*
5. Click **Deploy**. Vercel will build the React app and give you a live URL (e.g., `https://hemal-tms.vercel.app`).

---
> [!SUCCESS]
> **Congratulations!** Your system is now live. Employees and Trainers can visit the Vercel link globally, and it will securely communicate with your Render backend and Supabase database.
