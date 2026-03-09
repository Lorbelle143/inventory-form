import { useMemo } from 'react';

interface AnalyticsProps {
  submissions: any[];
  students: any[];
}

export default function AdminAnalytics({ submissions, students }: AnalyticsProps) {
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

    return {
      courseCount,
      yearCount,
      genderCount,
      monthlySubmissions,
      completionRate,
      totalStudents: students.length,
      totalSubmissions: submissions.length,
      pendingSubmissions: students.length - submissions.length,
    };
  }, [submissions, students]);

  return (
    <div className="space-y-6">
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
    </div>
  );
}
