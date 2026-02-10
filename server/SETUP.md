# Backend Setup Guide

## ✅ Step 1: Dependencies Installed
Dependencies are now installed (150 packages).

## 📝 Step 2: Configure Environment Variables

Edit the `.env` file in `server/` folder and replace the placeholder values:

### Get Neon Database URL
1. Go to https://neon.tech
2. Create a free account or login
3. Create a new project
4. Copy the connection string (looks like: `postgresql://username:password@ep-xxxxx.us-east-2.aws.neon.tech/neondb?sslmode=require`)
5. Paste it in `.env` as `DATABASE_URL`

### Get Clerk Secret Key
1. Go to https://dashboard.clerk.com
2. Select your project (or create one)
3. Go to **API Keys** in the sidebar
4. Copy the **Secret Key** (starts with `sk_test_` or `sk_live_`)
5. Paste it in `.env` as `CLERK_SECRET_KEY`

Your `.env` should look like:
```env
DATABASE_URL="postgresql://your_actual_connection_string"
CLERK_SECRET_KEY="sk_test_your_actual_secret_key"
PORT=3001
NODE_ENV="development"
CLIENT_URL="http://localhost:3000"
```

## 🗄️ Step 3: Setup Database

After configuring `.env`, run:

```bash
# Generate Prisma Client
npm run prisma:generate

# Create database tables
npm run prisma:migrate
```

## 🚀 Step 4: Start Server

```bash
npm run dev
```

Server will start on `http://localhost:3001`

## 🧪 Step 5: Test Health Endpoint

### Using curl:
```bash
curl http://localhost:3001/api/health
```

### Using browser:
Open: http://localhost:3001/api/health

### Expected Response:
```json
{
  "status": "ok",
  "timestamp": "2026-02-09T17:07:00.000Z",
  "service": "real-meet-server"
}
```

## 📡 Available Endpoints

- `GET /` - Server info
- `GET /api/health` - Health check (no auth required) ✅
- `POST /api/user/sync` - Sync authenticated user (requires Clerk token)

## ⚠️ Important Notes

- **Cannot start server** until you configure `DATABASE_URL` and `CLERK_SECRET_KEY` in `.env`
- **Cannot run migrations** until `DATABASE_URL` is set
- Health endpoint works without authentication
- User sync endpoint requires Clerk Bearer token

## 🔧 Troubleshooting

**Error: Missing environment variables**
- Make sure `.env` file exists in `server/` folder
- Make sure you replaced placeholder values with actual credentials

**Error: Database connection failed**
- Verify `DATABASE_URL` is correct
- Check your Neon database is active
- Ensure you're using the correct connection string with `?sslmode=require`

**Error: Clerk verification failed**
- Verify `CLERK_SECRET_KEY` is correct
- Make sure you're using the Secret Key, not Publishable Key
- Check that your Clerk project is set up correctly
