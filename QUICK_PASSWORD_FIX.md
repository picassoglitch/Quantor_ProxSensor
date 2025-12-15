# Quick Password Fix - Bypass Rate Limit

## 🚨 The Problem

You're getting rate limited (28 seconds wait) when trying to reset password.

## ✅ Solution: Use "Update Password" Instead

### Step 1: Go to Supabase Dashboard
- https://supabase.com/dashboard/project/zproheefniynfxbsvuku
- Navigate to: **Authentication** → **Users**

### Step 2: Find Your User
- Search for: `picassoglitch@gmail.com`
- Click on the user

### Step 3: Update Password Directly
- Look for **"Update Password"** button (NOT "Reset Password")
- Click it
- Enter your new password directly
- Save

**This bypasses the rate limit!** ✅

## 🔄 Alternative: Wait and Retry

If "Update Password" is not available:
1. Wait 28 seconds
2. Try "Reset Password" again
3. Check your email for the reset link

## 🎯 Complete Setup After Password Reset

Once you have the password set:

1. **Verify Profile Exists** (run in SQL Editor):
```sql
SELECT id, email, role 
FROM profiles 
WHERE id = '706aa3a4-1297-440d-9e5b-2fd9c36d290d';
```

2. **If profile doesn't exist, create it**:
```sql
INSERT INTO profiles (id, email, full_name, role)
VALUES (
  '706aa3a4-1297-440d-9e5b-2fd9c36d290d',
  'picassoglitch@gmail.com',
  'Admin User',
  'admin'
)
ON CONFLICT (id) DO UPDATE
SET role = 'admin';
```

3. **Login**:
   - Go to `/auth/login`
   - Email: `picassoglitch@gmail.com`
   - Password: (the one you just set)
   - Should redirect to `/admin`

## 💡 Pro Tip

Always use **"Update Password"** instead of **"Reset Password"** when you have Dashboard access - it's instant and has no rate limits!

