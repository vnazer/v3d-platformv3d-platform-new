import { Router } from 'express';
import {
    getCurrencies,
    getCurrency,
    convertCurrency,
} from '../controllers/currencies.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// All currency endpoints require authentication
router.use(authenticateToken);

router.get('/', getCurrencies);
router.get('/convert', convertCurrency);
router.get('/:idOrCode', getCurrency);

export default router;
