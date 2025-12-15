# How to Get Your Complete Supabase API Key

## 🔑 The Problem

The error "Invalid API key" means the API key is either:
- **Truncated** (incomplete)
- **Wrong format** (not a JWT token)
- **Wrong key type** (using service_role instead of anon)

## ✅ Solution: Get the Complete Key

### Step 1: Go to Supabase Dashboard

1. Navigate to: https://supabase.com/dashboard/project/zproheefniynfxbsvuku
2. Click on: **Settings** (gear icon in sidebar)
3. Click on: **API** (in the left menu)

### Step 2: Find the Anon/Public Key

You'll see two keys:
- **anon public** ← **USE THIS ONE** (safe for client-side)
- **service_role** ← DON'T use this (server-side only, has admin access)

### Step 3: Copy the Complete Key

1. Click the **copy icon** next to "anon public" key
2. The key should be a **very long JWT token** (200+ characters)
3. It should start with `eyJ` (base64 encoded JSON)
4. Example format: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpwcm9oZWVmbml5bmZ4YnN2dWt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQwNzI4MDAsImV4cCI6MjA0OTY0ODgwMH0.d0ruWfE2tQTIk39fdbwnDA_mqIuQXz_...`

**⚠️ Important:** Make sure you copy the **ENTIRE** key, not just the beginning!

### Step 4: Update the Code

Once you have the complete key, update `lib/supabase-client.ts`:

```typescript
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'PASTE_COMPLETE_KEY_HERE'
```

Or create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://zproheefniynfxbsvuku.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=PASTE_COMPLETE_KEY_HERE
```

### Step 5: Restart Dev Server

1. Stop the server (Ctrl+C)
2. Run: `npm run dev`
3. Try password reset again

## 🔍 Verify Key is Complete

The key should:
- ✅ Start with `eyJ`
- ✅ Be 200+ characters long
- ✅ Contain multiple parts separated by dots (`.`)
- ✅ Look like a JWT token

If your key is:
- ❌ Only 30-40 characters → **TRUNCATED** (incomplete)
- ❌ Doesn't start with `eyJ` → **WRONG KEY** (might be service_role)
- ❌ Has spaces or line breaks → **FORMATTED WRONG** (remove them)

## 🐛 Current Key Issue

The current key in the code (`d0ruWfE2tQTIk39fdbwnDA_mqIuQXz_`) appears to be:
- Only the **last part** of a JWT token
- Missing the **header** and **payload** parts
- This is why Supabase rejects it as "Invalid API key"

## 💡 Quick Fix

1. Go to Supabase Dashboard → Settings → API
2. Copy the **complete** "anon public" key
3. Replace the key in `lib/supabase-client.ts` line 6
4. Restart dev server
5. Test password reset

## 📝 Example of Complete Key Format

A complete Supabase anon key looks like:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpwcm9oZWVmbml5bmZ4YnN2dWt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQwNzI4MDAsImV4cCI6MjA0OTY0ODgwMH0.d0ruWfE2tQTIk39fdbwnDA_mqIuQXz_ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890
```

Notice it has **3 parts** separated by dots, and is much longer than what we currently have.

