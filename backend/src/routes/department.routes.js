import { Router } from 'express'
import { body, param } from 'express-validator'
import {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
} from '../controllers/departmentController.js'
import { authenticate } from '../middleware/authenticate.js'
import { authorizeRole } from '../middleware/authorize.js'
import { validateRequest } from '../middleware/validateRequest.js'

const router = Router()

router.use(authenticate)

router.get('/', authorizeRole('Admin'), getDepartments)

router.get(
  '/:id',
  [authorizeRole('Admin', 'HOD'), param('id').isMongoId(), validateRequest],
  getDepartmentById
)

router.post(
  '/',
  [
    authorizeRole('Admin'),
    body('name').notEmpty().withMessage('Name is required.'),
    body('code').optional().isString(),
    body('hod').optional({ nullable: true }).isMongoId(),
    validateRequest,
  ],
  createDepartment
)

router.put(
  '/:id',
  [
    authorizeRole('Admin'),
    param('id').isMongoId(),
    body('name').optional().notEmpty(),
    body('code').optional().isString(),
    body('hod').optional({ nullable: true }).isMongoId(),
    validateRequest,
  ],
  updateDepartment
)

export default router

