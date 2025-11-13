import { Router } from 'express'
import { body, query } from 'express-validator'
import { listEmployees, seedEmployees } from '../controllers/employeeController.js'
import { authenticate } from '../middleware/authenticate.js'
import { authorizeRole } from '../middleware/authorize.js'
import { validateRequest } from '../middleware/validateRequest.js'

const router = Router()

router.use(authenticate)

router.get(
  '/',
  // [
  //   authorizeRole('Admin', 'HOD'),
  //   query('department').optional().isMongoId(),
  //   validateRequest,
  // ],
  listEmployees
)

router.post(
  '/seed',
  [
    authorizeRole('Admin'),
    body('employees').isArray({ min: 1 }).withMessage('Employees array required.'),
    validateRequest,
  ],
  seedEmployees
)

export default router

