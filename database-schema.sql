-- Quantor Analytics Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('admin', 'client')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stores table
CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  location TEXT NOT NULL UNIQUE,
  sensor_id TEXT,
  client_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Client-Store assignments (many-to-many)
CREATE TABLE IF NOT EXISTS client_stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, store_id)
);

-- Detections table (already exists, but ensure it has the right structure)
-- CREATE TABLE IF NOT EXISTS detections (
--   id BIGSERIAL PRIMARY KEY,
--   sensor_id TEXT,
--   location TEXT,
--   wifi_rssi INTEGER,
--   devices JSONB[],
--   created_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_stores ENABLE ROW LEVEL SECURITY;

-- Function to check if user is admin (bypasses RLS to avoid recursion)
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role = 'admin'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO anon;

-- Profiles policies
-- IMPORTANT: Use is_admin() function to avoid circular dependency

-- Policy 1: Users can ALWAYS view their own profile (must work first)
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Policy 2: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy 3: Admins can view all profiles (uses function, no recursion)
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Policy 4: Admins can insert profiles
CREATE POLICY "Admins can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

-- Policy 5: Admins can update all profiles
CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Policy 6: Admins can delete profiles (except themselves)
CREATE POLICY "Admins can delete profiles"
  ON profiles FOR DELETE
  USING (
    public.is_admin(auth.uid()) AND id != auth.uid()
  );

-- Stores policies
CREATE POLICY "Everyone can view stores"
  ON stores FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage stores"
  ON stores FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Client-Stores policies
CREATE POLICY "Clients can view their own assignments"
  ON client_stores FOR SELECT
  USING (
    client_id = auth.uid() OR public.is_admin(auth.uid())
  );

CREATE POLICY "Admins can manage all assignments"
  ON client_stores FOR ALL
  USING (public.is_admin(auth.uid()));

-- Detections policies
CREATE POLICY "Clients can view detections for their stores"
  ON detections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM client_stores cs
      JOIN stores s ON s.id = cs.store_id
      WHERE cs.client_id = auth.uid() AND s.location = detections.location
    ) OR public.is_admin(auth.uid())
  );

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NULL),
    COALESCE(NEW.raw_user_meta_data->>'role', 'client')
  )
  ON CONFLICT (id) DO UPDATE
  SET email = NEW.email,
      full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', profiles.full_name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stores_updated_at
  BEFORE UPDATE ON stores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_stores_location ON stores(location);
CREATE INDEX IF NOT EXISTS idx_client_stores_client ON client_stores(client_id);
CREATE INDEX IF NOT EXISTS idx_client_stores_store ON client_stores(store_id);
CREATE INDEX IF NOT EXISTS idx_detections_location ON detections(location);
CREATE INDEX IF NOT EXISTS idx_detections_created_at ON detections(created_at);

