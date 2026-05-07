# Smart Finance Tracker

A modern, full-stack personal finance tracker with AI-powered insights, budget planning, and goal tracking.

## Features

- **Authentication**: Secure Google and Email/Password login via Firebase.
- **Financial Dashboard**: Real-time overview of your balance, income, expenses, and cashflow.
- **AI Insights**: Automated financial advice and pattern detection using Gemini AI.
- **Transactions**: Full CRUD for transactions with receipt photo upload.
- **Budget Planner**: Monthly budget settings per category with progress monitoring.
- **Savings Goals**: Track your progress towards major purchases or life events.
- **Debts & Loans**: Keep track of your obligations and receivables.
- **Modern UI**: Dark mode, glassmorphism, and smooth animations with TailwindCSS and Framer Motion.

## Tech Stack

- **Frontend**: React, Vite, TypeScript, TailwindCSS, Zustand, React Router, Recharts, Framer Motion.
- **Backend**: Express (Node.js), Gemini AI API.
- **Database & Auth**: Firebase Firestore, Firebase Auth, Firebase Storage.

## Setup Instructions

### 1. Firebase Setup
- Create a new project at [Firebase Console](https://console.firebase.google.com/).
- Enable **Authentication** (Email/Password and Google).
- Create a **Firestore Database** in your preferred region.
- Create a **Storage Bucket**.
- Register a web app and copy the configuration to `firebase-applet-config.json`.

### 2. Environment Variables
Create a `.env` file based on `.env.example`:
```env
GEMINI_API_KEY="your_gemini_api_key"
```

### 3. Local Development
```bash
npm install
npm run dev
```

### 4. GitHub Setup
- Initialize git: `git init`
- Add files: `git add .`
- Commit: `git commit -m "Initial commit"`
- Create a repo on GitHub and push.

### 5. Deployment (Vercel)
- Connect your GitHub repo to Vercel.
- Set the environment variable `GEMINI_API_KEY`.
- Vercel will automatically detect the Vite project and deploy.
- Ensure the `vercel.json` is configured if you need custom routing (though standard Vite + Express boilerplate usually works with Vercel's Serverless Functions if configured correctly, but for this specific environment, it's already cloud-run ready).

## Folder Structure
- `src/components`: Reusable UI components.
- `src/pages`: Main application pages.
- `src/services`: API services (like AI insights).
- `src/store.ts`: Zustand state management.
- `src/firebase`: Firebase configuration and utilities.
- `server.ts`: Express backend serving the API and the SPA.
