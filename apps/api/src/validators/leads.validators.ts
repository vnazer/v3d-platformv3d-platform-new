import { z } from 'zod';

export const createLeadSchema = z.object({
    name: z.string().min(1, 'Lead name is required').max(255),
    email: z.string().email('Invalid email address').optional(),
    phone: z.string().optional(),
    company: z.string().optional(),
    stage: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST']).optional(),
    source: z.string().optional(),
    notes: z.string().optional(),
    project_id: z.string().uuid('Invalid project ID'),
    assigned_to_id: z.string().uuid('Invalid user ID').optional(),
    budget: z.number().positive().optional(),
    expected_close_date: z.string().datetime().optional(),
});

export const updateLeadSchema = z.object({
    name: z.string().min(1).max(255).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    company: z.string().optional(),
    stage: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST']).optional(),
    source: z.string().optional(),
    notes: z.string().optional(),
    assigned_to_id: z.string().uuid().optional(),
    budget: z.number().positive().optional(),
    expected_close_date: z.string().datetime().optional(),
});

export const getLeadsQuerySchema = z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    stage: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST']).optional(),
    project_id: z.string().uuid().optional(),
    assigned_to_id: z.string().uuid().optional(),
    search: z.string().optional(),
    sortBy: z.enum(['name', 'created_at', 'budget', 'expected_close_date']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
export type GetLeadsQuery = z.infer<typeof getLeadsQuerySchema>;
