import React, { createContext, useState, useEffect } from 'react';
import API from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('freshfarm_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (token) {
        try {
          const res = await API.get('/auth/profile');
          setUser(res.data.user);
        } catch (err) {
          console.error('Session expired or invalid token:', err);
          logout();
        }
      }
      setLoading(false);
    };
    fetchUserProfile();
  }, [token]);

  const login = (userData, userToken) => {
    localStorage.setItem('freshfarm_token', userToken);
    localStorage.setItem('freshfarm_user', JSON.stringify(userData));
    setToken(userToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('freshfarm_token');
    localStorage.removeItem('freshfarm_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
