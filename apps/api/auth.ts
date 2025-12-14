// V3D Platform - Authentication Middleware
// JWT token validation and extraction

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface DecodedToken {
  sub: string; // User ID
  orgId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

interface AuthRequest extends Request {
  userId?: string;
  orgId?: string;
  userRole?: string;
  token?: string;
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Missing or invalid authorization header',
          code: 'UNAUTHORIZED',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      console.error('JWT_SECRET not configured');
      res.status(500).json({
        success: false,
        error: {
          message: 'Server configuration error',
          code: 'INTERNAL_ERROR',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Verify and decode token
    const decoded = jwt.verify(token, jwtSecret) as DecodedToken;

    // Attach user info to request
    (req as any).userId = decoded.sub;
    (req as any).orgId = decoded.orgId;
    (req as any).userRole = decoded.role;
    (req as any).token = token;

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Token has expired',
          code: 'TOKEN_EXPIRED',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Invalid token',
          code: 'INVALID_TOKEN',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Authentication error',
        code: 'AUTH_ERROR',
      },
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Role-based access control middleware
 * @param allowedRoles - Array of roles that are allowed
 */
export const roleMiddleware = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const userRole = (req as any).userRole;

    if (!userRole || !allowedRoles.includes(userRole)) {
      res.status(403).json({
        success: false,
        error: {
          message: 'Insufficient permissions',
          code: 'FORBIDDEN',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    next();
  };
};
