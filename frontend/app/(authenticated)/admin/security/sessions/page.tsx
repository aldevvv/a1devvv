'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Activity, Shield, Users, Database, Trash2, RefreshCw, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface SessionStats {
  totalSessions: number;
  activeSessions: number;
  expiredSessions: number;
  revokedSessions: number;
  totalUsers: number;
  averageSessionsPerUser: number;
  rememberMeSessions: number;
  regularSessions: number;
}

interface CleanupResult {
  sessionsDeleted: number;
  tokensDeleted: number;
}

export default function SessionsPage() {
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [lastCleanup, setLastCleanup] = useState<CleanupResult | null>(null);
  const { toast } = useToast();

  // Fetch session statistics
  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/sessions/stats', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch session stats');
      }

      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch session statistics',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Trigger cleanup
  const handleCleanup = async () => {
    try {
      setCleanupLoading(true);
      const response = await fetch('/api/admin/sessions/cleanup', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to cleanup sessions');
      }

      const result = await response.json();
      setLastCleanup(result);
      
      toast({
        title: 'Cleanup Successful',
        description: `Deleted ${result.sessionsDeleted} sessions and ${result.tokensDeleted} tokens`,
      });

      // Refresh stats after cleanup
      await fetchStats();
    } catch (error) {
      console.error('Error during cleanup:', error);
      toast({
        title: 'Cleanup Failed',
        description: 'Failed to cleanup expired data',
        variant: 'destructive',
      });
    } finally {
      setCleanupLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span>Loading session statistics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Shield className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">Session Management</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Monitor and manage user sessions across the platform
            </p>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <Button 
            onClick={fetchStats} 
            variant="outline" 
            disabled={loading}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
          
          <Button 
            onClick={handleCleanup} 
            disabled={cleanupLoading}
            className="flex items-center space-x-2 bg-red-600 hover:bg-red-700"
          >
            {cleanupLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            <span>{cleanupLoading ? 'Cleaning...' : 'Cleanup Expired'}</span>
          </Button>
        </div>
      </div>

      {/* Last Cleanup Result */}
      {lastCleanup && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4"
        >
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="font-medium text-green-800 dark:text-green-200">
              Last cleanup completed successfully
            </span>
          </div>
          <p className="text-sm text-green-700 dark:text-green-300 mt-1">
            Removed {lastCleanup.sessionsDeleted} expired sessions and {lastCleanup.tokensDeleted} tokens
          </p>
        </motion.div>
      )}

      {/* Statistics Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Sessions */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                <span>Total Sessions</span>
                <Database className="w-4 h-4 text-blue-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.totalSessions.toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                All sessions in database
              </p>
            </CardContent>
          </Card>

          {/* Active Sessions */}
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                <span>Active Sessions</span>
                <Activity className="w-4 h-4 text-green-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.activeSessions.toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Currently valid sessions
              </p>
            </CardContent>
          </Card>

          {/* Total Users */}
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                <span>Total Users</span>
                <Users className="w-4 h-4 text-purple-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {stats.totalUsers.toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Users with sessions
              </p>
            </CardContent>
          </Card>

          {/* Avg Sessions/User */}
          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                <span>Avg Sessions/User</span>
                <Activity className="w-4 h-4 text-orange-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {stats.averageSessionsPerUser.toFixed(1)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Average per active user
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Session Status Breakdown */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Session Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="w-5 h-5" />
                <span>Session Status</span>
              </CardTitle>
              <CardDescription>
                Breakdown of sessions by current status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>Active</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-green-600 border-green-200">
                    {stats.activeSessions}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    ({((stats.activeSessions / stats.totalSessions) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span>Expired</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-red-600 border-red-200">
                    {stats.expiredSessions}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    ({((stats.expiredSessions / stats.totalSessions) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                  <span>Revoked</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-gray-600 border-gray-200">
                    {stats.revokedSessions}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    ({((stats.revokedSessions / stats.totalSessions) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Session Types */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Session Types</span>
              </CardTitle>
              <CardDescription>
                Sessions by remember me preference
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span>Regular Sessions</span>
                  <Badge variant="secondary" className="text-xs">7 days</Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-blue-600 border-blue-200">
                    {stats.regularSessions}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    ({((stats.regularSessions / stats.totalSessions) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span>Remember Me</span>
                  <Badge variant="secondary" className="text-xs">30 days</Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-purple-600 border-purple-200">
                    {stats.rememberMeSessions}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    ({((stats.rememberMeSessions / stats.totalSessions) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Security Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <span>Security Information</span>
          </CardTitle>
          <CardDescription>
            Important security measures and limitations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="font-medium">Session Limits</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Maximum 5 sessions per user. Oldest sessions are automatically revoked.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="font-medium">Automatic Cleanup</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Expired sessions and tokens are automatically cleaned up to prevent database bloat.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="font-medium">Secure Storage</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Session data is hashed and stored securely. IP addresses are hashed for privacy.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="font-medium">Token Expiry</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Access tokens expire in 10 minutes. Refresh tokens expire based on user preference.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
