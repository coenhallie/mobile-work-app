-- =====================================================
-- ONBOARDING TESTING DATABASE SETUP SCRIPT
-- =====================================================
-- This script sets up the database schema and test data
-- for the optimized onboarding flow testing
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- =====================================================
-- CORE TABLES FOR ONBOARDING SYSTEM
-- =====================================================

-- Users table (if not exists)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    full_name VARCHAR(255),
    profile_image_url TEXT,
    user_type VARCHAR(20) DEFAULT 'contractor' CHECK (user_type IN ('contractor', 'client')),
    onboarding_completed BOOLEAN DEFAULT FALSE,
    onboarding_step INTEGER DEFAULT 0,
    onboarding_flow_version VARCHAR(10) DEFAULT 'v2', -- v1 = current, v2 = new optimized
    location_district VARCHAR(100),
    location_coordinates POINT,
    location_detection_method VARCHAR(20) CHECK (location_detection_method IN ('gps', 'manual', 'skipped')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Onboarding analytics table
CREATE TABLE IF NOT EXISTS onboarding_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(100) NOT NULL,
    flow_version VARCHAR(10) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB,
    step_number INTEGER,
    time_spent_seconds INTEGER,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_agent TEXT,
    device_type VARCHAR(20),
    screen_size VARCHAR(20)
);

-- Job postings table (enhanced for testing)
CREATE TABLE IF NOT EXISTS job_postings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category_name VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    budget_min DECIMAL(10,2),
    budget_max DECIMAL(10,2),
    budget_type VARCHAR(20) DEFAULT 'fixed' CHECK (budget_type IN ('fixed', 'hourly', 'negotiable')),
    location_text VARCHAR(255),
    location_district VARCHAR(100),
    location_coordinates POINT,
    urgency_level VARCHAR(20) DEFAULT 'normal' CHECK (urgency_level IN ('low', 'normal', 'high', 'urgent')),
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('draft', 'open', 'in_progress', 'completed', 'cancelled')),
    required_skills TEXT[],
    estimated_duration VARCHAR(50),
    images TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- User skills table
CREATE TABLE IF NOT EXISTS user_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    skill_name VARCHAR(100) NOT NULL,
    experience_level VARCHAR(20) DEFAULT 'beginner' CHECK (experience_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
    years_experience INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT FALSE,
    verified BOOLEAN DEFAULT FALSE,
    added_during_onboarding BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Job applications table
CREATE TABLE IF NOT EXISTS job_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES job_postings(id) ON DELETE CASCADE,
    contractor_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
    proposal_text TEXT,
    proposed_budget DECIMAL(10,2),
    estimated_completion_time VARCHAR(50),
    applied_during_onboarding BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(job_id, contractor_id)
);

-- A/B testing assignments table
CREATE TABLE IF NOT EXISTS ab_test_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    test_name VARCHAR(100) NOT NULL,
    variant VARCHAR(50) NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, test_name)
);

-- Onboarding performance metrics
CREATE TABLE IF NOT EXISTS onboarding_performance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    flow_version VARCHAR(10) NOT NULL,
    total_time_seconds INTEGER,
    time_to_first_value_seconds INTEGER, -- Time to see first job
    steps_completed INTEGER,
    total_steps INTEGER,
    completion_rate DECIMAL(5,2),
    drop_off_step INTEGER,
    jobs_viewed INTEGER DEFAULT 0,
    jobs_applied INTEGER DEFAULT 0,
    location_detection_time_seconds INTEGER,
    location_detection_success BOOLEAN,
    profile_completion_percentage DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_onboarding_flow ON users(onboarding_flow_version);
