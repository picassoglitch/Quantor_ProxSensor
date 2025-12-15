-- Reset Password for picassoglitch@gmail.com
-- Note: Password reset via SQL requires service_role key
-- Better to use Dashboard method below

-- Option 1: Via Dashboard (Recommended - No wait time)
-- 1. Go to Authentication → Users
-- 2. Find picassoglitch@gmail.com
-- 3. Click "Update Password" (NOT "Reset Password")
-- 4. Enter new password directly
-- 5. Save
-- This bypasses the rate limit!

-- Option 2: Wait 28 seconds and try "Reset Password" again

-- Option 3: If you have service_role access, you can update directly:
-- (This requires service_role key, usually not available)
-- UPDATE auth.users
-- SET encrypted_password = crypt('your-new-password', gen_salt('bf'))
-- WHERE email = 'picassoglitch@gmail.com';

-- RECOMMENDED: Use "Update Password" in Dashboard (Option 1)

