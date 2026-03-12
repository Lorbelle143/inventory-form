import { useMemo, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface AnalyticsProps {
  submissions: any[];
  students: any[];
}

export default function AdminAnalytics({ submissions, students }: AnalyticsProps) {
  const [mentalHealthData, setMentalHealthData] = useState<any[]>([]);

  useEffect(() => {
    loadMentalHealthData();
  }, []);

  const loadMentalHealthData = async () => {
    try {
      const { data } = await supabase
        .from('mental_health_assessments')
        .select('*')
        .order('created_at', { ascending: false });
      setMentalHealthData(data || []);
    } catch (error) {
      console.error('Error loading mental health data:', error);
    }
  };

  const analytics = useMemo(() => {
    // Course distribution
    const courseCount: Record<string, number> = {};
    submissions.forEach(s => {
      const course = s.course || 'Unknown';
      courseCount[course] = (courseCount[course] || 0) + 1;
    });

    // Year level distribution
    const yearCount: Record<string, number> = {};
    submissions.forEach(s => {
      const year = s.year_level || 'Unknown';
      yearCount[year] = (yearCount[year] || 0) + 1;
    });

    // Gender distribution
    const genderCount: Record<string, number> = {};
    submissions.forEach(s => {
      const gender = s.form_data?.gender || 'Not specified';
      genderCount[gender] = (genderCount[gender] || 0) + 1;
    });

    // Submissions per month (last 6 months)
    const monthlySubmissions: Record<string, number> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      monthlySubmissions[key] = 0;
    }
    
    submissions.forEach(s => {
      const date = new Date(s.created_at);
      const key = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (monthlySubmissions[key] !== undefined) {
        monthlySubmissions[key]++;
      }
    });

    // Completion rate (students with submissions vs total students)
    const completionRate = students.length > 0 
      ? ((submissions.length / students.length) * 100).toFixed(1)
      : '0';

    // Mental Health Analytics
    const mentalHealthStats = {
      total: mentalHealthData.length,
      doingWell: mentalHealthData.filter(m => m.risk_level === 'doing-well').length,
      needSupport: mentalHealthData.filter(m => m.risk_level === 'need-support').length,
      immediateSupport: mentalHealthData.filter(m => m.risk_level === 'immediate-support').length,
      requiresCounseling: mentalHealthData.filter(m => m.requires_counseling).length,
      hasSuicidalThoughts: mentalHealthData.filter(m => m.having_suicidal_thoughts > 0).length,
      averageScore: mentalHealthData.length > 0
        ? (mentalHealthData.reduce((sum, m) => sum + m.total_score, 0) / mentalHealthData.length).toFixed(1)
        : '0'
    };

    return {
      courseCount,
      yearCount,
      genderCount,
      monthlySubmissions,
      completionRate,
      totalStudents: students.length,
      totalSubmissions: submissions.length,
      pendingSubmissions: students.length - submissions.length,
      mentalHealthStats
    };
  }, [submissions, students, mentalHealthData]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Print Button */}
      <div className="flex justify-end">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition shadow-lg hover:shadow-xl font-medium print:hidden"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print Analytics Report
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span className="text-3xl font-bold">{analytics.totalStudents}</span>
          </div>
          <p className="text-sm opacity-90">Total Students</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-3xl font-bold">{analytics.totalSubmissions}</span>
          </div>
          <p className="text-sm opacity-90">Completed Forms</p>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-3xl font-bold">{analytics.pendingSubmissions}</span>
          </div>
          <p className="text-sm opacity-90">Pending Forms</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-3xl font-bold">{analytics.completionRate}%</span>
          </div>
          <p className="text-sm opacity-90">Completion Rate</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Course Distribution */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Course Distribution
          </h3>
          <div className="space-y-3">
            {Object.entries(analytics.courseCount).map(([course, count]) => {
              const percentage = ((count / analytics.totalSubmissions) * 100).toFixed(1);
              return (
                <div key={course}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">{course}</span>
                    <span className="text-gray-600">{count} ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Year Level Distribution */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Year Level Distribution
          </h3>
          <div className="space-y-3">
            {Object.entries(analytics.yearCount).map(([year, count]) => {
              const percentage = ((count / analytics.totalSubmissions) * 100).toFixed(1);
              return (
                <div key={year}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">Year {year}</span>
                    <span className="text-gray-600">{count} ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Gender Distribution */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Gender Distribution
          </h3>
          <div className="space-y-3">
            {Object.entries(analytics.genderCount).map(([gender, count]) => {
              const percentage = ((count / analytics.totalSubmissions) * 100).toFixed(1);
              return (
                <div key={gender}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">{gender}</span>
                    <span className="text-gray-600">{count} ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Monthly Submissions */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Monthly Submissions (Last 6 Months)
          </h3>
          <div className="space-y-3">
            {Object.entries(analytics.monthlySubmissions).map(([month, count]) => {
              const maxCount = Math.max(...Object.values(analytics.monthlySubmissions));
              const percentage = maxCount > 0 ? ((count / maxCount) * 100).toFixed(1) : '0';
              return (
                <div key={month}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">{month}</span>
                    <span className="text-gray-600">{count} submissions</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mental Health Analytics Section */}
      <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl shadow-xl p-8 border-2 border-pink-200">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          Mental Health Assessment Analytics
        </h2>

        {/* Mental Health Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl font-bold text-gray-800">{analytics.mentalHealthStats.total}</span>
              <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-sm text-gray-600 font-medium">Total Assessments</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl font-bold text-gray-800">{analytics.mentalHealthStats.doingWell}</span>
              <span className="text-2xl">✅</span>
            </div>
            <p className="text-sm text-gray-600 font-medium">Doing Well (0-10)</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-orange-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl font-bold text-gray-800">{analytics.mentalHealthStats.needSupport}</span>
              <span className="text-2xl">⚠️</span>
            </div>
            <p className="text-sm text-gray-600 font-medium">Need Support (11-13)</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-red-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl font-bold text-gray-800">{analytics.mentalHealthStats.immediateSupport}</span>
              <span className="text-2xl">🚨</span>
            </div>
            <p className="text-sm text-gray-600 font-medium">Immediate Support (14-20)</p>
          </div>
        </div>

        {/* Additional Mental Health Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{analytics.mentalHealthStats.requiresCounseling}</p>
                <p className="text-sm text-gray-600">Require Counseling</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{analytics.mentalHealthStats.averageScore}</p>
                <p className="text-sm text-gray-600">Average Score</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">⚠️</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{analytics.mentalHealthStats.hasSuicidalThoughts}</p>
                <p className="text-sm text-gray-600">Suicidal Thoughts Reported</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
