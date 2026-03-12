// Mental Health Assessment Quick Action Card Component
export function MentalHealthAssessmentCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
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
  );
}
