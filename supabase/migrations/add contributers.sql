-- Migration: Add contributors column to projects table
-- Created: 2026-02-11 (Updated)
-- Structure: Array of objects with name and github_link

-- Add contributors column as JSONB to store array of contributor objects
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS contributors JSONB DEFAULT '[{"name": "Saurabh Kumar", "github_link": "https://github.com/saurabhtbj1201"}]'::jsonb;

-- Update existing rows to have default contributor if column is null or empty
UPDATE projects 
SET contributors = '[{"name": "Saurabh Kumar", "github_link": "https://github.com/saurabhtbj1201"}]'::jsonb 
WHERE contributors IS NULL OR contributors = '[]'::jsonb OR contributors = '["Saurabh Kumar"]'::jsonb;

-- Add comment to the column for documentation
COMMENT ON COLUMN projects.contributors IS 'Array of contributor objects with name and github_link stored as JSONB. Example: [{"name": "Saurabh Kumar", "github_link": "https://github.com/saurabhtbj1201"}]';
