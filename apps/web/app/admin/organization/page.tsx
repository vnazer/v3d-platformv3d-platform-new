'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

export default function OrganizationAdminPage() {
    const router = useRouter();
    const { user, isAuthenticated, loading } = useAuth();

    useEffect(() => {
        if (!loading && (!isAuthenticated || !['ADMIN', 'SUPER_ADMIN'].includes(user?.role || ''))) {
            router.push('/');
        }
    }, [loading, isAuthenticated, user, router]);

    if (loading || !isAuthenticated || !['ADMIN', 'SUPER_ADMIN'].includes(user?.role || '')) {
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
                                Panel de Administración 🎯
                            </h1>
                            <p className="text-lg text-gray-600">
                                {user?.organization?.name || 'Tu Organización'}
                            </p>
                        </div>
                        <div className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg font-medium">
                            {user?.role}
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <Link
                        href="/units"
                        className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white hover:shadow-xl transition"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-2xl font-bold">Unidades</h3>
                            <span className="text-4xl">🏢</span>
                        </div>
                        <p className="text-purple-100">Gestión completa de inventario</p>
                    </Link>

                    <Link
                        href="/leads"
                        className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white hover:shadow-xl transition"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-2xl font-bold">Leads</h3>
                            <span className="text-4xl">👥</span>
                        </div>
                        <p className="text-green-100">Pipeline de ventas</p>
                    </Link>

                    <Link
                        href="/admin/organization/team"
                        className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white hover:shadow-xl transition"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-2xl font-bold">Equipo</h3>
                            <span className="text-4xl">⚡</span>
                        </div>
                        <p className="text-orange-100">Gestión de usuarios</p>
                    </Link>
                </div>

                {/* Management Sections */}
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Inventory Management */}
                    <div className="bg-white rounded-xl shadow p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">📦 Gestión de Inventario</h2>
                        <div className="space-y-3">
                            <Link
                                href="/units"
                                className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold text-gray-900">Ver Unidades</h3>
                                        <p className="text-sm text-gray-600">Lista completa del inventario</p>
                                    </div>
                                    <span className="text-2xl">→</span>
                                </div>
                            </Link>

                            <Link
                                href="/units/new"
                                className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold text-gray-900">Agregar Unidad</h3>
                                        <p className="text-sm text-gray-600">Crear nueva unidad</p>
                                    </div>
                                    <span className="text-2xl">→</span>
                                </div>
                            </Link>

                            <div className="block p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                                <div>
                                    <h3 className="font-semibold text-blue-900">📊 Operaciones Masivas</h3>
                                    <p className="text-sm text-blue-700 mt-1">
                                        Actualiza múltiples unidades a la vez usando la lista de inventario
                                    </p>
                                </div>
                            </div>

                            <div className="block p-4 bg-green-50 rounded-lg border-2 border-green-200">
                                <div>
                                    <h3 className="font-semibold text-green-900">📤 Importar/Exportar CSV</h3>
                                    <p className="text-sm text-green-700 mt-1">
                                        Gestiona tu inventario con archivos CSV desde la lista de unidades
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Settings & Configuration */}
                    <div className="bg-white rounded-xl shadow p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">⚙️ Configuración</h2>
                        <div className="space-y-3">
                            <Link
                                href="/admin/organization/settings"
                                className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold text-gray-900">Configuración General</h3>
                                        <p className="text-sm text-gray-600">Monedas, permisos, preferencias</p>
                                    </div>
                                    <span className="text-2xl">→</span>
                                </div>
                            </Link>

                            <Link
                                href="/admin/organization/integrations"
                                className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold text-gray-900">Integraciones CRM</h3>
                                        <p className="text-sm text-gray-600">Conectar con sistemas externos</p>
                                    </div>
                                    <span className="text-2xl">→</span>
                                </div>
                            </Link>

                            <Link
                                href="/admin/organization/analytics"
                                className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold text-gray-900">Reportes y Analytics</h3>
                                        <p className="text-sm text-gray-600">Métricas de tu organización</p>
                                    </div>
                                    <span className="text-2xl">→</span>
                                </div>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Info */}
                <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                        <strong>💡 Tip:</strong> Usa las operaciones masivas e importación CSV desde la lista de unidades para gestionar grandes cantidades de inventario eficientemente.
                    </p>
                </div>
            </div>
        </div>
    );
}
