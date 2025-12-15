-- Create sensor_errors table for error logging and monitoring
CREATE TABLE IF NOT EXISTS sensor_errors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sensor_id TEXT NOT NULL,
  location TEXT,
  error_type TEXT NOT NULL,
  message TEXT NOT NULL,
  error_code INTEGER DEFAULT 0,
  uptime_seconds INTEGER,
  client_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_sensor_errors_sensor_id ON sensor_errors(sensor_id);
CREATE INDEX IF NOT EXISTS idx_sensor_errors_created_at ON sensor_errors(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sensor_errors_client_id ON sensor_errors(client_id);

-- Enable RLS
ALTER TABLE sensor_errors ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Admins can see all errors
CREATE POLICY "Admins can view all sensor errors"
  ON sensor_errors FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Clients can see errors for their sensors
CREATE POLICY "Clients can view their sensor errors"
  ON sensor_errors FOR SELECT
  USING (
    client_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM client_stores cs
      JOIN stores s ON s.id = cs.store_id
      WHERE cs.client_id = auth.uid()
      AND s.location = sensor_errors.location
    )
  );

-- Sensors can insert errors (using anon key)
CREATE POLICY "Sensors can insert errors"
  ON sensor_errors FOR INSERT
  WITH CHECK (true);

-- Grant permissions
GRANT SELECT ON sensor_errors TO authenticated;
GRANT INSERT ON sensor_errors TO anon;

