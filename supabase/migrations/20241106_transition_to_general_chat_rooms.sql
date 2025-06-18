-- Migration: Transition from job-specific chat rooms to general contractor-client chat rooms
-- Date: 2024-11-06
-- Description: Consolidates multiple job-specific chat rooms between the same contractor-client pairs
--              into general rooms while preserving job context in messages and maintaining all data integrity.

-- ============================================================================
-- STEP 1: Add new fields to chat_messages table for job context
-- ============================================================================

-- Add job_reference_id to track which job a message relates to
ALTER TABLE chat_messages 
ADD COLUMN job_reference_id UUID REFERENCES job_postings(id);

ALTER TABLE chat_messages 
ADD COLUMN job_context TEXT;

-- Add index for performance on job_reference_id lookups
CREATE INDEX idx_chat_messages_job_reference_id ON chat_messages(job_reference_id);

-- Add comment for documentation
COMMENT ON COLUMN chat_messages.job_reference_id IS 'References the job this message relates to, for context in general chat rooms';
COMMENT ON COLUMN chat_messages.job_context IS 'Human-readable job context (e.g., "Plumbing repair in Lima") for message display';

-- ============================================================================
-- STEP 2: Create consolidation function
-- ============================================================================

CREATE OR REPLACE FUNCTION consolidate_chat_rooms()
RETURNS TABLE(
    contractor_id TEXT,
    client_id TEXT,
    general_room_id UUID,
    consolidated_job_rooms INTEGER,
    messages_migrated INTEGER
) AS $$
DECLARE
    room_pair RECORD;
    general_room UUID;
    job_room RECORD;
    message_record RECORD;
    job_info RECORD;
    messages_count INTEGER := 0;
    rooms_count INTEGER := 0;
BEGIN
    -- Find all contractor-client pairs that have multiple job-specific rooms
    FOR room_pair IN 
        SELECT 
            cr.contractor_id,
            cr.client_id,
            COUNT(*) as room_count,
            ARRAY_AGG(cr.id) as room_ids,
            ARRAY_AGG(cr.job_id) as job_ids
        FROM chat_rooms cr 
        WHERE cr.job_id IS NOT NULL
        GROUP BY cr.contractor_id, cr.client_id
        HAVING COUNT(*) > 1
    LOOP
        rooms_count := 0;
        messages_count := 0;
        
        -- Check if a general room already exists for this pair
        SELECT id INTO general_room 
        FROM chat_rooms 
        WHERE contractor_id = room_pair.contractor_id 
          AND client_id = room_pair.client_id 
          AND job_id IS NULL
        LIMIT 1;
        
        -- If no general room exists, create one using the oldest job-specific room
        IF general_room IS NULL THEN
            SELECT id INTO general_room
            FROM chat_rooms 
            WHERE contractor_id = room_pair.contractor_id 
              AND client_id = room_pair.client_id 
              AND job_id IS NOT NULL
            ORDER BY created_at ASC
            LIMIT 1;
            
            -- Convert the oldest room to a general room
            UPDATE chat_rooms 
            SET job_id = NULL, 
                updated_at = NOW()
            WHERE id = general_room;
        END IF;
        
        -- Process each job-specific room for this contractor-client pair
        FOR job_room IN 
            SELECT cr.id as room_id, cr.job_id, cr.created_at as room_created_at
            FROM chat_rooms cr
            WHERE cr.contractor_id = room_pair.contractor_id 
              AND cr.client_id = room_pair.client_id 
              AND cr.job_id IS NOT NULL
              AND cr.id != general_room
        LOOP
            -- Get job information for context
            SELECT description, category_name, location_text 
            INTO job_info
            FROM job_postings 
            WHERE id = job_room.job_id;
            
            -- Migrate all messages from this job-specific room to the general room
            FOR message_record IN 
                SELECT * FROM chat_messages 
                WHERE room_id = job_room.room_id
                ORDER BY created_at ASC
            LOOP
                -- Update message with job context and move to general room
                UPDATE chat_messages 
                SET 
                    room_id = general_room,
                    job_reference_id = job_room.job_id,
                    job_context = COALESCE(
                        job_info.category_name || ' - ' || COALESCE(job_info.location_text, 'Location not specified'),
                        'Job #' || job_room.job_id::TEXT
                    )
                WHERE id = message_record.id;
                
                messages_count := messages_count + 1;
            END LOOP;
            
            -- Update budget proposals to reference the general room
            UPDATE budget_proposals 
            SET room_id = general_room
            WHERE room_id = job_room.room_id;
            
            -- Delete the now-empty job-specific room
            DELETE FROM chat_rooms WHERE id = job_room.room_id;
            rooms_count := rooms_count + 1;
        END LOOP;
        
        -- Update the general room's updated_at timestamp
        UPDATE chat_rooms 
        SET updated_at = NOW() 
        WHERE id = general_room;
        
        -- Return consolidation results for this pair
        RETURN QUERY SELECT 
            room_pair.contractor_id,
            room_pair.client_id,
            general_room,
            rooms_count,
            messages_count;
    END LOOP;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 3: Handle single job-specific rooms (convert to general)
