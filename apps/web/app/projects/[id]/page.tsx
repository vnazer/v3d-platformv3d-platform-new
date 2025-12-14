'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api';

interface Project {
    id: string;
    name: string;
    description?: string;
    status: string;
    address?: string;
    matterport_url?: string;
    created_at: string;
    updated_at: string;
    units: any[];
    leads: any[];
    _count: {
        units: number;
        leads: number;
    };
}

export default function ProjectDetailPage() {
    const router = useRouter();
    const params = useParams();
    const { isAuthenticated, loading: authLoading } = useAuth();
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/auth/login');
        }
    }, [authLoading, isAuthenticated, router]);

    useEffect(() => {
        if (isAuthenticated && params.id) {
            fetchProject();
        }
    }, [isAuthenticated, params.id]);

    const fetchProject = async () => {
        try {
            setLoading(true);
            const response = await apiClient.getProject(params.id as string);
            setProject(response.data.project);
        } catch (error) {
            console.error('Failed to fetch project:', error);
            alert('Project not found');
            router.push('/projects');
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || loading || !project) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
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
                    <div className="mb-4">
                        <Link href="/projects" className="text-blue-600 hover:text-blue-700">
                            ← Back to Projects
                        </Link>
                    </div>

                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
                                <span className={`px-3 py-1 text-sm font-medium rounded ${statusColors[project.status]}`}>
                                    {project.status}
                                </span>
                            </div>
                            {project.description && (
                                <p className="text-gray-600 mt-2">{project.description}</p>
                            )}
                            {project.address && (
                                <p className="text-gray-500 mt-2">📍 {project.address}</p>
                            )}
                        </div>
                        <Link
                            href={`/projects/${project.id}/edit`}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                        >
                            Edit Project
                        </Link>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mt-6">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                            <p className="text-sm text-blue-600 font-medium">Total Units</p>
                            <p className="text-3xl font-bold text-blue-900 mt-1">{project._count.units}</p>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                            <p className="text-sm text-green-600 font-medium">Total Leads</p>
                            <p className="text-3xl font-bold text-green-900 mt-1">{project._count.leads}</p>
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
                            <p className="text-sm text-purple-600 font-medium">Created</p>
                            <p className="text-lg font-semibold text-purple-900 mt-1">
                                {new Date(project.created_at).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="border-b border-gray-200 mt-6">
                    <nav className="-mb-px flex gap-6">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'overview'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            Overview
                        </button>
                        <button
                            onClick={() => setActiveTab('units')}
                            className={`py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'units'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            Units ({project._count.units})
                        </button>
                        <button
                            onClick={() => setActiveTab('leads')}
                            className={`py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'leads'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            Leads ({project._count.leads})
                        </button>
                    </nav>
                </div>

                {/* Tab Content */}
                <div className="py-6">
                    {activeTab === 'overview' && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold mb-4">Project Information</h3>
                            <dl className="grid grid-cols-2 gap-4">
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Status</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{project.status}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Address</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{project.address || 'N/A'}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Created</dt>
                                    <dd className="mt-1 text-sm text-gray-900">
                                        {new Date(project.created_at).toLocaleString()}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                                    <dd className="mt-1 text-sm text-gray-900">
                                        {new Date(project.updated_at).toLocaleString()}
                                    </dd>
                                </div>
                                {project.matterport_url && (
                                    <div className="col-span-2">
                                        <dt className="text-sm font-medium text-gray-500">Matterport Tour</dt>
                                        <dd className="mt-1">
                                            <a
                                                href={project.matterport_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm text-blue-600 hover:text-blue-700"
                                            >
                                                View 3D Tour →
                                            </a>
                                        </dd>
                                    </div>
                                )}
                            </dl>
                        </div>
                    )}

                    {activeTab === 'units' && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold">Units</h3>
                                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                                    + Add Unit
                                </button>
                            </div>
                            {project.units && project.units.length > 0 ? (
                                <div className="space-y-2">
                                    {project.units.map((unit: any) => (
                                        <div key={unit.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                                            <div className="flex justify-between">
                                                <div>
                                                    <p className="font-medium">{unit.name || unit.sku}</p>
                                                    <p className="text-sm text-gray-600">{unit.unit_type} - {unit.status}</p>
                                                </div>
                                                <p className="font-semibold text-green-600">
                                                    ${unit.price?.toLocaleString() || 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-center py-8">No units yet</p>
                            )}
                        </div>
                    )}

                    {activeTab === 'leads' && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold">Recent Leads</h3>
                                <Link
                                    href={`/leads/new?project=${project.id}`}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                                >
                                    + Add Lead
                                </Link>
                            </div>
                            {project.leads && project.leads.length > 0 ? (
                                <div className="space-y-2">
                                    {project.leads.map((lead: any) => (
                                        <div key={lead.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                                            <div className="flex justify-between">
                                                <div>
                                                    <p className="font-medium">{lead.name}</p>
                                                    <p className="text-sm text-gray-600">{lead.email || lead.phone}</p>
                                                    <p className="text-xs text-gray-500 mt-1">Stage: {lead.stage}</p>
                                                </div>
                                                {lead.assigned_to && (
                                                    <p className="text-sm text-gray-600">
                                                        Assigned: {lead.assigned_to.first_name} {lead.assigned_to.last_name}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-center py-8">No leads yet</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
