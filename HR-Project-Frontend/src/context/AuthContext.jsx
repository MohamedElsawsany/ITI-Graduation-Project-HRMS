// src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { getToken, getTokenPayload, removeTokens } from '../utils/token';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Function to extract user data from token
  const getUserFromToken = () => {
    const token = getToken();
    if (token) {
      const payload = getTokenPayload(token);
      if (payload) {
        return {
          id: payload.user_id,
          username: payload.username,
          email: payload.email,
          role: payload.role,
          employee_id: payload.employee_id
        };
      }
    }
    return null;
  };

  useEffect(() => {
    const userData = getUserFromToken();
    setUser(userData);
    setLoading(false);
  }, []);

  const login = (tokens, userData) => {
    // Instead of using the passed userData, get fresh data from the token
    // This ensures we get the latest token payload including employee_id
    const freshUserData = getUserFromToken();
    setUser(freshUserData);
  };

  const logout = () => {
    removeTokens();
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};