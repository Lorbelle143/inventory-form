import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuthStore } from './store/authStore';
import { ToastProvider } from './contexts/ToastContext';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import InventoryForm from './pages/InventoryForm';
import ForgotPassword from './pages/ForgotPassword';
import EditProfile from './pages/EditProfile';
import MentalHealthAssessment from './pages/MentalHealthAssessment';
import LoadingSpinner from './components/LoadingSpinner';

function App() {
  const { user, isAdmin, loading, sessionChecked, initializeAuth } = useAuthStore();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initialize authentication on app load
    const init = async () => {
      await initializeAuth();
      setIsInitialized(true);
    };
    
    init();
  }, []); // Empty dependency array - only run once on mount

  // Show loading screen while checking authentication
  if (!isInitialized || loading || !sessionChecked) {
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
          <Route path="/login" element={!user ? <Login /> : <Navigate to={isAdmin ? "/admin" : "/dashboard"} replace />} />
          <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" replace />} />
          <Route path="/forgot-password" element={!user ? <ForgotPassword /> : <Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={user && !isAdmin ? <StudentDashboard /> : <Navigate to="/login" replace />} />
          <Route path="/edit-profile" element={user && !isAdmin ? <EditProfile /> : <Navigate to="/login" replace />} />
          <Route path="/mental-health-assessment" element={user && !isAdmin ? <MentalHealthAssessment /> : <Navigate to="/login" replace />} />
          <Route path="/admin" element={user && isAdmin ? <AdminDashboard /> : <Navigate to="/login" replace />} />
          <Route path="/inventory-form" element={user ? <InventoryForm /> : <Navigate to="/login" replace />} />
          <Route path="/" element={<Navigate to={user ? (isAdmin ? "/admin" : "/dashboard") : "/login"} replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
