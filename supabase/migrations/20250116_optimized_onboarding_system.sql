-- Optimized Onboarding System Database Migration
-- This migration adds support for the new value-first onboarding flow

-- Add onboarding tracking columns to contractor_profiles
DO $$ 
BEGIN
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

-- Create contractor_credits table for gamification system
CREATE TABLE IF NOT EXISTS contractor_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID REFERENCES contractor_profiles(id) ON DELETE CASCADE,
  credits INTEGER DEFAULT 0,
  earned_from VARCHAR(100),
  earned_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create onboarding_analytics table for tracking user behavior
CREATE TABLE IF NOT EXISTS onboarding_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  session_id VARCHAR(100),
  event_name VARCHAR(100),
  event_data JSONB,
  variant VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create job_views table for tracking job engagement
CREATE TABLE IF NOT EXISTS job_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  user_id UUID,
  session_id VARCHAR(100),
  viewed_at TIMESTAMP DEFAULT NOW(),
  source VARCHAR(50) DEFAULT 'onboarding',
  duration_seconds INTEGER DEFAULT 0
);

-- Add indexes for performance
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_contractor_profiles_onboarding_step') THEN
        CREATE INDEX idx_contractor_profiles_onboarding_step ON contractor_profiles(onboarding_step);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_contractor_profiles_variant') THEN
        CREATE INDEX idx_contractor_profiles_variant ON contractor_profiles(onboarding_variant);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_onboarding_analytics_user_id') THEN
        CREATE INDEX idx_onboarding_analytics_user_id ON onboarding_analytics(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_onboarding_analytics_event_name') THEN
        CREATE INDEX idx_onboarding_analytics_event_name ON onboarding_analytics(event_name);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_onboarding_analytics_created_at') THEN
        CREATE INDEX idx_onboarding_analytics_created_at ON onboarding_analytics(created_at);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_job_views_job_id') THEN
        CREATE INDEX idx_job_views_job_id ON job_views(job_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_job_views_user_id') THEN
        CREATE INDEX idx_job_views_user_id ON job_views(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_job_views_viewed_at') THEN
        CREATE INDEX idx_job_views_viewed_at ON job_views(viewed_at);
    END IF;
END $$;

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
    
    IF profile_record.phone IS NOT NULL AND profile_record.phone != '' THEN
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
    
    IF profile_record.work_photos IS NOT NULL AND array_length(profile_record.work_photos, 1) > 0 THEN
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

-- Create function to award credits
CREATE OR REPLACE FUNCTION award_credits(
    contractor_uuid UUID,
    credit_amount INTEGER,
    source_description VARCHAR(100)
)
RETURNS VOID AS $$
BEGIN
    -- Insert credit record
    INSERT INTO contractor_credits (contractor_id, credits, earned_from)
    VALUES (contractor_uuid, credit_amount, source_description);
    
    -- Update total credits in contractor_profiles
    UPDATE contractor_profiles 
    SET credits = COALESCE(credits, 0) + credit_amount
    WHERE id = contractor_uuid;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS for new tables
ALTER TABLE contractor_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_views ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Contractor credits policies
DROP POLICY IF EXISTS "Contractors can view their own credits" ON contractor_credits;
CREATE POLICY "Contractors can view their own credits" ON contractor_credits
    FOR SELECT USING (
        contractor_id IN (
            SELECT id FROM contractor_profiles 
            WHERE user_id = auth.uid()
        )
    );

-- Onboarding analytics policies (admin only for now)
DROP POLICY IF EXISTS "Service role can manage analytics" ON onboarding_analytics;
CREATE POLICY "Service role can manage analytics" ON onboarding_analytics
    FOR ALL USING (auth.role() = 'service_role');

-- Job views policies
DROP POLICY IF EXISTS "Users can view their own job views" ON job_views;
CREATE POLICY "Users can view their own job views" ON job_views
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own job views" ON job_views;
CREATE POLICY "Users can insert their own job views" ON job_views
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Update existing contractor profiles to have default values
UPDATE contractor_profiles 
SET 
    onboarding_step = 'complete',
    profile_completion_percentage = calculate_profile_completion(id),
    onboarding_completed_at = updated_at
WHERE onboarding_completed_at IS NULL 
AND (full_name IS NOT NULL OR bio IS NOT NULL);