# Deployment Guide for Real-Meet

## Overview
Deploying "Real-Meet" is **moderately easy**. 
- **Frontend** (Next.js): Very easy (Vercel).
- **Backend** (Node.js + Socket.io): Requires a persistent server (Railway/Render).
- **Database** (PostgreSQL): Easy (Neon/Railway).
- **Video Calls**: Depends on network. For 100% reliability, you might need a TURN server later, but STUN works for most simple cases.

---

## Recommended Stack (Free/Cheap Tier)

| Component | Service | Cost | Why? |
| :--- | :--- | :--- | :--- |
| **Frontend** | **Vercel** | Free | Built by Next.js creators, zero config. |
| **Backend** | **Railway** or **Render** | ~$5/mo (Free tiers exist but spin down) | Supports persistent Node.js processes needed for WebSockets. |
| **Database** | **Neon** or **Railway** | Free | Excellent Postgres tier. |
| **Auth** | **Clerk** | Free | You are already using it. |

---

## Step-by-Step Deployment

### 1. Database (Neon or Railway)
1.  Create a project on [Neon.tech](https://neon.tech) or [Railway.app](https://railway.app).
2.  Get the `DATABASE_URL`.
3.  Replace the `DATABASE_URL` in your local [.env](cci:7://file:///c:/Users/guru_21/real-meet/server/.env:0:0-0:0) and run `npx prisma db push` to verify schema.

### 2. Backend (Server)
1.  Push your code to GitHub.
2.  Go to **Railway** or **Render**.
3.  Create a **New Service** from your GitHub Repo.
4.  **Root Directory**: Set to `server`.
5.  **Build Command**: `npm install && npx prisma generate && npm run build`
6.  **Start Command**: `npm start`
7.  **Environment Variables**: Add these in the dashboard:
    -   `DATABASE_URL`: (From Step 1)
    -   `PORT`: `8000` (or whatever the host assigns)
    -   `CLERK_SECRET_KEY`: (From your local .env)
    -   `CORS_ORIGIN`: `https://your-frontend-url.vercel.app` (You fill this after Step 3, momentarily allow `*`)

### 3. Frontend (Client)
1.  Go to **Vercel**.
2.  Import the same GitHub Repo.
3.  **Root Directory**: Set to `client/launch-ui`.
4.  **Environment Variables**:
    -   `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: (From your local .env)
    -   `CLERK_SECRET_KEY`: (From your local .env)
    -   `NEXT_PUBLIC_API_URL`: **The URL of your Backend** from Step 2 (e.g., `https://real-meet-server.up.railway.app`).
5.  Deploy!

### 4. Final Wiring
1.  Go back to your **Backend Service**.
2.  Update `CORS_ORIGIN` to match your new Vercel domain (e.g., `https://real-meet.vercel.app`) to block unauthorized use.

---

## "How hard is it?" 
**Rating: 4/10**
It is not one-click, but it is standard. The main "gotcha" is connecting the Frontend to the Backend via the `NEXT_PUBLIC_API_URL`.

### Connection Issues?
If video connects on localhost but fails online:
-   **Firewalls**: Some corporate/school networks block WebRTC.
-   **Solution**: You would need a **TURN Server** (e.g., Twilio Network Traversal Service). This costs money (usage-based), so stick to free STUN servers (already in your code) for personal projects.