import { Router } from 'express';
import {
    getCurrencies,
    getCurrency,
    convertCurrency,
} from '../controllers/currencies.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All currency endpoints require authentication
router.use(authenticateToken);

router.get('/', getCurrencies);
router.get('/convert', convertCurrency);
router.get('/:idOrCode', getCurrency);

export default router;
