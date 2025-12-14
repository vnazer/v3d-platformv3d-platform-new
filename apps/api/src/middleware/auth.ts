import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/auth.service';

// Extend Express Request to include auth data
declare global {
    namespace Express {
        interface Request {
            userId?: string;
            userEmail?: string;
            userRole?: string;
            organizationId?: string;
        }
    }
}

/**
 * Middleware to authenticate JWT token
 */
export function authenticateToken(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith('Bearer ')
            ? authHeader.substring(7)
            : null;

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized - No token provided',
            });
        }

        // Verify token
        const payload = verifyToken(token);

        // Attach user info to request
        req.userId = payload.userId;
        req.userEmail = payload.email;
        req.userRole = payload.role;
        req.organizationId = payload.organizationId;

        next();
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === 'Token expired') {
                return res.status(401).json({
                    success: false,
                    error: 'Token expired',
                    code: 'TOKEN_EXPIRED',
                });
            }
            if (error.message === 'Invalid token') {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid token',
                    code: 'INVALID_TOKEN',
                });
            }
        }

        return res.status(401).json({
            success: false,
            error: 'Authentication failed',
        });
    }
}

/**
 * Middleware to check user role (RBAC)
 * @param allowedRoles Array of roles allowed to access the route
 */
export function roleMiddleware(allowedRoles: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        const userRole = req.userRole;

        if (!userRole) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized - No role found',
            });
        }

        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({
                success: false,
                error: 'Forbidden - Insufficient permissions',
                requiredRoles: allowedRoles,
                userRole,
            });
        }

        next();
    };
}

/**
 * Middleware to verify organization access
 * Ensures user can only access resources from their organization
 */
export function organizationMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const userOrgId = req.organizationId;

    if (!userOrgId) {
        return res.status(401).json({
            success: false,
            error: 'Unauthorized - No organization found',
        });
    }

    // Attach organization filter to request for use in queries
    (req as any).orgFilter = { organization_id: userOrgId };

    next();
}
