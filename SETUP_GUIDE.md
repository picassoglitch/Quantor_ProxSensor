# Setup Guide - Quantor Analytics Platform

## 🚀 Quick Setup

### 1. Database Setup (Supabase)

1. Go to your Supabase Dashboard → SQL Editor
2. Run the SQL script from `database-schema.sql`
3. This creates:
   - `profiles` table (user management)
   - `stores` table (location management)
   - `client_stores` table (assignments)
   - RLS policies for security
   - Triggers for auto-profile creation

### 2. Environment Variables

Create `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=https://zproheefniynfxbsvuku.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=d0ruWfE2tQTIk39fdbwnDA_mqIuQXz_
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Create First Admin User

**Option A: Via Supabase Dashboard**
1. Go to Authentication → Users → Add User
2. Create user with email/password
3. Go to SQL Editor and run:
```sql
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'your-admin@email.com';
```

**Option B: Via Supabase Auth API**
```sql
-- First create user in auth.users (via Supabase Dashboard)
-- Then update profile:
UPDATE profiles SET role = 'admin' WHERE id = 'user-uuid';
```

### 5. Run Development Server

```bash
npm run dev
```

## 📋 Features Overview

### Admin Panel (`/admin`)

**User Management:**
- Create/Edit/Delete users
- Assign roles (admin/client)
- Set passwords
- View all users

**Store Management:**
- Create/Edit/Delete stores
- Link stores to sensor IDs
- Set location names

**Client-Store Assignments:**
- Assign stores to clients
- Many-to-many relationships
- Clients only see their assigned stores

### Client Dashboard (`/dashboard`)

- View analytics for assigned stores only
- All dashboard features (KPIs, charts, insights)
- Filtered by client's stores automatically
- Profile management

### Authentication

- Login page (`/auth/login`)
- Protected routes with middleware
- Role-based access control
- Auto-redirect based on role

## 🔐 Security Features

1. **Row Level Security (RLS)**
   - Clients can only see their assigned stores
   - Admins can see everything
   - Automatic filtering in queries

2. **Route Protection**
   - Middleware checks authentication
   - Role-based route access
   - Auto-redirect to login

3. **Data Isolation**
   - Clients only see their data
   - Store assignments enforced
   - Secure API calls

## 📝 Usage Workflow

### For Admins:

1. **Create Users:**
   - Go to `/admin` → Users tab
   - Click "Nuevo Usuario"
   - Fill in email, name, role, password
   - Save

2. **Create Stores:**
   - Go to `/admin` → Tiendas tab
   - Click "Nueva Tienda"
   - Enter name, location (must match sensor LOCATION_NAME)
   - Optionally add sensor_id
   - Save

3. **Assign Stores to Clients:**
   - Go to `/admin` → Asignaciones tab
   - Click "Nueva Asignación"
   - Select client and store
   - Save

### For Clients:

1. **Login:**
   - Go to `/auth/login`
   - Enter credentials
   - Auto-redirected to dashboard

2. **View Analytics:**
   - Dashboard shows only assigned stores
   - All features available
   - Real-time updates

3. **Manage Profile:**
   - Click profile icon in header
   - Update name
   - View role

## 🔧 Troubleshooting

### "User not found" error
- Ensure profile was created (trigger should handle this)
- Check auth.users table has the user
- Verify profiles table has matching record

### Client sees no data
- Check client_stores assignments
- Verify store location matches sensor LOCATION_NAME
- Check RLS policies are enabled

### Admin can't access admin panel
- Verify role is set to 'admin' in profiles table
- Check middleware is working
- Clear cookies and re-login

## 📊 Database Schema

```
profiles (extends auth.users)
├── id (UUID, FK to auth.users)
├── email
├── full_name
├── role (admin/client)
└── timestamps

stores
├── id (UUID)
├── name
├── location (unique, matches sensor)
├── sensor_id (optional)
└── timestamps

client_stores (many-to-many)
├── id (UUID)
├── client_id (FK to profiles)
├── store_id (FK to stores)
└── created_at

detections (existing)
├── location (matches stores.location)
└── ... (other fields)
```

## 🎯 Next Steps

1. Create admin user
2. Create stores matching your sensor locations
3. Create client users
4. Assign stores to clients
5. Test client dashboard access
6. Deploy to production

## 📞 Support

For issues or questions:
- Check Supabase logs
- Review RLS policies
- Verify database schema
- Check middleware logs

