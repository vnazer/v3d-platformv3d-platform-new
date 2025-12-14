import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

/**
 * Global error handler middleware
 */
export function errorHandler(
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
) {
    console.error('Error:', error);

    // Zod validation error
    if (error instanceof ZodError) {
        return res.status(400).json({
            success: false,
            error: 'Validation error',
            details: error.errors.map((err) => ({
                field: err.path.join('.'),
                message: err.message,
            })),
        });
    }

    // Prisma errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Unique constraint violation
        if (error.code === 'P2002') {
            return res.status(409).json({
                success: false,
                error: 'A record with this value already exists',
                field: (error.meta?.target as string[])?.join(', '),
            });
        }

        // Record not found
        if (error.code === 'P2025') {
            return res.status(404).json({
                success: false,
                error: 'Record not found',
            });
        }
    }

    // Default error
    res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    });
}

/**
 * 404 handler
 */
export function notFoundHandler(
    req: Request,
    res: Response
) {
    res.status(404).json({
        success: false,
        error: 'Route not found',
        path: req.path,
    });
}
