import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import { ToastProvider } from './contexts/ToastContext';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import InventoryForm from './pages/InventoryForm';
import ForgotPassword from './pages/ForgotPassword';
import EditProfile from './pages/EditProfile';
import LoadingSpinner from './components/LoadingSpinner';

function App() {
  const { user, isAdmin, loading, sessionChecked, initializeAuth } = useAuthStore();

  useEffect(() => {
    // Initialize authentication on app load
    initializeAuth();
  }, [initializeAuth]);

  // Show loading screen while checking authentication
  if (loading || !sessionChecked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="xl" color="white" text="Loading..." />
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={!user ? <Login /> : <Navigate to={isAdmin ? "/admin" : "/dashboard"} />} />
          <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" />} />
          <Route path="/forgot-password" element={!user ? <ForgotPassword /> : <Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={user && !isAdmin ? <StudentDashboard /> : <Navigate to="/login" />} />
          <Route path="/edit-profile" element={user && !isAdmin ? <EditProfile /> : <Navigate to="/login" />} />
          <Route path="/admin" element={user && isAdmin ? <AdminDashboard /> : <Navigate to="/login" />} />
          <Route path="/inventory-form" element={user ? <InventoryForm /> : <Navigate to="/login" />} />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
