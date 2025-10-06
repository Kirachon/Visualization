import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { 
  createUserSchema, 
  updateUserSchema, 
  passwordResetInitiateSchema, 
  passwordResetCompleteSchema 
} from '../validators/userValidators.js';
import {
  createUser,
  listUsers,
  getUser,
  updateUser,
  deleteUser,
  initiatePasswordReset,
  completePasswordReset,
} from '../controllers/userController.js';

const router = Router();

// Admin-only routes (would need authorization middleware in production)
router.post('/users', validate(createUserSchema), createUser);
router.get('/users', listUsers);
router.delete('/users/:id', deleteUser);

// User routes
router.get('/users/:id', getUser);
router.put('/users/:id', validate(updateUserSchema), updateUser);

// Password reset routes (public)
router.post('/users/password-reset/initiate', validate(passwordResetInitiateSchema), initiatePasswordReset);
router.post('/users/password-reset/complete', validate(passwordResetCompleteSchema), completePasswordReset);

export default router;

