-- Fix RLS Policy: Allow clients to see their data via client_id OR store assignments
-- Run this in your Supabase SQL Editor

-- Drop the old policy
DROP POLICY IF EXISTS "Clients can view detections for their stores" ON detections;

-- Create new policy that checks BOTH client_id directly AND store assignments
CREATE POLICY "Clients can view detections for their stores"
  ON detections FOR SELECT
  USING (
    -- Method 1: Direct client_id match (for sensors that tag data with client_id)
    client_id = auth.uid() 
    OR
    -- Method 2: Store assignment match (for location-based access)
    EXISTS (
      SELECT 1 FROM client_stores cs
      JOIN stores s ON s.id = cs.store_id
      WHERE cs.client_id = auth.uid() AND s.location = detections.location
    )
    OR
    -- Method 3: Admin can see everything
    public.is_admin(auth.uid())
  );

-- Verify the policy was created
SELECT * FROM pg_policies WHERE tablename = 'detections' AND policyname = 'Clients can view detections for their stores';

