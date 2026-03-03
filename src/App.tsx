import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import InventoryForm from './pages/InventoryForm';

function App() {
  const { user, isAdmin, loading, sessionChecked, initializeAuth } = useAuthStore();

  useEffect(() => {
    // Initialize authentication on app load
    initializeAuth();
  }, [initializeAuth]);

  // Show loading screen while checking authentication
  if (loading || !sessionChecked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to={isAdmin ? "/admin" : "/dashboard"} />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={user && !isAdmin ? <StudentDashboard /> : <Navigate to="/login" />} />
        <Route path="/admin" element={user && isAdmin ? <AdminDashboard /> : <Navigate to="/login" />} />
        <Route path="/inventory-form" element={user && !isAdmin ? <InventoryForm /> : <Navigate to="/login" />} />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
