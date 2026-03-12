import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { useToastContext } from '../contexts/ToastContext';

export default function MentalHealthAssessment() {
  const { user } = useAuthStore();
  const toast = useToastContext();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [assessmentResults, setAssessmentResults] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  
  const [responses, setResponses] = useState({
    feeling_alone: -1,
    feeling_blue: -1,
    feeling_easily_annoyed: -1,
    feeling_tense_anxious: -1,
    feeling_inferior: -1,
    having_suicidal_thoughts: -1
  });

  const questions = [
    { key: 'feeling_alone', text: 'Trouble falling asleep' },
    { key: 'feeling_blue', text: 'Feeling tense or keyed up' },
    { key: 'feeling_easily_annoyed', text: 'Feeling easily annoyed or irritated' },
    { key: 'feeling_tense_anxious', text: 'Feeling blue' },
    { key: 'feeling_inferior', text: 'Feeling inferior to others' }
  ];

  const suicidalQuestion = {
    key: 'having_suicidal_thoughts',
    text: 'Having suicidal thoughts'
  };

  const options = [
    { value: 0, label: 'Never', emoji: '😊' },
    { value: 1, label: 'Rarely', emoji: '🙂' },
    { value: 2, label: 'Sometimes', emoji: '😐' },
    { value: 3, label: 'Often', emoji: '😟' },
    { value: 4, label: 'Always', emoji: '😢' }
  ];

  useEffect(() => {
    if (user) {
      loadProfile();
      checkEditMode();
    }
  }, [user]);

  const checkEditMode = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const editIdParam = urlParams.get('edit');
    
    if (editIdParam) {
      setEditMode(true);
      setEditId(editIdParam);
      await loadAssessment(editIdParam);
    }
  };

  const loadAssessment = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('mental_health_assessments')
        .select('*')
        .eq('id', id)
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;

      if (data) {
        setResponses({
          feeling_alone: data.feeling_alone,
          feeling_blue: data.feeling_blue,
          feeling_easily_annoyed: data.feeling_easily_annoyed,
          feeling_tense_anxious: data.feeling_tense_anxious,
          feeling_inferior: data.feeling_inferior || 0,
          having_suicidal_thoughts: data.having_suicidal_thoughts
        });
      }
    } catch (error: any) {
      toast.error('Failed to load assessment');
      navigate('/dashboard');
    }
  };

  const loadProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    setProfile(data);
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all questions answered
    const unanswered = Object.values(responses).some(v => v === -1);
    if (unanswered) {
      toast.error('Please answer all questions');
      return;
    }

    setLoading(true);
    try {
      // Calculate total score (excluding suicidal thoughts)
      const totalScore = responses.feeling_alone + 
                        responses.feeling_blue + 
                        responses.feeling_easily_annoyed + 
                        responses.feeling_tense_anxious + 
                        responses.feeling_inferior;
      
      const hasSuicidalThoughts = responses.having_suicidal_thoughts > 0;
      
      // If has suicidal thoughts (even 1), automatic immediate support
      let riskLevel = 'doing-well';
      let riskMessage = 'You are doing well';
      
      if (hasSuicidalThoughts) {
        riskLevel = 'immediate-support';
        riskMessage = 'Need immediate support';
      } else if (totalScore >= 14) {
        riskLevel = 'immediate-support';
        riskMessage = 'Need immediate support';
      } else if (totalScore >= 11) {
        riskLevel = 'need-support';
        riskMessage = 'You need support';
      }
      
      const requiresCounseling = totalScore >= 11 || hasSuicidalThoughts;

      const assessmentData = {
        user_id: user?.id,
        student_id: profile?.student_id,
        full_name: profile?.full_name,
        ...responses,
        total_score: totalScore,
        risk_level: riskLevel,
        requires_counseling: requiresCounseling
      };

      let data, error;

      if (editMode && editId) {
        // Update existing assessment
        console.log('Updating assessment:', editId);
        const result = await supabase
          .from('mental_health_assessments')
          .update({
            ...responses,
            total_score: totalScore,
            risk_level: riskLevel,
            requires_counseling: requiresCounseling,
            updated_at: new Date().toISOString()
          })
          .eq('id', editId)
          .eq('user_id', user?.id)
          .select()
          .single();
        
        data = result.data;
        error = result.error;
      } else {
        // Create new assessment
        console.log('Creating new assessment:', assessmentData);
        const result = await supabase
          .from('mental_health_assessments')
          .insert(assessmentData)
          .select()
          .single();
        
        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Assessment saved successfully:', data);

      // Store results for modal
      setAssessmentResults({
        totalScore,
        riskLevel,
        riskMessage,
        requiresCounseling,
        hasSuicidalThoughts
      });

      // Show success message
      toast.success(editMode ? 'Assessment updated successfully!' : 'Assessment submitted successfully!');

      // Show results modal instead of navigating immediately
      setShowResultsModal(true);
    } catch (error: any) {
      console.error('Full error:', error);
      toast.error('Failed to submit assessment: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    console.log('Cancel clicked, navigating to dashboard');
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-3xl">NBSC</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Mental Health Assessment</h1>
            <p className="text-gray-600">Brief Symptom Rating Scale (BSRS-5)</p>
            <p className="text-sm text-gray-500 mt-2">Northern Bukidnon State College</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {questions.map((q, idx) => (
              <div key={q.key} className="border-b pb-6">
                <p className="font-medium text-gray-800 mb-4">
                  {idx + 1}. {q.text}
                </p>
                <div className="grid grid-cols-5 gap-2">
                  {options.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setResponses({ ...responses, [q.key]: opt.value })}
                      className={`p-4 rounded-lg border-2 transition ${
                        responses[q.key as keyof typeof responses] === opt.value
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="text-3xl mb-2">{opt.emoji}</div>
                      <div className="text-xs font-medium">{opt.label}</div>
                      <div className="text-xs text-gray-500">{opt.value}</div>
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Suicidal Thoughts Question - Separate, Not Included in Score */}
            <div className="border-2 border-red-200 bg-red-50 rounded-xl p-6">
              <p className="font-bold text-red-800 mb-2 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {suicidalQuestion.text}
              </p>
              <p className="text-xs text-red-700 mb-4">
                This question is not included in your score, but any indication of suicidal thoughts requires immediate support.
              </p>
              <div className="grid grid-cols-5 gap-2">
                {options.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setResponses({ ...responses, [suicidalQuestion.key]: opt.value })}
                    className={`p-4 rounded-lg border-2 transition ${
                      responses[suicidalQuestion.key as keyof typeof responses] === opt.value
                        ? 'border-red-600 bg-red-100'
                        : 'border-red-200 hover:border-red-400 bg-white'
                    }`}
                  >
                    <div className="text-3xl mb-2">{opt.emoji}</div>
                    <div className="text-xs font-medium">{opt.label}</div>
                    <div className="text-xs text-gray-500">{opt.value}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> Scoring Guide (Questions 1-5 only):<br/>
                • <strong>0-10:</strong> You are doing well<br/>
                • <strong>11-13:</strong> You need support<br/>
                • <strong>14-20:</strong> Need immediate support<br/>
                <br/>
                <strong className="text-red-700">⚠️ Important:</strong> If your score is 11 or above, or if you have ANY suicidal thoughts, 
                please visit the Guidance Counseling Office at <strong>SC Room 108</strong>.
              </p>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (editMode ? 'Updating...' : 'Submitting...') : (editMode ? 'Update Assessment' : 'Submit Assessment')}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Results Modal */}
      {showResultsModal && assessmentResults && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-fade-in">
            <div className="text-center">
              {/* Score Display */}
              <div className={`w-32 h-32 mx-auto mb-6 rounded-full flex items-center justify-center ${
                assessmentResults.requiresCounseling 
                  ? 'bg-red-100 border-4 border-red-500' 
                  : 'bg-green-100 border-4 border-green-500'
              }`}>
                <div>
                  <div className="text-5xl font-bold text-gray-800">{assessmentResults.totalScore}</div>
                  <div className="text-sm text-gray-600">out of 20</div>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-gray-800 mb-2">Assessment Complete</h2>
              
              {/* Risk Level Badge */}
              <div className={`inline-block px-4 py-2 rounded-full text-sm font-bold mb-4 ${
                assessmentResults.riskLevel === 'immediate-support' ? 'bg-red-100 text-red-800 border-2 border-red-500' :
                assessmentResults.riskLevel === 'need-support' ? 'bg-orange-100 text-orange-800 border-2 border-orange-500' :
                'bg-green-100 text-green-800 border-2 border-green-500'
              }`}>
                {assessmentResults.riskMessage.toUpperCase()}
              </div>

              {/* Counseling Required Message */}
              {assessmentResults.requiresCounseling ? (
                <div className={`border-2 rounded-xl p-6 mb-6 ${
                  assessmentResults.riskLevel === 'immediate-support' 
                    ? 'bg-red-50 border-red-300' 
                    : 'bg-orange-50 border-orange-300'
                }`}>
                  <div className="text-4xl mb-3">
                    {assessmentResults.riskLevel === 'immediate-support' ? '🚨' : '⚠️'}
                  </div>
                  <h3 className={`text-lg font-bold mb-2 ${
                    assessmentResults.riskLevel === 'immediate-support' ? 'text-red-800' : 'text-orange-800'
                  }`}>
                    {assessmentResults.riskLevel === 'immediate-support' 
                      ? 'Immediate Support Required' 
                      : 'Support Recommended'}
                  </h3>
                  <p className={`mb-4 ${
                    assessmentResults.riskLevel === 'immediate-support' ? 'text-red-700' : 'text-orange-700'
                  }`}>
                    Your score is {assessmentResults.totalScore}/20. 
                    {assessmentResults.hasSuicidalThoughts && ' You indicated having suicidal thoughts.'}
                    {assessmentResults.totalScore >= 14 && ' This indicates you need immediate support.'}
                    {assessmentResults.totalScore >= 11 && assessmentResults.totalScore < 14 && ' This indicates you need support.'}
                  </p>
                  <div className={`bg-white rounded-lg p-4 border-2 ${
                    assessmentResults.riskLevel === 'immediate-support' ? 'border-red-200' : 'border-orange-200'
                  }`}>
                    <p className="font-bold text-gray-800 mb-2">Please visit:</p>
                    <p className={`text-xl font-bold ${
                      assessmentResults.riskLevel === 'immediate-support' ? 'text-red-600' : 'text-orange-600'
                    }`}>
                      Guidance Counseling Office
                    </p>
                    <p className="text-lg text-gray-700 mb-3">SC Room 108</p>
                    <a
                      href="https://docs.google.com/spreadsheets/d/1-80LunHLARHr83-yBFB9KGFObQMEM2mUIx4L1PXhgT0/edit?gid=0#gid=0"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-white transition ${
                        assessmentResults.riskLevel === 'immediate-support' 
                          ? 'bg-red-600 hover:bg-red-700' 
                          : 'bg-orange-600 hover:bg-orange-700'
                      }`}
                    >
                      📋 Appointment Form for Guidance
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                </div>
              ) : (
                <div className="bg-green-50 border-2 border-green-300 rounded-xl p-6 mb-6">
                  <div className="text-4xl mb-3">✅</div>
                  <h3 className="text-lg font-bold text-green-800 mb-2">You Are Doing Well!</h3>
                  <p className="text-green-700">
                    Your score is {assessmentResults.totalScore}/20 (0-10 range). Keep maintaining your mental wellness!
                  </p>
                </div>
              )}

              {/* Close Button */}
              <button
                onClick={() => {
                  setShowResultsModal(false);
                  toast.success('Assessment submitted successfully');
                  navigate('/dashboard');
                }}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
