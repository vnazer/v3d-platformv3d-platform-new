import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import {
    createUnitSchema,
    updateUnitSchema,
    getUnitsQuerySchema,
} from '../validators/units.validators';

const prisma = new PrismaClient();

/**
 * Get all units with filters
 * GET /api/units
 */
export async function getUnits(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const organizationId = req.organizationId!;
        const query = getUnitsQuerySchema.parse(req.query);

        const page = query.page || 1;
        const limit = query.limit || 20;
        const skip = (page - 1) * limit;

        const where: any = {
            project: {
                organization_id: organizationId,
            },
        };

        if (query.project_id) where.project_id = query.project_id;
        if (query.status) where.status = query.status;
        if (query.unit_type) where.unit_type = query.unit_type;
        if (query.bedrooms) where.bedrooms = query.bedrooms;

        if (query.min_price || query.max_price) {
            where.price = {};
            if (query.min_price) where.price.gte = query.min_price;
            if (query.max_price) where.price.lte = query.max_price;
        }

        if (query.search) {
            where.OR = [
                { name: { contains: query.search, mode: 'insensitive' } },
                { sku: { contains: query.search, mode: 'insensitive' } },
            ];
        }

        const [units, total] = await Promise.all([
            prisma.unit.findMany({
                where,
                skip,
                take: limit,
                orderBy: { created_at: 'desc' },
                include: {
                    project: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            }),
            prisma.unit.count({ where }),
        ]);

        res.json({
            success: true,
            data: {
                units,
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
 * Get unit by ID
 * GET /api/units/:id
 */
export async function getUnitById(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const { id } = req.params;
        const organizationId = req.organizationId!;

        const unit = await prisma.unit.findFirst({
            where: {
                id,
                project: {
                    organization_id: organizationId,
                },
            },
            include: {
                project: true,
            },
        });

        if (!unit) {
            return res.status(404).json({
                success: false,
                error: 'Unit not found',
            });
        }

        res.json({
            success: true,
            data: { unit },
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Create new unit
 * POST /api/units
 */
export async function createUnit(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const organizationId = req.organizationId!;
        const userId = req.userId!;
        const validatedData = createUnitSchema.parse(req.body);

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

        const unit = await prisma.unit.create({
            data: validatedData as any,
            include: {
                project: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                action: 'CREATE',
                entity_type: 'Unit',
                entity_id: unit.id,
                user_id: userId,
                organization_id: organizationId,
                project_id: unit.project_id,
                new_values: validatedData as any,
            },
        });

        res.status(201).json({
            success: true,
            data: { unit },
            message: 'Unit created successfully',
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Update unit
 * PUT /api/units/:id
 */
export async function updateUnit(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const { id } = req.params;
        const organizationId = req.organizationId!;
        const userId = req.userId!;
        const validatedData = updateUnitSchema.parse(req.body);

        const existingUnit = await prisma.unit.findFirst({
            where: {
                id,
                project: {
                    organization_id: organizationId,
                },
            },
        });

        if (!existingUnit) {
            return res.status(404).json({
                success: false,
                error: 'Unit not found',
            });
        }

        const unit = await prisma.unit.update({
            where: { id },
            data: validatedData as any,
            include: {
                project: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        await prisma.auditLog.create({
            data: {
                action: 'UPDATE',
                entity_type: 'Unit',
                entity_id: unit.id,
                user_id: userId,
                organization_id: organizationId,
                project_id: unit.project_id,
                old_values: existingUnit as any,
                new_values: validatedData as any,
            },
        });

        res.json({
            success: true,
            data: { unit },
            message: 'Unit updated successfully',
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Delete unit
 * DELETE /api/units/:id
 */
export async function deleteUnit(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const { id } = req.params;
        const organizationId = req.organizationId!;
        const userId = req.userId!;

        const existingUnit = await prisma.unit.findFirst({
            where: {
                id,
                project: {
                    organization_id: organizationId,
                },
            },
        });

        if (!existingUnit) {
            return res.status(404).json({
                success: false,
                error: 'Unit not found',
            });
        }

        await prisma.unit.update({
            where: { id },
            data: { status: 'UNAVAILABLE' },
        });

        await prisma.auditLog.create({
            data: {
                action: 'DELETE',
                entity_type: 'Unit',
                entity_id: id,
                user_id: userId,
                organization_id: organizationId,
                project_id: existingUnit.project_id,
            },
        });

        res.json({
            success: true,
            message: 'Unit deleted successfully',
        });
    } catch (error) {
        next(error);
    }
}