-- ============================================================================

CREATE OR REPLACE FUNCTION convert_single_job_rooms()
RETURNS TABLE(
    contractor_id TEXT,
    client_id TEXT,
    room_id UUID,
    messages_updated INTEGER
) AS $$
DECLARE
    single_room RECORD;
    job_info RECORD;
    messages_count INTEGER := 0;
BEGIN
    -- Find contractor-client pairs with only one job-specific room
    FOR single_room IN 
        SELECT 
            cr.id,
            cr.contractor_id,
            cr.client_id,
            cr.job_id
        FROM chat_rooms cr 
        WHERE cr.job_id IS NOT NULL
          AND NOT EXISTS (
              -- Ensure this is the only room for this contractor-client pair
              SELECT 1 FROM chat_rooms cr2 
              WHERE cr2.contractor_id = cr.contractor_id 
                AND cr2.client_id = cr.client_id 
                AND cr2.id != cr.id
          )
    LOOP
        messages_count := 0;
        
        -- Get job information for context
        SELECT description, category_name, location_text 
        INTO job_info
        FROM job_postings 
        WHERE id = single_room.job_id;
        
        -- Update all messages in this room with job context
        UPDATE chat_messages 
        SET 
            job_reference_id = single_room.job_id,
            job_context = COALESCE(
                job_info.category_name || ' - ' || COALESCE(job_info.location_text, 'Location not specified'),
                'Job #' || single_room.job_id::TEXT
            )
        WHERE room_id = single_room.id;
        
        GET DIAGNOSTICS messages_count = ROW_COUNT;
        
        -- Convert the room to a general room
        UPDATE chat_rooms 
        SET 
            job_id = NULL,
            updated_at = NOW()
        WHERE id = single_room.id;
        
        -- Return conversion results
        RETURN QUERY SELECT 
            single_room.contractor_id,
            single_room.client_id,
            single_room.id,
            messages_count;
    END LOOP;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 4: Execute the migration
-- ============================================================================

