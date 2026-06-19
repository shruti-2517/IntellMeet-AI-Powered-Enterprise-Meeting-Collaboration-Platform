import mongoose from 'mongoose'

const uri =
  process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/intellmeet'

export async function connectDatabase() {
  try {
    await mongoose.connect(uri)

    console.log('MongoDB connected')
  } catch (error) {
    console.error('MongoDB connection error:', error)
    process.exit(1)
  }
}