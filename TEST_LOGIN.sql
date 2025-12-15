-- Complete User Verification Script
-- Run this to check everything is set up correctly

-- 1. Check user in auth.users
SELECT 
  'User in auth.users' as check_type,
  id,
  email,
  email_confirmed_at IS NOT NULL as is_confirmed,
  confirmed_at IS NOT NULL as is_confirmed_alt
FROM auth.users
WHERE email = 'picassoglitch@gmail.com';

-- 2. Check profile exists
SELECT 
  'Profile exists' as check_type,
  id,
  email,
  full_name,
  role,
  created_at
FROM profiles
WHERE id = '706aa3a4-1297-440d-9e5b-2fd9c36d290d';

-- 3. Complete verification
SELECT 
  u.email,
  u.email_confirmed_at IS NOT NULL as email_confirmed,
  u.confirmed_at IS NOT NULL as user_confirmed,
  p.id IS NOT NULL as has_profile,
  p.role,
  CASE 
    WHEN u.email_confirmed_at IS NULL THEN '❌ Email not confirmed'
    WHEN p.id IS NULL THEN '❌ Profile missing'
    WHEN p.role != 'admin' THEN '⚠️ Not admin (role: ' || p.role || ')'
    ELSE '✅ Everything OK'
  END as status
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE u.email = 'picassoglitch@gmail.com';

-- 4. If profile is missing or wrong role, run this:
INSERT INTO profiles (id, email, full_name, role)
VALUES (
  '706aa3a4-1297-440d-9e5b-2fd9c36d290d',
  'picassoglitch@gmail.com',
  'Admin User',
  'admin'
)
ON CONFLICT (id) DO UPDATE
SET 
  role = 'admin',
  email = 'picassoglitch@gmail.com',
  updated_at = NOW();

-- 5. Final check - should all be true/ok
SELECT 
  'Final Status' as check_type,
  u.email_confirmed_at IS NOT NULL as email_confirmed,
  p.role = 'admin' as is_admin,
  p.id IS NOT NULL as profile_exists
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE u.email = 'picassoglitch@gmail.com';

