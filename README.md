# Materials and Heavy Vehicles Permit System

A comprehensive permit management system built with React, Node.js, and PostgreSQL.

## 🚀 Deployment Guide for Render.com

### Prerequisites
1. Supabase account and project
2. Render.com account
3. GitHub repository

### Step 1: Database Setup (Supabase)
1. Create a new project on [Supabase](https://supabase.com)
2. Go to SQL Editor and run file: `supabase/migrations/polished_summit.sql`
3. Ensure RLS (Row Level Security) is enabled on all tables
4. Verify the default admin user is created with username: `admin` and password: `Admin123!`
3. Note down your:
   - Project URL
   - Anon Key
   - Service Role Key

### Step 2: Backend Deployment
1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set the following:
   - **Root Directory**: `server`
   - **Build Command**: `npm install; npm run build`
   - **Start Command**: `npm run start`
   - **Node Version**: 18 or higher

4. Add Environment Variables:
   ```
   NODE_ENV=production
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   JWT_SECRET=your_very_long_random_secret_key
   JWT_EXPIRES_IN=1h
   FRONTEND_URL=https://your-frontend-app.onrender.com
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   ```

### Step 3: Frontend Deployment
1. Create another Web Service on Render
2. Connect the same GitHub repository
3. Set the following:
   - **Root Directory**: `.` (root)
   - **Build Command**: `npm install; npm run build`
   - **Publish Directory**: `dist`
   - **Node Version**: 18 or higher

4. Add Environment Variables:
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_API_URL=https://your-backend-app.onrender.com/api
   ```

### Step 4: Update CORS Settings
After both services are deployed, update the backend's `FRONTEND_URL` environment variable with your actual frontend URL.

### Step 5: Database Security
1. Ensure the admin user has full privileges by running the migration
2. Verify RLS policies are working correctly
3. Test user authentication and permissions

### Step 6: Testing
1. Test the login with admin credentials: `admin` / `Admin123!`
2. Verify all CRUD operations work correctly
3. Test role-based permissions
4. Verify data persistence in Supabase

## 🔧 Local Development

### Frontend
```bash
npm install
npm run dev
```

### Backend
```bash
cd server
npm install
npm run dev
```

## 📝 Environment Variables

### Frontend (.env)
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:10000/api
```

### Backend (server/.env)
```
NODE_ENV=development
PORT=10000
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h
FRONTEND_URL=http://localhost:5173
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🛠️ Troubleshooting

### Common Issues:
1. **CORS Errors**: Ensure `FRONTEND_URL` in backend matches your frontend URL
2. **Database Connection**: Verify Supabase credentials and run migrations
3. **Build Failures**: Check Node.js version (use 18+)
4. **Environment Variables**: Ensure all required variables are set
5. **Authentication Issues**: Verify JWT_SECRET is set and consistent
6. **Permission Errors**: Check RLS policies and user roles in Supabase

### Logs:
- Check Render logs for detailed error messages
- Frontend logs available in browser console
- Backend logs available in Render dashboard
- Database logs available in Supabase dashboard

## 🔐 Default Admin Account
- Username: `admin`
- Password: `Admin123!`
- Email: `admin@example.com`

## 🗄️ Database Schema
The system uses Supabase PostgreSQL with the following main tables:
- `users` - User accounts and roles
- `permits` - Permit records
- `activity_logs` - System activity tracking
- `role_permissions` - Role-based permissions

## 📱 Features
- Bilingual support (Arabic/English)
- Role-based access control
- Mobile-responsive design
- QR code scanning
- Real-time statistics
- Activity logging
- Vehicle plate validation (Saudi format)
- Data persistence with Supabase
- RESTful API architecture
- Auto-logout after 30 minutes of inactivity
- Comprehensive activity tracking with IP and user agent logging
- Enhanced user management with refresh functionality
