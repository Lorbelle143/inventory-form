import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useToastContext } from '../contexts/ToastContext';

export default function MentalHealthAdmin() {
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'need-support' | 'immediate-support'>('all');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'edit'>('view');
  const [selectedAssessment, setSelectedAssessment] = useState<any>(null);
  const [editNotes, setEditNotes] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'date' | 'score' | 'name'>('date');
  const toast = useToastContext();

  useEffect(() => {
    loadAssessments();
  }, []);

  const loadAssessments = async () => {
    try {
      setLoading(true);
      console.log('Loading mental health assessments...');
      
      const { data, error } = await supabase
        .from('mental_health_assessments')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error loading assessments:', error);
        throw error;
      }
      
      console.log('Loaded assessments:', data);
      setAssessments(data || []);
    } catch (error: any) {
      console.error('Failed to load assessments:', error);
      toast.error('Failed to load assessments: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredAssessments = assessments.filter(a => {
    if (filter === 'all') return true;
    return a.risk_level === filter;
  });

  // Sort assessments
  const sortedAssessments = [...filteredAssessments].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'score':
        return b.total_score - a.total_score;
      case 'name':
        return a.full_name.localeCompare(b.full_name);
      default:
        return 0;
    }
  });

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

  const handleView = (assessment: any) => {
    setSelectedAssessment(assessment);
    setModalMode('view');
    setShowModal(true);
  };

  const handleEdit = (assessment: any) => {
    setSelectedAssessment(assessment);
    setEditNotes(assessment.counseling_notes || '');
    setModalMode('edit');
    setShowModal(true);
  };

  const handleDelete = async (assessment: any) => {
    if (!confirm(`Are you sure you want to delete ${assessment.full_name}'s mental health assessment?\n\nThis action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('mental_health_assessments')
        .delete()
        .eq('id', assessment.id);

      if (error) throw error;

      toast.success('Assessment deleted successfully');
      loadAssessments();
    } catch (error: any) {
      toast.error('Failed to delete assessment: ' + error.message);
    }
  };

  const handleSaveEdit = async () => {
    try {
      const { error } = await supabase
        .from('mental_health_assessments')
        .update({
          counseling_notes: editNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedAssessment.id);

      if (error) throw error;

      toast.success('Notes updated successfully');
      setShowModal(false);
      loadAssessments();
    } catch (error: any) {
      toast.error('Failed to update notes: ' + error.message);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading assessments...</div>;
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">🧠 Mental Health Assessments</h2>
          
          {/* Print Button */}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition shadow-md print:hidden"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print
          </button>
        </div>
        
        {/* Filter Buttons */}
        <div className="flex gap-4 mb-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            All ({assessments.length})
          </button>
          <button
            onClick={() => setFilter('need-support')}
            className={`px-4 py-2 rounded-lg ${filter === 'need-support' ? 'bg-orange-600 text-white' : 'bg-gray-200'}`}
          >
            Need Support ({assessments.filter(a => a.risk_level === 'need-support').length})
          </button>
          <button
            onClick={() => setFilter('immediate-support')}
            className={`px-4 py-2 rounded-lg ${filter === 'immediate-support' ? 'bg-red-600 text-white' : 'bg-gray-200'}`}
          >
            Immediate Support ({assessments.filter(a => a.risk_level === 'immediate-support').length})
          </button>
        </div>

        {/* View Mode and Sort Controls */}
        <div className="flex gap-4 items-center print:hidden">
          {/* View Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              List
            </button>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 font-medium">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'score' | 'name')}
              className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="date">Date (Newest First)</option>
              <option value="score">Score (Highest First)</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedAssessments.map((assessment) => (
            <div key={assessment.id} className="border-2 rounded-xl p-6 hover:shadow-lg transition">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg">{assessment.full_name}</h3>
                  <p className="text-sm text-gray-600">{assessment.student_id}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${getRiskColor(assessment.risk_level)}`}>
                  {getRiskLabel(assessment.risk_level)}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Score:</span>
                  <span className="font-bold text-lg">{assessment.total_score}/20</span>
                </div>
                <div className="text-xs text-gray-500">
                  Submitted: {new Date(assessment.created_at).toLocaleDateString()}
                </div>
              </div>

              {assessment.requires_counseling && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-xs font-bold text-red-800">⚠️ REQUIRES COUNSELING</p>
                  <p className="text-xs text-red-700 mt-1">Student must visit SC Room 108</p>
                </div>
              )}

              <div className="text-xs space-y-1 text-gray-600 mb-4">
                <div>Feeling alone: {assessment.feeling_alone}</div>
                <div>Feeling blue: {assessment.feeling_blue}</div>
                <div>Easily annoyed: {assessment.feeling_easily_annoyed}</div>
                <div>Tense/anxious: {assessment.feeling_tense_anxious}</div>
                <div className={assessment.having_suicidal_thoughts > 0 ? 'text-red-600 font-bold' : ''}>
                  Suicidal thoughts: {assessment.having_suicidal_thoughts}
                  {assessment.having_suicidal_thoughts > 0 && ' ⚠️'}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-2 print:hidden">
                <button
                  onClick={() => handleView(assessment)}
                  className="px-3 py-2 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  👁️ View
                </button>
                <button
                  onClick={() => handleEdit(assessment)}
                  className="px-3 py-2 bg-amber-600 text-white text-xs rounded-lg hover:bg-amber-700 transition font-medium"
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => handleDelete(assessment)}
                  className="px-3 py-2 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 transition font-medium"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white rounded-xl overflow-hidden shadow-lg">
            <thead className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-bold">Student Name</th>
                <th className="px-4 py-3 text-left text-sm font-bold">Student ID</th>
                <th className="px-4 py-3 text-center text-sm font-bold">Score</th>
                <th className="px-4 py-3 text-center text-sm font-bold">Risk Level</th>
                <th className="px-4 py-3 text-center text-sm font-bold">Counseling</th>
                <th className="px-4 py-3 text-center text-sm font-bold">Date</th>
                <th className="px-4 py-3 text-center text-sm font-bold print:hidden">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedAssessments.map((assessment, index) => (
                <tr key={assessment.id} className={`border-b hover:bg-gray-50 transition ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  <td className="px-4 py-3 font-medium text-gray-800">{assessment.full_name}</td>
                  <td className="px-4 py-3 text-gray-600">{assessment.student_id}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-bold text-lg">{assessment.total_score}/20</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border-2 inline-block ${getRiskColor(assessment.risk_level)}`}>
                      {getRiskLabel(assessment.risk_level)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {assessment.requires_counseling ? (
                      <span className="text-red-600 font-bold text-sm">⚠️ Required</span>
                    ) : (
                      <span className="text-gray-400 text-sm">Not Required</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-gray-600">
                    {new Date(assessment.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-center print:hidden">
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => handleView(assessment)}
                        className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition"
                        title="View"
                      >
                        👁️
                      </button>
                      <button
                        onClick={() => handleEdit(assessment)}
                        className="px-3 py-1 bg-amber-600 text-white text-xs rounded hover:bg-amber-700 transition"
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(assessment)}
                        className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {sortedAssessments.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>No assessments found for this filter</p>
        </div>
      )}

      {/* View/Edit Modal */}
      {showModal && selectedAssessment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">
                {modalMode === 'view' ? 'View Assessment' : 'Edit Assessment Notes'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Student Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-bold text-lg mb-2">{selectedAssessment.full_name}</h3>
                <p className="text-sm text-gray-600">Student ID: {selectedAssessment.student_id}</p>
                <p className="text-sm text-gray-600">
                  Submitted: {new Date(selectedAssessment.created_at).toLocaleString()}
                </p>
              </div>

              {/* Score Display */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Score</p>
                    <p className="text-4xl font-bold text-gray-800">{selectedAssessment.total_score}/20</p>
                  </div>
                  <span className={`px-4 py-2 rounded-full text-sm font-bold border-2 ${getRiskColor(selectedAssessment.risk_level)}`}>
                    {getRiskLabel(selectedAssessment.risk_level)}
                  </span>
                </div>
              </div>

              {/* Detailed Responses */}
              <div className="space-y-3">
                <h3 className="font-bold text-gray-800">Assessment Responses:</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600">Feeling alone</p>
                    <p className="text-2xl font-bold">{selectedAssessment.feeling_alone}/4</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600">Feeling blue</p>
                    <p className="text-2xl font-bold">{selectedAssessment.feeling_blue}/4</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600">Easily annoyed</p>
                    <p className="text-2xl font-bold">{selectedAssessment.feeling_easily_annoyed}/4</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600">Tense/anxious</p>
                    <p className="text-2xl font-bold">{selectedAssessment.feeling_tense_anxious}/4</p>
                  </div>
                  <div className={`rounded-lg p-3 col-span-2 ${
                    selectedAssessment.having_suicidal_thoughts > 0 ? 'bg-red-50 border-2 border-red-300' : 'bg-gray-50'
                  }`}>
                    <p className="text-xs text-gray-600">Suicidal thoughts</p>
                    <p className={`text-2xl font-bold ${selectedAssessment.having_suicidal_thoughts > 0 ? 'text-red-600' : ''}`}>
                      {selectedAssessment.having_suicidal_thoughts}/4
                      {selectedAssessment.having_suicidal_thoughts > 0 && ' ⚠️'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Counseling Notes */}
              {modalMode === 'edit' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Counseling Notes:
                  </label>
                  <textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Add notes about counseling session, follow-up actions, etc..."
                  />
                </div>
              ) : (
                selectedAssessment.counseling_notes && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="font-bold text-gray-800 mb-2">Counseling Notes:</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedAssessment.counseling_notes}</p>
                  </div>
                )
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Close
                </button>
                {modalMode === 'edit' && (
                  <button
                    onClick={handleSaveEdit}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Save Notes
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
