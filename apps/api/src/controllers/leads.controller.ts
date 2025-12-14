import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import {
    createLeadSchema,
    updateLeadSchema,
    getLeadsQuerySchema,
} from '../validators/leads.validators';

const prisma = new PrismaClient();

/**
 * Get all leads with pagination and filters
 * GET /api/leads
 */
export async function getLeads(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const organizationId = req.organizationId!;

        // Validate query parameters
        const query = getLeadsQuerySchema.parse(req.query);

        const page = query.page || 1;
        const limit = query.limit || 10;
        const skip = (page - 1) * limit;

        // Build where clause
        const where: any = {
            organization_id: organizationId,
        };

        if (query.stage) {
            where.stage = query.stage;
        }

        if (query.project_id) {
            where.project_id = query.project_id;
        }

        if (query.assigned_to_id) {
            where.assigned_to_id = query.assigned_to_id;
        }

        if (query.search) {
            where.OR = [
                { name: { contains: query.search, mode: 'insensitive' } },
                { email: { contains: query.search, mode: 'insensitive' } },
                { phone: { contains: query.search, mode: 'insensitive' } },
                { company: { contains: query.search, mode: 'insensitive' } },
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
        const [leads, total] = await Promise.all([
            prisma.lead.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                include: {
                    project: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    assigned_to: {
                        select: {
                            id: true,
                            email: true,
                            first_name: true,
                            last_name: true,
                        },
                    },
                },
            }),
            prisma.lead.count({ where }),
        ]);

        res.json({
            success: true,
            data: {
                leads,
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
 * Get lead by ID
 * GET /api/leads/:id
 */
export async function getLeadById(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const { id } = req.params;
        const organizationId = req.organizationId!;

        const lead = await prisma.lead.findFirst({
            where: {
                id,
                organization_id: organizationId,
            },
            include: {
                project: true,
                assigned_to: {
                    select: {
                        id: true,
                        email: true,
                        first_name: true,
                        last_name: true,
                    },
                },
                messages: {
                    orderBy: { created_at: 'desc' },
                    take: 10,
                },
            },
        });

        if (!lead) {
            return res.status(404).json({
                success: false,
                error: 'Lead not found',
            });
        }

        res.json({
            success: true,
            data: { lead },
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Create new lead
 * POST /api/leads
 */
export async function createLead(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const organizationId = req.organizationId!;
        const userId = req.userId!;

        // Validate request body
        const validatedData = createLeadSchema.parse(req.body);

        // Verify project belongs to organization
        const project = await prisma.project.findFirst({
            where: {
                id: validatedData.project_id,
                organization_id: organizationId,
            },
        });

        if (!project) {
            return res.status(404).json({
                success: false,
                error: 'Project not found',
            });
        }

        const lead = await prisma.lead.create({
            data: {
                ...validatedData,
                organization_id: organizationId,
            } as any,
            include: {
                project: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                assigned_to: {
                    select: {
                        id: true,
                        email: true,
                        first_name: true,
                        last_name: true,
                    },
                },
            },
        });

        // Create audit log
        await prisma.auditLog.create({
            data: {
                action: 'CREATE',
                entity_type: 'Lead',
                entity_id: lead.id,
                user_id: userId,
                organization_id: organizationId,
                project_id: lead.project_id,
                new_values: validatedData as any,
            },
        });

        res.status(201).json({
            success: true,
            data: { lead },
            message: 'Lead created successfully',
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Update lead
 * PUT /api/leads/:id
 */
export async function updateLead(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const { id } = req.params;
        const organizationId = req.organizationId!;
        const userId = req.userId!;

        // Validate request body
        const validatedData = updateLeadSchema.parse(req.body);

        // Check if lead exists and belongs to organization
        const existingLead = await prisma.lead.findFirst({
            where: {
                id,
                organization_id: organizationId,
            },
        });

        if (!existingLead) {
            return res.status(404).json({
                success: false,
                error: 'Lead not found',
            });
        }

        // Update lead
        const lead = await prisma.lead.update({
            where: { id },
            data: validatedData as any,
            include: {
                project: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                assigned_to: {
                    select: {
                        id: true,
                        email: true,
                        first_name: true,
                        last_name: true,
                    },
                },
            },
        });

        // Create audit log
        await prisma.auditLog.create({
            data: {
                action: 'UPDATE',
                entity_type: 'Lead',
                entity_id: lead.id,
                user_id: userId,
                organization_id: organizationId,
                project_id: lead.project_id,
                old_values: existingLead as any,
                new_values: validatedData as any,
            },
        });

        res.json({
            success: true,
            data: { lead },
            message: 'Lead updated successfully',
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Delete lead
 * DELETE /api/leads/:id
 */
export async function deleteLead(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const { id } = req.params;
        const organizationId = req.organizationId!;
        const userId = req.userId!;

        // Check if lead exists and belongs to organization
        const existingLead = await prisma.lead.findFirst({
            where: {
                id,
                organization_id: organizationId,
            },
        });

        if (!existingLead) {
            return res.status(404).json({
                success: false,
                error: 'Lead not found',
            });
        }

        // Delete lead (hard delete or set as lost)
        await prisma.lead.update({
            where: { id },
            data: {
                stage: 'LOST',
            },
        });

        // Create audit log
        await prisma.auditLog.create({
            data: {
                action: 'DELETE',
                entity_type: 'Lead',
                entity_id: id,
                user_id: userId,
                organization_id: organizationId,
                project_id: existingLead.project_id,
            },
        });

        res.json({
            success: true,
            message: 'Lead deleted successfully',
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Assign lead to agent
 * PUT /api/leads/:id/assign
 */
export async function assignLead(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const { id } = req.params;
        const { assigned_to_id } = req.body;
        const organizationId = req.organizationId!;
        const userId = req.userId!;

        const lead = await prisma.lead.update({
            where: { id },
            data: { assigned_to_id },
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
        });

        // Create audit log
        await prisma.auditLog.create({
            data: {
                action: 'UPDATE',
                entity_type: 'Lead',
                entity_id: lead.id,
                user_id: userId,
                organization_id: organizationId,
                project_id: lead.project_id,
                new_values: { assigned_to_id } as any,
            },
        });

        res.json({
            success: true,
            data: { lead },
            message: 'Lead assigned successfully',
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Update lead stage
 * PUT /api/leads/:id/stage
 */
export async function updateLeadStage(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const { id } = req.params;
        const { stage } = req.body;
        const organizationId = req.organizationId!;
        const userId = req.userId!;

        const lead = await prisma.lead.update({
            where: { id },
            data: { stage },
        });

        // Create audit log
        await prisma.auditLog.create({
            data: {
                action: 'UPDATE',
                entity_type: 'Lead',
                entity_id: lead.id,
                user_id: userId,
                organization_id: organizationId,
                project_id: lead.project_id,
                new_values: { stage } as any,
            },
        });

        res.json({
            success: true,
            data: { lead },
            message: 'Lead stage updated successfully',
        });
    } catch (error) {
        next(error);
    }
}
