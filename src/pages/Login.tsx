import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

export default function Login() {
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [masterKey, setMasterKey] = useState('');
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser, setIsAdmin } = useAuthStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Admin login - master key only
    if (isAdminLogin) {
      if (masterKey !== import.meta.env.VITE_ADMIN_MASTER_KEY) {
        setError('Invalid master key');
        setLoading(false);
        return;
      }

      // Direct admin access with master key
      setUser({ id: 'admin', email: 'admin@system' } as any);
      setIsAdmin(true);
      navigate('/admin');
      setLoading(false);
      return;
    }

    // Student login - Student ID and password
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('student_id', studentId)
        .single();

      if (profileError || !profile) {
        setError('Student ID not found. Please register first or check your Student ID.');
        setLoading(false);
        return;
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password,
      });

      if (signInError) {
        // Check if error is due to unconfirmed email
        if (signInError.message.includes('Email not confirmed') || signInError.message.includes('email_not_confirmed')) {
          setError('⚠️ Please verify your email first. Check your inbox for the confirmation link.');
        } else {
          setError('Invalid password. Please try again.');
        }
        setLoading(false);
        return;
      }

      if (data.user) {
        // Double-check email is confirmed
        if (!data.user.email_confirmed_at) {
          setError('⚠️ Please verify your email first. Check your inbox for the confirmation link.');
          await supabase.auth.signOut(); // Sign out the unconfirmed user
          setLoading(false);
          return;
        }

        setUser(data.user);
        setIsAdmin(false);
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError('Login failed: ' + (err.message || 'Unknown error'));
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <img 
            src="data:image/jpeg;base64,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" 
            alt="Guidance Logo" 
            className="mx-auto mb-4 w-24 h-24 object-contain"
          />
          <h1 className="text-3xl font-bold text-gray-800">Guidance Counseling Inventory Form</h1>
          <p className="text-gray-600 mt-2">Sign in to your account</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {!isAdminLogin ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your Student ID"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Admin Master Key</label>
              <input
                type="password"
                value={masterKey}
                onChange={(e) => setMasterKey(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter master key"
                required
              />
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {!isAdminLogin && (
          <>
            <p className="text-center mt-6 text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-blue-600 hover:underline font-medium">
                Register here
              </Link>
            </p>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-800 text-center">
                <strong>First time?</strong> Register as a student first, then login with your Student ID and password.
              </p>
            </div>
          </>
        )}

        {/* Admin Access Button */}
        {!isAdminLogin && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={() => setIsAdminLogin(true)}
              className="w-full py-2 px-4 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition border border-gray-300"
            >
              🔒 Admin Access
            </button>
          </div>
        )}

        {/* Back to Student Login */}
        {isAdminLogin && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={() => setIsAdminLogin(false)}
              className="w-full py-2 px-4 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition"
            >
              ← Back to Student Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
