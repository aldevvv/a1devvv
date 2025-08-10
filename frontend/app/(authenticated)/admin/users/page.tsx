'use client';

import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { useState, useEffect } from 'react';
import { Users, Search, Filter, MoreVertical, Edit, Trash2, Shield, ShieldOff } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Mock users data
const mockUsers = [
  {
    id: 1,
    fullName: 'John Doe',
    username: 'johndoe',
    email: 'john@example.com',
    role: 'USER',
    emailVerifiedAt: '2024-10-20T10:30:00Z',
    createdAt: '2024-09-15T08:00:00Z',
    lastLogin: '2024-10-25T14:30:00Z',
    status: 'active'
  },
  {
    id: 2,
    fullName: 'Jane Smith',
    username: 'janesmith',
    email: 'jane@example.com',
    role: 'USER',
    emailVerifiedAt: '2024-10-18T09:15:00Z',
    createdAt: '2024-09-20T10:30:00Z',
    lastLogin: '2024-10-24T16:45:00Z',
    status: 'active'
  },
  {
    id: 3,
    fullName: 'Admin User',
    username: 'admin',
    email: 'admin@a1dev.id',
    role: 'ADMIN',
    emailVerifiedAt: '2024-09-01T12:00:00Z',
    createdAt: '2024-09-01T12:00:00Z',
    lastLogin: '2024-10-25T18:00:00Z',
    status: 'active'
  },
  {
    id: 4,
    fullName: 'Bob Wilson',
    username: 'bobwilson',
    email: 'bob@example.com',
    role: 'USER',
    emailVerifiedAt: null,
    createdAt: '2024-10-22T14:20:00Z',
    lastLogin: '2024-10-23T11:15:00Z',
    status: 'pending'
  }
];

export default function AdminUsersPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const [users, setUsers] = useState(mockUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [isLoading, setIsLoading] = useState(false);

  // Check if user is admin
  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [user, router]);

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || u.role.toLowerCase() === filterRole.toLowerCase();
    return matchesSearch && matchesRole;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleRoleChange = (userId: number, newRole: 'USER' | 'ADMIN') => {
    setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    // TODO: Implement API call to update user role
  };

  const handleDeleteUser = (userId: number) => {
    if (confirm('Are you sure you want to delete this user?')) {
      setUsers(users.filter(u => u.id !== userId));
      // TODO: Implement API call to delete user
    }
  };

  if (user?.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage all users and their permissions
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className={`p-6 rounded-lg border ${
          theme === 'dark' ? 'bg-card border-border' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${
              theme === 'dark' ? 'bg-blue-900/30' : 'bg-blue-100'
            }`}>
              <Users className={`h-5 w-5 ${
                theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
              }`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Users</p>
              <p className="text-2xl font-semibold">{users.length}</p>
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-lg border ${
          theme === 'dark' ? 'bg-card border-border' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${
              theme === 'dark' ? 'bg-green-900/30' : 'bg-green-100'
            }`}>
              <Shield className={`h-5 w-5 ${
                theme === 'dark' ? 'text-green-400' : 'text-green-600'
              }`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Users</p>
              <p className="text-2xl font-semibold">{users.filter(u => u.status === 'active').length}</p>
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-lg border ${
          theme === 'dark' ? 'bg-card border-border' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${
              theme === 'dark' ? 'bg-purple-900/30' : 'bg-purple-100'
            }`}>
              <ShieldOff className={`h-5 w-5 ${
                theme === 'dark' ? 'text-purple-400' : 'text-purple-600'
              }`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Admins</p>
              <p className="text-2xl font-semibold">{users.filter(u => u.role === 'ADMIN').length}</p>
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-lg border ${
          theme === 'dark' ? 'bg-card border-border' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${
              theme === 'dark' ? 'bg-yellow-900/30' : 'bg-yellow-100'
            }`}>
              <Users className={`h-5 w-5 ${
                theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'
              }`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-semibold">{users.filter(u => u.status === 'pending').length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className={`p-6 rounded-lg border ${
        theme === 'dark' ? 'bg-card border-border' : 'bg-white border-gray-200'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`pl-10 pr-4 py-2 rounded-lg border w-full md:w-80 ${
                  theme === 'dark'
                    ? 'bg-background border-border text-foreground'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>
            
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className={`px-4 py-2 rounded-lg border ${
                theme === 'dark'
                  ? 'bg-background border-border text-foreground'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="all">All Roles</option>
              <option value="user">Users</option>
              <option value="admin">Admins</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className={`rounded-lg border overflow-hidden ${
        theme === 'dark' ? 'bg-card border-border' : 'bg-white border-gray-200'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`border-b ${
              theme === 'dark' ? 'border-border bg-muted/50' : 'border-gray-200 bg-gray-50'
            }`}>
              <tr>
                <th className="text-left p-4 font-semibold">User</th>
                <th className="text-left p-4 font-semibold">Role</th>
                <th className="text-left p-4 font-semibold">Status</th>
                <th className="text-left p-4 font-semibold">Last Login</th>
                <th className="text-left p-4 font-semibold">Joined</th>
                <th className="text-left p-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.map((userData) => (
                <tr key={userData.id} className="hover:bg-muted/50">
                  <td className="p-4">
                    <div>
                      <div className="font-medium">{userData.fullName}</div>
                      <div className="text-sm text-muted-foreground">@{userData.username}</div>
                      <div className="text-sm text-muted-foreground">{userData.email}</div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      userData.role === 'ADMIN'
                        ? theme === 'dark' ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-100 text-purple-800'
                        : theme === 'dark' ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {userData.role}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        userData.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'
                      }`}></div>
                      <span className="text-sm capitalize">{userData.status}</span>
                      {!userData.emailVerifiedAt && (
                        <span className="text-xs text-muted-foreground">(Unverified)</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {formatDate(userData.lastLogin)}
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {formatDate(userData.createdAt)}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleRoleChange(
                          userData.id, 
                          userData.role === 'ADMIN' ? 'USER' : 'ADMIN'
                        )}
                        className={`p-2 rounded-lg transition-colors ${
                          theme === 'dark'
                            ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-300'
                            : 'hover:bg-gray-100 text-gray-600 hover:text-gray-700'
                        }`}
                        title={userData.role === 'ADMIN' ? 'Remove Admin' : 'Make Admin'}
                      >
                        {userData.role === 'ADMIN' ? <ShieldOff className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                      </button>
                      
                      <button
                        onClick={() => handleDeleteUser(userData.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          theme === 'dark'
                            ? 'hover:bg-red-900/30 text-red-400 hover:text-red-300'
                            : 'hover:bg-red-100 text-red-600 hover:text-red-700'
                        }`}
                        title="Delete User"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredUsers.length === 0 && (
          <div className="p-8 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No users found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filter criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}