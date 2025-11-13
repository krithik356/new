import { Router } from 'express';
import { body } from 'express-validator';

import { login, createUser } from '../controllers/authController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorizeRole } from '../middleware/authorize.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = Router();

// ---------------------------
// Auth Routes
// ---------------------------

router.post(
  '/login',
  
  login
);

// ---------------------------
// Admin: Create User
// ---------------------------

router.post(
  '/users',
  [
    authenticate,
    authorizeRole('Admin'),

    body('name')
      .notEmpty()
      .withMessage('Name is required.'),

    body('email')
      .isEmail()
      .withMessage('Valid email is required.'),

    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters.'),

    body('role')
      .isIn(['Admin', 'HOD'])
      .withMessage('Invalid role.'),

    body('department')
      .optional()
      .isMongoId()
      .withMessage('Invalid department ID.'),

    validateRequest,
  ],
  createUser
);

export default router;