CREATE INDEX IF NOT EXISTS idx_users_location_district ON users(location_district);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Job postings indexes
CREATE INDEX IF NOT EXISTS idx_job_postings_status ON job_postings(status);
CREATE INDEX IF NOT EXISTS idx_job_postings_category ON job_postings(category_name);
CREATE INDEX IF NOT EXISTS idx_job_postings_location ON job_postings(location_district);
CREATE INDEX IF NOT EXISTS idx_job_postings_created_at ON job_postings(created_at);
CREATE INDEX IF NOT EXISTS idx_job_postings_urgency ON job_postings(urgency_level);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_onboarding_analytics_user_id ON onboarding_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_analytics_session ON onboarding_analytics(session_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_analytics_event_type ON onboarding_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_onboarding_analytics_timestamp ON onboarding_analytics(timestamp);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_onboarding_performance_flow_version ON onboarding_performance(flow_version);
CREATE INDEX IF NOT EXISTS idx_onboarding_performance_created_at ON onboarding_performance(created_at);

-- A/B testing indexes
CREATE INDEX IF NOT EXISTS idx_ab_test_assignments_user_test ON ab_test_assignments(user_id, test_name);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_job_postings_updated_at ON job_postings;
CREATE TRIGGER update_job_postings_updated_at 
    BEFORE UPDATE ON job_postings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_job_applications_updated_at ON job_applications;
CREATE TRIGGER update_job_applications_updated_at 
    BEFORE UPDATE ON job_applications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to assign A/B test variant
CREATE OR REPLACE FUNCTION assign_ab_test_variant(
    p_user_id UUID,
    p_test_name VARCHAR(100),
    p_variants TEXT[],
    p_weights INTEGER[] DEFAULT NULL
)
RETURNS VARCHAR(50) AS $$
DECLARE
    v_variant VARCHAR(50);
    v_random_value FLOAT;
    v_cumulative_weight FLOAT := 0;
    v_total_weight INTEGER := 100;
    i INTEGER;
BEGIN
    -- Check if user already has assignment
    SELECT variant INTO v_variant
    FROM ab_test_assignments
    WHERE user_id = p_user_id AND test_name = p_test_name;
    
    IF v_variant IS NOT NULL THEN
        RETURN v_variant;
    END IF;
    
    -- Generate random value
    v_random_value := random() * 100;
    
    -- Use equal weights if not provided
    IF p_weights IS NULL THEN
        v_variant := p_variants[1 + floor(random() * array_length(p_variants, 1))];
    ELSE
        -- Use weighted selection
        FOR i IN 1..array_length(p_variants, 1) LOOP
            v_cumulative_weight := v_cumulative_weight + p_weights[i];
            IF v_random_value <= v_cumulative_weight THEN
                v_variant := p_variants[i];
                EXIT;
            END IF;
        END LOOP;
    END IF;
    
    -- Insert assignment
    INSERT INTO ab_test_assignments (user_id, test_name, variant)
    VALUES (p_user_id, p_test_name, v_variant);
    
    RETURN v_variant;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VIEWS FOR ANALYTICS
-- =====================================================

-- Onboarding funnel analysis view
CREATE OR REPLACE VIEW onboarding_funnel_analysis AS
SELECT 
    flow_version,
    COUNT(*) as total_users,
    COUNT(CASE WHEN onboarding_step >= 1 THEN 1 END) as step_1_users,
    COUNT(CASE WHEN onboarding_step >= 2 THEN 1 END) as step_2_users,
    COUNT(CASE WHEN onboarding_step >= 3 THEN 1 END) as step_3_users,
    COUNT(CASE WHEN onboarding_completed THEN 1 END) as completed_users,
    ROUND(
        COUNT(CASE WHEN onboarding_completed THEN 1 END)::DECIMAL / 
        NULLIF(COUNT(*), 0) * 100, 2
    ) as completion_rate_percentage
FROM users
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY flow_version;

-- Performance comparison view
CREATE OR REPLACE VIEW onboarding_performance_comparison AS
SELECT 
    flow_version,
    COUNT(*) as total_sessions,
    ROUND(AVG(total_time_seconds), 2) as avg_total_time_seconds,
    ROUND(AVG(time_to_first_value_seconds), 2) as avg_time_to_first_value,
    ROUND(AVG(completion_rate), 2) as avg_completion_rate,
    ROUND(AVG(jobs_viewed), 2) as avg_jobs_viewed,
    ROUND(AVG(jobs_applied), 2) as avg_jobs_applied,
    COUNT(CASE WHEN location_detection_success THEN 1 END) as successful_location_detections,
    ROUND(
        COUNT(CASE WHEN location_detection_success THEN 1 END)::DECIMAL / 
        NULLIF(COUNT(*), 0) * 100, 2
    ) as location_success_rate_percentage
FROM onboarding_performance
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY flow_version;

-- =====================================================
-- SAMPLE DATA INSERTION
-- =====================================================

-- Insert sample districts (Peru focus)
INSERT INTO job_postings (
    id, client_id, title, description, category_name, budget_min, budget_max,
    location_text, location_district, urgency_level, status, required_skills
) VALUES 
-- Sample jobs will be inserted by the demo data generator script
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 
 'Sample Job - Will be replaced', 'This is a placeholder', 'plumbing', 100, 200,
 'Sample Location', 'miraflores', 'normal', 'open', ARRAY['plumbing'])
