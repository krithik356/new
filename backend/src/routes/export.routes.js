import { Router } from 'express'
import { query } from 'express-validator'
import { exportContributions } from '../controllers/exportController.js'
import { authenticate } from '../middleware/authenticate.js'
import { authorizeRole } from '../middleware/authorize.js'
import { validateRequest } from '../middleware/validateRequest.js'

const router = Router()

router.get(
  '/',
  [
    authenticate,
    authorizeRole('Admin'),
    query('cycle').optional().isString(),
    validateRequest,
  ],
  exportContributions
)

export default router

