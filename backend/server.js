import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { connectDatabase } from './src/config/db.js'
import authRoutes from './src/routes/auth.js'
import userRoutes from './src/routes/users.js'
import teamRoutes from './src/routes/team.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(express.json())

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/teams', teamRoutes)

app.get('/health', (req, res) => {
  res.json({ status: 'Server is running' })
})

// Start server after connecting to database
connectDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
  })
})

