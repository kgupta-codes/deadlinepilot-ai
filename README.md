# 🚀 DeadlinePilot AI

> An AI-powered productivity companion that helps students and professionals stay ahead of deadlines instead of reacting to them.

🌐 **Live Demo:** https://deadlinepilot-ai-1044071676251.asia-south1.run.app

---

# 📖 Overview

Managing multiple assignments, projects, meetings, and deadlines is overwhelming. Traditional task managers only remind users after tasks are already planned.

**DeadlinePilot AI** acts as an intelligent productivity companion that:

- Prioritizes deadlines
- Uses AI to analyze tasks
- Captures work from images and documents
- Integrates with Google Calendar
- Keeps productivity features available even when external AI services are unavailable

---

# ✨ Features

## 🔐 Google Authentication

- Secure Firebase Authentication
- One-click Google Sign In
- Persistent user sessions

---

## 📅 Smart Deadline Management

- Create and organize deadlines
- Track upcoming work
- Priority-based task organization

---

## 🤖 AI Task Analysis

Powered by **Google Gemini**

- Task summarization
- Intelligent insights
- AI-generated recommendations
- Productivity assistance

---

## 📷 Capture Hub

Extract information from:

- Images
- Notes
- Documents

AI converts captured information into actionable tasks.

---

## 📆 Google Calendar Integration

- Connect Google Calendar
- Sync events
- View upcoming schedule
- Stay organized across platforms

---

## ⚡ Modern Dashboard

- Responsive UI
- Clean productivity-focused interface
- Fast performance using Next.js

---

# 🛠 Tech Stack

## Frontend

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Framer Motion

## Backend / Services

- Firebase Authentication
- Cloud Firestore
- Google Gemini API
- Google Calendar API

## Deployment

- Google Cloud Run

---

# 🏗 Architecture

```
                User
                  │
                  ▼
         Next.js Frontend
                  │
      ┌───────────┼────────────┐
      ▼           ▼            ▼
 Firebase      Gemini AI   Google Calendar
 Authentication    API          API
      │
      ▼
 Cloud Firestore
```

---

# 🚀 Getting Started

## Clone the repository

```bash
git clone https://github.com/kgupta-codes/deadlinepilot-ai.git
```

```bash
cd deadlinepilot-ai/frontend
```

## Install dependencies

```bash
npm install
```

## Create environment file

Create:

```
.env.local
```

Add:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=YOUR_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=YOUR_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID=YOUR_PROJECT
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=YOUR_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=YOUR_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID=YOUR_APP_ID

GEMINI_API_KEY=YOUR_GEMINI_KEY

GOOGLE_CALENDAR_CLIENT_ID=YOUR_CLIENT_ID
GOOGLE_CALENDAR_CLIENT_SECRET=YOUR_SECRET
GOOGLE_CALENDAR_COOKIE_SECRET=YOUR_COOKIE_SECRET
```

---

## Run locally

```bash
npm install
npm run dev
```

Open

```
http://localhost:3000
```

---

# 📂 Project Structure

```
frontend/
│
├── app/
├── components/
├── hooks/
├── lib/
├── public/
├── src/
│
├── package.json
└── Dockerfile
```

---

# ☁ Deployment

Deployed on **Google Cloud Run**

Live URL:

https://deadlinepilot-ai-1044071676251.asia-south1.run.app

---

# 🎯 Problem Statement

Students and professionals often struggle with:

- Multiple deadlines
- Missed assignments
- Poor prioritization
- Fragmented productivity tools

DeadlinePilot AI combines AI assistance, task management, and calendar integration into one unified productivity platform.

---

# 🔮 Future Improvements

- AI deadline prediction
- Email integration
- Team collaboration
- Notification system
- Mobile application
- Offline support
- AI productivity analytics

---

# 👨‍💻 Developer

**Kunal Gupta**

B.Tech Student  
Jaypee University of Information Technology

GitHub:
https://github.com/kgupta-codes

---

# 📄 License

This project was developed as part of a hackathon submission.
