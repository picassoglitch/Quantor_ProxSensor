-- Script to verify and fix user authentication issues
-- Run this in Supabase SQL Editor

-- Step 1: Check if user exists in auth.users
SELECT 
  id, 
  email, 
  email_confirmed_at,
  confirmed_at,
  created_at
FROM auth.users 
WHERE email = 'your-email@example.com';  -- Replace with your email

-- Step 2: Check if profile exists
SELECT 
  id, 
  email, 
  full_name, 
  role,
  created_at
FROM profiles 
WHERE email = 'your-email@example.com';  -- Replace with your email

-- Step 3: If user exists but profile doesn't, create it:
INSERT INTO profiles (id, email, full_name, role)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'full_name', 'User') as full_name,
  COALESCE(raw_user_meta_data->>'role', 'client') as role
FROM auth.users
WHERE email = 'your-email@example.com'  -- Replace with your email
  AND id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO NOTHING;

-- Step 4: If user is not confirmed, manually confirm them (requires service_role):
-- This is usually done via Dashboard, but if needed:
-- UPDATE auth.users 
-- SET email_confirmed_at = NOW(), confirmed_at = NOW()
-- WHERE email = 'your-email@example.com';

-- Step 5: Verify everything is correct:
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at IS NOT NULL as is_confirmed,
  p.role,
  p.full_name
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE u.email = 'your-email@example.com';  -- Replace with your email

-- Expected result:
-- id | email | is_confirmed | role  | full_name
-- Should show: true for is_confirmed, and 'admin' for role

