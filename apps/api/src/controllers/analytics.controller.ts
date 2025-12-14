import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Get dashboard analytics
 * GET /api/analytics/dashboard
 */
export async function getDashboardAnalytics(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const organizationId = req.organizationId!;

        // Get counts
        const [projectsCount, leadsCount, unitsCount, usersCount] = await Promise.all([
            prisma.project.count({ where: { organization_id: organizationId } }),
            prisma.lead.count({ where: { organization_id: organizationId } }),
            prisma.unit.count({
                where: { project: { organization_id: organizationId } },
            }),
            prisma.user.count({ where: { organization_id: organizationId } }),
        ]);

        // Get leads by stage
        const leadsByStage = await prisma.lead.groupBy({
            by: ['stage'],
            where: { organization_id: organizationId },
            _count: true,
        });

        // Get projects by status
        const projectsByStatus = await prisma.project.groupBy({
            by: ['status'],
            where: { organization_id: organizationId },
            _count: true,
        });

        // Get units by status
        const unitsByStatus = await prisma.unit.groupBy({
            by: ['status'],
            where: { project: { organization_id: organizationId } },
            _count: true,
        });

        // Get recent projects
        const recentProjects = await prisma.project.findMany({
            where: { organization_id: organizationId },
            orderBy: { created_at: 'desc' },
            take: 5,
            select: {
                id: true,
                name: true,
                status: true,
                created_at: true,
            },
        });

        // Get recent leads
        const recentLeads = await prisma.lead.findMany({
            where: { organization_id: organizationId },
            orderBy: { created_at: 'desc' },
            take: 5,
            select: {
                id: true,
                name: true,
                stage: true,
                created_at: true,
                project: {
                    select: {
                        name: true,
                    },
                },
            },
        });

        // Calculate conversion rate
        const wonLeads = leadsByStage.find((l) => l.stage === 'WON')?._count || 0;
        const totalLeads = leadsCount || 1; // Avoid division by zero
        const conversionRate = ((wonLeads / totalLeads) * 100).toFixed(1);

        res.json({
            success: true,
            data: {
                summary: {
                    projects: projectsCount,
                    leads: leadsCount,
                    units: unitsCount,
                    users: usersCount,
                    conversionRate: parseFloat(conversionRate),
                },
                leadsByStage: leadsByStage.map((l) => ({
                    stage: l.stage,
                    count: l._count,
                })),
                projectsByStatus: projectsByStatus.map((p) => ({
                    status: p.status,
                    count: p._count,
                })),
                unitsByStatus: unitsByStatus.map((u) => ({
                    status: u.status,
                    count: u._count,
                })),
                recentActivity: {
                    projects: recentProjects,
                    leads: recentLeads,
                },
            },
        });
    } catch (error) {
        next(error);
    }
}
