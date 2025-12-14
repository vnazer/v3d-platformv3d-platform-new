// V3D Platform - Projects Table Component
// React component for displaying projects with pagination and filtering
// Uses Tailwind CSS and simulated Shadcn/UI components

'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Loader, Search, Eye, Edit2, Trash2 } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'ACTIVE' | 'ARCHIVED' | 'DRAFT' | 'COMPLETED';
  address?: string;
  thumbnail_url?: string;
  unitCount: number;
  leadCount: number;
  created_at: string;
  updated_at: string;
}

interface ApiResponse {
  success: boolean;
  data: Project[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

const statusColorMap = {
  ACTIVE: 'bg-green-100 text-green-800 border-green-300',
  ARCHIVED: 'bg-gray-100 text-gray-800 border-gray-300',
  DRAFT: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  COMPLETED: 'bg-blue-100 text-blue-800 border-blue-300',
};

const statusLabelMap = {
  ACTIVE: 'Active',
  ARCHIVED: 'Archived',
  DRAFT: 'Draft',
  COMPLETED: 'Completed',
};

export default function ProjectsTable() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [meta, setMeta] = useState<ApiResponse['meta'] | null>(null);

  const ITEMS_PER_PAGE = 10;

  // Fetch projects from API
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: ITEMS_PER_PAGE.toString(),
          sortBy,
          sortOrder,
        });

        if (searchTerm) params.append('search', searchTerm);
        if (statusFilter) params.append('status', statusFilter);

        const token = localStorage.getItem('token');
        const response = await fetch(`/api/projects?${params.toString()}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch projects');
        }

        const data: ApiResponse = await response.json();
        setProjects(data.data);
        setMeta(data.meta);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [currentPage, searchTerm, statusFilter, sortBy, sortOrder]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (status: string | null) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="mt-1 text-gray-600">
            {meta?.total || 0} total projects
          </p>
        </div>
        <button
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 transition-colors"
        >
          + New Project
        </button>
      </div>

      {/* Filters & Search */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-3">
          {/* Search */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search projects by name or address..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter || ''}
              onChange={(e) => handleStatusFilter(e.target.value || null)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="DRAFT">Draft</option>
              <option value="COMPLETED">Completed</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          <p className="text-sm font-medium">Error loading projects</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-600">
            <p className="text-lg font-medium">No projects found</p>
            <p className="text-sm">Try adjusting your search filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900">
                    <button
                      onClick={() => handleSort('name')}
                      className="flex items-center gap-2 hover:text-blue-600"
                    >
                      Project Name
                      {sortBy === 'name' && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900">
                    Status
                  </th>
                  <th className="px-6 py-3 text-center font-semibold text-gray-900">
                    Units
                  </th>
                  <th className="px-6 py-3 text-center font-semibold text-gray-900">
                    Leads
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900">
                    <button
                      onClick={() => handleSort('created_at')}
                      className="flex items-center gap-2 hover:text-blue-600"
                    >
                      Created
                      {sortBy === 'created_at' && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-right font-semibold text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {projects.map((project) => (
                  <tr key={project.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{project.name}</p>
                        {project.description && (
                          <p className="text-xs text-gray-500 line-clamp-1">
                            {project.description}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {project.address || '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusColorMap[project.status]}`}
                      >
                        {statusLabelMap[project.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-900">
                        {project.unitCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-green-100 text-sm font-semibold text-green-900">
                        {project.leadCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {formatDate(project.created_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-6 py-4 shadow-sm">
          <div className="text-sm text-gray-600">
            Page {meta.page} of {meta.totalPages} • {meta.total} total results
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(meta.page - 1)}
              disabled={!meta.hasPreviousPage}
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-3 py-2 font-medium text-gray-900 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(meta.page + 1)}
              disabled={!meta.hasNextPage}
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-3 py-2 font-medium text-gray-900 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
