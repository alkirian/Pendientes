-- Migration: Add completed_at field to projects table
-- Run this in Supabase SQL Editor

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create index for efficient querying of archived projects
CREATE INDEX IF NOT EXISTS idx_projects_completed_at 
ON projects(completed_at DESC) 
WHERE completed_at IS NOT NULL;
