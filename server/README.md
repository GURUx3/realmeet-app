# Real-Meet Backend Server

Production-ready backend server for the Real-Meet application with PostgreSQL (Neon), Prisma ORM, and Clerk authentication.

## 🏗️ Architecture

```
server/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── config/
│   │   └── env.ts             # Environment configuration & validation
│   ├── database/
│   │   └── client.ts          # Prisma client singleton
│   ├── middleware/
│   │   └── auth.ts            # Clerk authentication middleware
│   ├── services/
│   │   ├── clerk.service.ts   # Clerk API integration
│   │   └── user.service.ts    # User business logic
│   ├── controllers/
│   │   └── user.controller.ts # HTTP request handlers
│   ├── routes/
│   │   ├── index.ts           # Route aggregator
│   │   └── user.routes.ts     # User endpoints
│   ├── types/
│   │   └── index.ts           # TypeScript types
│   ├── app.ts                 # Express app configuration
│   └── index.ts               # Server entry point
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## 🚀 Setup Instructions

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `server/` directory:

```bash
cp .env.example .env
```

Update the `.env` file with your credentials:

```env
# Get this from your Neon dashboard: https://neon.tech
DATABASE_URL="postgresql://username:password@host/database?sslmode=require"

# Get this from your Clerk dashboard: https://dashboard.clerk.com
CLERK_SECRET_KEY="sk_test_..."

# Server configuration
PORT=3001
NODE_ENV="development"

# Frontend URL (for CORS)
CLIENT_URL="http://localhost:3000"
```

### 3. Set Up Database

Generate Prisma client:

```bash
npm run prisma:generate
```

Run database migrations:

```bash
npm run prisma:migrate
```

### 4. Start Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3001`

## 📡 API Endpoints

### Health Check

```
GET /api/health
```

Returns server health status.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-09T17:00:00.000Z",
  "service": "real-meet-server"
}
```

### User Sync

```
POST /api/user/sync
```

Synchronizes authenticated Clerk user with the database. This endpoint is idempotent - calling it multiple times will not create duplicate users.

**Headers:**
```
Authorization: Bearer <clerk_session_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "user_2a1b3c4d5e6f7g8h",
    "email": "user@example.com",
    "name": "John Doe",
    "imageUrl": "https://img.clerk.com/...",
    "createdAt": "2026-02-09T17:00:00.000Z",
    "updatedAt": "2026-02-09T17:00:00.000Z"
  }
}
```

**Response (401):**
```json
{
  "error": "Unauthorized",
  "message": "Missing or invalid authorization header"
}
```

## 🔐 Authentication Flow

```
┌─────────┐                  ┌─────────┐                  ┌──────────┐
│ Client  │                  │ Backend │                  │ Database │
└────┬────┘                  └────┬────┘                  └────┬─────┘
     │                            │                            │
     │  1. Login with Clerk       │                            │
     ├──────────────────────────► │                            │
     │                            │                            │
     │  2. POST /api/user/sync    │                            │
     │     (with Bearer token)    │                            │
     ├───────────────────────────►│                            │
     │                            │                            │
     │                            │  3. Verify token (Clerk)   │
     │                            ├─────────────►              │
     │                            │              │             │
     │                            │  4. Fetch user from Clerk  │
     │                            ├─────────────►              │
     │                            │              │             │
     │                            │  5. Upsert user            │
     │                            ├─────────────────────────────►
     │                            │                            │
     │                            │  6. Return user record     │
     │                            │◄───────────────────────────┤
     │                            │                            │
     │  7. Return synced user     │                            │
     │◄───────────────────────────┤                            │
     │                            │                            │
```

### Implementation Details

1. **Client Authentication**: User logs in via Clerk on the frontend
2. **Request to Backend**: Client sends authenticated request with Clerk session token
3. **Token Verification**: Backend middleware verifies token with Clerk
4. **User Data Fetch**: Backend fetches user profile from Clerk API
5. **Database Sync**: Backend upserts user into PostgreSQL database
   - If user exists: returns existing record (no changes)
   - If user doesn't exist: creates new record
6. **Response**: Returns database user record to client

This flow is **idempotent** - subsequent calls with the same user will not create duplicates.

## 🔧 Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build production bundle
- `npm run start` - Start production server
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio (database GUI)

## 🗄️ Database Schema

### User Table

| Column    | Type      | Constraints          | Description           |
|-----------|-----------|----------------------|-----------------------|
| id        | String    | PRIMARY KEY          | Clerk userId          |
| email     | String    | UNIQUE, NOT NULL     | User email            |
| name      | String    | NULLABLE             | User full name        |
| imageUrl  | String    | NULLABLE             | User profile image    |
| createdAt | DateTime  | DEFAULT now()        | Account creation time |
| updatedAt | DateTime  | AUTO-UPDATED         | Last update time      |

**Note:** No authentication-related fields are stored. All auth is handled by Clerk.

## 🛡️ Security Features

- ✅ Environment variable validation on startup
- ✅ Clerk Bearer token verification on protected routes
- ✅ CORS configuration with whitelisted origins
- ✅ Request logging in development mode
- ✅ Global error handling with sanitized production errors
- ✅ Graceful shutdown handling
- ✅ Database connection pooling

## 🔮 Future Expansion

The database schema is designed to support future features:

- Meetings table (with foreign key to users)
- Participants table (many-to-many: users ↔ meetings)
- Messages/chat history
- Recording metadata
- User preferences/settings

The architecture separates concerns cleanly, allowing you to:

- Add new routes without touching authentication
- Switch database providers by changing Prisma datasource
- Add new authentication providers alongside Clerk
- Implement additional business logic in service layer

## 📝 Client Integration Example

```typescript
// After user logs in with Clerk
import { useAuth } from '@clerk/nextjs';

async function syncUserWithBackend() {
  const { getToken } = useAuth();
  const token = await getToken();

  const response = await fetch('http://localhost:3001/api/user/sync', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();
  console.log('User synced:', data);
}
```

## 🐛 Troubleshooting

### Database connection issues

- Verify your `DATABASE_URL` is correct in `.env`
- Ensure your Neon database is running
- Check network connectivity to Neon

### Authentication errors

- Verify `CLERK_SECRET_KEY` is correct
- Ensure the token is passed in `Authorization: Bearer <token>` format
- Check that the Clerk project is configured correctly

### Migration errors

- Delete `prisma/migrations/` folder and run `npm run prisma:migrate` again
- Ensure database credentials are correct
- Check that the database user has proper permissions

## 📚 Tech Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL (Neon)
- **ORM**: Prisma
- **Authentication**: Clerk
- **Development**: tsx (TypeScript execution)

## 🎯 Production Deployment

1. Set `NODE_ENV=production` in your environment
2. Build the application: `npm run build`
3. Start the server: `npm start`
4. Ensure all environment variables are configured
5. Run migrations on production database: `npm run prisma:migrate`

---

**Built with ❤️ for Real-Meet**
