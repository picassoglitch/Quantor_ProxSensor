-- Script to create your first admin user
-- Run this in Supabase SQL Editor

-- Step 1: Create user in auth.users (you can also do this via Supabase Dashboard)
-- Go to Authentication > Users > Add User
-- Or use this SQL (requires service_role key):

-- Step 2: After creating user in auth, update their profile to admin:
-- Replace 'your-email@example.com' with your actual email

-- First, check if user exists:
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- If user exists, update their profile:
UPDATE profiles 
SET role = 'admin', 
    full_name = 'Admin User'
WHERE email = 'your-email@example.com';

-- If profile doesn't exist, create it:
INSERT INTO profiles (id, email, full_name, role)
SELECT id, email, 'Admin User', 'admin'
FROM auth.users
WHERE email = 'your-email@example.com'
ON CONFLICT (id) DO UPDATE
SET role = 'admin', full_name = 'Admin User';

-- Verify the user is now an admin:
SELECT id, email, full_name, role FROM profiles WHERE email = 'your-email@example.com';

