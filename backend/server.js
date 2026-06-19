import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import './src/config/redis.js'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { connectDatabase } from './src/config/db.js'
import { authenticate } from './src/middleware/auth.js'
import authRoutes from './src/routes/auth.js'
import userRoutes from './src/routes/users.js'
import teamRoutes from './src/routes/team.js'
import meetingRoutes from './src/routes/meetings.js'
import chatRoutes from './src/routes/chat.js'
import { saveMessage } from './src/controllers/chatController.js'
import notificationRoutes from './src/routes/notifications.js'
import { createNotification } from './src/controllers/notificationController.js'


dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(express.json())

// REST API Routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/teams', teamRoutes)
app.use('/api/meetings', authenticate, meetingRoutes)
app.use('/api/chat', authenticate, chatRoutes)
app.use('/api/notifications', authenticate, notificationRoutes)

app.get('/health', (req, res) => {
  res.json({ status: 'Server is running' })
})

// Wrap Express in HTTP server so Socket.io can attach
const httpServer = createServer(app)

// Socket.io server
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
})

// ─── Socket.io Events ────────────────────────────────────
io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id)


  // Each user joins their own personal room for targeted notifications
  socket.on('register-user', (userId) => {
    socket.join(`user:${userId}`)
    console.log(`User ${userId} registered for notifications`)
  })

  // Join a meeting room (triggers WebRTC peer discovery)
  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId)
    socket.to(roomId).emit('user-connected', userId)
    console.log(`User ${userId} joined room ${roomId}`)
  })

  // WebRTC signaling: offer from caller
  socket.on('offer', ({ roomId, offer }) => {
    socket.to(roomId).emit('offer', offer)
  })

  // WebRTC signaling: answer from receiver
  socket.on('answer', ({ roomId, answer }) => {
    socket.to(roomId).emit('answer', answer)
  })

  // WebRTC signaling: ICE candidates
  socket.on('ice-candidate', ({ roomId, candidate }) => {
    socket.to(roomId).emit('ice-candidate', candidate)
  })

  // In-meeting chat message
   socket.on('send-message', async ({ roomId, userId, userName, message, meetingId }) => {
    const msgData = {
      userId,
      userName,
      message,
      timestamp: new Date().toISOString(),
    }
    // Broadcast to everyone in the room
    io.to(roomId).emit('receive-message', msgData)

    // Persist to MongoDB for history
    await saveMessage(roomId, userId, userName, message, meetingId)
  })

  // Typing indicators
  socket.on('typing', ({ roomId, userName }) => {
    socket.to(roomId).emit('user-typing', userName)
  })
  socket.on('stop-typing', ({ roomId }) => {
    socket.to(roomId).emit('user-stop-typing')
  })

  // Mute / unmute broadcast
  socket.on('toggle-mute', ({ roomId, userId, isMuted }) => {
    socket.to(roomId).emit('participant-muted', { userId, isMuted })
  })

  // Screen share start/stop
  socket.on('screen-share-start', ({ roomId, userId }) => {
    socket.to(roomId).emit('screen-share-started', { userId })
  })
  socket.on('screen-share-stop', ({ roomId, userId }) => {
    socket.to(roomId).emit('screen-share-stopped', { userId })
  })

  // User disconnects from room
  socket.on('leave-room', ({ roomId, userId }) => {
    socket.leave(roomId)
    socket.to(roomId).emit('user-disconnected', userId)
  })

  // Socket fully disconnects
  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id)
    socket.broadcast.emit('user-disconnected', socket.id)
  })
})

// Start DB then server
connectDatabase().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
  })
})