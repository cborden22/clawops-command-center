-- Part 1: Add installed_at column to location_machines
ALTER TABLE location_machines 
ADD COLUMN installed_at date DEFAULT CURRENT_DATE;

-- Part 2: Create calendar_tasks table for custom calendar events
CREATE TABLE calendar_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  task_date date NOT NULL,
  task_type text DEFAULT 'reminder',
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  created_by_user_id uuid
);

-- Enable RLS
ALTER TABLE calendar_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for calendar_tasks
CREATE POLICY "Users and team members can view calendar tasks"
ON calendar_tasks FOR SELECT
USING (auth.uid() = user_id OR has_team_permission(auth.uid(), user_id, 'locations'::text));

CREATE POLICY "Users and team members can create calendar tasks"
ON calendar_tasks FOR INSERT
WITH CHECK (user_id = get_effective_owner_id(auth.uid()));

CREATE POLICY "Users and team members can update calendar tasks"
ON calendar_tasks FOR UPDATE
USING (auth.uid() = user_id OR has_team_permission(auth.uid(), user_id, 'locations'::text));

CREATE POLICY "Users and team members can delete calendar tasks"
ON calendar_tasks FOR DELETE
USING (auth.uid() = user_id OR has_team_permission(auth.uid(), user_id, 'locations'::text));