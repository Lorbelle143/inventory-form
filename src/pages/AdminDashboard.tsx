import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { useToastContext } from '../contexts/ToastContext';
import { LoadingOverlay } from '../components/LoadingSpinner';
import AdminAnalytics from '../components/AdminAnalytics';
import MentalHealthAdmin from '../components/MentalHealthAdmin';
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
  const [viewMode, setViewMode] = useState<'submissions' | 'students' | 'analytics' | 'users' | 'mental-health'>('submissions');
  const [actionLoading, setActionLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userModalMode, setUserModalMode] = useState<'create' | 'edit' | 'password'>('create');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userFormData, setUserFormData] = useState({
    full_name: '',
    student_id: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
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
      setUsers(studentsData || []); // Load users for user management
      setStats({
        totalStudents: studentsData?.length || 0,
        totalSubmissions: submissionsData?.length || 0,
      });
    } catch (error: any) {
      toast.error('Failed to load data: ' + error.message);
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
    if (!confirm(`Are you sure you want to delete ${studentName}'s profile?\n\nThis will remove:\n- Student profile (login account)\n- Their inventory submissions\n\nNote: Their authentication account will remain in the system but they won't be able to login without a profile.\n\nThis action cannot be undone.`)) {
      return;
    }

    try {
      setActionLoading(true);
      
      // First, delete all inventory submissions for this student
      const { data: studentProfile } = await supabase
        .from('profiles')
        .select('student_id')
        .eq('id', id)
        .single();

      if (studentProfile?.student_id) {
        // Delete inventory submissions
        await supabase
          .from('inventory_submissions')
          .delete()
          .eq('student_id', studentProfile.student_id);
      }

      // Delete the student profile from profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);

      if (profileError) throw profileError;

      toast.success('Student profile and submissions deleted successfully');
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

  // User Management Functions
  const handleCreateUser = () => {
    setUserFormData({
      full_name: '',
      student_id: '',
      email: '',
      password: '',
      confirmPassword: ''
    });
    setUserModalMode('create');
    setShowUserModal(true);
  };

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setUserFormData({
      full_name: user.full_name,
      student_id: user.student_id,
      email: user.email,
      password: '',
      confirmPassword: ''
    });
    setUserModalMode('edit');
    setShowUserModal(true);
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete ${userName}'s account?\n\nThis will:\n- Remove their profile from the system\n- Keep their inventory submissions\n\nNote: Their login account will remain in the authentication system but they won't be able to access the portal without a profile.\n\nThis action cannot be undone.`)) {
      return;
    }

    try {
      setActionLoading(true);
      
      // Delete from profiles table (auth account will remain but won't work without profile)
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileError) throw profileError;

      toast.success('User profile deleted successfully');
      loadData();
    } catch (error: any) {
      toast.error('Failed to delete user: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUserFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserFormData({
      ...userFormData,
      [e.target.name]: e.target.value
    });
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (userModalMode === 'create') {
      // Validate password
      if (userFormData.password.length < 6) {
        toast.error('Password must be at least 6 characters');
        return;
      }
      if (userFormData.password !== userFormData.confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }

      try {
        setActionLoading(true);

        // Create user using regular signup (no admin API needed)
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: userFormData.email,
          password: userFormData.password,
          options: {
            data: {
              full_name: userFormData.full_name,
              student_id: userFormData.student_id
            }
          }
        });

        if (authError) throw authError;

        if (!authData.user) {
          throw new Error('Failed to create user account');
        }

        // Create profile manually
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            full_name: userFormData.full_name,
            student_id: userFormData.student_id,
            email: userFormData.email,
            is_admin: false
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
          // Profile might be created by trigger, so don't fail here
        }

        toast.success('User created successfully! They can now log in.');
        setShowUserModal(false);
        loadData();
      } catch (error: any) {
        toast.error('Failed to create user: ' + error.message);
      } finally {
        setActionLoading(false);
      }
    } else if (userModalMode === 'edit') {
      // Validate password if provided
      if (userFormData.password && userFormData.password.length < 6) {
        toast.error('Password must be at least 6 characters');
        return;
      }
      if (userFormData.password && userFormData.password !== userFormData.confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }

      try {
        setActionLoading(true);

        // Update profile
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            full_name: userFormData.full_name,
            student_id: userFormData.student_id,
            email: userFormData.email
          })
          .eq('id', selectedUser.id);

        if (profileError) throw profileError;

        let message = 'User updated successfully';

        // If password is provided, we need to handle password reset
        // Since we can't directly change password without admin API,
        // we'll store the new password temporarily and show instructions
        if (userFormData.password) {
          // Option: Send password reset email
          const { error: resetError } = await supabase.auth.resetPasswordForEmail(
            userFormData.email,
            {
              redirectTo: `${window.location.origin}/login`
            }
          );

          if (resetError) {
            console.error('Password reset email error:', resetError);
            message = `User updated! Note: Password reset email could not be sent. Please ask the student to use "Forgot Password" on the login page.`;
          } else {
            message = `User updated! Password reset email sent to ${userFormData.email}. Student must check their email to set new password.`;
          }
        }

        toast.success(message);
        setShowUserModal(false);
        loadData();
      } catch (error: any) {
        toast.error('Failed to update user: ' + error.message);
      } finally {
        setActionLoading(false);
      }
    }
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
          ethnicity: formData.ethnicity,
          religion: formData.religion,
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
    <div className="flex h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      {/* Left Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="h-20 flex items-center justify-center border-b border-gray-200 px-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-600 to-red-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <div>
              <h1 className="font-bold text-gray-800 text-sm">NBSC Admin</h1>
              <p className="text-xs text-gray-500">Control Panel</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-1">
          <button
            onClick={() => setViewMode('submissions')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              viewMode === 'submissions' 
                ? 'bg-orange-600 text-white' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="font-medium">Home</span>
          </button>

          <button
            onClick={() => setViewMode('students')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              viewMode === 'students' 
                ? 'bg-orange-600 text-white' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span className="font-medium">Students</span>
          </button>

          <button
            onClick={() => setViewMode('mental-health')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              viewMode === 'mental-health' 
                ? 'bg-orange-600 text-white' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">Mental Health</span>
          </button>

          <button
            onClick={() => setViewMode('analytics')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              viewMode === 'analytics' 
                ? 'bg-orange-600 text-white' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="font-medium">Analytics</span>
          </button>

          <button
            onClick={() => setViewMode('users')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              viewMode === 'users' 
                ? 'bg-orange-600 text-white' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span className="font-medium">User Management</span>
          </button>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="font-medium">Sign Out</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {viewMode === 'submissions' && 'Dashboard Overview'}
              {viewMode === 'students' && 'Student Management'}
              {viewMode === 'mental-health' && 'Mental Health Assessments'}
              {viewMode === 'analytics' && 'Analytics & Reports'}
              {viewMode === 'users' && 'User Management'}
            </h2>
            <p className="text-sm text-gray-500">Manage and monitor system activities</p>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="w-10 h-10 bg-gradient-to-br from-orange-600 to-red-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">A</span>
            </div>
          </div>
        </header>

        {/* Content Area - Scrollable */}
        <main className="flex-1 overflow-y-auto p-8">
        {/* Quick Stats Summary Bar */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl shadow-2xl p-6 mb-8 text-white">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-sm font-medium text-indigo-100 mb-1">Total Students</p>
              <p className="text-4xl font-bold">{stats.totalStudents}</p>
            </div>
            <div className="text-center border-l border-white/20">
              <p className="text-sm font-medium text-indigo-100 mb-1">Total Submissions</p>
              <p className="text-4xl font-bold">{stats.totalSubmissions}</p>
            </div>
            <div className="text-center border-l border-white/20">
              <p className="text-sm font-medium text-indigo-100 mb-1">Completion Rate</p>
              <p className="text-4xl font-bold">
                {stats.totalStudents > 0 ? Math.round((stats.totalSubmissions / stats.totalStudents) * 100) : 0}%
              </p>
            </div>
            <div className="text-center border-l border-white/20">
              <p className="text-sm font-medium text-indigo-100 mb-1">Active Today</p>
              <p className="text-4xl font-bold">
                {submissions.filter(s => {
                  const today = new Date().toDateString();
                  return new Date(s.created_at).toDateString() === today;
                }).length}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

          <button
            onClick={() => setViewMode('users')}
            className={`group bg-white rounded-2xl shadow-lg p-8 text-left transition-all duration-300 hover:shadow-2xl transform hover:-translate-y-1 ${
              viewMode === 'users' ? 'ring-4 ring-orange-400 ring-opacity-50' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-all ${
                viewMode === 'users' 
                  ? 'bg-gradient-to-br from-orange-500 to-red-600' 
                  : 'bg-gradient-to-br from-orange-400 to-red-500 group-hover:from-orange-500 group-hover:to-red-600'
              }`}>
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              {viewMode === 'users' && (
                <div className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold">
                  ACTIVE
                </div>
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">User Accounts</h3>
            <p className="text-5xl font-bold text-orange-600 mb-3">{users.length}</p>
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Manage user accounts & passwords
            </p>
          </button>

          <button
            onClick={() => setViewMode('mental-health')}
            className={`group bg-white rounded-2xl shadow-lg p-8 text-left transition-all duration-300 hover:shadow-2xl transform hover:-translate-y-1 ${
              viewMode === 'mental-health' ? 'ring-4 ring-pink-400 ring-opacity-50' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-all ${
                viewMode === 'mental-health' 
                  ? 'bg-gradient-to-br from-pink-500 to-rose-600' 
                  : 'bg-gradient-to-br from-pink-400 to-rose-500 group-hover:from-pink-500 group-hover:to-rose-600'
              }`}>
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              {viewMode === 'mental-health' && (
                <div className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-xs font-bold">
                  ACTIVE
                </div>
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">Mental Health</h3>
            <p className="text-5xl font-bold text-pink-600 mb-3">🧠</p>
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View student assessments & scores
            </p>
          </button>
        </div>

        {/* Analytics View */}
        {viewMode === 'analytics' && (
          <AdminAnalytics submissions={submissions} students={students} />
        )}

        {/* Mental Health View */}
        {viewMode === 'mental-health' && (
          <MentalHealthAdmin />
        )}

        {/* User Management View */}
        {viewMode === 'users' && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-orange-50 to-red-50 px-8 py-6 border-b-2 border-orange-100">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-1">🔐 User Account Management</h2>
                  <p className="text-sm text-gray-600">Manage student login accounts, passwords, and permissions</p>
                </div>
                <button
                  onClick={handleCreateUser}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl hover:from-orange-700 hover:to-red-700 transition shadow-lg hover:shadow-xl font-medium"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Create User
                </button>
              </div>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {users.map((user) => (
                  <div key={user.id} className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg transition">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                          {user.full_name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-800">{user.full_name}</h3>
                          <p className="text-xs text-gray-500">{user.student_id}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {user.email}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Joined {new Date(user.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition font-medium"
                        title="Edit User"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id, user.full_name)}
                        className="px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition font-medium"
                        title="Delete User"
                      >
                        �️ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {users.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <p className="text-lg font-medium">No user accounts found</p>
                  <p className="text-sm mt-1">Create a new user account to get started</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Content Card */}
        {viewMode !== 'analytics' && viewMode !== 'users' && (
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
              const hasDocuments = formData.documentUrls && formData.documentUrls.length > 0;
              return (
                <div key={submission.id} className="bg-white border-2 border-gray-200 rounded-xl shadow-lg hover:shadow-xl hover:border-green-400 transition-all duration-200 overflow-hidden">
                  {/* Photo */}
                  <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 relative">
                    {submission.photo_url ? (
                      <img
                        src={submission.photo_url}
                        alt={submission.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-20 h-20 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                    {/* Status Badge Overlay */}
                    <div className="absolute top-2 right-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold border-2 ${
                        hasDocuments 
                          ? 'bg-green-50 text-green-700 border-green-300' 
                          : 'bg-amber-50 text-amber-700 border-amber-300'
                      }`}>
                        {hasDocuments ? '✅' : '⏳'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Info */}
                  <div className="p-4">
                    <h3 className="font-bold text-gray-800 text-lg mb-1 truncate">
                      {formData.lastName || ''}, {formData.firstName || ''}
                    </h3>
                    <p className="text-xs text-gray-500 mb-3 font-medium">ID: {submission.student_id}</p>
                    
                    <div className="space-y-1 mb-3">
                      <p className="text-sm text-gray-700 font-medium">{submission.course}</p>
                      <p className="text-sm text-gray-600">Year {submission.year_level}</p>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {submission.contact_number}
                      </div>
                    </div>

                    {/* Documents Badge */}
                    {hasDocuments && (
                      <div className="flex items-center gap-1 mb-3 px-2 py-1 bg-green-50 border border-green-200 rounded text-xs text-green-700 font-medium">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formData.documentUrls.length} docs
                      </div>
                    )}
                    
                    <p className="text-xs text-gray-400 mb-3 pb-3 border-b border-gray-200">
                      📅 {new Date(submission.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    
                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleView(submission)}
                        className="px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs rounded-lg hover:from-blue-700 hover:to-indigo-700 transition font-medium shadow-md"
                      >
                        👁️ View
                      </button>
                      <button
                        onClick={() => handleEdit(submission)}
                        className="px-3 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs rounded-lg hover:from-amber-600 hover:to-orange-600 transition font-medium shadow-md"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => printSubmission(submission)}
                        className="px-3 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs rounded-lg hover:from-purple-700 hover:to-indigo-700 transition font-medium shadow-md"
                      >
                        🖨️ Print
                      </button>
                      <button
                        onClick={() => handleDelete(submission.id, submission.full_name)}
                        className="px-3 py-2 bg-gradient-to-r from-red-600 to-rose-600 text-white text-xs rounded-lg hover:from-red-700 hover:to-rose-700 transition font-medium shadow-md"
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

        {/* User Management Modal */}
        {showUserModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
              <div className="bg-gradient-to-r from-orange-600 to-red-600 px-6 py-4 rounded-t-2xl">
                <h2 className="text-2xl font-bold text-white">
                  {userModalMode === 'create' && '➕ Create New User'}
                  {userModalMode === 'edit' && '✏️ Edit User'}
                  {userModalMode === 'password' && '🔑 Change Password'}
                </h2>
              </div>

              <form onSubmit={handleSaveUser} className="p-6 space-y-4">
                {userModalMode !== 'password' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                      <input
                        type="text"
                        name="full_name"
                        value={userFormData.full_name}
                        onChange={handleUserFormChange}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Student ID *</label>
                      <input
                        type="text"
                        name="student_id"
                        value={userFormData.student_id}
                        onChange={handleUserFormChange}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Institutional Email * <span className="text-xs text-gray-500">(@nbsc.edu.ph)</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          name="emailUsername"
                          value={userFormData.email.replace('@nbsc.edu.ph', '')}
                          onChange={(e) => {
                            const username = e.target.value.replace(/@/g, '');
                            setUserFormData({
                              ...userFormData,
                              email: username + '@nbsc.edu.ph'
                            });
                          }}
                          className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="Enter Student ID"
                          required
                        />
                        <span className="text-gray-600 font-medium">@nbsc.edu.ph</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Example: 2021-12345@nbsc.edu.ph (Use Student ID as email)
                      </p>
                    </div>
                  </>
                )}

                {/* Password Section - Show for Create and Edit */}
                {userModalMode === 'create' && (
                  <>
                    <div className="border-t pt-4">
                      <h3 className="text-sm font-bold text-gray-700 mb-3">Set Password</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                          <input
                            type="password"
                            name="password"
                            value={userFormData.password}
                            onChange={handleUserFormChange}
                            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            placeholder="Minimum 6 characters"
                            required
                            minLength={6}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
                          <input
                            type="password"
                            name="confirmPassword"
                            value={userFormData.confirmPassword}
                            onChange={handleUserFormChange}
                            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            placeholder="Re-enter password"
                            required
                            minLength={6}
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {userModalMode === 'edit' && (
                  <>
                    <div className="border-t pt-4">
                      <h3 className="text-sm font-bold text-gray-700 mb-2">🔑 Reset Password (Optional)</h3>
                      <p className="text-xs text-gray-600 mb-3 bg-yellow-50 border border-yellow-200 rounded p-2">
                        ⚠️ Fill in these fields only if you want to reset the student's password. Leave blank to keep current password.
                      </p>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                          <input
                            type="password"
                            name="password"
                            value={userFormData.password}
                            onChange={handleUserFormChange}
                            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            placeholder="Leave blank to keep current password"
                            minLength={6}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                          <input
                            type="password"
                            name="confirmPassword"
                            value={userFormData.confirmPassword}
                            onChange={handleUserFormChange}
                            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            placeholder="Re-enter new password"
                            minLength={6}
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowUserModal(false)}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-6 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:from-orange-700 hover:to-red-700 font-medium disabled:opacity-50"
                  >
                    {actionLoading ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        {/* Loading Overlay */}
        {actionLoading && <LoadingOverlay text="Processing..." />}
        </main>
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
    ethnicity: formData.ethnicity || '',
    religion: formData.religion || '',
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
            <form onSubmit={(e) => {
              e.preventDefault();
              // Prevent accidental form submission
            }} onKeyDown={(e) => {
              // Prevent form submission on Enter key
              if (e.key === 'Enter') {
                e.preventDefault();
              }
            }} className="space-y-4">
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ethnicity</label>
                      <select
                        name="ethnicity"
                        value={editData.ethnicity}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border rounded-lg"
                      >
                        <option value="">Select</option>
                        <option value="Tagalog">Tagalog</option>
                        <option value="Cebuano">Cebuano</option>
                        <option value="Ilocano">Ilocano</option>
                        <option value="Bicolano">Bicolano</option>
                        <option value="Waray">Waray</option>
                        <option value="Hiligaynon">Hiligaynon</option>
                        <option value="Kapampangan">Kapampangan</option>
                        <option value="Pangasinense">Pangasinense</option>
                        <option value="Indigenous People">Indigenous People</option>
                        <option value="Others">Others</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Religion</label>
                      <select
                        name="religion"
                        value={editData.religion}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border rounded-lg"
                      >
                        <option value="">Select</option>
                        <option value="Roman Catholic">Roman Catholic</option>
                        <option value="Islam">Islam</option>
                        <option value="Iglesia ni Cristo">Iglesia ni Cristo</option>
                        <option value="Born Again Christian">Born Again Christian</option>
                        <option value="Seventh-day Adventist">Seventh-day Adventist</option>
                        <option value="Jehovah's Witness">Jehovah's Witness</option>
                        <option value="Buddhism">Buddhism</option>
                        <option value="Others">Others</option>
                        <option value="None">None</option>
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
                  type="button"
                  onClick={handleSubmit}
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
