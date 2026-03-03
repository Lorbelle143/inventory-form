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
          <h1 className="text-3xl font-bold text-gray-800">Student Inventory System</h1>
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
