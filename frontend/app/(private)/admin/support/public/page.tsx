'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Eye, Edit, Trash2, MessageSquare, Clock, CheckCircle, XCircle, AlertTriangle, Filter, Calendar, User, Mail, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  phone?: string;
  category: 'GENERAL' | 'TECHNICAL' | 'BILLING' | 'COMPLAINT' | 'OTHER';
  subject: string;
  message: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  createdAt: string;
  updatedAt: string;
}

const categoryLabels = {
  GENERAL: 'General',
  TECHNICAL: 'Technical',
  BILLING: 'Billing',
  COMPLAINT: 'Complaint',
  OTHER: 'Other'
};

const statusLabels = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed'
};

const priorityLabels = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent'
};

// Theme-aware colors - hanya blue neon + black/white
const getStatusColors = (theme: string, isActive = false) => {
  if (theme === 'dark') {
    return isActive 
      ? 'bg-blue-500/20 text-blue-400 border-blue-500/50'
      : 'bg-black text-white/70 border-white/20';
  } else {
    return isActive 
      ? 'bg-blue-500/10 text-blue-600 border-blue-500/30'
      : 'bg-white text-black/70 border-black/20';
  }
};

const getPriorityColors = (theme: string, priority: string) => {
  if (theme === 'dark') {
    return priority === 'URGENT' || priority === 'HIGH'
      ? 'bg-blue-500/20 text-blue-400 border-blue-500/50'
      : 'bg-black text-white/70 border-white/20';
  } else {
    return priority === 'URGENT' || priority === 'HIGH'
      ? 'bg-blue-500/10 text-blue-600 border-blue-500/30'
      : 'bg-white text-black/70 border-black/20';
  }
};

