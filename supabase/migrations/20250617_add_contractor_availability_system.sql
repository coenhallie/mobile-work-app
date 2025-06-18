-- Add Contractor Availability System
-- This migration adds availability tracking fields and functionality to contractor_profiles

-- Add availability fields to contractor_profiles table
DO $$ 
BEGIN
    -- Add availability status field
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contractor_profiles' AND column_name = 'availability_status') THEN
        ALTER TABLE contractor_profiles ADD COLUMN availability_status VARCHAR(20) DEFAULT 'available';
    END IF;
    
    -- Add availability message field for custom status messages
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contractor_profiles' AND column_name = 'availability_message') THEN
        ALTER TABLE contractor_profiles ADD COLUMN availability_message TEXT;
    END IF;
    
    -- Add last availability update timestamp
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contractor_profiles' AND column_name = 'availability_updated_at') THEN
        ALTER TABLE contractor_profiles ADD COLUMN availability_updated_at TIMESTAMPTZ DEFAULT now();
    END IF;
    
    -- Add working hours field (JSON format for flexible scheduling)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contractor_profiles' AND column_name = 'working_hours') THEN
        ALTER TABLE contractor_profiles ADD COLUMN working_hours JSONB DEFAULT '{"monday": {"start": "08:00", "end": "18:00", "enabled": true}, "tuesday": {"start": "08:00", "end": "18:00", "enabled": true}, "wednesday": {"start": "08:00", "end": "18:00", "enabled": true}, "thursday": {"start": "08:00", "end": "18:00", "enabled": true}, "friday": {"start": "08:00", "end": "18:00", "enabled": true}, "saturday": {"start": "09:00", "end": "17:00", "enabled": true}, "sunday": {"start": "09:00", "end": "17:00", "enabled": false}}'::jsonb;
    END IF;
    
    -- Add busy until timestamp for temporary unavailability
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contractor_profiles' AND column_name = 'busy_until') THEN
        ALTER TABLE contractor_profiles ADD COLUMN busy_until TIMESTAMPTZ;
    END IF;
    
    -- Add auto availability toggle (automatically set to unavailable when busy)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contractor_profiles' AND column_name = 'auto_availability') THEN
        ALTER TABLE contractor_profiles ADD COLUMN auto_availability BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_contractor_profiles_availability_status ON contractor_profiles(availability_status);
CREATE INDEX IF NOT EXISTS idx_contractor_profiles_availability_updated_at ON contractor_profiles(availability_updated_at);
CREATE INDEX IF NOT EXISTS idx_contractor_profiles_busy_until ON contractor_profiles(busy_until);

-- Add constraint to ensure availability_status has valid values
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contractor_profiles_availability_status_check') THEN
        ALTER TABLE contractor_profiles ADD CONSTRAINT contractor_profiles_availability_status_check 
        CHECK (availability_status IN ('available', 'busy', 'offline', 'away'));
    END IF;
END $$;

-- Create function to automatically update availability based on busy_until
CREATE OR REPLACE FUNCTION update_contractor_availability()
RETURNS TRIGGER AS $$
BEGIN
    -- If busy_until is set and auto_availability is enabled
    IF NEW.busy_until IS NOT NULL AND NEW.auto_availability = true THEN
        -- If busy_until is in the future, set status to busy
        IF NEW.busy_until > now() THEN
            NEW.availability_status = 'busy';
        -- If busy_until is in the past, set status to available
        ELSIF NEW.busy_until <= now() AND OLD.availability_status = 'busy' THEN
            NEW.availability_status = 'available';
            NEW.busy_until = NULL;
        END IF;
    END IF;
    
    -- Update availability_updated_at timestamp when availability_status changes
    IF OLD.availability_status IS DISTINCT FROM NEW.availability_status THEN
        NEW.availability_updated_at = now();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic availability updates
DROP TRIGGER IF EXISTS trigger_update_contractor_availability ON contractor_profiles;
CREATE TRIGGER trigger_update_contractor_availability
    BEFORE UPDATE ON contractor_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_contractor_availability();

-- Create function to check if contractor is currently available based on working hours
CREATE OR REPLACE FUNCTION is_contractor_available_now(contractor_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    contractor_record contractor_profiles%ROWTYPE;
    current_day TEXT;
    current_time TIME;
    day_schedule JSONB;
BEGIN
    -- Get contractor record
    SELECT * INTO contractor_record
    FROM contractor_profiles
    WHERE id = contractor_id;
    
    -- If contractor not found, return false
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    -- Check basic availability status
    IF contractor_record.availability_status != 'available' THEN
        RETURN false;
    END IF;
    
    -- Check if busy_until is set and still in effect
    IF contractor_record.busy_until IS NOT NULL AND contractor_record.busy_until > now() THEN
        RETURN false;
    END IF;
    
    -- Check working hours if they exist
    IF contractor_record.working_hours IS NOT NULL THEN
        current_day = lower(to_char(now(), 'Day'));
        current_day = trim(current_day);
        current_time = now()::TIME;
        
        -- Get schedule for current day
        day_schedule = contractor_record.working_hours -> current_day;
        
        -- If day is not enabled, return false
        IF (day_schedule ->> 'enabled')::BOOLEAN = false THEN
            RETURN false;
        END IF;
        
        -- Check if current time is within working hours
        IF current_time < (day_schedule ->> 'start')::TIME OR 
           current_time > (day_schedule ->> 'end')::TIME THEN
            RETURN false;
        END IF;
    END IF;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Update existing contractor profiles to have default availability
UPDATE contractor_profiles
SET 
    availability_status = 'available',
    availability_updated_at = now()
WHERE availability_status IS NULL;

-- Create a view for available contractors (for easy querying)
CREATE OR REPLACE VIEW available_contractors AS
SELECT 
    cp.*,
    is_contractor_available_now(cp.id) as is_currently_available
FROM contractor_profiles cp
WHERE cp.availability_status = 'available'
   OR (cp.availability_status = 'busy' AND cp.busy_until <= now());

-- Grant permissions
GRANT SELECT ON available_contractors TO authenticated;
GRANT SELECT ON available_contractors TO anon;

-- Add helpful comments
COMMENT ON COLUMN contractor_profiles.availability_status IS 'Current availability status: available, busy, offline, away';
COMMENT ON COLUMN contractor_profiles.availability_message IS 'Custom message explaining current availability status';
COMMENT ON COLUMN contractor_profiles.working_hours IS 'JSON object defining working hours for each day of the week';
COMMENT ON COLUMN contractor_profiles.busy_until IS 'Timestamp until when the contractor is busy (auto-clears when passed)';
COMMENT ON COLUMN contractor_profiles.auto_availability IS 'Whether to automatically manage availability based on busy_until';
COMMENT ON FUNCTION is_contractor_available_now(UUID) IS 'Checks if contractor is currently available considering status, busy_until, and working hours';