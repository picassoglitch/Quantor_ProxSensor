-- Create detections table if it doesn't exist
-- Run this in your Supabase SQL Editor

-- Create the detections table with the correct structure
CREATE TABLE IF NOT EXISTS detections (
  id BIGSERIAL PRIMARY KEY,
  sensor_id TEXT,
  location TEXT,
  wifi_rssi INTEGER,
  devices JSONB,  -- Changed from JSONB[] to JSONB (single JSON object/array)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  client_id UUID REFERENCES profiles(id) ON DELETE SET NULL  -- Optional: for client tagging
);

-- Enable RLS on detections table
ALTER TABLE detections ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (for ESP32 sensors)
CREATE POLICY "Allow anonymous inserts to detections"
  ON detections FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow clients to view their own detections (via location matching)
CREATE POLICY "Clients can view detections for their stores"
  ON detections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM client_stores cs
      JOIN stores s ON s.id = cs.store_id
      WHERE cs.client_id = auth.uid() AND s.location = detections.location
    ) OR public.is_admin(auth.uid())
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_detections_location ON detections(location);
CREATE INDEX IF NOT EXISTS idx_detections_created_at ON detections(created_at);
CREATE INDEX IF NOT EXISTS idx_detections_client_id ON detections(client_id);

-- Verify the table was created
SELECT 
  table_name, 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'detections'
ORDER BY ordinal_position;

-- Verify policies
SELECT * FROM pg_policies WHERE tablename = 'detections';

