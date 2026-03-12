import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { useSessionTimeout } from '../hooks/useSessionTimeout';
import { useToastContext } from '../contexts/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';

export default function StudentDashboard() {
  const { user, signOut } = useAuthStore();
  const toast = useToastContext();
  const [profile, setProfile] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [mentalHealthAssessments, setMentalHealthAssessments] = useState<any[]>([]);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'complete' | 'incomplete'>('all');
  const [mentalHealthViewMode, setMentalHealthViewMode] = useState<'grid' | 'list'>('grid');
  const navigate = useNavigate();

  // Enable session timeout protection
  useSessionTimeout();

  useEffect(() => {
    if (user) {
      loadProfile();
      loadSubmissions();
      loadMentalHealthAssessments();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      
      if (!data) {
        toast.error('Your profile was deleted by admin. Logging out...');
        setTimeout(async () => {
          await signOut();
          navigate('/login');
        }, 2000);
        return;
      }
      
      setProfile(data);
    } catch (error: any) {
      toast.error('Failed to load profile');
    }
  };

  const loadSubmissions = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('inventory_submissions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setSubmissions(data || []);
    } catch (error: any) {
      toast.error('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const loadMentalHealthAssessments = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('mental_health_assessments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setMentalHealthAssessments(data || []);
    } catch (error: any) {
      console.error('Failed to load mental health assessments:', error);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const handleView = (submission: any) => {
    setSelectedSubmission(submission);
    setShowViewModal(true);
  };

  const handleEdit = (submissionId: string) => {
    navigate(`/inventory-form?edit=${submissionId}`);
  };

  // Filter submissions
  const filteredSubmissions = submissions.filter(submission => {
    const formData = submission.form_data || {};
    const matchesSearch = 
      submission.course?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.student_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formData.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formData.lastName?.toLowerCase().includes(searchTerm.toLowerCase());

    const hasDocuments = formData.documentUrls && formData.documentUrls.length > 0;
    const matchesFilter = 
      filterStatus === 'all' ||
      (filterStatus === 'complete' && hasDocuments) ||
      (filterStatus === 'incomplete' && !hasDocuments);

    return matchesSearch && matchesFilter;
  });

  // Calculate stats
  const stats = {
    total: submissions.length,
    complete: submissions.filter(s => s.form_data?.documentUrls?.length > 0).length,
    incomplete: submissions.filter(s => !s.form_data?.documentUrls?.length).length,
    lastUpdated: submissions[0] ? new Date(submissions[0].created_at) : null
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Left Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="h-20 flex items-center justify-center border-b border-gray-200 px-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">NB</span>
            </div>
            <div>
              <h1 className="font-bold text-gray-800 text-sm">NBSC</h1>
              <p className="text-xs text-gray-500">Student Portal</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-1">
          <button
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-blue-600 text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="font-medium">Dashboard</span>
          </button>

          <button
            onClick={() => navigate('/inventory-form')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="font-medium">New Form</span>
          </button>

          <button
            onClick={() => navigate('/mental-health-assessment')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">Mental Health</span>
          </button>

          <button
            onClick={() => navigate('/edit-profile')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="font-medium">Profile</span>
          </button>
        </nav>

        {/* Sign Out Button */}
        <button
          onClick={handleSignOut}
          className="m-3 flex items-center justify-center gap-2 px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-lg transition border border-red-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign Out
        </button>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
            <p className="text-sm text-gray-500">Welcome back, {profile?.full_name}!</p>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
              {profile?.profile_picture ? (
                <img
                  src={profile.profile_picture}
                  alt="Profile"
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <span className="text-white font-semibold text-sm">
                  {profile?.full_name?.charAt(0) || 'S'}
                </span>
              )}
            </div>
          </div>
        </header>

        {/* Content Area - Scrollable */}
        <main className="flex-1 overflow-y-auto p-8">
        {/* Welcome Card */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-xl p-8 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">Welcome back, {profile?.full_name}!</h2>
              <p className="text-blue-100 text-lg">Manage your inventory submissions and profile</p>
            </div>
            <div className="hidden md:block">
              <svg className="w-24 h-24 text-blue-400 opacity-50" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {/* Total Submissions */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Forms</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Complete */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Complete</p>
                <p className="text-3xl font-bold text-gray-900">{stats.complete}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Incomplete */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-amber-500 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Incomplete</p>
                <p className="text-3xl font-bold text-gray-900">{stats.incomplete}</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Last Updated */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Last Updated</p>
                <p className="text-lg font-bold text-gray-900">
                  {stats.lastUpdated ? stats.lastUpdated.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 mb-8">
          {/* Quick Actions Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800">Quick Actions</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Fill Form Card */}
              <button
                onClick={() => navigate('/inventory-form')}
                className="group bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl p-6 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <div className="flex items-center justify-between mb-3">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <h4 className="text-lg font-bold mb-1">Fill New Form</h4>
                <p className="text-sm text-blue-100">Submit your inventory information</p>
              </button>

              {/* Mental Health Assessment Card */}
              <button
                onClick={() => navigate('/mental-health-assessment')}
                className="group bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl p-6 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <div className="flex items-center justify-between mb-3">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <h4 className="text-lg font-bold mb-1">Mental Health Test</h4>
                <p className="text-sm text-green-100">Take BSRS-5 assessment</p>
              </button>

              {/* Submissions Stats Card */}
              <button
                onClick={() => {
                  // Scroll to submissions section
                  const submissionsSection = document.getElementById('submissions-section');
                  if (submissionsSection) {
                    submissionsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                className="group bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl p-6 shadow-lg transition-all duration-200 transform hover:scale-105 hover:shadow-xl"
              >
                <div className="flex items-center justify-between mb-3">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div className="text-right">
                    <p className="text-3xl font-bold">{submissions.length}</p>
                  </div>
                </div>
                <h4 className="text-lg font-bold mb-1">Total Submissions</h4>
                <p className="text-sm text-purple-100 flex items-center gap-1">
                  Your completed forms
                  <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </p>
              </button>
            </div>

            {/* Help Section */}
            <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex gap-3">
                <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-amber-900 mb-1">Need Help?</p>
                  <p className="text-xs text-amber-800">Contact the Guidance and Counseling Office for assistance with your submissions.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submissions Section */}
        <div id="submissions-section" className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 scroll-mt-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">My Submissions</h3>
                {submissions.length > 0 && (
                  <p className="text-sm text-gray-500">
                    Showing {filteredSubmissions.length} of {submissions.length} submissions
                  </p>
                )}
              </div>
            </div>

            {/* Search and Filter */}
            {submissions.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search submissions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition w-full sm:w-64"
                  />
                </div>

                {/* Filter */}
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition font-medium"
                >
                  <option value="all">All Status</option>
                  <option value="complete">✅ Complete</option>
                  <option value="incomplete">⏳ Incomplete</option>
                </select>
              </div>
            )}
          </div>

          {submissions.length === 0 ? (
            loading ? (
              <div className="text-center py-16">
                <LoadingSpinner size="lg" text="Loading submissions..." />
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-gray-700 mb-2">No submissions yet</h4>
                <p className="text-gray-500 mb-6">Get started by filling out your first inventory form</p>
                <button
                  onClick={() => navigate('/inventory-form')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition shadow-lg hover:shadow-xl"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Fill Inventory Form
                </button>
              </div>
            )
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredSubmissions.map((submission) => {
                const formData = submission.form_data || {};
                const isComplete = formData.documentUrls && formData.documentUrls.length > 0;
                
                return (
                  <div key={submission.id} className="group bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-blue-400 hover:shadow-xl transition-all duration-200">
                    {/* Status Badge */}
                    <div className="flex justify-between items-start mb-4">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 ${
                        isComplete 
                          ? 'bg-green-50 text-green-700 border-green-300' 
                          : 'bg-amber-50 text-amber-700 border-amber-300'
                      }`}>
                        {isComplete ? '✅ Complete' : '⏳ Incomplete'}
                      </span>
                      <span className="text-xs text-gray-500 font-medium">
                        ID: {submission.student_id}
                      </span>
                    </div>

                    <div className="flex gap-4 mb-4">
                      {submission.photo_url ? (
                        <img
                          src={submission.photo_url}
                          alt="Profile"
                          className="w-24 h-24 rounded-xl object-cover shadow-md border-2 border-gray-200"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center shadow-md border-2 border-gray-200">
                          <svg className="w-12 h-12 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-800 text-lg mb-1">{submission.course}</h4>
                        <p className="text-sm text-gray-600 mb-2">Year {submission.year_level}</p>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          {submission.contact_number}
                        </div>
                      </div>
                    </div>

                    {/* Documents Badge */}
                    {formData.documentUrls && formData.documentUrls.length > 0 && (
                      <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-green-50 border-2 border-green-200 rounded-lg">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-xs font-medium text-green-700">
                          {formData.documentUrls.length} documents uploaded
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-4 pb-4 border-b border-gray-200">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Submitted: {new Date(submission.created_at).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => handleView(submission)}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition shadow-md hover:shadow-lg"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View
                      </button>
                      <button
                        onClick={() => handleEdit(submission.id)}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-medium rounded-lg hover:from-amber-600 hover:to-orange-600 transition shadow-md hover:shadow-lg"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* No Results Found */}
          {submissions.length > 0 && filteredSubmissions.length === 0 && (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-gray-700 mb-2">No submissions found</h4>
              <p className="text-gray-500 mb-4">Try adjusting your search or filter</p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('all');
                }}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>

        {/* Mental Health Assessments Section */}
        {mentalHealthAssessments.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 mt-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Mental Health Assessments</h3>
                  <p className="text-sm text-gray-500">
                    {mentalHealthAssessments.length} assessment{mentalHealthAssessments.length !== 1 ? 's' : ''} completed
                  </p>
                </div>
              </div>

              {/* View Toggle Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => setMentalHealthViewMode('grid')}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 transition ${
                    mentalHealthViewMode === 'grid' 
                      ? 'bg-pink-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  Grid
                </button>
                <button
                  onClick={() => setMentalHealthViewMode('list')}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 transition ${
                    mentalHealthViewMode === 'list' 
                      ? 'bg-pink-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  List
                </button>
              </div>
            </div>

            {/* Grid View */}
            {mentalHealthViewMode === 'grid' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mentalHealthAssessments.map((assessment) => {
                const getRiskColor = (level: string) => {
                  switch (level) {
                    case 'immediate-support': return 'bg-red-100 text-red-800 border-red-300';
                    case 'need-support': return 'bg-orange-100 text-orange-800 border-orange-300';
                    default: return 'bg-green-100 text-green-800 border-green-300';
                  }
                };

                const getRiskLabel = (level: string) => {
                  switch (level) {
                    case 'immediate-support': return 'NEED IMMEDIATE SUPPORT';
                    case 'need-support': return 'YOU NEED SUPPORT';
                    default: return 'DOING WELL';
                  }
                };

                const getRiskIcon = (level: string) => {
                  switch (level) {
                    case 'immediate-support': return '🚨';
                    case 'need-support': return '⚠️';
                    default: return '✅';
                  }
                };

                return (
                  <div key={assessment.id} className="group bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-pink-300 hover:shadow-xl transition-all duration-200">
                    {/* Header with Risk Badge */}
                    <div className="flex justify-between items-start mb-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${getRiskColor(assessment.risk_level)}`}>
                        {getRiskIcon(assessment.risk_level)} {getRiskLabel(assessment.risk_level)}
                      </span>
                      <span className="text-xs text-gray-500 font-medium">
                        BSRS-5
                      </span>
                    </div>

                    {/* Score Display */}
                    <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl p-5 mb-4 border border-pink-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-600 mb-1 font-medium">Total Score</p>
                          <p className="text-4xl font-bold text-gray-800">{assessment.total_score}<span className="text-2xl text-gray-500">/20</span></p>
                        </div>
                        <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-600 rounded-full flex items-center justify-center shadow-lg">
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Counseling Required Warning */}
                    {assessment.requires_counseling && (
                      <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 mb-4 shadow-sm">
                        <div className="flex items-start gap-2 mb-2">
                          <span className="text-xl">{getRiskIcon(assessment.risk_level)}</span>
                          <div className="flex-1">
                            <p className="text-xs font-bold text-red-800 mb-1">COUNSELING REQUIRED</p>
                            <p className="text-xs text-red-700 mb-2">Please visit SC Room 108</p>
                          </div>
                        </div>
                        <a
                          href="https://docs.google.com/spreadsheets/d/1-80LunHLARHr83-yBFB9KGFObQMEM2mUIx4L1PXhgT0/edit?gid=0#gid=0"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-2 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition w-full justify-center"
                        >
                          📋 Appointment Form for Guidance
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </div>
                    )}

                    {/* Date */}
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-4 pb-4 border-b border-gray-200">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Submitted: {new Date(assessment.created_at).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </div>

                    {/* Detailed Scores */}
                    <div className="space-y-3">
                      <p className="text-xs font-bold text-gray-700 mb-2">Assessment Breakdown:</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-gray-50 rounded-lg p-2 border border-gray-200">
                          <p className="text-gray-600 mb-1">Feeling alone</p>
                          <p className="font-bold text-gray-800">{assessment.feeling_alone}/4</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2 border border-gray-200">
                          <p className="text-gray-600 mb-1">Feeling blue</p>
                          <p className="font-bold text-gray-800">{assessment.feeling_blue}/4</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2 border border-gray-200">
                          <p className="text-gray-600 mb-1">Easily annoyed</p>
                          <p className="font-bold text-gray-800">{assessment.feeling_easily_annoyed}/4</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2 border border-gray-200">
                          <p className="text-gray-600 mb-1">Tense/anxious</p>
                          <p className="font-bold text-gray-800">{assessment.feeling_tense_anxious}/4</p>
                        </div>
                        <div className={`rounded-lg p-2 col-span-2 border-2 ${assessment.having_suicidal_thoughts > 0 ? 'bg-red-50 border-red-300' : 'bg-gray-50 border-gray-200'}`}>
                          <p className="text-gray-600 mb-1">Suicidal thoughts</p>
                          <p className={`font-bold ${assessment.having_suicidal_thoughts > 0 ? 'text-red-600' : 'text-gray-800'}`}>
                            {assessment.having_suicidal_thoughts}/4
                            {assessment.having_suicidal_thoughts > 0 && ' ⚠️'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Counseling Notes (if any) */}
                    {assessment.counseling_notes && (
                      <div className="mt-4 bg-blue-50 border-2 border-blue-200 rounded-lg p-3">
                        <p className="text-xs font-bold text-blue-800 mb-1 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Counseling Notes:
                        </p>
                        <p className="text-xs text-blue-700">{assessment.counseling_notes}</p>
                      </div>
                    )}

                    {/* Edit Button */}
                    <button
                      onClick={() => navigate(`/mental-health-assessment?edit=${assessment.id}`)}
                      className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-indigo-700 hover:to-blue-700 transition shadow-md hover:shadow-lg"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit Assessment
                    </button>
                  </div>
                );
              })}
            </div>
            )}

            {/* List View */}
            {mentalHealthViewMode === 'list' && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse bg-white rounded-xl overflow-hidden">
                  <thead className="bg-gradient-to-r from-pink-600 to-rose-600 text-white">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-bold">Date</th>
                      <th className="px-4 py-3 text-center text-sm font-bold">Score</th>
                      <th className="px-4 py-3 text-center text-sm font-bold">Risk Level</th>
                      <th className="px-4 py-3 text-center text-sm font-bold">Counseling</th>
                      <th className="px-4 py-3 text-center text-sm font-bold">Breakdown</th>
                      <th className="px-4 py-3 text-center text-sm font-bold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mentalHealthAssessments.map((assessment, index) => {
                      const getRiskColor = (level: string) => {
                        switch (level) {
                          case 'immediate-support': return 'bg-red-100 text-red-800 border-red-300';
                          case 'need-support': return 'bg-orange-100 text-orange-800 border-orange-300';
                          default: return 'bg-green-100 text-green-800 border-green-300';
                        }
                      };

                      const getRiskLabel = (level: string) => {
                        switch (level) {
                          case 'immediate-support': return 'NEED IMMEDIATE SUPPORT';
                          case 'need-support': return 'YOU NEED SUPPORT';
                          default: return 'DOING WELL';
                        }
                      };

                      const getRiskIcon = (level: string) => {
                        switch (level) {
                          case 'immediate-support': return '🚨';
                          case 'need-support': return '⚠️';
                          default: return '✅';
                        }
                      };

                      return (
                        <tr key={assessment.id} className={`border-b hover:bg-pink-50 transition ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {new Date(assessment.created_at).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-2xl font-bold text-gray-800">{assessment.total_score}<span className="text-sm text-gray-500">/20</span></span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border-2 inline-block ${getRiskColor(assessment.risk_level)}`}>
                              {getRiskIcon(assessment.risk_level)} {getRiskLabel(assessment.risk_level)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {assessment.requires_counseling ? (
                              <div className="flex flex-col items-center gap-1">
                                <span className="text-red-600 font-bold text-sm">⚠️ Required</span>
                                <a
                                  href="https://docs.google.com/spreadsheets/d/1-80LunHLARHr83-yBFB9KGFObQMEM2mUIx4L1PXhgT0/edit?gid=0#gid=0"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-red-700 hover:text-red-900 underline"
                                >
                                  Book Appointment
                                </a>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm">Not Required</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1 justify-center text-xs">
                              <span className="px-2 py-1 bg-gray-100 rounded">Alone: {assessment.feeling_alone}</span>
                              <span className="px-2 py-1 bg-gray-100 rounded">Blue: {assessment.feeling_blue}</span>
                              <span className="px-2 py-1 bg-gray-100 rounded">Annoyed: {assessment.feeling_easily_annoyed}</span>
                              <span className="px-2 py-1 bg-gray-100 rounded">Tense: {assessment.feeling_tense_anxious}</span>
                              <span className={`px-2 py-1 rounded ${assessment.having_suicidal_thoughts > 0 ? 'bg-red-100 text-red-700 font-bold' : 'bg-gray-100'}`}>
                                Suicidal: {assessment.having_suicidal_thoughts}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => navigate(`/mental-health-assessment?edit=${assessment.id}`)}
                              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-indigo-700 hover:to-blue-700 transition"
                            >
                              ✏️ Edit
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        </main>
      </div>

      {/* View Modal */}
      {showViewModal && selectedSubmission && (
        <ViewSubmissionModal
          submission={selectedSubmission}
          onClose={() => setShowViewModal(false)}
        />
      )}
    </div>
  );
}

// View Submission Modal Component
function ViewSubmissionModal({ submission, onClose }: any) {
  const formData = submission.form_data || {};

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Submission Details</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Photo */}
          <div className="flex gap-6">
            <div className="w-48 h-48 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
              {submission.photo_url ? (
                <img src={submission.photo_url} alt="Student" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">No Photo</div>
              )}
            </div>
            <div className="flex-1 grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Full Name</label>
                <p className="text-lg font-semibold">{formData.firstName} {formData.middleInitial} {formData.lastName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Student ID</label>
                <p className="text-lg">{formData.idNo}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Program & Year</label>
                <p className="text-lg">{formData.programYear}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Contact</label>
                <p className="text-lg">{formData.mobilePhone}</p>
              </div>
            </div>
          </div>

          {/* Documents */}
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
                            <p className="text-sm font-bold text-red-600">PDF</p>
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
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
