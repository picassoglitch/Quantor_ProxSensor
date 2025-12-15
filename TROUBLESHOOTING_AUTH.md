# Troubleshooting 401 Authentication Error

## ✅ Quick Fix Steps

### Step 1: Verify User Exists

Run this in Supabase SQL Editor:

```sql
-- Check user in auth.users
SELECT id, email, email_confirmed_at, confirmed_at 
FROM auth.users 
WHERE email = 'your-email@example.com';
```

**Expected**: Should return a row with `email_confirmed_at` NOT NULL

### Step 2: Verify Profile Exists

```sql
-- Check profile
SELECT id, email, role, full_name 
FROM profiles 
WHERE email = 'your-email@example.com';
```

**Expected**: Should return a row with `role = 'admin'`

### Step 3: Fix Common Issues

#### Issue A: User Not Confirmed

**Symptoms**: User exists but `email_confirmed_at` is NULL

**Fix**:
1. Go to **Supabase Dashboard** → **Authentication** → **Users**
2. Find your user
3. Click the **three dots** (⋯) → **"Confirm User"**
4. Or manually confirm via SQL (requires service_role):
   ```sql
   -- Only if you have service_role access
   UPDATE auth.users 
   SET email_confirmed_at = NOW(), 
       confirmed_at = NOW()
   WHERE email = 'your-email@example.com';
   ```

#### Issue B: Profile Doesn't Exist

**Symptoms**: User exists in `auth.users` but not in `profiles`

**Fix**:
```sql
INSERT INTO profiles (id, email, full_name, role)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'full_name', 'User'),
  COALESCE(raw_user_meta_data->>'role', 'admin')
FROM auth.users
WHERE email = 'your-email@example.com'
ON CONFLICT (id) DO UPDATE
SET role = 'admin';
```

#### Issue C: Wrong Password

**Symptoms**: 401 error with "Invalid login credentials"

**Fix**:
1. Go to **Supabase Dashboard** → **Authentication** → **Users**
2. Find your user
3. Click **"Reset Password"** or **"Update Password"**
4. Set a new password
5. Try logging in again

#### Issue D: Email Confirmation Required

**Symptoms**: Error mentions "Email not confirmed"

**Fix**:
1. **Disable email confirmation** (for development):
   - Go to **Authentication** → **Settings**
   - Under **"Email Auth"**
   - **Disable** "Enable email confirmations"
   - Or set **"Auto Confirm"** to ON

2. **Or confirm the user manually**:
   - Dashboard → Authentication → Users
   - Click user → "Confirm User"

### Step 4: Test Login

1. Clear browser cookies/localStorage
2. Go to `/auth/login`
3. Enter email and password
4. Should redirect to `/admin` (if admin) or `/dashboard` (if client)

## 🔍 Debug Checklist

Run this complete verification:

```sql
-- Complete user verification
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
WHERE u.email = 'your-email@example.com';
```

**All should be TRUE**:
- ✅ `email_confirmed` = true
- ✅ `user_confirmed` = true  
- ✅ `profile_exists` = true
- ✅ `role` = 'admin' (if you want admin access)

## 🚨 Common Error Messages

### "Invalid login credentials"
- **Cause**: Wrong email or password
- **Fix**: Reset password in Dashboard

### "Email not confirmed"
- **Cause**: Email confirmation required but not done
- **Fix**: Confirm user in Dashboard or disable email confirmation

### "User not found"
- **Cause**: User doesn't exist in auth.users
- **Fix**: Create user via Dashboard

### "Profile not found"
- **Cause**: User exists but profile doesn't
- **Fix**: Run INSERT query above to create profile

## 💡 Pro Tips

1. **For Development**: Always disable email confirmation
2. **Always check "Auto Confirm User"** when creating users
3. **Use strong passwords** (min 6 chars, but 8+ recommended)
4. **Clear browser cache** if issues persist
5. **Check browser console** for detailed error messages

## 🔄 Reset Everything

If nothing works, reset the user:

```sql
-- 1. Delete profile
DELETE FROM profiles WHERE email = 'your-email@example.com';

-- 2. Delete from auth (requires service_role or via Dashboard)
-- Go to Dashboard → Authentication → Users → Delete User

-- 3. Recreate user via Dashboard with "Auto Confirm" checked

-- 4. Set as admin
UPDATE profiles SET role = 'admin' WHERE email = 'your-email@example.com';
```

