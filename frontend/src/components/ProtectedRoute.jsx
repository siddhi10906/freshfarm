import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <LoadingSpinner message="Verifying session..." />;
  }

  if (!user) {
    return <Navigate to="/login/customer" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    alert('Access Denied. You do not have permission for this portal.');
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
