'use client';

import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

// Mock data for dashboard
const mockStats = {
  totalProjects: 12,
  activeProjects: 8,
  completedProjects: 4,
  totalRevenue: 125000,
  monthlyRevenue: 15000,
  clients: 6,
  tasksCompleted: 87,
  hoursWorked: 240
};

const mockRecentProjects = [
  {
    id: 1,
    name: 'E-commerce Platform',
    client: 'TechCorp Inc.',
    status: 'In Progress',
    progress: 75,
    deadline: '2024-12-15',
    budget: 25000
  },
  {
    id: 2,
    name: 'Mobile App Development',
    client: 'StartupXYZ',
    status: 'In Progress',
    progress: 45,
    deadline: '2024-11-30',
    budget: 18000
  },
  {
    id: 3,
    name: 'Website Redesign',
    client: 'LocalBiz',
    status: 'Completed',
    progress: 100,
    deadline: '2024-10-20',
    budget: 8000
  },
  {
    id: 4,
    name: 'API Integration',
    client: 'DataFlow Ltd.',
    status: 'Planning',
    progress: 15,
    deadline: '2024-12-01',
    budget: 12000
  }
];

const mockRecentTasks = [
  {
    id: 1,
    title: 'Implement user authentication',
    project: 'E-commerce Platform',
    priority: 'High',
    status: 'Completed',
    assignee: 'You',
    dueDate: '2024-10-25'
  },
  {
    id: 2,
    title: 'Design mobile UI components',
    project: 'Mobile App Development',
    priority: 'Medium',
    status: 'In Progress',
    assignee: 'You',
    dueDate: '2024-10-28'
  },
  {
    id: 3,
    title: 'Database optimization',
    project: 'E-commerce Platform',
    priority: 'High',
    status: 'Pending',
    assignee: 'Team Lead',
    dueDate: '2024-10-30'
  },
  {
    id: 4,
    title: 'Client presentation prep',
    project: 'API Integration',
    priority: 'Medium',
    status: 'Pending',
    assignee: 'You',
    dueDate: '2024-10-26'
  }
];

function StatCard({ title, value, icon, change, changeType }: {
  title: string;
  value: string | number;
  icon: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
}) {
  const { theme } = useTheme();
  
  return (
    <div className={`p-6 rounded-lg border transition-all duration-200 hover:shadow-lg ${
      theme === 'dark' 
        ? 'bg-gray-900 border-gray-800 hover:border-primary/30 hover:shadow-primary/10' 
        : 'bg-white border-gray-200 hover:border-primary/30 hover:shadow-primary/10'
    }`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            {title}
          </p>
          <p className={`text-2xl font-bold mt-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {value}
          </p>
        </div>
        <div className={`text-3xl ${theme === 'dark' ? 'text-primary' : 'text-primary'}`}>
          {icon}
        </div>
      </div>
      {change && (
        <div className="mt-4 flex items-center">
          <span className={`text-sm font-medium ${
            changeType === 'positive' ? 'text-green-500' :
            changeType === 'negative' ? 'text-red-500' :
            'text-gray-500'
          }`}>
            {change}
          </span>
          <span className={`text-sm ml-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            from last month
          </span>
        </div>
      )}
    </div>
  );
}

