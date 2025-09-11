/*
  # Complete Database Policies for Heavy Materials and Vehicles Permit System

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `username` (text, unique)
      - `password` (text, hashed with bcrypt)
      - `email` (text, unique)
      - `first_name` (text)
      - `last_name` (text)
      - `region` (text array)
      - `role` (text)
      - `permissions` (jsonb)
      - `created_at` (timestamp)
      - `last_login` (timestamp)
    
    - `permits`
      - `id` (uuid, primary key)
      - `permit_number` (text, unique)
      - `date` (date)
      - `region` (text)
      - `location` (text)
      - `carrier_name` (text)
      - `carrier_id` (text)
      - `request_type` (text)
      - `vehicle_plate` (text)
      - `materials` (jsonb)
      - `closed_by` (uuid, foreign key)
      - `closed_at` (timestamp)
      - `closed_by_name` (text)
      - `can_reopen` (boolean)
      - `created_by` (uuid, foreign key)
      - `created_at` (timestamp)
    
    - `activity_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `name` (text)
      - `username` (text)
      - `action` (text)
      - `details` (text)
      - `timestamp` (timestamp)
      - `ip` (text)
      - `user_agent` (text)
    
    - `role_permissions`
      - `id` (uuid, primary key)
      - `role` (text, unique)
      - `permissions` (jsonb)
      - `updated_at` (timestamp)

    - `regions`
      - `id` (uuid, primary key)
      - `code` (text, unique)
      - `name_en` (text)
      - `name_ar` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add comprehensive policies for all operations
    - Ensure proper role-based access control

  3. Performance
    - Add indexes for frequently queried columns
    - Optimize foreign key relationships
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS permits CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS regions CASCADE;

-- Create role_permissions table first (referenced by users)
CREATE TABLE role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text UNIQUE NOT NULL,
  permissions jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Create regions table
CREATE TABLE regions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name_en text NOT NULL,
  name_ar text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create users table
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password text NOT NULL,
  email text UNIQUE NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  region text[] NOT NULL DEFAULT ARRAY['headquarters'],
  role text NOT NULL DEFAULT 'observer' REFERENCES role_permissions(role),
  permissions jsonb,
  created_at timestamptz DEFAULT now(),
  last_login timestamptz
);

-- Create permits table
CREATE TABLE permits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  permit_number text UNIQUE NOT NULL,
  date date NOT NULL,
  region text NOT NULL,
  location text NOT NULL,
  carrier_name text NOT NULL,
  carrier_id text NOT NULL,
  request_type text NOT NULL,
  vehicle_plate text NOT NULL,
  materials jsonb NOT NULL DEFAULT '[]',
  closed_by uuid REFERENCES users(id),
  closed_at timestamptz,
  closed_by_name text,
  can_reopen boolean DEFAULT true,
  created_by uuid REFERENCES users(id) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create activity_logs table
CREATE TABLE activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  name text NOT NULL,
  username text NOT NULL,
  action text NOT NULL,
  details text NOT NULL,
  timestamp timestamptz DEFAULT now(),
  ip text,
  user_agent text
);

-- Create indexes for better performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_permits_permit_number ON permits(permit_number);
CREATE INDEX idx_permits_region ON permits(region);
CREATE INDEX idx_permits_date ON permits(date);
CREATE INDEX idx_permits_created_by ON permits(created_by);
CREATE INDEX idx_permits_closed_by ON permits(closed_by);
CREATE INDEX idx_permits_created_at ON permits(created_at);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);
CREATE INDEX idx_activity_logs_timestamp ON activity_logs(timestamp);
CREATE INDEX idx_role_permissions_role ON role_permissions(role);
CREATE INDEX idx_regions_code ON regions(code);

-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE permits ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;
DROP POLICY IF EXISTS "Users can view permits in their regions" ON permits;
DROP POLICY IF EXISTS "Users can create permits" ON permits;
DROP POLICY IF EXISTS "Users can update permits" ON permits;
DROP POLICY IF EXISTS "Admins can delete permits" ON permits;
DROP POLICY IF EXISTS "Users can view activity logs based on role" ON activity_logs;
DROP POLICY IF EXISTS "Users can create activity logs" ON activity_logs;
DROP POLICY IF EXISTS "Users can view role permissions" ON role_permissions;
DROP POLICY IF EXISTS "Admins can manage role permissions" ON role_permissions;
DROP POLICY IF EXISTS "All users can read regions" ON regions;

-- Policies for users table
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all users"
  ON users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can create users"
  ON users
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update users"
  ON users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete users"
  ON users
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
    AND users.id != auth.uid() -- Cannot delete self
  );

-- Policies for permits table
CREATE POLICY "Users can view permits in their regions"
  ON permits
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND (
        region @> ARRAY[permits.region] 
        OR role IN ('admin', 'manager')
      )
    )
  );

CREATE POLICY "Managers and admins can create permits"
  ON permits
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager')
      AND (
        region @> ARRAY[permits.region]
        OR role = 'admin'
      )
    )
  );

CREATE POLICY "Managers and admins can update permits"
  ON permits
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager')
      AND (
        region @> ARRAY[permits.region]
        OR role = 'admin'
      )
    )
    AND permits.closed_at IS NULL -- Cannot edit closed permits
  );

CREATE POLICY "Admins can delete permits"
  ON permits
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policies for activity_logs table
CREATE POLICY "Users can view activity logs based on role"
  ON activity_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager', 'security_officer')
    )
  );

CREATE POLICY "All authenticated users can create activity logs"
  ON activity_logs
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Policies for role_permissions table
CREATE POLICY "All authenticated users can view role permissions"
  ON role_permissions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage role permissions"
  ON role_permissions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policies for regions table
CREATE POLICY "All authenticated users can read regions"
  ON regions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()
    )
  );

-- Insert default role permissions
INSERT INTO role_permissions (role, permissions) VALUES
('admin', '{
  "canCreatePermits": true,
  "canEditPermits": true,
  "canDeletePermits": true,
  "canClosePermits": true,
  "canReopenPermits": true,
  "canViewPermits": true,
  "canExportPermits": true,
  "canManageUsers": true,
  "canViewStatistics": true,
  "canViewActivityLog": true,
  "canManagePermissions": true,
  "canReopenAnyPermit": true
}'),
('manager', '{
  "canCreatePermits": true,
  "canEditPermits": true,
  "canDeletePermits": false,
  "canClosePermits": true,
  "canReopenPermits": true,
  "canViewPermits": true,
  "canExportPermits": true,
  "canManageUsers": false,
  "canViewStatistics": true,
  "canViewActivityLog": true,
  "canManagePermissions": false,
  "canReopenAnyPermit": true
}'),
('security_officer', '{
  "canCreatePermits": false,
  "canEditPermits": false,
  "canDeletePermits": false,
  "canClosePermits": true,
  "canReopenPermits": true,
  "canViewPermits": true,
  "canExportPermits": false,
  "canManageUsers": false,
  "canViewStatistics": false,
  "canViewActivityLog": true,
  "canManagePermissions": false,
  "canReopenAnyPermit": false
}'),
('observer', '{
  "canCreatePermits": false,
  "canEditPermits": false,
  "canDeletePermits": false,
  "canClosePermits": false,
  "canReopenPermits": false,
  "canViewPermits": true,
  "canExportPermits": false,
  "canManageUsers": false,
  "canViewStatistics": false,
  "canViewActivityLog": false,
  "canManagePermissions": false,
  "canReopenAnyPermit": false
}')
ON CONFLICT (role) DO UPDATE SET
  permissions = EXCLUDED.permissions,
  updated_at = now();

-- Insert valid regions
INSERT INTO regions (code, name_en, name_ar) VALUES
('headquarters', 'Headquarters', 'المقر الرئيسي'),
('riyadh', 'Riyadh', 'الرياض'),
('qassim', 'Al-Qassim', 'القصيم'),
('hail', 'Hail', 'حائل'),
('dammam', 'Dammam', 'الدمام'),
('ahsa', 'Al-Ahsa', 'الأحساء'),
('jubail', 'Jubail', 'الجبيل'),
('jouf', 'Al-Jouf', 'الجوف'),
('northern_borders', 'Northern Borders', 'الحدود الشمالية'),
('jeddah', 'Jeddah', 'جدة'),
('makkah', 'Makkah', 'مكة'),
('medina', 'Medina', 'المدينة'),
('tabuk', 'Tabuk', 'تبوك'),
('yanbu', 'Yanbu', 'ينبع'),
('asir', 'Asir', 'عسير'),
('taif', 'Taif', 'الطائف'),
('baha', 'Al-Baha', 'الباحة'),
('jizan', 'Jizan', 'جازان'),
('najran', 'Najran', 'نجران')
ON CONFLICT (code) DO NOTHING;

-- Create function to validate region codes
CREATE OR REPLACE FUNCTION validate_region_code(region_code text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM regions WHERE code = region_code);
END;
$$ LANGUAGE plpgsql;

-- Create function to validate all regions in users table
CREATE OR REPLACE FUNCTION validate_user_regions(regions text[])
RETURNS boolean AS $$
DECLARE
  region_code text;
BEGIN
  FOREACH region_code IN ARRAY regions
  LOOP
    IF NOT validate_region_code(region_code) THEN
      RETURN false;
    END IF;
  END LOOP;
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Add check constraints
ALTER TABLE permits 
ADD CONSTRAINT permits_region_check 
CHECK (validate_region_code(region));

ALTER TABLE users 
ADD CONSTRAINT users_regions_check 
CHECK (validate_user_regions(region));

-- Add check constraints for valid values
ALTER TABLE permits 
ADD CONSTRAINT permits_request_type_check 
CHECK (request_type IN (
  'material_entrance', 
  'material_exit', 
  'heavy_vehicle_entrance_exit',
  'heavy_vehicle_entrance', 
  'heavy_vehicle_exit'
));

ALTER TABLE users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('admin', 'manager', 'security_officer', 'observer'));

-- Insert default admin user with properly hashed password
-- Password: Admin123! (hashed with bcrypt)
INSERT INTO users (
  username, 
  password, 
  email, 
  first_name, 
  last_name, 
  region, 
  role
) VALUES (
  'admin',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO.G', -- Admin123!
  'admin@example.com',
  'System',
  'Administrator',
  ARRAY[
    'headquarters','riyadh','dammam','hail','jubail','jeddah','tabuk','taif','baha','yanbu',
    'makkah','jouf','qassim','ahsa','northern_borders','medina','asir','jizan','najran'
  ],
  'admin'
) ON CONFLICT (username) DO UPDATE SET
  password = EXCLUDED.password,
  email = EXCLUDED.email,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  region = EXCLUDED.region,
  role = EXCLUDED.role;

-- Create function to automatically update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for role_permissions table
CREATE TRIGGER update_role_permissions_updated_at
  BEFORE UPDATE ON role_permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to log user activities automatically
CREATE OR REPLACE FUNCTION log_user_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- This function can be extended to automatically log certain activities
  -- For now, we'll rely on application-level logging
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions (if using specific roles)
-- GRANT USAGE ON SCHEMA public TO authenticated;
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
-- GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Create view for user statistics (optional)
CREATE OR REPLACE VIEW user_statistics AS
SELECT 
  role,
  COUNT(*) as user_count,
  COUNT(CASE WHEN last_login IS NOT NULL THEN 1 END) as active_users,
  MAX(last_login) as last_activity
FROM users 
GROUP BY role;

-- Create view for permit statistics (optional)
CREATE OR REPLACE VIEW permit_statistics AS
SELECT 
  region,
  request_type,
  COUNT(*) as total_permits,
  COUNT(CASE WHEN closed_at IS NULL THEN 1 END) as active_permits,
  COUNT(CASE WHEN closed_at IS NOT NULL THEN 1 END) as closed_permits
FROM permits 
GROUP BY region, request_type;

-- Final verification queries (commented out for production)
-- SELECT 'Users table created' as status, COUNT(*) as count FROM users;
-- SELECT 'Permits table created' as status, COUNT(*) as count FROM permits;
-- SELECT 'Activity logs table created' as status, COUNT(*) as count FROM activity_logs;
-- SELECT 'Role permissions table created' as status, COUNT(*) as count FROM role_permissions;
-- SELECT 'Regions table created' as status, COUNT(*) as count FROM regions;