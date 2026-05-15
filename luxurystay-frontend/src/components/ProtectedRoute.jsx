import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Wraps a route that requires authentication.
 * Optionally restricts to specific roles via the `roles` prop.
 *
 * @param {string[]} [roles] - Allowed roles. Omit to allow any authenticated user.
 */
export default function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  function getDefaultRoute(role) {
    if (role === 'guest') return '/guest';
    if (role === 'housekeeping') return '/housekeeping';
    if (role === 'maintenance') return '/maintenance';
    return '/dashboard';
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to={getDefaultRoute(user.role)} replace />;
  }

  return children;
}
