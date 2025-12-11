import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProjectDetailsPage from './pages/ProjectDetailsPage';
import MyFocusPage from './pages/MyFocusPage';
import CompleteProfilePage from './pages/CompleteProfilePage';
import SettingsPage from './pages/SettingsPage';
import ArchivedPage from './pages/ArchivedPage';

// Route that requires authentication
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="min-h-screen bg-surface-primary text-text-primary flex items-center justify-center">Cargando...</div>;
  
  return user ? children : <Navigate to="/login" />;
};

// Route that requires authentication AND a complete profile (confirmed display name)
const RequireProfileRoute = ({ children }) => {
  const { user, needsProfileCompletion, loading } = useAuth();
  
  if (loading) return <div className="min-h-screen bg-surface-primary text-text-primary flex items-center justify-center">Cargando...</div>;
  
  if (!user) return <Navigate to="/login" />;
  
  // If user hasn't confirmed their display name, redirect to complete profile
  if (needsProfileCompletion) return <Navigate to="/complete-profile" />;
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/complete-profile" element={
          <PrivateRoute>
            <CompleteProfilePage />
          </PrivateRoute>
        } />
        <Route path="/" element={
          <RequireProfileRoute>
            <DashboardPage />
          </RequireProfileRoute>
        } />
        <Route path="/focus" element={
          <RequireProfileRoute>
             <MyFocusPage />
          </RequireProfileRoute>
        } />
        <Route path="/settings" element={
          <RequireProfileRoute>
            <SettingsPage />
          </RequireProfileRoute>
        } />
        <Route path="/archive" element={
          <RequireProfileRoute>
            <ArchivedPage />
          </RequireProfileRoute>
        } />
        <Route path="/projects/:id" element={
          <RequireProfileRoute>
            <ProjectDetailsPage />
          </RequireProfileRoute>
        } />
      </Routes>
    </AuthProvider>
  );
}

export default App;

