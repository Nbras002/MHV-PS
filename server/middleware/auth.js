import jwt from 'jsonwebtoken';
import { supabase } from '../config/database.js';

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  // Get real IP address
  const getClientIP = (req) => {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
           req.headers['x-real-ip'] ||
           req.headers['cf-connecting-ip'] ||
           req.connection.remoteAddress ||
           req.socket.remoteAddress ||
           req.connection?.socket?.remoteAddress ||
           req.ip ||
           'unknown';
  };
  
  // Get user agent
  const getUserAgent = (req) => {
    return req.headers['user-agent'] || req.get('User-Agent') || 'unknown';
  };
  
  // Store IP and user agent for later use
  req.clientIP = getClientIP(req);
  req.userAgent = getUserAgent(req);

  console.log('🔐 Auth middleware - Token present:', !!token);
  console.log('🔐 Auth middleware - Path:', req.path);
  console.log('🔐 Auth middleware - Method:', req.method);
  if (!token) {
    console.log('❌ No token provided');
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token decoded successfully for user:', decoded.userId);
    
    // Fetch user from database to ensure they still exist and get latest data
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.userId)
      .single();

    if (error || !user) {
      console.log('❌ User not found in database:', error?.message);
      return res.status(401).json({ error: 'Invalid token or user not found' });
    }

    console.log('✅ User authenticated:', user.username);
    req.user = user;
    next();
  } catch (error) {
    console.error('❌ Token verification error:', error.message);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

export const requirePermission = (permission) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    try {
      // Get role permissions from database
      const { data: rolePermissions, error } = await supabase
        .from('role_permissions')
        .select('permissions')
        .eq('role', req.user.role)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.log('No custom permissions found, using defaults');
      }

      // Use default permissions if no custom permissions found
      const defaultPermissions = {
        admin: {
          canCreatePermits: true,
          canEditPermits: true,
          canDeletePermits: true,
          canClosePermits: true,
          canReopenPermits: true,
          canViewPermits: true,
          canExportPermits: true,
          canManageUsers: true,
          canViewStatistics: true,
          canViewActivityLog: true,
          canManagePermissions: true,
          canReopenAnyPermit: true,
        },
        manager: {
          canCreatePermits: true,
          canEditPermits: true,
          canDeletePermits: false,
          canClosePermits: true,
          canReopenPermits: true,
          canViewPermits: true,
          canExportPermits: true,
          canManageUsers: false,
          canViewStatistics: true,
          canViewActivityLog: true,
          canManagePermissions: false,
          canReopenAnyPermit: true,
        },
        security_officer: {
          canCreatePermits: false,
          canEditPermits: false,
          canDeletePermits: false,
          canClosePermits: true,
          canReopenPermits: true,
          canViewPermits: true,
          canExportPermits: false,
          canManageUsers: false,
          canViewStatistics: false,
          canViewActivityLog: true,
          canManagePermissions: false,
          canReopenAnyPermit: false,
        },
        observer: {
          canCreatePermits: false,
          canEditPermits: false,
          canDeletePermits: false,
          canClosePermits: false,
          canReopenPermits: false,
          canViewPermits: true,
          canExportPermits: false,
          canManageUsers: false,
          canViewStatistics: false,
          canViewActivityLog: false,
          canManagePermissions: false,
          canReopenAnyPermit: false,
        },
      };

      const permissions = rolePermissions?.permissions || defaultPermissions[req.user.role] || {};
      
      if (!permissions[permission]) {
        return res.status(403).json({ error: 'Permission denied' });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({ error: 'Permission check failed' });
    }
  };
};