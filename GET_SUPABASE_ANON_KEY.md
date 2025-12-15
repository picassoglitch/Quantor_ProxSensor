# How to Get the Correct Supabase Anon Key for ESP32

## The Problem

The keys you're seeing (`sb_publishable_...` and `sb_secret_...`) are NOT the standard Supabase anon keys. 

**Standard Supabase anon keys are JWT tokens** that:
- Start with `eyJ` (base64 encoded JSON)
- Are 200+ characters long
- Have 3 parts separated by dots (`.`)
- Look like: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpwcm9oZWVmbml5bmZ4YnN2dWt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQwNzI4MDAsImV4cCI6MjA0OTY0ODgwMH0.XXXXX...`

## Steps to Get the Correct Key

### Method 1: Supabase Dashboard (Recommended)

1. Go to: https://supabase.com/dashboard/project/zproheefniynfxbsvuku
2. Click **Settings** (gear icon in sidebar)
3. Click **API** in the left menu
4. Look for **"Project API keys"** section
5. Find **"anon"** or **"public"** key
6. Click the **copy icon** next to it
7. The key should be a long JWT token starting with `eyJ`

### Method 2: Check Your Next.js Code

If your Next.js app is working, check where it gets the key:

1. Look in `lib/supabase-client.ts` or `.env.local`
2. Find `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Copy that value - it should be the JWT token

### Method 3: Supabase CLI

If you have Supabase CLI installed:
```bash
supabase status
```

## ⚠️ Important Notes

- **DO NOT use `sb_secret_...`** - This is the service role key (admin access)
- **DO NOT use `sb_publishable_...`** - This might be a newer format, but verify it works
- **USE the JWT token** starting with `eyJ` - This is the standard anon key

## If You Can't Find the JWT Token

If Supabase has changed their key format and you only see `sb_publishable_...`:

1. Try using the `sb_publishable_...` key as-is
2. Make sure the URL includes `/rest/v1/detections`
3. Verify the RLS policy allows anonymous inserts

## Verify the Key Works

After updating the key in your Arduino code:
1. Upload the code
2. Check Serial Monitor
3. Look for successful uploads (200, 201, or 204 status codes)

