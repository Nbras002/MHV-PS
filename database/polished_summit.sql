/*
  # Initial Schema for Heavy Materials and Vehicles Permit System

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `username` (text, unique)
      - `password` (text)
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
      - `user_name` (text)
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

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users based on roles
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password text NOT NULL,
  email text UNIQUE NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  region text[] NOT NULL DEFAULT ARRAY['headquarters'],
  role text NOT NULL DEFAULT 'observer',
  permissions jsonb,
  created_at timestamptz DEFAULT now(),
  last_login timestamptz
);

-- Create permits table
CREATE TABLE IF NOT EXISTS permits (
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
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  user_name text NOT NULL,
  action text NOT NULL,
  details text NOT NULL,
  timestamp timestamptz DEFAULT now(),
  ip text,
  user_agent text
);

-- Create role_permissions table
CREATE TABLE IF NOT EXISTS role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text UNIQUE NOT NULL,
  permissions jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE permits ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can manage all users"
  ON users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Permits policies
CREATE POLICY "Users can view permits in their regions"
  ON permits
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND (region @> ARRAY[permits.region] OR role IN ('admin', 'manager'))
    )
  );

CREATE POLICY "Users can create permits"
  ON permits
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager')
      AND region @> ARRAY[permits.region]
    )
  );

CREATE POLICY "Users can update permits"
  ON permits
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager')
      AND region @> ARRAY[permits.region]
    )
  );

CREATE POLICY "Admins can delete permits"
  ON permits
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Activity logs policies
CREATE POLICY "Users can view activity logs based on role"
  ON activity_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager', 'security_officer')
    )
  );

CREATE POLICY "Users can create activity logs"
  ON activity_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Role permissions policies
CREATE POLICY "Users can view role permissions"
  ON role_permissions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage role permissions"
  ON role_permissions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Insert default admin user
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
  'Admin123!',
  'admin@example.com',
  'System',
  'Administrator',
  ARRAY['headquarters','riyadh','dammam','hail','jubail','jeddah','tabuk','taif','baha','yanbu','makkah','jouf','qassim','ahsa','northern_borders','medina','asir','jizan','najran'],
  'admin'
) ON CONFLICT (username) DO NOTHING;

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
ON CONFLICT (role) DO NOTHING;