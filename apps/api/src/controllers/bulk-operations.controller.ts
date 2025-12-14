import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

/**
 * Bulk update unit status
 * PUT /api/units/bulk/status
 * Body: { unit_ids: string[], status: UnitStatus, notes?: string }
 */
export async function bulkUpdateStatus(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const schema = z.object({
            unit_ids: z.array(z.string()).min(1, 'Se requiere al menos una unidad'),
            status: z.enum(['AVAILABLE', 'RESERVED', 'SOLD', 'UNAVAILABLE']),
            notes: z.string().optional(),
        });

        const { unit_ids, status, notes } = schema.parse(req.body);
        const user = (req as any).user;

        // Update units
        const result = await prisma.unit.updateMany({
            where: {
                id: { in: unit_ids },
                project: { organization_id: user.organization_id },
            },
            data: { status },
        });

        // Create audit log
        await prisma.auditLog.create({
            data: {
                action: 'UPDATE',
                entity_type: 'Unit',
                entity_id: `bulk:${unit_ids.length}`,
                old_values: {},
                new_values: { status, unit_count: result.count },
                metadata: { unit_ids, notes },
                user_id: user.id,
                organization_id: user.organization_id,
            },
        });

        res.json({
            success: true,
            data: {
                updated_count: result.count,
                requested_count: unit_ids.length,
                status,
            },
            message: `${result.count} unidades actualizadas exitosamente`,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Datos de entrada inválidos',
                details: error.errors,
            });
        }
        next(error);
    }
}

/**
 * Bulk update unit prices
 * PUT /api/units/bulk/prices
 * Body: { unit_ids: string[], price_adjustment: { type, value, apply_to } }
 */
export async function bulkUpdatePrices(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const schema = z.object({
            unit_ids: z.array(z.string()).min(1),
            price_adjustment: z.object({
                type: z.enum(['percentage', 'fixed']),
                value: z.number(),
                apply_to: z.enum(['price', 'list_price', 'sale_price', 'all']),
            }),
        });

        const { unit_ids, price_adjustment } = schema.parse(req.body);
        const user = (req as any).user;

        // Get current units
        const units = await prisma.unit.findMany({
            where: {
                id: { in: unit_ids },
                project: { organization_id: user.organization_id },
            },
            select: { id: true, price: true, list_price: true, sale_price: true },
        });

        // Calculate new prices
        const updates = units.map((unit) => {
            const calculateNewPrice = (currentPrice: any) => {
                if (!currentPrice) return null;
                const current = parseFloat(currentPrice.toString());

                if (price_adjustment.type === 'percentage') {
                    return current * (1 + price_adjustment.value / 100);
                } else {
                    return current + price_adjustment.value;
                }
            };

            const data: any = {};

            if (price_adjustment.apply_to === 'price' || price_adjustment.apply_to === 'all') {
                data.price = calculateNewPrice(unit.price);
            }
            if (price_adjustment.apply_to === 'list_price' || price_adjustment.apply_to === 'all') {
                data.list_price = calculateNewPrice(unit.list_price);
            }
            if (price_adjustment.apply_to === 'sale_price' || price_adjustment.apply_to === 'all') {
                data.sale_price = calculateNewPrice(unit.sale_price);
            }

            return prisma.unit.update({
                where: { id: unit.id },
                data,
            });
        });

        await Promise.all(updates);

        // Audit log
        await prisma.auditLog.create({
            data: {
                action: 'UPDATE',
                entity_type: 'Unit',
                entity_id: `bulk:${units.length}`,
                old_values: {},
                new_values: { price_adjustment },
                metadata: { unit_ids },
                user_id: user.id,
                organization_id: user.organization_id,
            },
        });

        res.json({
            success: true,
            data: {
                updated_count: units.length,
                adjustment: price_adjustment,
            },
            message: `Precios actualizados para ${units.length} unidades`,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Datos de entrada inválidos',
                details: error.errors,
            });
        }
        next(error);
    }
}

/**
 * Bulk delete units
 * DELETE /api/units/bulk
 * Body: { unit_ids: string[] }
 */
export async function bulkDeleteUnits(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const schema = z.object({
            unit_ids: z.array(z.string()).min(1),
        });

        const { unit_ids } = schema.parse(req.body);
        const user = (req as any).user;

        const result = await prisma.unit.deleteMany({
            where: {
                id: { in: unit_ids },
                project: { organization_id: user.organization_id },
            },
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                action: 'DELETE',
                entity_type: 'Unit',
                entity_id: `bulk:${result.count}`,
                old_values: { unit_ids },
                new_values: {},
                metadata: {},
                user_id: user.id,
                organization_id: user.organization_id,
            },
        });

        res.json({
            success: true,
            data: { deleted_count: result.count },
            message: `${result.count} unidades eliminadas`,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Datos de entrada inválidos',
                details: error.errors,
            });
        }
        next(error);
    }
}
