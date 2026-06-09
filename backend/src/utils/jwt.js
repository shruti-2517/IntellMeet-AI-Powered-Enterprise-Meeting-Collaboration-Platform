import jwt from 'jsonwebtoken'

const secret = process.env.JWT_SECRET || 'change_this_secret'
const expiresIn = '8h'

export function createToken(payload) {
  return jwt.sign(payload, secret, { expiresIn })
}

export function verifyToken(token) {
  return jwt.verify(token, secret)
}