export default function AdminSupportPublicPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<ContactSubmission | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSubmissions, setTotalSubmissions] = useState(0);
  const itemsPerPage = 10;

  // Edit form states
  const [editStatus, setEditStatus] = useState('');
  const [editPriority, setEditPriority] = useState('');
  const [editNotes, setEditNotes] = useState('');

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchSubmissions();
    }
  }, [user, currentPage, searchTerm, statusFilter, categoryFilter, priorityFilter]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(categoryFilter !== 'all' && { category: categoryFilter }),
        ...(priorityFilter !== 'all' && { priority: priorityFilter })
      });

      const response = await fetch(`/api/admin/contact-submissions?${params}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch submissions');
      }

      const data = await response.json();
      setSubmissions(data.submissions || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalSubmissions(data.pagination?.total || 0);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast.error('Failed to fetch contact submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (submission: ContactSubmission) => {
    setSelectedSubmission(submission);
    setIsDetailOpen(true);
  };

  const handleEdit = (submission: ContactSubmission) => {
    setSelectedSubmission(submission);
    setEditStatus(submission.status);
    setEditPriority(submission.priority);
    setEditNotes('');
    setIsEditOpen(true);
  };

  const handleUpdateSubmission = async () => {
    if (!selectedSubmission) return;

    try {
      const response = await fetch(`/api/admin/contact-submissions/${selectedSubmission.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          status: editStatus,
          priority: editPriority,
          notes: editNotes.trim() || undefined
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update submission');
      }

      toast.success('Submission updated successfully');
      setIsEditOpen(false);
      fetchSubmissions();
    } catch (error) {
      console.error('Error updating submission:', error);
      toast.error('Failed to update submission');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this submission?')) return;

    try {
      const response = await fetch(`/api/admin/contact-submissions/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to delete submission');
      }

      toast.success('Submission deleted successfully');
      fetchSubmissions();
    } catch (error) {
      console.error('Error deleting submission:', error);
      toast.error('Failed to delete submission');
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setCategoryFilter('all');
    setPriorityFilter('all');
    setCurrentPage(1);
  };

  if (user?.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p>You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
            Public Support Submissions
          </h1>
          <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-white/70' : 'text-black/70'}`}>
            Manage contact form submissions from the public support page
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Object.entries(statusLabels).map(([key, label]) => {
          const count = submissions.filter(s => s.status === key).length;
          return (
      <Card key={key} className={theme === 'dark' ? 'bg-black border-blue-500/20' : 'bg-white border-black/20'}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white/70' : 'text-black/70'}`}>
                      {label}
                    </p>
                    <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                      {count}
                    </p>
                  </div>
                  <Badge variant="secondary" className={getStatusColors(theme, key === 'IN_PROGRESS' || key === 'PENDING')}>
                    {label}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <Card className={theme === 'dark' ? 'bg-black border-blue-500/20' : 'bg-white border-black/20'}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by name, email, subject..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {Object.entries(statusLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All priorities</SelectItem>
                  {Object.entries(priorityLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={handleResetFilters}>
              Reset Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Submissions List */}
      <Card className={theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Submissions ({totalSubmissions})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className={`w-12 h-12 mx-auto mb-4 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className={`text-lg font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                No submissions found
              </p>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                Try adjusting your filters or check back later
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {submissions.map((submission) => (
                  <motion.div
                    key={submission.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`p-4 rounded-lg border ${theme === 'dark' ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {submission.subject}
                          </h3>
                          <Badge variant="outline" className={getStatusColors(theme, submission.status === 'IN_PROGRESS' || submission.status === 'PENDING')}>
                            {statusLabels[submission.status]}
                          </Badge>
                          <Badge variant="outline" className={getPriorityColors(theme, submission.priority)}>
                            {priorityLabels[submission.priority]}
                          </Badge>
                          <Badge variant="secondary">
                            {categoryLabels[submission.category]}
                          </Badge>
                        </div>
                        
                        <div className={`text-sm space-y-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              {submission.name}
                            </span>
                            <span className="flex items-center gap-1">
                              <Mail className="w-4 h-4" />
                              {submission.email}
                            </span>
                            {submission.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-4 h-4" />
                                {submission.phone}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(submission.createdAt), 'PPp')}
                          </div>
                        </div>
                        
                        <p className={`text-sm mt-2 line-clamp-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                          {submission.message}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetail(submission)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(submission)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(submission.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalSubmissions)} to{' '}
                    {Math.min(currentPage * itemsPerPage, totalSubmissions)} of {totalSubmissions} results
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className={`max-w-2xl ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
          <DialogHeader>
            <DialogTitle>Submission Details</DialogTitle>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Name</Label>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    {selectedSubmission.name}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    {selectedSubmission.email}
                  </p>
                </div>
                {selectedSubmission.phone && (
                  <div>
                    <Label className="text-sm font-medium">Phone</Label>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      {selectedSubmission.phone}
                    </p>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-medium">Category</Label>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    {categoryLabels[selectedSubmission.category]}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge className={statusColors[selectedSubmission.status]}>
                    {statusLabels[selectedSubmission.status]}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Priority</Label>
                  <Badge className={priorityColors[selectedSubmission.priority]}>
                    {priorityLabels[selectedSubmission.priority]}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Submitted</Label>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    {format(new Date(selectedSubmission.createdAt), 'PPp')}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Last Updated</Label>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    {format(new Date(selectedSubmission.updatedAt), 'PPp')}
                  </p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Subject</Label>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  {selectedSubmission.subject}
                </p>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Message</Label>
                <div className={`text-sm p-3 rounded-md border ${theme === 'dark' ? 'bg-gray-750 border-gray-600 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                  <p className="whitespace-pre-wrap">{selectedSubmission.message}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className={`max-w-lg ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
          <DialogHeader>
            <DialogTitle>Update Submission</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-status">Status</Label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-priority">Priority</Label>
              <Select value={editPriority} onValueChange={setEditPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(priorityLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-notes">Internal Notes (optional)</Label>
              <Textarea
                id="edit-notes"
                placeholder="Add internal notes about this submission..."
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateSubmission}>
                Update Submission
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
