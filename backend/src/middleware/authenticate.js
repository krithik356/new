import { verifyToken } from '../config/jwt.js'

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authorization token missing.',
    })
  }

  try {
    const payload = verifyToken(token)
    req.user = {
      id: payload.id,
      role: payload.role,
      department: payload.department ?? null,
    }
    return next()
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.',
    })
  }
}

