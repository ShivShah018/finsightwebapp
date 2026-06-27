import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import { apiClient } from '../api/apiClient';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUserCurrency: (currency: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('finsight_token');
      const storedUser = localStorage.getItem('finsight_user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        
        // Optionally verify user token integrity against /auth/me
        try {
          const res = await apiClient.get('/auth/me');
          setUser({
            user_id: res.data.user_id,
            name: res.data.name,
            email: res.data.email,
            currency: res.data.currency,
          });
          localStorage.setItem('finsight_user', JSON.stringify({
            user_id: res.data.user_id,
            name: res.data.name,
            email: res.data.email,
            currency: res.data.currency,
          }));
        } catch (err) {
          console.error('Failed to verify token on startup', err);
          logout();
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string, _rememberMe: boolean = false) => {
    setIsLoading(true);
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      const { access_token, user_id, name, email: userEmail } = response.data;

      const profileRes = await apiClient.get('/auth/me', {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      const loggedUser: User = {
        user_id,
        name,
        email: userEmail,
        currency: profileRes.data.currency || 'INR',
      };

      setToken(access_token);
      setUser(loggedUser);

      localStorage.setItem('finsight_token', access_token);
      localStorage.setItem('finsight_user', JSON.stringify(loggedUser));
      
      toast.success(`Welcome back, ${name}!`);
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || 'Invalid email or password.';
      toast.error(errorMsg);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await apiClient.post('/auth/register', {
        full_name: name,
        email,
        password,
      });
      const { access_token, user_id, name: registeredName, email: userEmail } = response.data;

      const loggedUser: User = {
        user_id,
        name: registeredName,
        email: userEmail,
        currency: 'INR', // Default preference
      };

      setToken(access_token);
      setUser(loggedUser);

      localStorage.setItem('finsight_token', access_token);
      localStorage.setItem('finsight_user', JSON.stringify(loggedUser));

      toast.success('Registration successful!');
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || 'Registration failed. Try a different email.';
      toast.error(errorMsg);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('finsight_token');
    localStorage.removeItem('finsight_user');
    toast.success('Logged out successfully.');
  };

  const updateUserCurrency = (currency: string) => {
    if (user) {
      const updated = { ...user, currency };
      setUser(updated);
      localStorage.setItem('finsight_user', JSON.stringify(updated));
    }
  };

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
        updateUserCurrency,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
