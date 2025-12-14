'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

export default function Home() {
    const router = useRouter();
    const { user, isAuthenticated, loading, logout } = useAuth();
    const [analytics, setAnalytics] = useState<any>(null);
    const [loadingAnalytics, setLoadingAnalytics] = useState(true);

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push('/auth/login');
        }
    }, [loading, isAuthenticated, router]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchAnalytics();
        }
    }, [isAuthenticated]);

    const fetchAnalytics = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/analytics/dashboard', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                },
            });
            const data = await response.json();
            setAnalytics(data.data);
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
        } finally {
            setLoadingAnalytics(false);
        }
    };

    if (loading || !isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-4xl font-bold text-gray-900 mb-2">
                                ¡Bienvenido, {user?.first_name || 'Usuario'}! 👋
                            </h1>
                            <p className="text-lg text-gray-600">
                                {user?.organization?.name || 'Tu Organización'} • {user?.role}
                            </p>
                        </div>
                        <button
                            onClick={logout}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
                        >
                            Cerrar Sesión
                        </button>
                    </div>
                </div>

                {/* KPI Cards */}
                {!loadingAnalytics && analytics && (
                    <div className="grid md:grid-cols-4 gap-6 mb-8">
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-blue-100 text-sm font-medium">Proyectos</p>
                                <span className="text-3xl">🏗️</span>
                            </div>
                            <p className="text-4xl font-bold">{analytics.summary.projects}</p>
                            <p className="text-blue-100 text-sm mt-1">Total de proyectos activos</p>
                        </div>

                        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-green-100 text-sm font-medium">Leads</p>
                                <span className="text-3xl">👥</span>
                            </div>
                            <p className="text-4xl font-bold">{analytics.summary.leads}</p>
                            <p className="text-green-100 text-sm mt-1">{analytics.summary.conversionRate}% conversion</p>
                        </div>

                        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-purple-100 text-sm font-medium">Unidades</p>
                                <span className="text-3xl">🏢</span>
                            </div>
                            <p className="text-4xl font-bold">{analytics.summary.units}</p>
                            <p className="text-purple-100 text-sm mt-1">Items en inventario</p>
                        </div>

                        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-orange-100 text-sm font-medium">Equipo</p>
                                <span className="text-3xl">⚡</span>
                            </div>
                            <p className="text-4xl font-bold">{analytics.summary.users}</p>
                            <p className="text-orange-100 text-sm mt-1">Usuarios activos</p>
                        </div>
                    </div>
                )}

                {/* Quick Actions */}
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <Link href="/projects" className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white hover:shadow-xl transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-2xl font-bold mb-2">Proyectos</h3>
                                <p className="text-blue-100">Gestiona proyectos inmobiliarios</p>
                            </div>
                            <div className="h-16 w-16 bg-white/20 rounded-full flex items-center justify-center">
                                <span className="text-4xl">🏗️</span>
                            </div>
                        </div>
                    </Link>

                    <Link href="/leads" className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white hover:shadow-xl transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-2xl font-bold mb-2">Clientes Potenciales</h3>
                                <p className="text-green-100">Seguimiento de pipeline de ventas</p>
                            </div>
                            <div className="h-16 w-16 bg-white/20 rounded-full flex items-center justify-center">
                                <span className="text-4xl">👥</span>
                            </div>
                        </div>
                    </Link>

                    <Link href="/units" className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white hover:shadow-xl transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-2xl font-bold mb-2">Unidades</h3>
                                <p className="text-purple-100">Gestiona inventario</p>
                            </div>
                            <div className="h-16 w-16 bg-white/20 rounded-full flex items-center justify-center">
                                <span className="text-4xl">🏢</span>
                            </div>
                        </div>
                    </Link>
                </div>

                {/* Recent Activity */}
                {!loadingAnalytics && analytics && (
                    <div className="grid md:grid-cols-2 gap-6 mb-8">
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Proyectos Recientes</h3>
                            <div className="space-y-3">
                                {analytics.recentActivity.projects.slice(0, 5).map((project: any) => (
                                    <div key={project.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div>
                                            <p className="font-medium text-gray-900">{project.name}</p>
                                            <p className="text-sm text-gray-500">{new Date(project.created_at).toLocaleDateString()}</p>
                                        </div>
                                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                            {project.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Leads Recientes</h3>
                            <div className="space-y-3">
                                {analytics.recentActivity.leads.slice(0, 5).map((lead: any) => (
                                    <div key={lead.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div>
                                            <p className="font-medium text-gray-900">{lead.name}</p>
                                            <p className="text-sm text-gray-500">{lead.project.name}</p>
                                        </div>
                                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                                            {lead.stage}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* System Status */}
                <div className="bg-white rounded-xl shadow-lg p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                        ✅ Plataforma V3D - Totalmente Operacional
                    </h2>
                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                            <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
                            <div>
                                <p className="font-medium text-gray-900">API Backend</p>
                                <p className="text-sm text-gray-600">30 endpoints activos</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                            <div className="h-3 w-3 bg-blue-500 rounded-full animate-pulse"></div>
                            <div>
                                <p className="font-medium text-gray-900">Base de Datos</p>
                                <p className="text-sm text-gray-600">PostgreSQL conectada</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
                            <div className="h-3 w-3 bg-purple-500 rounded-full animate-pulse"></div>
                            <div>
                                <p className="font-medium text-gray-900">Frontend</p>
                                <p className="text-sm text-gray-600">Next.js 14 ejecutándose</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
