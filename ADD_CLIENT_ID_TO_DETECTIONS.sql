-- Add client_id column to detections table
-- Run this in your Supabase SQL Editor

-- Check if column exists, if not add it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'detections' 
    AND column_name = 'client_id'
  ) THEN
    ALTER TABLE detections 
    ADD COLUMN client_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
    
    -- Create index for better query performance
    CREATE INDEX IF NOT EXISTS idx_detections_client_id ON detections(client_id);
    
    RAISE NOTICE 'Column client_id added to detections table';
  ELSE
    RAISE NOTICE 'Column client_id already exists';
  END IF;
END $$;

-- Verify the column was added
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'detections' 
AND column_name = 'client_id';

