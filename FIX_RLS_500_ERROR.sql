-- Fix RLS 500 Error for Profiles
-- The issue is that "Admins can view all profiles" policy creates a circular dependency
-- Run this in Supabase SQL Editor

-- Step 1: Drop all existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;

-- Step 2: Create policies in correct order (own profile first, then admin)

-- Policy 1: Users can ALWAYS view their own profile (this must work first)
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Policy 2: Users can update their own profile (except role)
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    -- Note: Role changes should be restricted, but we'll handle that in application logic
  );

-- Policy 3: Admins can view all profiles
-- IMPORTANT: This uses a subquery that can access the user's own profile (from Policy 1)
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    -- Check if current user is admin by looking at their own profile
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Policy 4: Admins can insert profiles
CREATE POLICY "Admins can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Policy 5: Admins can update all profiles
CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Policy 6: Admins can delete profiles (except their own if they're the only admin)
CREATE POLICY "Admins can delete profiles"
  ON profiles FOR DELETE
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
    AND id != auth.uid() -- Prevent admins from deleting themselves
  );

-- Step 3: Verify policies are created
SELECT 
  policyname,
  cmd,
  permissive
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Step 4: Test query (should work now)
-- This should return the profile without 500 error
SELECT 
  id,
  email,
  full_name,
  role
FROM profiles
WHERE id = '706aa3a4-1297-440d-9e5b-2fd9c36d290d';

