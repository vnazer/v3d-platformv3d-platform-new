import { Router } from 'express';
import {
    register,
    login,
    refreshToken,
    me,
    logout,
    requestPasswordReset,
    resetPassword,
    verifyEmail,
} from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

/**
 * Public routes (no authentication required)
 */
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/password-reset/request', requestPasswordReset);
router.post('/password-reset/confirm', resetPassword);
router.post('/verify-email', verifyEmail);

/**
 * Protected routes (authentication required)
 */
router.get('/me', authenticateToken, me);
router.post('/logout', authenticateToken, logout);

export default router;