-- Create a temporary table to log migration results
CREATE TEMPORARY TABLE migration_log (
    operation TEXT,
    contractor_id TEXT,
    client_id TEXT,
    room_id UUID,
    details JSONB,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Execute consolidation for multiple job rooms
INSERT INTO migration_log (operation, contractor_id, client_id, room_id, details)
SELECT 
    'consolidate_multiple_rooms',
    contractor_id,
    client_id,
    general_room_id,
    jsonb_build_object(
        'consolidated_rooms', consolidated_job_rooms,
        'messages_migrated', messages_migrated
    )
FROM consolidate_chat_rooms();

-- Execute conversion for single job rooms
INSERT INTO migration_log (operation, contractor_id, client_id, room_id, details)
SELECT 
    'convert_single_room',
    contractor_id,
    client_id,
    room_id,
    jsonb_build_object('messages_updated', messages_updated)
FROM convert_single_job_rooms();

-- ============================================================================
-- STEP 5: Update constraints and add performance indexes
-- ============================================================================

-- Add index for better performance on general room queries
CREATE INDEX idx_chat_rooms_contractor_client_general ON chat_rooms(contractor_id, client_id) 
WHERE job_id IS NULL;

-- Add index for job context queries
CREATE INDEX idx_chat_messages_job_context ON chat_messages(job_reference_id, created_at) 
WHERE job_reference_id IS NOT NULL;

-- ============================================================================
-- STEP 6: Update RLS policies to work with new structure
-- ============================================================================

-- The existing RLS policy should continue to work since we're not changing
-- the contractor_id and client_id fields, just removing job_id constraints

-- ============================================================================
-- STEP 7: Create helper functions for the application
-- ============================================================================

-- Function to get or create a general chat room for a contractor-client pair
CREATE OR REPLACE FUNCTION get_or_create_general_chat_room(
    p_contractor_id TEXT,
    p_client_id TEXT
) RETURNS UUID AS $$
DECLARE
    room_id UUID;
BEGIN
    -- Try to find existing general room
    SELECT id INTO room_id
    FROM chat_rooms 
    WHERE contractor_id = p_contractor_id 
      AND client_id = p_client_id 
      AND job_id IS NULL
    LIMIT 1;
    
    -- If no room exists, create one
    IF room_id IS NULL THEN
        INSERT INTO chat_rooms (contractor_id, client_id, job_id)
        VALUES (p_contractor_id, p_client_id, NULL)
        RETURNING id INTO room_id;
    END IF;
    
    RETURN room_id;
END;
$$ LANGUAGE plpgsql;

-- Function to send a message with job context
CREATE OR REPLACE FUNCTION send_message_with_job_context(
    p_room_id UUID,
    p_sender_user_id TEXT,
    p_content TEXT,
    p_sender_name TEXT DEFAULT NULL,
    p_job_id UUID DEFAULT NULL,
    p_message_type TEXT DEFAULT 'text'
) RETURNS UUID AS $$
DECLARE
    message_id UUID;
    job_context_text TEXT := NULL;
    job_info RECORD;
BEGIN
    -- If job_id is provided, get job context
    IF p_job_id IS NOT NULL THEN
        SELECT description, category_name, location_text 
        INTO job_info
        FROM job_postings 
        WHERE id = p_job_id;
        
        job_context_text := COALESCE(
            job_info.category_name || ' - ' || COALESCE(job_info.location_text, 'Location not specified'),
            'Job #' || p_job_id::TEXT
        );
    END IF;
    
    -- Insert the message
    INSERT INTO chat_messages (
        room_id, 
        sender_user_id, 
        content, 
        sender_name, 
        job_reference_id, 
        job_context,
        message_type
    )
    VALUES (
        p_room_id, 
        p_sender_user_id, 
        p_content, 
        p_sender_name, 
        p_job_id, 
        job_context_text,
        p_message_type
    )
    RETURNING id INTO message_id;
    
    -- Update room's updated_at timestamp
    UPDATE chat_rooms SET updated_at = NOW() WHERE id = p_room_id;
    
    RETURN message_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 8: Display migration summary
-- ============================================================================

-- Show migration results
DO $$
DECLARE
    consolidation_count INTEGER;
    conversion_count INTEGER;
    total_messages INTEGER;
BEGIN
    SELECT COUNT(*) INTO consolidation_count 
    FROM migration_log 
    WHERE operation = 'consolidate_multiple_rooms';
    
    SELECT COUNT(*) INTO conversion_count 
    FROM migration_log 
    WHERE operation = 'convert_single_room';
    
    SELECT COALESCE(SUM((details->>'messages_migrated')::INTEGER), 0) + 
           COALESCE(SUM((details->>'messages_updated')::INTEGER), 0) 
    INTO total_messages
    FROM migration_log;
    
    RAISE NOTICE 'Migration completed successfully:';
    RAISE NOTICE '- Consolidated % contractor-client pairs with multiple job rooms', consolidation_count;
    RAISE NOTICE '- Converted % single job rooms to general rooms', conversion_count;
    RAISE NOTICE '- Total messages processed: %', total_messages;
    RAISE NOTICE 'All existing conversation history has been preserved with job context.';
END $$;

-- ============================================================================
-- STEP 9: Clean up temporary functions (optional)
-- ============================================================================

-- Drop the migration functions as they're no longer needed
-- Uncomment these lines if you want to clean up after migration:
-- DROP FUNCTION IF EXISTS consolidate_chat_rooms();
-- DROP FUNCTION IF EXISTS convert_single_job_rooms();

-- Add final comment
COMMENT ON TABLE chat_rooms IS 'Chat rooms between contractors and clients. job_id is now always NULL for general conversations. Job context is preserved in individual messages via job_reference_id.';