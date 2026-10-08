# Zoom Clone — Free-Tier Production Deployment & Setup Guide

A production-ready full-stack Zoom Clone built with **Next.js (App Router)**, **FastAPI**, **SQLAlchemy**, **SQLite**, and **LiveKit WebRTC SFU**.

---

## 🏗 Deployment Architecture Overview (100% Free-Tier)

| Component | Platform | Free-Tier Specs |
|---|---|---|
| **Frontend** | [Vercel](https://vercel.com) | Hobby Plan (Free SSL, Edge CDN, Global Routing) |
| **Backend** | [Railway](https://railway.app) | Free / Starter Tier (FastAPI, Python 3.10+ / Nixpacks, $PORT dynamic binding) |
| **Database** | SQLite on Railway Volume | Persistent Volume mounted at `/data/meetings.db` (Free 1GB storage on Railway) |
| **Realtime Video SFU** | [LiveKit Cloud](https://livekit.io/cloud) | Build/Free Tier (50 GB bandwidth/month, 100 concurrent participants, Global SFU mesh) |

> ⚠️ **Security Notice**: Never expose `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, or `DATABASE_URL` to browser-side code. Only `NEXT_PUBLIC_API_URL` is exposed to the frontend.

```
┌─────────────────────────────────────────────────────────────┐
│                   Next.js Frontend (Vercel)                 │
│              https://your-zoom-clone.vercel.app             │
└──────────────┬──────────────────────────────▲───────────────┘
               │                              │
               │ REST API (JSON)              │ WebRTC SFU Media Tracks
               │                              │ (Audio / Video / Data)
               ▼                              │
┌──────────────────────────────┐              │
│    FastAPI Backend (Railway) │              │
│    https://api.railway.app   │              │
└──────────────┬───────────────┘              │
               │                              │
       ┌───────┴────────┐                     │
       ▼                ▼                     │
┌──────────────┐ ┌────────────────┐           │
│ Persistent   │ │ LiveKit Cloud  │───────────┘
│ Volume /data │ │ Project / SFU  │
│ meetings.db  │ │ wss://*.livekit│
└──────────────┘ └────────────────┘
```

---

## 🔑 Environment Variables Checklist

### Backend Environment Variables (Railway)

| Variable | Description | Example / Production Value |
|---|---|---|
| `DATABASE_URL` | SQLite database URI on persistent disk | `sqlite:////data/meetings.db` |
| `LIVEKIT_URL` | LiveKit Cloud WebSocket URL | `wss://<project-subdomain>.livekit.cloud` |
| `LIVEKIT_API_KEY` | LiveKit Cloud API Key | `APInonczxxxxxxxx` |
| `LIVEKIT_API_SECRET`| LiveKit Cloud API Secret | `sec_xxxxxxxxxxxxxxxxxxxxxxxx` |
| `FRONTEND_URL` | Allowed frontend origin for CORS | `https://your-zoom-clone.vercel.app` |
| `PORT` | Provided automatically by Railway | *Managed by Railway automatically* |

### Frontend Environment Variables (Vercel)

| Variable | Description | Example / Production Value |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Public base URL to FastAPI API | `https://<your-railway-app>.up.railway.app/api` |

---

## 🚀 Step-by-Step Production Deployment

### Step 1: LiveKit Cloud Setup (Real-Time Audio/Video)

1. Sign up for a free account at [LiveKit Cloud](https://cloud.livekit.io).
2. Create a new project (e.g., `zoom-clone-prod`).
3. In the project dashboard under **Settings / Keys**:
   - Copy your **WebSocket URL** (`wss://your-project.livekit.cloud`)
   - Generate and copy your **API Key** (`API...`)
   - Copy your **API Secret** (`sec_...`)
4. Keep these values secure for the backend configuration.

---

### Step 2: Railway Backend Deployment & Persistent Storage

1. Sign up / Log in to [Railway](https://railway.app).
2. Click **New Project** → **Deploy from GitHub repo** and select your repository.
3. In the Service Settings:
   - **Root Directory**: Set to `/backend` (or leave at `/` if deploying full repo using the included root `Procfile`/`railway.json`).
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}`
4. **Attach Persistent Volume (Crucial for SQLite data durability)**:
   - Go to your service's **Volume** tab (or click **+ Volume** in project canvas).
   - Mount path: `/data`
   - Volume name: `meetings-data`
5. **Set Environment Variables**:
   In the **Variables** tab, add:
   ```env
   DATABASE_URL=sqlite:////data/meetings.db
   LIVEKIT_URL=wss://<your-livekit-subdomain>.livekit.cloud
   LIVEKIT_API_KEY=<your-livekit-api-key>
   LIVEKIT_API_SECRET=<your-livekit-api-secret>
   FRONTEND_URL=https://<your-vercel-app>.vercel.app
   ```
6. Click **Deploy**.
7. In the **Settings** tab under **Networking**, click **Generate Domain** (e.g. `zoom-backend-production.up.railway.app`).
8. Verify deployment by visiting `https://<your-railway-app>.up.railway.app/health`.
   - Expected response: `{"status":"ok"}`.

---

### Step 3: Vercel Frontend Deployment

1. Sign up / Log in to [Vercel](https://vercel.com).
2. Click **Add New...** → **Project** and import your GitHub repository.
3. In the project setup screen:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
4. Expand **Environment Variables** and add:
   ```env
   NEXT_PUBLIC_API_URL=https://<your-railway-app>.up.railway.app/api
   ```
5. Click **Deploy**.
6. Once deployed, note your Vercel URL (e.g., `https://zoom-clone-app.vercel.app`).
7. Update the `FRONTEND_URL` variable in your Railway dashboard to match this exact URL without trailing slash.

---

### Step 4: Database Initialization & Idempotent Seeding

1. **Automatic Schema Creation**:
   - The backend automatically creates all required tables (`users`, `meetings`, `meeting_participants`) on startup via SQLAlchemy `create_all`.
2. **Idempotent Sample Data Seeding**:
   - Run the seed script directly on Railway using Railway CLI or one-off command:
     ```bash
     python backend/seed.py
     ```
   - Alternatively, you can run `python seed.py` locally against your development DB.
   - The seed process is strictly idempotent and will never duplicate users or sample meetings on restarts.

---

## 💻 Local Development Workflow

### 1. Prerequisites
- Node.js 18+ & npm
- Python 3.9+ & venv

### 2. Backend Setup
```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run idempotent database seed
python seed.py

# Start FastAPI dev server
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### 3. Frontend Setup
```bash
# From repository root
npm install

# Start Next.js dev server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Optional Local LiveKit Server
For offline/local WebRTC testing without LiveKit Cloud:
```bash
# Run local LiveKit server (default devkey / secret)
.\livekit-bin\livekit-server.exe --dev
```

---

## 🧪 Production Verification & Testing Checklist

After deploying to Vercel and Railway, verify each flow:

- [ ] **Health Endpoint**: Open `https://<backend>/health` → returns `{"status":"ok"}`.
- [ ] **Dashboard Load**: Open `https://<frontend>` → loads Navbar, Profile, Upcoming & Recent meetings.
- [ ] **Instant Meeting**: Click "New Meeting" → generates 10-character code, creates database record, and enters Pre-Join screen.
- [ ] **Schedule Meeting**: Click "Schedule", fill in topic/date/time → returns shareable invite link and displays in Upcoming Meetings.
- [ ] **Join via Link / ID**: Paste invite link into another browser window → verifies meeting exists and connects.
- [ ] **Live Audio/Video SFU**: Both participants publish camera & microphone and see each other's remote stream in real time.
- [ ] **Host Controls**: Host can "Mute All" or "Remove Participant"; non-hosts do not have kick permissions.
- [ ] **Leave Flow**: Click "Leave" → disconnects WebRTC session, updates SQLite records, and redirects to dashboard.
