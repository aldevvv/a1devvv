'use client';

import { useTheme } from '@/lib/theme-context';
import { useAuth } from '@/lib/auth-context';
import { useState, useEffect } from 'react';
import Link from 'next/link';

// Mock project data
const mockProjects = [
  {
    id: 1,
    name: 'E-commerce Platform',
    client: 'TechCorp Inc.',
    status: 'In Progress',
    progress: 75,
    startDate: '2024-09-01',
    deadline: '2024-12-15',
    budget: 25000,
    spent: 18750,
    team: ['John Doe', 'Jane Smith', 'Mike Johnson'],
    description: 'A complete e-commerce solution with inventory management, payment processing, and analytics.',
    priority: 'High',
    category: 'Web Development'
  },
  {
    id: 2,
    name: 'Mobile App Development',
    client: 'StartupXYZ',
    status: 'In Progress',
    progress: 45,
    startDate: '2024-08-15',
    deadline: '2024-11-30',
    budget: 18000,
    spent: 8100,
    team: ['Sarah Wilson', 'Tom Brown'],
    description: 'Cross-platform mobile app for social networking with real-time messaging.',
    priority: 'High',
    category: 'Mobile Development'
  },
  {
    id: 3,
    name: 'Website Redesign',
    client: 'LocalBiz',
    status: 'Completed',
    progress: 100,
    startDate: '2024-08-01',
    deadline: '2024-10-20',
    budget: 8000,
    spent: 7800,
    team: ['Alice Cooper'],
    description: 'Complete UI/UX redesign with modern responsive design and improved performance.',
    priority: 'Medium',
    category: 'Design'
  },
  {
    id: 4,
    name: 'API Integration',
    client: 'DataFlow Ltd.',
    status: 'Planning',
    progress: 15,
    startDate: '2024-10-01',
    deadline: '2024-12-01',
    budget: 12000,
    spent: 1800,
    team: ['Bob Smith', 'Emma Davis'],
    description: 'Integration with multiple third-party APIs for data synchronization.',
    priority: 'Medium',
    category: 'Backend Development'
  },
  {
    id: 5,
    name: 'Analytics Dashboard',
    client: 'MetricsHub',
    status: 'On Hold',
    progress: 30,
    startDate: '2024-07-15',
    deadline: '2024-11-15',
    budget: 15000,
    spent: 4500,
    team: ['Chris Lee', 'Diana Prince'],
    description: 'Real-time analytics dashboard with data visualization and reporting features.',
    priority: 'Low',
    category: 'Data Visualization'
  }
];

