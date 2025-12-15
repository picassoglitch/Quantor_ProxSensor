# Fix 401 Authentication Error

## The Problem

You're getting a 401 error because:
1. **The user doesn't exist** in Supabase Auth
2. **Email confirmation is required** but not completed
3. **Profile wasn't created** automatically

## ✅ Quick Fix (5 minutes)

### Step 1: Create User in Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/zproheefniynfxbsvuku
2. Navigate to: **Authentication** → **Users**
3. Click: **"Add User"** or **"Invite User"**
4. Fill in:
   - **Email**: `admin@quantor.com` (or your email)
   - **Password**: (choose a password)
   - ✅ **Check "Auto Confirm User"** (important!)
5. Click **"Create User"**

### Step 2: Make User an Admin

1. Go to: **SQL Editor** in Supabase Dashboard
2. Run this SQL (replace email with yours):

```sql
-- Update profile to admin role
UPDATE profiles 
SET role = 'admin', 
    full_name = 'Admin User'
WHERE email = 'admin@quantor.com';

-- Verify it worked
SELECT id, email, full_name, role 
FROM profiles 
WHERE email = 'admin@quantor.com';
```

### Step 3: Disable Email Confirmation (Optional but Recommended)

1. Go to: **Authentication** → **Settings**
2. Under **"Email Auth"**
3. Find **"Enable email confirmations"**
4. **Turn it OFF** (or set Auto Confirm to ON)

### Step 4: Login

1. Go to: `http://localhost:3000/auth/login`
2. Enter your email and password
3. You should be redirected to `/admin`

## 🔍 Verify Everything Works

Run this in SQL Editor to check:

```sql
-- Check if user exists
SELECT id, email, email_confirmed_at 
FROM auth.users 
WHERE email = 'admin@quantor.com';

-- Check if profile exists
SELECT id, email, full_name, role 
FROM profiles 
WHERE email = 'admin@quantor.com';

-- Both should return results
```

## 🐛 Common Issues

### Issue: "User created but can't login"
**Solution**: 
- Check "Auto Confirm User" was checked
- Or disable email confirmation in settings

### Issue: "Profile doesn't exist"
**Solution**: Run this SQL:
```sql
INSERT INTO profiles (id, email, full_name, role)
SELECT id, email, 'User', 'admin'
FROM auth.users
WHERE email = 'admin@quantor.com'
ON CONFLICT (id) DO UPDATE
SET role = 'admin';
```

### Issue: "Still getting 401"
**Solution**:
1. Clear browser cookies
2. Check Supabase Auth logs
3. Verify user email is correct
4. Try creating a new user

## 📋 Complete Setup Checklist

- [ ] User created in Supabase Auth Dashboard
- [ ] "Auto Confirm User" was checked
- [ ] Profile exists in `profiles` table
- [ ] Role set to 'admin' in profiles
- [ ] Email confirmation disabled (optional)
- [ ] Can login at `/auth/login`
- [ ] Redirects to `/admin` after login

## 🎯 Next Steps After Login

Once you're logged in as admin:

1. **Create Stores**
   - Go to Admin → Stores
   - Create stores matching your sensor locations
   - Location name must match sensor `LOCATION_NAME`

2. **Create Client Users**
   - Go to Admin → Users
   - Create client accounts
   - Assign stores to clients

3. **Test Client Access**
   - Logout
   - Login as client
   - Verify they only see assigned stores

## 💡 Pro Tip

For development, you can disable email confirmation entirely:
- Supabase Dashboard → Authentication → Settings
- Disable "Enable email confirmations"
- All new users will be auto-confirmed

