-- Migration: Fix chat_messages RLS policy to allow both clients and contractors access
-- Date: 2024-11-06
-- Description: Updates the chat_messages RLS policies to check both client_profiles 
--              and contractor_profiles tables, fixing the issue where users
--              cannot see messages due to RLS policy restrictions.

-- Problem: The existing policies may only check one profile table or have incorrect
-- logic that prevents contractors or clients from accessing messages in chat rooms
-- where they are participants.

-- Solution: Create comprehensive RLS policies that check both profile tables and
-- ensure users can access messages in rooms where they are participants.

-- First, let's check what policies currently exist and drop them
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Allow SELECT for room participants" ON chat_messages;
    DROP POLICY IF EXISTS "Allow INSERT for room participants" ON chat_messages;
    DROP POLICY IF EXISTS "Allow UPDATE for room participants" ON chat_messages;
    DROP POLICY IF EXISTS "Users can view messages in their chat rooms" ON chat_messages;
    DROP POLICY IF EXISTS "Users can send messages in their chat rooms" ON chat_messages;
    DROP POLICY IF EXISTS "Users can update their own messages" ON chat_messages;
    
    RAISE NOTICE 'Existing chat_messages policies dropped (if they existed)';
END $$;

-- Enable RLS on chat_messages table
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow SELECT (viewing messages) for room participants
CREATE POLICY "Allow SELECT for room participants" ON chat_messages
FOR SELECT USING (
  -- Check if the user is a participant in the chat room
  EXISTS (
    SELECT 1 FROM chat_rooms 
    WHERE chat_rooms.id = chat_messages.room_id
    AND (
      -- Check if user is a client and is a participant in the chat room
      (EXISTS (SELECT 1 FROM client_profiles WHERE id = auth.uid() AND 
               ((id)::text = chat_rooms.client_id OR (id)::text = chat_rooms.contractor_id)))
      OR
      -- Check if user is a contractor and is a participant in the chat room
      (EXISTS (SELECT 1 FROM contractor_profiles WHERE id = auth.uid() AND 
               ((id)::text = chat_rooms.client_id OR (id)::text = chat_rooms.contractor_id)))
    )
  )
);

-- Policy 2: Allow INSERT (sending messages) for room participants
CREATE POLICY "Allow INSERT for room participants" ON chat_messages
FOR INSERT WITH CHECK (
  -- Check if the user is a participant in the chat room
  EXISTS (
    SELECT 1 FROM chat_rooms 
    WHERE chat_rooms.id = chat_messages.room_id
    AND (
      -- Check if user is a client and is a participant in the chat room
      (EXISTS (SELECT 1 FROM client_profiles WHERE id = auth.uid() AND 
               ((id)::text = chat_rooms.client_id OR (id)::text = chat_rooms.contractor_id)))
      OR
      -- Check if user is a contractor and is a participant in the chat room
      (EXISTS (SELECT 1 FROM contractor_profiles WHERE id = auth.uid() AND 
               ((id)::text = chat_rooms.client_id OR (id)::text = chat_rooms.contractor_id)))
    )
  )
  -- Also ensure the sender_user_id matches the authenticated user
  AND sender_user_id = auth.uid()::text
);

-- Policy 3: Allow UPDATE for message participants (for read receipts, etc.)
CREATE POLICY "Allow UPDATE for room participants" ON chat_messages
FOR UPDATE USING (
  -- Check if the user is a participant in the chat room
  EXISTS (
    SELECT 1 FROM chat_rooms 
    WHERE chat_rooms.id = chat_messages.room_id
    AND (
      -- Check if user is a client and is a participant in the chat room
      (EXISTS (SELECT 1 FROM client_profiles WHERE id = auth.uid() AND 
               ((id)::text = chat_rooms.client_id OR (id)::text = chat_rooms.contractor_id)))
      OR
      -- Check if user is a contractor and is a participant in the chat room
      (EXISTS (SELECT 1 FROM contractor_profiles WHERE id = auth.uid() AND 
               ((id)::text = chat_rooms.client_id OR (id)::text = chat_rooms.contractor_id)))
    )
  )
) WITH CHECK (
  -- Same check for the updated data
  EXISTS (
    SELECT 1 FROM chat_rooms 
    WHERE chat_rooms.id = chat_messages.room_id
    AND (
      -- Check if user is a client and is a participant in the chat room
      (EXISTS (SELECT 1 FROM client_profiles WHERE id = auth.uid() AND 
               ((id)::text = chat_rooms.client_id OR (id)::text = chat_rooms.contractor_id)))
      OR
      -- Check if user is a contractor and is a participant in the chat room
      (EXISTS (SELECT 1 FROM contractor_profiles WHERE id = auth.uid() AND 
               ((id)::text = chat_rooms.client_id OR (id)::text = chat_rooms.contractor_id)))
    )
  )
);

-- Add comments to the policies for documentation
COMMENT ON POLICY "Allow SELECT for room participants" ON chat_messages IS 
'Allows both clients and contractors to view messages in chat rooms where they are participants. 
Checks both client_profiles and contractor_profiles tables to ensure all user types can access their messages.';

COMMENT ON POLICY "Allow INSERT for room participants" ON chat_messages IS 
'Allows both clients and contractors to send messages in chat rooms where they are participants. 
Ensures sender_user_id matches the authenticated user and checks both profile tables.';

COMMENT ON POLICY "Allow UPDATE for room participants" ON chat_messages IS 
'Allows both clients and contractors to update messages (e.g., read receipts) in chat rooms where they are participants. 
Checks both client_profiles and contractor_profiles tables.';

-- Create indexes to optimize the RLS policy queries
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id_sender ON chat_messages(room_id, sender_user_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_participants ON chat_rooms(client_id, contractor_id);

-- Display success message
DO $$
BEGIN
    RAISE NOTICE 'Chat messages RLS policies have been successfully updated!';
    RAISE NOTICE 'Both clients and contractors should now be able to access messages in their chat rooms.';
END $$;