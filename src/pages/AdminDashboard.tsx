import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { useToastContext } from '../contexts/ToastContext';
import LoadingSpinner, { LoadingOverlay } from '../components/LoadingSpinner';
import AdminAnalytics from '../components/AdminAnalytics';
import { printSubmission, printAllSubmissions } from '../utils/printUtils';

export default function AdminDashboard() {
  const { signOut } = useAuthStore();
  const toast = useToastContext();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalStudents: 0, totalSubmissions: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'lastName' | 'date'>('lastName');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'create' | 'edit'>('view');
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'submissions' | 'students' | 'analytics'>('submissions');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [filterCourse, setFilterCourse] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<string>('all');
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: studentsData } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_admin', false);

      const { data: submissionsData } = await supabase
        .from('inventory_submissions')
        .select('*');

      // Merge student profiles with their submission photos
      const studentsWithPhotos = (studentsData || []).map(student => {
        const submission = (submissionsData || []).find(s => s.student_id === student.student_id);
        return {
          ...student,
          photo_url: submission?.photo_url || null
        };
      });

      setStudents(studentsWithPhotos);
      setSubmissions(submissionsData || []);
      setStats({
        totalStudents: studentsData?.length || 0,
        totalSubmissions: submissionsData?.length || 0,
      });
    } catch (error: any) {
      toast.error('Failed to load data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const handleView = (submission: any) => {
    setSelectedSubmission(submission);
    setModalMode('view');
    setShowModal(true);
  };

  const handleCreate = () => {
    // Open inventory form in admin mode
    navigate('/inventory-form?admin=true');
  };

  const handleEdit = (submission: any) => {
    // Redirect to inventory form with edit ID and admin mode
    navigate(`/inventory-form?edit=${submission.id}&admin=true`);
  };

  const handleDeleteStudent = async (id: string, studentName: string) => {
    if (!confirm(`Are you sure you want to delete ${studentName}'s profile?\n\nThis will remove:\n- Student profile (login account)\n- Authentication account from Supabase\n\nTheir inventory submissions will remain in the system.\n\nThis action cannot be undone.`)) {
      return;
    }

    try {
      setActionLoading(true);
      // Delete the auth user from Supabase Auth
      const { error: authError } = await supabase.auth.admin.deleteUser(id);
      
      if (authError) {
        console.error('Error deleting auth user:', authError);
        // Continue even if auth deletion fails (user might not exist in auth)
      }

      // Delete the student profile from profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);

      if (profileError) throw profileError;

      toast.success('Student profile deleted successfully');
      loadData();
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error('Error deleting student: ' + (error.message || 'Unknown error'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewStudent = (student: any) => {
    setSelectedSubmission({ 
      id: student.id,
      student_id: student.student_id,
      full_name: student.full_name,
      form_data: {
        email: student.email,
        createdAt: student.created_at
      }
    });
    setModalMode('view');
    setShowModal(true);
  };

  const handleEditStudent = (student: any) => {
    setSelectedSubmission({
      id: student.id,
      student_id: student.student_id,
      full_name: student.full_name,
      email: student.email,
      form_data: {}
    });
    setModalMode('edit');
    setShowModal(true);
  };

  const handleSaveStudent = async (formData: any) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          student_id: formData.student_id,
          email: formData.email,
        })
        .eq('id', selectedSubmission.id);

      if (error) throw error;
      alert('✅ Student updated successfully');
      setShowModal(false);
      loadData();
    } catch (error: any) {
      console.error('Update error:', error);
      alert('❌ Error updating student: ' + (error.message || 'Unknown error'));
    }
  };

  const handleDelete = async (id: string, studentName: string) => {
    if (!confirm(`Are you sure you want to delete ${studentName}'s record?\n\nThis will permanently remove:\n- Student inventory record\n- Associated photo\n\nThis action cannot be undone.`)) {
      return;
    }

    try {
      // First, get the submission to find the photo URL
      const { data: submission } = await supabase
        .from('inventory_submissions')
        .select('photo_url')
        .eq('id', id)
        .single();

      // Delete the record from database
      const { error: deleteError } = await supabase
        .from('inventory_submissions')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('Delete error:', deleteError);
        throw new Error(deleteError.message);
      }

      // Try to delete the photo from storage (optional, won't fail if photo doesn't exist)
      if (submission?.photo_url) {
        try {
          const photoPath = submission.photo_url.split('/').pop();
          if (photoPath) {
            await supabase.storage
              .from('student-photos')
              .remove([photoPath]);
          }
        } catch (photoError) {
          console.log('Photo deletion skipped:', photoError);
          // Continue even if photo deletion fails
        }
      }

      alert('✅ Record deleted successfully');
      loadData(); // Reload the data
    } catch (error: any) {
      console.error('Delete error:', error);
      alert('❌ Error deleting record: ' + (error.message || 'Unknown error'));
    }
  };

  const handleSave = async (formData: any) => {
    try {
      if (modalMode === 'create') {
        // Generate a dummy UUID for admin-created records
        const dummyUserId = '00000000-0000-0000-0000-000000000000';
        
        const { error } = await supabase
          .from('inventory_submissions')
          .insert({
            user_id: dummyUserId, // Use dummy UUID instead of string
            student_id: formData.idNo,
            full_name: `${formData.firstName} ${formData.middleInitial} ${formData.lastName}`.trim(),
            course: formData.programYear,
            year_level: formData.programYear.split(' ')[0] || '1',
            contact_number: formData.mobilePhone,
            photo_url: formData.photoUrl || 'https://via.placeholder.com/150',
            form_data: formData,
            google_form_response_id: '',
          });

        if (error) throw error;
        alert('✅ Record created successfully');
      } else if (modalMode === 'edit') {
        // Build the full name from the form data
        const fullName = `${formData.firstName} ${formData.middleInitial} ${formData.lastName}`.trim();
        
        // Extract year level from program year (e.g., "BSIT - First year" -> "First")
        const yearLevel = formData.programYear.split(' ')[0] || '1';
        
        // Merge the new form data with existing form_data
        const existingFormData = selectedSubmission?.form_data || {};
        const updatedFormData = {
          ...existingFormData,
          lastName: formData.lastName,
          firstName: formData.firstName,
          middleInitial: formData.middleInitial,
          idNo: formData.idNo,
          programYear: formData.programYear,
          mobilePhone: formData.mobilePhone,
          birthDate: formData.birthDate,
          gender: formData.gender,
          civilStatus: formData.civilStatus,
          permanentAddress: formData.permanentAddress,
        };

        const updateData: any = {
          student_id: formData.idNo,
          full_name: fullName,
          course: formData.programYear,
          year_level: yearLevel,
          contact_number: formData.mobilePhone,
          form_data: updatedFormData,
        };

        // Include photo_url if it was updated
        if (formData.photoUrl) {
          updateData.photo_url = formData.photoUrl;
        }

        const { error } = await supabase
          .from('inventory_submissions')
          .update(updateData)
          .eq('id', selectedSubmission.id);

        if (error) throw error;
        alert('✅ Record updated successfully');
      }

      setShowModal(false);
      loadData();
    } catch (error: any) {
      console.error('Save error:', error);
      alert('❌ Error saving record: ' + (error.message || 'Unknown error'));
    }
  };

  const exportToCSV = () => {
    const headers = ['Student ID', 'Last Name', 'First Name', 'Course', 'Year Level', 'Contact Number', 'Submitted Date & Time'];
    
    // Sort submissions by last name A-Z before exporting
    const sortedForExport = [...filteredAndSortedSubmissions].sort((a, b) => {
      const lastNameA = (a.form_data?.lastName || a.full_name.split(' ')[0] || '').toLowerCase();
      const lastNameB = (b.form_data?.lastName || b.full_name.split(' ')[0] || '').toLowerCase();
      return lastNameA.localeCompare(lastNameB);
    });
    
    const rows = sortedForExport.map(s => {
      const formData = s.form_data || {};
      const submittedDate = new Date(s.created_at);
      
      // Format: MM/DD/YYYY HH:MM:SS AM/PM
      const dateTimeString = submittedDate.toLocaleString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
      
      return [
        s.student_id || '',
        formData.lastName || '',
        formData.firstName || '',
        s.course || '',
        s.year_level || '',
        s.contact_number || '',
        dateTimeString
      ];
    });

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `student_inventory_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Filter students
  const filteredStudents = students.filter(s => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (s.full_name || '').toLowerCase().includes(searchLower) ||
      (s.student_id || '').toLowerCase().includes(searchLower) ||
      (s.email || '').toLowerCase().includes(searchLower)
    );
  });

  const sortedStudents = [...filteredStudents].sort((a, b) => {
    if (sortBy === 'lastName') {
      const lastNameA = (a.full_name || '').split(' ')[0].toLowerCase();
      const lastNameB = (b.full_name || '').split(' ')[0].toLowerCase();
      return lastNameA.localeCompare(lastNameB);
    } else {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  // Filter submissions
  const filteredSubmissions = submissions.filter(s => {
    const formData = s.form_data || {};
    const searchLower = searchTerm.toLowerCase();
    return (
      s.full_name.toLowerCase().includes(searchLower) ||
      s.student_id.toLowerCase().includes(searchLower) ||
      (formData.lastName || '').toLowerCase().includes(searchLower) ||
      (formData.firstName || '').toLowerCase().includes(searchLower)
    );
  });

  const filteredAndSortedSubmissions = [...filteredSubmissions].sort((a, b) => {
    if (sortBy === 'lastName') {
      const lastNameA = (a.form_data?.lastName || a.full_name.split(' ')[0] || '').toLowerCase();
      const lastNameB = (b.form_data?.lastName || b.full_name.split(' ')[0] || '').toLowerCase();
      return lastNameA.localeCompare(lastNameB);
    } else {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <nav className="bg-white shadow-lg border-b-2 border-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-4">
              <img 
                src="data:image/jpeg;base64,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" 
                alt="NSCB Logo" 
                className="w-20 h-20 object-contain"
              />
              <div className="flex flex-col justify-center">
                <h1 className="text-2xl font-bold text-gray-800 leading-tight">Admin Dashboard</h1>
                <p className="text-xs text-gray-500">Guidance and Counseling Office</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-5 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl transition border-2 border-red-200 font-medium shadow-sm hover:shadow-md"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <button
            onClick={() => setViewMode('students')}
            className={`group bg-white rounded-2xl shadow-lg p-8 text-left transition-all duration-300 hover:shadow-2xl transform hover:-translate-y-1 ${
              viewMode === 'students' ? 'ring-4 ring-blue-400 ring-opacity-50' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-all ${
                viewMode === 'students' 
                  ? 'bg-gradient-to-br from-blue-500 to-blue-600' 
                  : 'bg-gradient-to-br from-blue-400 to-blue-500 group-hover:from-blue-500 group-hover:to-blue-600'
              }`}>
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              {viewMode === 'students' && (
                <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                  ACTIVE
                </div>
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">Total Students</h3>
            <p className="text-5xl font-bold text-blue-600 mb-3">{stats.totalStudents}</p>
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Click to view registered students
            </p>
          </button>

          <button
            onClick={() => setViewMode('submissions')}
            className={`group bg-white rounded-2xl shadow-lg p-8 text-left transition-all duration-300 hover:shadow-2xl transform hover:-translate-y-1 ${
              viewMode === 'submissions' ? 'ring-4 ring-green-400 ring-opacity-50' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-all ${
                viewMode === 'submissions' 
                  ? 'bg-gradient-to-br from-green-500 to-emerald-600' 
                  : 'bg-gradient-to-br from-green-400 to-emerald-500 group-hover:from-green-500 group-hover:to-emerald-600'
              }`}>
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              {viewMode === 'submissions' && (
                <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                  ACTIVE
                </div>
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">Total Submissions</h3>
            <p className="text-5xl font-bold text-green-600 mb-3">{stats.totalSubmissions}</p>
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Click to view inventory submissions
            </p>
          </button>

          <button
            onClick={() => setViewMode('analytics')}
            className={`group bg-white rounded-2xl shadow-lg p-8 text-left transition-all duration-300 hover:shadow-2xl transform hover:-translate-y-1 ${
              viewMode === 'analytics' ? 'ring-4 ring-purple-400 ring-opacity-50' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-all ${
                viewMode === 'analytics' 
                  ? 'bg-gradient-to-br from-purple-500 to-indigo-600' 
                  : 'bg-gradient-to-br from-purple-400 to-indigo-500 group-hover:from-purple-500 group-hover:to-indigo-600'
              }`}>
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              {viewMode === 'analytics' && (
                <div className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
                  ACTIVE
                </div>
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">Analytics</h3>
            <p className="text-5xl font-bold text-purple-600 mb-3">📊</p>
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Click to view statistics & reports
            </p>
          </button>
        </div>

        {/* Analytics View */}
        {viewMode === 'analytics' && (
          <AdminAnalytics submissions={submissions} students={students} />
        )}

        {/* Main Content Card */}
        {viewMode !== 'analytics' && (
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-white px-8 py-6 border-b-2 border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-1">
                  {viewMode === 'students' ? '👥 Registered Students' : '📋 Student Inventory Records'}
                </h2>
                <p className="text-sm text-gray-600">
                  {viewMode === 'students' 
                    ? 'Manage student profiles and information' 
                    : 'View and manage inventory form submissions'}
                </p>
              </div>
              <div className="flex gap-3">
                {viewMode === 'submissions' && (
                  <>
                    <button
                      onClick={handleCreate}
                      className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition shadow-lg hover:shadow-xl font-medium"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Student
                    </button>
                    <button
                      onClick={() => printAllSubmissions(filteredAndSortedSubmissions)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition shadow-lg hover:shadow-xl font-medium"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      Print Report
                    </button>
                    <button
                      onClick={exportToCSV}
                      className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition shadow-lg hover:shadow-xl font-medium"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Export CSV
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Search and Filter */}
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder={viewMode === 'students' ? 'Search by name, student ID, or email...' : 'Search by name or student ID...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'lastName' | 'date')}
                className="px-5 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition font-medium"
              >
                <option value="lastName">📝 Sort by Last Name</option>
                <option value="date">📅 Sort by Date</option>
              </select>
            </div>
          </div>

          {/* Students View */}
          {viewMode === 'students' && (
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {sortedStudents.map((student) => (
                  <div key={student.id} className="group bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1">
                    <div className="aspect-square bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center relative overflow-hidden">
                      {student.photo_url ? (
                        <img 
                          src={student.photo_url} 
                          alt={student.full_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-purple-400/20"></div>
                          <svg className="w-28 h-28 text-blue-600 relative z-10" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                        </>
                      )}
                    </div>
                    <div className="p-5">
                      <h3 className="font-bold text-gray-800 text-lg mb-2 truncate">{student.full_name}</h3>
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                          </svg>
                          <span className="font-medium">{student.student_id}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 truncate">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span className="truncate">{student.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {new Date(student.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewStudent(student)}
                          className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition font-medium shadow-md"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleEditStudent(student)}
                          className="flex-1 px-3 py-2 bg-amber-500 text-white text-sm rounded-lg hover:bg-amber-600 transition font-medium shadow-md"
                        >
                          Edit
                        </button>
                      </div>
                      <button
                        onClick={() => handleDeleteStudent(student.id, student.full_name)}
                        className="mt-2 w-full px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition font-medium shadow-md"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submissions View */}
          {viewMode === 'submissions' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredAndSortedSubmissions.map((submission) => {
              const formData = submission.form_data || {};
              return (
                <div key={submission.id} className="bg-white border rounded-lg shadow-sm hover:shadow-md transition overflow-hidden">
                  {/* Photo */}
                  <div className="aspect-square bg-gray-100">
                    {submission.photo_url ? (
                      <img
                        src={submission.photo_url}
                        alt={submission.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg className="w-20 h-20" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  {/* Info */}
                  <div className="p-4">
                    <h3 className="font-bold text-gray-800 text-lg mb-1">
                      {formData.lastName || ''}, {formData.firstName || ''}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">ID: {submission.student_id}</p>
                    <p className="text-sm text-gray-700 mb-1">{submission.course}</p>
                    <p className="text-sm text-gray-600 mb-2">Year {submission.year_level}</p>
                    <p className="text-xs text-gray-500 mb-2">📞 {submission.contact_number}</p>
                    <p className="text-xs text-gray-400">
                      Submitted: {new Date(submission.created_at).toLocaleDateString()}
                    </p>
                    
                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleView(submission)}
                        className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition font-medium"
                      >
                        👁️ View
                      </button>
                      <button
                        onClick={() => handleEdit(submission)}
                        className="px-3 py-2 bg-amber-600 text-white text-sm rounded-lg hover:bg-amber-700 transition font-medium"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => printSubmission(submission)}
                        className="px-3 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition font-medium"
                      >
                        🖨️ Print
                      </button>
                      <button
                        onClick={() => handleDelete(submission.id, submission.full_name)}
                        className="px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition font-medium"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
          )}

          {/* Empty States */}
          {viewMode === 'students' && sortedStudents.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-lg font-medium">No registered students found</p>
              <p className="text-sm mt-1">Students will appear here after registration</p>
            </div>
          )}

          {viewMode === 'submissions' && filteredAndSortedSubmissions.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-lg font-medium">No inventory submissions found</p>
              <p className="text-sm mt-1">Submissions will appear here after students complete the form</p>
            </div>
          )}
        </div>
        )}

        {/* Modal for View/Create/Edit */}
        {showModal && (
          <StudentModal
            mode={modalMode}
            submission={selectedSubmission}
            onClose={() => setShowModal(false)}
            onSave={selectedSubmission?.email && !selectedSubmission?.course ? handleSaveStudent : handleSave}
          />
        )}
        
        {/* Loading Overlay */}
        {actionLoading && <LoadingOverlay text="Processing..." />}
      </div>
    </div>
  );
}

// Student Modal Component
function StudentModal({ mode, submission, onClose, onSave }: any) {
  const formData = submission?.form_data || {};
  const isStudentProfile = formData.email && !submission?.course; // Check if it's a student profile view
  
  const [editData, setEditData] = useState({
    full_name: submission?.full_name || '',
    student_id: submission?.student_id || '',
    email: submission?.email || '',
    lastName: formData.lastName || '',
    firstName: formData.firstName || '',
    middleInitial: formData.middleInitial || '',
    idNo: submission?.student_id || '',
    programYear: submission?.course || '',
    mobilePhone: submission?.contact_number || '',
    birthDate: formData.birthDate || '',
    gender: formData.gender || '',
    civilStatus: formData.civilStatus || '',
    permanentAddress: formData.permanentAddress || '',
    photoUrl: submission?.photo_url || '',
  });

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>(submission?.photo_url || '');

  const handleChange = (e: any) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Photo size must be less than 5MB');
        return;
      }
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    
    let finalPhotoUrl = editData.photoUrl;

    // Upload new photo if provided
    if (photoFile) {
      try {
        const fileExt = photoFile.name.split('.').pop();
        const fileName = `${submission?.id || 'new'}_${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('student-photos')
          .upload(fileName, photoFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('student-photos')
          .getPublicUrl(fileName);

        finalPhotoUrl = publicUrl;
      } catch (error: any) {
        alert('Error uploading photo: ' + error.message);
        return;
      }
    }

    onSave({ ...editData, photoUrl: finalPhotoUrl });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">
            {mode === 'view' 
              ? (isStudentProfile ? 'View Student Profile' : 'View Student Details')
              : mode === 'create' 
              ? 'Add New Student' 
              : (isStudentProfile ? 'Edit Student Profile' : 'Edit Student')}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">
            ×
          </button>
        </div>

        <div className="p-6">
          {mode === 'view' ? (
            <div className="space-y-6">
              {/* View Mode - Display Only */}
              {isStudentProfile ? (
                // Student Profile View
                <div className="flex gap-6">
                  <div className="w-48 h-48 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-24 h-24 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1 grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Student ID</label>
                      <p className="text-lg font-semibold">{submission?.student_id}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Full Name</label>
                      <p className="text-lg font-semibold">{submission?.full_name}</p>
                    </div>
                    <div className="col-span-2">
                      <label className="text-sm font-medium text-gray-600">Email</label>
                      <p className="text-lg">{formData.email}</p>
                    </div>
                    <div className="col-span-2">
                      <label className="text-sm font-medium text-gray-600">Registered</label>
                      <p className="text-lg">{new Date(formData.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ) : (
                // Inventory Submission View
                <div className="flex gap-6">
                  <div className="w-48 h-48 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {submission?.photo_url ? (
                      <img src={submission.photo_url} alt="Student" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">No Photo</div>
                    )}
                  </div>
                  <div className="flex-1 grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Student ID</label>
                      <p className="text-lg font-semibold">{submission?.student_id}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Full Name</label>
                      <p className="text-lg font-semibold">{submission?.full_name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Course</label>
                      <p className="text-lg">{submission?.course}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Year Level</label>
                      <p className="text-lg">{submission?.year_level}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Contact Number</label>
                      <p className="text-lg">{submission?.contact_number}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Birth Date</label>
                      <p className="text-lg">{formData.birthDate || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Gender</label>
                      <p className="text-lg">{formData.gender || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Civil Status</label>
                      <p className="text-lg">{formData.civilStatus || 'N/A'}</p>
                    </div>
                    <div className="col-span-2">
                      <label className="text-sm font-medium text-gray-600">Address</label>
                      <p className="text-lg">{formData.permanentAddress || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Uploaded Documents Section */}
              {formData.documentUrls && formData.documentUrls.length > 0 && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">
                    📄 Uploaded Documents ({formData.documentUrls.length})
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {formData.documentUrls.map((url: string, index: number) => {
                      const isPDF = url.toLowerCase().includes('.pdf') || url.includes('application/pdf');
                      return (
                        <div key={index} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition">
                          <div className="aspect-square bg-gray-100">
                            {isPDF ? (
                              // PDF Preview
                              <div 
                                className="w-full h-full flex flex-col items-center justify-center bg-red-50 cursor-pointer hover:bg-red-100 transition"
                                onClick={() => window.open(url, '_blank')}
                              >
                                <svg className="w-16 h-16 text-red-600 mb-2" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                </svg>
                                <p className="text-sm font-bold text-red-600">PDF Document</p>
                              </div>
                            ) : (
                              // Image Preview
                              <img
                                src={url}
                                alt={`Document ${index + 1}`}
                                className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition"
                                onClick={() => window.open(url, '_blank')}
                              />
                            )}
                          </div>
                          <div className="p-2 bg-gray-50 text-center">
                            <p className="text-xs font-medium text-gray-700">
                              {isPDF ? '📄 PDF' : '📷 Image'} {index + 1}
                            </p>
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline"
                            >
                              {isPDF ? 'Open PDF' : 'View Full Size'}
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-500 mt-3">
                    <strong>Documents:</strong> 1. WHODAS 2.0 Form, 2. Individual Inventory Form, 3. PID-5-BF Form, 4. Counseling Consent Form (Images or PDFs)
                  </p>
                </div>
              )}
              
              <div className="flex justify-end gap-2 pt-4 border-t">
                <button onClick={onClose} className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                  Close
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Create/Edit Mode - Form Fields */}
              
              {/* Photo Upload Section */}
              {mode === 'edit' && !isStudentProfile && (
                <div className="border-2 border-dashed border-blue-300 rounded-xl p-6 bg-blue-50">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Update Profile Photo (Optional)
                  </label>
                  <div className="flex items-center gap-6">
                    <div className="w-32 h-32 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 shadow-lg">
                      {photoPreview ? (
                        <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer"
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        JPG, PNG or WEBP (MAX. 5MB). Leave empty to keep current photo.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {isStudentProfile ? (
                // Student Profile Edit Form
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      name="full_name"
                      value={editData.full_name}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border rounded-lg"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Student ID *</label>
                      <input
                        type="text"
                        name="student_id"
                        value={editData.student_id}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border rounded-lg"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                      <input
                        type="email"
                        name="email"
                        value={editData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border rounded-lg"
                        required
                      />
                    </div>
                  </div>
                </>
              ) : (
                // Inventory Submission Edit Form
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                      <input
                        type="text"
                        name="lastName"
                        value={editData.lastName}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border rounded-lg"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                      <input
                        type="text"
                        name="firstName"
                        value={editData.firstName}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border rounded-lg"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">M.I.</label>
                      <input
                        type="text"
                        name="middleInitial"
                        value={editData.middleInitial}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border rounded-lg"
                        maxLength={1}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Student ID *</label>
                      <input
                        type="text"
                        name="idNo"
                        value={editData.idNo}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border rounded-lg"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Program & Year *</label>
                      <input
                        type="text"
                        name="programYear"
                        value={editData.programYear}
                        onChange={handleChange}
                        placeholder="e.g., BSIT - First year"
                        className="w-full px-4 py-2 border rounded-lg"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number *</label>
                      <input
                        type="tel"
                        name="mobilePhone"
                        value={editData.mobilePhone}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border rounded-lg"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Birth Date</label>
                      <input
                        type="date"
                        name="birthDate"
                        value={editData.birthDate}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                      <select
                        name="gender"
                        value={editData.gender}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border rounded-lg"
                      >
                        <option value="">Select</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Civil Status</label>
                      <select
                        name="civilStatus"
                        value={editData.civilStatus}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border rounded-lg"
                      >
                        <option value="">Select</option>
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                        <option value="Widowed">Widowed</option>
                        <option value="Separated">Separated</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <textarea
                      name="permanentAddress"
                      value={editData.permanentAddress}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border rounded-lg"
                      rows={2}
                    />
                  </div>

                  {mode === 'create' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Photo URL (optional)</label>
                      <input
                        type="url"
                        name="photoUrl"
                        value={editData.photoUrl}
                        onChange={handleChange}
                        placeholder="https://example.com/photo.jpg"
                        className="w-full px-4 py-2 border rounded-lg"
                      />
                    </div>
                  )}
                </>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {mode === 'create' ? 'Create' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
