# Immediate Fix for 401 Error

## 🚨 The Problem

You're getting 401 even though user exists. This is **99% likely** because:
- **User is not confirmed** (`email_confirmed_at` is NULL)
- **Email confirmation is required** but not completed

## ⚡ Quick Fix (2 minutes)

### Option 1: Confirm User via Dashboard (Easiest)

1. **Go to Supabase Dashboard**
   - https://supabase.com/dashboard/project/zproheefniynfxbsvuku
   
2. **Navigate to Authentication → Users**

3. **Find your user** (by email)

4. **Click the three dots (⋯) next to the user**

5. **Click "Confirm User"** or **"Send Confirmation Email"**

6. **If "Confirm User" is available, click it** (this confirms immediately)

7. **Try logging in again**

### Option 2: Disable Email Confirmation (For Development)

1. **Go to Authentication → Settings**

2. **Under "Email Auth" section**

3. **Find "Enable email confirmations"**

4. **Turn it OFF** ✅

5. **Save settings**

6. **Try logging in again**

### Option 3: Reset Password

If confirmation doesn't work:

1. **Go to Authentication → Users**

2. **Find your user**

3. **Click "Reset Password"** or **"Update Password"**

4. **Set a new password**

5. **Make sure "Auto Confirm User" is checked** when updating

6. **Try logging in with new password**

## 🔍 Verify User Status

Run this in SQL Editor to check:

```sql
SELECT 
  email,
  email_confirmed_at IS NOT NULL as confirmed,
  created_at
FROM auth.users
WHERE email = 'your-email@example.com';
```

**If `confirmed` is `false`**, that's your problem!

## ✅ After Fixing

1. Clear browser cookies/localStorage
2. Go to `/auth/login`
3. Enter email and password
4. Should work now!

## 💡 Most Common Issue

**User exists but `email_confirmed_at` is NULL**

**Solution**: Confirm user in Dashboard (Option 1 above)

