/*
  # Add user_agent column to activity_logs table

  1. Changes
    - Add `user_agent` column to `activity_logs` table to store browser and OS information
    - Set default value to 'unknown' for existing records
    - Update existing records to have a default user_agent value

  2. Security
    - No changes to RLS policies needed
*/

-- Add user_agent column to activity_logs table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'activity_logs' AND column_name = 'user_agent'
  ) THEN
    ALTER TABLE activity_logs ADD COLUMN user_agent text DEFAULT 'unknown';
  END IF;
END $$;

-- Update existing records to have a default user_agent value
UPDATE activity_logs 
SET user_agent = 'unknown' 
WHERE user_agent IS NULL;