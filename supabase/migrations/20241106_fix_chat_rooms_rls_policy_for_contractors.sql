-- Migration: Fix chat_rooms RLS policy to allow contractors access
-- Date: 2024-11-06
-- Description: Updates the chat_rooms SELECT policy to check both client_profiles 
--              and contractor_profiles tables, fixing the issue where contractors
--              cannot see messages due to RLS policy restrictions.

-- Problem: The existing policy only checks client_profiles table, but contractors
-- exist in the contractor_profiles table. This prevents contractors from accessing
-- chat rooms and therefore seeing any messages.

-- Solution: Update the policy to check both profile tables using OR condition.

-- Drop the existing problematic policy
DROP POLICY IF EXISTS "Allow SELECT for room participants" ON chat_rooms;

-- Create the corrected policy that checks both profile tables
CREATE POLICY "Allow SELECT for room participants" ON chat_rooms
FOR SELECT USING (
  -- Check if user is a client and is a participant in the chat room
  (EXISTS (SELECT 1 FROM client_profiles WHERE id = auth.uid() AND 
           ((id)::text = chat_rooms.client_id OR (id)::text = chat_rooms.contractor_id)))
  OR
  -- Check if user is a contractor and is a participant in the chat room
  (EXISTS (SELECT 1 FROM contractor_profiles WHERE id = auth.uid() AND 
           ((id)::text = chat_rooms.client_id OR (id)::text = chat_rooms.contractor_id)))
);

-- Add a comment to the policy for documentation
COMMENT ON POLICY "Allow SELECT for room participants" ON chat_rooms IS 
'Allows both clients and contractors to view chat rooms where they are participants. 
Checks both client_profiles and contractor_profiles tables to ensure all user types can access their conversations.';