import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'

import authRoutes from './routes/auth.routes.js'
import departmentRoutes from './routes/department.routes.js'
import employeeRoutes from './routes/employee.routes.js'
import contributionRoutes from './routes/contribution.routes.js'
import exportRoutes from './routes/export.routes.js'

import { connectDB, disconnectDB } from './config/db.js'
import { notFound, errorHandler } from './middleware/errorHandler.js'

const app = express()
const PORT = process.env.PORT ?? 5000

const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}

app.use(cors(corsOptions))
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header(
    'Access-Control-Allow-Methods',
    'GET,POST,PUT,PATCH,DELETE,OPTIONS'
  )
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204)
  }

  return next()
})

// app.use(cors());
// app.options('*', cors()); // handle preflight

app.use(helmet())
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

if (process.env.NODE_ENV !== 'test') {
  app.use(
    morgan('dev', {
      skip: () => process.env.NODE_ENV === 'production',
    })
  )
}

app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    data: {
      service: 'Employee Contribution Automation API',
      timestamp: new Date().toISOString(),
    },
  })
})

app.use('/api/auth', authRoutes)
app.use('/api/departments', departmentRoutes)
app.use('/api/employees', employeeRoutes)
app.use('/api/contributions', contributionRoutes)
app.use('/api/contributions/export', exportRoutes)

// app.use(notFound)
// app.use(errorHandler)

async function startServer() {
  try {
    await connectDB()

    const server = app.listen(PORT, () => {
      console.log(`Server listening on http://localhost:${PORT}`)
    })

    const shutdown = async () => {
      server.close(async () => {
        await disconnectDB()
        process.exit(0)
      })
    }

    process.on('SIGINT', shutdown)
    process.on('SIGTERM', shutdown)
  } catch (error) {
    console.error('Failed to start server', error)
    process.exit(1)
  }
}

if (process.env.NODE_ENV !== 'test') {
  startServer()
}

export { startServer }
export default app
