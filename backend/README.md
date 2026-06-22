# IntellMeet Backend API

> 🤖 **AI-Powered Enterprise Meeting & Collaboration Platform Backend**  
> Built with Node.js + Express + MongoDB + Redis + Socket.io + OpenAI

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Redis (local or cloud)

### 1. Clone & Install

```bash
cd backend
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your credentials
```

### 3. Start Development Server

```bash
npm run dev
# Server starts at http://localhost:5000
```

### 4. Seed Demo Data (optional)

```bash
npm run seed
# Creates admin/alice/bob users + demo team + meetings + tasks
```

---

## 🏗️ Architecture

```
backend/
├── src/
│   ├── config/         # DB, Redis, Cloudinary, env validation
│   ├── models/         # 7 Mongoose schemas
│   ├── routes/         # 9 route files (auth, users, meetings...)
│   ├── controllers/    # 9 controllers (full business logic)
│   ├── middleware/     # auth, errorHandler, rateLimiter, validate, upload, logger
│   ├── services/       # AI (OpenAI), email (Nodemailer), token (JWT), cache (Redis)
│   ├── socket/         # Socket.io: meeting, chat, notifications, presence
│   ├── utils/          # apiResponse, asyncHandler, generateMeetingId, sanitize
│   ├── seeders/        # Demo data seeder
│   ├── tests/          # Jest test suites
│   └── app.js          # Express app
└── server.js           # Entry point
```

---

## 🔗 API Endpoints

| Module | Base Path | Key Endpoints |
|--------|-----------|---------------|
| Auth | `/api/auth` | register, login, logout, refresh-token, forgot-password |
| Users | `/api/users` | profile, avatar upload, search, stats |
| Meetings | `/api/meetings` | CRUD, join/leave/end, lock, recording, AI summary |
| Messages | `/api/messages` | chat history, send, reactions |
| Tasks | `/api/tasks` | Kanban CRUD, reorder, comments, attachments |
| Teams | `/api/teams` | workspace management, invite codes, member roles |
| Notifications | `/api/notifications` | list, unread count, mark read |
| AI | `/api/ai` | transcribe, summarize, extract actions |
| Analytics | `/api/analytics` | personal, team, trends, productivity |

> All routes also available at `/api/v1/*` for API versioning.

---

## ⚡ Real-Time Events (Socket.io)

### Namespaces
- `/meeting` — WebRTC signaling + meeting room events
- `/notifications` — Push notifications
- `/presence` — Online/offline status

### Authentication
```javascript
const socket = io('http://localhost:5000/meeting', {
  auth: { token: accessToken }
});
```

### Key Events
```javascript
// Join a meeting room
socket.emit('join-room', { meetingId, userName, avatar });

// WebRTC signaling
socket.emit('offer', { to: socketId, offer });
socket.emit('answer', { to: socketId, answer });
socket.emit('ice-candidate', { to: socketId, candidate });

// Meeting controls
socket.emit('toggle-mute', { meetingId, isMuted: true });
socket.emit('start-screen-share', { meetingId });
socket.emit('chat-message', { meetingId, message, sender });
```

---

## 🔐 Security Features

- ✅ JWT in httpOnly cookies (NOT localStorage)
- ✅ Refresh token rotation on every use
- ✅ Token blacklisting via Redis
- ✅ Helmet security headers
- ✅ MongoDB injection protection (express-mongo-sanitize)
- ✅ XSS sanitization (xss-clean)
- ✅ Rate limiting (general: 100/15min, auth: 10/15min, AI: 20/hr)
- ✅ bcrypt password hashing (saltRounds=12)
- ✅ CORS restricted to frontend URL

---

## 🐳 Docker

```bash
# Development with Docker Compose
docker-compose up -d

# Production build
docker build -t intellmeet-backend .
docker run -p 5000:5000 --env-file .env intellmeet-backend
```

---

## 🧪 Testing

```bash
npm test              # Run all tests with coverage
npm run test:watch    # Watch mode
```

---

## 📋 Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start with nodemon (hot reload) |
| `npm start` | Production start |
| `npm run seed` | Seed demo data |
| `npm test` | Run Jest tests |
| `npm run lint` | ESLint check |

---

## 🌱 Demo Credentials (after `npm run seed`)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@intellmeet.com | Admin@123 |
| Member | alice@intellmeet.com | Alice@123 |
| Member | bob@intellmeet.com | Bob@1234 |

---

## 🔗 Frontend Integration

In your frontend `.env`:
```
VITE_API_URL=http://localhost:5000/api
```

All API calls:
```javascript
// axios config
axios.defaults.baseURL = import.meta.env.VITE_API_URL;
axios.defaults.withCredentials = true; // For httpOnly cookies
```

---

*IntellMeet v2.0 | Zidio Development | 2026*
