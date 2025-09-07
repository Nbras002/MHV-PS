import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { authAPI, usersAPI } from '../services/api';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (userData: Omit<User, 'id' | 'createdAt' | 'role'>) => Promise<boolean>;
  resetPassword: (username: string, oldPassword: string, newPassword: string) => Promise<boolean>;
  updateUser: (userId: string, updates: Partial<User>) => void;
  users: User[];
  addUser: (userData: Omit<User, 'id' | 'createdAt'>) => void;
  deleteUser: (userId: string) => void;
  fetchUsers: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          const response = await authAPI.getCurrentUser();
          setUser(response.data.user);
        } catch (error: any) {
          console.error('Failed to get current user:', error);
          // If token is invalid, clear it
          if (error.response?.status === 401 || error.response?.status === 403) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentUser');
          }
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await usersAPI.getAll();
      setUsers(response.data.users);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      console.log('🔐 AuthContext: Starting login process');
      const response = await authAPI.login({ username, password });
      const { token, user: userData } = response.data;
      
      console.log('✅ AuthContext: Login API call successful', {
        hasToken: !!token,
        userId: userData?.id,
        username: userData?.username
      });

      localStorage.setItem('authToken', token);
      localStorage.setItem('currentUser', JSON.stringify(userData));
      setUser(userData);
      
      // Fetch users if admin
      if (userData.role === 'admin') {
        console.log('👑 AuthContext: User is admin, fetching users');
        await fetchUsers();
      }
      
      return true;
    } catch (error) {
      console.error('❌ AuthContext: Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
      setUser(null);
      setUsers([]);
      // Redirect to home page
      window.location.href = '/';
    }
  };

  const register = async (userData: Omit<User, 'id' | 'createdAt' | 'role'>): Promise<boolean> => {
    try {
      await authAPI.register(userData);
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  };

  const resetPassword = async (username: string, oldPassword: string, newPassword: string): Promise<boolean> => {
    try {
      await authAPI.resetPassword({ username, oldPassword, newPassword });
      return true;
    } catch (error) {
      console.error('Password reset error:', error);
      return false;
    }
  };

  const updateUser = async (userId: string, updates: Partial<User>) => {
    try {
      const response = await usersAPI.update(userId, updates);
      const updatedUser = response.data.user;
      
      setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
      
      if (user && user.id === userId) {
        setUser(updatedUser);
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  };

  const addUser = async (userData: Omit<User, 'id' | 'createdAt'>) => {
    try {
      const response = await usersAPI.create(userData);
      const newUser = response.data.user;
      setUsers(prev => [...prev, newUser]);
    } catch (error) {
      console.error('Add user error:', error);
      throw error;
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      await usersAPI.delete(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (error) {
      console.error('Delete user error:', error);
      throw error;
    }
  };

  // Fetch users when user becomes admin
  useEffect(() => {
    if (user?.role === 'admin' && users.length === 0) {
      fetchUsers();
    }
  }, [user?.role]);

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      register,
      resetPassword,
      updateUser,
      users,
      addUser,
      deleteUser,
      fetchUsers,
      loading
    }}>
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