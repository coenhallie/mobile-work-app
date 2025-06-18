-- Fix Contractor Profiles Schema Issues
-- This migration creates the missing contractor_profiles table and fixes all related issues

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create contractor_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS contractor_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contractor_profiles' AND column_name = 'onboarding_completed_at') THEN
        ALTER TABLE contractor_profiles ADD COLUMN onboarding_completed_at TIMESTAMP;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contractor_profiles' AND column_name = 'onboarding_step') THEN
        ALTER TABLE contractor_profiles ADD COLUMN onboarding_step VARCHAR(50) DEFAULT 'welcome';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contractor_profiles' AND column_name = 'profile_completion_percentage') THEN
        ALTER TABLE contractor_profiles ADD COLUMN profile_completion_percentage INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contractor_profiles' AND column_name = 'onboarding_variant') THEN
        ALTER TABLE contractor_profiles ADD COLUMN onboarding_variant VARCHAR(20) DEFAULT 'current';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contractor_profiles' AND column_name = 'credits') THEN
        ALTER TABLE contractor_profiles ADD COLUMN credits INTEGER DEFAULT 0;
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_contractor_profiles_user_id ON contractor_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_contractor_profiles_onboarding_step ON contractor_profiles(onboarding_step);
CREATE INDEX IF NOT EXISTS idx_contractor_profiles_variant ON contractor_profiles(onboarding_variant);
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

-- Create function to calculate profile completion percentage
CREATE OR REPLACE FUNCTION calculate_profile_completion(profile_id UUID)
RETURNS INTEGER AS $$
DECLARE
    completion_score INTEGER := 0;
    profile_record RECORD;
BEGIN
    SELECT * INTO profile_record 
    FROM contractor_profiles 
    WHERE id = profile_id;
    
    IF profile_record IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Basic info (40 points)
    IF profile_record.full_name IS NOT NULL AND profile_record.full_name != '' THEN
        completion_score := completion_score + 10;
    END IF;
    
    IF profile_record.contact_phone IS NOT NULL AND profile_record.contact_phone != '' THEN
        completion_score := completion_score + 10;
    END IF;
    
    IF profile_record.skills IS NOT NULL AND array_length(profile_record.skills, 1) > 0 THEN
        completion_score := completion_score + 10;
    END IF;
    
    IF profile_record.service_areas IS NOT NULL AND array_length(profile_record.service_areas, 1) > 0 THEN
        completion_score := completion_score + 10;
    END IF;
    
    -- Professional details (30 points)
    IF profile_record.bio IS NOT NULL AND length(profile_record.bio) >= 50 THEN
        completion_score := completion_score + 15;
    END IF;
    
    IF profile_record.years_experience IS NOT NULL AND profile_record.years_experience != '' THEN
        completion_score := completion_score + 15;
    END IF;
    
    -- Enhanced profile (30 points)
    IF profile_record.profile_image_url IS NOT NULL AND profile_record.profile_image_url != '' THEN
        completion_score := completion_score + 15;
    END IF;
    
    IF profile_record.work_photo_urls IS NOT NULL AND array_length(profile_record.work_photo_urls, 1) > 0 THEN
        completion_score := completion_score + 15;
    END IF;
    
    RETURN completion_score;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update profile completion percentage
CREATE OR REPLACE FUNCTION update_profile_completion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.profile_completion_percentage := calculate_profile_completion(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_update_profile_completion ON contractor_profiles;
CREATE TRIGGER trigger_update_profile_completion
    BEFORE UPDATE ON contractor_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_profile_completion();

-- Grant necessary permissions
GRANT ALL ON contractor_profiles TO authenticated;
GRANT ALL ON contractor_profiles TO service_role;

-- Create a view for public contractor profiles (for browsing)
CREATE OR REPLACE VIEW public_contractor_profiles AS
SELECT 
    id,
    full_name,
    bio,
    skills,
    years_experience,
    service_areas,
    profile_image_url,
    work_photo_urls,
    profile_completion_percentage,
    created_at
FROM contractor_profiles
WHERE profile_completion_percentage >= 50; -- Only show reasonably complete profiles

-- Grant access to the view
GRANT SELECT ON public_contractor_profiles TO authenticated;
GRANT SELECT ON public_contractor_profiles TO anon;

-- Add some helpful comments
COMMENT ON TABLE contractor_profiles IS 'Contractor profile information linked to auth.users';
COMMENT ON COLUMN contractor_profiles.user_id IS 'Foreign key to auth.users.id';
COMMENT ON COLUMN contractor_profiles.profile_completion_percentage IS 'Automatically calculated completion percentage';
COMMENT ON COLUMN contractor_profiles.work_photo_urls IS 'Array of URLs to work photos in storage';