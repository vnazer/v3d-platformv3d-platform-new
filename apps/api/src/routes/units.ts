import { Router } from 'express';
import {
    getUnits,
    getUnitById,
    createUnit,
    updateUnit,
    deleteUnit,
} from '../controllers/units.controller';
import bulkOperationsRoutes from './bulk-operations';
import { authenticateToken, roleMiddleware } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

// Bulk operations (must be before /:id)
router.use('/', bulkOperationsRoutes);

// CRUD routes
router.get('/', getUnits);
router.get('/:id', getUnitById);
router.post('/', roleMiddleware(['ADMIN', 'MANAGER']), createUnit);
router.put('/:id', roleMiddleware(['ADMIN', 'MANAGER']), updateUnit);
router.delete('/:id', roleMiddleware(['ADMIN', 'MANAGER']), deleteUnit);

export default router;
