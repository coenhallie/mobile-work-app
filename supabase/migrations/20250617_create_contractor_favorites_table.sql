-- Create the contractor_favorites table
CREATE TABLE contractor_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    contractor_id UUID NOT NULL REFERENCES contractor_profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT unique_user_contractor_favorite UNIQUE (user_id, contractor_id)
);

-- Add comments to the table and columns
COMMENT ON TABLE contractor_favorites IS 'Stores user preferences for favorite contractors.';
COMMENT ON COLUMN contractor_favorites.id IS 'Unique identifier for the favorite entry.';
COMMENT ON COLUMN contractor_favorites.user_id IS 'Foreign key to the user who favorited the contractor.';
COMMENT ON COLUMN contractor_favorites.contractor_id IS 'Foreign key to the favorited contractor profile.';
COMMENT ON COLUMN contractor_favorites.created_at IS 'Timestamp of when the favorite was created.';

-- Enable Row Level Security (RLS)
ALTER TABLE contractor_favorites ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only access their own favorites
CREATE POLICY "Allow users to access their own favorites"
ON contractor_favorites
FOR SELECT
USING (auth.uid() = user_id);

-- Authenticated users can insert their own records
CREATE POLICY "Allow authenticated users to insert their own favorites"
ON contractor_favorites
FOR INSERT
WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

-- Authenticated users can update their own records
CREATE POLICY "Allow authenticated users to update their own favorites"
ON contractor_favorites
FOR UPDATE
USING (auth.role() = 'authenticated' AND auth.uid() = user_id)
WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

-- Authenticated users can delete their own records
CREATE POLICY "Allow authenticated users to delete their own favorites"
ON contractor_favorites
FOR DELETE
USING (auth.role() = 'authenticated' AND auth.uid() = user_id);

-- Performance Indexes
-- Index on user_id for efficient user-specific queries
CREATE INDEX idx_contractor_favorites_user_id ON contractor_favorites(user_id);

-- Composite index on (user_id, contractor_id) for lookup operations and to support the unique constraint
CREATE INDEX idx_contractor_favorites_user_contractor_id ON contractor_favorites(user_id, contractor_id);