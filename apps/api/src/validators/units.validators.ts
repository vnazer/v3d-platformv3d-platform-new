import { z } from 'zod';

export const createUnitSchema = z.object({
    sku: z.string().min(1, 'SKU is required'),
    name: z.string().optional(),
    unit_type: z.enum(['APARTMENT', 'HOUSE', 'COMMERCIAL', 'LAND', 'OFFICE', 'PARKING', 'STORAGE']),
    status: z.enum(['AVAILABLE', 'RESERVED', 'SOLD', 'UNAVAILABLE']).optional(),
    price: z.number().positive('Price must be positive'),
    currency_id: z.string().min(1, 'Currency ID is required'),
    cost_price: z.number().positive().optional(),
    list_price: z.number().positive().optional(),
    sale_price: z.number().positive().optional(),
    discount_percentage: z.number().min(0).max(100).optional(),
    bedrooms: z.number().int().min(0).optional(),
    bathrooms: z.number().min(0).optional(),
    area_sqm: z.number().positive().optional(),
    floor: z.number().int().optional(),
    project_id: z.string().uuid('Invalid project ID'),
    features: z.record(z.any()).optional(),
});

export const updateUnitSchema = z.object({
    sku: z.string().optional(),
    name: z.string().optional(),
    unit_type: z.enum(['APARTMENT', 'HOUSE', 'COMMERCIAL', 'LAND', 'OFFICE', 'PARKING', 'STORAGE']).optional(),
    status: z.enum(['AVAILABLE', 'RESERVED', 'SOLD', 'UNAVAILABLE']).optional(),
    price: z.number().positive().optional(),
    currency_id: z.string().optional(),
    cost_price: z.number().positive().optional(),
    list_price: z.number().positive().optional(),
    sale_price: z.number().positive().optional(),
    discount_percentage: z.number().min(0).max(100).optional(),
    bedrooms: z.number().int().min(0).optional(),
    bathrooms: z.number().min(0).optional(),
    area_sqm: z.number().positive().optional(),
    floor: z.number().int().optional(),
    features: z.record(z.any()).optional(),
});

export const getUnitsQuerySchema = z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    project_id: z.string().uuid().optional(),
    status: z.enum(['AVAILABLE', 'RESERVED', 'SOLD', 'UNAVAILABLE']).optional(),
    unit_type: z.enum(['APARTMENT', 'HOUSE', 'COMMERCIAL', 'LAND', 'OFFICE', 'PARKING', 'STORAGE']).optional(),
    min_price: z.string().transform(Number).optional(),
    max_price: z.string().transform(Number).optional(),
    bedrooms: z.string().transform(Number).optional(),
    search: z.string().optional(),
});

export type CreateUnitInput = z.infer<typeof createUnitSchema>;
export type UpdateUnitInput = z.infer<typeof updateUnitSchema>;
export type GetUnitsQuery = z.infer<typeof getUnitsQuerySchema>;
