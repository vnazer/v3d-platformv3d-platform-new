// V3D Platform - Projects Controller
// REST API for projects management with pagination, filtering, and validation

import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// ============================================
// REQUEST/RESPONSE TYPES & VALIDATION
// ============================================

// Query validation schema (OpenAPI compatible)
const GetProjectsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  status: z.enum(['ACTIVE', 'ARCHIVED', 'DRAFT', 'COMPLETED']).optional(),
  sortBy: z.enum(['name', 'created_at', 'updated_at']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
});

type GetProjectsQuery = z.infer<typeof GetProjectsQuerySchema>;

// Create project validation schema
const CreateProjectSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  address: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  settings: z.record(z.any()).optional(),
});

type CreateProjectInput = z.infer<typeof CreateProjectSchema>;

// Update project validation schema
const UpdateProjectSchema = CreateProjectSchema.partial();

// ============================================
// PAGINATION HELPER
// ============================================

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

function calculatePagination(total: number, page: number, limit: number): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

// ============================================
// RESPONSE WRAPPER
// ============================================

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
  };
  meta?: PaginationMeta;
  timestamp: string;
  requestId?: string;
}

function sendResponse<T>(
  res: Response,
  statusCode: number,
  data?: T,
  meta?: PaginationMeta,
  error?: { message: string; code: string }
): void {
  const response: ApiResponse<T> = {
    success: statusCode < 400,
    data,
    error,
    meta,
    timestamp: new Date().toISOString(),
  };

  if ((res.req as any).id) {
    response.requestId = (res.req as any).id;
  }

  res.status(statusCode).json(response);
}

// ============================================
// PROJECTS CONTROLLER
// ============================================

/**
 * GET /api/projects
 * Get all projects for the authenticated organization with pagination
 * 
 * @query page - Page number (default: 1)
 * @query limit - Items per page (default: 10, max: 100)
 * @query status - Filter by status (ACTIVE|ARCHIVED|DRAFT|COMPLETED)
 * @query sortBy - Sort field (name|created_at|updated_at)
 * @query sortOrder - Sort direction (asc|desc)
 * @query search - Search by project name
 */
export const getProjects = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const orgId = (req as any).orgId;
    if (!orgId) {
      sendResponse(res, 401, undefined, undefined, {
        message: 'Organization ID not found in request',
        code: 'UNAUTHORIZED',
      });
      return;
    }

    // Validate and parse query parameters
    const parsedQuery = GetProjectsQuerySchema.parse(req.query);
    const { page, limit, status, sortBy, sortOrder, search } = parsedQuery;
    const skip = (page - 1) * limit;

    // Build where clause for filtering
    const where: any = {
      organization_id: orgId,
    };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Execute query with pagination
    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          status: true,
          address: true,
          thumbnail_url: true,
          matterport_url: true,
          created_at: true,
          updated_at: true,
          _count: {
            select: {
              units: true,
              leads: true,
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      prisma.project.count({ where }),
    ]);

    // Format response
    const formattedProjects = projects.map((project) => ({
      ...project,
      unitCount: project._count.units,
      leadCount: project._count.leads,
      _count: undefined,
    }));

    const pagination = calculatePagination(total, page, limit);

    sendResponse(res, 200, formattedProjects, pagination);
  } catch (error) {
    if (error instanceof z.ZodError) {
      sendResponse(res, 400, undefined, undefined, {
        message: 'Invalid query parameters',
        code: 'VALIDATION_ERROR',
      });
      return;
    }
    next(error);
  }
};

/**
 * GET /api/projects/:id
 * Get a single project by ID
 */
export const getProjectById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const orgId = (req as any).orgId;

    const project = await prisma.project.findFirst({
      where: {
        id,
        organization_id: orgId,
      },
      include: {
        units: {
          select: {
            id: true,
            sku: true,
            name: true,
            quantity: true,
            price: true,
          },
        },
        leads: {
          select: {
            id: true,
            name: true,
            stage: true,
            created_at: true,
          },
        },
      },
    });

    if (!project) {
      sendResponse(res, 404, undefined, undefined, {
        message: 'Project not found',
        code: 'NOT_FOUND',
      });
      return;
    }

    sendResponse(res, 200, project);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/projects
 * Create a new project
 */
export const createProject = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const orgId = (req as any).orgId;
    if (!orgId) {
      sendResponse(res, 401, undefined, undefined, {
        message: 'Organization ID not found',
        code: 'UNAUTHORIZED',
      });
      return;
    }

    // Validate input
    const validatedData = CreateProjectSchema.parse(req.body);

    // Create project
    const project = await prisma.project.create({
      data: {
        ...validatedData,
        organization_id: orgId,
        status: 'DRAFT',
        settings: validatedData.settings || {},
      },
    });

    sendResponse(res, 201, project);
  } catch (error) {
    if (error instanceof z.ZodError) {
      sendResponse(res, 400, undefined, undefined, {
        message: 'Invalid request body',
        code: 'VALIDATION_ERROR',
      });
      return;
    }
    next(error);
  }
};

/**
 * PUT /api/projects/:id
 * Update a project
 */
export const updateProject = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const orgId = (req as any).orgId;

    // Verify ownership
    const existingProject = await prisma.project.findFirst({
      where: {
        id,
        organization_id: orgId,
      },
    });

    if (!existingProject) {
      sendResponse(res, 404, undefined, undefined, {
        message: 'Project not found',
        code: 'NOT_FOUND',
      });
      return;
    }

    // Validate and update
    const validatedData = UpdateProjectSchema.parse(req.body);

    const updatedProject = await prisma.project.update({
      where: { id },
      data: validatedData,
    });

    sendResponse(res, 200, updatedProject);
  } catch (error) {
    if (error instanceof z.ZodError) {
      sendResponse(res, 400, undefined, undefined, {
        message: 'Invalid request body',
        code: 'VALIDATION_ERROR',
      });
      return;
    }
    next(error);
  }
};

/**
 * DELETE /api/projects/:id
 * Delete a project
 */
export const deleteProject = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const orgId = (req as any).orgId;

    // Verify ownership and soft delete
    const project = await prisma.project.findFirst({
      where: {
        id,
        organization_id: orgId,
      },
    });

    if (!project) {
      sendResponse(res, 404, undefined, undefined, {
        message: 'Project not found',
        code: 'NOT_FOUND',
      });
      return;
    }

    // Soft delete (archive)
    const archivedProject = await prisma.project.update({
      where: { id },
      data: {
        status: 'ARCHIVED',
        archived_at: new Date(),
      },
    });

    sendResponse(res, 200, { message: 'Project archived successfully', id });
  } catch (error) {
    next(error);
  }
};
