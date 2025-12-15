# Fix "Invalid API key" Error

## 🔍 The Problem

The error "Invalid API key" means Supabase is rejecting the API key. This can happen if:

1. **API key is incomplete** - The key might be truncated
2. **Wrong key format** - Should be a JWT token starting with `eyJ`
3. **Environment variables not loading** - Next.js might not be reading `.env` files

## ✅ Solution

### Step 1: Verify the API Key

The anon key should be:
```
d0ruWfE2tQTIk39fdbwnDA_mqIuQXz_
```

**Check in Supabase Dashboard:**
1. Go to: https://supabase.com/dashboard/project/zproheefniynfxbsvuku
2. Navigate to: **Settings** → **API**
3. Copy the **"anon"** or **"public"** key
4. Make sure it's the complete key (should be a long JWT token)

### Step 2: Create `.env.local` File

Create a file called `.env.local` in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=https://zproheefniynfxbsvuku.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=d0ruWfE2tQTIk39fdbwnDA_mqIuQXz_
```

**Important:** 
- The key must start with `NEXT_PUBLIC_` to be available in the browser
- No spaces around the `=` sign
- No quotes needed

### Step 3: Restart Dev Server

After creating `.env.local`:

1. Stop the dev server (Ctrl+C)
2. Restart it: `npm run dev`
3. Try the password reset again

### Step 4: Verify Key is Loading

Open browser console and check:
- Should NOT see "Supabase URL or Anon Key is missing!"
- The key should be present

## 🐛 If Still Not Working

### Check Key Format

The anon key should be a JWT token. Verify:
- Starts with `eyJ` (base64 encoded JSON)
- Is very long (usually 200+ characters)
- No spaces or line breaks

### Verify in Supabase Dashboard

1. Go to **Settings** → **API**
2. Check **"Project URL"** matches: `https://zproheefniynfxbsvuku.supabase.co`
3. Check **"anon public"** key is correct
4. Copy the FULL key (might be truncated in display)

### Alternative: Use Hardcoded Values

The code already has fallback values hardcoded, so it should work even without `.env.local`. If it's still failing, the key itself might be wrong.

## 🔄 Quick Test

1. Open browser console
2. Go to `/auth/reset-password`
3. Enter your email
4. Check console for any errors
5. Look for "Request reset error" logs

## 💡 Common Issues

- **Key truncated**: Make sure you copied the entire key
- **Wrong key**: Using service_role instead of anon key
- **Environment not loaded**: Restart dev server after creating `.env.local`
- **Key has spaces**: Remove any spaces or line breaks

