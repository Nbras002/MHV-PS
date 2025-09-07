import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { testConnection } from './config/database.js';

// Import routes
import authRoutes from './routes/auth.js';
import permitRoutes from './routes/permits.js';
import userRoutes from './routes/users.js';
import activityRoutes from './routes/activity.js';
import statisticsRoutes from './routes/statistics.js';

// Import middleware
import { errorHandler } from './middleware/errorHandler.js';
import { authenticateToken } from './middleware/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

// Test database connection on startup
testConnection();

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path}`, {
    body: req.method === 'POST' ? Object.keys(req.body || {}) : undefined,
    query: Object.keys(req.query || {}),
    headers: {
      'content-type': req.get('content-type'),
      'user-agent': req.get('user-agent')?.substring(0, 50)
    },
    ip: req.ip || req.connection.remoteAddress || req.socket.remoteAddress
  });
  next();
});

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: [
    process.env.FRONTEND_URL,
    'http://localhost:5173',
    'https://localhost:5173',
    /^https:\/\/.*\.onrender\.com$/,
    /\.render\.com$/,
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});
app.use(limiter);

// Logging
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'MHV Permit System API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      permits: '/api/permits',
      users: '/api/users',
      activity: '/api/activity',
      statistics: '/api/statistics'
    }
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/permits', authenticateToken, permitRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/activity', authenticateToken, activityRoutes);
app.use('/api/statistics', authenticateToken, statisticsRoutes);

// Legacy routes without /api prefix for backward compatibility
app.use('/auth', authRoutes);
app.use('/permits', authenticateToken, permitRoutes);
app.use('/users', authenticateToken, userRoutes);
app.use('/activity', authenticateToken, activityRoutes);
app.use('/statistics', authenticateToken, statisticsRoutes);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('dist'));
  
  // Handle client-side routing - serve index.html for all non-API routes
  app.get('*', (req, res) => {
    // Don't serve index.html for API routes
    if (req.path.startsWith('/api/') || req.path.startsWith('/health')) {
      return res.status(404).json({
        error: 'API route not found',
        path: req.originalUrl,
        method: req.method
      });
    }
    
    res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
  });
} else {
  // 404 handler for development
  app.use('*', (req, res) => {
    res.status(404).json({
      error: 'Route not found',
      path: req.originalUrl,
      method: req.method,
      availableRoutes: [
        '/health',
        '/api/auth/login',
        '/api/permits',
        '/api/users',
        '/api/activity',
        '/api/statistics'
      ]
    });
  });
}

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'Not specified'}`);
  console.log(`🗄️ Database: ${process.env.SUPABASE_URL ? 'Connected' : 'Not configured'}`);
});

export default app;