import { Router } from 'express';
import {
    getLeads,
    getLeadById,
    createLead,
    updateLead,
    deleteLead,
    assignLead,
    updateLeadStage,
} from '../controllers/leads.controller';
import { authenticateToken, roleMiddleware } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * Leads CRUD
 */
router.get('/', getLeads);
router.get('/:id', getLeadById);
router.post('/', createLead);
router.put('/:id', updateLead);
router.delete('/:id', roleMiddleware(['ADMIN', 'MANAGER']), deleteLead);

/**
 * Additional endpoints
 */
router.put('/:id/assign', roleMiddleware(['ADMIN', 'MANAGER']), assignLead);
router.put('/:id/stage', updateLeadStage);

export default router;
