# Quick Start - Authentication Setup

## 🔐 Creating Your First User

The 401 error means the user doesn't exist yet. Here's how to create your first admin user:

### Option 1: Via Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard
   - Select your project: `zproheefniynfxbsvuku`

2. **Create User in Authentication**
   - Go to **Authentication** → **Users**
   - Click **"Add User"** or **"Invite User"**
   - Enter:
     - Email: `admin@quantor.com` (or your email)
     - Password: (choose a strong password)
     - Auto Confirm User: ✅ **Check this box**
   - Click **"Create User"**

3. **Set User as Admin**
   - Go to **SQL Editor**
   - Run this query (replace email with yours):
   ```sql
   UPDATE profiles 
   SET role = 'admin', 
       full_name = 'Admin User'
   WHERE email = 'admin@quantor.com';
   ```

4. **Verify**
   ```sql
   SELECT id, email, full_name, role 
   FROM profiles 
   WHERE email = 'admin@quantor.com';
   ```
   Should show `role = 'admin'`

5. **Login**
   - Go to `/auth/login`
   - Use the email and password you created
   - You'll be redirected to `/admin`

### Option 2: Via SQL (Advanced)

If you have service_role access, you can create users directly via SQL:

```sql
-- This requires service_role key, usually done via Dashboard
-- Better to use Option 1 above
```

### Option 3: Self-Signup (For Clients)

1. Go to `/auth/signup`
2. Fill in the form
3. Account will be created as 'client' role
4. Admin must assign stores to the client

## 🚨 Troubleshooting 401 Error

### Error: "Invalid login credentials"
- **Cause**: User doesn't exist or wrong password
- **Solution**: Create user via Supabase Dashboard first

### Error: "Email not confirmed"
- **Cause**: Supabase requires email confirmation
- **Solution**: 
  - Check "Auto Confirm User" when creating
  - Or disable email confirmation in Supabase Settings → Authentication

### Error: "User not found in profiles"
- **Cause**: Profile wasn't created automatically
- **Solution**: Run this SQL:
  ```sql
  INSERT INTO profiles (id, email, full_name, role)
  SELECT id, email, 'User', 'client'
  FROM auth.users
  WHERE email = 'user@email.com'
  ON CONFLICT (id) DO NOTHING;
  ```

## ⚙️ Supabase Auth Settings

To disable email confirmation (for easier testing):

1. Go to **Authentication** → **Settings**
2. Under **"Email Auth"**
3. Disable **"Enable email confirmations"**
4. Or set **"Auto Confirm"** to ON

## 📝 Creating Multiple Users

### Admin Users:
```sql
-- After creating in auth, set as admin:
UPDATE profiles SET role = 'admin' WHERE email = 'admin@email.com';
```

### Client Users:
```sql
-- After creating in auth, ensure role is client:
UPDATE profiles SET role = 'client' WHERE email = 'client@email.com';
```

## ✅ Verification Checklist

- [ ] User created in `auth.users` table
- [ ] Profile exists in `profiles` table
- [ ] Role is set correctly (admin/client)
- [ ] Email confirmation disabled or user confirmed
- [ ] Can login at `/auth/login`
- [ ] Redirects to correct dashboard based on role

## 🔄 Quick Test

1. Create user via Dashboard
2. Set role to admin via SQL
3. Login at `/auth/login`
4. Should redirect to `/admin`
5. Create stores and clients from admin panel

