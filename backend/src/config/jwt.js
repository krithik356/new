import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET ?? 'change_me'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '7d'

export function signToken(payload, options = {}) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    ...options,
  })
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET)
}

