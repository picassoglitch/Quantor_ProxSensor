# Admin & Client Features - Complete Guide

## 🎯 System Overview

Quantor Analytics Platform now includes a complete user management system with:
- **Admin Panel** - Full control over users, stores, and assignments
- **Client Dashboard** - Filtered view of assigned stores only
- **Authentication** - Secure login with role-based access
- **Profile Management** - Users can manage their profiles

## 👥 User Roles

### Admin
- Full access to admin panel (`/admin`)
- Can create/edit/delete users
- Can create/edit/delete stores
- Can assign stores to clients
- Can view all data across all stores
- Cannot be deleted by other admins

### Client
- Access to client dashboard (`/dashboard`)
- Can only view data from assigned stores
- Can manage own profile
- Cannot access admin panel
- Data automatically filtered by assignments

## 🔐 Authentication Flow

1. **Login** (`/auth/login`)
   - User enters email/password
   - System checks credentials
   - Redirects based on role:
     - Admin → `/admin`
     - Client → `/dashboard`

2. **Route Protection**
   - Middleware checks authentication on every request
   - Unauthenticated users → redirected to login
   - Clients trying to access `/admin` → redirected to dashboard
   - Admins automatically redirected from login to admin panel

## 📊 Admin Panel Features

### User Management Tab

**Create User:**
- Email (required, unique)
- Full name (optional)
- Role (admin/client)
- Password (required for new users)

**Edit User:**
- Update full name
- Change role
- Update password (optional)

**Delete User:**
- Removes user from profiles table
- Removes from auth.users (via admin API)
- Cascades to remove assignments

### Store Management Tab

**Create Store:**
- Name (e.g., "Tienda Centro")
- Location (must match sensor `LOCATION_NAME`)
- Sensor ID (optional, for reference)

**Edit Store:**
- Update name, location, sensor ID

**Delete Store:**
- Removes store
- Cascades to remove assignments

### Assignments Tab

**Create Assignment:**
- Select client (dropdown of all clients)
- Select store (dropdown of all stores)
- Creates many-to-many relationship

**Delete Assignment:**
- Removes client's access to that store
- Client immediately loses access to that store's data

## 🏪 Store-Client Relationship

### How It Works

1. **Admin creates stores** matching sensor locations
2. **Admin creates client users**
3. **Admin assigns stores to clients** via assignments
4. **Client dashboard automatically filters** to show only assigned stores

### Data Filtering

- Clients only see detections from their assigned stores
- Location dropdown only shows assigned locations
- All charts and stats filtered automatically
- Real-time updates only for assigned stores

## 🔒 Security Features

### Row Level Security (RLS)

**Profiles:**
- Users can view/update own profile
- Admins can view/manage all profiles

**Stores:**
- Everyone can view stores (for dropdowns)
- Only admins can create/edit/delete

**Client-Stores:**
- Clients can view their own assignments
- Admins can view/manage all assignments

**Detections:**
- Clients can only view detections from assigned stores
- Admins can view all detections
- Enforced at database level via RLS policies

### Middleware Protection

- All routes protected except `/auth/login`
- Role-based redirects
- Automatic session refresh
- Cookie-based authentication

## 📝 Setup Checklist

### 1. Database Setup
- [ ] Run `database-schema.sql` in Supabase SQL Editor
- [ ] Verify tables created: profiles, stores, client_stores
- [ ] Verify RLS policies enabled
- [ ] Verify triggers created

### 2. Create First Admin
- [ ] Create user in Supabase Auth
- [ ] Update profile role to 'admin' in SQL:
  ```sql
  UPDATE profiles SET role = 'admin' WHERE email = 'admin@email.com';
  ```

### 3. Create Stores
- [ ] Go to Admin Panel → Stores
- [ ] Create stores matching your sensor locations
- [ ] Ensure location name matches sensor `LOCATION_NAME`

### 4. Create Clients
- [ ] Go to Admin Panel → Users
- [ ] Create client users
- [ ] Set role to 'client'
- [ ] Assign password

### 5. Assign Stores
- [ ] Go to Admin Panel → Assignments
- [ ] Assign stores to clients
- [ ] Verify clients can see their stores

## 🎨 UI Features

### Admin Panel
- Clean tabbed interface
- Modal forms for create/edit
- Confirmation dialogs for deletes
- Real-time updates
- Responsive design

### Client Dashboard
- Same beautiful dashboard
- Automatically filtered
- Profile link in header
- All analytics features available

### Profile Page
- Update full name
- View role (read-only)
- View email (read-only)
- Logout button
- Back to dashboard link

## 🔄 Workflow Examples

### Adding a New Client

1. Admin → Users → Nuevo Usuario
2. Enter: email, name, role=client, password
3. Save
4. Admin → Assignments → Nueva Asignación
5. Select client and store(s)
6. Save
7. Client can now login and see their stores

### Adding a New Store

1. Admin → Stores → Nueva Tienda
2. Enter: name, location (match sensor), sensor_id
3. Save
4. Assign to clients via Assignments tab

### Client Experience

1. Client logs in at `/auth/login`
2. Redirected to `/dashboard`
3. Sees only their assigned stores
4. All analytics work normally
5. Can access profile via header icon

## 🐛 Troubleshooting

### Client sees no data
- Check assignments exist in `client_stores` table
- Verify store location matches sensor `LOCATION_NAME`
- Check RLS policies are enabled
- Verify detections exist for that location

### Admin can't create users
- Check Supabase Auth is enabled
- Verify admin has correct role
- Check browser console for errors
- Verify database triggers are working

### Middleware errors
- Check environment variables are set
- Verify Supabase URL and key are correct
- Check cookies are enabled
- Review middleware logs

## 📈 Next Steps

1. **Customize branding** - Update Quantor logo/colors
2. **Add email notifications** - Alert admins of new users
3. **Add audit logs** - Track admin actions
4. **Add bulk operations** - Import users/stores
5. **Add permissions** - Granular role permissions
6. **Add API keys** - For programmatic access

