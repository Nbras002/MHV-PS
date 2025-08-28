/*
  # Update Activity Logs Table

  1. Changes
    - Remove user_agent column from activity_logs table
    - This will clean up the table structure and remove the user agent tracking

  2. Security
    - No changes to RLS policies needed
*/

-- Remove user_agent column from activity_logs table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'activity_logs' AND column_name = 'user_agent'
  ) THEN
    ALTER TABLE activity_logs DROP COLUMN user_agent;
  END IF;
END $$;