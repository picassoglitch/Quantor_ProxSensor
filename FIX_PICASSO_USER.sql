-- Fix User Profile for picassoglitch@gmail.com
-- Run this COMPLETE script in Supabase SQL Editor

-- Step 1: Verify user exists (should return 1 row)
SELECT 
  id,
  email,
  email_confirmed_at IS NOT NULL as is_confirmed,
  confirmed_at IS NOT NULL as is_confirmed_alt
FROM auth.users
WHERE email = 'picassoglitch@gmail.com';

-- Step 2: Check if profile exists (might return 0 rows - that's the problem!)
SELECT 
  id,
  email,
  full_name,
  role,
  created_at
FROM profiles
WHERE id = '706aa3a4-1297-440d-9e5b-2fd9c36d290d';

-- Step 3: CREATE OR UPDATE PROFILE (THIS IS THE FIX!)
INSERT INTO profiles (id, email, full_name, role)
VALUES (
  '706aa3a4-1297-440d-9e5b-2fd9c36d290d',
  'picassoglitch@gmail.com',
  'Admin User',
  'admin'
)
ON CONFLICT (id) DO UPDATE
SET 
  email = 'picassoglitch@gmail.com',
  role = 'admin',
  full_name = COALESCE(EXCLUDED.full_name, profiles.full_name, 'Admin User'),
  updated_at = NOW();

-- Step 4: Verify profile was created/updated
SELECT 
  id,
  email,
  full_name,
  role,
  created_at,
  updated_at
FROM profiles
WHERE id = '706aa3a4-1297-440d-9e5b-2fd9c36d290d';

-- Expected: Should return 1 row with role = 'admin'

-- Step 5: Complete verification
SELECT 
  '✅ User Status' as check_type,
  u.email,
  u.email_confirmed_at IS NOT NULL as email_confirmed,
  p.id IS NOT NULL as profile_exists,
  p.role,
  CASE 
    WHEN u.email_confirmed_at IS NULL THEN '❌ Email not confirmed'
    WHEN p.id IS NULL THEN '❌ Profile missing - RUN STEP 3!'
    WHEN p.role != 'admin' THEN '⚠️ Not admin (current: ' || p.role || ') - RUN STEP 3!'
    ELSE '✅ Everything OK - Try logging in now!'
  END as status
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE u.email = 'picassoglitch@gmail.com';

