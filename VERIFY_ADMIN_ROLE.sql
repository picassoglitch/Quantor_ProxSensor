-- Verify and Fix Admin Role for picassoglitch@gmail.com
-- Run this in Supabase SQL Editor

-- Step 1: Check current role
SELECT 
  id,
  email,
  full_name,
  role,
  created_at,
  updated_at
FROM profiles
WHERE email = 'picassoglitch@gmail.com';

-- Step 2: If role is not 'admin', fix it:
UPDATE profiles
SET role = 'admin',
    updated_at = NOW()
WHERE email = 'picassoglitch@gmail.com'
  AND id = '706aa3a4-1297-440d-9e5b-2fd9c36d290d';

-- Step 3: Verify it's now admin
SELECT 
  id,
  email,
  role,
  CASE 
    WHEN role = 'admin' THEN '✅ Es Admin'
    ELSE '❌ NO es Admin (actual: ' || role || ')'
  END as status
FROM profiles
WHERE email = 'picassoglitch@gmail.com';

-- Step 4: Check auth user exists
SELECT 
  id,
  email,
  email_confirmed_at IS NOT NULL as is_confirmed
FROM auth.users
WHERE email = 'picassoglitch@gmail.com';

