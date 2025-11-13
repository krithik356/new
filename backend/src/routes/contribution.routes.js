import { Router } from 'express'
import { body, param, query } from 'express-validator'
import {
  listContributions,
  getContributionByDepartment,
  createContribution,
  updateContribution,
  deleteContribution,
} from '../controllers/contributionController.js'
import { authenticate } from '../middleware/authenticate.js'
import { authorizeRole } from '../middleware/authorize.js'
import { validateRequest } from '../middleware/validateRequest.js'

const router = Router()

router.use(authenticate)

router.get(
  '/all',
  [
    authorizeRole('Admin'),
    query('cycle').optional().isString(),
    validateRequest,
  ],
  listContributions
)

router.get(
  '/department/:departmentId',
  [
    authorizeRole('Admin', 'HOD'),
    param('departmentId').isMongoId(),
    validateRequest,
  ],
  getContributionByDepartment
)

router.post(
  '/',
  [
    authorizeRole('HOD'),
    body('department').isMongoId().withMessage('Department is required.'),
    body('academy').isNumeric().withMessage('Academy must be numeric.'),
    body('intensive').isNumeric().withMessage('Intensive must be numeric.'),
    body('niat').isNumeric().withMessage('NIAT must be numeric.'),
    body('remarks').optional().isString(),
    body('cycle').optional().isString(),
    validateRequest,
  ],
  createContribution
)

router.put(
  '/:id',
  [
    authorizeRole('Admin', 'HOD'),
    param('id').isMongoId(),
    body('academy').optional().isNumeric(),
    body('intensive').optional().isNumeric(),
    body('niat').optional().isNumeric(),
    body('remarks').optional().isString(),
    body('cycle').optional().isString(),
    validateRequest,
  ],
  updateContribution
)

router.delete(
  '/:id',
  [authorizeRole('Admin'), param('id').isMongoId(), validateRequest],
  deleteContribution
)

export default router

