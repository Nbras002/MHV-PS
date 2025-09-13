import axios from 'axios';

// Determine API base URL based on environment
const getApiBaseUrl = () => {
  if (import.meta.env.DEV) {
    // Development: use proxy
    return '/api';
  } else {
    // Production: use environment variable or fallback to relative path
    return import.meta.env.VITE_API_URL || '/api';
  }
};

const API_BASE_URL = getApiBaseUrl();

console.log('🔗 Frontend: API Configuration:', {
  baseURL: API_BASE_URL,
  environment: import.meta.env.MODE,
  isDev: import.meta.env.DEV,
  apiUrl: import.meta.env.VITE_API_URL
});

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log('📤 Frontend: API Request:', {
    method: config.method?.toUpperCase(),
    url: config.url,
    baseURL: config.baseURL,
    fullURL: `${config.baseURL}${config.url}`,
    hasAuth: !!config.headers.Authorization
  });
  return config;
});

// Handle auth errors and network issues
api.interceptors.response.use(
  (response) => {
    console.log('📥 Frontend: API Response:', {
      status: response.status,
      url: response.config.url,
      method: response.config.method?.toUpperCase()
    });
    return response;
  },
  (error) => {
    console.error('❌ Frontend: API Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      baseURL: error.config?.baseURL,
      message: error.message,
      data: error.response?.data,
      fullURL: error.config ? `${error.config.baseURL}${error.config.url}` : 'unknown'
    });

    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
      window.location.href = '/';
    }
    
    // Handle network errors
    if (!error.response) {
      console.error('❌ Network error - Backend may be down:', {
        message: error.message,
        code: error.code,
        config: error.config
      });
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials: { username: string; password: string }) =>
    api.post('/auth/login', credentials),
  
  register: (userData: any) =>
    api.post('/auth/register', userData),
  
  resetPassword: (data: { username: string; oldPassword: string; newPassword: string }) =>
    api.post('/auth/reset-password', data),
  
  getCurrentUser: () =>
    api.get('/auth/me'),
  
  logout: () =>
    api.post('/auth/logout'),
};

// Permits API
export const permitsAPI = {
  getAll: (params?: any) =>
    api.get('/permits', { params }),
  
  getById: (id: string) =>
    api.get(`/permits/${id}`),
  
  create: (permitData: any) =>
    api.post('/permits', permitData),
  
  update: (id: string, permitData: any) =>
    api.put(`/permits/${id}`, permitData),
  
  close: (id: string) =>
    api.patch(`/permits/${id}/close`),
  
  reopen: (id: string) =>
    api.patch(`/permits/${id}/reopen`),
  
  delete: (id: string) =>
    api.delete(`/permits/${id}`),
};

// Users API
export const usersAPI = {
  getAll: () =>
    api.get('/users'),
  
  create: (userData: any) =>
    api.post('/users', userData),
  
  update: (id: string, userData: any) =>
    api.put(`/users/${id}`, userData),
  
  delete: (id: string) =>
    api.delete(`/users/${id}`),
  
  getRolePermissions: () =>
    api.get('/users/role-permissions'),
  
  updateRolePermissions: (role: string, permissions: any) =>
    api.put(`/users/role-permissions/${role}`, { permissions }),
};

// Activity API
export const activityAPI = {
  getAll: (params?: any) =>
    api.get('/activity', { params }),
  
  getActions: () =>
    api.get('/activity/actions'),
};

// Statistics API
export const statisticsAPI = {
  get: () =>
    api.get('/statistics'),
};

export default api;