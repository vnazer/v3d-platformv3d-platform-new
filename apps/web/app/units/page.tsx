'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

interface Unit {
    id: string;
    sku: string;
    name?: string;
    unit_type: string;
    status: string;
    price: number;
    bedrooms?: number;
    bathrooms?: number;
    area_sqm?: number;
    floor?: number;
    project: {
        id: string;
        name: string;
    };
}

export default function UnitsPage() {
    const router = useRouter();
    const { isAuthenticated, loading: authLoading } = useAuth();
    const [units, setUnits] = useState<Unit[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [filters, setFilters] = useState({
        search: '',
        status: '',
        unit_type: '',
    });

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/auth/login');
        }
    }, [authLoading, isAuthenticated, router]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchUnits();
        }
    }, [isAuthenticated, page, filters]);

    const fetchUnits = async () => {
        try {
            setLoading(true);
            const params: any = { page, limit: 12 };
            if (filters.search) params.search = filters.search;
            if (filters.status) params.status = filters.status;
            if (filters.unit_type) params.unit_type = filters.unit_type;

            const response = await fetch(`http://localhost:3000/api/units?${new URLSearchParams(params)}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                },
            });
            const data = await response.json();
            setUnits(data.data.units);
            setTotal(data.data.pagination.total);
        } catch (error) {
            console.error('Failed to fetch units:', error);
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || !isAuthenticated) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    const statusColors: Record<string, string> = {
        AVAILABLE: 'bg-green-100 text-green-800',
        RESERVED: 'bg-yellow-100 text-yellow-800',
        SOLD: 'bg-red-100 text-red-800',
        UNAVAILABLE: 'bg-gray-100 text-gray-800',
    };

    const typeIcons: Record<string, string> = {
        APARTMENT: '🏢',
        HOUSE: '🏠',
        COMMERCIAL: '🏪',
        LAND: '🌳',
        OFFICE: '🏛️',
        PARKING: '🅿️',
        STORAGE: '📦',
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Inventario de Unidades</h1>
                            <p className="mt-1 text-sm text-gray-600">
                                Gestiona unidades inmobiliarias en todos los proyectos
                            </p>
                        </div>
                        <Link
                            href="/units/new"
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                        >
                            + Nueva Unidad
                        </Link>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="bg-white rounded-lg shadow p-4 mb-6">
                    <div className="grid md:grid-cols-4 gap-4">
                        <input
                            type="text"
                            placeholder="Buscar unidades..."
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Todos los Estados</option>
                            <option value="AVAILABLE">Disponible</option>
                            <option value="RESERVED">Reservado</option>
                            <option value="SOLD">Vendido</option>
                            <option value="UNAVAILABLE">No Disponible</option>
                        </select>
                        <select
                            value={filters.unit_type}
                            onChange={(e) => setFilters({ ...filters, unit_type: e.target.value })}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Todos los Tipos</option>
                            <option value="APARTMENT">Departamento</option>
                            <option value="HOUSE">Casa</option>
                            <option value="COMMERCIAL">Comercial</option>
                            <option value="LAND">Terreno</option>
                            <option value="OFFICE">Oficina</option>
                            <option value="PARKING">Estacionamiento</option>
                            <option value="STORAGE">Bodega</option>
                        </select>
                        <div className="flex items-center text-sm text-gray-600">
                            {total} unidad{total !== 1 ? 'es' : ''} encontrada{total !== 1 ? 's' : ''}
                        </div>
                    </div>
                </div>

                {/* Units Grid */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    </div>
                ) : units.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-12 text-center">
                        <p className="text-gray-500 text-lg">No se encontraron unidades</p>
                        <Link
                            href="/units/new"
                            className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Agregar tu primera unidad
                        </Link>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {units.map((unit) => (
                            <div key={unit.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                                <div className="p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-3xl">{typeIcons[unit.unit_type]}</span>
                                        <span className={`px-2 py-1 text-xs font-medium rounded ${statusColors[unit.status]}`}>
                                            {unit.status}
                                        </span>
                                    </div>

                                    <h3 className="font-semibold text-gray-900 mb-1">
                                        {unit.name || unit.sku}
                                    </h3>
                                    <p className="text-xs text-gray-500 mb-3">{unit.project.name}</p>

                                    <div className="text-2xl font-bold text-blue-600 mb-3">
                                        ${unit.price.toLocaleString()}
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 text-xs text-gray-600 mb-3">
                                        {unit.bedrooms !== undefined && (
                                            <div className="text-center">
                                                <div className="font-medium">{unit.bedrooms}</div>
                                                <div>Dorms</div>
                                            </div>
                                        )}
                                        {unit.bathrooms !== undefined && (
                                            <div className="text-center">
                                                <div className="font-medium">{unit.bathrooms}</div>
                                                <div>Baños</div>
                                            </div>
                                        )}
                                        {unit.area_sqm !== undefined && (
                                            <div className="text-center">
                                                <div className="font-medium">{unit.area_sqm}</div>
                                                <div>m²</div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-2">
                                        <Link
                                            href={`/units/${unit.id}`}
                                            className="flex-1 text-center px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200"
                                        >
                                            Ver
                                        </Link>
                                        <Link
                                            href={`/projects/${unit.project.id}`}
                                            className="flex-1 text-center px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200"
                                        >
                                            Proyecto
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {!loading && units.length > 0 && (
                    <div className="mt-6 flex justify-center gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                        >
                            Anterior
                        </button>
                        <span className="px-4 py-2 bg-white border border-gray-300 rounded-lg">
                            Página {page}
                        </span>
                        <button
                            onClick={() => setPage(p => p + 1)}
                            disabled={units.length < 12}
                            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                        >
                            Siguiente
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
