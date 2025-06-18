-- Fix Contractor Profiles Database Schema
-- Run this script in the Supabase SQL Editor

-- Create contractor_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS contractor_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    full_name VARCHAR(255),
    bio TEXT,
    skills TEXT[],
    years_experience VARCHAR(20),
    service_areas TEXT[],
    contact_phone VARCHAR(20),
    profile_image_url TEXT,
    work_photos TEXT[],
    work_photo_urls TEXT[],
    role VARCHAR(20) DEFAULT 'contractor',
    onboarding_completed_at TIMESTAMP,
    onboarding_step VARCHAR(50) DEFAULT 'welcome',
    profile_completion_percentage INTEGER DEFAULT 0,
    onboarding_variant VARCHAR(20) DEFAULT 'current',
    credits INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Check and add user_id column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contractor_profiles' AND column_name = 'user_id') THEN
        ALTER TABLE contractor_profiles ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL;
    END IF;
    
    -- Check and add other missing columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contractor_profiles' AND column_name = 'work_photo_urls') THEN
        ALTER TABLE contractor_profiles ADD COLUMN work_photo_urls TEXT[];
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contractor_profiles' AND column_name = 'profile_image_url') THEN
        ALTER TABLE contractor_profiles ADD COLUMN profile_image_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contractor_profiles' AND column_name = 'contact_phone') THEN
        ALTER TABLE contractor_profiles ADD COLUMN contact_phone VARCHAR(20);
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_contractor_profiles_user_id ON contractor_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_contractor_profiles_onboarding_step ON contractor_profiles(onboarding_step);
CREATE INDEX IF NOT EXISTS idx_contractor_profiles_created_at ON contractor_profiles(created_at);

-- Create storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('profile-images', 'profile-images', true),
    ('work-photos', 'work-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on contractor_profiles
ALTER TABLE contractor_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own contractor profile" ON contractor_profiles;
DROP POLICY IF EXISTS "Users can insert their own contractor profile" ON contractor_profiles;
DROP POLICY IF EXISTS "Users can update their own contractor profile" ON contractor_profiles;
DROP POLICY IF EXISTS "Users can delete their own contractor profile" ON contractor_profiles;

-- Create RLS policies for contractor_profiles
CREATE POLICY "Users can view their own contractor profile" ON contractor_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own contractor profile" ON contractor_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contractor profile" ON contractor_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contractor profile" ON contractor_profiles
    FOR DELETE USING (auth.uid() = user_id);

-- Storage policies for profile-images bucket
DROP POLICY IF EXISTS "Users can upload their own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view profile images" ON storage.objects;

CREATE POLICY "Users can upload their own profile images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'profile-images' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view their own profile images" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'profile-images' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can update their own profile images" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'profile-images' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own profile images" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'profile-images' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Public can view profile images" ON storage.objects
    FOR SELECT USING (bucket_id = 'profile-images');

-- Storage policies for work-photos bucket
DROP POLICY IF EXISTS "Users can upload their own work photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own work photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own work photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own work photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view work photos" ON storage.objects;

CREATE POLICY "Users can upload their own work photos" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'work-photos' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view their own work photos" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'work-photos' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can update their own work photos" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'work-photos' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own work photos" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'work-photos' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Public can view work photos" ON storage.objects
    FOR SELECT USING (bucket_id = 'work-photos');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_contractor_profiles_updated_at ON contractor_profiles;
CREATE TRIGGER update_contractor_profiles_updated_at 
    BEFORE UPDATE ON contractor_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON contractor_profiles TO authenticated;
GRANT ALL ON contractor_profiles TO service_role;