import { z } from 'zod';

export const createProjectSchema = z.object({
    name: z.string().min(1, 'Project name is required').max(255),
    description: z.string().optional(),
    status: z.enum(['ACTIVE', 'ARCHIVED', 'DRAFT', 'COMPLETED']).optional(),
    address: z.string().optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    thumbnail_url: z.string().url().optional(),
    matterport_url: z.string().url().optional(),
    featured_image: z.string().url().optional(),
    settings: z.record(z.any()).optional(),
});

export const updateProjectSchema = z.object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().optional(),
    status: z.enum(['ACTIVE', 'ARCHIVED', 'DRAFT', 'COMPLETED']).optional(),
    address: z.string().optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    thumbnail_url: z.string().url().optional(),
    matterport_url: z.string().url().optional(),
    featured_image: z.string().url().optional(),
    settings: z.record(z.any()).optional(),
});

export const getProjectsQuerySchema = z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    status: z.enum(['ACTIVE', 'ARCHIVED', 'DRAFT', 'COMPLETED']).optional(),
    search: z.string().optional(),
    sortBy: z.enum(['name', 'created_at', 'updated_at']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type GetProjectsQuery = z.infer<typeof getProjectsQuerySchema>;
