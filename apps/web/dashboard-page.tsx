// V3D Platform - Dashboard Page
// Main dashboard with metrics, charts, and project overview

import React from 'react';
import { TrendingUp, Users, Home, Target } from 'lucide-react';
import ProjectsTable from '@/components/ProjectsTable';

// Metrics card component
function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
  trendColor,
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  trend?: string;
  trendColor?: 'green' | 'red' | 'gray';
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          {trend && (
            <p className={`mt-1 text-sm font-medium ${
              trendColor === 'green' ? 'text-green-600' :
              trendColor === 'red' ? 'text-red-600' :
              'text-gray-600'
            }`}>
              {trend}
            </p>
          )}
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
          <Icon className="h-6 w-6 text-blue-600" />
        </div>
      </div>
    </div>
  );
}

// Chart placeholder component
function ChartPlaceholder({ title }: { title: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">{title}</h3>
      <div className="flex h-64 items-center justify-center bg-gray-50">
        <p className="text-gray-500">Chart placeholder - integrate with Chart.js or Recharts</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">Welcome to V3D Platform. Monitor your projects and leads.</p>
        </div>

        {/* Key Metrics */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Projects"
            value="24"
            icon={Home}
            trend="+3 this month"
            trendColor="green"
          />
          <MetricCard
            title="Active Leads"
            value="147"
            icon={Target}
            trend="+12 this week"
            trendColor="green"
          />
          <MetricCard
            title="Team Members"
            value="8"
            icon={Users}
            trend="No changes"
            trendColor="gray"
          />
          <MetricCard
            title="Conversion Rate"
            value="32%"
            icon={TrendingUp}
            trend="+2% vs last month"
            trendColor="green"
          />
        </div>

        {/* Charts Row */}
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartPlaceholder title="Projects by Status" />
          <ChartPlaceholder title="Lead Conversion Funnel" />
        </div>

        {/* Projects Table */}
        <div className="mb-8">
          <ProjectsTable />
        </div>

        {/* Recent Activity (Optional) */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Recent Activity</h2>
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="flex items-start gap-4 border-b border-gray-200 pb-4 last:border-b-0">
                <div className="h-10 w-10 rounded-full bg-blue-100" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Project updated</p>
                  <p className="text-xs text-gray-500">2 hours ago</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
