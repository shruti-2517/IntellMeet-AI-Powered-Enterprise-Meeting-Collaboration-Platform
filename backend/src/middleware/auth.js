import { verifyToken } from '../utils/jwt.js'
import User from '../models/User.js'

export async function authenticate(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing authorization header' })
  }

  const token = header.split(' ')[1]

  try {
    const payload = verifyToken(token)
    const user = await User.findById(payload.userId)
    if (!user) {
      return res.status(401).json({ message: 'Invalid token' })
    }

    req.user = user
    next()
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized access' })
  }
}

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: insufficient permissions' })
    }
    next()
  }
}
