# Frontend - Meeting Intelligence Platform

React + TypeScript application for the Meeting Intelligence Platform with Vite as the build tool.

## Features
- Modern React 19 setup with TypeScript
- Vite for lightning-fast HMR and builds
- Tailwind CSS for responsive styling
- TanStack Query for server state management
- Zustand for client-side state
- API proxy configuration to backend

## Quick Start

```bash
npm install
npm run dev
```

App will run on `http://localhost:3000`

## Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Folder Structure
```
src/
├── App.tsx        # Root component
├── main.tsx       # Entry point
└── index.css      # Global styles
```

## Environment Variables
Copy `.env.example` to `.env` and customize:
```
VITE_API_BASE_URL=http://localhost:5000
VITE_ENV=development
```