ON CONFLICT (id) DO NOTHING;

-- Insert A/B test configuration for onboarding flow
-- 70% new flow, 30% current flow
SELECT assign_ab_test_variant(
    '00000000-0000-0000-0000-000000000001'::UUID,
    'onboarding_flow_test',
    ARRAY['new_flow', 'current_flow'],
    ARRAY[70, 30]
);

-- =====================================================
-- CLEANUP AND RESET FUNCTIONS
-- =====================================================

-- Function to reset onboarding test data
CREATE OR REPLACE FUNCTION reset_onboarding_test_data()
RETURNS VOID AS $$
BEGIN
    -- Delete test data (keep schema)
    DELETE FROM onboarding_analytics WHERE user_id IN (
        SELECT id FROM users WHERE email LIKE '%test%' OR email LIKE '%demo%'
    );
    DELETE FROM onboarding_performance WHERE user_id IN (
        SELECT id FROM users WHERE email LIKE '%test%' OR email LIKE '%demo%'
    );
    DELETE FROM job_applications WHERE contractor_id IN (
        SELECT id FROM users WHERE email LIKE '%test%' OR email LIKE '%demo%'
    );
    DELETE FROM user_skills WHERE user_id IN (
        SELECT id FROM users WHERE email LIKE '%test%' OR email LIKE '%demo%'
    );
    DELETE FROM ab_test_assignments WHERE user_id IN (
        SELECT id FROM users WHERE email LIKE '%test%' OR email LIKE '%demo%'
    );
    DELETE FROM users WHERE email LIKE '%test%' OR email LIKE '%demo%';
    DELETE FROM job_postings WHERE title LIKE '%TEST%' OR title LIKE '%DEMO%';
    
    RAISE NOTICE 'Test data has been reset successfully';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PERMISSIONS (Adjust based on your setup)
-- =====================================================

-- Grant permissions to authenticated users
-- GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO authenticated;
-- GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '=================================================';
    RAISE NOTICE 'ONBOARDING DATABASE SETUP COMPLETED SUCCESSFULLY';
    RAISE NOTICE '=================================================';
    RAISE NOTICE 'Tables created: users, onboarding_analytics, job_postings, user_skills, job_applications, ab_test_assignments, onboarding_performance';
    RAISE NOTICE 'Views created: onboarding_funnel_analysis, onboarding_performance_comparison';
    RAISE NOTICE 'Functions created: assign_ab_test_variant, reset_onboarding_test_data';
    RAISE NOTICE 'Next step: Run generate-onboarding-test-data.js to populate with demo data';
    RAISE NOTICE '=================================================';
END $$;