function ProjectCard({ project }: { project: typeof mockProjects[0] }) {
  const { theme } = useTheme();
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-500';
      case 'In Progress':
        return 'bg-primary';
      case 'Planning':
        return 'bg-yellow-500';
      case 'On Hold':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'text-red-500 bg-red-100 dark:bg-red-900/20';
      case 'Medium':
        return 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/20';
      case 'Low':
        return 'text-green-500 bg-green-100 dark:bg-green-900/20';
      default:
        return 'text-gray-500 bg-gray-100 dark:bg-gray-800';
    }
  };
  
  const progressPercentage = (project.spent / project.budget) * 100;
  
  return (
    <div className={`p-6 rounded-lg border transition-all duration-200 hover:shadow-lg ${
      theme === 'dark' 
        ? 'bg-gray-900 border-gray-800 hover:border-primary/30' 
        : 'bg-white border-gray-200 hover:border-primary/30'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {project.name}
            </h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(project.priority)}`}>
              {project.priority}
            </span>
          </div>
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            {project.client} • {project.category}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(project.status)}`}>
          {project.status}
        </span>
      </div>
      
      {/* Description */}
      <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
        {project.description}
      </p>
      
      {/* Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
            Progress
          </span>
          <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {project.progress}%
          </span>
        </div>
        <div className={`w-full bg-gray-200 rounded-full h-2 ${theme === 'dark' ? 'bg-gray-700' : ''}`}>
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300" 
            style={{ width: `${project.progress}%` }}
          ></div>
        </div>
      </div>
      
      {/* Budget */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
            Budget Used
          </span>
          <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            ${project.spent.toLocaleString()} / ${project.budget.toLocaleString()}
          </span>
        </div>
        <div className={`w-full bg-gray-200 rounded-full h-2 ${theme === 'dark' ? 'bg-gray-700' : ''}`}>
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              progressPercentage > 90 ? 'bg-red-500' : progressPercentage > 75 ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
          ></div>
        </div>
      </div>
      
      {/* Team & Dates */}
      <div className="flex items-center justify-between text-sm">
        <div>
          <span className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Team: </span>
          <span className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            {project.team.length} members
          </span>
        </div>
        <div className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          Due: {new Date(project.deadline).toLocaleDateString()}
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Link
          href={`/dashboard/projects/${project.id}`}
          className="text-primary hover:text-primary/80 text-sm font-medium transition-colors"
        >
          View Details →
        </Link>
        <div className="flex space-x-2">
          <button className={`px-3 py-1 text-xs rounded transition-colors ${
            theme === 'dark' 
              ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
              : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
          }`}>
            Edit
          </button>
          <button className="px-3 py-1 text-xs bg-primary/10 text-primary hover:bg-primary/20 rounded transition-colors">
            Tasks
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  
  useEffect(() => setMounted(true), []);
  
  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-80 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }
  
  const filteredProjects = mockProjects.filter(project => {
    const matchesFilter = filter === 'all' || project.status.toLowerCase().replace(' ', '') === filter;
    const matchesSearch = search === '' || 
      project.name.toLowerCase().includes(search.toLowerCase()) ||
      project.client.toLowerCase().includes(search.toLowerCase()) ||
      project.category.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Projects
          </h1>
          <p className={`mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage and track all your development projects
          </p>
        </div>
        <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium">
          + New Project
        </button>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Projects', value: mockProjects.length, color: 'bg-primary' },
          { label: 'In Progress', value: mockProjects.filter(p => p.status === 'In Progress').length, color: 'bg-blue-500' },
          { label: 'Completed', value: mockProjects.filter(p => p.status === 'Completed').length, color: 'bg-green-500' },
          { label: 'On Hold', value: mockProjects.filter(p => p.status === 'On Hold').length, color: 'bg-gray-500' }
        ].map((stat) => (
          <div key={stat.label} className={`p-4 rounded-lg ${
            theme === 'dark' ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'
          }`}>
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full ${stat.color} mr-3`}></div>
              <div>
                <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {stat.value}
                </div>
                <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {stat.label}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full px-4 py-2 rounded-lg border transition-colors ${
              theme === 'dark'
                ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-primary'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-primary'
            } focus:outline-none focus:ring-2 focus:ring-primary/20`}
          />
        </div>
        <div className="flex gap-2">
          {[
            { key: 'all', label: 'All' },
            { key: 'inprogress', label: 'In Progress' },
            { key: 'completed', label: 'Completed' },
            { key: 'planning', label: 'Planning' },
            { key: 'onhold', label: 'On Hold' }
          ].map((filterOption) => (
            <button
              key={filterOption.key}
              onClick={() => setFilter(filterOption.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === filterOption.key
                  ? 'bg-primary text-white'
                  : theme === 'dark'
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {filterOption.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Projects Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredProjects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
      
      {/* Empty State */}
      {filteredProjects.length === 0 && (
        <div className={`text-center py-12 ${
          theme === 'dark' ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'
        } rounded-lg`}>
          <div className="text-6xl mb-4">📁</div>
          <h3 className={`text-lg font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            No projects found
          </h3>
          <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            {search || filter !== 'all' ? 'Try adjusting your filters or search terms.' : 'Create your first project to get started.'}
          </p>
          {(!search && filter === 'all') && (
            <button className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium">
              + Create Project
            </button>
          )}
        </div>
      )}
    </div>
  );
}