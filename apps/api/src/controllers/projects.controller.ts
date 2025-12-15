import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import {
    createProjectSchema,
    updateProjectSchema,
    getProjectsQuerySchema,
} from '../validators/projects.validators.js';

const prisma = new PrismaClient();

/**
 * Get all projects with pagination and filters
 * GET /api/projects
 */
export async function getProjects(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const organizationId = req.organizationId!;

        // Validate query parameters
        const query = getProjectsQuerySchema.parse(req.query);

        const page = query.page || 1;
        const limit = query.limit || 10;
        const skip = (page - 1) * limit;

        // Build where clause
        const where: any = {
            organization_id: organizationId,
        };

        if (query.status) {
            where.status = query.status;
        }

        if (query.search) {
            where.OR = [
                { name: { contains: query.search, mode: 'insensitive' } },
                { description: { contains: query.search, mode: 'insensitive' } },
                { address: { contains: query.search, mode: 'insensitive' } },
            ];
        }

        // Build orderBy
        const orderBy: any = {};
        if (query.sortBy) {
            orderBy[query.sortBy] = query.sortOrder || 'desc';
        } else {
            orderBy.created_at = 'desc';
        }

        // Execute queries
        const [projects, total] = await Promise.all([
            prisma.project.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                include: {
                    _count: {
                        select: {
                            units: true,
                            leads: true,
                        },
                    },
                },
            }),
            prisma.project.count({ where }),
        ]);

        res.json({
            success: true,
            data: {
                projects,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            },
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get project by ID
 * GET /api/projects/:id
 */
export async function getProjectById(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const { id } = req.params;
        const organizationId = req.organizationId!;

        const project = await prisma.project.findFirst({
            where: {
                id,
                organization_id: organizationId,
            },
            include: {
                units: {
                    orderBy: { created_at: 'desc' },
                },
                leads: {
                    take: 10,
                    orderBy: { created_at: 'desc' },
                    include: {
                        assigned_to: {
                            select: {
                                id: true,
                                email: true,
                                first_name: true,
                                last_name: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        units: true,
                        leads: true,
                    },
                },
            },
        });

        if (!project) {
            return res.status(404).json({
                success: false,
                error: 'Project not found',
            });
        }

        res.json({
            success: true,
            data: { project },
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Create new project
 * POST /api/projects
 */
export async function createProject(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const organizationId = req.organizationId!;
        const userId = req.userId!;

        // Validate request body
        const validatedData = createProjectSchema.parse(req.body);

        const project = await prisma.project.create({
            data: {
                organization_id: organizationId,
                ...validatedData,
            },
            include: {
                _count: {
                    select: {
                        units: true,
                        leads: true,
                    },
                },
            },
        });

        // Create audit log
        await prisma.auditLog.create({
            data: {
                action: 'CREATE',
                entity_type: 'Project',
                entity_id: project.id,
                user_id: userId,
                organization_id: organizationId,
                project_id: project.id,
                new_values: validatedData as any,
            },
        });

        res.status(201).json({
            success: true,
            data: { project },
            message: 'Project created successfully',
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Update project
 * PUT /api/projects/:id
 */
export async function updateProject(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const { id } = req.params;
        const organizationId = req.organizationId!;
        const userId = req.userId!;

        // Validate request body
        const validatedData = updateProjectSchema.parse(req.body);

        // Check if project exists and belongs to organization
        const existingProject = await prisma.project.findFirst({
            where: {
                id,
                organization_id: organizationId,
            },
        });

        if (!existingProject) {
            return res.status(404).json({
                success: false,
                error: 'Project not found',
            });
        }

        // Update project
        const project = await prisma.project.update({
            where: { id },
            data: validatedData,
            include: {
                _count: {
                    select: {
                        units: true,
                        leads: true,
                    },
                },
            },
        });

        // Create audit log
        await prisma.auditLog.create({
            data: {
                action: 'UPDATE',
                entity_type: 'Project',
                entity_id: project.id,
                user_id: userId,
                organization_id: organizationId,
                project_id: project.id,
                old_values: existingProject as any,
                new_values: validatedData as any,
            },
        });

        res.json({
            success: true,
            data: { project },
            message: 'Project updated successfully',
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Delete project (soft delete)
 * DELETE /api/projects/:id
 */
export async function deleteProject(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const { id } = req.params;
        const organizationId = req.organizationId!;
        const userId = req.userId!;

        // Check if project exists and belongs to organization
        const existingProject = await prisma.project.findFirst({
            where: {
                id,
                organization_id: organizationId,
            },
        });

        if (!existingProject) {
            return res.status(404).json({
                success: false,
                error: 'Project not found',
            });
        }

        // Soft delete by setting status to ARCHIVED
        const project = await prisma.project.update({
            where: { id },
            data: {
                status: 'ARCHIVED',
                archived_at: new Date(),
            },
        });

        // Create audit log
        await prisma.auditLog.create({
            data: {
                action: 'DELETE',
                entity_type: 'Project',
                entity_id: project.id,
                user_id: userId,
                organization_id: organizationId,
                project_id: project.id,
            },
        });

        res.json({
            success: true,
            message: 'Project deleted successfully',
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get project statistics
 * GET /api/projects/:id/stats
 */
export async function getProjectStats(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const { id } = req.params;
        const organizationId = req.organizationId!;

        const project = await prisma.project.findFirst({
            where: {
                id,
                organization_id: organizationId,
            },
            include: {
                _count: {
                    select: {
                        units: true,
                        leads: true,
                    },
                },
            },
        });

        if (!project) {
            return res.status(404).json({
                success: false,
                error: 'Project not found',
            });
        }

        // Get leads by stage
        const leadsByStage = await prisma.lead.groupBy({
            by: ['stage'],
            where: {
                project_id: id,
            },
            _count: true,
        });

        // Get units by status
        const unitsByStatus = await prisma.unit.groupBy({
            by: ['status'],
            where: {
                project_id: id,
            },
            _count: true,
        });

        res.json({
            success: true,
            data: {
                stats: {
                    totalUnits: project._count.units,
                    totalLeads: project._count.leads,
                    leadsByStage,
                    unitsByStatus,
                },
            },
        });
    } catch (error) {
        next(error);
    }
}
