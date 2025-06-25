-- Migration to remove IN_REVIEW status and update existing jobs
-- This migration updates any jobs with 'in_review' status to 'completed' status
-- since the IN_REVIEW status has been removed from the application workflow

-- Update any existing jobs with 'in_review' status to 'completed'
UPDATE job_postings 
SET status = 'completed' 
WHERE status = 'in_review';

-- Add a comment to document the change
COMMENT ON COLUMN job_postings.status IS 'Job status: open, assigned, in_progress, completed, finalized, cancelled. The in_review status was removed in favor of direct completion workflow.';