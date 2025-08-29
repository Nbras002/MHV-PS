/*
  # Restore user_agent column to activity_logs table

  1. Changes
    - Add back user_agent column to activity_logs table
    - Update existing records to have null user_agent (since we removed it)

  2. Security
    - No changes to RLS policies needed
*/

-- Add user_agent column back to activity_logs table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'activity_logs' AND column_name = 'user_agent'
  ) THEN
    ALTER TABLE activity_logs ADD COLUMN user_agent text;
  END IF;
END $$;