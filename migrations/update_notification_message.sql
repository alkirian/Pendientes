-- Migration: Update notification function to include project name
-- Run this in Supabase SQL Editor

-- Drop the existing function and recreate with project name lookup
CREATE OR REPLACE FUNCTION notify_on_project_assignment()
RETURNS TRIGGER AS $$
DECLARE
  project_name TEXT;
  project_client TEXT;
  assigner_name TEXT;
BEGIN
  -- Get project details
  SELECT p.name, p.client INTO project_name, project_client
  FROM projects p
  WHERE p.id = NEW.project_id;
  
  -- Get who made the assignment (optional - depends on your auth setup)
  -- For now we'll just use generic message with project info
  
  -- Create notification with specific project info
  INSERT INTO notifications (user_id, type, title, message, link)
  VALUES (
    NEW.user_id,
    'project_assigned',
    '📋 Asignado a: ' || COALESCE(project_name, 'Nuevo proyecto'),
    CASE 
      WHEN project_client IS NOT NULL AND project_client != '' 
        THEN 'Te han asignado al proyecto "' || project_name || '" del cliente ' || project_client
      ELSE 'Te han asignado al proyecto "' || project_name || '"'
    END,
    '/projects/' || NEW.project_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- The trigger already exists, so it will automatically use the updated function
