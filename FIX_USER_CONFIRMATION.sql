-- Fix User Confirmation Issue
-- Run this in Supabase SQL Editor
-- Replace 'your-email@example.com' with your actual email

-- Step 1: Check current status
SELECT 
  id,
  email,
  email_confirmed_at,
  confirmed_at,
  created_at
FROM auth.users
WHERE email = 'your-email@example.com';

-- Step 2: If email_confirmed_at is NULL, you need to confirm the user
-- This must be done via Supabase Dashboard (Authentication > Users > Confirm User)
-- OR if you have service_role access, you can run:

-- NOTE: This requires service_role key, usually done via Dashboard
-- UPDATE auth.users 
-- SET email_confirmed_at = NOW(),
--     confirmed_at = NOW()
-- WHERE email = 'your-email@example.com';

-- Step 3: Verify profile exists and is admin
SELECT 
  id,
  email,
  full_name,
  role
FROM profiles
WHERE email = 'your-email@example.com';

-- Step 4: If profile doesn't exist or role is wrong, fix it:
INSERT INTO profiles (id, email, full_name, role)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', 'Admin User'),
  'admin'
FROM auth.users
WHERE email = 'your-email@example.com'
ON CONFLICT (id) DO UPDATE
SET role = 'admin',
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name);

-- Step 5: Final verification - everything should be correct now
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at IS NOT NULL as is_confirmed,
  p.role,
  p.full_name
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE u.email = 'your-email@example.com';

