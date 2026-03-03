import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Register() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    studentId: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Real-time email validation
    if (name === 'email') {
      if (value && !value.endsWith('@nbsc.edu.ph')) {
        setEmailError('Must be a valid NBSC email (@nbsc.edu.ph)');
      } else {
        setEmailError('');
      }
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate NBSC email domain
    if (!formData.email.endsWith('@nbsc.edu.ph')) {
      setError('Only NBSC student emails are allowed (e.g., 20201362@nbsc.edu.ph)');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      console.log('=== REGISTRATION START ===');
      console.log('Email:', formData.email);
      console.log('Student ID:', formData.studentId);

      // Step 1: Create auth user
      console.log('Step 1: Creating auth user...');
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (signUpError) {
        console.error('❌ Sign up error:', signUpError);
        setError('Sign up failed: ' + signUpError.message);
        setLoading(false);
        return;
      }

      if (!authData.user) {
        console.error('❌ No user data returned');
        setError('Registration failed: No user created');
        setLoading(false);
        return;
      }

      console.log('✅ Auth user created:', authData.user.id);

      // Step 2: Wait a bit
      console.log('Step 2: Waiting...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 3: Create profile
      console.log('Step 3: Creating profile...');
      const profileData = {
        id: authData.user.id,
        email: formData.email,
        full_name: formData.fullName,
        student_id: formData.studentId,
        is_admin: false,
      };
      console.log('Profile data:', profileData);

      const { data: insertedProfile, error: profileError } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single();

      if (profileError) {
        console.error('❌ Profile error:', profileError);
        console.error('Error details:', JSON.stringify(profileError, null, 2));
        setError('Profile creation failed: ' + profileError.message + ' (Code: ' + profileError.code + ')');
        setLoading(false);
        return;
      }

      console.log('✅ Profile created:', insertedProfile);
      console.log('=== REGISTRATION SUCCESS ===');

      // Success! Show email confirmation message
      alert(
        '✅ Registration successful!\n\n' +
        '📧 Please check your email (' + formData.email + ') to confirm your account.\n\n' +
        '⚠️ You must verify your email before you can login.\n\n' +
        'Check your spam folder if you don\'t see the email within a few minutes.'
      );
      navigate('/login');
    } catch (err: any) {
      console.error('❌ Unexpected error:', err);
      console.error('Error stack:', err.stack);
      setError('Unexpected error: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Create Account</h1>
          <p className="text-gray-600 mt-2">Register as a student</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
            <input
              type="text"
              name="studentId"
              value={formData.studentId}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              NBSC Student Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="20201362@nbsc.edu.ph"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                emailError ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            />
            {emailError ? (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {emailError}
              </p>
            ) : (
              <p className="text-xs text-gray-500 mt-1">
                Must be a valid NBSC email ending with @nbsc.edu.ph
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-800 text-center">
            📧 After registration, you'll receive a confirmation email. Please verify your email before logging in.
          </p>
        </div>

        <p className="text-center mt-6 text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:underline font-medium">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
}
