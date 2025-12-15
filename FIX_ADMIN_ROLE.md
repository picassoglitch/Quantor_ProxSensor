# Fix Admin Role Issue

## 🔍 The Problem

User `picassoglitch@gmail.com` shows as "client" in dashboard but is "admin" in database.

## ✅ Quick Fix

### Step 1: Verify Role in Database

Run this SQL in Supabase SQL Editor:

```sql
-- Check current role
SELECT 
  id,
  email,
  full_name,
  role,
  created_at
FROM profiles
WHERE email = 'picassoglitch@gmail.com';
```

**Expected:** Should show `role = 'admin'`

### Step 2: Fix Role if Wrong

If role is not 'admin', run:

```sql
UPDATE profiles
SET role = 'admin',
    updated_at = NOW()
WHERE email = 'picassoglitch@gmail.com'
  AND id = '706aa3a4-1297-440d-9e5b-2fd9c36d290d';
```

### Step 3: Clear Browser Cache

1. **Clear browser cache and cookies**
2. **Or use incognito/private window**
3. **Logout and login again**

### Step 4: Verify

1. Login with `picassoglitch@gmail.com`
2. Should automatically redirect to `/admin`
3. Should see "Administrador" badge in header
4. Should see admin panel with tabs

## 🔄 What I Fixed

1. **Middleware** - Now redirects admins from `/dashboard` and `/` to `/admin`
2. **Dashboard Page** - Checks role and redirects admins
3. **Client Dashboard** - Enhanced role checking with logging
4. **Root Page** - Added admin role check

## 🐛 If Still Not Working

1. **Check browser console** for errors
2. **Verify profile exists**:
   ```sql
   SELECT * FROM profiles WHERE email = 'picassoglitch@gmail.com';
   ```
3. **Check role is exactly 'admin'** (not 'Admin' or 'ADMIN'):
   ```sql
   SELECT role, LENGTH(role) as role_length FROM profiles WHERE email = 'picassoglitch@gmail.com';
   ```
4. **Clear all cookies** for localhost:3000
5. **Restart dev server**: `npm run dev`

## 💡 Common Issues

- **Role has extra spaces**: `'admin '` instead of `'admin'`
- **Case sensitive**: `'Admin'` instead of `'admin'`
- **Profile doesn't exist**: Run the INSERT query from `FIX_PICASSO_USER.sql`
- **Cache issue**: Clear browser cache completely

