'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { FileText, AlertTriangle, Clock, CheckCircle, RefreshCw, Search, Filter, Eye, User, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

interface AuditLog {
  id: string;
  operation: string;
  userId?: string;
  adminId?: string;
  ipAddress?: string;
  userAgent?: string;
  amount?: number;
  metadata?: any;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  timestamp: string;
}

interface AuditStats {
  totalLogs: number;
  last24Hours: {
    successful: number;
    failed: number;
  };
  last7Days: {
    adminActions: number;
    securityEvents: number;
    walletOperations: number;
  };
  categoryBreakdown: Array<{
    category: string;
    count: number;
    lastActivity: string;
  }>;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    operation: '',
    status: '',
    userId: '',
    limit: 50
  });
  const { toast } = useToast();

  // Fetch audit logs
  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });

      const response = await fetch(`/api/admin/audit/logs?${params}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch audit logs');
      }

      const data = await response.json();
      setLogs(data.logs || []);
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch audit logs',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch audit statistics
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/audit/stats', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch audit stats');
      }

      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchLogs();
  }, []);

  useEffect(() => {
    if (filters.operation || filters.status || filters.userId) {
      const timeoutId = setTimeout(() => {
        fetchLogs();
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [filters]);

  const getOperationBadgeColor = (operation: string) => {
    if (operation.startsWith('ADMIN_')) return 'bg-purple-100 text-purple-800 border-purple-200';
    if (operation.startsWith('SECURITY_')) return 'bg-red-100 text-red-800 border-red-200';
    if (operation.startsWith('WALLET_')) return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS': return 'text-green-600';
      case 'FAILED': return 'text-red-600';
      case 'PENDING': return 'text-amber-600';
      default: return 'text-gray-600';
    }
  };

  if (loading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span>Loading audit logs...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <FileText className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">Audit Logs</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Security audit logging and monitoring
            </p>
          </div>
        </div>
        
        <Button 
          onClick={() => { fetchStats(); fetchLogs(); }} 
          variant="outline" 
          disabled={loading}
          className="flex items-center space-x-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                <span>Total Logs</span>
                <FileText className="w-4 h-4 text-blue-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.totalLogs.toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                All audit entries
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                <span>Success (24h)</span>
                <CheckCircle className="w-4 h-4 text-green-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.last24Hours.successful.toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Successful operations
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                <span>Failed (24h)</span>
                <AlertTriangle className="w-4 h-4 text-red-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.last24Hours.failed.toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Failed operations
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                <span>Admin Actions (7d)</span>
                <Shield className="w-4 h-4 text-purple-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {stats.last7Days.adminActions.toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Administrative actions
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="w-5 h-5" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Operation</label>
              <Input
                placeholder="Search operation..."
                value={filters.operation}
                onChange={(e) => setFilters(prev => ({ ...prev, operation: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  <SelectItem value="SUCCESS">Success</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">User ID</label>
              <Input
                placeholder="Enter user ID..."
                value={filters.userId}
                onChange={(e) => setFilters(prev => ({ ...prev, userId: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Limit</label>
              <Select value={filters.limit.toString()} onValueChange={(value) => setFilters(prev => ({ ...prev, limit: parseInt(value) }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25 records</SelectItem>
                  <SelectItem value="50">50 records</SelectItem>
                  <SelectItem value="100">100 records</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Security Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <span>Current Security Monitoring</span>
          </CardTitle>
          <CardDescription>
            Basic security measures currently in place
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="font-medium">Session Management</span>
              </div>
              <Badge className="bg-green-100 text-green-800 border-green-200">
                Active
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="font-medium">Rate Limiting</span>
              </div>
              <Badge className="bg-green-100 text-green-800 border-green-200">
                Active
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="font-medium">Input Validation</span>
              </div>
              <Badge className="bg-green-100 text-green-800 border-green-200">
                Active
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-amber-500" />
                <span className="font-medium">Advanced Logging</span>
              </div>
              <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                Planned
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Eye className="w-5 h-5" />
            <span>Recent Audit Logs</span>
          </CardTitle>
          <CardDescription>
            {logs.length > 0 ? `Showing ${logs.length} audit log entries` : 'No audit logs found'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Timestamp</th>
                    <th className="text-left py-3 px-4 font-medium">Operation</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-left py-3 px-4 font-medium">User</th>
                    <th className="text-left py-3 px-4 font-medium">IP Address</th>
                    <th className="text-left py-3 px-4 font-medium">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <motion.tr
                      key={log.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className={getOperationBadgeColor(log.operation)}>
                          {log.operation}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`font-medium ${getStatusColor(log.status)}`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                        {log.userId ? (
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4" />
                            <span className="font-mono text-xs">{log.userId.slice(0, 8)}...</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                        {log.ipAddress ? (
                          <span className="font-mono text-xs">{log.ipAddress}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {log.metadata ? (
                          <details className="cursor-pointer">
                            <summary className="text-blue-600 hover:text-blue-700 text-xs">
                              View Details
                            </summary>
                            <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono">
                              {JSON.stringify(log.metadata, null, 2)}
                            </div>
                          </details>
                        ) : (
                          <span className="text-gray-400 text-xs">No details</span>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No audit logs match your current filters</p>
              <p className="text-sm mt-2">Try adjusting your search criteria</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
