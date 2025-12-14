'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api';

interface Lead {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    company?: string;
    stage: string;
    source?: string;
    budget?: number;
    created_at: string;
    project: {
        id: string;
        name: string;
    };
    assigned_to?: {
        id: string;
        first_name?: string;
        last_name?: string;
    };
}

export default function LeadsPage() {
    const router = useRouter();
    const { isAuthenticated, loading: authLoading } = useAuth();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [stageFilter, setStageFilter] = useState('');

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/auth/login');
        }
    }, [authLoading, isAuthenticated, router]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchLeads();
        }
    }, [isAuthenticated, page, search, stageFilter]);

    const fetchLeads = async () => {
        try {
            setLoading(true);
            const response = await apiClient.getLeads({
                page,
                limit: 10,
                search: search || undefined,
                stage: stageFilter || undefined,
            });
            setLeads(response.data.leads);
            setTotal(response.data.pagination.total);
        } catch (error) {
            console.error('Failed to fetch leads:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this lead?')) return;

        try {
            await apiClient.deleteLead(id);
            fetchLeads();
        } catch (error) {
            console.error('Failed to delete lead:', error);
            alert('Failed to delete lead');
        }
    };

    if (authLoading || !isAuthenticated) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    const stageColors: Record<string, string> = {
        NEW: 'bg-blue-100 text-blue-800',
        CONTACTED: 'bg-purple-100 text-purple-800',
        QUALIFIED: 'bg-yellow-100 text-yellow-800',
        PROPOSAL: 'bg-orange-100 text-orange-800',
        NEGOTIATION: 'bg-pink-100 text-pink-800',
        WON: 'bg-green-100 text-green-800',
        LOST: 'bg-red-100 text-red-800',
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Leads</h1>
                            <p className="mt-1 text-sm text-gray-600">
                                Manage your sales pipeline
                            </p>
                        </div>
                        <Link
                            href="/leads/new"
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                        >
                            + New Lead
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
                                placeholder="Search leads..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <select
                                value={stageFilter}
                                onChange={(e) => setStageFilter(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Stages</option>
                                <option value="NEW">New</option>
                                <option value="CONTACTED">Contacted</option>
                                <option value="QUALIFIED">Qualified</option>
                                <option value="PROPOSAL">Proposal</option>
                                <option value="NEGOTIATION">Negotiation</option>
                                <option value="WON">Won</option>
                                <option value="LOST">Lost</option>
                            </select>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                            {total} lead{total !== 1 ? 's' : ''} found
                        </div>
                    </div>
                </div>

                {/* Leads Table */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    </div>
                ) : leads.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-12 text-center">
                        <p className="text-gray-500 text-lg">No leads found</p>
                        <Link
                            href="/leads/new"
                            className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Create your first lead
                        </Link>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Contact
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Project
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Stage
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Assigned
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Budget
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {leads.map((lead) => (
                                    <tr key={lead.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{lead.name}</div>
                                            {lead.company && (
                                                <div className="text-sm text-gray-500">{lead.company}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{lead.email || '-'}</div>
                                            <div className="text-sm text-gray-500">{lead.phone || '-'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {lead.project.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs font-medium rounded ${stageColors[lead.stage]}`}>
                                                {lead.stage}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {lead.assigned_to
                                                ? `${lead.assigned_to.first_name || ''} ${lead.assigned_to.last_name || ''}`.trim() || 'Assigned'
                                                : 'Unassigned'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {lead.budget ? `$${lead.budget.toLocaleString()}` : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <Link
                                                href={`/leads/${lead.id}`}
                                                className="text-blue-600 hover:text-blue-900 mr-3"
                                            >
                                                View
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(lead.id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {!loading && leads.length > 0 && (
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
                            disabled={leads.length < 10}
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
