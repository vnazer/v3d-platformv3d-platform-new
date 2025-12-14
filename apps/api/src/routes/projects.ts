import { Router } from 'express';
import {
    getProjects,
    getProjectById,
    createProject,
    updateProject,
    deleteProject,
    getProjectStats,
} from '../controllers/projects.controller';
import { authenticateToken, roleMiddleware } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * Projects CRUD
 */
router.get('/', getProjects);
router.get('/:id', getProjectById);
router.post('/', roleMiddleware(['ADMIN', 'MANAGER']), createProject);
router.put('/:id', roleMiddleware(['ADMIN', 'MANAGER']), updateProject);
router.delete('/:id', roleMiddleware(['ADMIN', 'MANAGER']), deleteProject);

/**
 * Additional endpoints
 */
router.get('/:id/stats', getProjectStats);

export default router;
