import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';

export default function AdminDashboard() {
  const { signOut } = useAuthStore();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalStudents: 0, totalSubmissions: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'lastName' | 'date'>('lastName');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'create' | 'edit'>('view');
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'submissions' | 'students'>('submissions');
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: studentsData } = await supabase
      .from('profiles')
      .select('*')
      .eq('is_admin', false);

    const { data: submissionsData } = await supabase
      .from('inventory_submissions')
      .select('*');

    setStudents(studentsData || []);
    setSubmissions(submissionsData || []);
    setStats({
      totalStudents: studentsData?.length || 0,
      totalSubmissions: submissionsData?.length || 0,
    });
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
    setSelectedSubmission(null);
    setModalMode('create');
    setShowModal(true);
  };

  const handleEdit = (submission: any) => {
    setSelectedSubmission(submission);
    setModalMode('edit');
    setShowModal(true);
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
        const { error } = await supabase
          .from('inventory_submissions')
          .update({
            student_id: formData.idNo,
            full_name: `${formData.firstName} ${formData.middleInitial} ${formData.lastName}`.trim(),
            course: formData.programYear,
            year_level: formData.programYear.split(' ')[0] || '1',
            contact_number: formData.mobilePhone,
            form_data: formData,
          })
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
    const headers = ['Student ID', 'Last Name', 'First Name', 'Course', 'Year Level', 'Contact', 'Submitted Date'];
    const rows = filteredAndSortedSubmissions.map(s => {
      const formData = s.form_data || {};
      return [
        s.student_id,
        formData.lastName || '',
        formData.firstName || '',
        s.course,
        s.year_level,
        s.contact_number,
        new Date(s.created_at).toLocaleDateString()
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
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-gray-800">Admin Dashboard</h1>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <button
            onClick={() => setViewMode('students')}
            className={`bg-white rounded-lg shadow p-6 text-left transition hover:shadow-lg ${
              viewMode === 'students' ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            <h3 className="text-lg font-semibold text-gray-700">Total Students</h3>
            <p className="text-4xl font-bold text-blue-600 mt-2">{stats.totalStudents}</p>
            <p className="text-sm text-gray-500 mt-2">Click to view all registered students</p>
          </button>
          <button
            onClick={() => setViewMode('submissions')}
            className={`bg-white rounded-lg shadow p-6 text-left transition hover:shadow-lg ${
              viewMode === 'submissions' ? 'ring-2 ring-green-500' : ''
            }`}
          >
            <h3 className="text-lg font-semibold text-gray-700">Total Submissions</h3>
            <p className="text-4xl font-bold text-green-600 mt-2">{stats.totalSubmissions}</p>
            <p className="text-sm text-gray-500 mt-2">Click to view inventory submissions</p>
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">
              {viewMode === 'students' ? 'Registered Students' : 'Student Inventory Records'}
            </h2>
            <div className="flex gap-2">
              {viewMode === 'submissions' && (
                <>
                  <button
                    onClick={handleCreate}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    + Add New Student
                  </button>
                  <button
                    onClick={exportToCSV}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  >
                    Export to CSV
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="flex gap-4 mb-4">
            <input
              type="text"
              placeholder={viewMode === 'students' ? 'Search by name, student ID, or email...' : 'Search by name or student ID...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'lastName' | 'date')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="lastName">Sort by Last Name</option>
              <option value="date">Sort by Date</option>
            </select>
          </div>

          {/* Students View */}
          {viewMode === 'students' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {sortedStudents.map((student) => (
                <div key={student.id} className="bg-white border rounded-lg shadow-sm hover:shadow-md transition overflow-hidden">
                  <div className="aspect-square bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                    <svg className="w-24 h-24 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-gray-800 text-lg mb-1">{student.full_name}</h3>
                    <p className="text-sm text-gray-600 mb-2">ID: {student.student_id}</p>
                    <p className="text-sm text-gray-700 mb-2">📧 {student.email}</p>
                    <p className="text-xs text-gray-400">
                      Registered: {new Date(student.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
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
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleView(submission)}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleEdit(submission)}
                        className="flex-1 px-3 py-2 bg-yellow-600 text-white text-sm rounded-lg hover:bg-yellow-700 transition"
                      >
                        Edit
                      </button>
                    </div>
                    <button
                      onClick={() => handleDelete(submission.id, submission.full_name)}
                      className="mt-2 w-full px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition"
                    >
                      Delete
                    </button>
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
      </div>

      {/* Modal for View/Create/Edit */}
      {showModal && (
        <StudentModal
          mode={modalMode}
          submission={selectedSubmission}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

// Student Modal Component
function StudentModal({ mode, submission, onClose, onSave }: any) {
  const formData = submission?.form_data || {};
  const [editData, setEditData] = useState({
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

  const handleChange = (e: any) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    onSave(editData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">
            {mode === 'view' ? 'View Student Details' : mode === 'create' ? 'Add New Student' : 'Edit Student'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">
            ×
          </button>
        </div>

        <div className="p-6">
          {mode === 'view' ? (
            <div className="space-y-6">
              {/* View Mode - Display Only */}
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

              {/* Uploaded Documents Section */}
              {formData.documentUrls && formData.documentUrls.length > 0 && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">📄 Uploaded Documents ({formData.documentUrls.length})</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {formData.documentUrls.map((url: string, index: number) => (
                      <div key={index} className="border rounded-lg overflow-hidden">
                        <div className="aspect-square bg-gray-100">
                          <img
                            src={url}
                            alt={`Document ${index + 1}`}
                            className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition"
                            onClick={() => window.open(url, '_blank')}
                          />
                        </div>
                        <div className="p-2 bg-gray-50 text-center">
                          <p className="text-xs font-medium text-gray-700">Document {index + 1}</p>
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline"
                          >
                            View Full Size
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-3">
                    <strong>Documents:</strong> 1. WHODAS 2.0 Form, 2. Individual Inventory Form, 3. PID-5-BF Form, 4. Counseling Consent Form
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
