import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, role }) {
  const { user, token, loading } = useAuth();

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (role && user?.role !== role) {
    // Redirect to their allowed page if role mismatch
    // If user is null but token exists (rare edge case of fetch failure), might want to redirect to login or wait.
    // Assuming user is populated if token is valid due to AuthContext logic.
    if (user) {
      if (user.role === 'SUPER_ADMIN') return <Navigate to="/admin" replace />;
      if (user.role === 'MSME') return <Navigate to="/msme" replace />;
      if (user.role === 'DRIVER') return <Navigate to="/driver" replace />;
    }
  }

  return children;
}
