# Configure Supabase Redirect URL for Password Reset

## 🔧 Setup Required

The password reset link needs to redirect to your app. Configure this in Supabase:

### Step 1: Go to Supabase Dashboard
- https://supabase.com/dashboard/project/zproheefniynfxbsvuku
- Navigate to: **Authentication** → **URL Configuration**

### Step 2: Add Redirect URLs

Add these URLs to **"Redirect URLs"**:

**For Development:**
```
http://localhost:3000/auth/reset-password
http://localhost:3000/auth/callback
```

**For Production (when deployed):**
```
https://your-domain.com/auth/reset-password
https://your-domain.com/auth/callback
```

### Step 3: Set Site URL

Set **"Site URL"** to:
- Development: `http://localhost:3000`
- Production: `https://your-domain.com`

### Step 4: Save Changes

Click **"Save"** at the bottom.

## ✅ How It Works

1. User clicks "Send Password Recovery" in Dashboard
2. Supabase sends email with reset link
3. Link redirects to: `http://localhost:3000/auth/reset-password?token=xxx&type=recovery`
4. Our page extracts the token and allows password reset
5. User sets new password
6. Redirects to login

## 🧪 Test It

1. Go to Authentication → Users → picassoglitch@gmail.com
2. Click "Send password recovery"
3. Check email
4. Click link in email
5. Should redirect to `/auth/reset-password` with token
6. Enter new password
7. Should redirect to login

## 🐛 Troubleshooting

### Link doesn't redirect to app
- Check Redirect URLs are configured correctly
- Make sure Site URL is set
- Clear browser cache

### Token not found
- Check URL has `?token=xxx&type=recovery`
- Or check hash fragment `#access_token=xxx`
- The page handles both formats

### Password reset fails
- Token might be expired (request new one)
- Check browser console for errors
- Verify Supabase connection

