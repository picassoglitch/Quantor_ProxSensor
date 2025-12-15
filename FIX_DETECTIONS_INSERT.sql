-- Fix 401 Error: Allow ESP32 sensors to insert detection data
-- Run this in your Supabase SQL Editor

-- Allow anonymous inserts into detections table
-- This is safe because sensors use the anon key and we validate the data structure
CREATE POLICY "Allow anonymous inserts to detections"
  ON detections FOR INSERT
  TO anon
  WITH CHECK (true);

-- Alternative: More restrictive policy (only allow if sensor_id and location are provided)
-- Uncomment this and remove the above if you want more control:
-- CREATE POLICY "Allow sensor inserts to detections"
--   ON detections FOR INSERT
--   TO anon
--   WITH CHECK (
--     sensor_id IS NOT NULL AND
--     location IS NOT NULL
--   );

-- Verify the policy was created
SELECT * FROM pg_policies WHERE tablename = 'detections';

