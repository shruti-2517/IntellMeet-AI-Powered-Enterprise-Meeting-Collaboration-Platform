# Meeting Intelligence Platform

AI-powered meeting collaboration platform with real-time video conferencing, transcription, and meeting intelligence.

## Project Structure

```
.
├── frontend/          # React + TypeScript + Vite application
│   ├── src/          # Source files
│   ├── public/       # Static assets
│   ├── package.json
│   └── vite.config.ts
└── backend/          # Node.js + Express API server
    ├── src/         # Source files
    ├── package.json
    ├── server.js
    └── tsconfig.json
```

## Technology Stack

### Frontend
- React 19 with TypeScript
- Vite for fast development
- Tailwind CSS for styling
- TanStack Query for server state management
- Zustand for client state

### Backend
- Node.js with Express (JavaScript)
- MongoDB with Mongoose
- JWT authentication
- Socket.io for real-time communication
- Redis for caching

## Getting Started

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend will run on `http://localhost:3000`

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```
Backend will run on `http://localhost:5000`

## Environment Configuration

Each folder has an `.env.example` file. Copy and customize:
- `frontend/.env.example` → `frontend/.env`
- `backend/.env.example` → `backend/.env`

## Features

- **User Authentication & Profiles** - Secure signup/login with JWT
- **Real-Time Video Meetings** - Video conferencing with screen sharing
- **AI Meeting Intelligence** - Auto-transcription and summary generation
- **Real-Time Chat** - In-meeting collaboration
- **Post-Meeting Dashboard** - Meeting history and analytics
- **Team Management** - Project boards and task assignment

## Development

Each folder has its own build and development scripts. Refer to individual README files for more details.
