import { Request, Response, NextFunction } from 'express';

// Permission definitions
const PERMISSIONS = {
    // Project management (MAGAMA only creates projects)
    'projects.create': ['SUPER_ADMIN'],
    'projects.edit': ['SUPER_ADMIN', 'ADMIN'],
    'projects.delete': ['SUPER_ADMIN'],
    'projects.view': ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'AGENT', 'USER'],

    // Units management
    'units.create': ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
    'units.edit': ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
    'units.delete': ['SUPER_ADMIN', 'ADMIN'],
    'units.view': ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'AGENT', 'USER'],
    'units.bulk_update': ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
    'units.csv_import': ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
    'units.approve': ['SUPER_ADMIN'],

    // Leads management
    'leads.create': ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'AGENT'],
    'leads.edit': ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'AGENT'],
    'leads.delete': ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
    'leads.view': ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'AGENT'],
    'leads.assign': ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],

    // Organization management
    'organizations.create': ['SUPER_ADMIN'],
    'organizations.edit': ['SUPER_ADMIN'],
    'organizations.delete': ['SUPER_ADMIN'],
    'organizations.settings': ['SUPER_ADMIN', 'ADMIN'],

    // Currency management
    'currencies.create': ['SUPER_ADMIN'],
    'currencies.edit': ['SUPER_ADMIN'],
    'currencies.delete': ['SUPER_ADMIN'],
    'currencies.view': ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'AGENT', 'USER'],

    // Integration management
    'integrations.create': ['SUPER_ADMIN', 'ADMIN'],
    'integrations.edit': ['SUPER_ADMIN', 'ADMIN'],
    'integrations.delete': ['SUPER_ADMIN', 'ADMIN'],
    'integrations.view': ['SUPER_ADMIN', 'ADMIN'],

    // Analytics
    'analytics.global': ['SUPER_ADMIN'],
    'analytics.organization': ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
    'analytics.personal': ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'AGENT'],

    // User management
    'users.create': ['SUPER_ADMIN', 'ADMIN'],
    'users.edit': ['SUPER_ADMIN', 'ADMIN'],
    'users.delete': ['SUPER_ADMIN'],
    'users.view': ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
};

/**
 * Check if user has permission for an action
 */
export function hasPermission(userRole: string, permission: string): boolean {
    const allowedRoles = PERMISSIONS[permission as keyof typeof PERMISSIONS];
    if (!allowedRoles) {
        console.warn(`Permission "${permission}" not defined`);
        return false;
    }
    return allowedRoles.includes(userRole);
}

/**
 * Middleware to check if user has required permission
 * Usage: requirePermission('units.create')
 */
export function requirePermission(permission: string) {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = (req as any).user;

        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'No autenticado',
            });
        }

        if (!hasPermission(user.role, permission)) {
            return res.status(403).json({
                success: false,
                error: `No tienes permiso para: ${permission}`,
                required_roles: PERMISSIONS[permission as keyof typeof PERMISSIONS],
            });
        }

        next();
    };
}

/**
 * Middleware to check if user is SUPER_ADMIN
 */
export function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
    const user = (req as any).user;

    if (!user || user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({
            success: false,
            error: 'Acceso denegado. Solo SUPER_ADMIN',
        });
    }

    next();
}

/**
 * Middleware to allow only SUPER_ADMIN and organization ADMIN
 */
export function requireOrgAdmin(req: Request, res: Response, next: NextFunction) {
    const user = (req as any).user;

    if (!user || !['SUPER_ADMIN', 'ADMIN'].includes(user.role)) {
        return res.status(403).json({
            success: false,
            error: 'Acceso denegado. Se requiere ADMIN o SUPER_ADMIN',
        });
    }

    next();
}

export { PERMISSIONS };
