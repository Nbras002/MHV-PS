/*
  # Update activity_logs table schema

  1. Changes
    - Rename `user_name` column to `name`
    - Add `username` column to store the username separately
    - Update existing data to populate the new columns

  2. Security
    - No changes to RLS policies needed as column names don't affect security
*/

-- Add username column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'activity_logs' AND column_name = 'username'
  ) THEN
    ALTER TABLE activity_logs ADD COLUMN username text;
  END IF;
END $$;

-- Rename user_name to name
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'activity_logs' AND column_name = 'user_name'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'activity_logs' AND column_name = 'name'
  ) THEN
    ALTER TABLE activity_logs RENAME COLUMN user_name TO name;
  END IF;
END $$;

-- Update existing records to populate username from name field
-- Extract username from name field (format: "First Last [username]")
UPDATE activity_logs 
SET username = CASE 
  WHEN name ~ '\[.*\]$' THEN 
    regexp_replace(name, '.*\[(.*)\]$', '\1')
  ELSE 
    'unknown'
END
WHERE username IS NULL;