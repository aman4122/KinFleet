# VahanTrack

A comprehensive, production-ready, mobile-responsive web application utilizing the MERN Stack (MongoDB, Express.js, React.js, Node.js) engineered for the Indian automotive ecosystem.

## Features
- **Vehicle Lifecycle Management:** Track services, PUC, and insurance with automated background reminders.
- **Offline PWA SOS Module:** One-tap emergency broadcast that automatically sends WhatsApp alerts to family and fleet managers. Caches triggers when offline.
- **Purchase Recommendation Widget:** Smart AI-like wizard for filtering Indian vehicles based on budget and daily commute (recommending Petrol/EV vs Diesel/Hybrid).
- **Family Fleet Model:** Shared fleet ID allowing multiple family members to log in independently but view shared vehicles.
- **Trip & Toll Tracker:** Log interstate trips and FASTag/Toll expenses easily.
- **Indian Localization:** ₹ formatting (Lakhs/Crores), DD/MM/YYYY dates, and strict VIN/RTO regex validation.

## Tech Stack
- **Frontend:** React (Vite), Tailwind CSS v4, Shadcn/UI, React Router v6.
- **Backend:** Node.js, Express, MongoDB Atlas (Mongoose).
- **Jobs & Notifications:** node-cron (for daily 6 AM IST compliance checks) and Twilio WhatsApp API.
- **Security:** JWT (HttpOnly cookies), bcryptjs.

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm run install:all
   ```
3. Set up environment variables:
   Copy `.env.example` to `.env` and fill in your MongoDB URI, JWT Secrets, and Twilio credentials.
4. Run locally:
   ```bash
   npm run dev
   ```
   This will start both the Express backend (port 5000) and the Vite frontend (port 5173).

## Production Deployment
- **Frontend:** Deploy the `client/` folder to Vercel. Ensure environment variables are set.
- **Backend:** Deploy the `server/` folder to Render or Railway. Set production env variables including `CLIENT_URL`.

## License
MIT License
