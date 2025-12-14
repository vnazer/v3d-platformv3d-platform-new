'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

export default function MagamaAdminPage() {
    const router = useRouter();
    const { user, isAuthenticated, loading } = useAuth();

    useEffect(() => {
        if (!loading && (!isAuthenticated || user?.role !== 'SUPER_ADMIN')) {
            router.push('/');
        }
    }, [loading, isAuthenticated, user, router]);

    if (loading || !isAuthenticated || user?.role !== 'SUPER_ADMIN') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <Link href="/" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
                        ← Volver al Dashboard
                    </Link>
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-4xl font-bold text-gray-900 mb-2">
                                Panel MAGAMA 🔧
                            </h1>
                            <p className="text-lg text-gray-600">
                                Administración del sistema - Acceso SUPER_ADMIN
                            </p>
                        </div>
                        <div className="px-4 py-2 bg-purple-100 text-purple-800 rounded-lg font-medium">
                            SUPER_ADMIN
                        </div>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-600 text-sm">Organizaciones</span>
                            <span className="text-2xl">🏢</span>
                        </div>
                        <p className="text-3xl font-bold text-gray-900">-</p>
                        <p className="text-xs text-gray-500 mt-1">Clientes totales</p>
                    </div>

                    <div className="bg-white rounded-xl shadow p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-600 text-sm">Proyectos</span>
                            <span className="text-2xl">🏗️</span>
                        </div>
                        <p className="text-3xl font-bold text-gray-900">-</p>
                        <p className="text-xs text-gray-500 mt-1">En todos los clientes</p>
                    </div>

                    <div className="bg-white rounded-xl shadow p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-600 text-sm">Usuarios</span>
                            <span className="text-2xl">👥</span>
                        </div>
                        <p className="text-3xl font-bold text-gray-900">-</p>
                        <p className="text-xs text-gray-500 mt-1">Total del sistema</p>
                    </div>

                    <div className="bg-white rounded-xl shadow p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-600 text-sm">Unidades</span>
                            <span className="text-2xl">📊</span>
                        </div>
                        <p className="text-3xl font-bold text-gray-900">-</p>
                        <p className="text-xs text-gray-500 mt-1">Inventario global</p>
                    </div>
                </div>

                {/* Admin Sections */}
                <div className="grid md:grid-cols-2 gap-6">
                    {/* System Management */}
                    <div className="bg-white rounded-xl shadow p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">🔧 Gestión del Sistema</h2>
                        <div className="space-y-3">
                            <Link
                                href="/admin/magama/organizations"
                                className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold text-gray-900">Organizaciones</h3>
                                        <p className="text-sm text-gray-600">Gestionar clientes</p>
                                    </div>
                                    <span className="text-2xl">→</span>
                                </div>
                            </Link>

                            <Link
                                href="/admin/magama/projects"
                                className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold text-gray-900">Proyectos</h3>
                                        <p className="text-sm text-gray-600">Crear y gestionar proyectos</p>
                                    </div>
                                    <span className="text-2xl">→</span>
                                </div>
                            </Link>

                            <Link
                                href="/admin/magama/currencies"
                                className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold text-gray-900">Monedas</h3>
                                        <p className="text-sm text-gray-600">Configurar tasas de cambio</p>
                                    </div>
                                    <span className="text-2xl">→</span>
                                </div>
                            </Link>
                        </div>
                    </div>

                    {/* Analytics */}
                    <div className="bg-white rounded-xl shadow p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">📊 Analytics Globales</h2>
                        <div className="space-y-3">
                            <Link
                                href="/admin/magama/analytics"
                                className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold text-gray-900">Dashboard Global</h3>
                                        <p className="text-sm text-gray-600">Métricas de todo el sistema</p>
                                    </div>
                                    <span className="text-2xl">→</span>
                                </div>
                            </Link>

                            <Link
                                href="/admin/magama/audit-logs"
                                className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold text-gray-900">Audit Logs</h3>
                                        <p className="text-sm text-gray-600">Historial de acciones</p>
                                    </div>
                                    <span className="text-2xl">→</span>
                                </div>
                            </Link>

                            <Link
                                href="/admin/magama/users"
                                className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold text-gray-900">Usuarios</h3>
                                        <p className="text-sm text-gray-600">Gestión de usuarios del sistema</p>
                                    </div>
                                    <span className="text-2xl">→</span>
                                </div>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Info Notice */}
                <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                        <strong>ℹ️ Nota:</strong> Este panel es solo accesible para usuarios con rol SUPER_ADMIN.
                        Los clientes tienen su propio panel de administración limitado a su organización.
                    </p>
                </div>
            </div>
        </div>
    );
}