function ProjectCard({ project }: { project: typeof mockRecentProjects[0] }) {
  const { theme } = useTheme();
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-500';
      case 'In Progress':
        return 'bg-primary';
      case 'Planning':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };
  
  return (
    <div className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${
      theme === 'dark' 
        ? 'bg-gray-900 border-gray-800 hover:border-gray-700' 
        : 'bg-white border-gray-200 hover:border-gray-300'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          {project.name}
        </h3>
        <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(project.status)}`}>
          {project.status}
        </span>
      </div>
      
      <p className={`text-sm mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
        {project.client}
      </p>
      
      <div className="mb-3">
        <div className="flex items-center justify-between text-sm mb-1">
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
      
      <div className="flex items-center justify-between text-sm">
        <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
          Due: {new Date(project.deadline).toLocaleDateString()}
        </span>
        <span className={`font-medium ${theme === 'dark' ? 'text-primary' : 'text-primary'}`}>
          ${project.budget.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

function TaskRow({ task }: { task: typeof mockRecentTasks[0] }) {
  const { theme } = useTheme();
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'text-red-500';
      case 'Medium':
        return 'text-yellow-500';
      case 'Low':
        return 'text-green-500';
      default:
        return theme === 'dark' ? 'text-gray-400' : 'text-gray-600';
    }
  };
  
  const getStatusBg = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };
  
  return (
    <tr className={`border-b transition-colors hover:bg-gray-50 ${
      theme === 'dark' 
        ? 'border-gray-800 hover:bg-gray-800/50' 
        : 'border-gray-200'
    }`}>
      <td className="px-4 py-3">
        <div>
          <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {task.title}
          </p>
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            {task.project}
          </p>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={`font-medium ${getPriorityColor(task.priority)}`}>
          {task.priority}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBg(task.status)}`}>
          {task.status}
        </span>
      </td>
      <td className={`px-4 py-3 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
        {task.assignee}
      </td>
      <td className={`px-4 py-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
        {new Date(task.dueDate).toLocaleDateString()}
      </td>
    </tr>
  );
}

export default function DashboardPage() {
  const { user, refreshUser } = useAuth();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const searchParams = useSearchParams();
  
  useEffect(() => setMounted(true), []);
  
  // Handle OAuth completion
  useEffect(() => {
    const oauthProvider = searchParams.get('oauth');
    if (oauthProvider && mounted) {
      // Force refresh user data after OAuth authentication
      refreshUser().then(() => {
        // Show success message
        const providerName = oauthProvider === 'google' ? 'Google' : 'GitHub';
        toast.success(`Successfully signed in with ${providerName}!`, {
          description: 'Your profile has been updated with your OAuth information.',
        });
        
        // Clean up URL parameter
        const url = new URL(window.location.href);
        url.searchParams.delete('oauth');
        window.history.replaceState({}, '', url.toString());
      });
    }
  }, [mounted, searchParams, refreshUser]);
  
  if (!mounted) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div>
            <div className={`h-8 w-48 rounded animate-pulse mb-2 ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
            }`}></div>
            <div className={`h-4 w-64 rounded animate-pulse ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
            }`}></div>
          </div>
          <div className={`h-10 w-32 rounded animate-pulse ${
            theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
          }`}></div>
        </div>
        
        {/* Stats Grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className={`rounded-lg border p-6 transition-all duration-200 ${
              theme === 'dark'
                ? 'bg-gray-900 border-gray-800'
                : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className={`h-4 w-24 rounded animate-pulse mb-3 ${
                    theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                  }`}></div>
                  <div className={`h-8 w-16 rounded animate-pulse ${
                    theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                  }`}></div>
                </div>
                <div className={`h-8 w-8 rounded animate-pulse ${
                  theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                }`}></div>
              </div>
              <div className={`h-4 w-20 rounded animate-pulse mt-4 ${
                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
              }`}></div>
            </div>
          ))}
        </div>
        
        {/* Content Grid skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Projects skeleton */}
          <div className={`rounded-lg border p-6 ${
            theme === 'dark'
              ? 'bg-gray-900 border-gray-800'
              : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <div className={`h-6 w-32 rounded animate-pulse ${
                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
              }`}></div>
              <div className={`h-4 w-20 rounded animate-pulse ${
                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
              }`}></div>
            </div>
            
            <div className="space-y-4">
              {[...Array(4)].map((_, j) => (
                <div key={j} className={`p-4 rounded-lg border transition-all duration-200 ${
                  theme === 'dark'
                    ? 'bg-gray-800 border-gray-700'
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`h-5 w-40 rounded animate-pulse ${
                      theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'
                    }`}></div>
                    <div className={`h-6 w-20 rounded-full animate-pulse ${
                      theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'
                    }`}></div>
                  </div>
                  <div className={`h-4 w-32 rounded animate-pulse mb-3 ${
                    theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'
                  }`}></div>
                  <div className={`h-2 w-full rounded-full animate-pulse mb-3 ${
                    theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'
                  }`}></div>
                  <div className="flex items-center justify-between">
                    <div className={`h-4 w-24 rounded animate-pulse ${
                      theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'
                    }`}></div>
                    <div className={`h-4 w-16 rounded animate-pulse ${
                      theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'
                    }`}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Recent Tasks skeleton */}
          <div className={`rounded-lg border p-6 ${
            theme === 'dark'
              ? 'bg-gray-900 border-gray-800'
              : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <div className={`h-6 w-32 rounded animate-pulse ${
                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
              }`}></div>
              <div className={`h-4 w-20 rounded animate-pulse ${
                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
              }`}></div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`border-b ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
                    {['Task', 'Priority', 'Status', 'Assignee', 'Due'].map((header, i) => (
                      <th key={i} className="text-left px-4 py-3">
                        <div className={`h-4 w-16 rounded animate-pulse ${
                          theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                        }`}></div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...Array(4)].map((_, k) => (
                    <tr key={k} className={`border-b ${
                      theme === 'dark'
                        ? 'border-gray-800'
                        : 'border-gray-200'
                    }`}>
                      <td className="px-4 py-3">
                        <div className={`h-4 w-32 rounded animate-pulse mb-2 ${
                          theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                        }`}></div>
                        <div className={`h-3 w-24 rounded animate-pulse ${
                          theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                        }`}></div>
                      </td>
                      <td className="px-4 py-3">
                        <div className={`h-4 w-16 rounded animate-pulse ${
                          theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                        }`}></div>
                      </td>
                      <td className="px-4 py-3">
                        <div className={`h-6 w-20 rounded-full animate-pulse ${
                          theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                        }`}></div>
                      </td>
                      <td className="px-4 py-3">
                        <div className={`h-4 w-16 rounded animate-pulse ${
                          theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                        }`}></div>
                      </td>
                      <td className="px-4 py-3">
                        <div className={`h-4 w-20 rounded animate-pulse ${
                          theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                        }`}></div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        {/* Quick Actions skeleton */}
        <div className={`rounded-lg border p-6 ${
          theme === 'dark'
            ? 'bg-gray-900 border-gray-800'
            : 'bg-white border-gray-200'
        }`}>
          <div className={`h-6 w-32 rounded animate-pulse mb-4 ${
            theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
          }`}></div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, l) => (
              <div key={l} className={`p-4 rounded-lg border text-center ${
                theme === 'dark'
                  ? 'bg-gray-800 border-gray-700'
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <div className={`h-8 w-8 rounded animate-pulse mb-2 mx-auto ${
                  theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'
                }`}></div>
                <div className={`h-4 w-16 rounded animate-pulse mx-auto ${
                  theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'
                }`}></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Dashboard
          </h1>
          <p className={`mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Welcome back, {user?.fullName || 'Developer'}! Here's your project overview.
          </p>
        </div>
        <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium">
          + New Project
        </button>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Projects" 
          value={mockStats.totalProjects} 
          icon="📊"
          change="+2"
          changeType="positive"
        />
        <StatCard 
          title="Active Projects" 
          value={mockStats.activeProjects} 
          icon="⚡"
          change="+1"
          changeType="positive"
        />
        <StatCard 
          title="Revenue (Total)" 
          value={`$${mockStats.totalRevenue.toLocaleString()}`} 
          icon="💰"
          change="+12%"
          changeType="positive"
        />
        <StatCard 
          title="This Month" 
          value={`$${mockStats.monthlyRevenue.toLocaleString()}`} 
          icon="📈"
          change="+5%"
          changeType="positive"
        />
      </div>
      
      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Projects */}
        <div className={`rounded-lg border p-6 ${
          theme === 'dark' 
            ? 'bg-gray-900 border-gray-800' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Recent Projects
            </h2>
            <button className={`text-sm font-medium text-primary hover:text-primary/80 transition-colors`}>
              View All →
            </button>
          </div>
          
          <div className="space-y-4">
            {mockRecentProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </div>
        
        {/* Recent Tasks */}
        <div className={`rounded-lg border p-6 ${
          theme === 'dark' 
            ? 'bg-gray-900 border-gray-800' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Recent Tasks
            </h2>
            <button className={`text-sm font-medium text-primary hover:text-primary/80 transition-colors`}>
              View All →
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
                  <th className={`text-left px-4 py-3 text-sm font-medium ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>Task</th>
                  <th className={`text-left px-4 py-3 text-sm font-medium ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>Priority</th>
                  <th className={`text-left px-4 py-3 text-sm font-medium ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>Status</th>
                  <th className={`text-left px-4 py-3 text-sm font-medium ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>Assignee</th>
                  <th className={`text-left px-4 py-3 text-sm font-medium ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>Due</th>
                </tr>
              </thead>
              <tbody>
                {mockRecentTasks.map((task) => (
                  <TaskRow key={task.id} task={task} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className={`rounded-lg border p-6 ${
        theme === 'dark' 
          ? 'bg-gray-900 border-gray-800' 
          : 'bg-white border-gray-200'
      }`}>
        <h2 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          Quick Actions
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'Create Project', icon: '📝', href: '/dashboard/projects/new' },
            { label: 'Add Task', icon: '✓', href: '/dashboard/tasks/new' },
            { label: 'View Calendar', icon: '📅', href: '/dashboard/calendar' },
            { label: 'Time Tracking', icon: '⏰', href: '/dashboard/time' },
            { label: 'Reports', icon: '📊', href: '/dashboard/reports' },
            { label: 'Settings', icon: '⚙️', href: '/dashboard/settings' },
          ].map((action) => (
            <button
              key={action.label}
              className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-md text-center ${
                theme === 'dark' 
                  ? 'bg-gray-800 border-gray-700 hover:border-primary/50 hover:bg-gray-700' 
                  : 'bg-gray-50 border-gray-200 hover:border-primary/50 hover:bg-gray-100'
              }`}
            >
              <div className="text-2xl mb-2">{action.icon}</div>
              <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                {action.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}