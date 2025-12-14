'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api';

export default function NewUnitPage() {
    const router = useRouter();
    const { isAuthenticated } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [projects, setProjects] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        sku: '',
        name: '',
        project_id: '',
        unit_type: 'APARTMENT',
        status: 'AVAILABLE',
        price: '',
        currency: 'USD',
        bedrooms: '',
        bathrooms: '',
        area_sqm: '',
        floor: '',
    });

    useEffect(() => {
        if (isAuthenticated) {
            fetchProjects();
        }
    }, [isAuthenticated]);

    const fetchProjects = async () => {
        try {
            const response = await apiClient.getProjects({ limit: 100 });
            setProjects(response.data.projects);
        } catch (error) {
            console.error('Failed to fetch projects:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const data: any = {
                sku: formData.sku,
                unit_type: formData.unit_type,
                status: formData.status,
                price: parseFloat(formData.price),
                project_id: formData.project_id,
            };

            if (formData.name) data.name = formData.name;
            if (formData.bedrooms) data.bedrooms = parseInt(formData.bedrooms);
            if (formData.bathrooms) data.bathrooms = parseFloat(formData.bathrooms);
            if (formData.area_sqm) data.area_sqm = parseFloat(formData.area_sqm);
            if (formData.floor) data.floor = parseInt(formData.floor);

            const response = await fetch('http://localhost:3000/api/units', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al crear unidad');
            }

            router.push('/units');
        } catch (err: any) {
            setError(err.message || 'Error al crear unidad');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6">
                    <Link href="/units" className="text-blue-600 hover:text-blue-700">
                        ← Volver a Unidades
                    </Link>
                </div>

                <div className="bg-white rounded-lg shadow p-8">
                    <h1 className="text-2xl font-bold text-gray-900 mb-6">Crear Nueva Unidad</h1>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Información Básica */}
                        <div className="border-b pb-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Información Básica</h2>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-1">
                                        SKU / Código *
                                    </label>
                                    <input
                                        type="text"
                                        id="sku"
                                        name="sku"
                                        required
                                        value={formData.sku}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="A-101"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                        Nombre (opcional)
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Departamento 101"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="project_id" className="block text-sm font-medium text-gray-700 mb-1">
                                        Proyecto *
                                    </label>
                                    <select
                                        id="project_id"
                                        name="project_id"
                                        required
                                        value={formData.project_id}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Seleccionar proyecto</option>
                                        {projects.map((project) => (
                                            <option key={project.id} value={project.id}>
                                                {project.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="unit_type" className="block text-sm font-medium text-gray-700 mb-1">
                                        Tipo de Unidad *
                                    </label>
                                    <select
                                        id="unit_type"
                                        name="unit_type"
                                        value={formData.unit_type}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="APARTMENT">Departamento</option>
                                        <option value="HOUSE">Casa</option>
                                        <option value="COMMERCIAL">Comercial</option>
                                        <option value="LAND">Terreno</option>
                                        <option value="OFFICE">Oficina</option>
                                        <option value="PARKING">Estacionamiento</option>
                                        <option value="STORAGE">Bodega</option>
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                                        Estado *
                                    </label>
                                    <select
                                        id="status"
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="AVAILABLE">Disponible</option>
                                        <option value="RESERVED">Reservado</option>
                                        <option value="SOLD">Vendido</option>
                                        <option value="UNAVAILABLE">No Disponible</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Precio */}
                        <div className="border-b pb-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Precio</h2>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                                        Precio *
                                    </label>
                                    <input
                                        type="number"
                                        id="price"
                                        name="price"
                                        required
                                        step="0.01"
                                        value={formData.price}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="150000"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
                                        Moneda *
                                    </label>
                                    <select
                                        id="currency"
                                        name="currency"
                                        value={formData.currency}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="USD">USD - Dólar</option>
                                        <option value="CLP">CLP - Peso Chileno</option>
                                        <option value="UF">UF - Unidad de Fomento</option>
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {formData.currency === 'USD' && '$ USD'}
                                        {formData.currency === 'CLP' && '$ CLP'}
                                        {formData.currency === 'UF' && 'UF'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Características */}
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Características</h2>
                            <div className="grid md:grid-cols-4 gap-6">
                                <div>
                                    <label htmlFor="bedrooms" className="block text-sm font-medium text-gray-700 mb-1">
                                        Dormitorios
                                    </label>
                                    <input
                                        type="number"
                                        id="bedrooms"
                                        name="bedrooms"
                                        min="0"
                                        value={formData.bedrooms}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="2"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="bathrooms" className="block text-sm font-medium text-gray-700 mb-1">
                                        Baños
                                    </label>
                                    <input
                                        type="number"
                                        id="bathrooms"
                                        name="bathrooms"
                                        min="0"
                                        step="0.5"
                                        value={formData.bathrooms}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="2"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="area_sqm" className="block text-sm font-medium text-gray-700 mb-1">
                                        Área (m²)
                                    </label>
                                    <input
                                        type="number"
                                        id="area_sqm"
                                        name="area_sqm"
                                        min="0"
                                        step="0.01"
                                        value={formData.area_sqm}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="75.5"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="floor" className="block text-sm font-medium text-gray-700 mb-1">
                                        Piso
                                    </label>
                                    <input
                                        type="number"
                                        id="floor"
                                        name="floor"
                                        value={formData.floor}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="1"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-4 pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Creando...' : 'Crear Unidad'}
                            </button>
                            <Link
                                href="/units"
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium text-center"
                            >
                                Cancelar
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
