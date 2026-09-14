import { createContext, useContext, useEffect, useState } from 'react';
import { getCurrentUser, login as loginRequest, logout as logoutRequest, register as registerRequest } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentUser()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const authenticate = async (action, payload) => {
    const result = await action(payload);
    setUser(result.user);
    return result.user;
  };

  const logout = async () => {
    await logoutRequest();
    setUser(null);
  };

  return <AuthContext.Provider value={{
    user,
    loading,
    login: (payload) => authenticate(loginRequest, payload),
    register: (payload) => authenticate(registerRequest, payload),
    logout,
  }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider.');
  return context;
};

// Reusable boundary for future authenticated routes/views without adding a router library.
export const RequireAuth = ({ children, fallback = null }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : fallback;
};
