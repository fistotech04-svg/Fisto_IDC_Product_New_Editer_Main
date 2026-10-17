import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * PublicRoute prevents authenticated users from visiting guest-only pages
 * such as Signin (/) and Signup (/signup). If they are already logged in,
 * they stay logged in and are automatically redirected to /home.
 */
const PublicRoute = ({ children }) => {
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user && user.isLoggedIn) {
        return <Navigate to="/home" replace />;
      }
    }
  } catch (e) {
    console.error('Error reading auth state in PublicRoute:', e);
  }

  return children;
};

export default PublicRoute;
