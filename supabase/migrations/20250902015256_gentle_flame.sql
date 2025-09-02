/*
  # Create regions table and update foreign key constraints

  1. New Tables
    - `regions`
      - `id` (uuid, primary key)
      - `code` (text, unique)
      - `name_en` (text)
      - `name_ar` (text)
      - `created_at` (timestamp)

  2. Changes
    - Add foreign key constraints to users and permits tables
    - Add foreign key constraint between users.role and role_permissions.role
    - Populate regions table with all valid regions

  3. Security
    - Enable RLS on regions table
    - Add policies for reading regions data
*/

-- Create regions table
CREATE TABLE IF NOT EXISTS regions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name_en text NOT NULL,
  name_ar text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on regions table
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read regions
CREATE POLICY "All users can read regions"
  ON regions
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert all valid regions
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

-- Add foreign key constraint for role in users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'users_role_fkey'
  ) THEN
    ALTER TABLE users 
    ADD CONSTRAINT users_role_fkey 
    FOREIGN KEY (role) REFERENCES role_permissions(role);
  END IF;
END $$;

-- Create function to validate region codes
CREATE OR REPLACE FUNCTION validate_region_code(region_code text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM regions WHERE code = region_code);
END;
$$ LANGUAGE plpgsql;

-- Add check constraint for region in permits table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'permits_region_check'
  ) THEN
    ALTER TABLE permits 
    ADD CONSTRAINT permits_region_check 
    CHECK (validate_region_code(region));
  END IF;
END $$;

-- Add check constraint for regions array in users table
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

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'users_regions_check'
  ) THEN
    ALTER TABLE users 
    ADD CONSTRAINT users_regions_check 
    CHECK (validate_user_regions(region));
  END IF;
END $$;