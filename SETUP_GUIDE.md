# Real-Meet - Project Setup & Running Guide

Welcome to the **Real-Meet** project! This guide will walk you through setting up the entire application (Frontend + Backend + Database) on your local machine.

## 1. Prerequisites

Before you begin, ensure you have the following installed:

*   **Node.js**: Version **20.x** or higher (required for Next.js 16).
    *   To check: `node -v`
*   **npm**: Installed automatically with Node.js.
*   **Git**: To clone the repository.
*   **PostgreSQL Compatible Database URL**: You should have received a **Neon Database Connection String** separately.

---

## 2. Cloning the Repository

Open your terminal and run the following commands:

```bash
# Clone the repository
git clone <repository-url>

# Navigate into the project folder
cd real-meet

# Pull the latest changes to ensure you are on the main branch
git pull origin main
```

**Verify the structure:**
You should see two main folders:
- `client/launch-ui` (Frontend)
- `server` (Backend)

---

## 3. Database Setup (Neon)

This project uses **Prisma ORM** with a **Neon (PostgreSQL)** database.

1.  Get the **Database Connection String** from the Neon Dashboard (or ask the project owner).
2.  It will look like this: `postgresql://user:password@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require`

You will use this string in the **Server Setup** step below.

---

## 4. Server Setup (Backend)

The backend handles API requests, real-time sockets, and database interactions.

### Step 4.1: Install Dependencies

```bash
# Navigate to the server folder
cd server

# Install dependencies
npm install
```

### Step 4.2: Configure Environment Variables

1.  Create a file named `.env` in the `server` folder.
2.  Copy the following content into it and fill in the values:

```env
# --- Database ---
# Replace with your actual Neon connection string
DATABASE_URL="postgresql://user:password@..."

# --- Authentication (Clerk) ---
# Replace with the provided Clerk Secret Key
CLERK_SECRET_KEY="sk_test_..."

# --- Server Configuration ---
PORT=3001
NODE_ENV="development"
CLIENT_URL="http://localhost:3000"
```

### Step 4.3: Initialize Database

Run the following command to generate the Prisma client:

```bash
npx prisma generate
```

*(Optional) If you need to push schema changes to the DB:*
```bash
npx prisma db push
```

### Step 4.4: Start the Server

```bash
npm run dev
```

You should see:
> `Server running on port 3001`
> `Database connected successfully`

**Keep this terminal open.**

---

## 5. Client Setup (Frontend)

The frontend is a Next.js 16 application.

### Step 5.1: Install Dependencies

Open a **new terminal** window (do not close the server terminal).

```bash
# Navigate to the client folder from the root
cd client/launch-ui

# Install dependencies
npm install
```

### Step 5.2: Configure Environment Variables

1.  Create a file named `.env.local` in the `client/launch-ui` folder.
2.  Copy the following content:

```env
# --- Authentication (Clerk) ---
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

# --- Backend API URL ---
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

### Step 5.3: Start the Client

```bash
npm run dev
```

You should see:
> `Ready in Xms`
> `Local: http://localhost:3000`

---

## 6. Validation & Troubleshooting

### How to Check It's Working
1.  Open **[http://localhost:3000](http://localhost:3000)** in your browser.
2.  You should see the Landing Page / Dashboard.
3.  **Sign In**: Use Clerk authentication (Google/Email).
4.  **Create Meeting**: Click "New Meeting" -> It should redirect you to a meeting room.
5.  **Check Console**:
    -   Browser Console: Should show `Socket connected`.
    -   Server Terminal: Should show `Client connected`.

### Common Issues

| Issue | Solution |
| :--- | :--- |
| **Port 3001 already in use** | The server script tries to kill port 3001 automatically. If it fails, manually kill the process or restart your PC. |
| **Database Connection Error** | Double-check your `DATABASE_URL` in `server/.env`. Ensure you have internet access (Neon is cloud-based). |
| **CORS Errors** | Ensure `CLIENT_URL` in `server/.env` is set exactly to `http://localhost:3000` (no trailing slash). |
| **"Module not found"** | Ensure you ran `npm install` in **BOTH** `client/launch-ui` and `server` folders. |
| **Prisma Clients Errors** | Run `npx prisma generate` inside the `server` folder. |

---

### Final Checklist
- [ ] Server running on port 3001
- [ ] Client running on port 3000
- [ ] Database connected
- [ ] `.env` files created in both folders
