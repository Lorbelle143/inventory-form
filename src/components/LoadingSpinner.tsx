interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'blue' | 'white' | 'gray';
  text?: string;
}

export default function LoadingSpinner({ 
  size = 'md', 
  color = 'blue',
  text 
}: LoadingSpinnerProps) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
    xl: 'w-16 h-16 border-4',
  };

  const colors = {
    blue: 'border-blue-600 border-t-transparent',
    white: 'border-white border-t-transparent',
    gray: 'border-gray-600 border-t-transparent',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className={`${sizes[size]} ${colors[color]} rounded-full animate-spin`}></div>
      {text && <p className="text-sm text-gray-600 font-medium">{text}</p>}
    </div>
  );
}

// Full page loading overlay
export function LoadingOverlay({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 shadow-2xl">
        <LoadingSpinner size="xl" text={text} />
      </div>
    </div>
  );
}

// Inline loading state
export function InlineLoading({ text }: { text?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-4">
      <LoadingSpinner size="sm" />
      {text && <span className="text-sm text-gray-600">{text}</span>}
    </div>
  );
}
