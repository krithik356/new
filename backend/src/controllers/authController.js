import bcrypt from 'bcrypt'
import { User } from '../models/User.js'
import { signToken } from '../config/jwt.js'

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS ?? 10)

export async function login(req, res, next) {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      })
    }

    const user = await User.findOne({ email }).populate('department', 'name code')

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.',
      })
    }

    const passwordMatch = await user.comparePassword(password)

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.',
      })
    }

    const token = signToken({
      id: user.id,
      role: user.role,
      department: user.department?._id ?? null,
    })

    return res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department
            ? {
                id: user.department.id,
                name: user.department.name,
                code: user.department.code,
              }
            : null,
        },
      },
    })
  } catch (error) {
    return next(error)
  }
}

export async function createUser(req, res, next) {
  try {
    const { name, email, password, role, department } = req.body

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, password, and role are required.',
      })
    }

    const existing = await User.findOne({ email })
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Email already in use.',
      })
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)

    const user = await User.create({
      name,
      email,
      passwordHash,
      role,
      department: role === 'HOD' ? department : null,
    })

    return res.status(201).json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
      },
    })
  } catch (error) {
    return next(error)
  }
}

