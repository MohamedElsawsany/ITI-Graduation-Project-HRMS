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

  useEffect(() => {
    const token = getToken();
    if (token) {
      const payload = getTokenPayload(token);
      if (payload) {
        setUser({
          id: payload.user_id,
          username: payload.username,
          email: payload.email,
          role: payload.role
        });
      }
    }
    setLoading(false);
  }, []);

  const login = (tokens, userData) => {
    setUser(userData);
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