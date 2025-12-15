-- Reset Password for User
-- Note: This requires service_role key or must be done via Dashboard
-- The SQL below is for reference, but password reset is usually done via Dashboard

-- Option 1: Via Supabase Dashboard (Recommended)
-- 1. Go to Authentication → Users
-- 2. Find picassoglitch@gmail.com
-- 3. Click "Reset Password" or "Update Password"
-- 4. Set new password
-- 5. Make sure "Auto Confirm User" is checked

-- Option 2: If you have service_role access, you can update via SQL:
-- UPDATE auth.users
-- SET encrypted_password = crypt('your-new-password', gen_salt('bf'))
-- WHERE email = 'picassoglitch@gmail.com';

-- But the easiest way is via Dashboard:
-- Authentication → Users → picassoglitch@gmail.com → Reset Password

