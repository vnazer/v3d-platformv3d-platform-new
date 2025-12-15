import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import { z } from 'zod';

const prisma = new PrismaClient();

/**
 * Import units from CSV
 * POST /api/units/import/csv
 * Form-data: file, project_id, update_existing (bool), dry_run (bool)
 */
export async function importUnitsFromCSV(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const user = (req as any).user;
        const file = (req as any).file; // From multer middleware
        const { project_id, update_existing, dry_run } = req.body;

        if (!file) {
            return res.status(400).json({
                success: false,
                error: 'No se proporcionó archivo CSV',
            });
        }

        // Parse CSV
        const csvContent = file.buffer.toString('utf-8');
        const records = parse(csvContent, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
        });

        // Get default currency (USD)
        const defaultCurrency = await prisma.currency.findUnique({
            where: { code: 'USD' },
        });

        if (!defaultCurrency) {
            return res.status(500).json({
                success: false,
                error: 'Moneda por defecto no encontrada',
            });
        }

        const errors: any[] = [];
        const successes: any[] = [];

        for (let i = 0; i < records.length; i++) {
            const row: any = records[i]; // Type assertion for CSV parsed data
            const rowNum = i + 2; // +2 because row 1 is header, array is 0-indexed

            try {
                // Validate required fields
                if (!row.SKU || !row.Precio) {
                    errors.push({
                        row: rowNum,
                        sku: row.SKU,
                        error: 'SKU y Precio son campos requeridos',
                    });
                    continue;
                }

                // Get or resolve currency
                let currency = defaultCurrency;
                if (row.Moneda) {
                    const foundCurrency = await prisma.currency.findUnique({
                        where: { code: row.Moneda.toUpperCase() },
                    });
                    if (foundCurrency) {
                        currency = foundCurrency;
                    }
                }

                // Parse unit type
                const unit_type_map: any = {
                    'DEPARTAMENTO': 'APARTMENT',
                    'CASA': 'HOUSE',
                    'COMERCIAL': 'COMMERCIAL',
                    'TERRENO': 'LAND',
                    'OFICINA': 'OFFICE',
                    'ESTACIONAMIENTO': 'PARKING',
                    'BODEGA': 'STORAGE',
                };

                const unit_type = unit_type_map[row.Tipo?.toUpperCase()] || row.TipoEN || 'APARTMENT';

                // Parse status
                const status_map: any = {
                    'DISPONIBLE': 'AVAILABLE',
                    'RESERVADO': 'RESERVED',
                    'VENDIDO': 'SOLD',
                    'NO DISPONIBLE': 'UNAVAILABLE',
                };

                const status = status_map[row.Estado?.toUpperCase()] || row.EstadoEN || 'AVAILABLE';

                const unitData: any = {
                    sku: row.SKU,
                    name: row.Nombre || null,
                    unit_type,
                    status,
                    price: parseFloat(row.Precio),
                    currency_id: currency.id,
                    project_id: project_id,
                    bedrooms: row.Habitaciones ? parseInt(row.Habitaciones) : null,
                    bathrooms: row.Baños || row.Banos ? parseFloat(row.Baños || row.Banos) : null,
                    area_sqm: row['Área M²'] || row.AreaM2 ? parseFloat(row['Área M²'] || row.AreaM2) : null,
                    floor: row.Piso ? parseInt(row.Piso) : null,
                };

                if (!dry_run) {
                    if (update_existing === 'true') {
                        // Upsert (update if exists, create if not)
                        await prisma.unit.upsert({
                            where: {
                                sku_project_id: {
                                    sku: unitData.sku,
                                    project_id: project_id,
                                },
                            },
                            update: unitData,
                            create: unitData,
                        });
                    } else {
                        // Create new only
                        await prisma.unit.create({
                            data: unitData,
                        });
                    }
                }

                successes.push({
                    row: rowNum,
                    sku: row.SKU,
                    action: update_existing === 'true' ? 'upserted' : 'created',
                });
            } catch (error: any) {
                errors.push({
                    row: rowNum,
                    sku: row.SKU,
                    error: error.message || 'Error desconocido',
                });
            }
        }

        // Audit log
        if (!dry_run && successes.length > 0) {
            await prisma.auditLog.create({
                data: {
                    action: 'IMPORT',
                    entity_type: 'Unit',
                    entity_id: `csv:${successes.length}`,
                    old_values: {},
                    new_values: { project_id, total: records.length },
                    changes: { errors: errors.length, successes: successes.length },
                    user_id: user.id,
                    organization_id: user.organization_id,
                },
            });
        }

        res.json({
            success: true,
            data: {
                total_rows: records.length,
                created: successes.filter((s: any) => s.action === 'created').length,
                updated: successes.filter((s: any) => s.action === 'upserted').length,
                errors: errors.length,
                dry_run: dry_run === 'true',
            },
            errors: errors.length > 0 ? errors : undefined,
            message: dry_run === 'true'
                ? 'Vista previa de importación (no se aplicaron cambios)'
                : `Importación completada: ${successes.length} exitosas, ${errors.length} errores`,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Export units to CSV
 * GET /api/units/export/csv?project_id=xxx&status=AVAILABLE
 */
export async function exportUnitsToCSV(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const user = (req as any).user;
        const { project_id, status, unit_type } = req.query;

        const where: any = {
            project: { organization_id: user.organization_id },
        };

        if (project_id) where.project_id = project_id;
        if (status) where.status = status;
        if (unit_type) where.unit_type = unit_type;

        const units = await prisma.unit.findMany({
            where,
            include: {
                project: { select: { name: true } },
                currency: { select: { code: true, symbol: true } },
            },
            orderBy: [
                { project_id: 'asc' },
                { sku: 'asc' },
            ],
        });

        // Convert to CSV format
        const csvData = units.map((unit) => ({
            SKU: unit.sku,
            Nombre: unit.name || '',
            Tipo: unit.unit_type,
            Estado: unit.status,
            Precio: unit.price,
            Moneda: unit.currency.code,
            Habitaciones: unit.bedrooms || '',
            Baños: unit.bathrooms || '',
            'Área M²': unit.area_sqm || '',
            Piso: unit.floor || '',
            Proyecto: unit.project.name,
        }));

        const csv = stringify(csvData, {
            header: true,
            columns: ['SKU', 'Nombre', 'Tipo', 'Estado', 'Precio', 'Moneda', 'Habitaciones', 'Baños', 'Área M²', 'Piso', 'Proyecto'],
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=units_export_${Date.now()}.csv`);
        res.send(csv);
    } catch (error) {
        next(error);
    }
}
