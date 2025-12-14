import { Router } from 'express';
import multer from 'multer';
import {
    bulkUpdateStatus,
    bulkUpdatePrices,
    bulkDeleteUnits,
} from '../controllers/bulk-operations.controller.js';
import {
    importUnitsFromCSV,
    exportUnitsToCSV,
} from '../controllers/csv-import.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { requirePermission } from '../middleware/permissions.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// All bulk operations require authentication
router.use(authenticateToken);

// Bulk operations
router.put(
    '/bulk/status',
    requirePermission('units.bulk_update'),
    bulkUpdateStatus
);

router.put(
    '/bulk/prices',
    requirePermission('units.bulk_update'),
    bulkUpdatePrices
);

router.delete(
    '/bulk',
    requirePermission('units.delete'),
    bulkDeleteUnits
);

// CSV operations
router.post(
    '/import/csv',
    requirePermission('units.csv_import'),
    upload.single('file'),
    importUnitsFromCSV
);

router.get(
    '/export/csv',
    requirePermission('units.view'),
    exportUnitsToCSV
);

export default router;
