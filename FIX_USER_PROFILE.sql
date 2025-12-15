-- Fix User Profile for picassoglitch@gmail.com
-- Run this in Supabase SQL Editor

-- Step 1: Verify user exists and is confirmed
SELECT 
  id,
  email,
  email_confirmed_at,
  confirmed_at,
  created_at
FROM auth.users
WHERE email = 'picassoglitch@gmail.com';

-- Expected: Should show email_confirmed_at and confirmed_at are NOT NULL

-- Step 2: Check if profile exists
SELECT 
  id,
  email,
  full_name,
  role,
  created_at
FROM profiles
WHERE email = 'picassoglitch@gmail.com' OR id = '706aa3a4-1297-440d-9e5b-2fd9c36d290d';

-- Step 3: Create or update profile to ensure it exists and is admin
INSERT INTO profiles (id, email, full_name, role)
VALUES (
  '706aa3a4-1297-440d-9e5b-2fd9c36d290d',
  'picassoglitch@gmail.com',
  'Admin User',
  'admin'
)
ON CONFLICT (id) DO UPDATE
SET 
  email = EXCLUDED.email,
  role = 'admin',
  full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
  updated_at = NOW();

-- Step 4: Verify everything is correct
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at IS NOT NULL as email_confirmed,
  u.confirmed_at IS NOT NULL as user_confirmed,
  p.id IS NOT NULL as profile_exists,
  p.role,
  p.full_name
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE u.email = 'picassoglitch@gmail.com';

-- Expected Result:
-- email_confirmed: true
-- user_confirmed: true
-- profile_exists: true
-- role: 'admin'

-- Step 5: If still having issues, check RLS policies
-- Verify RLS is working correctly
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'profiles';

