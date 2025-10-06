import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authController } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { loginSchema } from '../validators/authValidators.js';

const router = Router();

// Stricter rate limiting for login endpoint
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: 'Too many login attempts from this IP, please try again after 15 minutes.',
  skipSuccessfulRequests: true, // Don't count successful requests
});

// Public routes
router.post('/login', loginLimiter, validate(loginSchema), authController.login.bind(authController));
router.post('/logout', authController.logout.bind(authController));
router.post('/refresh', authController.refresh.bind(authController));

// Protected routes
router.get('/me', authenticate, authController.me.bind(authController));

export default router;

