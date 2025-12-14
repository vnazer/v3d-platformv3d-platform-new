'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api';

export default function NewLeadPage() {
    const router = useRouter();
    const { isAuthenticated } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [projects, setProjects] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        company: '',
        project_id: '',
        stage: 'NEW',
        source: '',
        budget: '',
        notes: '',
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
                name: formData.name,
                project_id: formData.project_id,
                stage: formData.stage,
            };

            if (formData.email) data.email = formData.email;
            if (formData.phone) data.phone = formData.phone;
            if (formData.company) data.company = formData.company;
            if (formData.source) data.source = formData.source;
            if (formData.notes) data.notes = formData.notes;
            if (formData.budget) data.budget = parseFloat(formData.budget);

            await apiClient.createLead(data);
            router.push('/leads');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to create lead');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6">
                    <Link href="/leads" className="text-blue-600 hover:text-blue-700">
                        ← Back to Leads
                    </Link>
                </div>

                <div className="bg-white rounded-lg shadow p-8">
                    <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Lead</h1>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                    Lead Name *
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="John Doe"
                                />
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="john@example.com"
                                />
                            </div>

                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                                    Phone
                                </label>
                                <input
                                    type="tel"
                                    id="phone"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="+1234567890"
                                />
                            </div>

                            <div>
                                <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
                                    Company
                                </label>
                                <input
                                    type="text"
                                    id="company"
                                    name="company"
                                    value={formData.company}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="ACME Inc"
                                />
                            </div>

                            <div>
                                <label htmlFor="project_id" className="block text-sm font-medium text-gray-700 mb-1">
                                    Project *
                                </label>
                                <select
                                    id="project_id"
                                    name="project_id"
                                    required
                                    value={formData.project_id}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select a project</option>
                                    {projects.map((project) => (
                                        <option key={project.id} value={project.id}>
                                            {project.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label htmlFor="stage" className="block text-sm font-medium text-gray-700 mb-1">
                                    Stage
                                </label>
                                <select
                                    id="stage"
                                    name="stage"
                                    value={formData.stage}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="NEW">New</option>
                                    <option value="CONTACTED">Contacted</option>
                                    <option value="QUALIFIED">Qualified</option>
                                    <option value="PROPOSAL">Proposal</option>
                                    <option value="NEGOTIATION">Negotiation</option>
                                    <option value="WON">Won</option>
                                    <option value="LOST">Lost</option>
                                </select>
                            </div>

                            <div>
                                <label htmlFor="source" className="block text-sm font-medium text-gray-700 mb-1">
                                    Source
                                </label>
                                <input
                                    type="text"
                                    id="source"
                                    name="source"
                                    value={formData.source}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Website, Referral, etc."
                                />
                            </div>

                            <div>
                                <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-1">
                                    Budget
                                </label>
                                <input
                                    type="number"
                                    id="budget"
                                    name="budget"
                                    value={formData.budget}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="50000"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                                Notes
                            </label>
                            <textarea
                                id="notes"
                                name="notes"
                                rows={4}
                                value={formData.notes}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Additional information..."
                            />
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Creating...' : 'Create Lead'}
                            </button>
                            <Link
                                href="/leads"
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                            >
                                Cancel
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
