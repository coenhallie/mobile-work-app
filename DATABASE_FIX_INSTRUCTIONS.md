# Database Schema Fix Instructions

## Critical Issues Found:

1. Missing `contractor_profiles` table with `user_id` column
2. Missing storage buckets and RLS policies
3. Missing translation keys (already exist - false alarm)
4. Missing upload functions in CompleteProfileView

## Step 1: Create contractor_profiles table in Supabase SQL Editor

Run this SQL in your Supabase SQL Editor:

```sql
-- Create contractor_profiles table
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
```

## Step 2: Create indexes

```sql
-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_contractor_profiles_user_id ON contractor_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_contractor_profiles_onboarding_step ON contractor_profiles(onboarding_step);
CREATE INDEX IF NOT EXISTS idx_contractor_profiles_created_at ON contractor_profiles(created_at);
```

## Step 3: Enable RLS and create policies

```sql
-- Enable RLS
ALTER TABLE contractor_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own contractor profile" ON contractor_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own contractor profile" ON contractor_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contractor profile" ON contractor_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contractor profile" ON contractor_profiles
    FOR DELETE USING (auth.uid() = user_id);
```

## Step 4: Create storage buckets

```sql
-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES
    ('profile-images', 'profile-images', true),
    ('work-photos', 'work-photos', true)
ON CONFLICT (id) DO NOTHING;
```

## Step 5: Create storage policies

```sql
-- Profile images policies
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

CREATE POLICY "Public can view profile images" ON storage.objects
    FOR SELECT USING (bucket_id = 'profile-images');

-- Work photos policies
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

CREATE POLICY "Public can view work photos" ON storage.objects
    FOR SELECT USING (bucket_id = 'work-photos');
```

## Step 6: Create updated_at trigger

```sql
-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_contractor_profiles_updated_at
    BEFORE UPDATE ON contractor_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Step 7: Grant permissions

```sql
-- Grant necessary permissions
GRANT ALL ON contractor_profiles TO authenticated;
GRANT ALL ON contractor_profiles TO service_role;
```

After running these SQL commands, the database schema will be fixed and the contractor profile completion should work properly.
