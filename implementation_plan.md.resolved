# Production Deployment Plan

To "run live", we need to transition the system from your local machine to the internet so it can be accessed globally. Based on your original requirements, I propose the following deployment stack:

1. **Frontend Web Panel:** Vercel (Free & incredibly fast for React/Vite)
2. **Backend API:** Render (Free tier available for Node.js)
3. **Database:** Supabase PostgreSQL (Free cloud database)

## User Review Required

> [!IMPORTANT]
> **Platform Confirmation:** Do you approve of using **Vercel** for the frontend, **Render** for the backend, and **Supabase** for the database? If you prefer AWS, DigitalOcean, or Netlify, let me know so I can adjust the configuration files.

## Proposed Changes

To prepare the codebase for these live environments, I will:

### 1. Dynamic Environment Variables
Currently, the frontend and mobile apps are hardcoded to look for `http://localhost:5000`. 
- **[MODIFY]** `frontend/src/pages/Certificates.jsx`: Update to use `import.meta.env.VITE_API_URL`.
- **[MODIFY]** `frontend/src/pages/Employees.jsx`: Update to use `import.meta.env.VITE_API_URL`.
- **[MODIFY]** `mobile/lib/services/api_service.dart`: Update to use a configurable base URL.
- **[NEW]** `frontend/.env`: Set default local variables.

### 2. Frontend Deployment Config (Vercel)
- **[NEW]** `frontend/vercel.json`: This configuration ensures that Vercel properly routes all traffic to your React application, preventing "404 Not Found" errors when users refresh the page.

### 3. Backend Deployment Config (Render)
- **[NEW]** `backend/render.yaml`: This Infrastructure-as-Code file allows you to instantly deploy the backend to Render.com with a single click by connecting your GitHub repository.

## Verification Plan
Once I apply these configuration changes, I will provide you with a step-by-step **Deployment Guide** artifact showing you exactly how to push this code to GitHub and connect it to Vercel/Render/Supabase so your system goes completely live.
