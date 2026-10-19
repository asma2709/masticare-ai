import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    // Session is still being verified against /api/auth/me
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-[#183629]">
        <div className="w-10 h-10 border-3 border-[#244D38]/20 border-t-[#244D38] rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-stone-600">Verifying secure session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Preserve the intended destination so user is smoothly returned after login
    const returnUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?returnUrl=${returnUrl}`} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
