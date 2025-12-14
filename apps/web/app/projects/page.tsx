'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api';

interface Project {
    id: string;
    name: string;
    description?: string;
    status: string;
    address?: string;
    created_at: string;
    _count: {
        units: number;
        leads: number;
    };
}

export default function ProjectsPage() {
    const router = useRouter();
    const { isAuthenticated, loading: authLoading } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/auth/login');
        }
    }, [authLoading, isAuthenticated, router]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchProjects();
        }
    }, [isAuthenticated, page, search, statusFilter]);

    const fetchProjects = async () => {
        try {
            setLoading(true);
            const response = await apiClient.getProjects({
                page,
                limit: 10,
                search: search || undefined,
                status: statusFilter || undefined,
            });
            setProjects(response.data.projects);
            setTotal(response.data.pagination.total);
        } catch (error) {
            console.error('Failed to fetch projects:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this project?')) return;

        try {
            await apiClient.deleteProject(id);
            fetchProjects();
        } catch (error) {
            console.error('Failed to delete project:', error);
            alert('Failed to delete project');
        }
    };

    if (authLoading || !isAuthenticated) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    const statusColors: Record<string, string> = {
        ACTIVE: 'bg-green-100 text-green-800',
        DRAFT: 'bg-yellow-100 text-yellow-800',
        ARCHIVED: 'bg-gray-100 text-gray-800',
        COMPLETED: 'bg-blue-100 text-blue-800',
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
                            <p className="mt-1 text-sm text-gray-600">
                                Manage your real estate projects
                            </p>
                        </div>
                        <Link
                            href="/projects/new"
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                        >
                            + New Project
                        </Link>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="bg-white rounded-lg shadow p-4 mb-6">
                    <div className="grid md:grid-cols-3 gap-4">
                        <div>
                            <input
                                type="text"
                                placeholder="Search projects..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Status</option>
                                <option value="ACTIVE">Active</option>
                                <option value="DRAFT">Draft</option>
                                <option value="COMPLETED">Completed</option>
                                <option value="ARCHIVED">Archived</option>
                            </select>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                            {total} project{total !== 1 ? 's' : ''} found
                        </div>
                    </div>
                </div>

                {/* Projects Grid */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    </div>
                ) : projects.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-12 text-center">
                        <p className="text-gray-500 text-lg">No projects found</p>
                        <Link
                            href="/projects/new"
                            className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Create your first project
                        </Link>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {projects.map((project) => (
                            <div key={project.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-xl font-semibold text-gray-900">
                                            {project.name}
                                        </h3>
                                        <span className={`px-2 py-1 text-xs font-medium rounded ${statusColors[project.status]}`}>
                                            {project.status}
                                        </span>
                                    </div>

                                    {project.description && (
                                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                                            {project.description}
                                        </p>
                                    )}

                                    {project.address && (
                                        <p className="text-gray-500 text-sm mb-4">
                                            📍 {project.address}
                                        </p>
                                    )}

                                    <div className="flex gap-4 text-sm text-gray-600 mb-4">
                                        <div>
                                            <span className="font-medium">{project._count.units}</span> Units
                                        </div>
                                        <div>
                                            <span className="font-medium">{project._count.leads}</span> Leads
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <Link
                                            href={`/projects/${project.id}`}
                                            className="flex-1 text-center px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm font-medium"
                                        >
                                            View
                                        </Link>
                                        <Link
                                            href={`/projects/${project.id}/edit`}
                                            className="flex-1 text-center px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm font-medium"
                                        >
                                            Edit
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(project.id)}
                                            className="px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm font-medium"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {!loading && projects.length > 0 && (
                    <div className="mt-6 flex justify-center gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        <span className="px-4 py-2 bg-white border border-gray-300 rounded-lg">
                            Page {page}
                        </span>
                        <button
                            onClick={() => setPage(p => p + 1)}
                            disabled={projects.length < 10}
                            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
